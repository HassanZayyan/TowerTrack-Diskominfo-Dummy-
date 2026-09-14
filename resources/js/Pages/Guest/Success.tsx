import React from 'react';
import { Head, Link } from '@inertiajs/react';
import GuestLayout from '@/Layouts/GuestLayout';

interface SuccessProps {
    messageType?: 'complaint' | 'feedback';
    message?: string;
}

export default function SubmissionSuccess({ messageType = 'complaint', message }: SuccessProps) {
    const title = messageType === 'complaint' 
        ? 'Keluhan Berhasil Dikirim!' 
        : 'Masukan Berhasil Dikirim!';
    
    const defaultMessage = messageType === 'complaint'
        ? 'Keluhan Anda telah berhasil dikirim. Terima kasih atas laporan Anda.'
        : 'Masukan Anda telah berhasil dikirim. Terima kasih atas kontribusi Anda.';

    const displayMessage = message || defaultMessage;

    return (
        <GuestLayout title={title} subtitle="Laporan Anda berhasil dikirim">
            <Head title={title} />

            <div className="text-center">
                {/* Success Icon */}
                <div className="mx-auto flex items-center justify-center w-20 h-20 bg-success-soft rounded-full mb-6">
                    <svg 
                        className="w-12 h-12 text-success-strong" 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                    >
                        <path 
                            strokeLinecap="round" 
                            strokeLinejoin="round" 
                            strokeWidth={2} 
                            d="M5 13l4 4L19 7" 
                        />
                    </svg>
                </div>

                {/* Success Message */}
                <h2 className="text-2xl font-bold text-foreground mb-4">
                    {title}
                </h2>
                
                <p className="text-muted-foreground mb-2">
                    {displayMessage}
                </p>

                {messageType === 'complaint' && (
                    <p className="text-sm text-muted-foreground mb-6">
                        Kami akan segera menindaklanjuti keluhan Anda. Gunakan email Anda untuk melacak status keluhan.
                    </p>
                )}

                {messageType === 'feedback' && (
                    <p className="text-sm text-muted-foreground mb-6">
                        Kami menghargai masukan Anda. Tim kami akan mempertimbangkannya untuk perbaikan sistem.
                    </p>
                )}

                {/* Button to go back */}
                <div className="mt-8">
                    <Link
                        href={route('data.tower')}
                        className="inline-flex items-center px-6 py-3 bg-destructive border border-transparent rounded-lg font-semibold text-white hover:bg-destructive focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-destructive transition-colors"
                    >
                        Kembali ke Halaman Data Tower
                    </Link>
                </div>
            </div>
        </GuestLayout>
    );
}

