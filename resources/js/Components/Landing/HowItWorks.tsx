import React from 'react';
import { Link } from '@inertiajs/react';

/**
 * How a resident actually gets a reply.
 *
 * The three steps are the real flow, read off the controllers rather than
 * invented for the page: the form at /complaint, the emailed verification link
 * that a guest submission waits on (ComplaintController::store leaves
 * email_verified_at null and dispatches a verification), and the tracking page
 * at /my-messages where the office's reply lands.
 *
 * THE ONE PINNED SECTION ON THE SITE.
 *
 * The step numbers stay put while the steps themselves scroll, which is the
 * only place the redesign plan permits pinning. It earns it here because the
 * three steps are a sequence — holding the position indicator still while the
 * content moves is what makes "you are on step 2 of 3" legible without saying
 * it.
 *
 * `position: sticky` and not a scroll-jacking pin. The distinction matters for
 * keyboard users: sticky leaves the document flow intact, so Tab moves through
 * the three links in order and the section can be passed at any speed. Nothing
 * captures the wheel, and nothing has to be "escaped".
 */

interface Step {
    title: string;
    body: string;
    href: string;
    cta: string;
}

const STEPS: Step[] = [
    {
        title: 'Tandai lokasinya',
        body: 'Pilih menara dari peta atau tunjuk titik lokasi keluhan. Sinyal lemah, menara miring, kabel menjuntai — lokasi yang tepat membuat aduan bisa ditindaklanjuti.',
        href: '/complaint',
        cta: 'Buka formulir keluhan',
    },
    {
        title: 'Kirim dan verifikasi email',
        body: 'Isi keterangan, lampirkan foto atau video bila ada. Tanpa akun pun bisa: satu tautan verifikasi dikirim ke email Anda supaya aduan bisa dipertanggungjawabkan.',
        href: '/feedback',
        cta: 'Atau kirim masukan',
    },
    {
        title: 'Pantau tanggapannya',
        body: 'Aduan yang sudah diverifikasi masuk ke daftar Pesan Saya. Balasan dari Diskominfo muncul di sana, lengkap dengan riwayat penanganannya.',
        href: '/my-messages',
        cta: 'Lihat Pesan Saya',
    },
];

/**
 * One step.
 *
 * The entrance is the CSS `tt-enter-up` that runs once on mount, NOT a
 * `whileInView` fade. Gating these three cards on an observer left them blank
 * in any capture that does not scroll — the same failure StaggeredContainer.tsx
 * documents, and the reason §2 of the redesign plan bans scroll reveals for
 * body content. A step in a how-to is body content by any definition.
 */
const StepCard: React.FC<{ step: Step; index: number }> = ({ step, index }) => {
    return (
        <li
            className="tt-enter-up rounded-lg border border-border bg-card p-5 sm:p-7"
            style={{ '--tt-delay': `${index * 80}ms` } as React.CSSProperties}
        >
            <div className="flex items-baseline gap-3">
                <span aria-hidden="true" className="text-sm font-semibold tabular-nums text-primary-strong">
                    {String(index + 1).padStart(2, '0')}
                </span>
                <h3 className="text-lg font-semibold tracking-tight text-foreground">{step.title}</h3>
            </div>
            <p className="mt-2.5 text-sm leading-relaxed text-muted-foreground">{step.body}</p>
            <Link
                href={step.href}
                className="mt-4 inline-flex items-center gap-1.5 rounded-md text-sm font-medium text-primary-strong hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:ring-offset-2"
            >
                {step.cta}
                <span aria-hidden="true">&rarr;</span>
            </Link>
        </li>
    );
};

const HowItWorks: React.FC = () => {

    return (
        <section className="border-b border-border bg-canvas" aria-labelledby="tt-cara-kerja">
            <div className="mx-auto w-full max-w-screen-2xl px-4 py-14 sm:px-6 sm:py-20 lg:px-10">
                <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] lg:gap-16">
                    {/* The pinned half. On a phone it is just a heading: sticky
                        on a short viewport would eat a third of the screen for
                        the entire section. */}
                    <div className="lg:sticky lg:top-24 lg:self-start">
                        <h2
                            id="tt-cara-kerja"
                            className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl"
                        >
                            Tiga langkah, dari keluhan ke jawaban
                        </h2>
                        <p className="mt-3 text-base leading-relaxed text-muted-foreground">
                            Warga Kabupaten Semarang bisa melaporkan gangguan infrastruktur telekomunikasi
                            tanpa membuat akun lebih dulu.
                        </p>
                    </div>

                    <ol className="flex flex-col gap-4">
                        {STEPS.map((step, i) => (
                            <StepCard key={step.title} step={step} index={i} />
                        ))}
                    </ol>
                </div>
            </div>
        </section>
    );
};

export default HowItWorks;
