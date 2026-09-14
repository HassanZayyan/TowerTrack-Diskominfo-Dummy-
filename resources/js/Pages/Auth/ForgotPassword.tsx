import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';

export default function ForgotPassword({ status }: { status?: string }) {
    const { data, setData, post, processing, errors } = useForm({
        email: '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        post(route('password.email'));
    };

    return (
        <GuestLayout
            title="Lupa Password"
            subtitle="Kami akan mengirim tautan untuk mengatur ulang password Anda"
        >
            <Head title="Lupa Password" />

            {/* Was the stock Breeze paragraph, in English, on a screen where
                every other word is Indonesian — and three sentences long, which
                restated the subtitle the layout now prints directly above it. */}
            <div className="mb-4 text-sm text-muted-foreground">
                Masukkan alamat email yang terdaftar pada akun Anda.
            </div>

            {status && (
                <div className="mb-4 text-sm font-medium text-success-strong">
                    {status}
                </div>
            )}

            <form onSubmit={submit} className="space-y-4">
                <div className="space-y-1.5">
                    {/* The field had no label at all — stock Breeze relies on
                        the paragraph above to say what it wants, which leaves a
                        screen reader announcing an unnamed text box. */}
                    <InputLabel htmlFor="email" value="Email" />
                    <TextInput
                        id="email"
                        type="email"
                        name="email"
                        value={data.email}
                        className="block w-full rounded-lg px-3.5 py-2.5 text-sm"
                        autoComplete="username"
                        isFocused={true}
                        onChange={(e) => setData('email', e.target.value)}
                        placeholder="Masukkan email Anda"
                    />
                    <InputError message={errors.email} />
                </div>

                <PrimaryButton className="w-full justify-center px-6 py-2.5" disabled={processing}>
                    {processing ? 'Mengirim...' : 'Kirim Tautan Reset'}
                </PrimaryButton>
            </form>
        </GuestLayout>
    );
}
