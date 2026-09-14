import React, { useState, useRef, useEffect } from 'react';
import { Head, router } from '@inertiajs/react';
import { MapContainer, TileLayer, Marker, Tooltip, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import AppBar from '@/Components/AppBar';
import Footer from '@/Components/Footer';
import AlertToast from '@/Components/AlertToast';
import HeroSection from '@/Components/HeroSection';
import HeroIsoArt from '@/Components/HeroIsoArt';
import AnimatedButton from '@/Components/AnimatedButton';
import StaggeredContainer from '@/Components/StaggeredContainer';

import FoStats from '@/Components/DataFo/FoStats';
import FoFilters from '@/Components/DataFo/FoFilters';
import FoTable from '@/Components/DataFo/FoTable';
import FoDetailModal from '@/Components/DataFo/FoDetailModal';
import { FoPointDetailModal } from '@/Components/DetailModal';
import { getIconByImagesAndSide } from '@/utils/foIconUtils';
import { foPointStyle, SIDE_OF_ROAD_STYLES, FO_ROUTE_FALLBACK } from '@/lib/map-palette';
import { getFOStatusColor } from '@/utils/statusHelpers';
import { useRouteCache } from '@/Hooks/useRouteCache';
import { getRouteCacheKey, formatTimestamp } from '@/utils/routeCacheUtils';

// Fix Leaflet default icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Add custom CSS for map container - responsive height
const mapContainerStyle = {
  height: '400px', // Smaller on mobile
  width: '100%',
  position: 'relative' as const,
  zIndex: 1
};

// Note: Icon generation moved to foIconUtils.ts for better organization
// Using getIconByImagesAndSide() which includes side_of_road indicator

interface Provider {
  id: string | number; // Can be string (MD5 hash) or number
  name: string;
}

interface FoPoint {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  type: string;
  route_name: string;
  sequence_number: number;
  description?: string;
  side_of_road?: 'left' | 'right' | 'unknown' | null;
  images: {
    isp: string | null;
    pole: string | null;
    junction_box: string | null;
  };
  has_images: boolean;
  providers?: Provider[];
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
  providers?: Provider[];
  updated_at?: number | null; // Route updated_at timestamp for cache validation
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
  availableProviders?: Provider[];
  selectedProvider?: string;
  mapData?: MapData;
  detailData?: any; // Add detailData prop for Inertia response
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

// Component to center map on a specific point
function CenterOnPoint({ point, onCentered }: { point: { lat: number; lng: number } | null; onCentered: () => void }) {
  const map = useMap();
  
  useEffect(() => {
    if (point && point.lat && point.lng) {
      const lat = Number(point.lat);
      const lng = Number(point.lng);
      
      if (Number.isFinite(lat) && Number.isFinite(lng) && lat !== 0 && lng !== 0 && Math.abs(lat) <= 90 && Math.abs(lng) <= 180) {
        map.flyTo([lat, lng], 17, {
          duration: 1.5
        });
        onCentered();
      }
    }
  }, [point, map, onCentered]);
  
  return null;
}

export default function DataFoIndex({ 
  foPoints = [], 
  foRoutes = [],
  currentArea = 'ungaran',
  availableAreas = [],
  availableProviders = [],
  selectedProvider: initialProvider = 'all',
  mapData,
  detailData: propDetailData
}: DataFoProps) {
  // Initialize from URL for shareable state
  const initParams = new URLSearchParams(window.location.search);
  const initArea = initParams.get('area') || currentArea;
  const initSearch = initParams.get('search') || '';
  const initType = initParams.get('type') || 'all';
  const initStatus = initParams.get('status') || 'all';
  const initProvider = initParams.get('provider') || initialProvider;

  const [selectedArea, setSelectedArea] = useState(initArea);
  const [searchTerm, setSearchTerm] = useState(initSearch);
  const [selectedType, setSelectedType] = useState(initType);
  const [selectedStatus, setSelectedStatus] = useState(initStatus);
  const [selectedSide, setSelectedSide] = useState(initParams.get('side') || 'all');
  const [selectedProvider, setSelectedProvider] = useState(initProvider);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');
  const [showFilters, setShowFilters] = useState(true);
  const [selectedPoint, setSelectedPoint] = useState<any>(null);
  const [selectedRoute, setSelectedRoute] = useState<any>(null);
  const [detailData, setDetailData] = useState<any>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [selectedFoPoint, setSelectedFoPoint] = useState<FoPoint | null>(null);
  const [showFoPointModal, setShowFoPointModal] = useState(false);
  const [centerPoint, setCenterPoint] = useState<{ lat: number; lng: number } | null>(null);
  
  // Handle detailData from Inertia props (when using only: ['detailData'])
  useEffect(() => {
    if (propDetailData && propDetailData.success) {
      setDetailData(propDetailData);
      setShowDetailModal(true);
      setDetailLoading(false);
    }
  }, [propDetailData]);
  const [toast, setToast] = useState<{ show: boolean; type: 'info' | 'success' | 'warning' | 'error'; title?: string; message?: string }>({ show: false, type: 'info' });
  const [loading, setLoading] = useState(false);
  const [mapCenter, setMapCenter] = useState<[number, number]>([-7.1368, 110.4044]);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  
  // Lazy loading state for routes - using custom hook for cache management
  const [selectedRouteIds, setSelectedRouteIds] = useState<number[]>([]);
  // The route picker used 372px of vertical space for 18 items — with ~72% of
  // every chip dead — and it sat between the filters and the map, which is why
  // the FO map began 358px below the fold. Collapsed by default now.
  const [routePickerOpen, setRoutePickerOpen] = useState(false);
  const {
    loadedRoutes,
    setLoadedRoutes,
    loadingRoutes,
    setLoadingRoutes,
    validateMemoryCache,
    validateSessionStorageCache,
  } = useRouteCache({ foRoutes });
  
  // Marker visibility state - default true to show markers by default
  const [showMarkers, setShowMarkers] = useState<boolean>(true);

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
    
    // Status filtering
    let matchesStatus = true;
    if (selectedStatus !== 'all') {
      const pointStatus = point.status || 'active';
      matchesStatus = pointStatus.toLowerCase() === selectedStatus.toLowerCase();
    }
    
    // Note: Side of road filtering is done server-side for better performance
    // when combined with provider filter. Client-side filtering only for type, status, and search.
    
    return matchesSearch && matchesType && matchesStatus;
  }).map(point => ({
    ...point,
    area: point.area || selectedArea,
    status: point.status || 'active',
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
    color: route.color || FO_ROUTE_FALLBACK,
    total_distance: typeof route.total_distance === 'number' ? route.total_distance : 0,
    total_points: typeof route.total_points === 'number' ? route.total_points : 0,
    description: route.description || 'No description available',
    routing_service: route.routing_service || null,
    // Optional fields not included in initial load
    coordinates: undefined,
    polyline: undefined,
    path_coordinates: undefined,
  })) || [];

  // Helper function untuk build query params dengan semua filter
  const buildQueryParams = (updates: {
    area?: string;
    provider?: string;
    side?: string;
    type?: string;
    status?: string;
    search?: string;
  }) => {
    const params: Record<string, string> = {};
    
    // Area (always required)
    if (updates.area !== undefined) {
      params.area = updates.area;
    } else if (selectedArea) {
      params.area = selectedArea;
    }
    
    // Optional filters - only include if not 'all' or has value
    const searchValue = updates.search !== undefined ? updates.search : searchTerm;
    if (searchValue) {
      params.search = searchValue;
    }
    
    const typeValue = updates.type !== undefined ? updates.type : selectedType;
    if (typeValue !== 'all') {
      params.type = typeValue;
    }
    
    const statusValue = updates.status !== undefined ? updates.status : selectedStatus;
    if (statusValue !== 'all') {
      params.status = statusValue;
    }
    
    const providerValue = updates.provider !== undefined ? updates.provider : selectedProvider;
    if (providerValue !== 'all') {
      params.provider = providerValue;
    }
    
    const sideValue = updates.side !== undefined ? updates.side : selectedSide;
    if (sideValue !== 'all') {
      params.side = sideValue;
    }
    
    return params;
  };

  const handleAreaChange = (area: string) => {
    setSelectedArea(area);
    router.get('/data-fo', buildQueryParams({ area }), {
      preserveState: true,
      preserveScroll: true,
      replace: true
    });
  };

  const handleProviderChange = (provider: string) => {
    setSelectedProvider(provider);
    router.get('/data-fo', buildQueryParams({ provider }), {
      preserveState: true,
      preserveScroll: true,
      replace: true
    });
  };

  const handleSideChange = (side: string) => {
    setSelectedSide(side);
    router.get('/data-fo', buildQueryParams({ side }), {
      preserveState: true,
      preserveScroll: true,
      replace: true
    });
  };

  const handleStatusChange = (status: string) => {
    setSelectedStatus(status);
    router.get('/data-fo', buildQueryParams({ status }), {
      preserveState: true,
      preserveScroll: true,
      replace: true
    });
  };

  // Sync client-side filters to URL without triggering request
  useEffect(() => {
    const params = new URLSearchParams();
    if (selectedArea) params.set('area', selectedArea);
    if (searchTerm) params.set('search', searchTerm);
    if (selectedType !== 'all') params.set('type', selectedType);
    if (selectedStatus !== 'all') params.set('status', selectedStatus);
    if (selectedProvider !== 'all') params.set('provider', selectedProvider);
    if (selectedSide !== 'all') params.set('side', selectedSide);
    const query = params.toString();
    const newUrl = query ? `/data-fo?${query}` : '/data-fo';
    window.history.replaceState({}, '', newUrl);
  }, [selectedArea, searchTerm, selectedType, selectedStatus, selectedProvider, selectedSide]);

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

  // Handle detail functionality using Inertia.js standard
  const handleShowDetail = (type: 'point' | 'route', item: any) => {
    setDetailLoading(true);
    setShowDetailModal(true);
    
    // Use Inertia.js router.get to fetch details
    router.get(route('fo.details', { type, id: item.id }), {}, {
      preserveState: true,
      preserveScroll: true,
      only: ['detailData'], // Only fetch detailData prop
      onSuccess: (page: any) => {
        const detailData = page?.props?.detailData;
        if (detailData && detailData.success) {
          setDetailData(detailData);
        } else {
          setToast({
            show: true,
            type: 'error',
            title: 'Error',
            message: detailData?.message || 'Gagal memuat detail data'
          });
          setDetailData(null);
        }
        setDetailLoading(false);
      },
      onError: (errors: any) => {
        console.error('Error fetching detail:', errors);
        setToast({
          show: true,
          type: 'error',
          title: 'Error',
          message: 'Terjadi kesalahan saat memuat detail'
        });
        setDetailData(null);
        setDetailLoading(false);
      },
    });
  };

  const handleCloseDetailModal = () => {
    setShowDetailModal(false);
    setDetailData(null);
    setDetailLoading(false);
  };

  const handleViewMap = (point: FoPoint) => {
    // Modal sudah ditutup dari FoPointDetailModal, jadi tidak perlu setShowFoPointModal(false) lagi
    
    // Find the map center point for the FO point
    const lat = Number(point.latitude);
    const lng = Number(point.longitude);
    
    const hasValidCoords = Number.isFinite(lat) && Number.isFinite(lng) && lat !== 0 && lng !== 0 && Math.abs(lat) <= 90 && Math.abs(lng) <= 180;

    // If valid coordinates, programmatically focus on the point
    if (hasValidCoords) {
      // Pastikan body position sudah direstore (safety check)
      if (document.body.style.position === 'fixed') {
        const scrollY = document.body.style.top ? -parseInt(document.body.style.top) : window.scrollY;
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        document.body.style.overflow = '';
        window.scrollTo(0, scrollY);
      }
      
      // Scroll to the map section with center alignment for better visibility
      const mapElement = document.querySelector('[data-section="map"]') as HTMLElement;
      if (mapElement) {
        // First, scroll to center the map in viewport
        mapElement.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center',
          inline: 'nearest'
        });
        
        // Set center point after a small delay to ensure scroll completes and map renders
        setTimeout(() => {
          setCenterPoint({ lat, lng });
        }, 400);
      } else {
        // Fallback if element not found
        setCenterPoint({ lat, lng });
      }
    } else {
      setToast({
        show: true,
        type: 'warning',
        title: 'Koordinat Belum Terdata',
        message: 'Titik FO ini belum memiliki titik koordinat yang valid, sehingga tidak dapat ditampilkan di peta.',
      });
    }
  };

  // Reset center point after map has centered
  const handleCentered = () => {
    setCenterPoint(null);
  };

  // Load route polyline on-demand with persistent sessionStorage cache
  // DRY: Using custom hook and utilities for cache validation
  const loadRoutePolyline = async (routeId: number) => {
    const route = foRoutes.find((r: FoRoute) => r.id === routeId);
    
    // Step 1: Check memory cache (validates automatically via hook)
    if (validateMemoryCache(routeId)) {
      const cachedData = loadedRoutes.get(routeId);
      console.log(`✅ Route ${routeId} already loaded from memory cache (0 tokens)`, {
        route_updated_at: route?.updated_at ? formatTimestamp(route.updated_at) : 'N/A',
        cache_updated_at: cachedData?.updated_at ? formatTimestamp(cachedData.updated_at) : 'N/A',
      });
      return;
    }

    // Step 2: Check sessionStorage cache (validates automatically via hook)
    const cachedData = validateSessionStorageCache(routeId);
    if (cachedData) {
      setLoadedRoutes(prev => {
        const newMap = new Map(prev);
        newMap.set(routeId, cachedData);
        return newMap;
      });
      
      console.log(`✅ Route ${routeId} restored from sessionStorage`);
      setToast({
        show: true,
        type: 'success',
        title: ' Jalur Dimuat',
        message: `Jalur"${cachedData.name}" berhasil dimuat`
      });
      return;
    }

    // Step 3: Check if already loading
    if (loadingRoutes.has(routeId)) {
      console.log(`⏳ Route ${routeId} is already being loaded`);
      return;
    }

    // Step 4: Fetch from API (will generate if needed)
    try {
      setLoadingRoutes(prev => new Set(prev).add(routeId));
      console.log(`🌐 Loading polyline for route ${routeId} from API...`);
      
      const response = await fetch(`/api/fo-routes/${routeId}/polyline`);
      const result = await response.json();

      if (result.success && result.data) {
        setLoadedRoutes(prev => {
          const newMap = new Map(prev);
          newMap.set(routeId, result.data);
          return newMap;
        });

        // Persist to sessionStorage
        try {
          const cacheKey = getRouteCacheKey(routeId);
          sessionStorage.setItem(cacheKey, JSON.stringify({
            data: result.data,
            timestamp: Date.now(),
            route_updated_at: result.data.updated_at || route?.updated_at || null,
          }));
        } catch (e) {
          console.warn('Failed to persist to sessionStorage:', e);
        }

        const wasGenerated = result.data.was_generated_on_demand || false;
        setToast({
          show: true,
          type: 'success',
          title: wasGenerated ? ' Jalur Berhasil Dimuat' : ' Jalur Dimuat',
          message: `Jalur"${result.data.name}" ${wasGenerated ? 'berhasil dimuat' : 'dimuat dengan cepat'}`
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

  // Cache validation and restoration handled by useRouteCache hook (DRY)

  // Force map refresh when area changes
  useEffect(() => {
    // Small delay to ensure proper re-rendering
    const timer = setTimeout(() => {
      window.dispatchEvent(new Event('resize'));
    }, 100);
    
    return () => clearTimeout(timer);
  }, [selectedArea]);

  return (
    <div className="min-h-screen bg-canvas flex flex-col">
      <Head title="Data Fiber Optic" />
      
      {/* App Bar */}
      <AppBar currentPage="/data-fo" />
      
      {/* Hero. Identical configuration to /data-tower. */}
      <HeroSection
        eyebrow="Kabupaten Semarang"
        title="Data Jalur Fiber Optic"
        subtitle="Pantau titik dan jalur fiber optic yang membentuk konektivitas digital di seluruh wilayah kabupaten."
        variant="brand"
        align="left"
        art={<HeroIsoArt variant="fiber" />}
        fullScreen
        actions={
          <>
            <AnimatedButton
              variant="primary"
              size="lg"
              onClick={() => document.querySelector('[data-section="map"]')?.scrollIntoView({ behavior: 'smooth' })}
            >
              Lihat Peta FO
            </AnimatedButton>
            <AnimatedButton
              variant="outline"
              size="lg"
              onClick={() => document.querySelector('[data-section="table"]')?.scrollIntoView({ behavior: 'smooth' })}
            >
              Lihat Data Tabel
            </AnimatedButton>
          </>
        }
      />

      {/* Content Section */}
      <div className="flex-1">
        <div className="mx-auto w-full max-w-screen-2xl px-4 sm:px-6 lg:px-10">
          <main className="py-5 space-y-5">
        <FoStats
          filteredPoints={filteredPoints}
          filteredRoutes={filteredRoutes}
          selectedArea={selectedArea.charAt(0).toUpperCase() + selectedArea.slice(1)}
        />


        {/* Filters. The stat band is gone — its three figures moved into the
            head band, where they cost no extra vertical space. */}
        <StaggeredContainer delay={0} animationType="fadeInUp" duration={260}>
          <FoFilters
            selectedArea={selectedArea}
            onAreaChange={handleAreaChange}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            selectedType={selectedType}
            onTypeChange={setSelectedType}
            selectedStatus={selectedStatus}
            onStatusChange={handleStatusChange}
            selectedSide={selectedSide}
            onSideChange={handleSideChange}
          />
        </StaggeredContainer>

        {/* Map Section — the subject of this page. */}
        <StaggeredContainer delay={60} animationType="fadeInUp" duration={260}>
          <div className="rounded-lg border border-border bg-card shadow-md overflow-hidden" data-section="map">
          <div className="border-b border-border p-4">
            {/* Header Content - Responsive Layout */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 sm:gap-4 mb-3 sm:mb-4">
              {/* Title and Description Section */}
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-semibold tracking-tight text-foreground">Peta Jalur Fiber Optic</h3>
                <p className="mt-0.5 text-sm text-muted-foreground">Visualisasi titik dan jalur FO di area Ungaran</p>
              </div>

              {/* Action Buttons Section - Responsive Button Layout */}
              <div className="flex flex-col xs:flex-row gap-2 flex-wrap">
                {/* Provider Filter Dropdown */}
                <div className="w-full xs:w-auto min-w-[150px]">
                  <select
                    value={selectedProvider}
                    onChange={(e) => handleProviderChange(e.target.value)}
                    className="w-full rounded-lg border-input shadow-sm focus:border-ring focus:ring text-xs sm:text-sm pr-8 bg-white hover:bg-muted transition-colors"
                    title="Filter berdasarkan provider"
                    aria-label="Filter provider"
                  >
                    <option value="all">Semua Provider</option>
                    {Array.isArray(availableProviders) && availableProviders.length > 0 ? (
                      availableProviders.map((provider: Provider, index: number) => (
                        <option key={provider?.id || provider?.name || `provider-${index}`} value={provider.name}>
                          {provider.name}
                        </option>
                      ))
                    ) : (
                      <option disabled>Tidak ada provider tersedia</option>
                    )}
                  </select>
                </div>
                <button 
                  onClick={() => setShowMarkers(!showMarkers)}
                  className={`px-2.5 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-medium rounded-md transition-colors flex items-center justify-center gap-1.5 sm:gap-2 w-full xs:w-auto ${
                    showMarkers 
                      ? 'text-foreground bg-muted hover:bg-accent'
                      : 'bg-primary text-primary-foreground hover:bg-primary-hover'
                  }`}
                  title={showMarkers ?"Sembunyikan marker untuk melihat jalur dengan jelas" :"Tampilkan marker"}
                  aria-label={showMarkers ?"Sembunyikan marker" :"Tampilkan marker"}
                >
                  <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    {showMarkers ? (
                      <>
                        {/* Eye icon - markers visible */}
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </>
                    ) : (
                      <>
                        {/* Eye-off icon - markers hidden */}
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                        </>
                    )}
                  </svg>
                  {showMarkers ? 'Sembunyikan Marker' : 'Tampilkan Marker'}
                </button>
                <button 
                  onClick={handleExport}
                  className="inline-flex w-full items-center justify-center gap-1.5 rounded-md border border-input bg-background px-3 py-2 text-sm font-medium text-foreground transition-colors duration-140 hover:bg-accent focus-visible:outline-none focus-visible:ring focus-visible:ring-offset-2 xs:w-auto"
                  title="Export data ke CSV"
                >
                  <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Export
                </button>
                <button 
                  onClick={handleFullscreen}
                  className="px-2.5 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-white rounded-md hover:opacity-90 transition-colors flex items-center justify-center gap-1.5 sm:gap-2 w-full xs:w-auto"
                  title={isFullscreen ?"Keluar dari fullscreen" :"Masuk ke mode fullscreen"}
                >
                  <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

            {/* Route picker — collapsed by default so the map stays above the fold. */}
            <div className="rounded-lg border border-border bg-well">
              <div className="flex flex-wrap items-center gap-2 p-2.5">
                <button
                  type="button"
                  onClick={() => setRoutePickerOpen((v) => !v)}
                  aria-expanded={routePickerOpen}
                  className="inline-flex items-center gap-2 rounded-md px-2 py-1 text-sm font-semibold tracking-tight text-foreground transition-colors duration-140 hover:bg-accent focus-visible:outline-none focus-visible:ring focus-visible:ring-offset-2"
                >
                  <svg
                    className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ease-state ${routePickerOpen ? 'rotate-90' : ''}`}
                    fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                  Jalur FO
                </button>

                {/* Swatch preview, so the panel says something while closed. */}
                <div className="flex items-center -space-x-1" aria-hidden="true">
                  {currentMapData.routes.slice(0, 8).map((r: any) => (
                    <span
                      key={r.id}
                      className="h-2.5 w-2.5 rounded-full ring-2 ring-well"
                      style={{ backgroundColor: r.color || 'hsl(var(--neutral))' }}
                    />
                  ))}
                </div>

                <span className="text-sm text-muted-foreground tabular-nums">
                  <span className="font-semibold text-foreground">{selectedRouteIds.length}</span>
                  {' dari '}{currentMapData.routes.length}{' ditampilkan'}
                </span>
                {loadingRoutes.size > 0 && (
                  <span className="text-xs text-muted-foreground">
                    • <span className="animate-pulse">{loadingRoutes.size} dimuat…</span>
                  </span>
                )}

                {/* Action Button Section */}
                <div className="ml-auto flex justify-end">
                  <button
                    onClick={handleToggleAllRoutes}
                    className="inline-flex items-center justify-center gap-1.5 rounded-md border border-input bg-background px-2.5 py-1 text-xs font-medium text-foreground transition-colors duration-140 hover:bg-accent focus-visible:outline-none focus-visible:ring focus-visible:ring-offset-2"
                    title={selectedRouteIds.length === currentMapData.routes.length ?"Sembunyikan semua jalur" :"Tampilkan semua jalur"}
                  >
                    <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {selectedRouteIds.length === currentMapData.routes.length ? 'Sembunyikan Semua' : 'Tampilkan Semua'}
                  </button>
                </div>
              </div>
              
              <div
                className={`grid transition-[grid-template-rows] ease-state ${routePickerOpen ? 'grid-rows-[1fr] duration-260' : 'grid-rows-[0fr] duration-180'}`}
              >
                <div className="overflow-hidden">
                  <div className="grid grid-cols-1 gap-1.5 border-t border-border p-2.5 xs:grid-cols-2 lg:grid-cols-4">
                {currentMapData.routes.map((route: any) => {
                  const isSelected = selectedRouteIds.includes(route.id);
                  const isLoading = loadingRoutes.has(route.id);
                  const isLoaded = loadedRoutes.has(route.id);
                  
                  return (
                    <button
                      key={route.id}
                      onClick={() => handleRouteSelection(route.id)}
                      disabled={isLoading}
                      className={`flex items-center gap-2 rounded-md border px-2 py-1.5 text-xs font-medium transition-colors duration-140 focus-visible:outline-none focus-visible:ring focus-visible:ring-offset-1 ${
                        isSelected
                          ? 'border-border-strong bg-card text-foreground shadow-xs'
                          : 'border-transparent bg-card/60 text-muted-foreground hover:bg-card hover:text-foreground'
                      } ${isLoading ? 'cursor-wait opacity-50' : 'cursor-pointer'}`}
                      style={{
                        boxShadow: isSelected ? `inset 3px 0 0 0 ${route.color || 'hsl(var(--neutral))'}` : undefined,
                      }}
                      title={`${route.name} - ${route.total_distance?.toFixed(1) || 0} km`}
                    >
                      <div
                        className="h-2.5 w-2.5 flex-shrink-0 rounded-full"
                        style={{ backgroundColor: route.color || 'hsl(var(--neutral))' }}
                      />
                      <span className="flex-1 truncate text-left">{route.name}</span>
                      {isLoading && (
                        <div className="flex items-center gap-1">
                          <div className="animate-spin rounded-full h-2.5 w-2.5 sm:h-3 sm:w-3 border-b-2 border-primary"></div>
                          <span className="text-[10px] sm:text-xs text-muted-foreground hidden xs:inline">Loading...</span>
                        </div>
                      )}
                      {isSelected && isLoaded && (
                        <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-success-strong flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </button>
                  );
                })}
                  </div>
                </div>
              </div>

              {false && (
                <div className="mt-3 flex items-center justify-between text-xs">
                  <div className="text-foreground">
                    <span className="font-semibold text-sm">{selectedRouteIds.length}</span>
                    <span className="text-muted-foreground"> dari {currentMapData.routes.length} jalur ditampilkan</span>
                    {loadingRoutes.size > 0 && (
                      <span className="text-neutral-strong ml-2">
                        • <span className="animate-pulse font-medium">{loadingRoutes.size} sedang dimuat...</span>
                      </span>
                    )}
                  </div>
                  {loadedRoutes.size > 0 && (
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      <span>{loadedRoutes.size} siap ditampilkan</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          
          <div className="relative">
            {loading && (
              <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-20">
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                  <span className="text-sm text-muted-foreground">Memuat data peta...</span>
                </div>
              </div>
            )}
            
            <div 
              ref={mapContainerRef}
              className={`w-full ${isFullscreen ? 'fixed inset-0 z-50 bg-white' : 'h-[400px] sm:h-[500px] md:h-[600px]'}`} 
              style={isFullscreen ? { height: '100vh', width: '100vw' } : {}}
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
                
                {/* Center on point when requested */}
                {centerPoint && <CenterOnPoint point={centerPoint} onCentered={handleCentered} />}
                
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
                         color: routeData.color || FO_ROUTE_FALLBACK,
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
                    <Tooltip 
                      permanent={false}
                      direction="top"
                      offset={[0, -10]}
                      opacity={0.95}
                      className="custom-tooltip"
                    >
                      <div className="p-2.5 min-w-[220px] max-w-[260px]">
                        <div className="flex items-center gap-2 mb-1.5">
                          <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: routeData.color }}></div>
                          <h4 className="font-semibold text-xs text-foreground truncate">{routeData.name}</h4>
                        </div>
                        <div className="space-y-1 text-[10px]">
                          <div className="flex justify-between gap-2">
                            <span className="text-muted-foreground">Titik:</span>
                            <span className="font-medium text-foreground">{routeData.total_points}</span>
                          </div>
                          <div className="flex justify-between gap-2">
                            <span className="text-muted-foreground">Jarak:</span>
                            <span className="font-medium text-foreground">
                              {typeof routeData.total_distance === 'number' ? routeData.total_distance.toFixed(1) : '0.0'} km
                            </span>
                          </div>
                          {routeData.providers && routeData.providers.length > 0 && (
                            <div className="pt-1 border-t border-border">
                              <div className="flex flex-wrap gap-0.5">
                                {routeData.providers.slice(0, 2).map((provider: Provider) => (
                                  <span
                                    key={provider.id}
                                    className="inline-flex px-1.5 py-0.5 rounded text-[9px] font-medium bg-success-soft text-success-strong"
                                  >
                                    {provider.name}
                                  </span>
                                ))}
                                {routeData.providers.length > 2 && (
                                  <span className="text-[9px] text-muted-foreground">+{routeData.providers.length - 2}</span>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </Tooltip>
                   </Polyline>
                   );
                 })}
                
                 {/* Render FO Points (Markers) - Only render if showMarkers is true */}
                 {showMarkers && filteredPoints.map((point) => {
                   // Validate point coordinates before rendering
                   if (typeof point.latitude !== 'number' || typeof point.longitude !== 'number' ||
                       isNaN(point.latitude) || isNaN(point.longitude)) {
                     return null;
                   }
                   
                   // Build description for popup (consistent with data-tower format)
                   const buildDescription = () => {
                     const parts: string[] = [];
                     
                     // Deskripsi
                     if (point.description && point.description.trim()) {
                       parts.push(point.description);
                     }
                     
                     // Tipe
                     if (point.type) {
                       parts.push(`Tipe: ${point.type.charAt(0).toUpperCase() + point.type.slice(1)}`);
                     }
                     
                     // Jalur
                     if (point.route_name) {
                       parts.push(`Jalur: ${point.route_name}`);
                     }
                     
                     // Urutan
                     if (point.sequence_number) {
                       parts.push(`Urutan: #${point.sequence_number}`);
                     }
                     
                     // Posisi (Kiri/Kanan)
                     if (point.side_of_road && point.side_of_road !== 'unknown') {
                       const sideLabel = point.side_of_road === 'left' ? 'Kiri' : 'Kanan';
                       parts.push(`Posisi: ${sideLabel}`);
                     }
                     
                     // Status
                     if (point.status) {
                       const statusConfig = getFOStatusColor(point.status);
                       parts.push(`Status: ${statusConfig.label}`);
                     }
                     
                     // Provider (if available)
                     if (point.providers && Array.isArray(point.providers) && point.providers.length > 0) {
                       const providerNames = point.providers.map((p: any) => p.name || p).join(', ');
                       parts.push(`Provider: ${providerNames}`);
                     }
                     
                     return parts.length > 0 ? parts.join('<br/>') : 'Tidak ada informasi tambahan';
                   };
                   
                   return (
                     <Marker
                       key={point.id}
                       position={[point.latitude, point.longitude]}
                       icon={getIconByImagesAndSide(point.images, point.side_of_road)}
                       eventHandlers={{
                         click: () => {
                           console.log('Point clicked:', point.name);
                           setSelectedFoPoint(point);
                           setShowFoPointModal(true);
                         }
                       }}
                     >
                       <Tooltip 
                         permanent={false}
                         direction="top"
                         offset={[0, -10]}
                         opacity={0.95}
                         className="custom-tooltip"
                       >
                         <div className="p-2.5 min-w-[200px] max-w-[240px]">
                           <h4 className="font-semibold text-xs text-foreground mb-1.5 truncate">
                             {point.name || 'Belum Terdata'}
                           </h4>
                           <div className="space-y-1 text-[10px] text-muted-foreground">
                             {point.route_name && (
                               <div className="flex items-start gap-1.5">
                                 <span className="text-muted-foreground flex-shrink-0"></span>
                                 <span className="truncate">{point.route_name}</span>
                               </div>
                             )}
                             {point.sequence_number && (
                               <div className="flex items-center gap-1.5">
                                 <span className="text-muted-foreground flex-shrink-0">#</span>
                                 <span>Urutan: {point.sequence_number}</span>
                               </div>
                             )}
                             {point.side_of_road && point.side_of_road !== 'unknown' && (
                               <div className="flex items-center gap-1.5">
                                 <div 
                                   className={`w-2 h-2 rounded-full flex-shrink-0 ${
                                     point.side_of_road === 'left' ? 'bg-neutral' : 'bg-destructive'
                                   }`}
                                 />
                                 <span>Posisi: {point.side_of_road === 'left' ? 'Kiri' : 'Kanan'}</span>
                               </div>
                             )}
                             {point.providers && Array.isArray(point.providers) && point.providers.length > 0 && (
                               <div className="flex items-start gap-1.5 pt-1 border-t border-border">
                                 <span className="text-muted-foreground flex-shrink-0 text-[9px]"></span>
                                 <div className="flex flex-wrap gap-0.5 flex-1">
                                   {point.providers.slice(0, 2).map((p: any, idx: number) => (
                                     <span
                                       key={idx}
                                       className="inline-block px-1.5 py-0.5 rounded text-[9px] font-medium bg-muted text-neutral-strong"
                                     >
                                       {p.name || p}
                                     </span>
                                   ))}
                                   {point.providers.length > 2 && (
                                     <span className="text-[9px] text-muted-foreground">+{point.providers.length - 2}</span>
                                   )}
                                 </div>
                               </div>
                             )}
                             {/* Foto yang tersedia */}
                             {point.images && (
                               <div className="flex items-start gap-1.5 pt-1 border-t border-border">
                                 <span className="text-muted-foreground flex-shrink-0 text-[9px]"></span>
                                 <div className="flex flex-wrap gap-1 flex-1">
                                   {point.images.isp && point.images.isp !== '-' && point.images.isp.trim() !== '' && (
                                     <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-medium bg-destructive-soft text-destructive-strong border border-destructive-border">
                                       <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                       </svg>
                                       ISP
                                     </span>
                                   )}
                                   {point.images.pole && point.images.pole !== '-' && point.images.pole.trim() !== '' && (
                                     <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-medium bg-success-soft text-success-strong border border-success-border">
                                       <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                       </svg>
                                       Tiang
                                     </span>
                                   )}
                                   {point.images.junction_box && point.images.junction_box !== '-' && point.images.junction_box.trim() !== '' && (
                                     <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-medium bg-muted text-neutral-strong border border-border">
                                       <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                       </svg>
                                       JB
                                     </span>
                                   )}
                                   {(!point.images.isp || point.images.isp === '-' || point.images.isp.trim() === '') &&
                                    (!point.images.pole || point.images.pole === '-' || point.images.pole.trim() === '') &&
                                    (!point.images.junction_box || point.images.junction_box === '-' || point.images.junction_box.trim() === '') && (
                                     <span className="text-[9px] text-muted-foreground italic">Tidak ada foto</span>
                                   )}
                                 </div>
                               </div>
                             )}
                           </div>
                         </div>
                       </Tooltip>
                     </Marker>
                   );
                 })}
              </MapContainer>
            </div>
            
            {/* Controls overlay — desktop only. See the note on the same
                overlay in DataTower/TowerMap.tsx: the phone variant said
                "Zoom & Pan", in English, in a chip that covered the map, to
                tell a reader something their thumbs already know. */}
            <div className="absolute right-4 top-4 z-10 hidden rounded-lg bg-white p-2 shadow-lg sm:block">
              <div className="text-xs text-muted-foreground">
                Scroll untuk zoom · seret untuk menggeser
              </div>
            </div>
          </div>
            
          {/* Map Legend */}
          <div className="p-3 sm:p-4 bg-muted border-t border-border">
            <h4 className="text-xs sm:text-sm font-medium text-foreground mb-2 sm:mb-3">Legenda Titik FO:</h4>
            
            {/* Side of Road Legend */}
            <div className="mb-3 sm:mb-4 pb-3 sm:pb-4 border-b border-border">
              <h5 className="mb-1.5 text-xs font-semibold text-foreground sm:mb-2">Sisi Jalan:</h5>
              <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
{/* Kiri and Kanan are a LIGHT/DARK pair now, drawn straight from
                    SIDE_OF_ROAD_STYLES — the same three rows foIconUtils builds
                    the corner badges from, so the legend and the map cannot
                    drift apart. They were one identical dark neutral before,
                    which asked the reader to tell two sides apart by a 6px
                    letterform alone. */}
                {([
                  ['L', SIDE_OF_ROAD_STYLES.left, 'Kiri'],
                  ['R', SIDE_OF_ROAD_STYLES.right, 'Kanan'],
                  ['?', SIDE_OF_ROAD_STYLES.unknown, 'Belum Diketahui'],
                ] as const).map(([glyph, style, label]) => (
                  <div key={label} className="flex items-center gap-2">
                    <div
                      className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold shadow-sm"
                      style={{ background: style.fill, color: style.ink, borderColor: style.ring }}
                    >
                      {glyph}
                    </div>
                    <span className="text-xs text-muted-foreground">{label}</span>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Swatches read their colour from the SAME table the map draws
                with, so a legend entry can no longer disagree with the pin it
                describes. It did, badly: five of the eight were the wrong
                colour (PIJ, I and IJ all showed the neutral, PI showed stock
                green-500, J showed amber-500), and JB used `bg-warning-soft0` —
                not a real Tailwind class, so that badge rendered white text on
                nothing at all. */}
            <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3 sm:gap-2 md:grid-cols-4 mb-3 sm:mb-4">
              {([
                ['PIJ', 'Tiang + ISP + JB', '7px'],
                ['PI', 'Tiang + ISP', '8px'],
                ['JB', 'Tiang + Joint Box', '8px'],
                ['P', 'Tiang Saja', undefined],
                ['I', 'ISP Saja', undefined],
                ['J', 'Joint Box Saja', undefined],
                ['IJ', 'ISP + Joint Box', '8px'],
                ['?', 'Tidak Ada Gambar', undefined],
              ] as const).map(([code, label, fontSize]) => {
                // fill AND text colour from one lookup: `?` is the pale marker
                // with dark type, and picking its two halves separately is how a
                // legend ends up with white text on a near-white disc.
                const style = foPointStyle(code);
                return (
                  <div key={label} className="flex items-center gap-1.5 sm:gap-2">
                    <div
                      className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 border-white text-[10px] font-bold shadow-sm sm:h-6 sm:w-6 sm:text-xs"
                      style={{ background: style.fill, color: style.ink, fontSize }}
                    >
                      {code}
                    </div>
                    <span className="text-xs text-muted-foreground">{label}</span>
                  </div>
                );
              })}
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
          </main>
        </div>
      </div>
      
      <FoDetailModal
         isOpen={showDetailModal}
         detailData={detailData}
         loading={detailLoading}
         onClose={handleCloseDetailModal}
       />

      {/* FO Point Detail Modal */}
      <FoPointDetailModal
        isOpen={showFoPointModal}
        onClose={() => {
          setShowFoPointModal(false);
          setSelectedFoPoint(null);
        }}
        point={selectedFoPoint}
        onViewMap={selectedFoPoint ? () => handleViewMap(selectedFoPoint) : undefined}
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