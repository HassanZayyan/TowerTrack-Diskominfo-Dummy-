import React from 'react';

/**
 * Contact icons were pink-400 / blue-400 / green-400 — three decorative hues
 * carrying no meaning, on a surface where green and red already mean something
 * specific elsewhere in the app. They are one muted tone now; the heading names
 * the field, so colour has no work to do here.
 *
 * The gold rule above the copyright bar is gone. It was the last ceremonial
 * use of Sun Gold anywhere in the product, and a single yellow line under an
 * otherwise entirely maroon footer read as a leftover rather than as
 * ceremony. The divider it provided is still there, in white at low alpha,
 * which separates the bar without introducing a second hue.
 */
const CONTACT_ICON = 'w-5 h-5 text-white/55';

const Footer: React.FC = () => {
  return (
    <footer className="w-full bg-primary text-white">
      {/* Header with Logo and Title */}
      <div className="px-4 sm:px-6 lg:px-8 py-6 border-b border-white/15">
        <div className="flex items-center justify-center gap-3">
          <div className="p-2 sm:p-3 rounded-lg bg-white">
            <img
              src="/images/kab-smg-logo.webp"
              alt="Logo Kabupaten Semarang"
              className="w-12 h-12 sm:w-16 sm:h-16 object-contain"
            />
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            TowerTrack
          </h2>
        </div>
      </div>

      {/* Main Footer Content */}
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-sm">
            {/* Alamat */}
            <div className="text-center">
              <div className="flex flex-col items-center gap-3">
                <svg className={CONTACT_ICON} fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                  <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                </svg>
                <div>
                  <h4 className="font-semibold text-white mb-2">Alamat</h4>
                  <p className="text-white/85 leading-relaxed">
                    Jalan Diponegoro Nomor 14, Kec. Ungaran Barat,<br />
                    Kabupaten Semarang, Jawa Tengah, 50511
                  </p>
                </div>
              </div>
            </div>

            {/* Email */}
            <div className="text-center">
              <div className="flex flex-col items-center gap-3">
                <svg className={CONTACT_ICON} fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                  <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                  <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                </svg>
                <div>
                  <h4 className="font-semibold text-white mb-2">Email</h4>
                  <a
                    href="mailto:kominfo@semarangkab.go.id"
                    className="text-white/85 underline-offset-4 transition-colors hover:text-white hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80 focus-visible:ring-offset-2 focus-visible:ring-offset-primary rounded"
                  >
                    kominfo@semarangkab.go.id
                  </a>
                </div>
              </div>
            </div>

            {/* Telepon */}
            <div className="text-center">
              <div className="flex flex-col items-center gap-3">
                <svg className={CONTACT_ICON} fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                  <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                </svg>
                <div>
                  <h4 className="font-semibold text-white mb-2">Telepon</h4>
                  <div className="text-white/85 space-y-1">
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
      <div className="border-t border-white/15 bg-brand-900 py-4 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row justify-between items-center text-sm gap-1">
          <p className="text-white/85">
            © 2025 | Pemerintah Kabupaten Semarang
          </p>
          <p className="text-white/70">
            Powered By <span className="font-semibold text-white/90">DISKOMINFO</span>
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
