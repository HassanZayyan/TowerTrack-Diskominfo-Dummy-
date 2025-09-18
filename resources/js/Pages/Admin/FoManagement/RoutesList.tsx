import React, { useState, useCallback } from 'react';
import { Head, Link, usePage, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';

interface FoRoute {
  id: number;
  name: string;
  area: string;
  status: string;
  color: string;
  total_distance: number;
  total_points: number;
  description?: string;
  created_at: string;
  updated_at: string;
}

interface Stats {
  total_routes: number;
  active_routes: number;
  inactive_routes: number;
  maintenance_routes: number;
  total_distance: number;
  total_points: number;
  health_score: number;
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
  routes: {
    data: FoRoute[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: any[];
  };
  stats: Stats;
  currentArea: string;
  availableAreas: string[];
  [key: string]: any;
}

// Stats Cards Component
const StatsCards = ({ stats }: { stats: Stats }) => {
  const getHealthColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-100 border-green-200';
    if (score >= 60) return 'text-yellow-600 bg-yellow-100 border-yellow-200';
    return 'text-red-600 bg-red-100 border-red-200';
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* Total Routes */}
      <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium text-blue-700 mb-2">Total Jalur</h3>
            <div className="text-3xl font-bold text-blue-900">{stats.total_routes}</div>
            <div className="text-xs text-blue-600 mt-1">Jalur FO</div>
          </div>
          <div className="p-3 bg-blue-200 rounded-full">
            <svg className="w-8 h-8 text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
          </div>
        </div>
      </div>

      {/* Active Routes */}
      <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-xl p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium text-green-700 mb-2">Jalur Aktif</h3>
            <div className="text-3xl font-bold text-green-900">{stats.active_routes}</div>
            <div className="text-xs text-green-600 mt-1">Beroperasi</div>
          </div>
          <div className="p-3 bg-green-200 rounded-full">
            <svg className="w-8 h-8 text-green-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Total Distance */}
      <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-xl p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium text-purple-700 mb-2">Total Jarak</h3>
            <div className="text-3xl font-bold text-purple-900">{stats.total_distance?.toFixed(1) || '0.0'}</div>
            <div className="text-xs text-purple-600 mt-1">Kilometer</div>
          </div>
          <div className="p-3 bg-purple-200 rounded-full">
            <svg className="w-8 h-8 text-purple-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          </div>
        </div>
      </div>

      {/* Health Score */}
      <div className={`rounded-xl p-6 shadow-sm border ${getHealthColor(stats.health_score)}`}>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium mb-2">Kesehatan Jaringan</h3>
            <div className="text-3xl font-bold mb-1">{stats.health_score}%</div>
            <div className="text-xs opacity-80">Health Score</div>
          </div>
          <div className="p-3 rounded-full" style={{ backgroundColor: 'rgba(255,255,255,0.3)' }}>
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
};

// Route Card Component
const RouteCard = ({ foRoute, canEdit, onDelete }: { 
  foRoute: FoRoute; 
  canEdit: boolean; 
  onDelete: (route: FoRoute) => void;
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

  const statusConfig = getStatusConfig(foRoute.status);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <div
                className="w-4 h-4 rounded-full flex-shrink-0"
                style={{ backgroundColor: foRoute.color || '#3B82F6' }}
              />
              <h3 className="text-lg font-semibold text-gray-900 truncate">
                {foRoute.name}
              </h3>
            </div>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusConfig.bg} ${statusConfig.text}`}>
              {statusConfig.label}
            </span>
          </div>
          
          {/* Actions Dropdown */}
          <div className="relative">
            <div className="flex gap-2">
              {/* View Details Button */}
              <Link
                href={route('admin.fo-management.routes.detail', foRoute.id)}
                className="inline-flex items-center px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                Detail
              </Link>

              {canEdit && (
                <>
                  <Link
                    href={route('admin.fo-management.routes.edit', foRoute.id)}
                    className="inline-flex items-center px-3 py-1.5 bg-yellow-600 text-white text-sm font-medium rounded-md hover:bg-yellow-700 transition-colors"
                  >
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Edit
                  </Link>
                  
                  <button
                    onClick={() => onDelete(foRoute)}
                    className="inline-flex items-center px-3 py-1.5 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700 transition-colors"
                  >
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Hapus
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Description */}
        {foRoute.description && (
          <p className="text-sm text-gray-600 mb-4 line-clamp-2">{foRoute.description}</p>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <div className="text-sm font-medium text-gray-700">Jarak Total</div>
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

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <div className="text-xs text-gray-500">
            Area: <span className="font-medium capitalize">{foRoute.area}</span>
          </div>
          <div className="text-xs text-gray-500">
            {new Date(foRoute.updated_at).toLocaleDateString('id-ID')}
          </div>
        </div>
      </div>
    </div>
  );
};

export default function RoutesList() {
  const { props } = usePage<PageProps>();
  const { routes, stats, currentArea, availableAreas, auth } = props;

  const [filters, setFilters] = useState({
    area: currentArea,
    status: 'all',
    search: ''
  });

  const canEdit = ['admin', 'operator'].includes(auth.user.role);

  // Handle filter changes
  const handleFilterChange = useCallback((newFilters: typeof filters) => {
    setFilters(newFilters);
    router.get(route('admin.fo-management.routes.list'), 
      newFilters as any, 
      { preserveState: true, replace: true }
    );
  }, []);

  // Handle route deletion
  const handleDelete = (routeToDelete: FoRoute) => {
    if (confirm(`Apakah Anda yakin ingin menghapus jalur "${routeToDelete.name}"?`)) {
      router.delete(route('admin.fo-management.routes.destroy', routeToDelete.id), {
        onSuccess: () => {
          // Handle success
        },
        onError: (errors) => {
          alert('Terjadi kesalahan saat menghapus jalur.');
        }
      });
    }
  };

  // Filter routes based on current filters
  const filteredRoutes = routes.data.filter(route => {
    if (filters.status !== 'all' && route.status !== filters.status) return false;
    if (filters.search && !route.name.toLowerCase().includes(filters.search.toLowerCase())) return false;
    return true;
  });

  return (
    <AdminLayout title="Manajemen Jalur Fiber Optic">
      <Head title="Manajemen Jalur FO" />
      
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Manajemen Jalur FO</h1>
            <p className="text-gray-600 mt-2">
              Kelola jalur fiber optic untuk area {currentArea.charAt(0).toUpperCase() + currentArea.slice(1)}
            </p>
          </div>
          
          {canEdit && (
            <Link
              href={route('admin.fo-management.routes.create')}
              className="inline-flex items-center px-4 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors shadow-sm"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Tambah Jalur Baru
            </Link>
          )}
        </div>

        {/* Stats Cards */}
        <StatsCards stats={stats} />

        {/* Filters */}
        <div className="bg-white shadow-sm rounded-xl border border-gray-200 p-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
                Cari Jalur
              </label>
              <input
                type="text"
                id="search"
                value={filters.search}
                onChange={(e) => handleFilterChange({ ...filters, search: e.target.value })}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm"
                placeholder="Masukkan nama jalur..."
              />
            </div>
            
            <div>
              <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700 mb-2">
                Status Jalur
              </label>
              <select
                id="status-filter"
                value={filters.status}
                onChange={(e) => handleFilterChange({ ...filters, status: e.target.value })}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm"
              >
                <option value="all">Semua Status</option>
                <option value="active">Aktif</option>
                <option value="inactive">Non-aktif</option>
                <option value="maintenance">Maintenance</option>
              </select>
            </div>

            <div>
              <label htmlFor="area-filter" className="block text-sm font-medium text-gray-700 mb-2">
                Area
              </label>
              <select
                id="area-filter"
                value={filters.area}
                onChange={(e) => handleFilterChange({ ...filters, area: e.target.value })}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm"
              >
                {availableAreas.map((area: string) => (
                  <option key={area} value={area}>
                    {area.charAt(0).toUpperCase() + area.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Routes Grid */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">
              Daftar Jalur FO ({filteredRoutes.length})
            </h2>
          </div>
          
          {filteredRoutes.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredRoutes.map((foRoute) => (
                <RouteCard
                  key={foRoute.id}
                  foRoute={foRoute}
                  canEdit={canEdit}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
              <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 20l-5.447-2.724A1 1 0 713 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Tidak ada jalur FO yang ditemukan
              </h3>
              <p className="text-gray-600 mb-4">
                {filters.search || filters.status !== 'all' 
                  ? 'Coba ubah filter pencarian Anda.' 
                  : 'Belum ada jalur FO yang tersedia. Mulai dengan menambahkan jalur baru.'
                }
              </p>
              {canEdit && !filters.search && filters.status === 'all' && (
                <Link
                  href={route('admin.fo-management.routes.create')}
                  className="inline-flex items-center px-4 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Tambah Jalur Pertama
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
