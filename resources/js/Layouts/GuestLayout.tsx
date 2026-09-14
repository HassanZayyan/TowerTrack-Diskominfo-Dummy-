import { PropsWithChildren } from 'react';
import AuthShowcase, { type ShowcaseData } from '@/Components/Auth/AuthShowcase';

interface GuestProps extends PropsWithChildren {
    title?: string;
    subtitle?: string;
    /**
     * Tower positions for the panel's model, from App\Support\TowerShowcase.
     * Optional: the pages that do not send it (password reset, verification)
     * get the regency with no masts on it, which is still the right shape.
     */
    showcase?: ShowcaseData;
}

/**
 * Auth shell: the form on the left, the office and its regency on the right.
 *
 * WHAT CHANGED AND WHY.
 *
 * It was a centred 448px card on an empty canvas, with the crest stacked above
 * it. On a laptop that left two thirds of the screen doing nothing, and the
 * stacked crest pushed the form down far enough that /register ran past the
 * fold — a reader had to scroll to reach a button on a five-field form.
 *
 * The split fixes both. The identity moves to a panel of its own where it has
 * room, the form gets the left column to itself, and the vertical budget the
 * crest was spending is returned to the fields.
 *
 * THE ONE-SCREEN RULE, AND ITS ESCAPE HATCH.
 *
 * The shell is exactly one viewport tall and does not scroll: `h-dvh` with
 * `overflow-hidden`. `dvh`, not `vh`, because on a phone `100vh` is the height
 * with the browser chrome RETRACTED, so a `100vh` box is always taller than
 * what you can actually see and the page scrolls by the height of the toolbar.
 *
 * The form column itself may scroll, and that is deliberate rather than a
 * contradiction. At any ordinary window height nothing overflows — /register,
 * the tallest screen here, needs about 560px. But a 1366x600 laptop in
 * landscape, or a phone with the keyboard open, can leave less than the form
 * needs, and there "no scrollbar" would mean "the submit button is unreachable".
 * A column that scrolls only when it must is the honest version of one screen.
 *
 * `m-auto` and not `justify-center`: with `justify-content: center` in a
 * scrolling flex column, content taller than the container overflows BOTH ways
 * and the top is cut off above the scroll origin, unreachable. Auto margins
 * resolve to zero when free space is negative, so they centre when there is
 * room and get out of the way when there is not.
 */
export default function Guest({
    children,
    title = 'Masuk',
    subtitle = 'Silakan masuk untuk melanjutkan',
    showcase,
}: GuestProps) {
    return (
        <div className="grid h-dvh w-full overflow-hidden bg-background lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
            <div className="flex min-h-0 flex-col overflow-y-auto">
                <div className="m-auto w-full max-w-md shrink-0 px-6 py-6 sm:px-10">
                    {/* The crest below lg, where there is no panel to carry it.
                        One row, not a stack: it identifies the page without
                        taking the space the form needs. */}
                    <div className="mb-6 flex items-center gap-3 lg:hidden">
                        <img
                            src="/images/kab-smg-logo.webp"
                            alt="Lambang Kabupaten Semarang"
                            width={40}
                            height={40}
                            className="h-10 w-10 shrink-0 object-contain"
                        />
                        <div className="leading-tight">
                            <p className="text-xs text-muted-foreground">
                                Sistem Monitoring Infrastruktur
                            </p>
                            <p className="text-base font-semibold tracking-tight text-foreground">
                                Kabupaten Semarang
                            </p>
                        </div>
                    </div>

                    <div className="tt-enter-up mb-5">
                        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                            {title}
                        </h1>
                        <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
                    </div>

                    <div
                        className="tt-enter-up"
                        style={{ '--tt-delay': '60ms' } as React.CSSProperties}
                    >
                        {children}
                    </div>
                </div>
            </div>

            <AuthShowcase data={showcase} className="hidden lg:block" />
        </div>
    );
}
