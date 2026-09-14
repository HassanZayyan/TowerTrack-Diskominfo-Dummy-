import { useRef, useState, useEffect } from 'react';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PasswordInput from '@/Components/PasswordInput';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import TurnstileCaptcha, { TurnstileCaptchaRef } from '@/Components/TurnstileCaptcha';
import GuestLayout from '@/Layouts/GuestLayout';
import { type ShowcaseData } from '@/Components/Auth/AuthShowcase';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { FormEventHandler } from 'react';

/**
 * Four fields plus a CAPTCHA is the tallest screen in the auth shell, and it is
 * the one that decides the vertical budget described in GuestLayout. The
 * rhythm here matches Login exactly — same field class, same `space-y-4` — so
 * the two screens do not drift apart the next time either is touched.
 */
const FIELD = 'block w-full rounded-lg px-3.5 py-2.5 text-sm';

export default function Register({ showcase }: { showcase?: ShowcaseData }) {
    const { turnstileSiteKey } = usePage().props as any;
    const captchaRef = useRef<TurnstileCaptchaRef>(null);
    const [captchaToken, setCaptchaToken] = useState<string>('');

    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
        'cf-turnstile-response': '',
    });

    // Sync CAPTCHA token to form data whenever it changes
    useEffect(() => {
        if (captchaToken) {
            setData('cf-turnstile-response', captchaToken);
        } else {
            setData('cf-turnstile-response', '');
        }
    }, [captchaToken, setData]);

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        // Validate CAPTCHA before submission
        if (!captchaToken) {
            return;
        }

        // Post will use the updated data state (token should already be synced by useEffect)
        post(route('register'), {
            onFinish: () => {
                reset('password', 'password_confirmation');
                // Reset CAPTCHA after submission
                captchaRef.current?.reset();
                setCaptchaToken('');
            },
            onError: () => {
                // Reset CAPTCHA on error
                captchaRef.current?.reset();
                setCaptchaToken('');
            },
        });
    };

    return (
        <GuestLayout
            title="Daftar"
            subtitle="Silakan daftar untuk melanjutkan"
            showcase={showcase}
        >
            <Head title="Daftar" />

            <form onSubmit={submit} className="space-y-4">
                <div className="space-y-1.5">
                    <InputLabel htmlFor="name" value="Nama Lengkap" />
                    <TextInput
                        id="name"
                        name="name"
                        value={data.name}
                        className={FIELD}
                        autoComplete="name"
                        isFocused={true}
                        onChange={(e) => setData('name', e.target.value)}
                        placeholder="Masukkan nama lengkap Anda"
                        required
                    />
                    <InputError message={errors.name} />
                </div>

                <div className="space-y-1.5">
                    <InputLabel htmlFor="email" value="Email" />
                    <TextInput
                        id="email"
                        type="email"
                        name="email"
                        value={data.email}
                        className={FIELD}
                        autoComplete="username"
                        onChange={(e) => setData('email', e.target.value)}
                        placeholder="Masukkan email Anda"
                        required
                    />
                    <InputError message={errors.email} />
                </div>

                <div className="space-y-1.5">
                    <InputLabel htmlFor="password" value="Password" />
                    <PasswordInput
                        id="password"
                        name="password"
                        value={data.password}
                        className={FIELD}
                        autoComplete="new-password"
                        onChange={(e) => setData('password', e.target.value)}
                        placeholder="Masukkan password Anda"
                        required
                    />
                    <InputError message={errors.password} />
                </div>

                <div className="space-y-1.5">
                    <InputLabel htmlFor="password_confirmation" value="Konfirmasi Password" />
                    <PasswordInput
                        id="password_confirmation"
                        name="password_confirmation"
                        value={data.password_confirmation}
                        className={FIELD}
                        autoComplete="new-password"
                        onChange={(e) => setData('password_confirmation', e.target.value)}
                        placeholder="Konfirmasi password Anda"
                        required
                    />
                    <InputError message={errors.password_confirmation} />
                </div>

                <TurnstileCaptcha
                    ref={captchaRef}
                    siteKey={turnstileSiteKey || ''}
                    onTokenChange={setCaptchaToken}
                    error={errors['cf-turnstile-response'] || (errors as any).captcha}
                    size="normal"
                    theme="light"
                />

                <PrimaryButton
                    className="w-full justify-center px-6 py-2.5"
                    disabled={processing || !captchaToken}
                >
                    {processing ? 'Memproses...' : 'Daftar'}
                </PrimaryButton>

                <div className="flex flex-col items-center justify-center gap-2 border-t border-border pt-4 sm:flex-row sm:gap-4">
                    <Link
                        href={route('login')}
                        className="rounded text-sm text-muted-foreground underline transition-colors duration-200 hover:text-foreground hover:no-underline focus-visible:outline-none focus-visible:ring focus-visible:ring-offset-2"
                    >
                        Sudah punya akun? Masuk di sini
                    </Link>

                    <span aria-hidden="true" className="hidden text-border-strong sm:inline">
                        |
                    </span>

                    <Link
                        href={route('data.tower')}
                        className="rounded text-sm text-muted-foreground underline transition-colors duration-200 hover:text-foreground hover:no-underline focus-visible:outline-none focus-visible:ring focus-visible:ring-offset-2"
                    >
                        Kembali ke Beranda
                    </Link>
                </div>
            </form>
        </GuestLayout>
    );
}
