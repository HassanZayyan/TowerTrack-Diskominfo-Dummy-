import { useRef, useState, useEffect } from 'react';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PasswordInput from '@/Components/PasswordInput';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import TurnstileCaptcha, { TurnstileCaptchaRef } from '@/Components/TurnstileCaptcha';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { FormEventHandler } from 'react';

export default function Register() {
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
        <GuestLayout title="Daftar" subtitle="Silakan daftar untuk melanjutkan">
            <Head title="Daftar" />

            <form onSubmit={submit} className="space-y-6">
                <div className="space-y-2">
                    <InputLabel htmlFor="name" value="Nama Lengkap" className="text-sm font-medium" />
                    <TextInput
                        id="name"
                        name="name"
                        value={data.name}
                        className="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent transition-all duration-200"
                        autoComplete="name"
                        isFocused={true}
                        onChange={(e) => setData('name', e.target.value)}
                        placeholder="Masukkan nama lengkap Anda"
                        required
                    />
                    <InputError message={errors.name} className="mt-1" />
                </div>

                <div className="space-y-2">
                    <InputLabel htmlFor="email" value="Email" className="text-sm font-medium" />
                    <TextInput
                        id="email"
                        type="email"
                        name="email"
                        value={data.email}
                        className="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent transition-all duration-200"
                        autoComplete="username"
                        onChange={(e) => setData('email', e.target.value)}
                        placeholder="Masukkan email Anda"
                        required
                    />
                    <InputError message={errors.email} className="mt-1" />
                </div>

                <div className="space-y-2">
                    <InputLabel htmlFor="password" value="Password" className="text-sm font-medium" />
                    <PasswordInput
                        id="password"
                        name="password"
                        value={data.password}
                        className="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent transition-all duration-200"
                        autoComplete="new-password"
                        onChange={(e) => setData('password', e.target.value)}
                        placeholder="Masukkan password Anda"
                        required
                    />
                    <InputError message={errors.password} className="mt-1" />
                </div>

                <div className="space-y-2">
                    <InputLabel
                        htmlFor="password_confirmation"
                        value="Konfirmasi Password"
                        className="text-sm font-medium"
                    />
                    <PasswordInput
                        id="password_confirmation"
                        name="password_confirmation"
                        value={data.password_confirmation}
                        className="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent transition-all duration-200"
                        autoComplete="new-password"
                        onChange={(e) =>
                            setData('password_confirmation', e.target.value)
                        }
                        placeholder="Konfirmasi password Anda"
                        required
                    />
                    <InputError
                        message={errors.password_confirmation}
                        className="mt-1"
                    />
                </div>

                {/* CAPTCHA */}
                <div className="mb-6">
                    <TurnstileCaptcha
                        ref={captchaRef}
                        siteKey={turnstileSiteKey || ''}
                        onTokenChange={setCaptchaToken}
                        error={errors['cf-turnstile-response'] || (errors as any).captcha}
                        size="normal"
                        theme="light"
                    />
                </div>

                {/* Main Action Button */}
                <div className="pt-2">
                    <PrimaryButton 
                        className="w-full px-6 py-3 font-medium rounded-lg transition-all duration-200 hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-800 justify-center" 
                        disabled={processing || !captchaToken} 
                        style={{ backgroundColor: '#212121' }}
                    >
                        {processing ? 'Memproses...' : 'Daftar'}
                    </PrimaryButton>
                </div>

                {/* Navigation Links */}
                <div className="pt-6 border-t border-gray-200">
                    <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-center justify-center">
                        <Link
                            href={route('login')}
                            className="text-sm text-gray-600 hover:text-gray-800 underline hover:no-underline focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 rounded transition-colors duration-200"
                        >
                            Sudah punya akun? Masuk di sini
                        </Link>
                        
                        <span className="hidden sm:inline text-gray-300">|</span>
                        
                        <Link
                            href={route('data.tower')}
                            className="text-sm text-gray-600 hover:text-gray-800 underline hover:no-underline focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 rounded transition-colors duration-200"
                        >
                            Kembali ke Beranda
                        </Link>
                    </div>
                </div>
            </form>
        </GuestLayout>
    );
}
