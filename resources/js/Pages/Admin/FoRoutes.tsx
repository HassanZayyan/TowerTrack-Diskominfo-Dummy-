import React, { useState, useCallback, memo } from 'react';
import { Head, Link, usePage, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { FoRoute, FoRoutesPageProps, PageProps } from '@/types';

// Loading skeleton component
const TableRowSkeleton = memo(() => (
  <tr className="animate-pulse">
    <td className="px-4 py-3">
      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
    </td>
    <td className="px-4 py-3">
      <div className="h-4 bg-gray-200 rounded w-20"></div>
    </td>
    <td className="px-4 py-3">
      <div className="h-6 bg-gray-200 rounded-full w-16"></div>
    </td>
    <td className="px-4 py-3">
      <div className="h-4 bg-gray-200 rounded w-8"></div>
    </td>
    <td className="px-4 py-3">
      <div className="h-4 bg-gray-200 rounded w-16"></div>
    </td>
    <td className="px-4 py-3">
      <div className="flex gap-2">
        <div className="h-6 bg-gray-200 rounded w-12"></div>
        <div className="h-6 bg-gray-200 rounded w-12"></div>
      </div>
    </td>
  </tr>
));

TableRowSkeleton.displayName = 'TableRowSkeleton';

// Status badge component
const StatusBadge = memo(({ status }: { status: string }) => {
  const statusConfig = {
    active: { label: 'Aktif', className: 'bg-green-100 text-green-800' },
    inactive: { label: 'Non-aktif', className: 'bg-gray-100 text-gray-800' },
    maintenance: { label: 'Maintenance', className: 'bg-yellow-100 text-yellow-800' },
  };
  
  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.active;
  
  return (
    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${config.className}`}>
      {config.label}
    </span>
  );
});

StatusBadge.displayName = 'StatusBadge';

// Route table row component
const RouteTableRow = memo(({ routeItem, onDelete }: { 
  routeItem: FoRoute; 
  onDelete: (route: FoRoute) => void;
}) => (
  <tr className="hover:bg-gray-50 transition-colors">
    <td className="px-3 sm:px-4 py-3">
      <div className="font-medium text-gray-900 text-sm sm:text-base">{routeItem.name}</div>
      {routeItem.description && (
        <div className="text-xs text-gray-500 mt-1 line-clamp-2">{routeItem.description}</div>
      )}
    </td>
    <td className="px-3 sm:px-4 py-3 hidden sm:table-cell">
      <span className="capitalize text-sm">{routeItem.area}</span>
    </td>
    <td className="px-3 sm:px-4 py-3">
      <StatusBadge status={routeItem.status} />
    </td>
    <td className="px-3 sm:px-4 py-3 hidden md:table-cell">
      <span className="font-mono text-sm">{routeItem.total_points || 0}</span>
    </td>
    <td className="px-3 sm:px-4 py-3 hidden lg:table-cell">
      <span className="font-mono text-sm">{(routeItem.total_distance || 0).toFixed(2)} km</span>
    </td>
    <td className="px-3 sm:px-4 py-3">
      <div className="flex gap-1 sm:gap-2">
        <Link 
          href={route('admin.fo-routes.edit', routeItem.id)} 
          className="px-2 sm:px-3 py-1 text-xs rounded text-white hover:opacity-90 transition-opacity focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500" 
          style={{ backgroundColor: '#B71C1C' }}
          aria-label={`Edit jalur ${routeItem.name}`}
        >
          Edit
        </Link>
        <button
          onClick={() => onDelete(routeItem)}
          className="px-2 sm:px-3 py-1 text-xs rounded bg-red-100 text-red-700 hover:bg-red-200 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          aria-label={`Hapus jalur ${routeItem.name}`}
        >
          Hapus
        </button>
      </div>
    </td>
  </tr>
));

RouteTableRow.displayName = 'RouteTableRow';

// Empty state component
const EmptyState = memo(() => (
  <div className="p-8 sm:p-12 text-center text-gray-500">
    <svg 
      className="mx-auto h-12 w-12 text-gray-400 mb-4" 
      fill="none" 
      viewBox="0 0 24 24" 
      stroke="currentColor"
    >
      <path 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        strokeWidth={2} 
        d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" 
      />
    </svg>
    <p className="text-lg mb-2">Belum ada jalur FO</p>
    <p className="text-sm">Klik "Tambah Jalur" untuk membuat jalur baru</p>
  </div>
));

EmptyState.displayName = 'EmptyState';

// Pagination component
const Pagination = memo(({ routes }: { routes: any }) => {
  if (routes.last_page <= 1) return null;

  return (
    <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="text-xs sm:text-sm text-gray-700">
          Menampilkan {((routes.current_page - 1) * routes.per_page) + 1} - {Math.min(routes.current_page * routes.per_page, routes.total)} dari {routes.total} hasil
        </div>
        <div className="flex gap-1 flex-wrap justify-center">
          {routes.links.map((link: any, index: number) => {
            if (!link.url) {
              return (
                <span 
                  key={index} 
                  className="px-2 sm:px-3 py-1 sm:py-2 text-xs sm:text-sm text-gray-400 cursor-not-allowed"
                >
                  {link.label.replace('&laquo;', '«').replace('&raquo;', '»')}
                </span>
              );
            }
            return (
              <Link
                key={index}
                href={link.url}
                className={`px-2 sm:px-3 py-1 sm:py-2 text-xs sm:text-sm rounded transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 ${
                  link.active 
                    ? 'bg-red-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                preserveState
                preserveScroll
              >
                {link.label.replace('&laquo;', '«').replace('&raquo;', '»')}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
});

Pagination.displayName = 'Pagination';

export default function FoRoutes() {
  const { props } = usePage<PageProps<FoRoutesPageProps>>();
  const { routes, area } = props;
  
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleDelete = useCallback((routeItem: FoRoute) => {
    if (deletingId) return; // Prevent multiple deletes
    
    const confirmMessage = `Apakah Anda yakin ingin menghapus jalur "${routeItem.name}"?\n\nTindakan ini tidak dapat dibatalkan.`;
    
    if (window.confirm(confirmMessage)) {
      setDeletingId(routeItem.id);
      
      router.delete(route('admin.fo-routes.destroy', routeItem.id), {
        preserveScroll: true,
        onSuccess: () => {
          setDeletingId(null);
        },
        onError: () => {
          setDeletingId(null);
          alert('Gagal menghapus jalur. Silakan coba lagi.');
        },
        onStart: () => setIsLoading(true),
        onFinish: () => setIsLoading(false),
      });
    }
  }, [deletingId]);

  return (
    <AuthenticatedLayout>
      <Head title="Kelola Jalur FO" />
      <div className="p-4 sm:p-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 sm:mb-6 gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
              Kelola Jalur Fiber Optik
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Kelola jalur fiber optik untuk area {area}
            </p>
          </div>
          <Link 
            href={route('admin.fo-routes.create')} 
            className="inline-flex items-center px-4 py-2 rounded text-white text-sm font-medium hover:opacity-90 transition-opacity focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500" 
            style={{ backgroundColor: '#B71C1C' }}
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Tambah Jalur
          </Link>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {/* Loading overlay */}
          {isLoading && (
            <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10">
              <div className="flex items-center space-x-2">
                <svg className="animate-spin h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span className="text-sm text-gray-600">Memproses...</span>
              </div>
            </div>
          )}

          {routes.data.length === 0 ? (
            <EmptyState />
          ) : (
            <>
              {/* Mobile-friendly table */}
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Nama
                      </th>
                      <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                        Area
                      </th>
                      <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                        Titik
                      </th>
                      <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                        Jarak
                      </th>
                      <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Aksi
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200 relative">
                    {deletingId && (
                      <tr className="absolute inset-0 bg-gray-200 bg-opacity-50 z-20">
                        <td colSpan={6} className="text-center py-4">
                          <div className="flex items-center justify-center">
                            <svg className="animate-spin h-4 w-4 text-gray-600 mr-2" fill="none" viewBox="0 0 24 24">
                              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Menghapus...
                          </div>
                        </td>
                      </tr>
                    )}
                    {routes.data.map((routeItem: FoRoute) => (
                      <RouteTableRow 
                        key={routeItem.id} 
                        routeItem={routeItem} 
                        onDelete={handleDelete}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
              
              <Pagination routes={routes} />
            </>
          )}
        </div>

        {/* Mobile info cards - shown only on small screens */}
        <div className="mt-4 sm:hidden">
          <div className="grid grid-cols-2 gap-4 text-xs text-gray-600">
            <div className="bg-gray-50 p-3 rounded">
              <div className="font-medium">Total Jalur</div>
              <div className="text-lg font-bold text-gray-900">{routes.total}</div>
            </div>
            <div className="bg-gray-50 p-3 rounded">
              <div className="font-medium">Area Aktif</div>
              <div className="text-lg font-bold text-gray-900 capitalize">{area}</div>
            </div>
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}