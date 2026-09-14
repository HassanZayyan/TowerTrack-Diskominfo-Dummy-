#!/usr/bin/env python3
"""
Convert public/images/*.png to WebP inside a byte budget.

WHY THIS EXISTS.

public/images/ shipped 2.7MB of raw PNG: a 588KB regency crest that is never
drawn larger than 80 CSS pixels, and two illustrations totalling 2.1MB that are
cropped into a 676x288 box. The crest alone was heavier than the entire
JavaScript bundle for the page that renders it.

The redesign budget for the procedural landing visuals is taken from here: the
new hero costs roughly 20KB of code plus a 31KB boundary polygon, which is paid
for several times over by this conversion. That is the whole reason it is a
prerequisite and not a nice-to-have.

WHY A SCRIPT RATHER THAN A ONE-OFF.

So the numbers in docs/REDESIGN_PLAN.md can be reproduced, and so the next
person to add an illustration has an obvious place to add it. It uses Pillow,
which the toolchain already has, rather than adding sharp or vite-imagetools to
package.json for three files that change once a year.

USAGE
    python scripts/optimize-images.py          # convert, keep originals
    python scripts/optimize-images.py --prune  # convert and delete the PNGs

The originals are committed, so --prune is recoverable with
    git checkout HEAD -- public/images/
"""

import argparse
import pathlib
import sys

try:
    from PIL import Image
except ImportError:
    sys.exit("Pillow is required:  pip install Pillow")

ROOT = pathlib.Path(__file__).resolve().parent.parent
IMAGES = ROOT / "public" / "images"

# (source, max width, byte budget, note)
#
# Width is 2x the largest CSS size the asset is ever drawn at, which is the
# point past which more pixels are invisible on any display. The crest reaches
# 80px in MyMessages/Index.tsx and 24-64px everywhere else.
#
# Only the crest is left. The two hero illustrations this script originally
# converted are gone outright: /data-tower and /data-fo draw their hero art as
# inline SVG now (Components/HeroIsoArt.tsx), so there is no raster left to
# optimise. Add an entry here if a real illustration ever arrives.
TARGETS = [
    ("kab-smg-logo.png", 320, 30_000, "regency crest, drawn at 24-80px"),
]


def convert(src: pathlib.Path, max_width: int, budget: int) -> tuple[pathlib.Path, int, int]:
    im = Image.open(src)
    original_size = src.stat().st_size

    if im.width > max_width:
        height = round(im.height * max_width / im.width)
        im = im.resize((max_width, height), Image.LANCZOS)

    # Keep the alpha channel: the crest is transparent and sits on white,
    # muted and maroon grounds in different places.
    if im.mode not in ("RGBA", "RGB"):
        im = im.convert("RGBA")

    dst = src.with_suffix(".webp")

    # Walk quality down until the budget is met. Starting high and stepping by 5
    # keeps the crest's thin outlines clean; the illustrations settle in the 70s.
    for quality in range(92, 44, -5):
        im.save(dst, "WEBP", quality=quality, method=6)
        if dst.stat().st_size <= budget:
            return dst, dst.stat().st_size, quality

    return dst, dst.stat().st_size, quality


def build_icons(source: pathlib.Path) -> None:
    """
    Regenerate favicon.ico and the home-screen icon from the regency crest.

    public/favicon.ico shipped as a 0-byte file, so every page served an empty
    icon and every browser fell back to a generic one.

    Only 16/32/48 go into the .ico: those are the frames a browser actually
    pulls from one. Including 128 and 256 as well produced an 82KB icon, most of
    it frames nothing requests.

    The home-screen icon has to be PNG — Safari ignores WebP there — so it is
    quantised to a 256-colour palette instead, which a flat crest survives
    without visible loss.
    """
    im = Image.open(source).convert("RGBA")

    # Square canvas: an .ico frame is square, and a non-square source pasted
    # into one is stretched rather than letterboxed.
    side = max(im.size)
    canvas = Image.new("RGBA", (side, side), (0, 0, 0, 0))
    canvas.paste(im, ((side - im.width) // 2, (side - im.height) // 2), im)

    ico = ROOT / "public" / "favicon.ico"
    canvas.save(ico, sizes=[(16, 16), (32, 32), (48, 48)])
    print(f"  ok     favicon.ico            {ico.stat().st_size / 1024:7.1f}KB  (16/32/48)")

    touch = IMAGES / "apple-touch-icon.png"
    canvas.resize((180, 180), Image.LANCZOS).convert("RGB").quantize(
        colors=256, method=Image.MEDIANCUT
    ).save(touch, optimize=True)
    print(f"  ok     apple-touch-icon.png   {touch.stat().st_size / 1024:7.1f}KB  (180px)")


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--prune", action="store_true", help="delete the source PNGs afterwards")
    parser.add_argument(
        "--icons",
        metavar="SOURCE_PNG",
        help="also rebuild favicon.ico and apple-touch-icon.png from this crest image",
    )
    args = parser.parse_args()

    if not IMAGES.is_dir():
        sys.exit(f"not found: {IMAGES}")

    total_before = total_after = 0
    failures = []

    for name, max_width, budget, note in TARGETS:
        src = IMAGES / name
        if not src.exists():
            print(f"  skip   {name} (already converted?)")
            continue

        before = src.stat().st_size
        dst, after, quality = convert(src, max_width, budget)
        total_before += before
        total_after += after

        verdict = "ok " if after <= budget else "OVER"
        if after > budget:
            failures.append(name)
        print(
            f"  {verdict}   {name:22} {before / 1024:8.1f}KB -> "
            f"{dst.name:24} {after / 1024:7.1f}KB  q{quality}  ({note})"
        )

        if args.prune:
            src.unlink()

    if total_before:
        print(
            f"\n  total   {total_before / 1024:.1f}KB -> {total_after / 1024:.1f}KB "
            f"({100 - total_after * 100 / total_before:.1f}% smaller)"
        )

    if args.icons:
        source = pathlib.Path(args.icons)
        if not source.is_absolute():
            source = ROOT / source
        if source.exists():
            build_icons(source)
        else:
            print(f"  skip   icons: {source} not found")

    remaining = sum(p.stat().st_size for p in IMAGES.glob("*") if p.is_file())
    print(f"  public/images/ now {remaining / 1024:.1f}KB")

    if failures:
        print(f"\n  OVER BUDGET: {', '.join(failures)}")
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
