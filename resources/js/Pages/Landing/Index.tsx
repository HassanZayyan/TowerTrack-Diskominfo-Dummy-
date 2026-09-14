import React from 'react';
import { Head } from '@inertiajs/react';
import AppBar from '@/Components/AppBar';
import Footer from '@/Components/Footer';
import LandingHero from '@/Components/Landing/LandingHero';
import StatsBand, { type Stat } from '@/Components/Landing/StatsBand';
import SebaranSection from '@/Components/Landing/SebaranSection';
import HowItWorks from '@/Components/Landing/HowItWorks';
import ServiceCards from '@/Components/Landing/ServiceCards';
import type { TowerPoint } from '@/lib/geo';

/**
 * The public front door.
 *
 * `/` was a redirect into /data-tower, so anyone arriving from a search result
 * landed in a filter table with no explanation of what the site was or who ran
 * it. This page answers both before offering the table.
 *
 * WHY IT COMPOSES AppBar AND Footer DIRECTLY RATHER THAN USING MainLayout.
 *
 * MainLayout wraps its children in a width-constrained, padded `<main>`, which
 * is right for a form and wrong for a page built out of full-bleed bands. The
 * two public data pages already compose the shell by hand for the same reason;
 * this follows their precedent instead of inventing a third arrangement.
 */

interface LandingProps {
    stats: {
        totalTowers: number;
        activeTowers: number;
        kecamatanCount: number;
        operatorCount: number;
        foRouteCount: number;
    };
    towerPoints: TowerPoint[];
    owners: string[];
}

export default function LandingIndex({ stats, towerPoints, owners }: LandingProps) {
    const tiles: Stat[] = [
        {
            value: stats.totalTowers,
            label: 'Menara terdata',
            hint: 'Seluruh menara telekomunikasi yang tercatat di basis data kabupaten.',
        },
        {
            value: stats.activeTowers,
            label: 'Izin aktif',
            hint: 'Menara dengan status izin Aktif. Sisanya non-aktif atau masih dalam proses.',
        },
        {
            value: stats.kecamatanCount,
            label: 'Kecamatan terjangkau',
            hint: 'Kecamatan di Kabupaten Semarang yang memiliki sedikitnya satu menara terdata.',
        },
        {
            value: stats.operatorCount,
            label: 'Operator',
            hint: 'Perusahaan penyedia menara yang tercatat memiliki menara di wilayah ini.',
        },
    ];

    return (
        <div className="flex min-h-screen flex-col bg-background">
            <Head title="Beranda">
                <meta
                    name="description"
                    content="Peta terbuka menara telekomunikasi dan jalur fiber optic di Kabupaten Semarang. Lihat sebaran, jangkauan, dan perizinan, atau laporkan gangguan langsung ke Diskominfo."
                />
            </Head>

            <AppBar currentPage="/" />

            <main className="flex-1">
                <LandingHero
                    points={towerPoints}
                    owners={owners}
                    totalTowers={stats.totalTowers}
                    kecamatanCount={stats.kecamatanCount}
                />
                <StatsBand stats={tiles} />
                <SebaranSection points={towerPoints} owners={owners} />
                <HowItWorks />
                <ServiceCards />
            </main>

            <Footer />
        </div>
    );
}
