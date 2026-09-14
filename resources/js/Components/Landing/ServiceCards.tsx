import React from 'react';
import { Link } from '@inertiajs/react';

/**
 * The four things a visitor can actually do, as four doors.
 *
 * Every destination is an existing public route — nothing here promises a page
 * that has to be built. The hover lift is deliberately small: 2px and a border
 * that firms up, no scale and no glow. A card that grows under the pointer
 * competes with the one thing on the page that should look interactive, which
 * is the link inside it.
 */

interface Service {
    href: string;
    title: string;
    body: string;
    glyph: string;
}

const SERVICES: Service[] = [
    {
        href: '/data-tower',
        title: 'Data Menara',
        body: 'Peta dan tabel seluruh menara telekomunikasi: pemilik, tinggi, jangkauan, dan status perizinannya.',
        glyph: 'cell_tower',
    },
    {
        href: '/data-fo',
        title: 'Jalur Fiber Optic',
        body: 'Titik dan jalur serat optik yang membentuk tulang punggung konektivitas di wilayah kabupaten.',
        glyph: 'polyline',
    },
    {
        href: '/complaint',
        title: 'Kirim Keluhan',
        body: 'Laporkan gangguan sinyal atau kondisi infrastruktur yang membahayakan. Tanpa perlu membuat akun.',
        glyph: 'report',
    },
    {
        href: '/feedback',
        title: 'Kirim Masukan',
        body: 'Usulan penempatan menara, catatan layanan, atau koreksi data yang keliru pada situs ini.',
        glyph: 'forum',
    },
];

const ServiceCards: React.FC = () => {
    return (
        <section className="bg-background" aria-labelledby="tt-layanan">
            <div className="mx-auto w-full max-w-screen-2xl px-4 py-14 sm:px-6 sm:py-20 lg:px-10">
                <h2 id="tt-layanan" className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                    Layanan
                </h2>

                <ul className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    {SERVICES.map((service, i) => (
                        <li
                            key={service.href}
                            className="tt-enter-up"
                            style={{ '--tt-delay': `${i * 60}ms` } as React.CSSProperties}
                        >
                            <Link
                                href={service.href}
                                className="group flex h-full flex-col rounded-lg border border-border bg-card p-5 transition-[border-color,box-shadow,transform] duration-140 ease-soft hover:-translate-y-0.5 hover:border-border-strong hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:ring-offset-2 motion-reduce:transform-none motion-reduce:transition-none"
                            >
                                <span
                                    aria-hidden="true"
                                    className="material-icons-outlined text-[22px] leading-none text-primary-strong"
                                >
                                    {service.glyph}
                                </span>
                                <span className="mt-3 text-base font-semibold tracking-tight text-foreground">
                                    {service.title}
                                </span>
                                <span className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                                    {service.body}
                                </span>
                                <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-primary-strong">
                                    Buka
                                    <span
                                        aria-hidden="true"
                                        className="transition-transform duration-140 ease-soft group-hover:translate-x-0.5 motion-reduce:transform-none"
                                    >
                                        &rarr;
                                    </span>
                                </span>
                            </Link>
                        </li>
                    ))}
                </ul>
            </div>
        </section>
    );
};

export default ServiceCards;
