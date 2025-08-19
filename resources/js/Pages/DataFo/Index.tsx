import React, { useState, useRef, useEffect } from 'react';
import { Head, router } from '@inertiajs/react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import MainLayout from '@/Layouts/MainLayout';
import AlertToast from '@/Components/AlertToast';
import Footer from '@/Components/Footer';

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
  path_coordinates: Array<{ lat: number; lng: number }>;
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

  const dummyFoRoutes = [
    // Ungaran routes
    {
      id: 1,
      name: 'Jalur Utama Ungaran',
      area: 'ungaran',
      color: '#3B82F6',
      status: 'active',
      coordinates: [
        [-7.1368, 110.4044] as [number, number],
        [-7.1350, 110.4080] as [number, number],
        [-7.1340, 110.4055] as [number, number],
        [-7.1385, 110.4010] as [number, number]
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
        [-7.2639, 110.3987] as [number, number],
        [-7.2670, 110.4010] as [number, number],
        [-7.2620, 110.3960] as [number, number]
      ],
      description: 'Jalur utama menghubungkan hub ke seluruh area Ambarawa'
    }
  ];

  // Filter data berdasarkan area yang dipilih
  const filteredPoints = dummyFoPoints.filter(point => point.area === selectedArea);
  const filteredRoutes = dummyFoRoutes.filter(route => route.area === selectedArea);

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
      <div className="px-4 sm:px-6 py-6 mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between rounded" style={{ backgroundColor: '#E3F2FD' }}>
        <div className="mb-3 sm:mb-0">
          <h2 className="text-xl sm:text-2xl font-bold leading-snug" style={{ color: '#212121' }}>Data Jalur Fiber Optic</h2>
          <p className="mt-1 text-sm sm:text-base" style={{ color: '#212121', opacity: 0.8 }}>
            Sistem monitoring titik dan jalur fiber optic di Kabupaten Semarang.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <img src="/images/kab-smg-logo.png" alt="Kabupaten Semarang" className="h-10 w-10 sm:h-12 sm:w-12" />
        </div>
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-100 rounded-md flex items-center justify-center">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Titik FO</p>
                <p className="text-2xl font-semibold text-gray-900">{filteredPoints.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-100 rounded-md flex items-center justify-center">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V7.618a1 1 0 01.553-.894L9 4l6 3 6-3 6 3v8.764a1 1 0 01-.553.894L21 20l-6-3-6 3z" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Jalur FO</p>
                <p className="text-2xl font-semibold text-gray-900">{filteredRoutes.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-purple-100 rounded-md flex items-center justify-center">
                  <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Area Aktif</p>
                <p className="text-2xl font-semibold text-gray-900">{selectedArea === 'ungaran' ? 'Ungaran' : 'Ambarawa'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Map Section */}
        <div className="bg-white rounded-lg shadow mb-6 overflow-hidden">
          <div className="p-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">
              Peta Jalur Fiber Optic - {selectedArea === 'ungaran' ? 'Ungaran' : 'Ambarawa'}
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Menampilkan {filteredPoints.length} titik dan {filteredRoutes.length} jalur FO
            </p>
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
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* FO Points Table */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Titik-titik FO</h3>
              <p className="text-sm text-gray-600 mt-1">{filteredPoints.length} titik ditemukan</p>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nama</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipe</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredPoints.length > 0 ? filteredPoints.map((point) => (
                    <tr key={point.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-4">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{point.name}</div>
                          <div className="text-xs text-gray-500 mt-1">{point.description}</div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                          {point.type.charAt(0).toUpperCase() + point.type.slice(1)}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          point.status === 'active' ? 'bg-green-100 text-green-800' :
                          point.status === 'inactive' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {point.status === 'active' ? 'Aktif' : 
                           point.status === 'inactive' ? 'Non-aktif' : 'Maintenance'}
                        </span>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={3} className="px-4 py-8 text-center text-gray-500">
                        <div className="flex flex-col items-center">
                          <svg className="w-8 h-8 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.034 0-3.9.785-5.291 2.09M6.343 6.343A8 8 0 1021.314 8.686" />
                          </svg>
                          <p>Belum ada data titik FO untuk area {selectedArea === 'ungaran' ? 'Ungaran' : 'Ambarawa'}</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* FO Routes Table */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Jalur-jalur FO</h3>
              <p className="text-sm text-gray-600 mt-1">{filteredRoutes.length} jalur ditemukan</p>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nama</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Titik</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredRoutes.length > 0 ? filteredRoutes.map((route) => (
                    <tr key={route.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-4">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{route.name}</div>
                          <div className="text-xs text-gray-500 mt-1">{route.description}</div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-sm text-gray-900">
                          {route.coordinates.length} titik
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          route.status === 'active' ? 'bg-green-100 text-green-800' :
                          route.status === 'inactive' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {route.status === 'active' ? 'Aktif' : 
                           route.status === 'inactive' ? 'Non-aktif' : 'Maintenance'}
                        </span>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={3} className="px-4 py-8 text-center text-gray-500">
                        <div className="flex flex-col items-center">
                          <svg className="w-8 h-8 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V7.618a1 1 0 01.553-.894L9 4l6 3 6-3 6 3v8.764a1 1 0 01-.553.894L21 20l-6-3-6 3z" />
                          </svg>
                          <p>Belum ada data jalur FO untuk area {selectedArea === 'ungaran' ? 'Ungaran' : 'Ambarawa'}</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Admin Controls Placeholder */}
        <div className="mt-6 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start">
            <svg className="w-5 h-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h4 className="text-blue-900 text-sm font-medium mb-1">Informasi Data FO</h4>
              <p className="text-blue-800 text-sm">
                Saat ini menampilkan data fiber optik untuk area <strong>{selectedArea === 'ungaran' ? 'Ungaran' : 'Ambarawa'}</strong>. 
                Data mencakup {filteredPoints.length} titik infrastruktur dan {filteredRoutes.length} jalur kabel.
              </p>
              <p className="text-blue-700 text-xs mt-2">
                💡 Klik pada marker atau jalur di peta untuk melihat detail informasi.
              </p>
            </div>
          </div>
        </div>
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

      <Footer />
    </MainLayout>
  );
}
