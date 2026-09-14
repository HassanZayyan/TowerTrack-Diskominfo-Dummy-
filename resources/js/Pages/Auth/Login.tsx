import { useRef, useState, useEffect } from 'react';
import Checkbox from '@/Components/Checkbox';
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
 * The field rhythm — `space-y-4`, `py-2.5` inputs, one hairline above the
 * links — is set so the whole form clears a short laptop window without
 * scrolling. See the one-screen note in GuestLayout. It is a budget, not a
 * style: adding a field here costs about 66px of it.
 */
const FIELD = 'block w-full rounded-lg px-3.5 py-2.5 text-sm';

export default function Login({
    status,
    canResetPassword,
    showcase,
}: {
    status?: string;
    canResetPassword: boolean;
    showcase?: ShowcaseData;
}) {
    const { turnstileSiteKey } = usePage().props as any;
    const captchaRef = useRef<TurnstileCaptchaRef>(null);
    const [captchaToken, setCaptchaToken] = useState<string>('');

    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
        password: '',
        remember: false as boolean,
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
        post(route('login'), {
            onFinish: () => {
                reset('password');
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
        <GuestLayout showcase={showcase}>
            <Head title="Masuk" />

            {status && (
                <div className="mb-4 rounded-lg border border-success-border bg-success-soft px-3 py-2 text-sm font-medium text-success-strong">
                    {status}
                </div>
            )}

            <form onSubmit={submit} className="space-y-4">
                <div className="space-y-1.5">
                    <InputLabel htmlFor="email" value="Email" />
                    <TextInput
                        id="email"
                        type="email"
                        name="email"
                        value={data.email}
                        className={FIELD}
                        autoComplete="username"
                        isFocused={true}
                        onChange={(e) => setData('email', e.target.value)}
                        placeholder="Masukkan email Anda"
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
                        autoComplete="current-password"
                        onChange={(e) => setData('password', e.target.value)}
                        placeholder="Masukkan password Anda"
                    />
                    <InputError message={errors.password} />
                </div>

                <div className="flex items-center justify-between">
                    <label className="flex cursor-pointer items-center">
                        <Checkbox
                            name="remember"
                            checked={data.remember}
                            onChange={(e) =>
                                setData(
                                    'remember',
                                    (e.target.checked || false) as false,
                                )
                            }
                            className="rounded focus:ring-2 focus:ring-ring"
                        />
                        <span className="ml-2 select-none text-sm text-muted-foreground">
                            Ingat saya
                        </span>
                    </label>

                    {canResetPassword && (
                        <Link
                            href={route('password.request')}
                            className="rounded text-sm text-muted-foreground underline transition-colors duration-200 hover:text-foreground hover:no-underline focus-visible:outline-none focus-visible:ring focus-visible:ring-offset-2"
                        >
                            Lupa password?
                        </Link>
                    )}
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
                    {processing ? 'Memproses...' : 'Masuk'}
                </PrimaryButton>

                <div className="flex flex-col items-center justify-center gap-2 border-t border-border pt-4 sm:flex-row sm:gap-4">
                    <Link
                        href={route('register')}
                        className="rounded text-sm text-muted-foreground underline transition-colors duration-200 hover:text-foreground hover:no-underline focus-visible:outline-none focus-visible:ring focus-visible:ring-offset-2"
                    >
                        Belum punya akun? Daftar di sini
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
