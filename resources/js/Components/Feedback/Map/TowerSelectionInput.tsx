import React, { useState, useMemo } from 'react';
import TowerSearchInput from '@/Components/TowerSearchInput';
import LeafletMap from '@/Components/LeafletMap';
import { Tower as BaseTower, filterTowers } from '@/utils/searchUtils';

interface Tower extends BaseTower {
  latitude: number | string;
  longitude: number | string;
  tinggi_menara?: number;
  site_type?: string | null;
  owner?: string;
  status?: string;
}

interface TowerSelectionInputProps {
  towers: Tower[];
  selectedTowerId?: string;
  selectedTowerDisplay?: string;
  onTowerSelect: (tower: Tower) => void;
  onClear?: () => void;
  label?: string;
  required?: boolean;
  error?: boolean;
  errorMessage?: string;
  className?: string;
}

type MapFilterType = 'all' | 'with_coordinates' | 'without_coordinates';

export default function TowerSelectionInput({
  towers,
  selectedTowerId,
  selectedTowerDisplay,
  onTowerSelect,
  onClear,
  label = "Lokasi Menara",
  required = false,
  error = false,
  errorMessage,
  className = ""
}: TowerSelectionInputProps) {
  const [selectionMode, setSelectionMode] = useState<'search' | 'map'>('search');
  const [searchTerm, setSearchTerm] = useState('');
  const [mapFilter, setMapFilter] = useState<MapFilterType>('all');

  // Enhanced clear handler that also clears the search term
  const handleClear = () => {
    setSearchTerm('');
    onClear?.();
  };

  // Helper function to check if tower has valid coordinates
  const hasValidCoordinates = (tower: Tower): boolean => {
    const lat = Number(tower.latitude);
    const lon = Number(tower.longitude);
    return (
      Number.isFinite(lat) && Number.isFinite(lon) &&
      lat !== 0 && lon !== 0 &&
      Math.abs(lat) <= 90 && Math.abs(lon) <= 180
    );
  };

  // Calculate tower statistics
  const towerStats = useMemo(() => {
    const total = towers.length;
    const withCoordinates = towers.filter(hasValidCoordinates).length;
    const withoutCoordinates = total - withCoordinates;
    return { total, withCoordinates, withoutCoordinates };
  }, [towers]);

  // Apply map filter first, then search term
  const filteredTowers = useMemo(() => {
    let filtered = towers;
    
    // Apply coordinate filter
    if (mapFilter === 'with_coordinates') {
      filtered = towers.filter(hasValidCoordinates);
    } else if (mapFilter === 'without_coordinates') {
      filtered = towers.filter(tower => !hasValidCoordinates(tower));
    }
    
    // Apply search term filter
    if (searchTerm.trim()) {
      filtered = filterTowers(filtered as BaseTower[], searchTerm) as Tower[];
    }
    
    return filtered;
  }, [towers, mapFilter, searchTerm]);

  // Prepare markers for map display (similar to DataTower Index)
  const markers = useMemo(() => filteredTowers
    .map(t => {
      const lat = Number(t.latitude);
      const lon = Number(t.longitude);
      return { t, lat, lon };
    })
    .filter(({ t, lat, lon }) => 
      // Coordinate validation
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
        title: t.site_name || 'Belum Terdata',
        description: `${t.alamat_menara || 'Belum Terdata'}${t.tinggi_menara ? `<br/>Tinggi: ${t.tinggi_menara} m` : '<br/>Tinggi: Belum Terdata'}`,
        radiusMeters,
        towerData: t, // Pass the complete tower data
      });
    }), [filteredTowers]);

  const handleMapMarkerClick = (towerData: Tower) => {
    onTowerSelect(towerData);
  };

  return (
    <div className={className}>
      {label && (
        <label className="block text-foreground font-medium mb-2">
          {label} {required && <span className="text-destructive">*</span>}
        </label>
      )}

      {/* Mode toggle. A segmented control on the inset ground: the selected
          segment is a raised white pill, which is how a real segmented control
          reads — the previous solid-red fill made a MODE look like a primary
          action. */}
      <div className="mb-3 inline-flex w-full rounded-md border border-border bg-well p-1">
        {([
          { id: 'search', label: 'Cari Teks', path: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z' },
          { id: 'map', label: 'Pilih Peta', path: 'M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z' },
        ] as const).map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => setSelectionMode(m.id)}
            aria-pressed={selectionMode === m.id}
            className={`flex flex-1 items-center justify-center gap-2 rounded-[5px] px-4 py-2 text-sm font-medium transition-colors duration-140 focus-visible:outline-none focus-visible:ring focus-visible:ring-offset-1 ${
              selectionMode === m.id
                ? 'bg-card text-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={m.path} />
            </svg>
            {m.label}
          </button>
        ))}
      </div>

      {/* Coordinate filter.
          This block used to print every count TWICE — a "118 di peta / 50 tanpa
          koordinat" chip row, and then three tall stacked-icon buttons carrying
          the same three numbers again. One row now, counts on the segments that
          set them. */}
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium text-muted-foreground">Tampilkan</span>
        <div className="inline-flex rounded-md border border-border bg-well p-1">
          {([
            { id: 'all', label: 'Semua', n: towerStats.total },
            { id: 'with_coordinates', label: 'Di peta', n: towerStats.withCoordinates },
            { id: 'without_coordinates', label: 'Tanpa koordinat', n: towerStats.withoutCoordinates },
          ] as const).map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setMapFilter(f.id)}
              aria-pressed={mapFilter === f.id}
              className={`flex items-center gap-1.5 rounded-[5px] px-3 py-1.5 text-sm font-medium transition-colors duration-140 focus-visible:outline-none focus-visible:ring focus-visible:ring-offset-1 ${
                mapFilter === f.id
                  ? 'bg-card text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {f.label}
              <span className="tabular-nums text-xs text-muted-foreground">{f.n}</span>
            </button>
          ))}
        </div>
      </div>

      {mapFilter === 'without_coordinates' && selectionMode === 'map' && (
        <div className="mb-3 flex items-start gap-2 rounded-md border border-warning-border bg-warning-soft p-2.5 text-xs text-warning-strong">
          <svg className="mt-px h-4 w-4 shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <span>Menara tanpa koordinat tidak muncul di peta. Gunakan mode &ldquo;Cari Teks&rdquo; untuk memilihnya.</span>
        </div>
      )}

      {/* Selection Interface */}
      {selectionMode === 'search' ? (
        <TowerSearchInput
          towers={filteredTowers as BaseTower[]}
          selectedTowerId={selectedTowerId}
          selectedTowerDisplay={selectedTowerDisplay}
          onTowerSelect={(tower: BaseTower) => onTowerSelect(tower as Tower)}
          onClear={handleClear}
          placeholder="Ketik minimal 1 karakter untuk mencari..."
          required={false}
          error={error}
          errorMessage={errorMessage}
          onSearchTermChange={setSearchTerm}
          searchTerm={searchTerm}
        />
      ) : (
        <div className="space-y-3">
          {/* Selected Tower Display */}
          {selectedTowerId && selectedTowerDisplay && (
            <div className="p-3 bg-success-soft border border-success-border rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-success-strong">Menara Terpilih:</p>
                  <p className="text-sm text-success-strong">{selectedTowerDisplay}</p>
                </div>
                <button
                  type="button"
                  onClick={handleClear}
                  className="text-success-strong hover:text-success-strong transition-colors"
                  title="Hapus pilihan"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          )}

          {/* Map for Tower Selection */}
          <div className="bg-white border border-input rounded-lg overflow-hidden">
            <div className="p-3 bg-muted border-b">
              <h3 className="text-sm font-medium text-foreground">
                Klik marker pada peta untuk memilih tower
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                {markers.length} menara dengan koordinat valid dari {filteredTowers.length} {mapFilter !== 'all' || searchTerm.trim() ? 'hasil filter' : 'total tower'}
              </p>
            </div>
            
            <div className="relative">
              {markers.length > 0 ? (
                <LeafletMap
                  center={[-7.197, 110.426]}
                  zoom={10}
                  style={{ height: '400px', width: '100%' }}
                  markers={markers}
                  showLines={false}
                  showCoverage={true}
                  defaultRadiusMeters={500}
                  onMarkerClick={handleMapMarkerClick}
                  selectedTowerId={selectedTowerId}
                />
              ) : (
                <div className="h-[400px] flex items-center justify-center bg-muted">
                  <div className="text-center p-6">
                    <svg className="w-16 h-16 mx-auto text-placeholder mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                    </svg>
                    <p className="text-muted-foreground font-medium mb-2">Tidak ada menara untuk ditampilkan</p>
                    <p className="text-sm text-muted-foreground">
                      {mapFilter === 'without_coordinates' 
                        ? 'Menara tanpa koordinat tidak dapat ditampilkan di peta'
                        : 'Tidak ada menara yang sesuai dengan filter'}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && errorMessage && selectionMode === 'search' && (
        <p role="alert" className="mt-1 text-sm text-destructive-strong">{errorMessage}</p>
      )}
      
      {error && errorMessage && selectionMode === 'map' && (
        <p role="alert" className="mt-1 text-sm text-destructive-strong">{errorMessage}</p>
      )}
    </div>
  );
}
