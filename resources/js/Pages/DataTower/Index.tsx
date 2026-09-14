import React, { useMemo, useState, useRef, useEffect } from 'react';
import { Head, router } from '@inertiajs/react';
import AppBar from '@/Components/AppBar';
import Footer from '@/Components/Footer';
import HeroSection from '@/Components/HeroSection';
import HeroIsoArt from '@/Components/HeroIsoArt';
import AnimatedButton from '@/Components/AnimatedButton';
import TowerDetailModal from '@/Components/DetailModal';
import AlertToast from '@/Components/AlertToast';
import StaggeredContainer from '@/Components/StaggeredContainer';
import { useDebounce } from '@/Hooks/useDebounce';

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
  totalActiveTowers: number; // Total active towers count
}

export default function DataTowerIndex({ 
  towers = [], 
  mapTowers = [],
  availableOwners = [],
  currentPage = 1, 
  perPage = 10, 
  total = 0,
  lastPage = 1,
  totalActiveTowers = 0
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
  
  // Map toggles
  const [measureEnabled, setMeasureEnabled] = useState<boolean>(false);
  const [showCoverage, setShowCoverage] = useState<boolean>(true);
  
  // For tower detail modal
  const [selectedTower, setSelectedTower] = useState<Tower | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState<boolean>(false);
  const mapRef = useRef<any>(null);
  const initialSearchMountRef = useRef<boolean>(true);
  const lastAppliedSearchRef = useRef<string>(searchTerm);
  
  // Debounce search term
  const debouncedSearchTerm = useDebounce(searchTerm, 800);

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
    router.get('/data-tower', params, { 
      preserveState: true, 
      preserveScroll: true,
      onSuccess: () => {
        // Scroll to table section after pagination (same as "Lihat Tabel" button)
        const tableTop = document.querySelector('#data-table-top');
        if (tableTop) (tableTop as HTMLElement).scrollIntoView({ behavior: 'smooth' });
      }
    });
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Trigger map measurement reset when searching
    setResetLinesCounter(c => c + 1);
    
    const params = buildFilterParams({ search: searchTerm, page: 1 });
    lastAppliedSearchRef.current = searchTerm;
    router.get('/data-tower', params, { preserveState: true, preserveScroll: true, replace: true });
  };

  // Debounced real-time search - optimized timing for better performance
  useEffect(() => {
    // Skip running on initial mount to avoid duplicate initial fetch
    if (initialSearchMountRef.current) {
      initialSearchMountRef.current = false;
      return;
    }

    // Avoid re-applying the same search
    if (lastAppliedSearchRef.current === debouncedSearchTerm) return;

    setResetLinesCounter(c => c + 1);
    const params = buildFilterParams({ search: debouncedSearchTerm, page: 1 });
    lastAppliedSearchRef.current = debouncedSearchTerm;
    router.get('/data-tower', params, { preserveState: true, preserveScroll: true, replace: true });
  }, [debouncedSearchTerm]);

  const handleTowerClick = (tower: Tower) => {
    setSelectedTower(tower);
    setDetailModalOpen(true);
  };

  const handleMarkerClick = (towerData: Tower) => {
    setSelectedTower(towerData);
    setDetailModalOpen(true);
  };

  const handleViewMap = (tower: Tower) => {
    // Modal sudah ditutup dari TowerDetailModal, jadi tidak perlu setDetailModalOpen(false) lagi
    
    // Find the map center point for the tower
    const lat = Number(tower.latitude);
    const lng = Number(tower.longitude);
    
    const hasValidCoords = Number.isFinite(lat) && Number.isFinite(lng) && lat !== 0 && lng !== 0 && Math.abs(lat) <= 90 && Math.abs(lng) <= 180;

    // If valid coordinates, programmatically focus on the tower
    if (hasValidCoords) {
      // Pastikan body position sudah direstore (safety check)
      if (document.body.style.position === 'fixed') {
        const scrollY = document.body.style.top ? -parseInt(document.body.style.top) : window.scrollY;
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        document.body.style.overflow = '';
        window.scrollTo(0, scrollY);
      }
      
      // Focus ke peta
      if (mapRef.current && typeof mapRef.current.flyTo === 'function') {
        mapRef.current.flyTo([lat, lng], 17);
      }
      
      // Scroll to the map section - sekarang sudah aman karena body position sudah direstore
      const mapElement = document.getElementById('map-section');
      if (mapElement) {
        mapElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    } else {
      setToast({
        show: true,
        type: 'warning',
        title: 'Koordinat Belum Terdata',
        message: 'Menara ini belum memiliki titik koordinat yang valid, sehingga tidak dapat ditampilkan di peta.',
      });
    }
  };

  return (
    <div className="min-h-screen bg-canvas flex flex-col">
      <Head title="Data Menara" />
      
      {/* App Bar */}
      <AppBar currentPage="/data-tower" />
      
      {/* Hero. Identical configuration to /data-fo — same variant, same
          align, same (absent) fullScreen — so the two public pages share one
          band height instead of the 474px/425px they used to render. */}
      <HeroSection
        eyebrow="Kabupaten Semarang"
        title="Data Menara Telekomunikasi"
        subtitle="Pantau sebaran menara, jangkauan, dan perizinan infrastruktur telekomunikasi dalam satu tempat."
        variant="brand"
        align="left"
        art={<HeroIsoArt variant="tower" />}
        fullScreen
        actions={
          <>
            <AnimatedButton
              variant="primary"
              size="lg"
              onClick={() => document.getElementById('map-section')?.scrollIntoView({ behavior: 'smooth' })}
            >
              Lihat Peta
            </AnimatedButton>
            <AnimatedButton
              variant="outline"
              size="lg"
              onClick={() => document.querySelector('#data-table-top')?.scrollIntoView({ behavior: 'smooth' })}
            >
              Lihat Tabel
            </AnimatedButton>
          </>
        }
      />

      {/* Content Section */}
      <div className="flex-1">
        <div className="mx-auto w-full max-w-screen-2xl px-4 sm:px-6 lg:px-10">
          <main className="py-5 space-y-5">
              {/* Statistik + layanan, rapat di satu baris. */}
              <TowerStats
                total={total}
                towers={towers}
                mapMarkersCount={markers.length}
                ownerFilter={ownerFilter}
                totalActiveTowers={totalActiveTowers}
              />


              {/* Map Section — the subject of this page, so it comes first and
                  carries the only elevated surface on the screen. */}
              <StaggeredContainer delay={0} animationType="fadeInUp" duration={260}>
                <TowerMap
                  markers={markers}
                  measureEnabled={measureEnabled}
                  setMeasureEnabled={setMeasureEnabled}
                  showCoverage={showCoverage}
                  setShowCoverage={setShowCoverage}
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
              </StaggeredContainer>

              {/* Table Section */}
              <StaggeredContainer delay={80} animationType="fadeInUp" duration={260}>
                <div className="rounded-lg border border-border bg-card shadow-xs" id="data-table-top">
                <div className="border-b border-border bg-well p-4 rounded-t-lg">
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

                <div id="tower-table-section">
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
              </StaggeredContainer>
          </main>
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
      
      {/* Footer */}
      <Footer />
    </div>
  );
}
