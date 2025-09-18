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
}

export default function PointEdit({ 
  foPoint, 
  availableAreas, 
  availableTypes, 
  availableStatuses, 
  availableRoutes, 
  fromRouteDetail 
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
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Add from_route parameter to data before putting
    const submitData = {
      ...data,
      from_route: fromRouteDetail ? 'detail' : null,
    };
    
    // Temporarily update the form data to include from_route
    setData(submitData as any);
    put(route('admin.fo-management.points.update', foPoint.id));
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
      
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Edit Titik Fiber Optic</h1>
            <p className="text-sm text-gray-600 mt-1">
              Edit informasi titik: {foPoint.name}
            </p>
          </div>
          <Link
            href={fromRouteDetail 
              ? route('admin.fo-management.routes.detail', { foRoute: 'back' }) 
              : route('admin.fo-management.routes.list')
            }
            className="inline-flex items-center px-4 py-2 bg-gray-600 text-white text-sm font-medium rounded-lg hover:bg-gray-700 transition-colors"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Kembali
          </Link>
        </div>

        {/* Form */}
        <div className="bg-white shadow rounded-lg">
          <form onSubmit={handleSubmit} className="space-y-6 p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">Informasi Dasar</h3>
                
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                    Nama Titik <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="name"
                    value={data.name}
                    onChange={(e) => setData('name', e.target.value)}
                    className={`mt-1 block w-full rounded-md shadow-sm ${
                      errors.name 
                        ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                        : 'border-gray-300 focus:border-red-500 focus:ring-red-500'
                    }`}
                    placeholder="Contoh: Tower FO-001"
                  />
                  {errors.name && (
                    <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="area" className="block text-sm font-medium text-gray-700">
                    Area <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="area"
                    value={data.area}
                    onChange={(e) => setData('area', e.target.value)}
                    className={`mt-1 block w-full rounded-md shadow-sm ${
                      errors.area 
                        ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                        : 'border-gray-300 focus:border-red-500 focus:ring-red-500'
                    }`}
                  >
                    {availableAreas.map((area) => (
                      <option key={area} value={area}>
                        {area.charAt(0).toUpperCase() + area.slice(1)}
                      </option>
                    ))}
                  </select>
                  {errors.area && (
                    <p className="mt-1 text-sm text-red-600">{errors.area}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="type" className="block text-sm font-medium text-gray-700">
                    Tipe <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="type"
                    value={data.type}
                    onChange={(e) => setData('type', e.target.value)}
                    className={`mt-1 block w-full rounded-md shadow-sm ${
                      errors.type 
                        ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                        : 'border-gray-300 focus:border-red-500 focus:ring-red-500'
                    }`}
                  >
                    {availableTypes.map((type) => (
                      <option key={type} value={type}>
                        {typeLabels[type] || type}
                      </option>
                    ))}
                  </select>
                  {errors.type && (
                    <p className="mt-1 text-sm text-red-600">{errors.type}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                    Status <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="status"
                    value={data.status}
                    onChange={(e) => setData('status', e.target.value)}
                    className={`mt-1 block w-full rounded-md shadow-sm ${
                      errors.status 
                        ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                        : 'border-gray-300 focus:border-red-500 focus:ring-red-500'
                    }`}
                  >
                    {availableStatuses.map((status) => (
                      <option key={status} value={status}>
                        {statusLabels[status] || status}
                      </option>
                    ))}
                  </select>
                  {errors.status && (
                    <p className="mt-1 text-sm text-red-600">{errors.status}</p>
                  )}
                </div>
              </div>

              {/* Location and Route Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">Lokasi & Jalur</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="latitude" className="block text-sm font-medium text-gray-700">
                      Latitude <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      id="latitude"
                      step="any"
                      value={data.latitude}
                      onChange={(e) => setData('latitude', e.target.value)}
                      className={`mt-1 block w-full rounded-md shadow-sm ${
                        errors.latitude 
                          ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                          : 'border-gray-300 focus:border-red-500 focus:ring-red-500'
                      }`}
                      placeholder="-7.123456"
                    />
                    {errors.latitude && (
                      <p className="mt-1 text-sm text-red-600">{errors.latitude}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="longitude" className="block text-sm font-medium text-gray-700">
                      Longitude <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      id="longitude"
                      step="any"
                      value={data.longitude}
                      onChange={(e) => setData('longitude', e.target.value)}
                      className={`mt-1 block w-full rounded-md shadow-sm ${
                        errors.longitude 
                          ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                          : 'border-gray-300 focus:border-red-500 focus:ring-red-500'
                      }`}
                      placeholder="110.123456"
                    />
                    {errors.longitude && (
                      <p className="mt-1 text-sm text-red-600">{errors.longitude}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label htmlFor="route_name" className="block text-sm font-medium text-gray-700">
                    Nama Jalur <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="route_name"
                    value={data.route_name}
                    onChange={(e) => setData('route_name', e.target.value)}
                    className={`mt-1 block w-full rounded-md shadow-sm ${
                      errors.route_name 
                        ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                        : 'border-gray-300 focus:border-red-500 focus:ring-red-500'
                    }`}
                  >
                    <option value="">Pilih Jalur...</option>
                    {availableRoutes.map((route) => (
                      <option key={route.id} value={route.name}>
                        {route.name} ({route.area})
                      </option>
                    ))}
                  </select>
                  {errors.route_name && (
                    <p className="mt-1 text-sm text-red-600">{errors.route_name}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="sequence_number" className="block text-sm font-medium text-gray-700">
                    Nomor Urut <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    id="sequence_number"
                    min="1"
                    value={data.sequence_number}
                    onChange={(e) => setData('sequence_number', e.target.value)}
                    className={`mt-1 block w-full rounded-md shadow-sm ${
                      errors.sequence_number 
                        ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                        : 'border-gray-300 focus:border-red-500 focus:ring-red-500'
                    }`}
                    placeholder="1"
                  />
                  {errors.sequence_number && (
                    <p className="mt-1 text-sm text-red-600">{errors.sequence_number}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                Deskripsi
              </label>
              <textarea
                id="description"
                rows={4}
                value={data.description}
                onChange={(e) => setData('description', e.target.value)}
                className={`mt-1 block w-full rounded-md shadow-sm ${
                  errors.description 
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                    : 'border-gray-300 focus:border-red-500 focus:ring-red-500'
                }`}
                placeholder="Deskripsi tambahan untuk titik ini..."
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-600">{errors.description}</p>
              )}
            </div>

            {/* Submit Buttons */}
            <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200">
              <Link
                href={fromRouteDetail 
                  ? route('admin.fo-management.routes.detail', { foRoute: 'back' }) 
                  : route('admin.fo-management.routes.list')
                }
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Batal
              </Link>
              <button
                type="submit"
                disabled={processing}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {processing ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Menyimpan...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Update Titik
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </AdminLayout>
  );
}
