import GuestLayout from '@/Layouts/GuestLayout';
import { Head } from '@inertiajs/react';

interface Props {
    email?: string;
    type?: 'feedback' | 'complaint';
    status?: string;
}

export default function GuestVerifyEmail({ email, type, status }: Props) {
    return (
        <GuestLayout title="Verifikasi Email" subtitle="Silakan verifikasi email Anda untuk melanjutkan">
            <Head title="Verifikasi Email" />

            <div className="text-center mb-6">
                <div className="mx-auto flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                    <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    Verifikasi Email Anda
                </h2>
            </div>

            <div className="mb-6 text-sm text-gray-600 text-center">
                {email && (
                    <p className="mb-2">
                        Kami telah mengirim email verifikasi ke <strong className="text-gray-900">{email}</strong>
                    </p>
                )}
                <p className="mb-4">
                    {type === 'complaint' 
                        ? 'Terima kasih telah mengirim keluhan Anda! Sebelum melanjutkan, mohon verifikasi alamat email Anda dengan mengklik tautan yang baru saja kami kirimkan ke email Anda.'
                        : 'Terima kasih telah mengirim masukan Anda! Sebelum melanjutkan, mohon verifikasi alamat email Anda dengan mengklik tautan yang baru saja kami kirimkan ke email Anda.'}
                </p>
                <p className="text-xs text-gray-500">
                    Setelah email Anda terverifikasi, Anda akan diarahkan kembali ke halaman form dan melihat konfirmasi bahwa {type === 'complaint' ? 'keluhan' : 'masukan'} Anda telah berhasil dikirim.
                </p>
            </div>

            {status === 'verification-link-sent' && (
                <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center">
                        <svg className="w-5 h-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div className="text-sm font-medium text-green-800">
                            Email verifikasi telah dikirim ulang ke alamat email Anda.
                        </div>
                    </div>
                </div>
            )}

            <div className="text-center">
                <p className="text-sm text-gray-500">
                    Belum menerima email? Periksa folder spam atau kotak masuk Anda.
                </p>
            </div>
        </GuestLayout>
    );
}




