import React, { useState, useRef, useEffect } from 'react';
import { Head, router } from '@inertiajs/react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import AppBar from '@/Components/AppBar';
import Footer from '@/Components/Footer';
import AlertToast from '@/Components/AlertToast';
import HeroSection from '@/Components/HeroSection';
import AnimatedButton from '@/Components/AnimatedButton';
import StaggeredContainer from '@/Components/StaggeredContainer';

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
  area: string;
  status: string;
  color: string;
  total_distance: number;
  total_points: number;
  description: string;
  routing_service?: string | null;
  // Polyline data excluded from initial load - loaded on-demand
  path_coordinates?: Array<{ lat: number; lng: number }>;
  polyline?: Array<[number, number]>;
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
  // Initialize from URL for shareable state
  const initParams = new URLSearchParams(window.location.search);
  const initArea = initParams.get('area') || currentArea;
  const initSearch = initParams.get('search') || '';
  const initType = initParams.get('type') || 'all';
  const initStatus = initParams.get('status') || 'all';

  const [selectedArea, setSelectedArea] = useState(initArea);
  const [searchTerm, setSearchTerm] = useState(initSearch);
  const [selectedType, setSelectedType] = useState(initType);
  const [selectedStatus, setSelectedStatus] = useState(initStatus);
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
  
  // Lazy loading state for routes
  const [selectedRouteIds, setSelectedRouteIds] = useState<number[]>([]);
  const [loadedRoutes, setLoadedRoutes] = useState<Map<number, any>>(new Map());
  const [loadingRoutes, setLoadingRoutes] = useState<Set<number>>(new Set());

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

  const filteredRoutes: FoRoute[] = currentMapData.routes?.filter(route => {
    // Routes are now simple metadata without polylines
    if (!route) {
      return false;
    }
    
    const matchesSearch = route.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         route.description?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  }).map(route => ({
    id: route.id,
    area: selectedArea,
    status: 'active',
    // Ensure all required fields exist with proper types
    name: route.name || 'Unnamed Route',
    color: route.color || '#3B82F6',
    total_distance: typeof route.total_distance === 'number' ? route.total_distance : 0,
    total_points: typeof route.total_points === 'number' ? route.total_points : 0,
    description: route.description || 'No description available',
    routing_service: route.routing_service || null,
    // Optional fields not included in initial load
    coordinates: undefined,
    polyline: undefined,
    path_coordinates: undefined,
  })) || [];

  const handleAreaChange = (area: string) => {
    setSelectedArea(area);
    // Keep other filters in URL while performing a server request for area change
    router.get('/data-fo', { 
      area,
      ...(searchTerm && { search: searchTerm }),
      ...(selectedType !== 'all' && { type: selectedType }),
      ...(selectedStatus !== 'all' && { status: selectedStatus })
    }, { preserveState: true, preserveScroll: true, replace: true });
  };

  // Sync client-side filters to URL without triggering request
  useEffect(() => {
    const params = new URLSearchParams();
    if (selectedArea) params.set('area', selectedArea);
    if (searchTerm) params.set('search', searchTerm);
    if (selectedType !== 'all') params.set('type', selectedType);
    if (selectedStatus !== 'all') params.set('status', selectedStatus);
    const query = params.toString();
    const newUrl = query ? `/data-fo?${query}` : '/data-fo';
    window.history.replaceState({}, '', newUrl);
  }, [selectedArea, searchTerm, selectedType, selectedStatus]);

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

  // Load route polyline on-demand
  const loadRoutePolyline = async (routeId: number) => {
    // Check if already loaded
    if (loadedRoutes.has(routeId)) {
      console.log(`Route ${routeId} already loaded from cache`);
      return;
    }

    // Check if already loading
    if (loadingRoutes.has(routeId)) {
      console.log(`Route ${routeId} is already being loaded`);
      return;
    }

    try {
      // Add to loading set
      setLoadingRoutes(prev => new Set(prev).add(routeId));

      console.log(`Loading polyline for route ${routeId}...`);
      const response = await fetch(`/api/fo-routes/${routeId}/polyline`);
      const result = await response.json();

      if (result.success && result.data) {
        // Add to loaded routes cache
        setLoadedRoutes(prev => {
          const newMap = new Map(prev);
          newMap.set(routeId, result.data);
          return newMap;
        });

        console.log(`Route ${routeId} loaded successfully`, result.data);
        
        // Show different message if route was generated on-demand
        const wasGenerated = result.data.was_generated_on_demand || false;
        setToast({
          show: true,
          type: 'success',
          title: wasGenerated ? 'Jalur Dibuat & Dimuat' : 'Jalur Dimuat',
          message: wasGenerated 
            ? `Jalur "${result.data.name}" berhasil dibuat menggunakan OpenRouteService dan dimuat`
            : `Jalur "${result.data.name}" berhasil dimuat dari cache`
        });
      } else {
        console.error(`Failed to load route ${routeId}:`, result.message);
        setToast({
          show: true,
          type: 'error',
          title: 'Error',
          message: result.message || 'Gagal memuat jalur'
        });
      }
    } catch (error) {
      console.error(`Error loading route ${routeId}:`, error);
      setToast({
        show: true,
        type: 'error',
        title: 'Error',
        message: 'Terjadi kesalahan saat memuat jalur'
      });
    } finally {
      // Remove from loading set
      setLoadingRoutes(prev => {
        const newSet = new Set(prev);
        newSet.delete(routeId);
        return newSet;
      });
    }
  };

  // Handle route selection from dropdown
  const handleRouteSelection = (routeId: number) => {
    const isSelected = selectedRouteIds.includes(routeId);
    
    if (isSelected) {
      // Unselect route
      setSelectedRouteIds(prev => prev.filter(id => id !== routeId));
    } else {
      // Select route and load its polyline
      setSelectedRouteIds(prev => [...prev, routeId]);
      loadRoutePolyline(routeId);
    }
  };

  // Toggle all routes
  const handleToggleAllRoutes = () => {
    if (selectedRouteIds.length === currentMapData.routes.length) {
      // Unselect all
      setSelectedRouteIds([]);
    } else {
      // Select all and load all routes
      const allRouteIds = currentMapData.routes.map((r: any) => r.id);
      setSelectedRouteIds(allRouteIds);
      
      // Load all routes that aren't already loaded
      allRouteIds.forEach((id: number) => {
        if (!loadedRoutes.has(id)) {
          loadRoutePolyline(id);
        }
      });
    }
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
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <Head title="Data Fiber Optic" />
      
      {/* App Bar */}
      <AppBar currentPage="/data-fo" />
      
      {/* Full Screen Hero Section - Outside MainLayout */}
      <HeroSection
        title="Data Fiber Optic Kabupaten Semarang"
        subtitle="Kelola dan pantau infrastruktur jaringan fiber optic untuk konektivitas digital yang optimal di seluruh wilayah Kabupaten Semarang."
        variant="brand"
        align="center"
        backgroundImage="/images/fo-hero-section.png"
        fullScreen={true}
        actions={
          <>
            <AnimatedButton
              variant="glass"
              size="lg"
              animation="scale"
              onClick={() => {
                const mapSection = document.querySelector('[data-section="map"]');
                mapSection?.scrollIntoView({ behavior: 'smooth' });
              }}
              icon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
              }
            >
              Lihat Peta FO
            </AnimatedButton>
            <AnimatedButton
              variant="primary"
              size="lg"
              animation="glow"
              onClick={() => {
                const tableSection = document.querySelector('[data-section="table"]');
                tableSection?.scrollIntoView({ behavior: 'smooth' });
              }}
              icon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              }
            >
              Lihat Data Tabel
            </AnimatedButton>
          </>
        }
      />

      {/* Content Section */}
      <div className="flex-1">
        <div className="mx-auto max-w-screen-2xl px-4 sm:px-6 lg:px-8">
          <main className="py-6">
            <div className="p-4 sm:p-6">


        {/* Statistics */}  
        <FoStats 
          filteredPoints={filteredPoints}
          filteredRoutes={filteredRoutes}
          selectedArea={selectedArea.charAt(0).toUpperCase() + selectedArea.slice(1)}
        />

        {/* Interactive Filters */}
        <StaggeredContainer delay={200} animationType="fadeInUp" duration={300}>
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
        </StaggeredContainer>

        {/* Map Section */}
        <StaggeredContainer delay={250} animationType="fadeInUp" duration={300}>
          <div className="bg-white rounded-lg shadow mb-6 overflow-hidden" data-section="map">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between mb-4">
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

            {/* Route Selection Dropdown */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-1">Pilih Jalur FO untuk Ditampilkan</h4>
                  <p className="text-xs text-gray-600">Klik jalur di bawah untuk memuat dan menampilkan jalur di peta</p>
                </div>
                <button
                  onClick={handleToggleAllRoutes}
                  className="px-3 py-1.5 text-xs font-medium text-white rounded-md transition-colors flex items-center gap-1"
                  style={{ backgroundColor: '#B71C1C' }}
                  title={selectedRouteIds.length === currentMapData.routes.length ? "Sembunyikan semua jalur" : "Tampilkan semua jalur"}
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {selectedRouteIds.length === currentMapData.routes.length ? 'Sembunyikan Semua' : 'Tampilkan Semua'}
                </button>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {currentMapData.routes.map((route: any) => {
                  const isSelected = selectedRouteIds.includes(route.id);
                  const isLoading = loadingRoutes.has(route.id);
                  const isLoaded = loadedRoutes.has(route.id);
                  
                  return (
                    <button
                      key={route.id}
                      onClick={() => handleRouteSelection(route.id)}
                      disabled={isLoading}
                      className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all ${
                        isSelected
                          ? 'bg-white border-2 shadow-sm'
                          : 'bg-white border border-gray-200 hover:bg-gray-50'
                      } ${isLoading ? 'opacity-50 cursor-wait' : 'cursor-pointer'}`}
                      style={{
                        borderColor: isSelected ? route.color : undefined
                      }}
                      title={`${route.name} - ${route.total_distance?.toFixed(1) || 0} km`}
                    >
                      <div
                        className="w-4 h-4 rounded-full flex-shrink-0"
                        style={{ backgroundColor: route.color || '#3B82F6' }}
                      />
                      <span className="flex-1 text-left truncate text-gray-900">{route.name}</span>
                      {isLoading && (
                        <div className="flex items-center gap-1">
                          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-red-600"></div>
                          <span className="text-xs text-gray-500">Loading...</span>
                        </div>
                      )}
                      {isSelected && isLoaded && (
                        <div className="flex items-center gap-1">
                          <svg className="w-4 h-4 text-green-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          {loadedRoutes.get(route.id)?.has_geojson && (
                            <span className="text-xs font-medium text-green-600" title="Menggunakan GeoJSON dari OpenRouteService">
                              GeoJSON
                            </span>
                          )}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              {selectedRouteIds.length > 0 && (
                <div className="mt-3 text-xs text-gray-600">
                  {selectedRouteIds.length} dari {currentMapData.routes.length} jalur dipilih
                  {loadingRoutes.size > 0 && ` • ${loadingRoutes.size} sedang dimuat...`}
                </div>
              )}
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
                
                 {/* Render FO Routes (Polylines) - Only selected and loaded routes */}
                 {Array.from(loadedRoutes.entries()).map(([routeId, routeData]) => {
                   // Only render if selected
                   if (!selectedRouteIds.includes(routeId)) return null;

                   // Validate polyline data before rendering
                   const validPolyline = Array.isArray(routeData.polyline) && routeData.polyline.length > 0 
                     ? routeData.polyline.filter((coord: any) => 
                         Array.isArray(coord) && coord.length === 2 && 
                         typeof coord[0] === 'number' && typeof coord[1] === 'number' &&
                         !isNaN(coord[0]) && !isNaN(coord[1])
                       )
                     : [];
                   
                   if (validPolyline.length === 0) return null;
                   
                   return (
                     <Polyline
                       key={routeData.id}
                       positions={validPolyline}
                       pathOptions={{
                         color: routeData.color || '#3B82F6',
                         weight: 4,
                         opacity: 0.8,
                       }}
                       eventHandlers={{
                         click: () => {
                           console.log('Route clicked:', routeData.name);
                           setSelectedRoute(routeData);
                         }
                       }}
                     >
                    <Popup maxWidth={300}>
                      <div className="p-3 min-w-[250px]">
                        <h4 className="font-semibold text-sm text-gray-900 mb-2">{routeData.name}</h4>
                        <p className="text-xs text-gray-600 mb-3">{routeData.description}</p>
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-gray-500">Total Titik:</span>
                            <span className="text-xs font-medium">{routeData.total_points}</span>
                          </div>
                           <div className="flex justify-between items-center">
                             <span className="text-xs text-gray-500">Jarak Total:</span>
                             <span className="text-xs font-medium">
                               {typeof routeData.total_distance === 'number' ? routeData.total_distance.toFixed(2) : '0.00'} km
                             </span>
                           </div>
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: routeData.color }}></div>
                            <span className="text-xs text-gray-500">Jalur Dimuat</span>
                          </div>
                          {routeData.has_geojson && (
                            <div className="text-xs text-green-600 font-medium flex items-center gap-1">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                              Menggunakan GeoJSON
                            </div>
                          )}
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
          </div>
          </div>
        </StaggeredContainer>

        {/* Data Tables */}
        <StaggeredContainer delay={300} animationType="fadeInUp" duration={300}>
          <div data-section="table">
            <FoTable
               filteredPoints={filteredPoints}
               filteredRoutes={filteredRoutes}
               viewMode={viewMode}
               onPointClick={(point) => handleShowDetail('point', point)}
               onRouteClick={(route) => handleShowDetail('route', route)}
             />
           </div>
         </StaggeredContainer>

            </div>
          </main>
        </div>
      </div>
      
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
      
      {/* Footer */}
      <Footer />
    </div>
  );
}
