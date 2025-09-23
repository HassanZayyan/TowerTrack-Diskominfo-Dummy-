import React, { useState, useCallback } from 'react';
import { Head, Link, usePage, router } from '@inertiajs/react';
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
  created_at: string;
  updated_at: string;
}

interface FoRoute {
  id: number;
  name: string;
  area: string;
  status: string;
  color: string;
  total_distance: number;
  total_points: number;
  description?: string;
  path_coordinates?: Array<{ lat: number; lng: number }>;
  created_at: string;
  updated_at: string;
}

interface PageProps {
  auth: {
    user: {
      id: number;
      name: string;
      email: string;
      role: string;
    };
  };
  route: FoRoute;
  points: {
    data: FoPoint[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: any[];
  };
  routeStats: {
    active_points: number;
    inactive_points: number;
    maintenance_points: number;
    points_by_type: { type: string; count: number; label: string }[];
  };
  [key: string]: any;
}

// Route Header Component
const RouteHeader = ({ foRoute, canEdit }: { foRoute: FoRoute; canEdit: boolean }) => {
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'active':
        return { bg: 'bg-green-100', text: 'text-green-800', label: 'Aktif' };
      case 'inactive':
        return { bg: 'bg-red-100', text: 'text-red-800', label: 'Non-aktif' };
      case 'maintenance':
        return { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Maintenance' };
      default:
        return { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Unknown' };
    }
  };

  const statusConfig = getStatusConfig(foRoute.status);

  return (
    <div className="bg-white shadow-sm rounded-xl border border-gray-200 p-6">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-4">
            <div
              className="w-6 h-6 rounded-full flex-shrink-0"
              style={{ backgroundColor: foRoute.color || '#3B82F6' }}
            />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{foRoute.name}</h1>
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusConfig.bg} ${statusConfig.text} mt-1`}>
                {statusConfig.label}
              </span>
            </div>
          </div>
          
          {foRoute.description && (
            <p className="text-gray-600 mb-4">{foRoute.description}</p>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div>
              <div className="text-sm font-medium text-gray-700">Area</div>
              <div className="text-lg font-semibold text-gray-900 capitalize">{foRoute.area}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-gray-700">Total Jarak</div>
              <div className="text-lg font-semibold text-gray-900">
                {foRoute.total_distance?.toFixed(1) || '0.0'} km
              </div>
            </div>
            <div>
              <div className="text-sm font-medium text-gray-700">Total Titik</div>
              <div className="text-lg font-semibold text-gray-900">
                {foRoute.total_points || 0} titik
              </div>
            </div>
          </div>

          <div className="mt-4 text-sm text-gray-500">
            Dibuat: {new Date(foRoute.created_at).toLocaleDateString('id-ID')} • 
            Diperbarui: {new Date(foRoute.updated_at).toLocaleDateString('id-ID')}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 ml-4">
          <Link
            href={route('admin.fo-management.routes.list')}
            className="group inline-flex items-center justify-center px-4 py-2 bg-gray-600 text-white font-medium rounded-lg hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all duration-200 shadow-sm hover:shadow-md"
            title="Kembali ke daftar jalur FO"
          >
            <svg className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Kembali
          </Link>
          
          {canEdit && (
            <Link
              href={route('admin.fo-management.routes.edit', foRoute.id)}
              className="group inline-flex items-center justify-center px-4 py-2 bg-amber-500 text-white font-medium rounded-lg hover:bg-amber-600 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2 transition-all duration-200 shadow-sm hover:shadow-md"
              title="Edit jalur FO"
            >
              <svg className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Edit Jalur
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};

// Points Stats Component
const PointsStats = ({ stats }: { stats: PageProps['routeStats'] }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-4">
      {/* Active Points */}
      <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-xl p-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-medium text-green-700">Titik Aktif</div>
            <div className="text-2xl font-bold text-green-900">{stats.active_points}</div>
          </div>
          <div className="p-2 bg-green-200 rounded-full">
            <svg className="w-5 h-5 text-green-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Inactive Points */}
      <div className="bg-gradient-to-br from-red-50 to-red-100 border border-red-200 rounded-xl p-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-medium text-red-700">Titik Non-aktif</div>
            <div className="text-2xl font-bold text-red-900">{stats.inactive_points}</div>
          </div>
          <div className="p-2 bg-red-200 rounded-full">
            <svg className="w-5 h-5 text-red-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
        </div>
      </div>

      {/* Maintenance Points */}
      <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 border border-yellow-200 rounded-xl p-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-medium text-yellow-700">Maintenance</div>
            <div className="text-2xl font-bold text-yellow-900">{stats.maintenance_points}</div>
          </div>
          <div className="p-2 bg-yellow-200 rounded-full">
            <svg className="w-5 h-5 text-yellow-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.882-.833-2.652 0L4.162 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Point Types Distribution */}
      <div className="bg-gradient-to-br from-red-50 to-red-100 border border-red-200 rounded-xl p-4">
        <div className="text-sm font-medium text-red-700 mb-2">Distribusi Tipe</div>
        <div className="space-y-1">
          {stats.points_by_type.slice(0, 2).map((item) => (
            <div key={item.type} className="flex justify-between text-xs">
              <span className="text-blue-600">{item.label}</span>
              <span className="font-medium text-red-900">{item.count}</span>
            </div>
          ))}
          {stats.points_by_type.length > 2 && (
            <div className="text-xs text-blue-600">+{stats.points_by_type.length - 2} lainnya</div>
          )}
        </div>
      </div>
    </div>
  );
};

// Point Table Component
const PointsTable = ({ 
  points, 
  canEdit, 
  onDelete, 
  selectedPoints, 
  onSelectPoint, 
  onSelectAll,
  routeId,
}: { 
  points: FoPoint[]; 
  canEdit: boolean; 
  onDelete: (point: FoPoint) => void;
  selectedPoints: number[];
  onSelectPoint: (pointId: number) => void;
  onSelectAll: (selected: boolean) => void;
  routeId: number;
}) => {
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'active':
        return { bg: 'bg-green-100', text: 'text-green-800', label: 'Aktif' };
      case 'inactive':
        return { bg: 'bg-red-100', text: 'text-red-800', label: 'Non-aktif' };
      case 'maintenance':
        return { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Maintenance' };
      default:
        return { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Unknown' };
    }
  };

  const getTypeLabel = (type: string) => {
    const labels = {
      'pole': 'Tiang/Pole',
      'junction': 'Junction Box',
      'hub': 'Hub',
      'endpoint': 'Endpoint'
    };
    return labels[type as keyof typeof labels] || type;
  };

  const allSelected = points.length > 0 && selectedPoints.length === points.length;
  const someSelected = selectedPoints.length > 0 && selectedPoints.length < points.length;

  return (
    <div className="bg-white shadow-sm rounded-xl border border-gray-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">
            Daftar Titik FO ({points.length})
          </h3>
          {canEdit && (
            <div className="flex flex-wrap gap-3">
              <Link
                href={route('admin.fo-management.points.create', routeId)}
                className="group inline-flex items-center px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-all duration-200 shadow-sm hover:shadow-md"
                title="Tambah titik/koordinat pada jalur ini"
              >
                <svg className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Tambah Titik
              </Link>
              
              {selectedPoints.length > 0 && (
                <div className="flex gap-2">
                  <button 
                    className="group inline-flex items-center px-3 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all duration-200 shadow-sm hover:shadow-md"
                    onClick={() => console.log('Bulk activate')}
                    title="Aktifkan titik yang dipilih"
                  >
                    <svg className="w-4 h-4 mr-1 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Aktifkan ({selectedPoints.length})
                  </button>
                  <button 
                    className="group inline-flex items-center px-3 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-all duration-200 shadow-sm hover:shadow-md"
                    onClick={() => console.log('Bulk delete')}
                    title="Hapus titik yang dipilih"
                  >
                    <svg className="w-4 h-4 mr-1 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Hapus ({selectedPoints.length})
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {points.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {canEdit && (
                  <th className="w-4 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      ref={(el) => {
                        if (el) el.indeterminate = someSelected;
                      }}
                      onChange={(e) => onSelectAll(e.target.checked)}
                      className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                    />
                  </th>
                )}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  #
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nama Titik
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tipe
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Koordinat
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Dibuat
                </th>
                {canEdit && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Aksi
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {points.map((point) => {
                const statusConfig = getStatusConfig(point.status);
                const isSelected = selectedPoints.includes(point.id);
                
                return (
                  <tr key={point.id} className={isSelected ? 'bg-red-50' : 'hover:bg-gray-50'}>
                    {canEdit && (
                      <td className="w-4 px-6 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => onSelectPoint(point.id)}
                          className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                        />
                      </td>
                    )}
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {point.sequence_number}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{point.name}</div>
                      {point.description && (
                        <div className="text-sm text-gray-500 truncate max-w-xs">
                          {point.description}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">
                        {getTypeLabel(point.type)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${statusConfig.bg} ${statusConfig.text}`}>
                        {statusConfig.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex flex-col">
                        <span>{point.latitude.toFixed(6)}</span>
                        <span>{point.longitude.toFixed(6)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(point.created_at).toLocaleDateString('id-ID')}
                    </td>
                    {canEdit && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex gap-3">
                          <Link
                            href={route('admin.fo-management.points.edit', point.id)}
                            className="group inline-flex items-center px-3 py-1.5 bg-amber-500 text-white text-xs font-medium rounded-md hover:bg-amber-600 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-1 transition-all duration-200 shadow-sm hover:shadow-md"
                            title="Edit titik FO"
                          >
                            <svg className="w-3 h-3 mr-1 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            Edit
                          </Link>
                          <button
                            onClick={() => onDelete(point)}
                            className="group inline-flex items-center px-3 py-1.5 bg-red-600 text-white text-xs font-medium rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1 transition-all duration-200 shadow-sm hover:shadow-md"
                            title="Hapus titik FO"
                          >
                            <svg className="w-3 h-3 mr-1 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            Hapus
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="p-12 text-center">
          <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Belum ada titik FO
          </h3>
          <p className="text-gray-600 mb-4">
            Jalur ini belum memiliki titik FO. Mulai dengan menambahkan titik pertama.
          </p>
          {canEdit && (
            <Link
              href={route('admin.fo-management.points.create', routeId)}
              className="inline-flex items-center px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Tambah Titik Pertama
            </Link>
          )}
        </div>
      )}
    </div>
  );
};

