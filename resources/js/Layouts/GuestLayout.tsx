import ApplicationLogo from '@/Components/ApplicationLogo';
import { Link } from '@inertiajs/react';
import { PropsWithChildren } from 'react';

export default function Guest({ children }: PropsWithChildren) {
    return (
        <div className="flex min-h-screen flex-col items-center pt-6 sm:justify-center sm:pt-0" style={{ background: 'linear-gradient(135deg, #f3f4f6 0%, #ffffff 100%)' }}>
            <div className="flex items-center gap-3 mb-2">
                <img src="/images/kab-smg-logo.png" alt="Kabupaten Semarang" className="h-14 w-14" />
                <div className="leading-tight">
                    <p className="text-md" style={{ color: '#212121' }}>Sistem Monitoring Tower</p>
                    <h1 className="text-xl font-bold" style={{ color: '#B71C1C' }}>Kabupaten Semarang</h1>
                </div>
            </div>

            <div className="mt-3 w-full overflow-hidden px-6 py-6 shadow-md sm:max-w-md sm:rounded-xl" style={{ backgroundColor: '#FFFFFF', borderTop: '5px solid #FFD700' }}>
                <div className="mb-4 text-center">
                    <h2 className="text-lg font-semibold" style={{ color: '#212121' }}>Masuk</h2>
                    <p className="text-sm" style={{ color: '#212121', opacity: 0.7 }}>Silakan masuk untuk melanjutkan</p>
                </div>
                {children}
            </div>
        </div>
    );
}
