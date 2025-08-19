import React, { useState, useMemo } from 'react';
import TowerSearchInput from '@/Components/TowerSearchInput';
import LeafletMap from '@/Components/LeafletMap';
import { Tower as BaseTower } from '@/utils/searchUtils';

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

  // Prepare markers for map display (similar to DataTower Index)
  const markers = useMemo(() => towers
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
    }), [towers]);

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

      {/* Selection Interface */}
      {selectionMode === 'search' ? (
        <TowerSearchInput
          towers={towers as BaseTower[]}
          selectedTowerId={selectedTowerId}
          selectedTowerDisplay={selectedTowerDisplay}
          onTowerSelect={(tower: BaseTower) => onTowerSelect(tower as Tower)}
          onClear={onClear}
          placeholder="Ketik minimal 1 karakter untuk mencari..."
          required={false}
          error={error}
          errorMessage={errorMessage}
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
                {markers.length} tower dengan koordinat valid dari {towers.length} total tower
              </p>
            </div>
            
            <div className="relative">
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