export default function RouteDetail() {
  const { props } = usePage<PageProps>();
  const { route: foRoute, points, routeStats, auth } = props;

  const [selectedPoints, setSelectedPoints] = useState<number[]>([]);
  const canEdit = ['admin', 'operator'].includes(auth.user.role);

  const handleSelectPoint = (pointId: number) => {
    setSelectedPoints(prev =>
      prev.includes(pointId)
        ? prev.filter(id => id !== pointId)
        : [...prev, pointId]
    );
  };

  const handleSelectAll = (selected: boolean) => {
    setSelectedPoints(selected ? points.data.map(p => p.id) : []);
  };

  const handleDeletePoint = (point: FoPoint) => {
    if (confirm(`Apakah Anda yakin ingin menghapus titik "${point.name}"?`)) {
      router.delete(route('admin.fo-management.points.destroy', point.id), {
        onSuccess: () => {
          setSelectedPoints(prev => prev.filter(id => id !== point.id));
        },
        onError: () => {
          alert('Terjadi kesalahan saat menghapus titik.');
        }
      });
    }
  };

  return (
    <AdminLayout title={`Detail Jalur - ${foRoute.name}`}>
      <Head title={`Detail Jalur - ${foRoute.name}`} />
      
      <div className="space-y-6">
        {/* Route Header */}
        <RouteHeader foRoute={foRoute} canEdit={canEdit} />

        {/* Points Stats */}
        <PointsStats stats={routeStats} />

        {/* Points Table */}
        <PointsTable
          points={points.data}
          canEdit={canEdit}
          onDelete={handleDeletePoint}
          selectedPoints={selectedPoints}
          onSelectPoint={handleSelectPoint}
          onSelectAll={handleSelectAll}
          routeId={foRoute.id}
        />

        {/* Pagination */}
        {points.total > points.per_page && (
          <div className="bg-white px-4 py-3 border border-gray-200 rounded-lg sm:px-6">
            <div className="flex items-center justify-between">
              <div className="flex justify-between flex-1 sm:hidden">
                {points.links[0].url && (
                  <Link
                    href={points.links[0].url}
                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  >
                    Previous
                  </Link>
                )}
                {points.links[points.links.length - 1].url && (
                  <Link
                    href={points.links[points.links.length - 1].url}
                    className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  >
                    Next
                  </Link>
                )}
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Menampilkan{' '}
                    <span className="font-medium">
                      {(points.current_page - 1) * points.per_page + 1}
                    </span>{' '}
                    hingga{' '}
                    <span className="font-medium">
                      {Math.min(points.current_page * points.per_page, points.total)}
                    </span>{' '}
                    dari{' '}
                    <span className="font-medium">{points.total}</span> hasil
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                    {points.links.map((link, index) => (
                      <Link
                        key={index}
                        href={link.url || '#'}
                        className={`relative inline-flex items-center px-2 py-2 border text-sm font-medium ${
                          link.active
                            ? 'z-10 bg-red-50 border-red-500 text-red-600'
                            : link.url
                            ? 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                            : 'bg-gray-100 border-gray-300 text-gray-300 cursor-not-allowed'
                        } ${
                          index === 0 ? 'rounded-l-md' : ''
                        } ${
                          index === points.links.length - 1 ? 'rounded-r-md' : ''
                        }`}
                        dangerouslySetInnerHTML={{ __html: link.label }}
                      />
                    ))}
                  </nav>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
