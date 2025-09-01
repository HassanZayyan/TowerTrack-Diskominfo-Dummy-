import React, { useState, useRef, useEffect } from 'react';
import { Head, router } from '@inertiajs/react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
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
  area: string;
  description?: string;
  type: string;
  status: string;
  properties?: any;
}

interface FoRoute {
  id: number;
  name: string;
  area: string;
  description?: string;
  coordinates: Array<[number, number]>;
  status: string;
  color: string;
  total_distance?: number;
  properties?: any;
}

interface DataFoProps {
  foPoints: FoPoint[];
  foRoutes: FoRoute[];
  currentArea: string;
  availableAreas: string[];
}

export default function DataFoIndex({ 
  foPoints = [], 
  foRoutes = [],
  currentArea = 'ungaran',
  availableAreas = []
}: DataFoProps) {
  const [selectedArea, setSelectedArea] = useState(currentArea);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');
  const [showFilters, setShowFilters] = useState(true);
  const [selectedPoint, setSelectedPoint] = useState<FoPoint | null>(null);
  const [selectedRoute, setSelectedRoute] = useState<FoRoute | null>(null);
  const [toast, setToast] = useState<{ show: boolean; type: 'info' | 'success' | 'warning' | 'error'; title?: string; message?: string }>({ show: false, type: 'info' });

  // Dummy data untuk demo peta
  const dummyFoPoints = [
    // Ungaran area
    { id: 1, name: 'Hub FO Ungaran Pusat', latitude: -7.1368, longitude: 110.4044, type: 'hub', status: 'active', area: 'ungaran', description: 'Hub utama distribusi FO Ungaran' },
    { id: 2, name: 'Junction Ungaran Timur', latitude: -7.1350, longitude: 110.4080, type: 'junction', status: 'active', area: 'ungaran', description: 'Junction box area timur' },
    { id: 3, name: 'Pole FO Jl. Raya Ungaran', latitude: -7.1385, longitude: 110.4010, type: 'pole', status: 'active', area: 'ungaran', description: 'Tiang FO jalan raya' },
    { id: 4, name: 'Endpoint Kantor Kecamatan', latitude: -7.1340, longitude: 110.4055, type: 'endpoint', status: 'active', area: 'ungaran', description: 'Titik akhir ke kantor kecamatan' },
    
    // Ambarawa area
    { id: 5, name: 'Hub FO Ambarawa', latitude: -7.2639, longitude: 110.3987, type: 'hub', status: 'active', area: 'ambarawa', description: 'Hub utama distribusi FO Ambarawa' },
    { id: 6, name: 'Junction Ambarawa Selatan', latitude: -7.2670, longitude: 110.4010, type: 'junction', status: 'active', area: 'ambarawa', description: 'Junction box area selatan' },
    { id: 7, name: 'Pole FO Jl. Ahmad Yani', latitude: -7.2620, longitude: 110.3960, type: 'pole', status: 'active', area: 'ambarawa', description: 'Tiang FO Jl. Ahmad Yani' },
  ];

  const dummyFoRoutes: FoRoute[] = [
    // Ungaran routes
    {
      id: 1,
      name: 'Jalur Utama Ungaran',
      area: 'ungaran',
      color: '#3B82F6',
      status: 'active',
      coordinates: [
        [-7.1368, 110.4044],
        [-7.1350, 110.4080],
        [-7.1340, 110.4055],
        [-7.1385, 110.4010]
      ],
      description: 'Jalur utama menghubungkan hub ke seluruh area Ungaran'
    },
    // Ambarawa routes
    {
      id: 2,
      name: 'Jalur Utama Ambarawa',
      area: 'ambarawa',
      color: '#10B981',
      status: 'active',
      coordinates: [
        [-7.2639, 110.3987],
        [-7.2670, 110.4010],
        [-7.2620, 110.3960]
      ],
      description: 'Jalur utama menghubungkan hub ke seluruh area Ambarawa'
    }
  ];

  // Filter logic
  const filteredPoints = dummyFoPoints.filter(point => {
    const matchesArea = point.area === selectedArea;
    const matchesSearch = point.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         point.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedType === 'all' || point.type === selectedType;
    const matchesStatus = selectedStatus === 'all' || point.status === selectedStatus;
    return matchesArea && matchesSearch && matchesType && matchesStatus;
  });

  const filteredRoutes = dummyFoRoutes.filter(route => {
    const matchesArea = route.area === selectedArea;
    const matchesSearch = route.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         route.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = selectedStatus === 'all' || route.status === selectedStatus;
    return matchesArea && matchesSearch && matchesStatus;
  });

  // Set map center based on selected area
  const mapCenter: [number, number] = selectedArea === 'ungaran' 
    ? [-7.1368, 110.4044] 
    : [-7.2639, 110.3987];

  const handleAreaChange = (area: string) => {
    setSelectedArea(area);
    router.get('/data-fo', { area }, { preserveState: true });
  };

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
            <div className="w-full" style={mapContainerStyle}>
              <MapContainer
                center={mapCenter}
                zoom={15}
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
                
                {/* Render FO Routes (Polylines) - Render first so they appear below markers */}
                {filteredRoutes.map((route) => (
                  <Polyline
                    key={route.id}
                    positions={route.coordinates}
                    pathOptions={{
                      color: route.color,
                      weight: 5,
                      opacity: 0.8,
                      dashArray: route.status === 'maintenance' ? '5, 10' : undefined
                    }}
                    eventHandlers={{
                      click: () => {
                        console.log('Route clicked:', route.name);
                      }
                    }}
                  >
                    <Popup maxWidth={250}>
                      <div className="p-2 min-w-[200px]">
                        <h4 className="font-semibold text-sm text-gray-900 mb-2">{route.name}</h4>
                        <p className="text-xs text-gray-600 mb-2">{route.description}</p>
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-gray-500">{route.coordinates.length} titik</span>
                          <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                            route.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {route.status === 'active' ? 'Aktif' : 'Maintenance'}
                          </span>
                        </div>
                      </div>
                    </Popup>
                  </Polyline>
                ))}
                
                {/* Render FO Points (Markers) */}
                {filteredPoints.map((point) => (
                  <Marker
                    key={point.id}
                    position={[point.latitude, point.longitude]}
                    icon={getIconByType(point.type)}
                    eventHandlers={{
                      click: () => {
                        console.log('Point clicked:', point.name);
                      }
                    }}
                  >
                    <Popup maxWidth={250}>
                      <div className="p-2 min-w-[200px]">
                        <h4 className="font-semibold text-sm text-gray-900 mb-2">{point.name}</h4>
                        <p className="text-xs text-gray-600 mb-3">{point.description}</p>
                        <div className="flex flex-wrap gap-2 mb-2">
                          <span className="inline-flex px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {point.type.charAt(0).toUpperCase() + point.type.slice(1)}
                          </span>
                          <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                            point.status === 'active' ? 'bg-green-100 text-green-800' : 
                            point.status === 'inactive' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {point.status === 'active' ? 'Aktif' : point.status === 'inactive' ? 'Non-aktif' : 'Maintenance'}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500">
                          {point.latitude.toFixed(6)}, {point.longitude.toFixed(6)}
                        </p>
                      </div>
                    </Popup>
                  </Marker>
                ))}
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
          onPointClick={setSelectedPoint}
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
