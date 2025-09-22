import React from 'react';
import { Head, useForm, Link } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';

interface AvailableRoute {
  id: number;
  name: string;
  area: string;
}

interface PreSelectedRoute {
  id: number;
  name: string;
  area: string;
}

interface PageProps {
  availableAreas: string[];
  availableTypes: string[];
  availableStatuses: string[];
  availableRoutes: AvailableRoute[];
  preSelectedRoute?: PreSelectedRoute | null;
}

export default function PointCreate({ 
  availableAreas, 
  availableTypes, 
  availableStatuses, 
  availableRoutes, 
  preSelectedRoute 
}: PageProps) {
  const { data, setData, post, processing, errors } = useForm({
    name: '',
    latitude: '',
    longitude: '',
    area: preSelectedRoute?.area || 'ungaran',
    type: 'pole',
    status: 'active',
    route_name: preSelectedRoute?.name || '',
    sequence_number: '1',
    description: '',
    route_id: preSelectedRoute?.id || null,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      post(route('admin.fo-management.points.store'), {
        onSuccess: () => {
          // Success handled by Inertia redirect
        },
        onError: (errors) => {
          console.error('Error creating point:', errors);
        },
        preserveScroll: true,
      });
    } catch (error) {
      console.error('Unexpected error:', error);
    }
  };

  const typeLabels: { [key: string]: string } = {
    pole: 'Pole',
    junction: 'Junction Box',
    hub: 'Hub',
    endpoint: 'Endpoint'
  };

  const statusLabels: { [key: string]: string } = {
    active: 'Aktif',
    inactive: 'Non-aktif',
    maintenance: 'Maintenance'
  };

  return (
    <AdminLayout title="Tambah Titik FO">
      <Head title="Tambah Titik FO" />
      
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-gray-100 py-8">
        {/* Header */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
          <div className="bg-gradient-to-r from-red-600 to-red-700 rounded-3xl shadow-2xl p-8 text-white relative overflow-hidden">
            
            <div className="relative z-10 flex items-center justify-between">
              <div className="flex items-center space-x-6">
                <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4 group-hover:bg-white/30 transition-all duration-300">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                
                <div>
                  <div className="flex items-center space-x-3 mb-2">
                    <h1 className="text-3xl font-bold tracking-tight">Tambah Titik Fiber Optic</h1>
                    <div className="group relative">
                      <svg className="w-5 h-5 text-white/80 hover:text-white cursor-help transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-50">
                        Buat titik baru dalam jaringan fiber optic
                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
          </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-6 text-white/90">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                      <span className="text-sm font-medium">Langkah 1</span>
                    </div>
                    <div className="w-px h-4 bg-white/30"></div>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-white/40 rounded-full"></div>
                      <span className="text-sm">Isi Informasi</span>
                    </div>
                    <div className="w-px h-4 bg-white/30"></div>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-white/40 rounded-full"></div>
                      <span className="text-sm">Simpan Titik</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <Link
                href={preSelectedRoute 
                  ? route('admin.fo-management.routes.detail', preSelectedRoute.id)
                  : route('admin.fo-management.index', { tab: 'points', area: data.area })
                }
                className="group bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 text-white px-6 py-3 rounded-xl font-medium transition-all duration-300 hover:scale-105 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-white/50 focus:ring-offset-2 focus:ring-offset-transparent flex items-center space-x-2"
              >
                <svg className="w-4 h-4 group-hover:-translate-x-1 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                <span>Kembali</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white/80 backdrop-blur-sm shadow-2xl rounded-3xl border border-gray-100 overflow-hidden">
            <form onSubmit={handleSubmit} className="p-8">
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                {/* Basic Information */}
                <div className="space-y-6">
                  <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl p-6 border border-gray-200">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl p-2">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <h3 className="text-xl font-bold text-gray-900">Informasi Dasar</h3>
                    </div>
                    <p className="text-gray-600 text-sm leading-relaxed">
                      Masukkan informasi dasar untuk titik fiber optic yang akan dibuat
                    </p>
                  </div>
                
                <div>
                  <label htmlFor="name" className="flex items-center text-sm font-semibold text-gray-800 mb-3">
                    <svg className="w-4 h-4 mr-2 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                    Nama Titik
                    <span className="text-red-500 ml-1">*</span>
                    <div className="group relative ml-2">
                      <svg className="w-4 h-4 text-gray-400 hover:text-gray-600 cursor-help transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-50">
                        Masukkan nama unik untuk titik ini
                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                      </div>
                    </div>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      id="name"
                      value={data.name}
                      onChange={(e) => setData('name', e.target.value)}
                      className={`w-full px-4 py-3 rounded-xl border-2 transition-all duration-200 bg-white/50 backdrop-blur-sm ${
                        errors.name 
                          ? 'border-red-300 focus:border-red-500 focus:ring-4 focus:ring-red-100' 
                          : 'border-gray-200 focus:border-red-500 focus:ring-4 focus:ring-red-100 hover:border-gray-300'
                      } focus:outline-none`}
                      placeholder="Contoh: Tower FO-001"
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                      </svg>
                    </div>
                  </div>
                  {errors.name && (
                    <div className="flex items-center mt-2 text-red-600">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p className="text-sm font-medium">{errors.name}</p>
                    </div>
                  )}
                </div>

                <div>
                  <label htmlFor="area" className="flex items-center text-sm font-semibold text-gray-800 mb-3">
                    <svg className="w-4 h-4 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    </svg>
                    Area
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                  <div className="relative">
                    <select
                      id="area"
                      value={data.area}
                      onChange={(e) => setData('area', e.target.value)}
                      className={`w-full px-4 py-3 rounded-xl border-2 transition-all duration-200 bg-white/50 backdrop-blur-sm appearance-none ${
                        errors.area 
                          ? 'border-red-300 focus:border-red-500 focus:ring-4 focus:ring-red-100' 
                          : 'border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 hover:border-gray-300'
                      } focus:outline-none`}
                    >
                      <option value="">Pilih Area...</option>
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
                    <div className="flex items-center mt-2 text-red-600">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p className="text-sm font-medium">{errors.area}</p>
                    </div>
                  )}
                </div>

                <div>
                  <label htmlFor="type" className="flex items-center text-sm font-semibold text-gray-800 mb-3">
                    <svg className="w-4 h-4 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                    Tipe
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                  <div className="relative">
                    <select
                      id="type"
                      value={data.type}
                      onChange={(e) => setData('type', e.target.value)}
                      className={`w-full px-4 py-3 rounded-xl border-2 transition-all duration-200 bg-white/50 backdrop-blur-sm appearance-none ${
                        errors.type 
                          ? 'border-red-300 focus:border-red-500 focus:ring-4 focus:ring-red-100' 
                          : 'border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 hover:border-gray-300'
                      } focus:outline-none`}
                    >
                      {availableTypes.map((type) => (
                        <option key={type} value={type}>
                          {type === 'pole' && '🏗️'} {type === 'junction' && '📦'} {type === 'hub' && '🔗'} {type === 'endpoint' && '🎯'} {typeLabels[type] || type}
                        </option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                  {errors.type && (
                    <div className="flex items-center mt-2 text-red-600">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p className="text-sm font-medium">{errors.type}</p>
                    </div>
                  )}
                </div>

                <div>
                  <label htmlFor="status" className="flex items-center text-sm font-semibold text-gray-800 mb-3">
                    <svg className="w-4 h-4 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Status
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                  <div className="relative">
                    <select
                      id="status"
                      value={data.status}
                      onChange={(e) => setData('status', e.target.value)}
                      className={`w-full px-4 py-3 rounded-xl border-2 transition-all duration-200 bg-white/50 backdrop-blur-sm appearance-none ${
                        errors.status 
                          ? 'border-red-300 focus:border-red-500 focus:ring-4 focus:ring-red-100' 
                          : 'border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 hover:border-gray-300'
                      } focus:outline-none`}
                    >
                      {availableStatuses.map((status) => (
                        <option key={status} value={status}>
                          {status === 'active' && '✅'} {status === 'inactive' && '❌'} {status === 'maintenance' && '🔧'} {statusLabels[status] || status}
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
                    <div className="flex items-center mt-2 text-red-600">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p className="text-sm font-medium">{errors.status}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Location and Route Information */}
              <div className="space-y-6">
                <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-2xl p-6 border border-emerald-100">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl p-2">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">Lokasi & Jalur</h3>
                  </div>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    Tentukan koordinat geografis dan jalur untuk titik fiber optic
                  </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="latitude" className="flex items-center text-sm font-semibold text-gray-800 mb-3">
                      <svg className="w-4 h-4 mr-2 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Latitude
                      <span className="text-red-500 ml-1">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        id="latitude"
                        step="any"
                        value={data.latitude}
                        onChange={(e) => setData('latitude', e.target.value)}
                        className={`w-full px-4 py-3 rounded-xl border-2 transition-all duration-200 bg-white/50 backdrop-blur-sm ${
                          errors.latitude 
                            ? 'border-red-300 focus:border-red-500 focus:ring-4 focus:ring-red-100' 
                            : 'border-gray-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 hover:border-gray-300'
                        } focus:outline-none`}
                        placeholder="-7.123456"
                      />
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945" />
                        </svg>
                      </div>
                    </div>
                    {errors.latitude && (
                      <div className="flex items-center mt-2 text-red-600">
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p className="text-sm font-medium">{errors.latitude}</p>
                      </div>
                    )}
                  </div>

                  <div>
                    <label htmlFor="longitude" className="flex items-center text-sm font-semibold text-gray-800 mb-3">
                      <svg className="w-4 h-4 mr-2 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9" />
                      </svg>
                      Longitude
                      <span className="text-red-500 ml-1">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        id="longitude"
                        step="any"
                        value={data.longitude}
                        onChange={(e) => setData('longitude', e.target.value)}
                        className={`w-full px-4 py-3 rounded-xl border-2 transition-all duration-200 bg-white/50 backdrop-blur-sm ${
                          errors.longitude 
                            ? 'border-red-300 focus:border-red-500 focus:ring-4 focus:ring-red-100' 
                            : 'border-gray-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 hover:border-gray-300'
                        } focus:outline-none`}
                        placeholder="110.123456"
                      />
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9" />
                        </svg>
                      </div>
                    </div>
                    {errors.longitude && (
                      <div className="flex items-center mt-2 text-red-600">
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p className="text-sm font-medium">{errors.longitude}</p>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label htmlFor="route_name" className="flex items-center text-sm font-semibold text-gray-800 mb-3">
                    <svg className="w-4 h-4 mr-2 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                    Nama Jalur
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                  <div className="relative">
                    <select
                      id="route_name"
                      value={data.route_name}
                      onChange={(e) => setData('route_name', e.target.value)}
                      className={`w-full px-4 py-3 rounded-xl border-2 transition-all duration-200 bg-white/50 backdrop-blur-sm appearance-none ${
                        errors.route_name 
                          ? 'border-red-300 focus:border-red-500 focus:ring-4 focus:ring-red-100' 
                          : 'border-gray-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 hover:border-gray-300'
                      } focus:outline-none`}
                    >
                      <option value="">Pilih Jalur...</option>
                      {availableRoutes.map((route) => (
                        <option key={route.id} value={route.name}>
                          🛤️ {route.name} ({route.area})
                        </option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                  {errors.route_name && (
                    <div className="flex items-center mt-2 text-red-600">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p className="text-sm font-medium">{errors.route_name}</p>
                    </div>
                  )}
                  {availableRoutes.length === 0 && (
                    <div className="flex items-center mt-2 text-amber-600">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p className="text-sm font-medium">
                        Belum ada jalur yang tersedia. Silakan buat jalur terlebih dahulu.
                      </p>
                    </div>
                  )}
                </div>

                <div>
                  <label htmlFor="sequence_number" className="flex items-center text-sm font-semibold text-gray-800 mb-3">
                    <svg className="w-4 h-4 mr-2 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                    </svg>
                    Nomor Urut
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      id="sequence_number"
                      min="1"
                      value={data.sequence_number}
                      onChange={(e) => setData('sequence_number', e.target.value)}
                      className={`w-full px-4 py-3 rounded-xl border-2 transition-all duration-200 bg-white/50 backdrop-blur-sm ${
                        errors.sequence_number 
                          ? 'border-red-300 focus:border-red-500 focus:ring-4 focus:ring-red-100' 
                          : 'border-gray-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 hover:border-gray-300'
                      } focus:outline-none`}
                      placeholder="1"
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                      </svg>
                    </div>
                  </div>
                  {errors.sequence_number && (
                    <div className="flex items-center mt-2 text-red-600">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p className="text-sm font-medium">{errors.sequence_number}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="col-span-1 xl:col-span-2">
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-6 border border-purple-100 mb-6">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl p-2">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">Informasi Tambahan</h3>
                </div>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Tambahkan deskripsi atau catatan khusus untuk titik fiber optic ini
                </p>
              </div>
              
              <div>
                <label htmlFor="description" className="flex items-center text-sm font-semibold text-gray-800 mb-3">
                  <svg className="w-4 h-4 mr-2 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
                  </svg>
                  Deskripsi
                  <span className="text-gray-400 text-xs ml-2">(Opsional)</span>
                </label>
                <div className="relative">
                  <textarea
                    id="description"
                    rows={4}
                    value={data.description}
                    onChange={(e) => setData('description', e.target.value)}
                    className={`w-full px-4 py-3 rounded-xl border-2 transition-all duration-200 bg-white/50 backdrop-blur-sm resize-none ${
                      errors.description 
                        ? 'border-red-300 focus:border-red-500 focus:ring-4 focus:ring-red-100' 
                        : 'border-gray-200 focus:border-purple-500 focus:ring-4 focus:ring-purple-100 hover:border-gray-300'
                    } focus:outline-none`}
                    placeholder="Masukkan deskripsi atau catatan khusus untuk titik ini..."
                  />
                  <div className="absolute top-3 right-3 pointer-events-none">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
                    </svg>
                  </div>
                </div>
                {errors.description && (
                  <div className="flex items-center mt-2 text-red-600">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-sm font-medium">{errors.description}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Submit Buttons */}
            <div className="col-span-1 xl:col-span-2 flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-4 pt-8 border-t border-gray-100">
              <Link
                href={route('admin.fo-management.index', { tab: 'points', area: data.area })}
                className="group inline-flex items-center justify-center px-6 py-3 border-2 border-gray-200 rounded-xl text-sm font-semibold text-gray-700 bg-white/80 backdrop-blur-sm hover:bg-gray-50 hover:border-gray-300 focus:outline-none focus:ring-4 focus:ring-gray-100 transition-all duration-200 transform hover:scale-105 active:scale-95"
              >
                <svg className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Kembali ke Daftar
              </Link>
              <button
                type="submit"
                disabled={processing}
                className="group inline-flex items-center justify-center px-8 py-3 border-2 border-transparent rounded-xl text-sm font-bold text-white bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 focus:outline-none focus:ring-4 focus:ring-emerald-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl"
              >
                {processing ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Menyimpan...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Simpan Titik Baru
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
      </div>
    </AdminLayout>
  );
}
