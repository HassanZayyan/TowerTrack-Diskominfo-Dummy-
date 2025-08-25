import PrimaryButton from '@/Components/PrimaryButton';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';

export default function VerifyEmail({ status }: { status?: string }) {
    const { post, processing } = useForm({});

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        post(route('verification.send'));
    };

    return (
        <GuestLayout>
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
                Terima kasih telah mendaftar! Sebelum memulai, mohon verifikasi
                alamat email Anda dengan mengklik tautan yang baru saja kami kirimkan.
                Jika Anda tidak menerima email tersebut, kami akan dengan senang hati
                mengirimkan yang baru.
            </div>

            {status === 'verification-link-sent' && (
                <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center">
                        <svg className="w-5 h-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div className="text-sm font-medium text-green-800">
                            Tautan verifikasi baru telah dikirim ke alamat email
                            yang Anda berikan saat pendaftaran.
                        </div>
                    </div>
                </div>
            )}

            <form onSubmit={submit}>
                <div className="space-y-4">
                    <PrimaryButton 
                        disabled={processing}
                        className="w-full justify-center"
                    >
                        {processing ? 'Mengirim...' : 'Kirim Ulang Email Verifikasi'}
                    </PrimaryButton>

                    <div className="text-center">
                        <Link
                            href={route('logout')}
                            method="post"
                            as="button"
                            className="text-sm text-gray-600 underline hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                        >
                            Keluar
                        </Link>
                    </div>
                </div>
            </form>
        </GuestLayout>
    );
}
