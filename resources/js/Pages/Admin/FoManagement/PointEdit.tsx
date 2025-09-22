import React from 'react';
import { Head, useForm, Link } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';

interface FoPoint {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  area: string;
  type: string;
  status: string;
  route_name: string;
  sequence_number: number;
  description?: string;
}

interface AvailableRoute {
  id: number;
  name: string;
  area: string;
}

interface PageProps {
  foPoint: FoPoint;
  availableAreas: string[];
  availableTypes: string[];
  availableStatuses: string[];
  availableRoutes: AvailableRoute[];
  fromRouteDetail?: boolean;
  parentRouteId?: number | null;
}

export default function PointEdit({ 
  foPoint, 
  availableAreas, 
  availableTypes, 
  availableStatuses, 
  availableRoutes, 
  fromRouteDetail,
  parentRouteId
}: PageProps) {
  const { data, setData, put, processing, errors } = useForm({
    name: foPoint.name,
    latitude: foPoint.latitude.toString(),
    longitude: foPoint.longitude.toString(),
    area: foPoint.area,
    type: foPoint.type,
    status: foPoint.status,
    route_name: foPoint.route_name,
    sequence_number: foPoint.sequence_number.toString(),
    description: foPoint.description || '',
    from_route: fromRouteDetail ? 'detail' : null,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      put(route('admin.fo-management.points.update', foPoint.id), {
        onSuccess: () => {},
        onError: (errors) => {
          console.error('Error updating point:', errors);
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
    <AdminLayout title={`Edit Titik FO: ${foPoint.name}`}>
      <Head title={`Edit Titik FO: ${foPoint.name}`} />
      
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-gray-100 relative overflow-hidden">
        
        <div className="py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="bg-gradient-to-r from-red-600 to-red-700 rounded-3xl p-8 shadow-2xl border border-white/20 backdrop-blur-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-3">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold text-white mb-2">Edit Titik Fiber Optic</h1>
                    <p className="text-white/90 text-lg">
                      Edit informasi titik: {foPoint.name}
                    </p>
                  </div>
                </div>
                
                <div className="hidden lg:flex items-center space-x-6">
                  <div className="text-right">
                    <div className="text-white/80 text-sm font-medium">Langkah</div>
                    <div className="text-white text-2xl font-bold">2/2</div>
                  </div>
                  <div className="w-px h-12 bg-white/20"></div>
                  <div className="text-right">
                    <div className="text-white/80 text-sm font-medium">Status</div>
                    <div className="text-yellow-300 text-sm font-semibold">Edit Mode</div>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
                    <span className="text-white/90 text-sm font-medium">Siap untuk diperbarui</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

        {/* Form */}
        <div>
          <div className="bg-white/80 backdrop-blur-sm shadow-2xl rounded-3xl border border-gray-100 overflow-hidden">
            <form onSubmit={handleSubmit} className="p-8">
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                {/* Basic Information */}
                <div className="space-y-6">
                  <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl p-6 border border-gray-200 mb-6">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-xl p-2">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <h3 className="text-xl font-bold text-gray-900">Informasi Dasar</h3>
                    </div>
                    <p className="text-gray-600 text-sm leading-relaxed">
                      Perbarui informasi dasar titik fiber optic seperti nama, area, dan status
                    </p>
                  </div>
                
                <div>
                  <label htmlFor="name" className="flex items-center text-sm font-semibold text-gray-800 mb-3">
                    <svg className="w-4 h-4 mr-2 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                    Nama Titik
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      id="name"
                      value={data.name}
                      onChange={(e) => setData('name', e.target.value)}
                      className={`w-full px-4 py-3 pr-12 rounded-xl border-2 transition-all duration-200 bg-white/50 backdrop-blur-sm ${
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
                    <svg className="w-4 h-4 mr-2 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
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
                          : 'border-gray-200 focus:border-red-500 focus:ring-4 focus:ring-red-100 hover:border-gray-300'
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
                    <svg className="w-4 h-4 mr-2 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                          : 'border-gray-200 focus:border-red-500 focus:ring-4 focus:ring-red-100 hover:border-gray-300'
                      } focus:outline-none`}
                    >
                      {availableTypes.map((type) => (
                        <option key={type} value={type}>
                          🔧 {typeLabels[type] || type}
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
                    <svg className="w-4 h-4 mr-2 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                          : 'border-gray-200 focus:border-red-500 focus:ring-4 focus:ring-red-100 hover:border-gray-300'
                      } focus:outline-none`}
                    >
                      {availableStatuses.map((status) => (
                        <option key={status} value={status}>
                          {status === 'active' ? '✅' : status === 'inactive' ? '❌' : '🔧'} {statusLabels[status] || status}
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
                  <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl p-6 border border-gray-200 mb-6">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-xl p-2">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </div>
                      <h3 className="text-xl font-bold text-gray-900">Lokasi & Jalur</h3>
                    </div>
                    <p className="text-gray-600 text-sm leading-relaxed">
                      Tentukan koordinat lokasi dan jalur yang akan dilalui titik ini
                    </p>
                  </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div>
                     <label htmlFor="latitude" className="flex items-center text-sm font-semibold text-gray-800 mb-3">
                       <svg className="w-4 h-4 mr-2 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
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
                         className={`w-full px-4 py-3 pr-12 rounded-xl border-2 transition-all duration-200 bg-white/50 backdrop-blur-sm ${
                           errors.latitude 
                             ? 'border-red-300 focus:border-red-500 focus:ring-4 focus:ring-red-100' 
                             : 'border-gray-200 focus:border-red-500 focus:ring-4 focus:ring-red-100 hover:border-gray-300'
                         } focus:outline-none`}
                         placeholder="-7.123456"
                       />
                       <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                         <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
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
                       <svg className="w-4 h-4 mr-2 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                         className={`w-full px-4 py-3 pr-12 rounded-xl border-2 transition-all duration-200 bg-white/50 backdrop-blur-sm ${
                           errors.longitude 
                             ? 'border-red-300 focus:border-red-500 focus:ring-4 focus:ring-red-100' 
                             : 'border-gray-200 focus:border-red-500 focus:ring-4 focus:ring-red-100 hover:border-gray-300'
                         } focus:outline-none`}
                         placeholder="110.123456"
                       />
                       <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                         <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9" />
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
                    <svg className="w-4 h-4 mr-2 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
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
                          : 'border-gray-200 focus:border-red-500 focus:ring-4 focus:ring-red-100 hover:border-gray-300'
                      } focus:outline-none`}
                    >
                      <option value="">🗺️ Pilih Jalur...</option>
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
                </div>

                <div>
                  <label htmlFor="sequence_number" className="flex items-center text-sm font-semibold text-gray-800 mb-3">
                    <svg className="w-4 h-4 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                      className={`w-full px-4 py-3 pr-12 rounded-xl border-2 transition-all duration-200 bg-white/50 backdrop-blur-sm ${
                        errors.sequence_number 
                          ? 'border-red-300 focus:border-red-500 focus:ring-4 focus:ring-red-100' 
                          : 'border-gray-200 focus:border-red-500 focus:ring-4 focus:ring-red-100 hover:border-gray-300'
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
              <div className="xl:col-span-2">
                <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl p-6 border border-gray-200 mb-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-xl p-2">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">Deskripsi Tambahan</h3>
                  </div>
                  <p className="text-gray-600 text-sm leading-relaxed mb-4">
                    Tambahkan informasi detail atau catatan khusus untuk titik ini
                  </p>
                  
                  <div>
                    <label htmlFor="description" className="flex items-center text-sm font-semibold text-gray-800 mb-3">
                      <svg className="w-4 h-4 mr-2 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Deskripsi
                    </label>
                    <div className="relative">
                      <textarea
                        id="description"
                        rows={4}
                        value={data.description}
                        onChange={(e) => setData('description', e.target.value)}
                        className={`w-full px-4 py-3 pr-12 rounded-xl border-2 transition-all duration-200 bg-white/50 backdrop-blur-sm resize-none ${
                          errors.description 
                            ? 'border-red-300 focus:border-red-500 focus:ring-4 focus:ring-red-100' 
                            : 'border-gray-200 focus:border-red-500 focus:ring-4 focus:ring-red-100 hover:border-gray-300'
                        } focus:outline-none`}
                        placeholder="Contoh: Titik ini berada di dekat tower seluler, akses jalan mudah, perlu koordinasi dengan pihak ketiga..."
                      />
                      <div className="absolute top-3 right-3 pointer-events-none">
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
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
              </div>

              {/* Submit Buttons */}
              <div className="xl:col-span-2">
                <div className="bg-gradient-to-r from-gray-50 to-slate-50 rounded-2xl p-6 border border-gray-200 mt-8">
                  <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                    <div className="flex items-center space-x-3">
                      <div className="bg-gradient-to-r from-gray-500 to-slate-500 rounded-xl p-2">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div>
                        <h4 className="text-lg font-bold text-gray-900">Konfirmasi Perubahan</h4>
                        <p className="text-sm text-gray-600">Pastikan semua data sudah benar sebelum menyimpan</p>
                      </div>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full lg:w-auto">
                      <Link
                        href={route('admin.fo-management.routes.detail', parentRouteId || 15)}
                        className="group relative px-8 py-4 bg-white border-2 border-gray-200 rounded-xl shadow-lg text-gray-700 font-semibold transition-all duration-300 hover:border-gray-300 hover:shadow-xl hover:-translate-y-1 focus:outline-none focus:ring-4 focus:ring-gray-100 active:transform active:scale-95 text-center"
                      >
                        <div className="flex items-center justify-center">
                          <svg className="w-5 h-5 mr-2 transition-transform group-hover:-translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                          </svg>
                          Kembali
                        </div>
                      </Link>
                      
                      <button
                        type="submit"
                        disabled={processing}
                        className="group relative px-8 py-4 bg-gradient-to-r from-red-600 to-red-700 text-white font-bold rounded-xl shadow-lg transition-all duration-300 hover:from-red-700 hover:to-red-800 hover:shadow-xl hover:-translate-y-1 focus:outline-none focus:ring-4 focus:ring-red-200 active:transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                      >
                        <div className="flex items-center justify-center">
                          {processing ? (
                            <>
                              <svg className="animate-spin w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              Memperbarui...
                            </>
                          ) : (
                            <>
                              <svg className="w-5 h-5 mr-2 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                              </svg>
                              Perbarui Titik
                            </>
                          )}
                        </div>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
      </div>
    </AdminLayout>
  );
}
