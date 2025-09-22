import React, { useMemo, useState, useRef } from 'react';
import { Head, router } from '@inertiajs/react';
import MainLayout from '@/Layouts/MainLayout';
import HeroSection from '@/Components/HeroSection';
import TowerDetailModal from '@/Components/TowerDetailModal';
import AlertToast from '@/Components/AlertToast';

import TowerStats from '@/Components/DataTower/TowerStats';
import TowerMap from '@/Components/DataTower/TowerMap';
import TowerTable from '@/Components/DataTower/TowerTable';
import TowerFilters from '@/Components/DataTower/TowerFilters';

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

export default function DataTowerIndex({ 
  towers = [], 
  mapTowers = [],
  availableOwners = [],
  currentPage = 1, 
  perPage = 10, 
  total = 0,
  lastPage = 1
}: DataTowerProps) {
  const [searchTerm, setSearchTerm] = useState<string>(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('search') || '';
  });
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
      ...(params.search && params.search.trim() && { search: params.search.trim() }),
      ...(params.coord && params.coord !== 'all' && { coord: params.coord }),
      ...(params.owner && params.owner !== 'all' && { owner: params.owner })
    };

    return cleanParams;
  };

  // Use owners from backend (those that actually have tower relationships)
  const uniqueOwners = useMemo(() => {
    return [...availableOwners].sort();
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

  const handleTowerClick = (tower: Tower) => {
    setSelectedTower(tower);
    setDetailModalOpen(true);
  };

  const handleMarkerClick = (towerData: Tower) => {
    setSelectedTower(towerData);
    setDetailModalOpen(true);
  };

  const handleViewMap = (tower: Tower) => {
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
  };

  return (
    <MainLayout title="Data Tower" currentPage="/data-tower">
      <Head title="Data Tower" />

      {/* Hero Section */}
      <div className="px-4 sm:px-6 mb-6">
        <HeroSection
          title={<>
            Selamat datang di TowerTrack
            <span className="block">Monitoring Tower Kabupaten Semarang</span>
          </>}
          subtitle="Pantau persebaran tower, jangkauan, dan data penting lainnya dalam satu tempat."
          variant="brand"
          align="center"
          actions={
            <>
              <button
                onClick={() => {
                  const mapElement = document.getElementById('map-section');
                  if (mapElement) mapElement.scrollIntoView({ behavior: 'smooth' });
                }}
                className="inline-flex items-center justify-center px-5 py-2.5 bg-white/10 hover:bg-white/15 text-white rounded-lg border border-white/20 transition-colors"
              >
                Lihat Peta
              </button>
              <button
                onClick={() => {
                  const tableTop = document.querySelector('#data-table-top');
                  if (tableTop) (tableTop as HTMLElement).scrollIntoView({ behavior: 'smooth' });
                }}
                className="inline-flex items-center justify-center px-5 py-2.5 bg-white text-red-700 hover:text-red-800 rounded-lg shadow-sm"
              >
                Lihat Tabel
              </button>
            </>
          }
        />
      </div>

      <div className="p-4 sm:p-6">
        {/* Statistics Header */}
        <TowerStats 
          total={total}
          towers={towers}
          mapMarkersCount={markers.length}
          ownerFilter={ownerFilter}
        />

        {/* Map Section */}
        <TowerMap
          markers={markers}
          mode={mode}
          setMode={setMode}
          distance={distance}
          resetLinesCounter={resetLinesCounter}
          setResetLinesCounter={setResetLinesCounter}
          onDistanceChange={setDistance}
          onMarkerClick={handleMarkerClick}
          ownerFilter={ownerFilter}
          setOwnerFilter={setOwnerFilter}
          buildFilterParams={buildFilterParams}
          mapRef={mapRef}
        />

        {/* Table Section */}
        <div className="bg-white rounded-lg shadow" id="data-table-top">
          <div className="p-4 border-b grid grid-cols-1 md:grid-cols-2 gap-3 items-center">
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.get('/data-fo')}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V7.618a1 1 0 01.553-.894L9 4l6 3 6-3 6 3v8.764a1 1 0 01-.553.894L21 20l-6-3-6 3z" />
                </svg>
                Jalur FO
              </button>
            </div>

            <TowerFilters
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              coordFilter={coordFilter}
              setCoordFilter={setCoordFilter}
              ownerFilter={ownerFilter}
              setOwnerFilter={setOwnerFilter}
              uniqueOwners={uniqueOwners}
              onSearch={handleSearch}
              buildFilterParams={buildFilterParams}
            />
          </div>

          <TowerTable
            towers={towers}
            currentPage={currentPage}
            perPage={perPage}
            total={total}
            lastPage={lastPage}
            onTowerClick={handleTowerClick}
            onPageChange={onPageChange}
          />
        </div>
      </div>
      
      {/* Tower Detail Modal */}
      <TowerDetailModal 
        isOpen={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        tower={selectedTower}
        onViewMap={handleViewMap}
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


    </MainLayout>
  );
}
