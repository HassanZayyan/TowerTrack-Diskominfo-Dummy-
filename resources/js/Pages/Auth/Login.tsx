import Checkbox from '@/Components/Checkbox';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PasswordInput from '@/Components/PasswordInput';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';

export default function Login({
    status,
    canResetPassword,
}: {
    status?: string;
    canResetPassword: boolean;
}) {
    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
        password: '',
        remember: false as boolean,
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        post(route('login'), {
            onFinish: () => reset('password'),
        });
    };

    return (
        <GuestLayout>
            <Head title="Log in" />

            {status && (
                <div className="mb-4 text-sm font-medium text-green-600">
                    {status}
                </div>
            )}

            {/* Information notice for tower owners */}
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-start">
                    <svg className="w-5 h-5 text-green-600 mt-0.5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div className="text-sm text-green-800">
                        <p className="font-medium mb-1">Untuk Tower Owners:</p>
                        <p>Jika Anda adalah pemilik menara, gunakan akun yang telah diberikan oleh administrator untuk login.</p>
                        <p className="mt-1">Akun tower owner biasanya menggunakan email dengan domain <strong>@towerowner.local</strong></p>
                    </div>
                </div>
            </div>

            <form onSubmit={submit} className="space-y-6">
                <div className="space-y-2">
                    <InputLabel htmlFor="email" value="Email" className="text-sm font-medium" />
                    <TextInput
                        id="email"
                        type="email"
                        name="email"
                        value={data.email}
                        className="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent transition-all duration-200"
                        autoComplete="username"
                        isFocused={true}
                        onChange={(e) => setData('email', e.target.value)}
                        placeholder="Masukkan email Anda"
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
                        autoComplete="current-password"
                        onChange={(e) => setData('password', e.target.value)}
                        placeholder="Masukkan password Anda"
                    />
                    <InputError message={errors.password} className="mt-1" />
                </div>

                <div className="flex items-center justify-between">
                    <label className="flex items-center cursor-pointer">
                        <Checkbox
                            name="remember"
                            checked={data.remember}
                            onChange={(e) =>
                                setData(
                                    'remember',
                                    (e.target.checked || false) as false,
                                )
                            }
                            className="rounded focus:ring-2 focus:ring-gray-500"
                        />
                        <span className="ml-2 text-sm text-gray-600 select-none">
                            Ingat saya
                        </span>
                    </label>
                    
                    {canResetPassword && (
                        <Link
                            href={route('password.request')}
                            className="text-sm text-gray-600 hover:text-gray-800 underline hover:no-underline focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 rounded transition-colors duration-200"
                        >
                            Lupa password?
                        </Link>
                    )}
                </div>

                {/* Main Action Button */}
                <div className="pt-2">
                    <PrimaryButton 
                        className="w-full px-6 py-3 font-medium rounded-lg transition-all duration-200 hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-800 justify-center" 
                        disabled={processing} 
                        style={{ backgroundColor: '#212121' }}
                    >
                        {processing ? 'Memproses...' : 'Masuk'}
                    </PrimaryButton>
                </div>

                {/* Navigation Links */}
                <div className="pt-6 border-t border-gray-200">
                    <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-center justify-center">
                        <Link
                            href={route('register')}
                            className="text-sm text-gray-600 hover:text-gray-800 underline hover:no-underline focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 rounded transition-colors duration-200"
                        >
                            Belum punya akun? Daftar di sini
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
