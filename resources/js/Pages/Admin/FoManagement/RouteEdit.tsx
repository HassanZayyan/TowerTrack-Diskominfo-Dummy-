import React, { useState, useEffect } from 'react';
import { Head, useForm, Link } from '@inertiajs/react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import AdminLayout from '@/Layouts/AdminLayout';
import { getIconByImagesAndSide } from '@/utils/foIconUtils';
import { STATUS_LABELS, getStatusLabel } from '@/utils/foConstants';
import { useCoordinateUpdate } from '@/Hooks/useCoordinateUpdate';

interface FoRoute {
  id: number;
  name: string;
  area: string;
  status: string;
  color: string;
  description?: string;
  total_distance: number;
  total_points: number;
}

interface FoPoint {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  sequence_number: number;
  type: string;
  status: string;
  side_of_road?: 'left' | 'right' | 'unknown' | null;
  images?: {
    isp: string | null;
    pole: string | null;
    junction_box: string | null;
  };
}

interface MapBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

interface PageProps {
  foRoute: FoRoute;
  points?: FoPoint[];
  mapBounds?: MapBounds;
  availableAreas: string[];
  availableStatuses: string[];
}

// Component untuk auto-fit bounds
function FitBounds({ bounds }: { bounds: MapBounds }) {
  const map = useMap();
  
  useEffect(() => {
    if (bounds) {
      map.fitBounds(
        [[bounds.south, bounds.west], [bounds.north, bounds.east]],
        { padding: [50, 50], maxZoom: 15 }
      );
    }
  }, [bounds, map]);
  
  return null;
}

