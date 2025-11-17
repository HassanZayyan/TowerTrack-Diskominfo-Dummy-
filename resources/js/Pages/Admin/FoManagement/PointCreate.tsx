import React from 'react';
import { Head, useForm, Link } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import ProviderSelection from '@/Components/Admin/ProviderSelection';

interface FoRoute {
  id: number;
  name: string;
  area: string;
  status: string;
  color: string;
  total_distance: number;
  total_points: number;
  description?: string;
}

interface Provider {
  id: number;
  name: string;
}

interface PageProps {
  foRoute: FoRoute;
  availableTypes: string[];
  availableStatuses: string[];
  nextSequence: number;
  availableProviders?: Provider[];
}

export default function PointCreate({ foRoute, availableTypes, availableStatuses, nextSequence, availableProviders = [] }: PageProps) {
  const { data, setData, post, processing, errors, transform } = useForm({
    name: '',
    latitude: '',
    longitude: '',
    area: foRoute.area,
    type: 'pole',
    status: 'active',
    route_name: foRoute.name,
    route_id: foRoute.id,
    sequence_number: nextSequence.toString(),
    description: '',
    isp_image: '',
    pole_image: '',
    junction_box_image: '',
    providers: [] as number[], // Array of provider IDs
  });

  // Normalize image fields before submission: convert dash or whitespace to empty string
  transform((data) => {
    const normalizeImageField = (value: string): string => {
      const trimmed = value?.trim() || '';
      return trimmed === '-' ? '' : trimmed;
    };
    
    return {
      ...data,
      isp_image: normalizeImageField(data.isp_image),
      pole_image: normalizeImageField(data.pole_image),
      junction_box_image: normalizeImageField(data.junction_box_image),
    };
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    post(route('admin.fo-management.points.store'), {
      onSuccess: () => {
        console.log('Point created successfully');
      },
      onError: (errors) => {
        console.error('Error creating point:', errors);
      },
      preserveScroll: true
    });
  };

  const typeLabels: { [key: string]: string } = {
    pole: 'Tiang/Pole',
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
    <AdminLayout title={`Tambah Titik FO - ${foRoute.name}`}>
      <Head title={`Tambah Titik FO - ${foRoute.name}`} />
      
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
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white leading-tight">
                        Tambah Titik FO Baru
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
                      <div className="w-2 h-2 bg-green-400 rounded-full flex-shrink-0"></div>
                      <span className="text-sm">Area: {foRoute.area}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-yellow-400 rounded-full flex-shrink-0"></div>
                      <span className="text-sm">Titik ke-{nextSequence}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-400 rounded-full flex-shrink-0"></div>
                      <span className="text-sm">Total {foRoute.total_points} titik existing</span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                  <Link
                    href={route('admin.fo-management.routes.detail', foRoute.id)}
                    className="inline-flex items-center justify-center px-4 py-2 bg-white/20 backdrop-blur-sm text-white font-medium rounded-lg hover:bg-white/30 transition-colors w-full sm:w-auto"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    Kembali ke Detail Jalur
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="bg-white shadow-2xl rounded-3xl border border-gray-100 overflow-hidden">
          <form onSubmit={handleSubmit} className="p-4 sm:p-6 lg:p-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
              {/* Basic Information */}
              <div className="space-y-4 sm:space-y-6">
                <div className="bg-gradient-to-r from-red-50 to-red-100 border border-red-200 rounded-2xl p-4 sm:p-6">
                  <div className="flex items-center gap-3 mb-4 sm:mb-6">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-lg sm:text-xl font-bold text-red-900">Informasi Dasar</h3>
                      <p className="text-xs sm:text-sm text-red-700">Data utama titik fiber optik</p>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="name" className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                        <svg className="w-4 h-4 text-red-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                        </svg>
                        <span className="flex-1">Nama Titik</span>
                        <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        id="name"
                        value={data.name}
                        onChange={(e) => setData('name', e.target.value)}
                        className={`block w-full px-3 sm:px-4 py-2 sm:py-3 rounded-xl border-2 transition-all duration-200 text-sm sm:text-base ${
                          errors.name 
                            ? 'border-red-300 focus:border-red-500 focus:ring-4 focus:ring-red-100' 
                            : 'border-gray-200 focus:border-red-500 focus:ring-4 focus:ring-red-100 hover:border-gray-300'
                        } focus:outline-none`}
                        placeholder={`Contoh: FO-${foRoute.name}-${nextSequence}`}
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
                      <label htmlFor="type" className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                        <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                        Tipe Titik
                        <span className="text-red-500">*</span>
                      </label>
                      <select
                        id="type"
                        value={data.type}
                        onChange={(e) => setData('type', e.target.value)}
                        className={`block w-full px-4 py-3 rounded-xl border-2 transition-all duration-200 appearance-none bg-white ${
                          errors.type 
                            ? 'border-red-300 focus:border-red-500 focus:ring-4 focus:ring-red-100' 
                            : 'border-gray-200 focus:border-red-500 focus:ring-4 focus:ring-red-100 hover:border-gray-300'
                        } focus:outline-none`}
                      >
                        {availableTypes.map((type) => (
                          <option key={type} value={type}>
                            {typeLabels[type] || type}
                          </option>
                        ))}
                      </select>
                      {errors.type && (
                        <div className="flex items-center gap-2 mt-2 text-sm text-red-600">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {errors.type}
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
                            {statusLabels[status] || status}
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
                      <label htmlFor="sequence_number" className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                        <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                        </svg>
                        Nomor Urut
                        <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        id="sequence_number"
                        min="1"
                        value={data.sequence_number}
                        onChange={(e) => setData('sequence_number', e.target.value)}
                        className={`block w-full px-4 py-3 rounded-xl border-2 transition-all duration-200 ${
                          errors.sequence_number 
                            ? 'border-red-300 focus:border-red-500 focus:ring-4 focus:ring-red-100' 
                            : 'border-gray-200 focus:border-red-500 focus:ring-4 focus:ring-red-100 hover:border-gray-300'
                        } focus:outline-none`}
                        placeholder="1"
                      />
                      {errors.sequence_number && (
                        <div className="flex items-center gap-2 mt-2 text-sm text-red-600">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {errors.sequence_number}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Location & Description */}
              <div className="space-y-4 sm:space-y-6">
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-4 sm:p-6">
                  <div className="flex items-center gap-3 mb-4 sm:mb-6">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">  
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      </svg>
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-lg sm:text-xl font-bold text-blue-900">Lokasi Koordinat</h3>
                      <p className="text-xs sm:text-sm text-blue-700">Tentukan posisi titik FO</p>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="latitude" className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                          <svg className="w-4 h-4 text-blue-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                          </svg>
                          <span className="flex-1">Latitude</span>
                          <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="number"
                          id="latitude"
                          step="any"
                          value={data.latitude}
                          onChange={(e) => setData('latitude', e.target.value)}
                          className={`block w-full px-3 sm:px-4 py-2 sm:py-3 rounded-xl border-2 transition-all duration-200 text-sm sm:text-base ${
                            errors.latitude 
                              ? 'border-red-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-100' 
                              : 'border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 hover:border-gray-300'
                          } focus:outline-none`}
                          placeholder="-7.123456"
                        />
                        {errors.latitude && (
                          <div className="flex items-center gap-2 mt-2 text-sm text-red-600">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {errors.latitude}
                          </div>
                        )}
                      </div>
                      
                      <div>
                        <label htmlFor="longitude" className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                          <svg className="w-4 h-4 text-blue-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                          </svg>
                          <span className="flex-1">Longitude</span>
                          <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="number"
                          id="longitude"
                          step="any"
                          value={data.longitude}
                          onChange={(e) => setData('longitude', e.target.value)}
                          className={`block w-full px-3 sm:px-4 py-2 sm:py-3 rounded-xl border-2 transition-all duration-200 text-sm sm:text-base ${
                            errors.longitude 
                              ? 'border-red-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-100' 
                              : 'border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 hover:border-gray-300'
                          } focus:outline-none`}
                          placeholder="110.123456"
                        />
                        {errors.longitude && (
                          <div className="flex items-center gap-2 mt-2 text-sm text-red-600">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {errors.longitude}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <div className="flex items-center gap-2 text-sm text-yellow-800">
                        <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>Gunakan format desimal untuk koordinat (contoh: -7.123456, 110.123456)</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 border border-yellow-200 rounded-2xl p-4 sm:p-6">
                  <div className="flex items-center gap-3 mb-4 sm:mb-6">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
                      </svg>
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-lg sm:text-xl font-bold text-yellow-900">Deskripsi</h3>
                      <p className="text-xs sm:text-sm text-yellow-700">Informasi tambahan (opsional)</p>
                    </div>
                  </div>
                  
                  <div>
                    <label htmlFor="description" className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                      <svg className="w-4 h-4 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Deskripsi Titik
                    </label>
                    <textarea
                      id="description"
                      rows={4}
                      value={data.description}
                      onChange={(e) => setData('description', e.target.value)}
                      className={`block w-full px-4 py-3 rounded-xl border-2 transition-all duration-200 resize-none ${
                        errors.description 
                          ? 'border-red-300 focus:border-yellow-500 focus:ring-4 focus:ring-yellow-100' 
                          : 'border-gray-200 focus:border-yellow-500 focus:ring-4 focus:ring-yellow-100 hover:border-gray-300'
                      } focus:outline-none`}
                      placeholder="Contoh: Titik ini berada di dekat tower seluler, akses jalan mudah..."
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
                  <div className="mt-4 sm:mt-6 grid grid-cols-1 gap-4">
                    <div>
                      <label htmlFor="isp_image" className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                        <svg className="w-4 h-4 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v10.764a1 1 0 01-1.447.894L15 18M4 6h16M4 12h8m-8 6h8" />
                        </svg>
                        Link Foto ISP (Google Drive) <span className="text-gray-500 text-xs">(Opsional)</span>
                      </label>
                      <input
                        type="url"
                        id="isp_image"
                        value={data.isp_image}
                        onChange={(e) => setData('isp_image', e.target.value)}
                        className={`block w-full px-4 py-3 rounded-xl border-2 transition-all duration-200 ${
                          errors.isp_image 
                            ? 'border-red-300 focus:border-yellow-500 focus:ring-4 focus:ring-yellow-100' 
                            : 'border-gray-200 focus:border-yellow-500 focus:ring-4 focus:ring-yellow-100 hover:border-gray-300'
                        } focus:outline-none`}
                        placeholder="https://drive.google.com/..."
                      />
                      {errors.isp_image && (
                        <div className="flex items-center gap-2 mt-2 text-sm text-red-600">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {errors.isp_image}
                        </div>
                      )}
                    </div>
                    <div>
                      <label htmlFor="pole_image" className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                        <svg className="w-4 h-4 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 2v20m12-12v12" />
                        </svg>
                        Link Foto Tiang (Google Drive) <span className="text-gray-500 text-xs">(Opsional)</span>
                      </label>
                      <input
                        type="url"
                        id="pole_image"
                        value={data.pole_image}
                        onChange={(e) => setData('pole_image', e.target.value)}
                        className={`block w-full px-4 py-3 rounded-xl border-2 transition-all duration-200 ${
                          errors.pole_image 
                            ? 'border-red-300 focus:border-yellow-500 focus:ring-4 focus:ring-yellow-100' 
                            : 'border-gray-200 focus:border-yellow-500 focus:ring-4 focus:ring-yellow-100 hover:border-gray-300'
                        } focus:outline-none`}
                        placeholder="https://drive.google.com/..."
                      />
                      {errors.pole_image && (
                        <div className="flex items-center gap-2 mt-2 text-sm text-red-600">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {errors.pole_image}
                        </div>
                      )}
                    </div>
                    <div>
                      <label htmlFor="junction_box_image" className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                        <svg className="w-4 h-4 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
                        </svg>
                        Link Foto Joint Box (Google Drive) <span className="text-gray-500 text-xs">(Opsional)</span>
                      </label>
                      <input
                        type="url"
                        id="junction_box_image"
                        value={data.junction_box_image}
                        onChange={(e) => setData('junction_box_image', e.target.value)}
                        className={`block w-full px-4 py-3 rounded-xl border-2 transition-all duration-200 ${
                          errors.junction_box_image 
                            ? 'border-red-300 focus:border-yellow-500 focus:ring-4 focus:ring-yellow-100' 
                            : 'border-gray-200 focus:border-yellow-500 focus:ring-4 focus:ring-yellow-100 hover:border-gray-300'
                        } focus:outline-none`}
                        placeholder="https://drive.google.com/..."
                      />
                      {errors.junction_box_image && (
                        <div className="flex items-center gap-2 mt-2 text-sm text-red-600">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {errors.junction_box_image}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Provider Selection - DRY: Using reusable component */}
            <ProviderSelection
              providers={data.providers || []}
              availableProviders={availableProviders}
              onChange={(selectedProviders) => setData('providers', selectedProviders)}
              errors={errors.providers}
              colorScheme="purple"
              label="Pilih Provider"
            />

            {/* Submit Buttons */}
            <div className="mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-gray-200">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 sm:gap-4">
                <Link
                  href={route('admin.fo-management.routes.detail', foRoute.id)}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 sm:px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-4 focus:ring-gray-200 transition-all duration-200 text-sm sm:text-base"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Batal
                </Link>
                <button
                  type="submit"
                  disabled={processing}
                  className="w-full sm:w-auto group relative inline-flex items-center justify-center gap-2 px-6 sm:px-8 py-3 bg-gradient-to-r from-red-500 to-rose-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-red-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none transition-all duration-200 text-sm sm:text-base"
                >
                  {processing ? (
                    <>
                      <svg className="animate-spin w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4 sm:w-5 sm:h-5 group-hover:scale-110 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Simpan Titik</span>
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