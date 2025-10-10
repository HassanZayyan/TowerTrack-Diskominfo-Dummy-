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
  label = "Lokasi Tower",
  required = false,
  error = false,
  errorMessage,
  className = ""
}: TowerSelectionInputProps) {
  const [selectionMode, setSelectionMode] = useState<'search' | 'map'>('search');
  const [searchTerm, setSearchTerm] = useState('');
  const [mapFilter, setMapFilter] = useState<MapFilterType>('all');

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
        <label className="block text-gray-700 font-medium mb-2">
          {label} {required && <span className="text-red-600">*</span>}
        </label>
      )}

      {/* Mode Toggle */}
      <div className="flex mb-3 border border-gray-300 rounded-lg overflow-hidden">
        <button
          type="button"
          onClick={() => setSelectionMode('search')}
          className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
            selectionMode === 'search'
              ? 'bg-red-600 text-white'
              : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
          }`}
        >
          <span className="flex items-center justify-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            Cari Teks
          </span>
        </button>
        <button
          type="button"
          onClick={() => setSelectionMode('map')}
          className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
            selectionMode === 'map'
              ? 'bg-red-600 text-white'
              : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
          }`}
        >
          <span className="flex items-center justify-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Pilih Peta
          </span>
        </button>
      </div>

      {/* Coordinate Filter */}
      <div className="mb-3">
        <div className="bg-gray-50 border border-gray-300 rounded-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-gray-700">
              Filter Tower:
            </label>
            <div className="flex gap-1 text-xs">
              <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded">
                {towerStats.withCoordinates} di peta
              </span>
              <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded">
                {towerStats.withoutCoordinates} tanpa koordinat
              </span>
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setMapFilter('all')}
              className={`px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                mapFilter === 'all'
                  ? 'bg-red-600 text-white shadow-md'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              <div className="flex flex-col items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                <span className="text-xs">Semua</span>
                <span className="text-xs font-semibold">{towerStats.total}</span>
              </div>
            </button>
            
            <button
              type="button"
              onClick={() => setMapFilter('with_coordinates')}
              className={`px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                mapFilter === 'with_coordinates'
                  ? 'bg-red-600 text-white shadow-md'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              <div className="flex flex-col items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
                <span className="text-xs">Di Peta</span>
                <span className="text-xs font-semibold">{towerStats.withCoordinates}</span>
              </div>
            </button>
            
            <button
              type="button"
              onClick={() => setMapFilter('without_coordinates')}
              className={`px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                mapFilter === 'without_coordinates'
                  ? 'bg-red-600 text-white shadow-md'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              <div className="flex flex-col items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                <span className="text-xs">Tanpa Koordinat</span>
                <span className="text-xs font-semibold">{towerStats.withoutCoordinates}</span>
              </div>
            </button>
          </div>
          
          {mapFilter === 'without_coordinates' && selectionMode === 'map' && (
            <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
              <svg className="w-4 h-4 inline mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              Tower tanpa koordinat tidak akan muncul di peta. Gunakan mode "Cari Teks" untuk memilih.
            </div>
          )}
        </div>
      </div>

      {/* Selection Interface */}
      {selectionMode === 'search' ? (
        <TowerSearchInput
          towers={filteredTowers as BaseTower[]}
          selectedTowerId={selectedTowerId}
          selectedTowerDisplay={selectedTowerDisplay}
          onTowerSelect={(tower: BaseTower) => onTowerSelect(tower as Tower)}
          onClear={onClear}
          placeholder="Ketik minimal 1 karakter untuk mencari..."
          required={false}
          error={error}
          errorMessage={errorMessage}
          onSearchTermChange={setSearchTerm}
        />
      ) : (
        <div className="space-y-3">
          {/* Selected Tower Display */}
          {selectedTowerId && selectedTowerDisplay && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-800">Tower Terpilih:</p>
                  <p className="text-sm text-green-700">{selectedTowerDisplay}</p>
                </div>
                <button
                  type="button"
                  onClick={onClear}
                  className="text-green-600 hover:text-green-800 transition-colors"
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
          <div className="bg-white border border-gray-300 rounded-lg overflow-hidden">
            <div className="p-3 bg-gray-50 border-b">
              <h3 className="text-sm font-medium text-gray-700">
                Klik marker pada peta untuk memilih tower
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                {markers.length} tower dengan koordinat valid dari {filteredTowers.length} {mapFilter !== 'all' || searchTerm.trim() ? 'hasil filter' : 'total tower'}
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
                />
              ) : (
                <div className="h-[400px] flex items-center justify-center bg-gray-100">
                  <div className="text-center p-6">
                    <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                    </svg>
                    <p className="text-gray-600 font-medium mb-2">Tidak ada tower untuk ditampilkan</p>
                    <p className="text-sm text-gray-500">
                      {mapFilter === 'without_coordinates' 
                        ? 'Tower tanpa koordinat tidak dapat ditampilkan di peta'
                        : 'Tidak ada tower yang sesuai dengan filter'}
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
        <p className="text-red-500 text-sm mt-1">{errorMessage}</p>
      )}
      
      {error && errorMessage && selectionMode === 'map' && (
        <p className="text-red-500 text-sm mt-1">{errorMessage}</p>
      )}
    </div>
  );
}
