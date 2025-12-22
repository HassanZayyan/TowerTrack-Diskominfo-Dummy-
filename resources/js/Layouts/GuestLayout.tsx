import { PropsWithChildren } from 'react';

interface GuestProps extends PropsWithChildren {
    title?: string;
    subtitle?: string;
}

export default function Guest({ children, title = 'Masuk', subtitle = 'Silakan masuk untuk melanjutkan' }: GuestProps) {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center px-4 py-8 sm:py-12 md:py-16" style={{ background: 'linear-gradient(135deg, #f3f4f6 0%, #ffffff 100%)' }}>
            <div className="w-full max-w-md flex flex-col items-center">
                {/* Logo Section with proper top spacing */}
                <div className="flex items-center gap-3 mb-6 sm:mb-8">
                    <img src="/images/kab-smg-logo.png" alt="Kabupaten Semarang" className="h-14 w-14 sm:h-16 sm:w-16" />
                    <div className="leading-tight">
                        <p className="text-sm sm:text-base" style={{ color: '#212121' }}>Sistem Monitoring Infrastruktur</p>
                        <h1 className="text-lg sm:text-xl font-bold" style={{ color: '#B71C1C' }}>Kabupaten Semarang</h1>
                    </div>
                </div>

                {/* Form Card */}
                <div className="w-full overflow-hidden px-6 py-6 shadow-md rounded-xl" style={{ backgroundColor: '#FFFFFF', borderTop: '5px solid #FFD700' }}>
                    <div className="mb-4 text-center">
                        <h2 className="text-lg font-semibold" style={{ color: '#212121' }}>{title}</h2>
                        <p className="text-sm" style={{ color: '#212121', opacity: 0.7 }}>{subtitle}</p>
                    </div>
                    {children}
                </div>
            </div>
        </div>
    );
}
