import { useEffect, useState } from 'react';
import RegencyModel, { type ShowcasePoint } from './RegencyModel';
import { cn } from '@/lib/utils';

/**
 * The right half of every auth screen: the regency crest, the name of the
 * office, and a turning model of the area it administers.
 *
 * WHY THE PANEL EXISTS AT ALL.
 *
 * The auth screens were a form on an empty canvas with a crest above it, and
 * the crest was the only thing on the page that said whose system this was.
 * Splitting the screen gives the identity a side of its own, which does three
 * things at once: it names the office without crowding the form, it fills the
 * width a 448px form column wastes on a desktop monitor, and it tells a reader
 * who arrived from a search result what they are about to sign in to.
 *
 * WHY THE MODEL IS DATA AND NOT A STOCK ILLUSTRATION.
 *
 * Every mast on the slab is a row in the register. A reader who signs in and
 * opens /data-tower sees the same towers on a real map. Stock art would have
 * been a smaller change and would have said nothing.
 */

export interface ShowcaseData {
    points: ShowcasePoint[];
    total: number;
}

interface AuthShowcaseProps {
    data?: ShowcaseData;
    className?: string;
}

/**
 * Is the viewport wide enough for this panel to be on screen at all?
 *
 * The panel is `hidden lg:block`, but "hidden" only stops it being PAINTED.
 * Without this gate a phone still mounts the canvas, still fetches the 31KB
 * boundary and still runs a ResizeObserver, all for an element nobody can see.
 * 1024px is Tailwind's `lg`, and the two have to agree.
 */
function useIsDesktop(): boolean {
    const [isDesktop, setIsDesktop] = useState(() =>
        typeof window === 'undefined' ? false : window.matchMedia('(min-width: 1024px)').matches,
    );

    useEffect(() => {
        const mq = window.matchMedia('(min-width: 1024px)');
        const onChange = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
        mq.addEventListener('change', onChange);
        setIsDesktop(mq.matches);
        return () => mq.removeEventListener('change', onChange);
    }, []);

    return isDesktop;
}

export default function AuthShowcase({ data, className }: AuthShowcaseProps) {
    const isDesktop = useIsDesktop();
    const points = data?.points ?? [];
    const total = data?.total ?? 0;

    return (
        <aside
            className={cn('relative isolate overflow-hidden', className)}
            style={{
                /*
                 * Deep maroon in BOTH themes, which is why it is built from the
                 * `--brand-*` and `--ink-*` ramps rather than from `--card` or
                 * `--canvas`. The semantic surface tokens invert under `.dark`;
                 * this panel must not, or the light slab that is drawn on it
                 * would end up on a light ground.
                 */
                backgroundImage: [
                    'radial-gradient(100% 70% at 75% 0%, hsl(var(--brand-700) / 0.55) 0%, transparent 62%)',
                    'linear-gradient(158deg, hsl(var(--brand-900)) 0%, hsl(var(--brand-950)) 55%, hsl(var(--ink-950)) 100%)',
                ].join(', '),
            }}
        >
            {/* A single hairline of light down the seam, so the two halves read
                as a split rather than as a panel dropped onto the page. */}
            <div
                aria-hidden="true"
                className="absolute inset-y-0 left-0 w-px"
                style={{ background: 'hsl(var(--brand-400) / 0.35)' }}
            />

            <div className="relative flex h-full flex-col gap-6 px-10 py-9 xl:px-14 xl:py-11">
                <header className="tt-enter-up flex items-center gap-4">
                    {/*
                     * The crest sits on a light plate. It is a full-colour
                     * emblem with dark outlines drawn for paper, and on a deep
                     * maroon ground its own outlines disappear into the
                     * background — the plate is what keeps it legible, and it
                     * reads as a seal rather than as a patch.
                     */}
                    <div className="shrink-0 rounded-xl bg-ink-50 p-2 shadow-lg">
                        <img
                            src="/images/kab-smg-logo.webp"
                            alt="Lambang Kabupaten Semarang"
                            width={48}
                            height={48}
                            className="h-11 w-11 object-contain xl:h-12 xl:w-12"
                        />
                    </div>
                    <div className="leading-tight">
                        <p className="text-sm font-medium text-brand-200">
                            Sistem Monitoring Infrastruktur
                        </p>
                        <p className="text-xl font-semibold tracking-tight text-ink-50 xl:text-2xl">
                            Kabupaten Semarang
                        </p>
                    </div>
                </header>

                {/* min-h-0 is load-bearing: a flex child defaults to min-height
                    auto, which lets the canvas push the panel taller than the
                    viewport and undo the whole point of a one-screen layout. */}
                <div className="tt-enter-scale min-h-0 flex-1" style={{ '--tt-delay': '90ms' } as React.CSSProperties}>
                    {isDesktop && <RegencyModel points={points} />}
                </div>

                <footer
                    className="tt-enter-up space-y-3"
                    style={{ '--tt-delay': '180ms' } as React.CSSProperties}
                >
                    <p className="max-w-sm text-sm leading-relaxed text-brand-200">
                        Sebaran menara telekomunikasi dan jaringan fiber optik di seluruh
                        wilayah Kabupaten Semarang, dalam satu peta.
                    </p>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                        {total > 0 && (
                            <span
                                className="rounded-full px-3 py-1 text-xs font-semibold text-ink-50"
                                style={{ background: 'hsl(var(--brand-700) / 0.65)' }}
                            >
                                {total.toLocaleString('id-ID')} menara terdata
                            </span>
                        )}
                        {/* The exaggeration is declared, here and on the landing
                            page. An undeclared one is a lie told with a chart:
                            a reader is entitled to know that the masts are not
                            to scale with the ground they stand on.

                            Conditional, because the password-reset screens send
                            no positions and draw a regency with nothing standing
                            on it. A note about mast heights under an empty slab
                            describes something that is not there. */}
                        {points.length > 0 && (
                            <span className="text-xs text-brand-300">
                                Tinggi batang dilebihkan agar terbaca
                            </span>
                        )}
                    </div>
                </footer>
            </div>
        </aside>
    );
}
