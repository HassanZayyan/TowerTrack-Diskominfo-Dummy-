import React from 'react';
import { Link } from '@inertiajs/react';
import { Button } from '@/Components/ui/button';
import HeroDotMap from '@/Components/Landing/HeroDotMap';
import type { TowerPoint } from '@/lib/geo';

/**
 * The hero.
 *
 * NO COLOURED BAND, FOR THE REASON ALREADY WRITTEN DOWN.
 *
 * `HeroSection.tsx` carries a long note about why this application's heroes sit
 * on the page's own ground: every attempt at giving the band a ground of its
 * own — a red gradient, then a photo under a brand scrim — left a visible seam
 * where the band met the page, and that seam is not a colour-matching problem
 * you can solve by choosing a better red. This hero is bigger and more
 * elaborate than that one, and the finding still holds. One surface, dark type.
 *
 * WHAT REPLACES THE ILLUSTRATION.
 *
 * The other public heroes put a stock illustration in the right-hand column.
 * Here that column is the real map, drawn from the real towers. It costs about
 * 8KB of code against the 773KB PNG it stands in for, and unlike the PNG it
 * says something true that changes when the data changes.
 *
 * THE REVEAL RUNS ONCE, ON MOUNT, AND IN CSS.
 *
 * Not on scroll, and not through Motion. Motion writes its `initial` state as
 * an inline style and needs an animation frame to move off it, so anywhere rAF
 * never runs — a crawler, a headless capture, a tab opened in the background —
 * the headline would sit at `opacity: 0`. The `tt-enter-*` keyframes have no
 * such dependency and the reduced-motion block in app.css already collapses
 * them. The stagger is just a per-element `--tt-delay`.
 */

interface LandingHeroProps {
    points: TowerPoint[];
    owners: string[];
    totalTowers: number;
    kecamatanCount: number;
}

const LandingHero: React.FC<LandingHeroProps> = ({
    points,
    owners,
    totalTowers,
    kecamatanCount,
}) => {
    return (
        <section className="relative overflow-hidden border-b border-border bg-canvas">
            {/* The regency's own dot device, read out of the PPID stylesheet as
                radial-gradient(#d5d5d5 1px, transparent 1px). Masked so it never
                reaches the type. */}
            <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 opacity-60"
                style={{
                    backgroundImage: 'radial-gradient(hsl(var(--border-strong)) 1px, transparent 1px)',
                    backgroundSize: '18px 18px',
                    maskImage: 'radial-gradient(120% 85% at 72% 22%, rgb(0 0 0 / 0.55), transparent 70%)',
                    WebkitMaskImage:
                        'radial-gradient(120% 85% at 72% 22%, rgb(0 0 0 / 0.55), transparent 70%)',
                }}
            />

            <div className="relative mx-auto w-full max-w-screen-2xl px-4 py-14 sm:px-6 sm:py-20 lg:px-10 lg:py-24">
                <div className="flex flex-col gap-12 lg:flex-row lg:items-center lg:gap-14">
                    <div className="min-w-0 lg:max-w-xl">
                        <p className="tt-enter-up">
                            <span className="inline-flex items-center rounded-full border border-primary-border bg-primary-soft px-3 py-1 text-xs font-medium tracking-wide text-primary-strong">
                                Kabupaten Semarang
                            </span>
                        </p>

                        <h1
                            className="tt-enter-up mt-4 text-balance text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl"
                            style={{ '--tt-delay': '80ms' } as React.CSSProperties}
                        >
                            Setiap menara di Kabupaten Semarang, dalam satu peta
                        </h1>

                        <p
                            className="tt-enter-up mt-4 max-w-xl text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg"
                            style={{ '--tt-delay': '160ms' } as React.CSSProperties}
                        >
                            TowerTrack memetakan menara telekomunikasi dan jalur fiber optic di seluruh
                            kabupaten — pemilik, tinggi, jangkauan, dan status perizinannya. Terbuka untuk
                            dilihat siapa saja, dan terbuka untuk dikoreksi.
                        </p>

                        <div
                            className="tt-enter-up mt-7 flex flex-col gap-3 sm:flex-row"
                            style={{ '--tt-delay': '240ms' } as React.CSSProperties}
                        >
                            <Button asChild size="lg">
                                <Link href="/data-tower">Jelajahi peta menara</Link>
                            </Button>
                            <Button asChild size="lg" variant="outline">
                                <Link href="/complaint">Laporkan gangguan</Link>
                            </Button>
                        </div>

                        <p
                            className="tt-enter-up mt-6 text-sm text-muted-foreground"
                            style={{ '--tt-delay': '320ms' } as React.CSSProperties}
                        >
                            <strong className="font-semibold tabular-nums text-foreground">
                                {totalTowers.toLocaleString('id-ID')}
                            </strong>{' '}
                            menara terdata di{' '}
                            <strong className="font-semibold tabular-nums text-foreground">
                                {kecamatanCount}
                            </strong>{' '}
                            kecamatan.
                        </p>
                    </div>

                    {/* Capped, and centred in whatever is left over.
                        The drawing's aspect follows the regency, which is close
                        to square, so a column that simply took `flex-1` of a
                        1456px row came out about 820px wide and therefore about
                        730px tall — half again the height of the text beside
                        it, which left the headline stranded at the top of a very
                        tall band. At 30rem the map lands near the text's own
                        height and the two columns read as a pair. */}
                    <div className="flex min-w-0 flex-1 justify-center lg:justify-end">
                        <HeroDotMap
                            points={points}
                            owners={owners}
                            className="w-full max-w-[30rem] lg:max-w-[32rem]"
                        />
                    </div>
                </div>
            </div>
        </section>
    );
};

export default LandingHero;
