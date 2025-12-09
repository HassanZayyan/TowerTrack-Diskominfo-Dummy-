import React, { useState, useMemo } from 'react';
import TowerSearchInput from '@/Components/TowerSearchInput';
import LeafletMap from '@/Components/LeafletMap';
import { Tower as BaseTower, filterTowers } from '@/utils/searchUtils';
import { Tower, FoPoint, Location, LocationType } from '@/types/messages';
import { createFoMarkerIcon } from '@/utils/foIconUtils';
import { createTowerMarkerIcon, isTowerSelected } from '@/utils/towerIconUtils';

interface LocationSelectionInputProps {
  towers?: Tower[];
  foPoints?: FoPoint[];
  selectedLocationId?: string;
  selectedLocationDisplay?: string;
  selectedLocationType?: LocationType;
  onLocationSelect: (location: Location, type: LocationType) => void;
  onClear?: () => void;
  label?: string;
  required?: boolean;
  error?: boolean;
  errorMessage?: string;
  className?: string;
}

type MapFilterType = 'all' | 'with_coordinates' | 'without_coordinates';

// Helper to check if location is a Tower
const isTower = (location: Location): location is Tower => {
  // Check __type first for accuracy, then fallback to property check
  const loc = location as any;
  if (loc.__type === 'tower') return true;
  if (loc.__type === 'fo_point') return false;
  // Fallback: check for tower-specific properties
  return 'site_name' in location && !('name' in location);
};

// Helper to check if location is a FoPoint
const isFoPoint = (location: Location): location is FoPoint => {
  // Check __type first for accuracy, then fallback to property check
  const loc = location as any;
  if (loc.__type === 'fo_point') return true;
  if (loc.__type === 'tower') return false;
  // Fallback: check for FO point-specific properties
  return 'name' in location && !('site_name' in location);
};

// Convert Tower to BaseTower for search
const towerToBaseTower = (tower: Tower): BaseTower => ({
  id: tower.id,
  site_name: tower.site_name,
  alamat_menara: tower.alamat_menara,
});

// Convert FoPoint to BaseTower-like for search
const foPointToBaseTower = (point: FoPoint): BaseTower => ({
  id: point.id,
  site_name: point.name,
  alamat_menara: point.description || point.area || '',
});

