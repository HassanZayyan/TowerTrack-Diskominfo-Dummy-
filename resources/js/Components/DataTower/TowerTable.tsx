import React from 'react';
import { router } from '@inertiajs/react';

interface Tower {
  id: number;
  site_name: string;
  latitude: number | string;
  longitude: number | string;
  alamat_menara?: string;
  tinggi_menara?: number;
  site_type?: string | null;
  owner?: string;
  status?: string;
}

interface TowerTableProps {
  towers: Tower[];
  currentPage: number;
  perPage: number;
  total: number;
  lastPage: number;
  onTowerClick: (tower: Tower) => void;
  onPageChange: (page: number) => void;
}

export default function TowerTable({
  towers,
  currentPage,
  perPage,
  total,
  lastPage,
  onTowerClick,
  onPageChange
}: TowerTableProps) {
  const formatCoordinate = (value: number | string, type: 'lat' | 'lng') => {
    const num = Number(value);
    const str = typeof value === 'string' && value.trim() !== '' && value !== '0' ? value : null;
    
    if (Number.isFinite(num) && num !== 0) {
      return num.toFixed(6);
    } else if (str) {
      return str;
    } else {
      return 'Belum Terdata';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-4 border-b grid grid-cols-1 md:grid-cols-2 gap-3 items-center">
        <h2 className="text-lg sm:text-xl font-medium">Data Tower</h2>
      </div>

      <div className="overflow-x-auto">
        {/* Table for md+ */}
        <table className="w-full text-left hidden md:table">
          <thead>
            <tr className="bg-gray-50">
              <th className="px-4 py-3 border-b">Site Tower</th>
              <th className="px-4 py-3 border-b">Koordinat</th>
              <th className="px-4 py-3 border-b">Tinggi</th>
              <th className="px-4 py-3 border-b">Owner</th>
              <th className="px-4 py-3 border-b">Alamat</th>
              <th className="px-4 py-3 border-b">Status</th>
            </tr>
          </thead>
          <tbody>
            {towers.map((tower) => (
              <tr 
                key={tower.id} 
                className="hover:bg-gray-50 cursor-pointer"
                onClick={() => onTowerClick(tower)}
              >
                <td className="px-4 py-3 border-b">{tower.site_name || 'Belum Terdata'}</td>
                <td className="px-4 py-3 border-b">
                  Lat: {formatCoordinate(tower.latitude, 'lat')}<br/>
                  Lng: {formatCoordinate(tower.longitude, 'lng')}
                </td>
                <td className="px-4 py-3 border-b">{tower.tinggi_menara ? `${tower.tinggi_menara}m` : 'Belum Terdata'}</td>
                <td className="px-4 py-3 border-b">{tower.owner || 'Belum Terdata'}</td>
                <td className="px-4 py-3 border-b">{tower.alamat_menara || 'Belum Terdata'}</td>
                <td className="px-4 py-3 border-b">
                  <span 
                    className="inline-block px-3 py-1 rounded-full text-xs font-medium text-white"
                    style={{ 
                      backgroundColor: tower.status === 'Aktif' || tower.status === 'AKTIF' 
                        ? '#1B5E20' 
                        : !tower.status 
                          ? '#6B7280' 
                          : '#212121'
                    }}
                  >
                    {tower.status || 'Belum Terdata'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Mobile cards */}
        <div className="md:hidden p-3 space-y-3">
          {towers.map((tower) => (
            <button
              key={tower.id}
              className="w-full text-left rounded-lg border border-gray-200 p-4 bg-white shadow-sm active:opacity-90"
              onClick={() => onTowerClick(tower)}
              aria-label={`Detail ${tower.site_name || 'Belum Terdata'}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium text-gray-900 mb-0.5 truncate">{tower.site_name || 'Belum Terdata'}</p>
                  <p className="text-xs text-gray-600">
                    Lat: {formatCoordinate(tower.latitude, 'lat')} · Lng: {formatCoordinate(tower.longitude, 'lng')}
                  </p>
                  <p className="text-xs text-gray-600 mt-1">Tinggi: {tower.tinggi_menara ? `${tower.tinggi_menara}m` : 'Belum Terdata'} · Owner: {tower.owner || 'Belum Terdata'}</p>
                  <p
                    className="text-xs text-gray-600 mt-1"
                    style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
                  >
                    {tower.alamat_menara || 'Belum Terdata'}
                  </p>
                </div>
                <div className="flex items-start gap-2 shrink-0">
                  <span 
                    className="inline-block px-2.5 py-1 rounded-full text-[10px] font-medium text-white whitespace-nowrap"
                    style={{ 
                      backgroundColor: tower.status === 'Aktif' || tower.status === 'AKTIF' 
                        ? '#1B5E20' 
                        : !tower.status 
                          ? '#6B7280' 
                          : '#212121'
                    }}
                  >
                    {tower.status || 'Belum Terdata'}
                  </span>
                  <span className="material-icons-outlined text-gray-400 text-base">chevron_right</span>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Pagination */}
      <div className="px-4 py-3 border-t flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <p className="text-xs sm:text-sm text-gray-600">
          Menampilkan {(currentPage - 1) * perPage + 1} - {Math.min(currentPage * perPage, total)} dari {total} data
        </p>
        <div className="flex self-end sm:self-auto">
          <button 
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className={`px-3 py-1 rounded-l border ${
              currentPage === 1 
              ? 'bg-gray-100 text-gray-400' 
              : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            Prev
          </button>
          
          {/* Numeric pagination */}
          {Array.from({ length: Math.min(5, lastPage) }).map((_, i) => {
            // Calculate the page number to display
            let pageNum: number;
            
            if (lastPage <= 5) {
              // If 5 or fewer total pages, show all page numbers 1-5
              pageNum = i + 1;
            } else if (currentPage <= 3) {
              // If we're on pages 1-3, show pages 1-5
              pageNum = i + 1;
            } else if (currentPage >= lastPage - 2) {
              // If we're on the last 3 pages, show the last 5 pages
              pageNum = lastPage - 4 + i;
            } else {
              // Otherwise show 2 pages before and 2 pages after current page
              pageNum = currentPage - 2 + i;
            }
            
            // Only render if page number is valid (1 to lastPage)
            if (pageNum >= 1 && pageNum <= lastPage) {
              return (
                <button
                  key={pageNum}
                  onClick={() => onPageChange(pageNum)}
                  className={`px-3 py-1 border-t border-b ${
                    pageNum === currentPage
                      ? 'font-medium text-white'
                      : 'bg-white hover:bg-gray-50'
                  }`}
                  style={pageNum === currentPage ? { backgroundColor: '#B71C1C' } : { color: '#212121' }}
                >
                  {pageNum}
                </button>
              );
            }
            return null;
          })}
          
          <button 
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage * perPage >= total}
            className={`px-3 py-1 rounded-r border ${
              currentPage * perPage >= total 
              ? 'bg-gray-100 text-gray-400' 
              : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
