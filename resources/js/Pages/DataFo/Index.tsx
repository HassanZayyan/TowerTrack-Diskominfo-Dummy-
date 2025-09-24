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
import FoDetailModal from '@/Components/DataFo/FoDetailModal';

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

// Custom icons for different FO point types based on available images
const createCustomIcon = (color: string, iconText: string) => {
  const iconHtml = `
    <div style="
      background-color: ${color};
      width: 24px;
      height: 24px;
      border-radius: 50%;
      border: 2px solid white;
      box-shadow: 0 2px 4px rgba(0,0,0,0.3);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 8px;
      color: white;
      font-weight: bold;
      font-family: Arial, sans-serif;
    ">${iconText}</div>
  `;
  
  return L.divIcon({
    html: iconHtml,
    className: 'custom-fo-icon',
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12]
  });
};

const getIconByImages = (images: { isp: string | null; pole: string | null; junction_box: string | null }) => {
  // Cek apakah gambar benar-benar ada (bukan null, bukan "-", dan bukan string kosong)
  const hasPole = !!images.pole && images.pole !== '-' && images.pole.trim() !== '';
  const hasISP = !!images.isp && images.isp !== '-' && images.isp.trim() !== '';
  const hasJunctionBox = !!images.junction_box && images.junction_box !== '-' && images.junction_box.trim() !== '';
  
  // 1. Ada tiang, ISP dan Joint Box -> pole ISP Joint Box (icon = PIJ) - Ungu
  if (hasPole && hasISP && hasJunctionBox) {
    return createCustomIcon('#8B5CF6', 'PIJ');
  }
  
  // 2. Ada tiang dan ISP -> pole and ISP (icon = PI) - Hijau
  if (hasPole && hasISP && !hasJunctionBox) {
    return createCustomIcon('#10B981', 'PI');
  }
  
  // 3. Ada tiang dan Joint Box -> Joint Box (icon = JB) - Orange
  if (hasPole && !hasISP && hasJunctionBox) {
    return createCustomIcon('#F59E0B', 'JB');
  }
  
  // 4. Hanya ada gambar tiang -> pole (icon = P) - Biru
  if (hasPole && !hasISP && !hasJunctionBox) {
    return createCustomIcon('#3B82F6', 'P');
  }
  
  // 5. Hanya ada ISP tanpa tiang -> ISP saja (icon = I) - Cyan
  if (!hasPole && hasISP && !hasJunctionBox) {
    return createCustomIcon('#06B6D4', 'I');
  }
  
  // 6. Hanya ada Joint Box tanpa tiang -> JB saja (icon = J) - Amber
  if (!hasPole && !hasISP && hasJunctionBox) {
    return createCustomIcon('#F59E0B', 'J');
  }
  
  // 7. Ada ISP dan Joint Box tanpa tiang -> ISP + JB (icon = IJ) - Pink
  if (!hasPole && hasISP && hasJunctionBox) {
    return createCustomIcon('#EC4899', 'IJ');
  }
  
  // Default untuk kasus lain - Abu-abu
  return createCustomIcon('#6B7280', '?');
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
  const [detailData, setDetailData] = useState<any>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [toast, setToast] = useState<{ show: boolean; type: 'info' | 'success' | 'warning' | 'error'; title?: string; message?: string }>({ show: false, type: 'info' });
  const [loading, setLoading] = useState(false);
  const [mapCenter, setMapCenter] = useState<[number, number]>([-7.1368, 110.4044]);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const mapContainerRef = useRef<HTMLDivElement>(null);

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
    
    // Type filtering based on image combinations
    let matchesType = true;
    if (selectedType !== 'all') {
      const images = point.images || { isp: null, pole: null, junction_box: null };
      const hasIsp = Boolean(images.isp);
      const hasPole = Boolean(images.pole);
      const hasJunction = Boolean(images.junction_box);
      
      switch (selectedType) {
        case 'pole_isp_junction':
          matchesType = hasPole && hasIsp && hasJunction;
          break;
        case 'pole_isp':
          matchesType = hasPole && hasIsp && !hasJunction;
          break;
        case 'pole_junction':
          matchesType = hasPole && !hasIsp && hasJunction;
          break;
        case 'isp_junction':
          matchesType = !hasPole && hasIsp && hasJunction;
          break;
        case 'pole_only':
          matchesType = hasPole && !hasIsp && !hasJunction;
          break;
        case 'isp_only':
          matchesType = !hasPole && hasIsp && !hasJunction;
          break;
        case 'junction_only':
          matchesType = !hasPole && !hasIsp && hasJunction;
          break;
        default:
          matchesType = true;
      }
    }
    
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

  // Export functionality
  const handleExport = () => {
    try {
      // Create CSV content
      const csvHeaders = [
        'ID', 'Nama', 'Latitude', 'Longitude', 'Tipe', 'Jalur', 
        'Urutan', 'Deskripsi', 'Area', 'Status', 'Ada Gambar ISP', 
        'Ada Gambar Tiang', 'Ada Gambar JB'
      ];
      
      const csvRows = filteredPoints.map(point => [
        point.id,
        `"${point.name}"`,
        point.latitude,
        point.longitude,
        point.type,
        `"${point.route_name}"`,
        point.sequence_number,
        `"${point.description || ''}"`,
        point.area || selectedArea,
        point.status || 'active',
        point.images.isp ? 'Ya' : 'Tidak',
        point.images.pole ? 'Ya' : 'Tidak',
        point.images.junction_box ? 'Ya' : 'Tidak'
      ]);
      
      const csvContent = [csvHeaders.join(','), ...csvRows.map(row => row.join(','))].join('\n');
      
      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `data-fo-${selectedArea}-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Show success toast
      setToast({
        show: true,
        type: 'success',
        title: 'Export Berhasil',
        message: `Data ${filteredPoints.length} titik FO berhasil diekspor ke CSV`
      });
    } catch (error) {
      console.error('Export error:', error);
      setToast({
        show: true,
        type: 'error',
        title: 'Export Gagal',
        message: 'Terjadi kesalahan saat mengekspor data'
      });
    }
  };

  // Fullscreen functionality
  const handleFullscreen = () => {
    if (!mapContainerRef.current) return;
    
    try {
      if (!isFullscreen) {
        // Enter fullscreen
        if (mapContainerRef.current.requestFullscreen) {
          mapContainerRef.current.requestFullscreen();
        } else if ((mapContainerRef.current as any).webkitRequestFullscreen) {
          (mapContainerRef.current as any).webkitRequestFullscreen();
        } else if ((mapContainerRef.current as any).msRequestFullscreen) {
          (mapContainerRef.current as any).msRequestFullscreen();
        }
        setIsFullscreen(true);
        
        setToast({
          show: true,
          type: 'info',
          title: 'Mode Fullscreen',
          message: 'Tekan ESC untuk keluar dari mode fullscreen'
        });
      } else {
        // Exit fullscreen
        if (document.exitFullscreen) {
          document.exitFullscreen();
        } else if ((document as any).webkitExitFullscreen) {
          (document as any).webkitExitFullscreen();
        } else if ((document as any).msExitFullscreen) {
          (document as any).msExitFullscreen();
        }
        setIsFullscreen(false);
      }
    } catch (error) {
      console.error('Fullscreen error:', error);
      setToast({
        show: true,
        type: 'error',
        title: 'Fullscreen Gagal',
        message: 'Browser tidak mendukung mode fullscreen'
      });
    }
  };

  // Handle detail functionality
  const handleShowDetail = async (type: 'point' | 'route', item: any) => {
    setDetailLoading(true);
    setShowDetailModal(true);
    
    try {
      const response = await fetch(`/fo-details/${type}/${item.id}`);
      const result = await response.json();
      
      if (result.success) {
        setDetailData(result);
      } else {
        setToast({
          show: true,
          type: 'error',
          title: 'Error',
          message: result.message || 'Gagal memuat detail data'
        });
        setDetailData(null);
      }
    } catch (error) {
      console.error('Error fetching detail:', error);
      setToast({
        show: true,
        type: 'error',
        title: 'Error',
        message: 'Terjadi kesalahan saat memuat detail'
      });
      setDetailData(null);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleCloseDetailModal = () => {
    setShowDetailModal(false);
    setDetailData(null);
    setDetailLoading(false);
  };
  


  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isCurrentlyFullscreen = !!(
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).msFullscreenElement
      );
      setIsFullscreen(isCurrentlyFullscreen);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('msfullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('msfullscreenchange', handleFullscreenChange);
    };
  }, []);

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
              <p className="text-sm text-gray-600 mt-1">Visualisasi titik dan jalur FO di area Ungaran</p>
            </div>
            <div className="flex items-center space-x-2">
              <button 
                onClick={handleExport}
                className="px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors flex items-center gap-2"
                title="Export data ke CSV"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Export
              </button>
              <button 
                onClick={handleFullscreen}
                className="px-3 py-2 text-sm font-medium text-white rounded-md hover:opacity-90 transition-colors flex items-center gap-2" 
                style={{ backgroundColor: '#B71C1C' }}
                title={isFullscreen ? "Keluar dari fullscreen" : "Masuk ke mode fullscreen"}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {isFullscreen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 9V4.5M9 9H4.5M9 9L3.5 3.5M15 9h4.5M15 9V4.5M15 9l5.5-5.5M9 15v4.5M9 15H4.5M9 15l-5.5 5.5M15 15h4.5M15 15v4.5m0-4.5l5.5 5.5" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                  )}
                </svg>
                {isFullscreen ? 'Exit' : 'Fullscreen'}
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
            
            <div 
              ref={mapContainerRef}
              className={`w-full ${isFullscreen ? 'fixed inset-0 z-50 bg-white' : ''}`} 
              style={isFullscreen ? { height: '100vh', width: '100vw' } : mapContainerStyle}
            >
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
                       icon={getIconByImages(point.images)}
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
            <h4 className="text-sm font-medium text-gray-900 mb-3">Legenda Titik FO:</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-purple-500 flex items-center justify-center text-white text-xs font-bold shadow-sm border-2 border-white" style={{ fontSize: '7px' }}>PIJ</div>
                <span className="text-xs text-gray-700">Pole + ISP + JB</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center text-white text-xs font-bold shadow-sm border-2 border-white" style={{ fontSize: '8px' }}>PI</div>
                <span className="text-xs text-gray-700">Pole + ISP</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-orange-500 flex items-center justify-center text-white text-xs font-bold shadow-sm border-2 border-white" style={{ fontSize: '8px' }}>JB</div>
                <span className="text-xs text-gray-700">Pole + Joint Box</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold shadow-sm border-2 border-white">P</div>
                <span className="text-xs text-gray-700">Pole Saja</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-cyan-500 flex items-center justify-center text-white text-xs font-bold shadow-sm border-2 border-white">I</div>
                <span className="text-xs text-gray-700">ISP Saja</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-amber-500 flex items-center justify-center text-white text-xs font-bold shadow-sm border-2 border-white">J</div>
                <span className="text-xs text-gray-700">Joint Box Saja</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-pink-500 flex items-center justify-center text-white text-xs font-bold shadow-sm border-2 border-white" style={{ fontSize: '8px' }}>IJ</div>
                <span className="text-xs text-gray-700">ISP + Joint Box</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-gray-500 flex items-center justify-center text-white text-xs font-bold shadow-sm border-2 border-white">?</div>
                <span className="text-xs text-gray-700">Tidak Ada Gambar</span>
              </div>
            </div>
            <div className="pt-3 border-t border-gray-300">
              <h5 className="text-sm font-medium text-gray-900 mb-2">Legenda Jalur:</h5>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-gray-600">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-1 bg-blue-500" style={{ height: '3px' }}></div>
                  <span>Jalur Mengikuti Jalan (GeoJSON)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-1 bg-blue-500" style={{ 
                    height: '2px', 
                    backgroundImage: 'repeating-linear-gradient(to right, #3B82F6 0, #3B82F6 3px, transparent 3px, transparent 8px)' 
                  }}></div>
                  <span>Jalur Langsung (Point-to-Point)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-1 bg-green-500"></div>
                  <span>Jalur Aktif</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-1 bg-yellow-500"></div>
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
          onPointClick={(point) => handleShowDetail('point', point)}
          onRouteClick={(route) => handleShowDetail('route', route)}
        />


      </div>
      
      {/* Detail Modal */}
      <FoDetailModal
         isOpen={showDetailModal}
         detailData={detailData}
         loading={detailLoading}
         onClose={handleCloseDetailModal}
       />

      {/* Toast Notification */}
      <AlertToast
        show={toast.show}
        type={toast.type}
        title={toast.title}
        message={toast.message}
        onClose={() => setToast({ ...toast, show: false })}
      />
    </MainLayout>
  );
}
