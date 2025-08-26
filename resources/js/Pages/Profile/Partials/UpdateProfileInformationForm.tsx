import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import { Transition } from '@headlessui/react';
import { Link, useForm, usePage, router } from '@inertiajs/react';
import { FormEventHandler, useRef, useState, useEffect, useCallback } from 'react';

export default function UpdateProfileInformation({
    mustVerifyEmail,
    status,
    className = '',
}: {
    mustVerifyEmail: boolean;
    status?: string;
    className?: string;
}) {
    const user = usePage().props.auth.user;

    const { data, setData, patch, errors, processing, recentlySuccessful } =
        useForm({
            name: user.name,
            email: user.email,
            avatar: null as File | null,
        });

    const fileInputRef = useRef<HTMLInputElement>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [fileError, setFileError] = useState<string | null>(null);

    // Cleanup preview URL to prevent memory leaks
    useEffect(() => {
        return () => {
            if (previewUrl) {
                URL.revokeObjectURL(previewUrl);
            }
        };
    }, [previewUrl]);

    const validateFile = useCallback((file: File): string | null => {
        const maxSize = 2 * 1024 * 1024; // 2MB
        const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/gif'];

        if (!allowedTypes.includes(file.type)) {
            return 'Format file tidak didukung. Gunakan JPG, PNG, atau GIF.';
        }

        if (file.size > maxSize) {
            return 'Ukuran file terlalu besar. Maksimal 2MB.';
        }

        return null;
    }, []);

    const handleAvatarChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        setFileError(null);

        if (file) {
            const error = validateFile(file);
            if (error) {
                setFileError(error);
                if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                }
                return;
            }

            setData('avatar', file);
            
            // Clean up previous preview URL
            if (previewUrl) {
                URL.revokeObjectURL(previewUrl);
            }
            
            const url = URL.createObjectURL(file);
            setPreviewUrl(url);
        }
    }, [validateFile, previewUrl, setData]);

    const removeAvatar = useCallback(() => {
        setData('avatar', null);
        setFileError(null);
        
        if (previewUrl) {
            URL.revokeObjectURL(previewUrl);
            setPreviewUrl(null);
        }
        
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    }, [previewUrl, setData]);

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        // Create FormData for file upload
        const formData = new FormData();
        
        // Add method spoofing for PATCH
        formData.append('_method', 'PATCH');
        
        // Only include fields that have been modified
        if (data.name !== user.name) {
            formData.append('name', data.name);
        }
        
        if (data.email !== user.email) {
            formData.append('email', data.email);
        }
        
        // Always include avatar if it's being uploaded
        if (data.avatar !== null) {
            formData.append('avatar', data.avatar);
        }

        // Submit using router.post with FormData
        router.post(route('profile.update'), formData, {
            preserveScroll: true,
            onSuccess: () => {
                // Handle success if needed
            },
            onError: (errors) => {
                console.error('Profile update errors:', errors);
            },
        });
    };

    return (
        <section className={className}>
            <header>
                <h2 className="text-xl font-semibold text-gray-900">
                    Informasi Profil
                </h2>

                <p className="mt-2 text-sm text-gray-600">
                    Perbarui informasi profil dan alamat email Anda.
                </p>
            </header>

            <form onSubmit={submit} className="mt-8 space-y-6">
                {/* Avatar Upload */}
                <div>
                    <InputLabel value="Foto Profil" />
                    <div className="mt-2 flex items-center space-x-6">
                        <div className="relative">
                            <div className="h-20 w-20 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden border-2 border-gray-300">
                                {previewUrl ? (
                                    <img
                                        src={previewUrl}
                                        alt="Preview foto profil"
                                        className="h-full w-full object-cover"
                                        onError={() => {
                                            setPreviewUrl(null);
                                            setFileError('Gagal memuat preview gambar.');
                                        }}
                                    />
                                ) : user.avatar ? (
                                    <img
                                        src={`/storage/${user.avatar}`}
                                        alt={`Foto profil ${user.name}`}
                                        className="h-full w-full object-cover"
                                        onError={(e) => {
                                            const target = e.target as HTMLImageElement;
                                            target.style.display = 'none';
                                        }}
                                    />
                                ) : (
                                    <span className="material-icons-outlined text-gray-400 text-3xl" aria-label="Tidak ada foto profil">
                                        person
                                    </span>
                                )}
                            </div>
                        </div>
                        <div className="flex flex-col space-y-2">
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={processing}
                                className="inline-flex items-center px-4 py-2 bg-white border border-gray-300 rounded-md font-semibold text-xs text-gray-700 uppercase tracking-widest shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-25 transition ease-in-out duration-150"
                                aria-label="Pilih foto profil"
                            >
                                <span className="material-icons-outlined mr-2 text-sm" aria-hidden="true">upload</span>
                                Pilih Foto
                            </button>
                            {(previewUrl || user.avatar) && (
                                <button
                                    type="button"
                                    onClick={removeAvatar}
                                    disabled={processing}
                                    className="inline-flex items-center px-4 py-2 bg-red-600 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-25 transition ease-in-out duration-150"
                                    aria-label="Hapus foto profil"
                                >
                                    <span className="material-icons-outlined mr-2 text-sm" aria-hidden="true">delete</span>
                                    Hapus
                                </button>
                            )}
                        </div>
                    </div>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/jpg,image/gif"
                        onChange={handleAvatarChange}
                        className="hidden"
                        aria-label="Upload foto profil"
                    />
                    <p className="mt-2 text-xs text-gray-500">
                        JPG, PNG atau GIF. Maksimal 2MB.
                    </p>
                    {fileError && (
                        <div className="mt-2 text-sm text-red-600 flex items-center">
                            <span className="material-icons-outlined mr-1 text-sm" aria-hidden="true">error</span>
                            {fileError}
                        </div>
                    )}
                    <InputError className="mt-2" message={errors.avatar} />
                </div>
                <div>
                    <InputLabel htmlFor="name" value="Nama Lengkap" />

                    <TextInput
                        id="name"
                        className="mt-1 block w-full"
                        value={data.name}
                        onChange={(e) => setData('name', e.target.value)}
                        required
                        isFocused
                        autoComplete="name"
                    />

                    <InputError className="mt-2" message={errors.name} />
                </div>

                <div>
                    <InputLabel htmlFor="email" value="Alamat Email" />

                    <TextInput
                        id="email"
                        type="email"
                        className="mt-1 block w-full"
                        value={data.email}
                        onChange={(e) => setData('email', e.target.value)}
                        required
                        autoComplete="username"
                    />

                    <InputError className="mt-2" message={errors.email} />
                </div>

                {mustVerifyEmail && user.email_verified_at === null && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                        <div className="flex">
                            <span className="material-icons-outlined text-yellow-400 mr-3">warning</span>
                            <div>
                                <p className="text-sm text-yellow-800">
                                    Alamat email Anda belum diverifikasi.
                                    <Link
                                        href={route('verification.send')}
                                        method="post"
                                        as="button"
                                        className="ml-1 font-medium text-yellow-800 underline hover:text-yellow-900 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2"
                                    >
                                        Klik di sini untuk mengirim ulang email verifikasi.
                                    </Link>
                                </p>

                                {status === 'verification-link-sent' && (
                                    <div className="mt-2 text-sm font-medium text-green-600">
                                        Link verifikasi baru telah dikirim ke alamat email Anda.
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                    <Transition
                        show={recentlySuccessful}
                        enter="transition ease-in-out"
                        enterFrom="opacity-0"
                        leave="transition ease-in-out"
                        leaveTo="opacity-0"
                    >
                        <div className="flex items-center text-sm text-green-600">
                            <span className="material-icons-outlined mr-2 text-sm">check_circle</span>
                            Profil berhasil diperbarui.
                        </div>
                    </Transition>
                    
                    <PrimaryButton 
                        disabled={processing}
                        className="inline-flex items-center px-6 py-2 bg-yellow-500 border border-transparent rounded-md font-semibold text-sm text-black uppercase tracking-widest hover:bg-yellow-600 focus:bg-yellow-600 active:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 transition ease-in-out duration-150"
                        style={{ backgroundColor: '#FFD700', color: '#212121' }}
                    >
                        {processing && (
                            <span className="material-icons-outlined animate-spin mr-2 text-sm">refresh</span>
                        )}
                        Simpan Perubahan
                    </PrimaryButton>
                </div>
            </form>
        </section>
    );
}
