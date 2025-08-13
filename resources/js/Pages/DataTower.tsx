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
  availableOwners: string[]; // List of owners that have towers (from backend)
  currentPage: number;
  perPage: number;
  total: number;
  lastPage: number; // Total number of pages
}

const DataTower: React.FC<DataTowerProps> = ({ 
  towers = [], 
  mapTowers = [],
  availableOwners = [],
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
  const [ownerFilter, setOwnerFilter] = useState<string>(() => {
    const params = new URLSearchParams(window.location.search);
    const v = params.get('owner');
    return v || 'all';
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

  // Utility function to build filter params
  const buildFilterParams = (overrides: Partial<{ search: string; coord: string; owner: string; page: number }> = {}) => {
    const params = {
      search: overrides.search !== undefined ? overrides.search : searchTerm,
      coord: overrides.coord !== undefined ? overrides.coord : coordFilter,
      owner: overrides.owner !== undefined ? overrides.owner : ownerFilter,
      page: overrides.page !== undefined ? overrides.page : 1
    };
    
    // Clean up params - remove 'all' values and empty strings, keep page
    const cleanParams = {
      page: params.page,
      ...(params.search && params.search.trim() && { search: params.search }),
      ...(params.coord && params.coord !== 'all' && { coord: params.coord }),
      ...(params.owner && params.owner !== 'all' && { owner: params.owner })
    };
    
    console.log('=== FILTER PARAMS DEBUG ===');
    console.log('Raw params:', params);
    console.log('Clean params sent to backend:', cleanParams);
    
    return cleanParams;
  };

  // Use owners from backend (those that actually have tower relationships)
  const uniqueOwners = useMemo(() => {
    console.log('=== OWNERS FROM BACKEND ===');
    console.log('Available owners from database:', availableOwners.length);
    console.log('Owner list:', availableOwners);
    
    // Debug: Count towers per owner in current data
    const ownerCounts: Record<string, number> = {};
    mapTowers.forEach(tower => {
      const owner = tower.owner || 'No Owner';
      ownerCounts[owner] = (ownerCounts[owner] || 0) + 1;
    });
    console.log('Tower count per owner in map data:', ownerCounts);
    
    return availableOwners.sort();
  }, [availableOwners, mapTowers]);

  // Use mapTowers (all towers with coordinates) for the map display
  const markers = useMemo(() => mapTowers
    .map(t => {
      const lat = Number(t.latitude);
      const lon = Number(t.longitude);
      return { t, lat, lon };
    })
    .filter(({ t, lat, lon }) => 
      // Coordinate validation
      Number.isFinite(lat) && Number.isFinite(lon) &&
      lat !== 0 && lon !== 0 &&
      Math.abs(lat) <= 90 && Math.abs(lon) <= 180 &&
      // Owner filter
      (ownerFilter === 'all' || t.owner === ownerFilter)
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
        title: t.site_name || 'Belum Terdata',
        description: `${t.alamat_menara || 'Belum Terdata'}${t.tinggi_menara ? `<br/>Tinggi: ${t.tinggi_menara} m` : '<br/>Tinggi: Belum Terdata'}`,
        radiusMeters,
        towerData: t, // Pass the complete tower data
      });
    }), [mapTowers, ownerFilter]);

  const onPageChange = (page: number) => {
    const params = buildFilterParams({ page });
    router.get('/data-tower', params, { preserveState: true });
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Trigger map measurement reset when searching
    setResetLinesCounter(c => c + 1);
    
    const params = buildFilterParams({ search: searchTerm, page: 1 });
    router.get('/data-tower', params, { preserveState: true });
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
        <img src="/images/kab-smg-logo.png" alt="Kabupaten Semarang" className="h-10 w-10 sm:h-12 sm:w-12 hidden sm:block" />
      </div>


      <div className="p-4 sm:p-6">
        {/* Statistics Header */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
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
          <div className="bg-white rounded-lg shadow p-6 border-l-4" style={{ borderLeftColor: '#2563eb' }}>
            <h3 className="text-lg font-medium" style={{ color: '#212121' }}>
              {ownerFilter === 'all' ? 'Tower di Peta' : `Tower ${ownerFilter}`}
            </h3>
            <p className="text-5xl font-bold mt-2" style={{ color: '#2563eb' }}>
              {markers.length}
            </p>
          </div>
        </div>

        {/* Map Section */}
          <div id="map-section" className="bg-white rounded-lg shadow mb-6">
            <div className="p-4 border-b flex flex-col md:flex-row justify-between items-center gap-3">
            <div className="mb-3 md:mb-0">
              <h2 className="text-lg sm:text-xl font-medium">Peta Lokasi Tower</h2>
              {ownerFilter !== 'all' && (
                <p className="text-sm text-gray-600 mt-1">
                  Filter aktif: <span className="font-semibold text-blue-600">{ownerFilter}</span>
                  <button 
                    onClick={() => {
                      setOwnerFilter('all');
                      
                      const params = buildFilterParams({ owner: 'all', page: 1 });
                      router.get('/data-tower', params, { preserveState: true });
                    }}
                    className="ml-2 text-xs text-red-600 hover:underline"
                  >
                    Hapus filter
                  </button>
                </p>
              )}
            </div>
            
              <div className="flex gap-4 items-center w-full md:w-auto md:justify-end">
                {/* Mode Selector */}
                <div className="w-full sm:w-40">
                <select
                  value={mode}
                  onChange={(e) => setMode(e.target.value as Mode)}
                  className="w-full rounded border-gray-300 shadow-sm focus:border-[#B71C1C] focus:ring-[#B71C1C] text-base sm:text-sm"
                  title={mode === 'none' ? 'Mode Pengukuran: Klik marker untuk mengukur jarak. Detail tower tidak dapat diakses.' : 'Mode Coverage: Klik marker untuk melihat detail tower. Pengukuran jarak tidak tersedia.'}
                >
                  <option value="none">Ukur Jarak</option>
                  <option value="coverage">Radius Coverage</option>
                </select>
                {/* Mode instruction text */}
                <p className="text-xs text-gray-600 mt-1 hidden sm:block">
                  {mode === 'none' 
                    ? 'Klik marker untuk mengukur jarak' 
                    : 'Klik marker untuk detail tower'
                  }
                </p>
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
              // Only provide onMarkerClick when NOT in measurement mode to prevent conflicts
              onMarkerClick={mode !== 'none' ? (towerData) => {
                setSelectedTower(towerData);
                setDetailModalOpen(true);
              } : undefined}
            />
          </div>
        </div>

        {/* Table Section */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b grid grid-cols-1 md:grid-cols-2 gap-3 items-center">
            <h2 className="text-lg sm:text-xl font-medium">Data Tower</h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 justify-end md:justify-self-end w-full md:w-auto">
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
                    
                    const params = buildFilterParams({ coord: v, page: 1 });
                    router.get('/data-tower', params, { preserveState: true });
                  }}
                  className="w-full rounded border-gray-300 shadow-sm focus:border-[#B71C1C] focus:ring-[#B71C1C] text-base sm:text-sm"
                >
                  <option value="all">Semua</option>
                  <option value="with">Ada koordinat</option>
                  <option value="without">Tanpa koordinat</option>
                </select>
              </div>

              <div className="w-full">
                <select
                  value={ownerFilter}
                  onChange={(e) => {
                    const v = e.target.value;
                    setOwnerFilter(v);
                    
                    const params = buildFilterParams({ owner: v, page: 1 });
                    router.get('/data-tower', params, { preserveState: true });
                  }}
                  className="w-full rounded border-gray-300 shadow-sm focus:border-[#B71C1C] focus:ring-[#B71C1C] text-base sm:text-sm"
                  title="Filter berdasarkan pemilik tower"
                >
                  <option value="all">Semua Pemilik</option>
                  {uniqueOwners.map(owner => (
                    <option key={owner} value={owner}>{owner}</option>
                  ))}
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
                    <td className="px-4 py-3 border-b">{tower.site_name || 'Belum Terdata'}</td>
                    <td className="px-4 py-3 border-b">
                      {(() => {
                        const lat = Number(tower.latitude);
                        const lon = Number(tower.longitude);
                        // Check if coordinates are valid (not null, not 0, and finite numbers)
                        const latStr = Number.isFinite(lat) && lat !== 0
                          ? lat.toFixed(6)
                          : (typeof tower.latitude === 'string' && tower.latitude.trim() !== '' && tower.latitude !== '0' ? tower.latitude : 'Belum Terdata');
                        const lonStr = Number.isFinite(lon) && lon !== 0
                          ? lon.toFixed(6)
                          : (typeof tower.longitude === 'string' && tower.longitude.trim() !== '' && tower.longitude !== '0' ? tower.longitude : 'Belum Terdata');
                        return (
                          <>
                            Lat: {latStr}<br/>
                            Lng: {lonStr}
                          </>
                        );
                      })()}
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
                  onClick={() => {
                    setSelectedTower(tower);
                    setDetailModalOpen(true);
                  }}
                  aria-label={`Detail ${tower.site_name || 'Belum Terdata'}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900 mb-0.5 truncate">{tower.site_name || 'Belum Terdata'}</p>
                      <p className="text-xs text-gray-600">
                        {(() => {
                          const lat = Number(tower.latitude);
                          const lon = Number(tower.longitude);
                          // Check if coordinates are valid (not null, not 0, and finite numbers)
                          const latStr = Number.isFinite(lat) && lat !== 0
                            ? lat.toFixed(6)
                            : (typeof tower.latitude === 'string' && tower.latitude.trim() !== '' && tower.latitude !== '0' ? tower.latitude : 'Belum Terdata');
                          const lonStr = Number.isFinite(lon) && lon !== 0
                            ? lon.toFixed(6)
                            : (typeof tower.longitude === 'string' && tower.longitude.trim() !== '' && tower.longitude !== '0' ? tower.longitude : 'Belum Terdata');
                          return `Lat: ${latStr} · Lng: ${lonStr}`;
                        })()}
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
              title: 'Koordinat Belum Terdata',
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