import React, { useState, useRef, useEffect } from 'react';
import { Head, router } from '@inertiajs/react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import MainLayout from '@/Layouts/MainLayout';
import AlertToast from '@/Components/AlertToast';

import FoStats from '@/Components/DataFo/FoStats';
import FoFilters from '@/Components/DataFo/FoFilters';
import FoTable from '@/Components/DataFo/FoTable';

// Fix Leaflet default icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Add custom CSS for map container
const mapContainerStyle = {
  height: '500px',
  width: '100%',
  position: 'relative' as const,
  zIndex: 1
};

// Custom icons for different FO point types
const createCustomIcon = (color: string, type: string) => {
  const iconHtml = `
    <div style="
      background-color: ${color};
      width: 20px;
      height: 20px;
      border-radius: 50%;
      border: 2px solid white;
      box-shadow: 0 2px 4px rgba(0,0,0,0.3);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 10px;
      color: white;
      font-weight: bold;
    ">${type.charAt(0).toUpperCase()}</div>
  `;
  
  return L.divIcon({
    html: iconHtml,
    className: 'custom-fo-icon',
    iconSize: [20, 20],
    iconAnchor: [10, 10],
    popupAnchor: [0, -10]
  });
};

const getIconByType = (type: string) => {
  switch (type) {
    case 'hub': return createCustomIcon('#8B5CF6', 'H'); // Purple for hub
    case 'junction': return createCustomIcon('#10B981', 'J'); // Green for junction
    case 'pole': return createCustomIcon('#3B82F6', 'P'); // Blue for pole
    case 'endpoint': return createCustomIcon('#EF4444', 'E'); // Red for endpoint
    default: return new L.Icon.Default();
  }
};

interface FoPoint {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  type: string;
  route_name: string;
  sequence_number: number;
  description?: string;
  images: {
    isp: string | null;
    pole: string | null;
    junction_box: string | null;
  };
  has_images: boolean;
  // Legacy properties for compatibility
  area?: string;
  status?: string;
}

interface FoRoute {
  id: number;
  name: string;
  color: string;
  total_distance: number;
  total_points: number;
  description: string;
  path_coordinates: Array<{ lat: number; lng: number }>;
  polyline: Array<[number, number]>;
  // Legacy properties for compatibility
  area?: string;
  status?: string;
  coordinates?: Array<[number, number]>;
}

interface MapData {
  points: FoPoint[];
  routes: FoRoute[];
  bounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
  area: string;
}

interface DataFoProps {
  foPoints: FoPoint[];
  foRoutes: FoRoute[];
  currentArea: string;
  availableAreas: string[];
  mapData?: MapData;
}

// Component to fit map bounds
function FitBounds({ bounds }: { bounds: { north: number; south: number; east: number; west: number } }) {
  const map = useMap();
  
  useEffect(() => {
    if (bounds && bounds.north && bounds.south && bounds.east && bounds.west) {
      const leafletBounds = L.latLngBounds(
        [bounds.south, bounds.west],
        [bounds.north, bounds.east]
      );
      map.fitBounds(leafletBounds, { padding: [20, 20] });
    }
  }, [bounds, map]);
  
  return null;
}