export default function RouteEdit({ 
  foRoute, 
  points = [],
  mapBounds,
  availableAreas, 
  availableStatuses 
}: PageProps) {
  const { data, setData, put, processing, errors } = useForm({
    name: foRoute.name,
    area: foRoute.area,
    description: foRoute.description || '',
    status: foRoute.status,
    color: foRoute.color,
  });

  // State untuk map dan drag functionality
  const [draggingPointId, setDraggingPointId] = useState<number | null>(null);
  const [updatingPointId, setUpdatingPointId] = useState<number | null>(null);
  const [updateMessage, setUpdateMessage] = useState<{ pointId: number; message: string; type: 'success' | 'error' } | null>(null);
  const [pointPositions, setPointPositions] = useState<Map<number, [number, number]>>(new Map());

  // Initialize point positions
  useEffect(() => {
    const positions = new Map<number, [number, number]>();
    points.forEach(point => {
      positions.set(point.id, [point.latitude, point.longitude]);
    });
    setPointPositions(positions);
  }, [points]);

  // Handler untuk drag marker
  const handleMarkerDragEnd = async (pointId: number, e: any) => {
    const { lat, lng } = e.target.getLatLng();
    setDraggingPointId(null);
    setUpdatingPointId(pointId);
    setUpdateMessage(null);

    // Update local state immediately for better UX
    setPointPositions(prev => {
      const newMap = new Map(prev);
      newMap.set(pointId, [lat, lng]);
      return newMap;
    });

    try {
      const routeUrl = route('admin.fo-management.points.update-coordinates', { foPoint: pointId });
      
      // Ensure CSRF token is set
      const csrfToken = document.head.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
      if (csrfToken) {
        window.axios.defaults.headers.common['X-CSRF-TOKEN'] = csrfToken;
      }
      
      const response = await window.axios.patch(routeUrl, {
        latitude: lat,
        longitude: lng,
      });

      if (response.data && response.data.success) {
        setUpdateMessage({
          pointId,
          message: 'Koordinat berhasil diperbarui. GeoJSON akan di-regenerate saat route di-load.',
          type: 'success'
        });
        setTimeout(() => setUpdateMessage(null), 5000);
      } else {
        setUpdateMessage({
          pointId,
          message: 'Gagal memperbarui koordinat. Silakan coba lagi.',
          type: 'error'
        });
        setTimeout(() => setUpdateMessage(null), 5000);
      }
    } catch (error: any) {
      console.error('Error updating coordinates:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Terjadi kesalahan saat memperbarui koordinat.';
      setUpdateMessage({
        pointId,
        message: errorMessage,
        type: 'error'
      });
      setTimeout(() => setUpdateMessage(null), 5000);
    } finally {
      setUpdatingPointId(null);
    }
  };

  // Calculate center for map (use first point or default)
  const mapCenter: [number, number] = points.length > 0 
    ? [points[0].latitude, points[0].longitude]
    : [-7.1368, 110.4044]; // Default to Ungaran

  // Generate polyline coordinates from points
  const polylineCoordinates = points
    .sort((a, b) => a.sequence_number - b.sequence_number)
    .map(point => {
      const pos = pointPositions.get(point.id) || [point.latitude, point.longitude];
      return pos as [number, number];
    })
    .filter(coord => coord[0] && coord[1] && !isNaN(coord[0]) && !isNaN(coord[1]));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    put(route('admin.fo-management.routes.update', foRoute.id), {
      onSuccess: () => {
        console.log('Route updated successfully');
      },
      onError: (errors) => {
        console.error('Error updating route:', errors);
      },
      preserveScroll: true
    });
  };

  // Use shared constants instead of local definitions

  return (
    <AdminLayout title={`Edit Jalur FO: ${foRoute.name}`}>
      <Head title={`Edit Jalur FO: ${foRoute.name}`} />
      
      <div className="space-y-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-600 via-red-700 to-red-800 rounded-3xl shadow-2xl overflow-hidden">
          <div className="px-4 sm:px-8 py-8 sm:py-12 relative">
            <div className="absolute inset-0 bg-black/10"></div>
            <div className="relative z-10">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white leading-tight">
                        Edit Jalur Fiber Optic
                      </h1>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 mt-2">
                        <span className="text-white/80 text-sm sm:text-lg">Jalur:</span>
                        <span className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-white font-semibold text-sm sm:text-base break-words">
                          {foRoute.name}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:flex-wrap gap-3 sm:gap-4 text-white/90">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-yellow-400 rounded-full flex-shrink-0"></div>
                      <span className="text-sm">Total {foRoute.total_points} Titik FO</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-400 rounded-full flex-shrink-0"></div>
                      <span className="text-sm">Jarak {foRoute.total_distance.toFixed(2)} km</span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                  <Link
                    href={route('admin.fo-management.routes.list')}
                    className="inline-flex items-center justify-center px-4 py-2 bg-white/20 backdrop-blur-sm text-white font-medium rounded-lg hover:bg-white/30 transition-colors w-full sm:w-auto"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    Kembali
                  </Link>
                  <Link
                    href={route('admin.fo-management.routes.detail', foRoute.id)}
                    className="inline-flex items-center justify-center px-4 py-2 bg-white/20 backdrop-blur-sm text-white font-medium rounded-lg hover:bg-white/30 transition-colors w-full sm:w-auto"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    Lihat Detail
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="bg-white shadow-2xl rounded-3xl border border-gray-100 overflow-hidden">
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="p-8">
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                {/* Basic Information */}
                <div className="space-y-6">
                  <div className="bg-gradient-to-r from-red-50 to-red-100 border border-red-200 rounded-2xl p-6">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center flex-shrink-0">
                        <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-red-900">Informasi Dasar</h3>
                        <p className="text-sm text-red-700">Edit data utama jalur fiber optik</p>
                      </div>
                    </div>
                
                    <div className="space-y-4">
                      <div>
                        <label htmlFor="name" className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                          <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          Nama Jalur
                          <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          id="name"
                          value={data.name}
                          onChange={(e) => setData('name', e.target.value)}
                          className={`block w-full px-4 py-3 rounded-xl border-2 transition-all duration-200 ${
                            errors.name 
                              ? 'border-red-300 focus:border-red-500 focus:ring-4 focus:ring-red-100' 
                              : 'border-gray-200 focus:border-red-500 focus:ring-4 focus:ring-red-100 hover:border-gray-300'
                          } focus:outline-none`}
                          placeholder="Contoh: Jalur Utama Ungaran"
                        />
                        {errors.name && (
                          <div className="flex items-center gap-2 mt-2 text-sm text-red-600">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {errors.name}
                          </div>
                        )}
                      </div>

                      <div>
                        <label htmlFor="area" className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                          <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          </svg>
                          Area
                          <span className="text-red-500">*</span>
                        </label>
                        <select
                          id="area"
                          value={data.area}
                          onChange={(e) => setData('area', e.target.value)}
                          className={`block w-full px-4 py-3 rounded-xl border-2 transition-all duration-200 appearance-none bg-white ${
                            errors.area 
                              ? 'border-red-300 focus:border-red-500 focus:ring-4 focus:ring-red-100' 
                              : 'border-gray-200 focus:border-red-500 focus:ring-4 focus:ring-red-100 hover:border-gray-300'
                          } focus:outline-none`}
                        >
                          {availableAreas.map((area) => (
                            <option key={area} value={area}>
                              {area.charAt(0).toUpperCase() + area.slice(1)}
                            </option>
                          ))}
                        </select>
                        {errors.area && (
                          <div className="flex items-center gap-2 mt-2 text-sm text-red-600">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {errors.area}
                          </div>
                        )}
                      </div>

                      <div>
                        <label htmlFor="status" className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                          <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Status
                          <span className="text-red-500">*</span>
                        </label>
                        <select
                          id="status"
                          value={data.status}
                          onChange={(e) => setData('status', e.target.value)}
                          className={`block w-full px-4 py-3 rounded-xl border-2 transition-all duration-200 appearance-none bg-white ${
                            errors.status 
                              ? 'border-red-300 focus:border-red-500 focus:ring-4 focus:ring-red-100' 
                              : 'border-gray-200 focus:border-red-500 focus:ring-4 focus:ring-red-100 hover:border-gray-300'
                          } focus:outline-none`}
                        >
                          {availableStatuses.map((status) => (
                            <option key={status} value={status}>
                              {getStatusLabel(status)}
                            </option>
                          ))}
                        </select>
                        {errors.status && (
                          <div className="flex items-center gap-2 mt-2 text-sm text-red-600">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {errors.status}
                          </div>
                        )}
                      </div>

                      <div>
                        <label htmlFor="color" className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                          <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4z" />
                          </svg>
                          Warna Jalur
                        </label>
                        <div className="flex items-center gap-4">
                          <div className="relative">
                            <input
                              type="color"
                              id="color"
                              value={data.color}
                              onChange={(e) => setData('color', e.target.value)}
                              className="h-12 w-20 rounded-xl border-2 border-gray-200 cursor-pointer hover:border-red-300 transition-colors"
                            />
                            <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-600 rounded-full flex items-center justify-center">
                              <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            </div>
                          </div>
                          <div className="flex-1">
                            <input
                              type="text"
                              value={data.color}
                              onChange={(e) => setData('color', e.target.value)}
                              className="block w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-red-500 focus:ring-4 focus:ring-red-100 focus:outline-none transition-all duration-200 hover:border-gray-300 font-mono text-sm"
                              placeholder="#3B82F6"
                            />
                          </div>
                        </div>
                        {errors.color && (
                          <div className="flex items-center gap-2 mt-2 text-sm text-red-600">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {errors.color}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Route Stats */}
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                      </div>
                      <h4 className="text-lg font-bold text-blue-900">Statistik Jalur</h4>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                          </svg>
                          <span className="text-sm text-blue-700 font-medium">Total Jarak</span>
                        </div>
                        <div className="text-2xl font-bold text-blue-900">{foRoute.total_distance.toFixed(2)} km</div>
                      </div>
                      <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          </svg>
                          <span className="text-sm text-blue-700 font-medium">Total Titik</span>
                        </div>
                        <div className="text-2xl font-bold text-blue-900">{foRoute.total_points}</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Description and Point Management */}
                <div className="space-y-6">
                  {/* Description */}
                  <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 border border-yellow-200 rounded-2xl p-6">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl flex items-center justify-center flex-shrink-0">
                        <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-yellow-900">Deskripsi Jalur</h3>
                        <p className="text-sm text-yellow-700">Informasi tambahan tentang jalur</p>
                      </div>
                    </div>
                    <div>
                      <label htmlFor="description" className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                        <svg className="w-4 h-4 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Deskripsi
                      </label>
                      <textarea
                        id="description"
                        rows={6}
                        value={data.description}
                        onChange={(e) => setData('description', e.target.value)}
                        className={`block w-full px-4 py-3 rounded-xl border-2 transition-all duration-200 resize-none ${
                          errors.description 
                            ? 'border-red-300 focus:border-red-500 focus:ring-4 focus:ring-red-100' 
                            : 'border-gray-200 focus:border-yellow-500 focus:ring-4 focus:ring-yellow-100 hover:border-gray-300'
                        } focus:outline-none`}
                        placeholder="Deskripsi tambahan untuk jalur ini..."
                      />
                      {errors.description && (
                        <div className="flex items-center gap-2 mt-2 text-sm text-red-600">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {errors.description}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Point Management */}
                  <div className="bg-gradient-to-r from-green-50 to-green-100 border border-green-200 rounded-2xl p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center flex-shrink-0">
                        <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-green-900">Kelola Titik FO</h3>
                        <p className="text-sm text-green-700">Titik-titik FO membentuk jalur ini</p>
                      </div>
                    </div>
                    <p className="text-sm text-gray-700 mb-6">
                      Jalur FO akan otomatis terbentuk berdasarkan urutan titik-titik yang telah ditambahkan.
                      Anda dapat mengelola titik FO melalui halaman detail jalur.
                    </p>
                    <div className="space-y-3">
                      <Link
                        href={route('admin.fo-management.routes.detail', foRoute.id)}
                        className="inline-flex items-center px-5 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors w-full justify-center"
                      >
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                        </svg>
                        Kelola Titik FO
                      </Link>
                      <div className="bg-white/60 rounded-lg p-3">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Titik Terdaftar</span>
                          <span className="font-semibold text-green-800">{foRoute.total_points} titik</span>
                        </div>
                        <div className="flex items-center justify-between text-sm mt-2">
                          <span className="text-gray-600">Jarak Total</span>
                          <span className="font-semibold text-green-800">{foRoute.total_distance.toFixed(2)} km</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Map Section for Point Editing */}
              {points.length > 0 && (
                <div className="mt-8 col-span-1 xl:col-span-2">
                  <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-2xl p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center flex-shrink-0">
                        <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-purple-900">Edit Posisi Titik FO</h3>
                        <p className="text-sm text-purple-700">
                          Drag marker untuk mengubah posisi titik. {points.length} titik tersedia.
                        </p>
                      </div>
                    </div>

                    {/* Status Messages */}
                    {updateMessage && (
                      <div className={`mb-4 p-3 rounded-lg ${
                        updateMessage.type === 'success'
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        <div className="flex items-center gap-2">
                          {updateMessage.type === 'success' ? (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          ) : (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          )}
                          <span className="text-sm font-medium">{updateMessage.message}</span>
                        </div>
                      </div>
                    )}

                    {/* Map Container */}
                    <div className="relative rounded-xl overflow-hidden border-2 border-gray-200 shadow-lg" style={{ height: '600px' }}>
                      {updatingPointId && (
                        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-[1000] flex items-center justify-center">
                          <div className="text-center">
                            <svg className="animate-spin w-8 h-8 text-purple-600 mx-auto mb-2" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <p className="text-sm font-medium text-purple-700">Memperbarui koordinat...</p>
                          </div>
                        </div>
                      )}

                      <MapContainer
                        center={mapCenter}
                        zoom={13}
                        style={{ height: '100%', width: '100%', zIndex: 1 }}
                        scrollWheelZoom={true}
                        doubleClickZoom={true}
                        dragging={true}
                        zoomControl={true}
                      >
                        <TileLayer
                          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                          maxZoom={19}
                        />

                        {/* Auto-fit bounds */}
                        {mapBounds && <FitBounds bounds={mapBounds} />}

                        {/* Route Polyline */}
                        {polylineCoordinates.length > 1 && (
                          <Polyline
                            positions={polylineCoordinates}
                            pathOptions={{
                              color: foRoute.color || '#EF4444',
                              weight: 4,
                              opacity: 0.7,
                            }}
                          />
                        )}

                        {/* Draggable Point Markers */}
                        {points.map((point) => {
                          const position = pointPositions.get(point.id) || [point.latitude, point.longitude];
                          const isUpdating = updatingPointId === point.id;
                          const isDragging = draggingPointId === point.id;

                          return (
                            <Marker
                              key={point.id}
                              position={position as [number, number]}
                              draggable={!isUpdating}
                              icon={getIconByImagesAndSide(
                                point.images || { isp: null, pole: null, junction_box: null },
                                point.side_of_road
                              )}
                              eventHandlers={{
                                dragstart: (e) => {
                                  // Close popup before dragging to prevent interference
                                  if (e.target && typeof e.target.closePopup === 'function') {
                                    e.target.closePopup();
                                  }
                                  setDraggingPointId(point.id);
                                },
                                dragend: (e) => handleMarkerDragEnd(point.id, e),
                              }}
                              opacity={isUpdating ? 0.6 : 1}
                              >
                              <Popup closeOnClick={false} autoClose={false}>
                                <div className="text-center min-w-[150px]">
                                  <p className="font-semibold text-sm">{point.name}</p>
                                  <p className="text-xs text-gray-600 mt-1">
                                    Urutan: {point.sequence_number}
                                  </p>
                                  <p className="text-xs text-gray-500 mt-1">
                                    {position[0].toFixed(6)}, {position[1].toFixed(6)}
                                  </p>
                                  <p className="text-xs text-blue-600 mt-2">
                                    {isUpdating
                                      ? 'Memperbarui...'
                                      : 'Lepaskan untuk menyimpan'}
                                  </p>
                                </div>
                              </Popup>
                            </Marker>
                          );
                        })}
                      </MapContainer>
                    </div>

                    <p className="text-xs text-gray-500 mt-3">
                      💡 Drag marker untuk mengubah posisi titik. Koordinat akan otomatis ter-update. 
                      GeoJSON route akan di-regenerate saat route di-load.
                    </p>

                    {/* Points Summary */}
                    <div className="mt-4 bg-white/60 rounded-lg p-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Total Titik</span>
                        <span className="font-semibold text-purple-800">{points.length} titik</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Submit Buttons */}
            <div className="bg-gradient-to-r from-gray-50 to-slate-50 border-t border-gray-200 px-8 py-6">
              <div className="flex flex-col sm:flex-row items-center justify-end gap-4">
                <Link
                  href={route('admin.fo-management.routes.detail', foRoute.id)}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-4 focus:ring-gray-200 transition-all duration-200"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Batal
                </Link>
                <button
                  type="submit"
                  disabled={processing}
                  className="w-full sm:w-auto group relative inline-flex items-center justify-center gap-2 px-8 py-3 bg-gradient-to-r from-red-500 to-rose-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-red-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none transition-all duration-200"
                >
                  {processing ? (
                    <>
                      <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5 group-hover:scale-110 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                      </svg>
                      <span>Perbarui Jalur</span>
                    </>
                  )}
                  <div className="absolute inset-0 bg-white/20 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </AdminLayout>
  );
}