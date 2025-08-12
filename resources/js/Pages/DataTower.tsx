import React, { useMemo, useState, useRef } from 'react';
import { Head, router } from '@inertiajs/react';
import MainLayout from '@/Layouts/MainLayout';
import LeafletMap from '@/Components/LeafletMap';
import TowerDetailModal from '@/Components/TowerDetailModal';
import AlertToast from '@/Components/AlertToast';
import Footer from '@/Components/Footer';

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

interface DataTowerProps {
  towers: Tower[];
  mapTowers: Tower[]; // All towers for map display
  currentPage: number;
  perPage: number;
  total: number;
  lastPage: number; // Total number of pages
}

const DataTower: React.FC<DataTowerProps> = ({ 
  towers = [], 
  mapTowers = [],
  currentPage = 1, 
  perPage = 10, 
  total = 0,
  lastPage = 1
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [distance, setDistance] = useState<number>(0);
  const [coordFilter, setCoordFilter] = useState<'all' | 'with' | 'without'>(() => {
    const params = new URLSearchParams(window.location.search);
    const v = params.get('coord');
    if (v === 'with' || v === 'without') return v;
    return 'all';
  });
  const [resetLinesCounter, setResetLinesCounter] = useState<number>(0);
  
  // Mode state
  type Mode = 'none' | 'coverage';
  const [mode, setMode] = useState<Mode>('coverage'); // Default to coverage mode
  
  // Radius diukur otomatis per menara berdasarkan data; tidak ada input manual
  
  // For tower detail modal
  const [selectedTower, setSelectedTower] = useState<Tower | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState<boolean>(false);
  const mapRef = useRef<any>(null);

  // Pretty toast alert for UX
  const [toast, setToast] = useState<{ show: boolean; type: 'info' | 'success' | 'warning' | 'error'; title?: string; message?: string }>({ show: false, type: 'warning' });

  // Use mapTowers (all towers with coordinates) for the map display
  const markers = useMemo(() => mapTowers
    .map(t => {
      const lat = Number(t.latitude);
      const lon = Number(t.longitude);
      return { t, lat, lon };
    })
    .filter(({ lat, lon }) => 
      Number.isFinite(lat) && Number.isFinite(lon) &&
      lat !== 0 && lon !== 0 &&
      Math.abs(lat) <= 90 && Math.abs(lon) <= 180
    )
    .map(({ t, lat, lon }) => {
      let radiusMeters: number | undefined = undefined;
      
      if (typeof t.tinggi_menara === 'number' && t.tinggi_menara > 0) {
        radiusMeters = Math.min(Math.max(t.tinggi_menara * 8, 100), 3000);
      }

      if ((radiusMeters === undefined || !Number.isFinite(radiusMeters)) && t.site_type) {
        const st = t.site_type.toLowerCase();
        if (st.includes('rooftop')) radiusMeters = 250;
        else if (st.includes('sst') || st.includes('monopole')) radiusMeters = 400;
        else if (st.includes('guyed') || st.includes('lattice') || st.includes('sstl')) radiusMeters = 600;
        else radiusMeters = 500; // generic default
      }

      if (radiusMeters === undefined) {
        radiusMeters = 500;
      }

      return ({
        position: [lat, lon] as [number, number],
        title: t.site_name,
        description: `${t.alamat_menara ?? ''}${t.tinggi_menara ? `<br/>Tinggi: ${t.tinggi_menara} m` : ''}`,
        radiusMeters,
      });
    }), [mapTowers]);

  const onPageChange = (page: number) => {
    router.get('/data-tower', { page, search: searchTerm, coord: coordFilter }, { preserveState: true });
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Trigger map measurement reset when searching
    setResetLinesCounter(c => c + 1);
    router.get('/data-tower', { search: searchTerm, coord: coordFilter, page: 1 }, { preserveState: true });
  };

  return (
    <MainLayout title="Data Tower" currentPage="/data-tower">
      <Head title="Data Tower" />

      {/* Welcome Bar */}
      <div className="px-4 sm:px-6 py-6 mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between rounded" style={{ backgroundColor: '#FFF8E1' }}>
        <div className="mb-3 sm:mb-0">
          <h2 className="text-xl sm:text-2xl font-bold leading-snug" style={{ color: '#212121' }}>Selamat datang di TowerTrack!</h2>
          <p className="mt-1 text-sm sm:text-base" style={{ color: '#212121', opacity: 0.8 }}>
            Sistem monitoring tower telekomunikasi di Kabupaten Semarang.
          </p>
        </div>
        <img src="/images/dprd-logo.png" alt="DPRD Kabupaten Semarang" className="h-10 w-10 sm:h-12 sm:w-12 hidden sm:block" />
      </div>


      <div className="p-4 sm:p-6">
        {/* Statistics Header */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow p-6 border-l-4" style={{ borderLeftColor: '#B71C1C' }}>
            <h3 className="text-lg font-medium" style={{ color: '#212121' }}>Total Tower</h3>
            <p className="text-5xl font-bold mt-2" style={{ color: '#B71C1C' }}>{total}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6 border-l-4" style={{ borderLeftColor: '#1B5E20' }}>
            <h3 className="text-lg font-medium" style={{ color: '#212121' }}>Tower Aktif</h3>
            <p className="text-5xl font-bold mt-2" style={{ color: '#1B5E20' }}>
              {towers.filter(t => t.status === 'Aktif' || t.status === 'AKTIF').length}
            </p>
          </div>
        </div>

        {/* Map Section */}
          <div id="map-section" className="bg-white rounded-lg shadow mb-6">
            <div className="p-4 border-b flex flex-col md:flex-row justify-between items-center gap-3">
            <h2 className="text-lg sm:text-xl font-medium mb-3 md:mb-0">Peta Lokasi Tower</h2>
            
              <div className="flex gap-4 items-center w-full md:w-auto md:justify-end">
                {/* Mode Selector */}
                <div className="w-full sm:w-40">
                <select
                  value={mode}
                  onChange={(e) => setMode(e.target.value as Mode)}
                  className="w-full rounded border-gray-300 shadow-sm focus:border-[#B71C1C] focus:ring-[#B71C1C] text-base sm:text-sm"
                >
                  <option value="none">Ukur Jarak</option>
                  <option value="coverage">Radius Coverage</option>
                </select>
              </div>
              
                {/* Panel jarak dan reset di kanan */}
                {mode === 'none' && (
                  <div className="flex items-center gap-3 w-full md:w-auto">
                    <span className="text-sm text-gray-700">
                      Jarak:
                      <span className="font-semibold ml-1" style={{ color: '#B71C1C' }}>
                        {distance > 0 ? `${distance.toFixed(1)} m${distance > 1000 ? ` (${(distance/1000).toFixed(2)} km)` : ''}` : '-'}
                      </span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setResetLinesCounter(c => c + 1)}
                      className="px-3 py-1.5 rounded-full text-xs font-medium border hover:opacity-90 shrink-0"
                      style={{ backgroundColor: '#FFFFFF', color: '#212121', borderColor: '#212121' }}
                    >
                      Reset
                    </button>
                  </div>
                )}
            </div>
          </div>
          
          <div className="p-0" onWheel={(e) => {
            // Prevent wheel events from bubbling to the page when cursor is over the map container
            const target = e.target as HTMLElement;
            if (target && target.closest('#map-section')) {
              e.stopPropagation();
            }
          }}>
            <LeafletMap
              ref={mapRef}
              center={[-7.197, 110.426]}
              zoom={10}
              style={{ height: '65vh', minHeight: '420px', maxHeight: '760px', width: '100%' }}
              markers={markers}
              showLines={mode === 'none'}
              showCoverage={mode === 'coverage'}
                defaultRadiusMeters={500}
              onDistanceChange={setDistance}
              resetLinesTrigger={resetLinesCounter}
            />
          </div>
        </div>

        {/* Table Section */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b grid grid-cols-1 md:grid-cols-2 gap-3 items-center">
            <h2 className="text-lg sm:text-xl font-medium">Data Tower</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 justify-end md:justify-self-end w-full md:w-auto">
              <form onSubmit={handleSearch} className="w-full">
                <div className="flex items-stretch rounded-full overflow-hidden border border-gray-300 focus-within:ring-2 focus-within:ring-[#B71C1C]">
                  <input 
                    type="text"
                    placeholder="Cari tower"
                    className="w-full px-4 py-2 outline-none border-0 focus:ring-0"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <button 
                    type="submit" 
                    className="bg-red-800 text-white px-3 sm:px-4 flex items-center justify-center shrink-0" style={{ backgroundColor: '#B71C1C' }}
                    aria-label="Cari"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
                      <path fillRule="evenodd" d="M10.5 3.75a6.75 6.75 0 104.243 12.01l4.249 4.248a.75.75 0 101.06-1.06l-4.248-4.25A6.75 6.75 0 0010.5 3.75zm-5.25 6.75a5.25 5.25 0 1110.5 0 5.25 5.25 0 01-10.5 0z" clipRule="evenodd" />
                    </svg>
                    <span className="hidden sm:inline ml-2">Cari</span>
                  </button>
                </div>
              </form>

              <div className="w-full">
                <select
                  value={coordFilter}
                  onChange={(e) => {
                    const v = e.target.value as 'all' | 'with' | 'without';
                    setCoordFilter(v);
                    router.get('/data-tower', { search: searchTerm, coord: v, page: 1 }, { preserveState: true });
                  }}
                  className="w-full rounded border-gray-300 shadow-sm focus:border-[#B71C1C] focus:ring-[#B71C1C] text-base sm:text-sm"
                >
                  <option value="all">Semua</option>
                  <option value="with">Ada koordinat</option>
                  <option value="without">Tanpa koordinat</option>
                </select>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            {/* Table for md+ and cards for mobile */}
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
                    onClick={() => {
                      setSelectedTower(tower);
                      setDetailModalOpen(true);
                    }}
                  >
                    <td className="px-4 py-3 border-b">{tower.site_name}</td>
                    <td className="px-4 py-3 border-b">
                      {(() => {
                        const lat = Number(tower.latitude);
                        const lon = Number(tower.longitude);
                        const latStr = Number.isFinite(lat)
                          ? lat.toFixed(6)
                          : (typeof tower.latitude === 'string' && tower.latitude.trim() !== '' ? tower.latitude : '-');
                        const lonStr = Number.isFinite(lon)
                          ? lon.toFixed(6)
                          : (typeof tower.longitude === 'string' && tower.longitude.trim() !== '' ? tower.longitude : '-');
                        return (
                          <>
                            Lat: {latStr}<br/>
                            Lng: {lonStr}
                          </>
                        );
                      })()}
                    </td>
                    <td className="px-4 py-3 border-b">{tower.tinggi_menara}m</td>
                    <td className="px-4 py-3 border-b">{tower.owner || 'TELKOM'}</td>
                    <td className="px-4 py-3 border-b">{tower.alamat_menara || '-'}</td>
                    <td className="px-4 py-3 border-b">
                      <span 
                        className="inline-block px-3 py-1 rounded-full text-xs font-medium text-white"
                        style={{ 
                          backgroundColor: tower.status === 'Aktif' || tower.status === 'AKTIF' ? '#1B5E20' : '#212121'
                        }}
                      >
                        {tower.status || 'Aktif'}
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
                  onClick={() => {
                    setSelectedTower(tower);
                    setDetailModalOpen(true);
                  }}
                  aria-label={`Detail ${tower.site_name}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900 mb-0.5 truncate">{tower.site_name}</p>
                      <p className="text-xs text-gray-600">
                        {(() => {
                          const lat = Number(tower.latitude);
                          const lon = Number(tower.longitude);
                          const latStr = Number.isFinite(lat)
                            ? lat.toFixed(6)
                            : (typeof tower.latitude === 'string' && tower.latitude.trim() !== '' ? tower.latitude : '-');
                          const lonStr = Number.isFinite(lon)
                            ? lon.toFixed(6)
                            : (typeof tower.longitude === 'string' && tower.longitude.trim() !== '' ? tower.longitude : '-');
                          return `Lat: ${latStr} · Lng: ${lonStr}`;
                        })()}
                      </p>
                      <p className="text-xs text-gray-600 mt-1">Tinggi: {tower.tinggi_menara}m · Owner: {tower.owner || 'TELKOM'}</p>
                      <p
                        className="text-xs text-gray-600 mt-1"
                        style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
                      >
                        {tower.alamat_menara || '-'}
                      </p>
                    </div>
                    <div className="flex items-start gap-2 shrink-0">
                      <span 
                        className="inline-block px-2.5 py-1 rounded-full text-[10px] font-medium text-white whitespace-nowrap"
                        style={{ 
                          backgroundColor: tower.status === 'Aktif' || tower.status === 'AKTIF' ? '#1B5E20' : '#212121'
                        }}
                      >
                        {tower.status || 'Aktif'}
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
      </div>
      
      {/* Tower Detail Modal */}
      <TowerDetailModal 
        isOpen={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        tower={selectedTower}
        onViewMap={(tower) => {
          setDetailModalOpen(false);
          
          // Find the map center point for the tower
          const lat = Number(tower.latitude);
          const lng = Number(tower.longitude);
          
          const hasValidCoords = Number.isFinite(lat) && Number.isFinite(lng) && lat !== 0 && lng !== 0 && Math.abs(lat) <= 90 && Math.abs(lng) <= 180;

          // If valid coordinates, programmatically focus on the tower
          if (hasValidCoords) {
            if (mapRef.current && typeof mapRef.current.flyTo === 'function') {
              mapRef.current.flyTo([lat, lng], 17);
            }
            // Scroll to the map section only when we actually focus the map
            const mapElement = document.getElementById('map-section');
            if (mapElement) {
              mapElement.scrollIntoView({ behavior: 'smooth' });
            }
          } else {
            setToast({
              show: true,
              type: 'warning',
              title: 'Koordinat belum tersedia',
              message: 'Tower ini belum memiliki titik koordinat yang valid, sehingga tidak dapat ditampilkan di peta.',
            });
          }
        }}
      />
      {/* Toast */}
      <AlertToast
        show={toast.show}
        type={toast.type}
        title={toast.title}
        message={toast.message}
        durationMs={3500}
        onClose={() => setToast({ ...toast, show: false })}
      />

      <Footer />
    </MainLayout>
  );
};

export default DataTower;