import { PropsWithChildren } from 'react';

interface GuestProps extends PropsWithChildren {
    title?: string;
    subtitle?: string;
}

export default function Guest({ children, title = 'Masuk', subtitle = 'Silakan masuk untuk melanjutkan' }: GuestProps) {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center px-4 py-8 sm:py-0" style={{ background: 'linear-gradient(135deg, #f3f4f6 0%, #ffffff 100%)' }}>
            <div className="flex items-center gap-3 mb-2">
                <img src="/images/kab-smg-logo.png" alt="Kabupaten Semarang" className="h-14 w-14" />
                <div className="leading-tight">
                    <p className="text-md" style={{ color: '#212121' }}>Sistem Monitoring Tower</p>
                    <h1 className="text-xl font-bold" style={{ color: '#B71C1C' }}>Kabupaten Semarang</h1>
                </div>
            </div>

            <div className="mt-3 w-full max-w-md overflow-hidden px-6 py-6 shadow-md rounded-xl" style={{ backgroundColor: '#FFFFFF', borderTop: '5px solid #FFD700' }}>
                <div className="mb-4 text-center">
                    <h2 className="text-lg font-semibold" style={{ color: '#212121' }}>{title}</h2>
                    <p className="text-sm" style={{ color: '#212121', opacity: 0.7 }}>{subtitle}</p>
                </div>
                {children}
            </div>
        </div>
    );
}
