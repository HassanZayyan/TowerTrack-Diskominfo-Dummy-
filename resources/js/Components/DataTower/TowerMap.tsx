import React from 'react';
import LeafletMap from '@/Components/LeafletMap';
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

interface TowerMapProps {
  markers: Array<{
    position: [number, number];
    title: string;
    description: string;
    radiusMeters: number;
    towerData: Tower;
  }>;
  mode: 'none' | 'coverage';
  setMode: (mode: 'none' | 'coverage') => void;
  distance: number;
  resetLinesCounter: number;
  setResetLinesCounter: (value: number | ((prev: number) => number)) => void;
  onDistanceChange: (distance: number) => void;
  onMarkerClick?: (towerData: Tower) => void;
  ownerFilter: string;
  setOwnerFilter: (filter: string) => void;
  buildFilterParams: (overrides?: any) => any;
  mapRef: React.RefObject<any>;
}

export default function TowerMap({
  markers,
  mode,
  setMode,
  distance,
  resetLinesCounter,
  setResetLinesCounter,
  onDistanceChange,
  onMarkerClick,
  ownerFilter,
  setOwnerFilter,
  buildFilterParams,
  mapRef
}: TowerMapProps) {
  return (
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
              onChange={(e) => setMode(e.target.value as 'none' | 'coverage')}
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
          onDistanceChange={onDistanceChange}
          resetLinesTrigger={resetLinesCounter}
          // Only provide onMarkerClick when NOT in measurement mode to prevent conflicts
          onMarkerClick={mode !== 'none' ? onMarkerClick : undefined}
        />
      </div>
    </div>
  );
}
