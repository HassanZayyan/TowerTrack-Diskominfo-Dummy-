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
        <label className="block text-foreground font-medium mb-2">
          {label} {required && <span className="text-destructive">*</span>}
        </label>
      )}

      {/* Mode toggle — a segmented control on the inset ground. A solid fill
          made a MODE look like a primary action; the raised white pill is how a
          segmented control actually reads. */}
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
          Every count used to print TWICE — a chip row ("118 di peta / 50 tanpa
          koordinat") and then three tall stacked-icon cards repeating the same
          three numbers. That duplication is what made this form read cluttered.
          One row now, with each count on the segment that sets it. */}
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium text-muted-foreground">Tampilkan</span>
        <div className="inline-flex flex-wrap rounded-md border border-border bg-well p-1">
          {([
            { id: 'all', label: 'Semua', n: locationStats.total },
            { id: 'with_coordinates', label: 'Di peta', n: locationStats.withCoordinates },
            { id: 'without_coordinates', label: 'Tanpa koordinat', n: locationStats.withoutCoordinates },
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
          <span>Lokasi tanpa koordinat tidak muncul di peta. Gunakan mode &ldquo;Cari Teks&rdquo; untuk memilihnya.</span>
        </div>
      )}

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
            <div className="p-3 bg-success-soft border border-success-border rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-success-strong">
                    {selectedLocationType === 'fo_point' ? 'Titik FO' : 'Menara'} Terpilih:
                  </p>
                  <p className="text-sm text-success-strong">{selectedLocationDisplay}</p>
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

          {/* Map for Location Selection */}
          <div className="bg-white border border-input rounded-lg overflow-hidden">
            <div className="p-3 bg-muted border-b">
              <h3 className="text-sm font-medium text-foreground">
                Klik marker pada peta untuk memilih lokasi
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
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
                <div className="h-[400px] flex items-center justify-center bg-muted">
                  <div className="text-center p-6">
                    <svg className="w-16 h-16 mx-auto text-placeholder mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                    </svg>
                    <p className="text-muted-foreground font-medium mb-2">Tidak ada lokasi untuk ditampilkan</p>
                    <p className="text-sm text-muted-foreground">
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
        <p role="alert" className="mt-1 text-sm text-destructive-strong">{errorMessage}</p>
      )}
    </div>
  );
}

