import React, { useMemo, useState, useRef } from 'react';
import { Head, router } from '@inertiajs/react';
import MainLayout from '@/Layouts/MainLayout';
import LeafletMap from '@/Components/LeafletMap';
import TowerDetailModal from '@/Components/TowerDetailModal';

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
  const [resetLinesCounter, setResetLinesCounter] = useState<number>(0);
  
  // Mode state
  type Mode = 'none' | 'coverage';
  const [mode, setMode] = useState<Mode>('coverage'); // Default to coverage mode
  
  // Feature type for polyline/polygon
  type FeatureType = 'polyline' | 'polygon';
  const [featureType, setFeatureType] = useState<FeatureType>('polyline');
  
  // Radius for coverage circles
  const [radius, setRadius] = useState<number>(500);
  
  // For tower detail modal
  const [selectedTower, setSelectedTower] = useState<Tower | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState<boolean>(false);
  const mapRef = useRef<any>(null);

  // Use mapTowers (all towers with coordinates) for the map display
  const markers = useMemo(() => mapTowers
    .map(t => {
      const lat = Number(t.latitude);
      const lon = Number(t.longitude);
      return { t, lat, lon };
    })
    .filter(({ lat, lon }) => Number.isFinite(lat) && Number.isFinite(lon))
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
    router.get('/data-tower', { page }, { preserveState: true });
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    router.get('/data-tower', { search: searchTerm, page: 1 }, { preserveState: true });
  };

  return (
    <MainLayout title="Data Tower" currentPage="/data-tower">
      <Head title="Data Tower" />

      <div className="p-6">
        {/* Statistics Header */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-700">Total Tower</h3>
            <p className="text-5xl font-bold text-blue-500 mt-2">{total}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-700">Tower Aktif</h3>
            <p className="text-5xl font-bold text-green-500 mt-2">
              {towers.filter(t => t.status === 'Aktif' || t.status === 'AKTIF').length}
            </p>
          </div>
        </div>

        {/* Map Section */}
        <div id="map-section" className="bg-white rounded-lg shadow mb-6">
          <div className="p-4 border-b flex flex-col md:flex-row justify-between items-center">
            <h2 className="text-xl font-medium mb-3 md:mb-0">Peta Lokasi Tower</h2>
            
            <div className="flex gap-4 items-center">
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
              
              {/* Feature Type or Radius Selector */}
              {mode === 'none' ? (
                <div className="w-40">
                  <select
                    value={featureType}
                    onChange={(e) => {
                      setFeatureType(e.target.value as FeatureType);
                      setResetLinesCounter(c => c + 1); // Reset when changing feature type
                    }}
                    className="w-full rounded border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 text-sm"
                  >
                    <option value="polyline">Polyline (garis)</option>
                    <option value="polygon">Polygon (area)</option>
                  </select>
                </div>
              ) : (
                <div className="w-40">
                  <input
                    type="number"
                    min={10}
                    step={10}
                    value={radius}
                    onChange={(e) => setRadius(Number(e.target.value) || 0)}
                    placeholder="Radius (m)"
                    className="w-full rounded border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 text-sm"
                  />
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
              defaultRadiusMeters={radius}
              onDistanceChange={setDistance}
              resetLinesTrigger={resetLinesCounter}
              featureType={featureType}
            />
            
            {/* Distance measurement display */}
            {mode === 'none' && distance > 0 && (
              <div className="p-3 bg-gray-50 border-t">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium text-gray-700">
                    Jarak: <span className="text-purple-600 font-semibold">
                      {distance.toFixed(1)} m{distance > 1000 ? ` (${(distance/1000).toFixed(2)} km)` : ''}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setResetLinesCounter(c => c + 1)}
                    className="px-3 py-1 rounded bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-medium border"
                  >
                    Reset
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Table Section */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b flex flex-col md:flex-row justify-between items-center">
            <h2 className="text-xl font-medium mb-3 md:mb-0">Data Tower</h2>
            
            <form onSubmit={handleSearch} className="w-full md:w-64">
              <div className="relative">
                <input 
                  type="text"
                  placeholder="Cari tower..."
                  className="w-full rounded-full border-gray-300 pr-10 focus:border-purple-500 focus:ring-purple-500"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <button 
                  type="submit" 
                  className="absolute right-0 top-0 rounded-r-full px-4 h-full bg-purple-600 text-white"
                >
                  <span className="material-icons text-sm">search</span>
                </button>
              </div>
            </form>
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
                      Lat: {typeof tower.latitude === 'number' ? tower.latitude.toFixed(4) : tower.latitude}<br/>
                      Lng: {typeof tower.longitude === 'number' ? tower.longitude.toFixed(4) : tower.longitude}
                    </td>
                    <td className="px-4 py-3 border-b">{tower.tinggi_menara}m</td>
                    <td className="px-4 py-3 border-b">{tower.owner || 'TELKOM'}</td>
                    <td className="px-4 py-3 border-b">{tower.alamat_menara || '-'}</td>
                    <td className="px-4 py-3 border-b">
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                        tower.status === 'Aktif' || tower.status === 'AKTIF' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'
                      }`}>
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
                          ? 'bg-purple-100 text-purple-700 font-medium'
                          : 'bg-white text-gray-700 hover:bg-gray-50'
                      }`}
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
          
          // If we have the map ref available, we can programmatically focus on the tower
          if (mapRef.current && typeof mapRef.current.flyTo === 'function') {
            mapRef.current.flyTo([lat, lng], 17);
          }
          
          // Scroll to the map section
          const mapElement = document.getElementById('map-section');
          if (mapElement) {
            mapElement.scrollIntoView({ behavior: 'smooth' });
          }
        }}
      />
    </MainLayout>
  );
};

export default DataTower;
