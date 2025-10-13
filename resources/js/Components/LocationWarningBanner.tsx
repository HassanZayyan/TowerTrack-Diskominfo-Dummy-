import React from 'react';

interface LocationWarningBannerProps {
  towerHasCoordinates: boolean;
  className?: string;
}

export default function LocationWarningBanner({ 
  towerHasCoordinates, 
  className = '' 
}: LocationWarningBannerProps) {
  if (towerHasCoordinates) {
    return null; // Don't show banner if tower has coordinates
  }

  return (
    <div className={`p-4 bg-blue-50 border border-blue-200 rounded-lg ${className}`}>
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <svg className="w-5 h-5 text-blue-400 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="ml-3">
          <h3 className="text-sm font-medium text-blue-800">
            Tower Tanpa Koordinat
          </h3>
          <div className="mt-2 text-sm text-blue-700">
            <p>
              Tower yang Anda pilih tidak memiliki koordinat yang tersimpan. 
              Untuk melaporkan keluhan/masukan, kami akan meminta lokasi Anda 
              untuk mendokumentasikan laporan ini.
            </p>
            <ul className="mt-2 list-disc list-inside space-y-1">
              <li>Lokasi Anda akan disimpan secara aman untuk keperluan dokumentasi</li>
              <li>Data koordinat akan dienkripsi dan hanya dapat diakses oleh admin</li>
              <li>Informasi ini membantu tim teknis untuk investigasi lebih lanjut</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

