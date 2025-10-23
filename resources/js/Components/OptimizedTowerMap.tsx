import React, { memo, useCallback, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import { Icon } from 'leaflet';
import { useDebounce } from '@/Hooks/useDebounce';

interface TowerMarker {
  position: [number, number];
  title: string;
  description: string;
  radiusMeters?: number;
  towerData: any;
}

interface OptimizedTowerMapProps {
  markers: TowerMarker[];
  onMarkerClick: (tower: any) => void;
  measureEnabled?: boolean;
  showCoverage?: boolean;
  ownerFilter?: string;
  className?: string;
}

// Custom marker icon
const towerIcon = new Icon({
  iconUrl: '/images/tower-marker.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowUrl: '/images/marker-shadow.png',
  shadowSize: [41, 41]
});

const OptimizedTowerMap = memo<OptimizedTowerMapProps>(({ 
  markers, 
  onMarkerClick, 
  measureEnabled = false,
  showCoverage = true,
  ownerFilter = 'all',
  className = 'h-96 w-full'
}) => {
  // Debounce markers to prevent excessive re-renders
  const debouncedMarkers = useDebounce(markers, 300);
  
  // Memoize filtered markers
  const filteredMarkers = useMemo(() => {
    return debouncedMarkers.filter(marker => {
      if (ownerFilter === 'all') return true;
      return marker.towerData.owner === ownerFilter;
    });
  }, [debouncedMarkers, ownerFilter]);
  
  // Memoize marker click handler
  const handleMarkerClick = useCallback((tower: any) => {
    onMarkerClick(tower);
  }, [onMarkerClick]);
  
  // Memoize coverage circles
  const coverageCircles = useMemo(() => {
    if (!showCoverage) return [];
    
    return filteredMarkers
      .filter(marker => marker.radiusMeters && marker.radiusMeters > 0)
      .map((marker, index) => (
        <Circle
          key={`coverage-${index}`}
          center={marker.position}
          radius={marker.radiusMeters!}
          pathOptions={{
            color: '#3B82F6',
            fillColor: '#3B82F6',
            fillOpacity: 0.1,
            weight: 1,
            opacity: 0.5
          }}
        />
      ));
  }, [filteredMarkers, showCoverage]);
  
  // Memoize markers
  const markerElements = useMemo(() => {
    return filteredMarkers.map((marker, index) => (
      <Marker
        key={`marker-${index}`}
        position={marker.position}
        icon={towerIcon}
        eventHandlers={{
          click: () => handleMarkerClick(marker.towerData)
        }}
      >
        <Popup>
          <div className="p-2">
            <h3 className="font-semibold text-gray-800">{marker.title}</h3>
            <p className="text-sm text-gray-600" dangerouslySetInnerHTML={{ __html: marker.description }} />
            {marker.radiusMeters && (
              <p className="text-xs text-gray-500 mt-1">
                Jangkauan: {marker.radiusMeters}m
              </p>
            )}
          </div>
        </Popup>
      </Marker>
    ));
  }, [filteredMarkers, handleMarkerClick]);
  
  return (
    <div className={className}>
      <MapContainer
        center={[-6.200000, 106.816666]} // Default to Jakarta
        zoom={10}
        className="h-full w-full"
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {markerElements}
        {coverageCircles}
      </MapContainer>
    </div>
  );
});

OptimizedTowerMap.displayName = 'OptimizedTowerMap';

export default OptimizedTowerMap;