export default function DataFoIndex({ 
  foPoints = [], 
  foRoutes = [],
  currentArea = 'ungaran',
  availableAreas = [],
  mapData
}: DataFoProps) {
  const [selectedArea, setSelectedArea] = useState(currentArea);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');
  const [showFilters, setShowFilters] = useState(true);
  const [selectedPoint, setSelectedPoint] = useState<any>(null);
  const [selectedRoute, setSelectedRoute] = useState<any>(null);
  const [toast, setToast] = useState<{ show: boolean; type: 'info' | 'success' | 'warning' | 'error'; title?: string; message?: string }>({ show: false, type: 'info' });
  const [loading, setLoading] = useState(false);
  const [mapCenter, setMapCenter] = useState<[number, number]>([-7.1368, 110.4044]);

  // Use data from Inertia props with fallback
  const currentMapData = mapData || {
    points: foPoints || [],
    routes: foRoutes || [],
    bounds: {
      north: -7.0,
      south: -7.2,
      east: 110.5,
      west: 110.3,
    },
    area: currentArea
  };

  // Filter logic with data validation
  const filteredPoints = currentMapData.points?.filter(point => {
    // Validate point data
    if (!point || typeof point.latitude !== 'number' || typeof point.longitude !== 'number' ||
        isNaN(point.latitude) || isNaN(point.longitude)) {
      return false;
    }
    
    const matchesSearch = point.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         point.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedType === 'all' || point.type === selectedType;
    return matchesSearch && matchesType;
  }).map(point => ({
    ...point,
    area: selectedArea,
    status: 'active',
    // Ensure all required fields exist
    name: point.name || 'Unnamed Point',
    type: point.type || 'pole',
    route_name: point.route_name || 'Unknown Route',
    sequence_number: point.sequence_number || 0,
    images: point.images || { isp: null, pole: null, junction_box: null },
    has_images: Boolean(point.has_images)
  })) || [];

  const filteredRoutes = currentMapData.routes?.filter(route => {
    // Validate route data
    if (!route || !Array.isArray(route.polyline)) {
      return false;
    }
    
    const matchesSearch = route.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         route.description?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  }).map(route => ({
    ...route,
    area: selectedArea,
    status: 'active',
    coordinates: route.polyline || [],
    // Ensure all required fields exist with proper types
    name: route.name || 'Unnamed Route',
    color: route.color || '#3B82F6',
    total_distance: typeof route.total_distance === 'number' ? route.total_distance : 0,
    total_points: typeof route.total_points === 'number' ? route.total_points : 0,
    description: route.description || 'No description available',
    polyline: Array.isArray(route.polyline) ? route.polyline : [],
    path_coordinates: Array.isArray(route.path_coordinates) ? route.path_coordinates : []
  })) || [];

  const handleAreaChange = (area: string) => {
    setSelectedArea(area);
    router.get('/data-fo', { area }, { preserveState: true });
  };

  // Set map center based on bounds
  useEffect(() => {
    if (currentMapData.bounds) {
      const bounds = currentMapData.bounds;
      const centerLat = (bounds.north + bounds.south) / 2;
      const centerLng = (bounds.east + bounds.west) / 2;
      setMapCenter([centerLat, centerLng]);
    }
  }, [currentMapData.bounds]);

  // Force map refresh when area changes
  useEffect(() => {
    // Small delay to ensure proper re-rendering
    const timer = setTimeout(() => {
      window.dispatchEvent(new Event('resize'));
    }, 100);
    
    return () => clearTimeout(timer);
  }, [selectedArea]);

  return (
    <MainLayout title="Data Fiber Optic" currentPage="/data-fo">
      <Head title="Data Fiber Optic" />

      {/* Welcome Bar */}
      <div className="px-4 sm:px-6 py-6 mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between rounded" style={{ backgroundColor: '#FFF8E1' }}>
        <div className="mb-3 sm:mb-0">
          <h2 className="text-xl sm:text-2xl font-bold leading-snug" style={{ color: '#212121' }}>Data Fiber Optic</h2>
          <p className="mt-1 text-sm sm:text-base" style={{ color: '#212121', opacity: 0.8 }}>
            Kelola dan pantau infrastruktur fiber optic di Kabupaten Semarang.
          </p>
        </div>
        <img src="/images/kab-smg-logo.png" alt="Kabupaten Semarang" className="h-10 w-10 sm:h-12 sm:w-12 hidden sm:block" />
      </div>

      <div className="p-4 sm:p-6">
        {/* Area Selector */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <h3 className="text-lg font-medium mb-4">Pilih Area</h3>
          <div className="flex gap-3">
            {['ungaran', 'ambarawa'].map((area) => (
              <button
                key={area}
                onClick={() => handleAreaChange(area)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  selectedArea === area
                    ? 'bg-red-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {area === 'ungaran' ? 'Ungaran' : 'Ambarawa'}
              </button>
            ))}
          </div>
        </div>

        {/* Statistics */}
        <FoStats 
          filteredPoints={filteredPoints}
          filteredRoutes={filteredRoutes}
          selectedArea={selectedArea.charAt(0).toUpperCase() + selectedArea.slice(1)}
        />

        {/* Interactive Filters */}
        <FoFilters
          selectedArea={selectedArea}
          onAreaChange={handleAreaChange}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          selectedType={selectedType}
          onTypeChange={setSelectedType}
          selectedStatus={selectedStatus}
          onStatusChange={setSelectedStatus}
        />

        {/* Map Section */}
        <div className="bg-white rounded-lg shadow mb-6 overflow-hidden">
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium text-gray-900">Peta Jalur Fiber Optic</h3>
              <p className="text-sm text-gray-600 mt-1">Visualisasi titik dan jalur FO di area {selectedArea === 'ungaran' ? 'Ungaran' : 'Ambarawa'}</p>
            </div>
            <div className="flex items-center space-x-2">
              <button className="px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors">
                Export
              </button>
              <button className="px-3 py-2 text-sm font-medium text-white rounded-md hover:opacity-90 transition-colors" style={{ backgroundColor: '#B71C1C' }}>
                Fullscreen
              </button>
            </div>
          </div>
          
          <div className="relative">
            {loading && (
              <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-20">
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-red-600"></div>
                  <span className="text-sm text-gray-600">Memuat data peta...</span>
                </div>
              </div>
            )}
            
            <div className="w-full" style={mapContainerStyle}>
              <MapContainer
                center={mapCenter}
                zoom={13}
                style={{ height: '100%', width: '100%', zIndex: 1 }}
                key={`map-${selectedArea}`}
                scrollWheelZoom={true}
                doubleClickZoom={true}
                dragging={true}
                zoomControl={true}
                attributionControl={true}
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  maxZoom={19}
                />
                
                {/* Auto-fit bounds */}
                {currentMapData.bounds && <FitBounds bounds={currentMapData.bounds} />}
                
                 {/* Render FO Routes (Polylines) - Render first so they appear below markers */}
                 {filteredRoutes.map((route) => {
                   // Validate polyline data before rendering
                   const validPolyline = Array.isArray(route.polyline) && route.polyline.length > 0 
                     ? route.polyline.filter((coord: any) => 
                         Array.isArray(coord) && coord.length === 2 && 
                         typeof coord[0] === 'number' && typeof coord[1] === 'number' &&
                         !isNaN(coord[0]) && !isNaN(coord[1])
                       )
                     : [];
                   
                   if (validPolyline.length === 0) return null;
                   
                   return (
                     <Polyline
                       key={route.id}
                       positions={validPolyline}
                       pathOptions={{
                         color: route.color || '#3B82F6',
                         weight: 4,
                         opacity: 0.8,
                       }}
                       eventHandlers={{
                         click: () => {
                           console.log('Route clicked:', route.name);
                           setSelectedRoute(route);
                         }
                       }}
                     >
                    <Popup maxWidth={300}>
                      <div className="p-3 min-w-[250px]">
                        <h4 className="font-semibold text-sm text-gray-900 mb-2">{route.name}</h4>
                        <p className="text-xs text-gray-600 mb-3">{route.description}</p>
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-gray-500">Total Titik:</span>
                            <span className="text-xs font-medium">{route.total_points}</span>
                          </div>
                           <div className="flex justify-between items-center">
                             <span className="text-xs text-gray-500">Jarak Total:</span>
                             <span className="text-xs font-medium">
                               {typeof route.total_distance === 'number' ? route.total_distance.toFixed(2) : '0.00'} km
                             </span>
                           </div>
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: route.color }}></div>
                            <span className="text-xs text-gray-500">Jalur Aktif</span>
                          </div>
                        </div>
                      </div>
                     </Popup>
                   </Polyline>
                   );
                 })}
                
                 {/* Render FO Points (Markers) */}
                 {filteredPoints.map((point) => {
                   // Validate point coordinates before rendering
                   if (typeof point.latitude !== 'number' || typeof point.longitude !== 'number' ||
                       isNaN(point.latitude) || isNaN(point.longitude)) {
                     return null;
                   }
                   
                   return (
                     <Marker
                       key={point.id}
                       position={[point.latitude, point.longitude]}
                       icon={getIconByType(point.type || 'pole')}
                       eventHandlers={{
                         click: () => {
                           console.log('Point clicked:', point.name);
                           setSelectedPoint(point);
                         }
                       }}
                     >
                    <Popup maxWidth={300}>
                      <div className="p-3 min-w-[250px]">
                        <h4 className="font-semibold text-sm text-gray-900 mb-2">{point.name}</h4>
                        <p className="text-xs text-gray-600 mb-3">{point.description || 'Tidak ada deskripsi'}</p>
                        
                        <div className="space-y-2 mb-3">
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-gray-500">Jalur:</span>
                            <span className="text-xs font-medium">{point.route_name}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-gray-500">Urutan:</span>
                            <span className="text-xs font-medium">#{point.sequence_number}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="inline-flex px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {point.type.charAt(0).toUpperCase() + point.type.slice(1)}
                            </span>
                          </div>
                        </div>

                        {/* Images */}
                        {point.has_images && (
                          <div className="space-y-2">
                            <h5 className="text-xs font-medium text-gray-700">Gambar:</h5>
                            <div className="grid grid-cols-3 gap-2">
                              {point.images.isp && (
                                <a href={point.images.isp} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline">
                                  ISP
                                </a>
                              )}
                              {point.images.pole && (
                                <a href={point.images.pole} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline">
                                  Tiang
                                </a>
                              )}
                              {point.images.junction_box && (
                                <a href={point.images.junction_box} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline">
                                  JB
                                </a>
                              )}
                            </div>
                          </div>
                        )}
                        
                        <p className="text-xs text-gray-500 mt-2">
                          {point.latitude.toFixed(6)}, {point.longitude.toFixed(6)}
                        </p>
                      </div>
                     </Popup>
                   </Marker>
                   );
                 })}
              </MapContainer>
            </div>
            
            {/* Controls overlay */}
            <div className="absolute top-4 right-4 z-10 bg-white rounded-lg shadow-lg p-2">
              <div className="text-xs text-gray-600">
                Zoom: Mouse wheel | Pan: Drag
              </div>
            </div>
          </div>
            
          {/* Map Legend */}
          <div className="p-4 bg-gray-50 border-t border-gray-200">
            <h4 className="text-sm font-medium text-gray-900 mb-3">Legenda:</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-purple-500 flex items-center justify-center text-white text-xs font-bold shadow-sm">H</div>
                <span className="text-sm text-gray-700">Hub</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center text-white text-xs font-bold shadow-sm">J</div>
                <span className="text-sm text-gray-700">Junction</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold shadow-sm">P</div>
                <span className="text-sm text-gray-700">Pole</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center text-white text-xs font-bold shadow-sm">E</div>
                <span className="text-sm text-gray-700">Endpoint</span>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-gray-300">
              <div className="flex items-center gap-4 text-xs text-gray-600">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-1 bg-blue-500"></div>
                  <span>Jalur Aktif</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-1 bg-yellow-500" style={{ borderTop: '1px dashed' }}></div>
                  <span>Maintenance</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Data Tables */}
        <FoTable
          filteredPoints={filteredPoints}
          filteredRoutes={filteredRoutes}
          viewMode={viewMode}
          onPointClick={(point) => setSelectedPoint(point)}
          onRouteClick={(route) => setSelectedRoute(route)}
        />


      </div>
      
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
