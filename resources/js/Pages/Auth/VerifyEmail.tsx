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
        <GuestLayout
            title="Verifikasi Email"
            subtitle="Satu langkah lagi sebelum akun Anda aktif"
        >
            <Head title="Verifikasi Email" />

            {/* The <h2> that stood here duplicated the heading the layout
                now prints, two sizes apart and 40px below it. The envelope
                stays: it is the only thing on the screen that says what kind
                of message the reader is waiting for. */}
            <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-muted">
                <svg className="h-7 w-7 text-neutral-strong" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
            </div>

            <div className="mb-6 text-sm text-muted-foreground">
                Terima kasih telah mendaftar! Sebelum memulai, mohon verifikasi
                alamat email Anda dengan mengklik tautan yang baru saja kami kirimkan.
                Jika Anda tidak menerima email tersebut, kami akan dengan senang hati
                mengirimkan yang baru.
            </div>

            {status === 'verification-link-sent' && (
                <div className="mb-6 p-4 bg-success-soft border border-success-border rounded-lg">
                    <div className="flex items-center">
                        <svg className="w-5 h-5 text-success-strong mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div className="text-sm font-medium text-success-strong">
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
                            className="text-sm text-muted-foreground underline hover:text-foreground focus:outline-none focus:ring-2 focus-visible:ring focus:ring-offset-2"
                        >
                            Keluar
                        </Link>
                    </div>
                </div>
            </form>
        </GuestLayout>
    );
}