export default function LocationSelectionInput({
  towers = [],
  foPoints = [],
  selectedLocationId,
  selectedLocationDisplay,
  selectedLocationType,
  onLocationSelect,
  onClear,
  label = "Lokasi",
  required = false,
  error = false,
  errorMessage,
  className = ""
}: LocationSelectionInputProps) {
  const [selectionMode, setSelectionMode] = useState<'search' | 'map'>('search');
  const [searchTerm, setSearchTerm] = useState('');
  const [mapFilter, setMapFilter] = useState<MapFilterType>('all');

  // Combine all locations
  const allLocations = useMemo(() => {
    const towerLocations: Location[] = towers.map(t => ({ ...t, __type: 'tower' as const }));
    const foPointLocations: Location[] = foPoints.map(p => ({ ...p, __type: 'fo_point' as const }));
    return [...towerLocations, ...foPointLocations];
  }, [towers, foPoints]);

  // Enhanced clear handler
  const handleClear = () => {
    setSearchTerm('');
    onClear?.();
  };

  // Helper function to check if location has valid coordinates
  const hasValidCoordinates = (location: Location): boolean => {
    const lat = Number(location.latitude);
    const lon = Number(location.longitude);
    return (
      Number.isFinite(lat) && Number.isFinite(lon) &&
      lat !== 0 && lon !== 0 &&
      Math.abs(lat) <= 90 && Math.abs(lon) <= 180
    );
  };

  // Calculate location statistics
  const locationStats = useMemo(() => {
    const total = allLocations.length;
    const withCoordinates = allLocations.filter(hasValidCoordinates).length;
    const withoutCoordinates = total - withCoordinates;
    
    return { total, withCoordinates, withoutCoordinates };
  }, [allLocations]);

  // Apply filters
  const filteredLocations = useMemo(() => {
    let filtered = allLocations;
    
    // Apply coordinate filter
    if (mapFilter === 'with_coordinates') {
      filtered = filtered.filter(hasValidCoordinates);
    } else if (mapFilter === 'without_coordinates') {
      filtered = filtered.filter(loc => !hasValidCoordinates(loc));
    }
    
    // Apply search term filter
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(loc => {
        if (isTower(loc)) {
          const baseTower = towerToBaseTower(loc);
          return filterTowers([baseTower], searchTerm).length > 0;
        } else if (isFoPoint(loc)) {
          const name = loc.name?.toLowerCase() || '';
          const area = loc.area?.toLowerCase() || '';
          const route = loc.route_name?.toLowerCase() || '';
          const desc = loc.description?.toLowerCase() || '';
          return name.includes(searchLower) || area.includes(searchLower) || route.includes(searchLower) || desc.includes(searchLower);
        }
        return false;
      });
    }
    
    return filtered;
  }, [allLocations, mapFilter, searchTerm]);

  // Prepare markers for map display
  const markers = useMemo(() => filteredLocations
    .map(loc => {
      const lat = Number(loc.latitude);
      const lon = Number(loc.longitude);
      return { loc, lat, lon };
    })
    .filter(({ loc, lat, lon }) => 
      Number.isFinite(lat) && Number.isFinite(lon) &&
      lat !== 0 && lon !== 0 &&
      Math.abs(lat) <= 90 && Math.abs(lon) <= 180
    )
    .map(({ loc, lat, lon }) => {
      let radiusMeters: number | undefined = undefined;
      let title = '';
      let description = '';

      if (isTower(loc)) {
        title = loc.site_name || 'Belum Terdata';
        description = `${loc.alamat_menara || 'Belum Terdata'}${loc.tinggi_menara ? `<br/>Tinggi: ${loc.tinggi_menara} m` : ''}`;
        
        if (typeof loc.tinggi_menara === 'number' && loc.tinggi_menara > 0) {
          radiusMeters = Math.min(Math.max(loc.tinggi_menara * 8, 100), 3000);
        }

        if ((radiusMeters === undefined || !Number.isFinite(radiusMeters)) && loc.site_type) {
          const st = loc.site_type.toLowerCase();
          if (st.includes('rooftop')) radiusMeters = 250;
          else if (st.includes('sst') || st.includes('monopole')) radiusMeters = 400;
          else if (st.includes('guyed') || st.includes('lattice') || st.includes('sstl')) radiusMeters = 600;
          else radiusMeters = 500;
        }
      } else if (isFoPoint(loc)) {
        title = loc.name || 'Belum Terdata';
        description = `${loc.area || ''}${loc.route_name ? ` - ${loc.route_name}` : ''}${loc.type ? `<br/>Tipe: ${loc.type}` : ''}`;
        radiusMeters = undefined; // No radius for FO points
      }

      // Only set default radius for towers, not FO points
      if (isTower(loc) && radiusMeters === undefined) {
        radiusMeters = 500;
      }

      // Determine icon based on location type
      let customIcon: any = null;
      if (isTower(loc)) {
        const isSelected = selectedLocationId && loc.id.toString() === selectedLocationId.toString();
        customIcon = createTowerMarkerIcon(isSelected ? 'selected' : 'default');
      } else if (isFoPoint(loc)) {
        // Use FO marker icon with selection state (same as data-fo page)
        const isSelected = selectedLocationId && loc.id.toString() === selectedLocationId.toString();
        // Ensure images object exists with proper structure
        const foImages = (loc.images && typeof loc.images === 'object') ? {
          isp: loc.images.isp || null,
          pole: loc.images.pole || null,
          junction_box: loc.images.junction_box || null,
        } : {
          isp: null,
          pole: null,
          junction_box: null,
        };
        customIcon = createFoMarkerIcon(
          foImages,
          loc.side_of_road,
          isSelected ? 'selected' : 'default'
        );
      } else {
        // Fallback: if location type is unknown, use default tower icon
        console.warn('Unknown location type:', loc);
        customIcon = createTowerMarkerIcon('default');
      }

      return {
        position: [lat, lon] as [number, number],
        title,
        description,
        radiusMeters,
        locationData: loc,
        customIcon, // Add custom icon to marker
      };
    }), [filteredLocations]);

  const handleMapMarkerClick = (locationData: Location) => {
    const type: LocationType = isTower(locationData) ? 'tower' : 'fo_point';
    onLocationSelect(locationData, type);
  };

  // Convert locations to BaseTower format for TowerSearchInput
  const searchableLocations = useMemo(() => {
    return filteredLocations.map(loc => {
      if (isTower(loc)) {
        return towerToBaseTower(loc);
      } else {
        return foPointToBaseTower(loc);
      }
    });
  }, [filteredLocations]);

  const handleSearchSelect = (baseTower: BaseTower) => {
    const location = allLocations.find(loc => loc.id === baseTower.id);
    if (location) {
      const type: LocationType = isTower(location) ? 'tower' : 'fo_point';
      onLocationSelect(location, type);
    }
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
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3 gap-2">
            <label className="text-sm font-medium text-gray-700">
              Filter Lokasi:
            </label>
            <div className="flex flex-wrap gap-1 text-xs">
              <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded whitespace-nowrap">
                {locationStats.withCoordinates} di peta
              </span>
              <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded whitespace-nowrap">
                {locationStats.withoutCoordinates} tanpa koordinat
              </span>
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-1 sm:gap-2">
            <button
              type="button"
              onClick={() => setMapFilter('all')}
              className={`px-1 sm:px-3 py-2 sm:py-3 text-xs sm:text-sm font-medium rounded-lg transition-all duration-200 ${
                mapFilter === 'all'
                  ? 'bg-red-600 text-white shadow-md'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              <div className="flex flex-col items-center gap-0.5 sm:gap-1">
                <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                <span className="text-xs font-medium leading-tight">Semua</span>
                <span className="text-xs font-semibold">{locationStats.total}</span>
              </div>
            </button>
            
            <button
              type="button"
              onClick={() => setMapFilter('with_coordinates')}
              className={`px-1 sm:px-3 py-2 sm:py-3 text-xs sm:text-sm font-medium rounded-lg transition-all duration-200 ${
                mapFilter === 'with_coordinates'
                  ? 'bg-red-600 text-white shadow-md'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              <div className="flex flex-col items-center gap-0.5 sm:gap-1">
                <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
                <span className="text-xs font-medium leading-tight">Di Peta</span>
                <span className="text-xs font-semibold">{locationStats.withCoordinates}</span>
              </div>
            </button>
            
            <button
              type="button"
              onClick={() => setMapFilter('without_coordinates')}
              className={`px-1 sm:px-3 py-2 sm:py-3 text-xs sm:text-sm font-medium rounded-lg transition-all duration-200 ${
                mapFilter === 'without_coordinates'
                  ? 'bg-red-600 text-white shadow-md'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              <div className="flex flex-col items-center gap-0.5 sm:gap-1">
                <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                <span className="text-xs font-medium leading-tight">Tanpa Koordinat</span>
                <span className="text-xs font-semibold">{locationStats.withoutCoordinates}</span>
              </div>
            </button>
          </div>
          
          {mapFilter === 'without_coordinates' && selectionMode === 'map' && (
            <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
              <svg className="w-4 h-4 inline mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              Lokasi tanpa koordinat tidak akan muncul di peta. Gunakan mode "Cari Teks" untuk memilih.
            </div>
          )}
        </div>
      </div>

      {/* Selection Interface */}
      {selectionMode === 'search' ? (
        <TowerSearchInput
          towers={searchableLocations}
          selectedTowerId={selectedLocationId}
          selectedTowerDisplay={selectedLocationDisplay}
          onTowerSelect={handleSearchSelect}
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
          {/* Selected Location Display */}
          {selectedLocationId && selectedLocationDisplay && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-800">
                    {selectedLocationType === 'fo_point' ? 'FO Point' : 'Tower'} Terpilih:
                  </p>
                  <p className="text-sm text-green-700">{selectedLocationDisplay}</p>
                </div>
                <button
                  type="button"
                  onClick={handleClear}
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

          {/* Map for Location Selection */}
          <div className="bg-white border border-gray-300 rounded-lg overflow-hidden">
            <div className="p-3 bg-gray-50 border-b">
              <h3 className="text-sm font-medium text-gray-700">
                Klik marker pada peta untuk memilih lokasi
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                {markers.length} lokasi dengan koordinat valid dari {filteredLocations.length} {mapFilter !== 'all' || searchTerm.trim() ? 'hasil filter' : 'total lokasi'}
              </p>
            </div>
            
            <div className="relative">
              {markers.length > 0 ? (
                <LeafletMap
                  center={[-7.197, 110.426]}
                  zoom={10}
                  style={{ height: '400px', width: '100%' }}
                  markers={markers.map(m => ({
                    position: m.position,
                    title: m.title,
                    description: m.description,
                    radiusMeters: m.radiusMeters,
                    towerData: m.locationData as any, // Type compatibility
                    customIcon: m.customIcon, // Pass custom icon (FO point icon or tower icon)
                  }))}
                  showLines={false}
                  showCoverage={true}
                  defaultRadiusMeters={500}
                  onMarkerClick={(data) => handleMapMarkerClick(data as Location)}
                  selectedTowerId={selectedLocationId}
                />
              ) : (
                <div className="h-[400px] flex items-center justify-center bg-gray-100">
                  <div className="text-center p-6">
                    <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                    </svg>
                    <p className="text-gray-600 font-medium mb-2">Tidak ada lokasi untuk ditampilkan</p>
                    <p className="text-sm text-gray-500">
                      {mapFilter === 'without_coordinates' 
                        ? 'Lokasi tanpa koordinat tidak dapat ditampilkan di peta'
                        : 'Tidak ada lokasi yang sesuai dengan filter'}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && errorMessage && (
        <p className="text-red-500 text-sm mt-1">{errorMessage}</p>
      )}
    </div>
  );
}

