import React, { useState, useRef, useEffect, lazy, Suspense } from 'react';
import { createPortal } from 'react-dom';
import { router } from '@inertiajs/react';

// Lazy load LeafletMap for better initial page load performance
const LeafletMap = lazy(() => import('@/Components/LeafletMap'));

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
  // Measurement (lines) toggle
  measureEnabled: boolean;
  setMeasureEnabled: (enabled: boolean) => void;
  // Coverage (radius) toggle
  showCoverage: boolean;
  setShowCoverage: (enabled: boolean) => void;
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
  measureEnabled,
  setMeasureEnabled,
  showCoverage,
  setShowCoverage,
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
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [fullscreenElement, setFullscreenElement] = useState<HTMLElement | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);

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
        // Automatically enable measurement mode when entering fullscreen
        setMeasureEnabled(true);
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
    }
  };

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      const currentFullscreenEl = document.fullscreenElement || (document as any).webkitFullscreenElement || (document as any).msFullscreenElement;
      const isCurrentlyFullscreen = !!currentFullscreenEl;
      setIsFullscreen(isCurrentlyFullscreen);
      setFullscreenElement(isCurrentlyFullscreen ? (currentFullscreenEl as HTMLElement) : null);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('msfullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('msfullscreenchange', handleFullscreenChange);
    };
  }, [isFullscreen]);

  return (
    <div id="map-section" className="bg-white rounded-lg shadow mb-6 overflow-hidden">
      <div className="p-4 border-b border-gray-200">
        {/* Header Content - Responsive Layout */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* Title and Description Section */}
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-medium text-gray-900">Peta Lokasi Tower</h2>
            <p className="text-sm text-gray-600 mt-1">
              {ownerFilter !== 'all' ? (
                <>Filter aktif: <span className="font-semibold text-blue-600">{ownerFilter}</span>
                  <button 
                    onClick={() => {
                      setOwnerFilter('all');
                      
                      const params = buildFilterParams({ owner: 'all', page: 1 });
                      router.get('/data-tower', params, { preserveState: true, preserveScroll: true, replace: true });
                    }}
                    className="ml-2 text-xs text-red-600 hover:underline"
                  >
                    Hapus filter
                  </button></>
              ) : (
                'Visualisasi tower dan coverage area di Kabupaten Semarang'
              )}
            </p>
          </div>

          {/* Controls Section - Responsive Button Layout */}
          <div className="flex flex-col sm:flex-row gap-3 lg:gap-2">
            {/* Distance Display */}
            {measureEnabled && (
              <div className="flex items-center justify-center sm:justify-start">
                <span className="text-sm text-gray-700 whitespace-nowrap">
                  Jarak:
                  <span className="font-semibold ml-1" style={{ color: '#B71C1C' }}>
                    {distance > 0 ? `${distance.toFixed(1)} m${distance > 1000 ? ` (${(distance/1000).toFixed(2)} km)` : ''}` : '-'}
                  </span>
                </span>
              </div>
            )}
            
            {/* Main Control Buttons */}
            <div className="flex flex-col sm:flex-row gap-2">
              {/* Toggle Buttons Row */}
              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  type="button"
                  onClick={() => setMeasureEnabled(!measureEnabled)}
                  className={`px-3 py-2 rounded-md text-sm font-medium border transition-colors w-full sm:w-auto ${
                    measureEnabled
                      ? 'text-white' 
                      : 'text-gray-800 bg-white border-gray-300 hover:bg-gray-50'
                  }`}
                  style={measureEnabled ? { backgroundColor: '#B71C1C', borderColor: '#B71C1C' } : undefined}
                  title={measureEnabled ? 'Pengukuran aktif: Klik marker untuk memilih dua titik. Detail tower dinonaktifkan.' : 'Aktifkan untuk mengukur jarak antar marker.'}
                >
                  Ukur Jarak
                </button>
                <button
                  type="button"
                  onClick={() => setShowCoverage(!showCoverage)}
                  className={`px-3 py-2 rounded-md text-sm font-medium border transition-colors w-full sm:w-auto ${
                    showCoverage
                      ? 'text-white' 
                      : 'text-gray-800 bg-white border-gray-300 hover:bg-gray-50'
                  }`}
                  style={showCoverage ? { backgroundColor: '#0ea5e9', borderColor: '#0ea5e9' } : undefined}
                  title={showCoverage ? 'Radius coverage ditampilkan' : 'Tampilkan radius coverage di peta'}
                >
                  Radius Coverage
                </button>
              </div>
              
              {/* Action Buttons Row */}
              <div className="flex flex-col sm:flex-row gap-2">
                {/* Reset Button */}
                {measureEnabled && (
                  <button
                    type="button"
                    onClick={() => setResetLinesCounter(c => c + 1)}
                    className="px-3 py-2 rounded-full text-sm font-medium border hover:opacity-90 w-full sm:w-auto"
                    style={{ backgroundColor: '#FFFFFF', color: '#212121', borderColor: '#212121' }}
                  >
                    Reset
                  </button>
                )}
                
                {/* Fullscreen Button */}
                <button 
                  onClick={handleFullscreen}
                  className="px-3 py-2 text-sm font-medium text-white rounded-md hover:opacity-90 transition-colors flex items-center justify-center gap-2 w-full sm:w-auto" 
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
          </div>
        </div>
      </div>
      
        <div className="relative">
        <div 
          ref={mapContainerRef}
          className={`w-full ${isFullscreen ? 'fixed inset-0 z-50 bg-white' : ''}`} 
          style={isFullscreen ? { height: '100vh', width: '100vw' } : { height: '500px', width: '100%', position: 'relative' as const, zIndex: 1 }}
          onWheel={(e) => {
            // Prevent wheel events from bubbling to the page when cursor is over the map container
            const target = e.target as HTMLElement;
            if (target && target.closest('#map-section')) {
              e.stopPropagation();
            }
          }}
        >
          <Suspense fallback={
            <div className="flex items-center justify-center h-full bg-gray-50">
              <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mb-4"></div>
                <p className="text-gray-600 font-medium">Memuat peta...</p>
              </div>
            </div>
          }>
            <LeafletMap
              ref={mapRef}
              center={[-7.197, 110.426]}
              zoom={10}
              style={{ height: '100%', width: '100%' }}
              markers={markers}
              showLines={measureEnabled}
              showCoverage={showCoverage}
              defaultRadiusMeters={500}
              onDistanceChange={onDistanceChange}
              resetLinesTrigger={resetLinesCounter}
              // Only provide onMarkerClick when NOT in measurement mode to prevent conflicts
              onMarkerClick={!measureEnabled ? onMarkerClick : undefined}
            />
          </Suspense>
        </div>
        
        {/* Distance Card - Only shown in fullscreen mode when measurement is enabled */}
        {isFullscreen && measureEnabled && distance > 0 && (
          (() => {
            const cardElement = (
              <div className="fixed top-4 left-4 z-[60] bg-white rounded-lg shadow-lg p-4 border border-gray-200">
                <div className="text-sm font-medium text-gray-700">
                  Jarak: <span className="font-semibold text-gray-900">{distance.toFixed(1)} m</span>
                  {distance > 1000 && (
                    <span className="text-gray-600"> ({(distance / 1000).toFixed(2)} km)</span>
                  )}
                </div>
              </div>
            );
            
            // When in fullscreen, render inside the fullscreen element, not document.body
            // The fullscreen element becomes the root viewport
            // Use state-tracked fullscreen element to ensure it's available
            if (fullscreenElement) {
              return createPortal(cardElement, fullscreenElement);
            }
            
            return cardElement;
          })()
        )}
        
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
        <div className="flex flex-wrap gap-6 items-center">
          {/* Tower Marker */}
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center shadow-sm">
              <div className="w-2 h-2 bg-white rounded-full"></div>
            </div>
            <span className="text-sm text-gray-700">Tower</span>
          </div>
          
          {/* Coverage Radius */}
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-blue-500 border-dashed rounded-full bg-blue-100"></div>
            <span className="text-sm text-gray-700">Radius</span>
          </div>
          
          {/* Measurement Line */}
          <div className="flex items-center gap-2">
            <div className="w-4 h-0.5 bg-red-500"></div>
            <span className="text-sm text-gray-700">Line</span>
          </div>
        </div>
      </div>
    </div>
  );
}