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

      {/* Welcome Card */}
      <div className="text-white px-8 py-10 mb-6 text-center" style={{ backgroundColor: '#C21807' }}>
        <h2 className="text-3xl font-bold leading-snug" style={{ color: '#FFD700' }}>Selamat datang di TowerTrack!</h2>
        <p className="mt-3 text-xl opacity-90 leading-relaxed">
        Sistem monitoring tower telekomunikasi di Kabupaten Semarang.
        </p>
      </div>


      <div className="p-6">
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
            <h2 className="text-xl font-medium mb-3 md:mb-0">Peta Lokasi Tower</h2>
            
              <div className="flex gap-4 items-center w-full md:w-auto md:justify-end">
                {/* Mode Selector */}
                <div className="w-40">
                <select
                  value={mode}
                  onChange={(e) => setMode(e.target.value as Mode)}
                  className="w-full rounded border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 text-sm"
                >
                  <option value="none">Ukur Jarak</option>
                  <option value="coverage">Radius Coverage</option>
                </select>
              </div>
              
                {/* Panel jarak dan reset di kanan */}
                {mode === 'none' && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-700 whitespace-nowrap">
                      Jarak: <span className="text-purple-600 font-semibold">
                        {distance > 0 ? `${distance.toFixed(1)} m${distance > 1000 ? ` (${(distance/1000).toFixed(2)} km)` : ''}` : '-'}
                      </span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setResetLinesCounter(c => c + 1)}
                      className="px-3 py-1 rounded bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-medium border"
                    >
                      Reset
                    </button>
                  </div>
                )}
            </div>
          </div>
          
          <div className="p-0">
            <LeafletMap
              ref={mapRef}
              center={[-7.197, 110.426]}
              zoom={10}
              style={{ height: '500px' }}
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
          <div className="p-4 border-b flex flex-col md:flex-row justify-between items-center gap-3">
            <h2 className="text-xl font-medium mb-3 md:mb-0">Data Tower</h2>

            <div className="flex items-center gap-3 w-full md:w-auto">
              <form onSubmit={handleSearch} className="w-full md:w-64">
                <div className="relative">
                  <input 
                    type="text"
                    placeholder="Cari tower..."
                    className="w-full rounded-full border-gray-300 pr-10 focus:outline-none focus:ring-2"
                    style={{ '--tw-ring-color': '#B71C1C' } as React.CSSProperties}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <button 
                    type="submit" 
                    className="absolute right-0 top-0 rounded-r-full px-4 h-full text-white hover:opacity-90"
                    style={{ backgroundColor: '#B71C1C' }}
                  >
                    <span className="material-icons text-sm">search</span>
                  </button>
                </div>
              </form>

              <div className="w-full md:w-56">
                <select
                  value={coordFilter}
                  onChange={(e) => {
                    const v = e.target.value as 'all' | 'with' | 'without';
                    setCoordFilter(v);
                    router.get('/data-tower', { search: searchTerm, coord: v, page: 1 }, { preserveState: true });
                  }}
                  className="w-full rounded border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 text-sm"
                >
                  <option value="all">Semua data (dengan & tanpa koordinat)</option>
                  <option value="with">Hanya yang punya koordinat</option>
                  <option value="without">Hanya yang tanpa koordinat</option>
                </select>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
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
          </div>

          {/* Pagination */}
          <div className="px-4 py-3 border-t flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Menampilkan {(currentPage - 1) * perPage + 1} - {Math.min(currentPage * perPage, total)} dari {total} data
            </p>
            <div className="flex">
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