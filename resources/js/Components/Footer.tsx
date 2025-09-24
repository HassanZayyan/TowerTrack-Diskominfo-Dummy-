import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-red-800 text-white w-full" style={{ backgroundColor: '#B71C1C' }}>
      {/* Header with Logo and Title */}
      <div className="px-4 sm:px-6 lg:px-8 py-6 border-b border-red-700">
        <div className="flex items-center justify-center gap-3">
          <img 
            src="/images/kab-smg-logo.png" 
            alt="Logo Kabupaten Semarang" 
            className="w-12 h-12 sm:w-16 sm:h-16"
          />
          <h2 className="text-2xl sm:text-3xl font-bold text-yellow-400" style={{ color: '#FFD700' }}>
            TowerTrack
          </h2>
        </div>
      </div>

      {/* Main Footer Content */}
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-sm">
            {/* Alamat */}
            <div className="space-y-3 text-center">
              <div className="flex flex-col items-center gap-3">
                <div className="text-pink-400">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-semibold text-white mb-2">Alamat</h4>
                  <p className="text-gray-200 leading-relaxed">
                    Jalan Diponegoro Nomor 14, Kec. Ungaran Barat,<br />
                    Kabupaten Semarang, Jawa Tengah, 50511
                  </p>
                </div>
              </div>
            </div>

            {/* Email */}
            <div className="space-y-3 text-center">
              <div className="flex flex-col items-center gap-3">
                <div className="text-blue-400">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                    <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-semibold text-white mb-2">Email</h4>
                  <a href="mailto:kominfo@semarangkab.go.id" className="text-gray-200 hover:text-white transition-colors duration-200">
                    kominfo@semarangkab.go.id
                  </a>
                </div>
              </div>
            </div>

            {/* Telepon */}
            <div className="space-y-3 text-center">
              <div className="flex flex-col items-center gap-3">
                <div className="text-green-400">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-semibold text-white mb-2">Telepon</h4>
                  <div className="text-gray-200 space-y-1">
                    <p>Telp: (024) 6920104</p>
                    <p>Faks: (024) 6929192</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Copyright Bar */}
      <div className="border-t border-red-900 py-4 px-4 sm:px-6 lg:px-8" style={{ backgroundColor: '#8B0000' }}>
        <div className="flex flex-col sm:flex-row justify-between items-center text-sm">
          <p className="text-gray-200 mb-2 sm:mb-0">
            © 2025 | Pemerintah Kabupaten Semarang
          </p>
          <p className="text-gray-300">
            Powered By <span className="font-semibold">DISKOMINFO</span>
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
