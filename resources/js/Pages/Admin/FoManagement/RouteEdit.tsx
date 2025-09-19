import React, { useState } from 'react';
import { Head, useForm, Link } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';

interface FoRoute {
  id: number;
  name: string;
  area: string;
  status: string;
  color: string;
  description?: string;
  path_coordinates: Array<{lat: number; lng: number}>;
  total_distance: number;
  total_points: number;
}

interface PageProps {
  foRoute: FoRoute;
  availableAreas: string[];
  availableStatuses: string[];
}

export default function RouteEdit({ foRoute, availableAreas, availableStatuses }: PageProps) {
  const [coordinates, setCoordinates] = useState<Array<{lat: number; lng: number}>>(
    foRoute.path_coordinates || []
  );

  const { data, setData, put, processing, errors } = useForm({
    name: foRoute.name,
    area: foRoute.area,
    description: foRoute.description || '',
    status: foRoute.status,
    color: foRoute.color,
    path_coordinates: coordinates,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Update coordinates in form data before submitting
      const submitData = {
        ...data,
        path_coordinates: coordinates,
      };
      
      put(route('admin.fo-management.routes.update', foRoute.id), {
        data: submitData,
        onSuccess: () => {
          // Success handled by Inertia redirect
        },
        onError: (errors) => {
          console.error('Error updating route:', errors);
        },
        preserveScroll: true,
      });
    } catch (error) {
      console.error('Unexpected error:', error);
    }
  };

  const statusLabels: { [key: string]: string } = {
    active: 'Aktif',
    inactive: 'Non-aktif',
    maintenance: 'Maintenance'
  };

  const addCoordinate = () => {
    const newCoords = [...coordinates, { lat: 0, lng: 0 }];
    setCoordinates(newCoords);
    setData('path_coordinates', newCoords);
  };

  const removeCoordinate = (index: number) => {
    if (coordinates.length <= 2) return; // Minimum 2 coordinates
    const newCoords = coordinates.filter((_, i) => i !== index);
    setCoordinates(newCoords);
    setData('path_coordinates', newCoords);
  };

  const updateCoordinate = (index: number, field: 'lat' | 'lng', value: string) => {
    const newCoords = coordinates.map((coord, i) => {
      if (i === index) {
        return { ...coord, [field]: parseFloat(value) || 0 };
      }
      return coord;
    });
    setCoordinates(newCoords);
    setData('path_coordinates', newCoords);
  };

  return (
    <AdminLayout title={`Edit Jalur FO: ${foRoute.name}`}>
      <Head title={`Edit Jalur FO: ${foRoute.name}`} />
      
      <div className="space-y-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 rounded-3xl shadow-2xl overflow-hidden">
          <div className="px-8 py-12 relative">
            <div className="absolute inset-0 bg-black/10"></div>
            <div className="relative z-10">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </div>
                    <div>
                      <h1 className="text-3xl lg:text-4xl font-bold text-white">
                        Edit Jalur Fiber Optic
                      </h1>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-white/80 text-lg">Jalur:</span>
                        <span className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-white font-semibold">
                          {foRoute.name}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-4 text-white/90">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
                      <span className="text-sm">Langkah 1: Edit Informasi Dasar</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                      <span className="text-sm">Langkah 2: Perbarui Koordinat</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                      <span className="text-sm">Langkah 3: Simpan Perubahan</span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Link
                    href={route('admin.fo-management.routes.list')}
                    className="group px-6 py-3 bg-white/10 backdrop-blur-sm border border-white/20 text-white font-semibold rounded-2xl hover:bg-white/20 focus:outline-none focus:ring-4 focus:ring-white/30 transition-all duration-200 flex items-center justify-center gap-2"
                  >
                    <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    Kembali ke Daftar
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
                  <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-2xl p-6">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-emerald-900">Informasi Dasar</h3>
                        <p className="text-sm text-emerald-700">Edit data utama jalur fiber optik</p>
                      </div>
                    </div>
                
                    <div>
                      <label htmlFor="name" className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                        <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Nama Jalur
                        <span className="text-red-500">*</span>
                        <div className="group relative">
                          <svg className="w-4 h-4 text-gray-400 cursor-help" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                            Masukkan nama yang mudah diidentifikasi
                          </div>
                        </div>
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          id="name"
                          value={data.name}
                          onChange={(e) => setData('name', e.target.value)}
                          className={`block w-full px-4 py-3 rounded-xl border-2 transition-all duration-200 ${
                            errors.name 
                              ? 'border-red-300 focus:border-red-500 focus:ring-4 focus:ring-red-100' 
                              : 'border-gray-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 hover:border-gray-300'
                          } focus:outline-none`}
                          placeholder="Contoh: Jalur Utama Ungaran"
                        />
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                      </div>
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
                        <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        Area
                        <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <select
                          id="area"
                          value={data.area}
                          onChange={(e) => setData('area', e.target.value)}
                          className={`block w-full px-4 py-3 rounded-xl border-2 transition-all duration-200 appearance-none bg-white ${
                            errors.area 
                              ? 'border-red-300 focus:border-red-500 focus:ring-4 focus:ring-red-100' 
                              : 'border-gray-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 hover:border-gray-300'
                          } focus:outline-none`}
                        >
                          {availableAreas.map((area) => (
                            <option key={area} value={area}>
                              📍 {area.charAt(0).toUpperCase() + area.slice(1)}
                            </option>
                          ))}
                        </select>
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </div>
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
                        <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Status
                        <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <select
                          id="status"
                          value={data.status}
                          onChange={(e) => setData('status', e.target.value)}
                          className={`block w-full px-4 py-3 rounded-xl border-2 transition-all duration-200 appearance-none bg-white ${
                            errors.status 
                              ? 'border-red-300 focus:border-red-500 focus:ring-4 focus:ring-red-100' 
                              : 'border-gray-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 hover:border-gray-300'
                          } focus:outline-none`}
                        >
                          {availableStatuses.map((status) => (
                            <option key={status} value={status}>
                              {status === 'active' && '🟢'} 
                              {status === 'inactive' && '🔴'} 
                              {status === 'maintenance' && '🟡'} 
                              {statusLabels[status] || status}
                            </option>
                          ))}
                        </select>
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </div>
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
                        <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM7 3H5a2 2 0 00-2 2v12a4 4 0 004 4h2M9 3h6a2 2 0 012 2v12a4 4 0 01-4 4H9" />
                        </svg>
                        Warna Jalur
                      </label>
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <input
                            type="color"
                            id="color"
                            value={data.color}
                            onChange={(e) => setData('color', e.target.value)}
                            className="h-12 w-16 rounded-xl border-2 border-gray-200 cursor-pointer hover:border-gray-300 transition-colors duration-200"
                          />
                        </div>
                        <input
                          type="text"
                          value={data.color}
                          onChange={(e) => setData('color', e.target.value)}
                          className="flex-1 px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 focus:outline-none transition-all duration-200 hover:border-gray-300 font-mono text-sm"
                          placeholder="#3B82F6"
                        />
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

                    {/* Route Info */}
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
                </div>

                {/* Description */}
                <div className="space-y-6">
                  <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-2xl p-6">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-purple-900">Deskripsi Jalur</h3>
                        <p className="text-sm text-purple-700">Informasi tambahan tentang jalur</p>
                      </div>
                    </div>
                    <div>
                      <label htmlFor="description" className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                        <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Deskripsi
                      </label>
                      <div className="relative">
                        <textarea
                          id="description"
                          rows={6}
                          value={data.description}
                          onChange={(e) => setData('description', e.target.value)}
                          className={`block w-full px-4 py-3 rounded-xl border-2 transition-all duration-200 resize-none ${
                            errors.description 
                              ? 'border-red-300 focus:border-red-500 focus:ring-4 focus:ring-red-100' 
                              : 'border-gray-200 focus:border-purple-500 focus:ring-4 focus:ring-purple-100 hover:border-gray-300'
                          } focus:outline-none`}
                          placeholder="Deskripsi tambahan untuk jalur ini..."
                        />
                        <div className="absolute bottom-3 right-3 text-xs text-gray-400">
                          {data.description.length}/500
                        </div>
                      </div>
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
                </div>
            </div>

            {/* Path Coordinates */}
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-green-900">Koordinat Jalur</h3>
                      <p className="text-sm text-green-700">Kelola titik-titik koordinat jalur</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={addCoordinate}
                    className="group relative inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-green-200"
                    title="Tambah koordinat baru"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    <span>Tambah Koordinat</span>
                    <div className="absolute inset-0 bg-white/20 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
                  </button>
                </div>

                <div className="space-y-4">
                  {coordinates.map((coord, index) => (
                    <div key={index} className="bg-white/80 backdrop-blur-sm border border-green-200 rounded-xl p-4 hover:shadow-md transition-all duration-200">
                      <div className="flex items-center gap-4">
                        <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-green-400 to-emerald-500 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                          {index + 1}
                        </div>
                        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="flex items-center gap-2 text-xs font-semibold text-gray-700 mb-2">
                              <svg className="w-3 h-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                              </svg>
                              Latitude
                            </label>
                            <input
                              type="number"
                              step="any"
                              value={coord.lat}
                              onChange={(e) => updateCoordinate(index, 'lat', e.target.value)}
                              className="block w-full px-3 py-2 rounded-lg border-2 border-gray-200 focus:border-green-500 focus:ring-4 focus:ring-green-100 focus:outline-none transition-all duration-200 hover:border-gray-300 text-sm font-mono"
                              placeholder="-7.123456"
                            />
                          </div>
                          <div>
                            <label className="flex items-center gap-2 text-xs font-semibold text-gray-700 mb-2">
                              <svg className="w-3 h-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                              </svg>
                              Longitude
                            </label>
                            <input
                              type="number"
                              step="any"
                              value={coord.lng}
                              onChange={(e) => updateCoordinate(index, 'lng', e.target.value)}
                              className="block w-full px-3 py-2 rounded-lg border-2 border-gray-200 focus:border-green-500 focus:ring-4 focus:ring-green-100 focus:outline-none transition-all duration-200 hover:border-gray-300 text-sm font-mono"
                              placeholder="110.123456"
                            />
                          </div>
                        </div>
                        {coordinates.length > 2 && (
                          <button
                            type="button"
                            onClick={() => removeCoordinate(index)}
                            className="flex-shrink-0 p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all duration-200 group"
                            title="Hapus koordinat"
                          >
                            <svg className="w-5 h-5 group-hover:scale-110 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {coordinates.length === 0 && (
                  <div className="text-center py-12 bg-white/60 backdrop-blur-sm rounded-xl border-2 border-dashed border-green-300">
                    <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-green-100 to-emerald-100 rounded-full flex items-center justify-center">
                      <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      </svg>
                    </div>
                    <h4 className="text-lg font-semibold text-green-900 mb-2">Belum ada koordinat</h4>
                    <p className="text-green-700 mb-1">Klik "Tambah Koordinat" untuk menambahkan titik jalur</p>
                    <p className="text-sm text-green-600">Minimal 2 koordinat diperlukan untuk membuat jalur</p>
                  </div>
                )}

                {errors.path_coordinates && (
                  <div className="flex items-center gap-2 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {errors.path_coordinates}
                  </div>
                )}
              </div>
            </div>

            {/* Submit Buttons */}
            <div className="bg-gradient-to-r from-gray-50 to-slate-50 border border-gray-200 rounded-2xl p-6 mt-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-gray-500 to-slate-600 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h4 className="text-lg font-bold text-gray-900">Konfirmasi Perubahan</h4>
                  <p className="text-sm text-gray-600">Pastikan semua data sudah benar sebelum menyimpan</p>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row items-center justify-end gap-4">
                <Link
                  href={route('admin.fo-management.routes.list')}
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
