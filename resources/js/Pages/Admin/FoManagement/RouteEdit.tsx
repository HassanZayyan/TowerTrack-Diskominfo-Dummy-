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
    put(route('admin.fo-management.routes.update', foRoute.id));
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
      
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Edit Jalur Fiber Optic</h1>
            <p className="text-sm text-gray-600 mt-1">
              Edit informasi jalur: {foRoute.name}
            </p>
          </div>
          <Link
            href={route('admin.fo-management.index', { tab: 'routes' })}
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
                    Nama Jalur <span className="text-red-500">*</span>
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
                    placeholder="Contoh: Jalur Utama Ungaran"
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

                <div>
                  <label htmlFor="color" className="block text-sm font-medium text-gray-700">
                    Warna Jalur
                  </label>
                  <div className="mt-1 flex items-center space-x-3">
                    <input
                      type="color"
                      id="color"
                      value={data.color}
                      onChange={(e) => setData('color', e.target.value)}
                      className="h-10 w-20 rounded border border-gray-300 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={data.color}
                      onChange={(e) => setData('color', e.target.value)}
                      className="block w-24 rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm"
                      placeholder="#3B82F6"
                    />
                  </div>
                  {errors.color && (
                    <p className="mt-1 text-sm text-red-600">{errors.color}</p>
                  )}
                </div>

                {/* Route Info */}
                <div className="space-y-2 p-4 bg-gray-50 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-900">Informasi Jalur</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Total Jarak:</span>
                      <div className="font-medium">{foRoute.total_distance.toFixed(2)} km</div>
                    </div>
                    <div>
                      <span className="text-gray-500">Total Titik:</span>
                      <div className="font-medium">{foRoute.total_points}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">Deskripsi</h3>
                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                    Deskripsi Jalur
                  </label>
                  <textarea
                    id="description"
                    rows={8}
                    value={data.description}
                    onChange={(e) => setData('description', e.target.value)}
                    className={`mt-1 block w-full rounded-md shadow-sm ${
                      errors.description 
                        ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                        : 'border-gray-300 focus:border-red-500 focus:ring-red-500'
                    }`}
                    placeholder="Deskripsi tambahan untuk jalur ini..."
                  />
                  {errors.description && (
                    <p className="mt-1 text-sm text-red-600">{errors.description}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Path Coordinates */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Koordinat Jalur</h3>
                <button
                  type="button"
                  onClick={addCoordinate}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Tambah Koordinat
                </button>
              </div>

              <div className="space-y-4">
                {coordinates.map((coord, index) => (
                  <div key={index} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium text-gray-700 w-8">
                      {index + 1}.
                    </span>
                    <div className="flex-1 grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Latitude
                        </label>
                        <input
                          type="number"
                          step="any"
                          value={coord.lat}
                          onChange={(e) => updateCoordinate(index, 'lat', e.target.value)}
                          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm"
                          placeholder="-7.123456"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Longitude
                        </label>
                        <input
                          type="number"
                          step="any"
                          value={coord.lng}
                          onChange={(e) => updateCoordinate(index, 'lng', e.target.value)}
                          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm"
                          placeholder="110.123456"
                        />
                      </div>
                    </div>
                    {coordinates.length > 2 && (
                      <button
                        type="button"
                        onClick={() => removeCoordinate(index)}
                        className="p-2 text-red-600 hover:text-red-800 focus:outline-none"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {errors.path_coordinates && (
                <p className="mt-2 text-sm text-red-600">{errors.path_coordinates}</p>
              )}
            </div>

            {/* Submit Buttons */}
            <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200">
              <Link
                href={route('admin.fo-management.index', { tab: 'routes' })}
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
                    Update Jalur
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
