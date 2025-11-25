import React, { useState, useCallback, memo, useEffect, useRef } from 'react';
import { Head, Link, usePage, router, useForm } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import FoTable from '@/Components/DataFo/FoTable';
import { getFOStatusColor, getFOStatusBadgeClass } from '@/utils/statusHelpers';
import { formatDateOnly } from '@/utils/dateHelpers';
import { useDebounce } from '@/Hooks/useDebounce';

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

interface LocalFoRoute {
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
  total_points: number;
  total_routes: number;
  active_points: number;
  active_routes: number;
  inactive_points: number;
  inactive_routes: number;
  maintenance_points: number;
  maintenance_routes: number;
  total_distance: number | null;
  avg_points_per_route: number | null;
  coverage_percentage: number;
  health_score: number;
}

interface PointType {
  type: string;
  count: number;
  label: string;
  percentage: number;
}

interface RouteStatus {
  status: string;
  count: number;
  label: string;
}

interface RecentPoint {
  id: number;
  name: string;
  type: string;
  status: string;
  created_at: string;
}

interface RecentRoute {
  id: number;
  name: string;
  status: string;
  total_distance: number;
  created_at: string;
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
  foPoints: {
    data: FoPoint[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: any[];
  };
  foRoutes: {
    data: LocalFoRoute[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: any[];
  };
  stats: Stats;
  pointTypes: PointType[];
  routeStatus: RouteStatus[];
  recentPoints: RecentPoint[];
  recentRoutes: RecentRoute[];
  currentArea: string;
  availableAreas: string[];
  activeTab: string;
  csrfToken: string;
  [key: string]: any; // Index signature to satisfy constraint
}

// Tab Navigation Component
const TabNavigation = memo(({ activeTab, onTabChange }: { 
  activeTab: string; 
  onTabChange: (tab: string) => void; 
}) => {
  const tabs = [
    { 
      key: 'overview', 
      label: 'Dashboard', 
      icon: 'M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z',
      description: 'Ringkasan & Statistik'
    },
    { 
      key: 'points', 
      label: 'Titik FO', 
      icon: 'M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z',
      description: 'Kelola Titik Fiber Optic'
    },
    { 
      key: 'routes', 
      label: 'Jalur FO', 
      icon: 'M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7',
      description: 'Kelola Jalur Fiber Optic'
    }
  ];

  return (
    <div className="px-6 pt-6">
      <nav className="flex flex-col sm:flex-row gap-2" aria-label="Tabs">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => onTabChange(tab.key)}
            className={`group relative flex flex-col sm:flex-row items-start sm:items-center p-4 rounded-xl transition-all duration-300 text-left ${
              activeTab === tab.key
                ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg transform scale-105'
                : 'bg-white hover:bg-gray-50 text-gray-600 hover:text-gray-900 border border-gray-200 hover:border-gray-300 hover:shadow-md'
            }`}
          >
            <div className={`flex items-center gap-3 ${
              activeTab === tab.key ? 'text-white' : 'text-gray-500 group-hover:text-blue-600'
            }`}>
              <div className={`p-2 rounded-lg transition-all duration-200 ${
                activeTab === tab.key 
                  ? 'bg-white/20' 
                  : 'bg-gray-100 group-hover:bg-blue-100'
              }`}>
                <svg className="w-5 h-5 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tab.icon} />
                </svg>
              </div>
              <div>
                <div className={`font-semibold text-sm ${
                  activeTab === tab.key ? 'text-white' : 'text-gray-900'
                }`}>
                  {tab.label}
                </div>
                <div className={`text-xs mt-0.5 ${
                  activeTab === tab.key ? 'text-blue-100' : 'text-gray-500'
                }`}>
                  {tab.description}
                </div>
              </div>
            </div>
            {activeTab === tab.key && (
              <div className="absolute inset-0 rounded-xl ring-2 ring-blue-300 ring-opacity-50"></div>
            )}
          </button>
        ))}
      </nav>
    </div>
  );
});

TabNavigation.displayName = 'TabNavigation';

// Utility functions for safe data handling
const safeToFixed = (value: number | null | undefined, decimals: number = 1): string => {
  if (value === null || value === undefined || isNaN(value)) {
    return '0.0';
  }
  return Number(value).toFixed(decimals);
};

const safeNumber = (value: number | null | undefined): number => {
  if (value === null || value === undefined || isNaN(value)) {
    return 0;
  }
  return Number(value);
};

// Enhanced Stats Cards Component
const StatsCards = memo(({ stats }: { stats: Stats }) => {
  const getHealthColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-100';
    if (score >= 60) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };


  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Total Infrastructure Card */}
      <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium text-blue-700 mb-2">Total Infrastruktur</h3>
            <div className="space-y-1">
              <div className="text-2xl font-bold text-blue-900">{stats.total_points.toLocaleString()}</div>
              <div className="text-xs text-blue-600">Titik FO</div>
              <div className="text-lg font-semibold text-blue-800 mt-1">{stats.total_routes}</div>
              <div className="text-xs text-blue-600">Jalur FO</div>
            </div>
          </div>
          <div className="p-3 bg-blue-200 rounded-full">
            <svg className="w-8 h-8 text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Network Health Card */}
      <div className={`rounded-xl p-6 shadow-sm border ${getHealthColor(stats.health_score)}`}>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium mb-2">Kesehatan Jaringan</h3>
            <div className="text-2xl font-bold mb-1">{stats.health_score}%</div>
            <div className="text-xs opacity-80">Health Score</div>
            <div className="mt-2 text-sm">
              <div>Aktif: {stats.active_points + stats.active_routes}</div>
              <div>Maintenance: {stats.maintenance_points + stats.maintenance_routes}</div>
            </div>
          </div>
          <div className="p-3 rounded-full" style={{ backgroundColor: 'rgba(255,255,255,0.3)' }}>
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Coverage Card */}
      <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-xl p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium text-green-700 mb-2">Coverage Jaringan</h3>
            <div className="text-2xl font-bold text-green-900">{stats.coverage_percentage}%</div>
            <div className="text-xs text-green-600 mb-2">Cakupan Aktif</div>
            <div className="w-full bg-green-200 rounded-full h-2">
              <div 
                className="bg-green-600 h-2 rounded-full transition-all duration-300" 
                style={{ width: `${stats.coverage_percentage}%` }}
              />
            </div>
          </div>
          <div className="p-3 bg-green-200 rounded-full">
            <svg className="w-8 h-8 text-green-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Distance Card */}
      <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-xl p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium text-purple-700 mb-2">Jarak Total</h3>
            <div className="text-2xl font-bold text-purple-900">{safeToFixed(stats.total_distance, 1)}</div>
            <div className="text-xs text-purple-600 mb-1">Kilometer</div>
            <div className="text-sm text-purple-700">
              Avg: {safeToFixed(stats.avg_points_per_route, 1)} titik/jalur
            </div>
          </div>
          <div className="p-3 bg-purple-200 rounded-full">
            <svg className="w-8 h-8 text-purple-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
});

StatsCards.displayName = 'StatsCards';

// Enhanced Point Types Chart Component
const PointTypesChart = memo(({ pointTypes }: { pointTypes: PointType[] }) => {
  const colors = [
    { bg: 'bg-blue-500', text: 'text-blue-600' },
    { bg: 'bg-green-500', text: 'text-green-600' },
    { bg: 'bg-yellow-500', text: 'text-yellow-600' },
    { bg: 'bg-purple-500', text: 'text-purple-600' }
  ];
  
  return (
    <div className="bg-white shadow-sm border border-gray-200 rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Distribusi Tipe Titik</h3>
        <div className="text-sm text-gray-500">{(pointTypes || []).reduce((sum, t) => sum + (t.count || 0), 0)} Total</div>
      </div>
      <div className="space-y-4">
        {(pointTypes || []).map((type, index) => (
          <div key={type.type || `type-${index}`} className="group">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${colors[index % colors.length]?.bg || 'bg-gray-400'}`} />
                <span className="font-medium text-gray-700">{type.label || 'Unknown Type'}</span>
              </div>
              <div className="text-right">
                <div className="text-sm font-semibold text-gray-900">{type.count || 0}</div>
                <div className="text-xs text-gray-500">{safeToFixed(type.percentage, 1)}%</div>
              </div>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div 
                className={`h-full ${colors[index % colors.length]?.bg || 'bg-gray-400'} transition-all duration-500 ease-out`}
                style={{ width: `${Math.min(Math.max(type.percentage || 0, 0), 100)}%` }}
              />
            </div>
          </div>
        ))}
        {(!pointTypes || pointTypes.length === 0) && (
          <div className="text-center py-8 text-gray-500">
            <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-sm">Belum ada data tipe titik</p>
          </div>
        )}
      </div>
    </div>
  );
});

PointTypesChart.displayName = 'PointTypesChart';

// Route Status Chart Component
const RouteStatusChart = memo(({ routeStatus }: { routeStatus: RouteStatus[] }) => {
  
  const total = (routeStatus || []).reduce((sum, status) => sum + (status.count || 0), 0);
  
  return (
    <div className="bg-white shadow-sm border border-gray-200 rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Status Jalur</h3>
        <div className="text-sm text-gray-500">{total} Jalur</div>
      </div>
      <div className="space-y-4">
        {(routeStatus || []).map((status, index) => {
          const percentage = total > 0 ? ((status.count || 0) / total) * 100 : 0;
          const colorConfig = getFOStatusColor(status.status);
          
          return (
            <div key={status.status || `status-${index}`} className={`p-4 rounded-lg ${colorConfig.light}`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${colorConfig.bg}`} />
                  <span className="font-medium text-gray-700">{status.label || colorConfig.label}</span>
                </div>
                <div className="text-right">
                  <div className={`text-lg font-bold ${colorConfig.text}`}>{status.count || 0}</div>
                  <div className="text-xs text-gray-500">{safeToFixed(percentage, 1)}%</div>
                </div>
              </div>
            </div>
          );
        })}
        {(!routeStatus || routeStatus.length === 0) && (
          <div className="text-center py-8 text-gray-500">
            <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-sm">Belum ada data status jalur</p>
          </div>
        )}
      </div>
    </div>
  );
});

RouteStatusChart.displayName = 'RouteStatusChart';

// Recent Activity Component
const RecentActivity = memo(({ recentPoints, recentRoutes }: { 
  recentPoints: RecentPoint[]; 
  recentRoutes: RecentRoute[]; 
}) => {
  const getTypeIcon = (type: string) => {
    const icons = {
      'pole': 'M8 12h.01M12 12h.01M16 12h.01',
      'junction': 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
      'hub': 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2',
      'endpoint': 'M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z'
    };
    return icons[type as keyof typeof icons] || icons.pole;
  };

  return (
    <div className="bg-white shadow-sm border border-gray-200 rounded-xl p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">Aktivitas Terbaru</h3>
      
      <div className="space-y-6">
        {/* Recent Points */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
            <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            </svg>
            Titik Terbaru
          </h4>
          <div className="space-y-2">
            {(recentPoints || []).slice(0, 3).map((point) => (
              <div key={point.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={getTypeIcon(point.type || 'pole')} />
                  </svg>
                  <div>
                    <div className="text-sm font-medium text-gray-900">{point.name || 'Unnamed Point'}</div>
                    <div className="text-xs text-gray-500">{point.created_at ? formatDateOnly(point.created_at) : 'N/A'}</div>
                  </div>
                </div>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getFOStatusBadgeClass(point.status || 'inactive')}`}>
                  {point.status === 'active' ? 'Aktif' : point.status === 'inactive' ? 'Non-aktif' : 'Maintenance'}
                </span>
              </div>
            ))}
            {(!recentPoints || recentPoints.length === 0) && (
              <div className="text-sm text-gray-500 text-center py-4">Belum ada titik baru</div>
            )}
          </div>
        </div>

        {/* Recent Routes */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
            <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
            Jalur Terbaru
          </h4>
          <div className="space-y-2">
            {(recentRoutes || []).slice(0, 3).map((route) => (
              <div key={route.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                  </svg>
                  <div>
                    <div className="text-sm font-medium text-gray-900">{route.name || 'Unnamed Route'}</div>
                    <div className="text-xs text-gray-500">
                      {safeToFixed(route.total_distance, 1)} km • {route.created_at ? formatDateOnly(route.created_at) : 'N/A'}
                    </div>
                  </div>
                </div>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getFOStatusBadgeClass(route.status || 'inactive')}`}>
                  {route.status === 'active' ? 'Aktif' : route.status === 'inactive' ? 'Non-aktif' : 'Maintenance'}
                </span>
              </div>
            ))}
            {(!recentRoutes || recentRoutes.length === 0) && (
              <div className="text-sm text-gray-500 text-center py-4">Belum ada jalur baru</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

RecentActivity.displayName = 'RecentActivity';

// Generate Routes Button Component
function GenerateRoutesButton({ currentArea }: { currentArea: string }) {
  const { post, processing: isGenerating } = useForm({
    area: currentArea,
  });
  
  const handleGenerateRoutes = useCallback(() => {
    if (isGenerating) return;
    
    post(route('api.fo.routes.generate-all'), {
      preserveState: true,
      preserveScroll: true,
      onSuccess: (page: any) => {
        // Check if response has success data
        const response = page?.props?.flash?.generateResult || page?.props?.generateResult;
        if (response) {
          alert(`Berhasil generate ${response.success} jalur GeoJSON!${response.failed > 0 ? ` ${response.failed} gagal.` : ''}`);
        } else {
          alert('Berhasil generate jalur GeoJSON!');
        }
        router.reload();
      },
      onError: (errors: any) => {
        console.error('Error generating routes:', errors);
        alert('Gagal generate jalur GeoJSON. Silakan coba lagi.');
      },
    });
  }, [isGenerating, currentArea, post]);
  
  return (
    <button
      onClick={handleGenerateRoutes}
      disabled={isGenerating}
      className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white transition-all duration-200 ${
        isGenerating
          ? 'bg-gray-400 cursor-not-allowed'
          : 'bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transform hover:-translate-y-0.5'
      }`}
    >
      {isGenerating ? (
        <>
          <div className="animate-spin -ml-1 mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
          Generating...
        </>
      ) : (
        <>
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          Generate Semua Jalur
        </>
      )}
    </button>
  );
}

export default function FoManagementIndex() {
  const { props } = usePage<PageProps>();
  const { foPoints, foRoutes, stats, pointTypes, routeStatus, recentPoints, recentRoutes, currentArea, availableAreas, activeTab } = props;

  const [selectedTab, setSelectedTab] = useState(activeTab);
  const [filters, setFilters] = useState({
    area: currentArea,
    status: 'all',
    type: 'all',
    search: ''
  });
  
  // Debounced search state
  const [searchValue, setSearchValue] = useState('');
  const debouncedSearchValue = useDebounce(searchValue, 500);

  // Handle tab change with URL update
  const handleTabChange = useCallback((tab: string) => {
    setSelectedTab(tab);
    router.get(route('admin.fo-management.routes.list'), 
      { tab, area: filters.area } as any, 
      { preserveState: true, preserveScroll: true, replace: true }
    );
  }, [filters.area]);

  // Handle filter changes
  const handleFilterChange = useCallback((newFilters: typeof filters) => {
    setFilters(newFilters);
    router.get(route('admin.fo-management.routes.list'), 
      { ...newFilters, tab: selectedTab } as any, 
      { preserveState: true, preserveScroll: true, replace: true }
    );
  }, [selectedTab]);

  // Debounced search effect
  useEffect(() => {
    if (debouncedSearchValue !== filters.search) {
      handleFilterChange({ ...filters, search: debouncedSearchValue });
    }
  }, [debouncedSearchValue, filters, handleFilterChange]);

  // Filter data based on current filters  
  const filteredPoints = foPoints.data.map(point => ({
    ...point,
    properties: {},
  })).filter(point => {
    if (filters.status !== 'all' && point.status !== filters.status) return false;
    if (filters.type !== 'all' && point.type !== filters.type) return false;
    if (filters.search && !point.name.toLowerCase().includes(filters.search.toLowerCase())) return false;
    return true;
  });

  const filteredRoutes = foRoutes.data.map(route => ({
    ...route,
    coordinates: [] as Array<[number, number]>, // Add coordinates for FoTable compatibility
    properties: {},
  })).filter(route => {
    if (filters.status !== 'all' && route.status !== filters.status) return false;
    if (filters.search && !route.name.toLowerCase().includes(filters.search.toLowerCase())) return false;
    return true;
  });

  const renderTabContent = () => {
    switch (selectedTab) {
      case 'overview':
        return (
          <div className="space-y-8">
            {/* Welcome Section */}
            <div className="text-center py-4">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Dashboard Fiber Optic</h2>
              <p className="text-gray-600">Monitoring dan kontrol infrastruktur fiber optic secara real-time</p>
            </div>
            
            <StatsCards stats={stats} />
            
            <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
              <div className="xl:col-span-3 space-y-8">
                {/* Charts Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <PointTypesChart pointTypes={pointTypes} />
                  <RouteStatusChart routeStatus={routeStatus} />
                </div>
                
                {/* Enhanced Quick Actions */}
                <div className="bg-gradient-to-br from-white to-gray-50 shadow-xl border border-gray-100 rounded-2xl p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">Aksi Cepat</h3>
                      <p className="text-gray-600 text-sm">Tambah infrastruktur baru dengan mudah</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Link
                      href={route('admin.fo-management.routes.create')}
                      className="group relative overflow-hidden bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-2xl p-6 hover:from-blue-700 hover:to-blue-800 transition-all duration-300 shadow-lg hover:shadow-2xl transform hover:-translate-y-1"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-blue-500 opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
                      <div className="relative z-10">
                        <div className="flex items-center justify-between mb-3">
                          <div className="p-2 bg-white/20 rounded-lg">
                            <svg className="w-6 h-6 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            </svg>
                          </div>
                          <svg className="w-5 h-5 opacity-60 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                        </div>
                        <h4 className="font-semibold text-lg mb-1">Jalur/Titik FO</h4>
                        <p className="text-blue-100 text-sm">Buat jalur lalu tambah titik</p>
                      </div>
                    </Link>
                    
                    <Link
                      href={route('admin.fo-management.routes.create')}
                      className="group relative overflow-hidden bg-gradient-to-r from-green-600 to-green-700 text-white rounded-2xl p-6 hover:from-green-700 hover:to-green-800 transition-all duration-300 shadow-lg hover:shadow-2xl transform hover:-translate-y-1"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-green-500 opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
                      <div className="relative z-10">
                        <div className="flex items-center justify-between mb-3">
                          <div className="p-2 bg-white/20 rounded-lg">
                            <svg className="w-6 h-6 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                            </svg>
                          </div>
                          <svg className="w-5 h-5 opacity-60 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                        </div>
                        <h4 className="font-semibold text-lg mb-1">Jalur FO</h4>
                        <p className="text-green-100 text-sm">Tambah jalur baru</p>
                      </div>
                    </Link>
                    
                    <Link
                      href={route('admin.fo-management.routes.list', { tab: 'points', area: currentArea })}
                      className="group relative overflow-hidden bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-2xl p-6 hover:from-purple-700 hover:to-purple-800 transition-all duration-300 shadow-lg hover:shadow-2xl transform hover:-translate-y-1"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-purple-500 opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
                      <div className="relative z-10">
                        <div className="flex items-center justify-between mb-3">
                          <div className="p-2 bg-white/20 rounded-lg">
                            <svg className="w-6 h-6 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                          </div>
                          <svg className="w-5 h-5 opacity-60 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                        <h4 className="font-semibold text-lg mb-1">Kelola Titik</h4>
                        <p className="text-purple-100 text-sm">Lihat semua titik</p>
                      </div>
                    </Link>
                    
                    <Link
                      href={route('admin.fo-management.routes.list', { tab: 'routes', area: currentArea })}
                      className="group relative overflow-hidden bg-gradient-to-r from-orange-600 to-orange-700 text-white rounded-2xl p-6 hover:from-orange-700 hover:to-orange-800 transition-all duration-300 shadow-lg hover:shadow-2xl transform hover:-translate-y-1"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-orange-400 to-orange-500 opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
                      <div className="relative z-10">
                        <div className="flex items-center justify-between mb-3">
                          <div className="p-2 bg-white/20 rounded-lg">
                            <svg className="w-6 h-6 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                            </svg>
                          </div>
                          <svg className="w-5 h-5 opacity-60 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                        <h4 className="font-semibold text-lg mb-1">Kelola Jalur</h4>
                        <p className="text-orange-100 text-sm">Lihat semua jalur</p>
                      </div>
                    </Link>
                  </div>
                  
                  {/* Route Generation Action */}
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4">Optimisasi Jalur</h4>
                    <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <div className="p-2 bg-emerald-100 rounded-lg">
                            <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                            </svg>
                          </div>
                          <div>
                            <h5 className="font-semibold text-gray-900 mb-1">Generate Jalur GeoJSON</h5>
                            <p className="text-sm text-gray-600 mb-3">
                              Buat jalur yang mengikuti jalan nyata menggunakan routing service. Jalur akan lebih akurat dan realistis.
                            </p>
                            <div className="flex items-center gap-2 text-xs text-emerald-700">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                              <span>Otomatis mengikuti jalan</span>
                            </div>
                          </div>
                        </div>
                        <GenerateRoutesButton currentArea={currentArea} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="xl:col-span-1">
                <RecentActivity recentPoints={recentPoints} recentRoutes={recentRoutes} />
              </div>
            </div>
          </div>
        );
      
      case 'points':
        return (
          <div className="space-y-8">
            {/* Points Header */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-100">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-600 rounded-xl">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">Manajemen Titik FO</h3>
                    <p className="text-gray-600 mt-1">Kelola dan monitor semua titik fiber optic</p>
                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        {stats.active_points} Aktif
                      </span>
                      <span className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                        {stats.inactive_points} Non-aktif
                      </span>
                      <span className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                        {stats.maintenance_points} Maintenance
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Link
                    href={route('admin.fo-management.routes.create')}
                    className="group inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                  >
                    <svg className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Buat Jalur Baru
                  </Link>
                  <a
                    href={route('admin.fo-management.points.export', { ...filters, tab: 'points' })}
                    className="group inline-flex items-center justify-center px-6 py-3 bg-green-600 text-white font-semibold rounded-xl hover:bg-green-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                  >
                    <svg className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Export Data
                  </a>
                </div>
              </div>
            </div>
            
            {/* Points Table */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-r from-gray-50 to-white px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">Daftar Titik FO</h4>
                      <p className="text-sm text-gray-600">Total {stats.total_points} titik terdaftar</p>
                    </div>
                  </div>
                  <div className="text-sm text-gray-500">
                    Menampilkan {filteredPoints.length} dari {stats.total_points} titik
                  </div>
                </div>
              </div>
              <div className="p-6">
                <FoTable
                  filteredPoints={filteredPoints}
                  filteredRoutes={[]}
                  viewMode="table"
                  activeTab="points"
                />
              </div>
            </div>
          </div>
        );
      
      case 'routes':
        return (
          <div className="space-y-8">
            {/* Routes Header */}
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-100">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-green-600 rounded-xl">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">Manajemen Jalur FO</h3>
                    <p className="text-gray-600 mt-1">Kelola dan monitor semua jalur fiber optic</p>
                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        {stats.active_routes} Aktif
                      </span>
                      <span className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                        {stats.inactive_routes} Non-aktif
                      </span>
                      <span className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                        {stats.maintenance_routes} Maintenance
                      </span>
                      <span className="flex items-center gap-1">
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                        </svg>
                        {safeToFixed(stats.total_distance)} km Total
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Link
                    href={route('admin.fo-management.routes.create')}
                    className="group inline-flex items-center justify-center px-6 py-3 bg-green-600 text-white font-semibold rounded-xl hover:bg-green-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 w-full sm:w-auto text-center"
                  >
                    <svg className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    <span className="text-center">Tambah Jalur Baru</span>
                  </Link>
                  <a
                    href={route('admin.fo-management.routes.export', { ...filters, tab: 'routes' })}
                    className="group inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                  >
                    <svg className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    Laporan Jalur
                  </a>
                </div>
              </div>
            </div>
            
            {/* Routes Table */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-r from-gray-50 to-white px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">Daftar Jalur FO</h4>
                      <p className="text-sm text-gray-600">Total {stats.total_routes} jalur terdaftar</p>
                    </div>
                  </div>
                  <div className="text-sm text-gray-500">
                    Menampilkan {filteredRoutes.length} dari {stats.total_routes} jalur
                  </div>
                </div>
              </div>
              <div className="p-6">
                <FoTable
                  filteredPoints={[]}
                  filteredRoutes={filteredRoutes}
                  viewMode="table"
                  activeTab="routes"
                />
              </div>
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <AdminLayout title="Manajemen Fiber Optic">
      <Head title="Manajemen Fiber Optic" />
      
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-2xl p-8 text-white shadow-xl">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="space-y-2">
              <h1 className="text-3xl lg:text-4xl font-bold tracking-tight">
                Manajemen Fiber Optic
              </h1>
              <p className="text-blue-100 text-lg">
                Kelola titik dan jalur fiber optic untuk area <span className="font-semibold text-white">{currentArea}</span>
              </p>
              <div className="flex items-center gap-2 text-blue-100">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                </svg>
                <span className="text-sm">Dashboard Monitoring & Kontrol</span>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href={route('admin.fo-management.routes.create')}
                className="group inline-flex items-center justify-center px-6 py-3 bg-white text-blue-600 font-semibold rounded-xl hover:bg-blue-50 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 w-full sm:w-auto text-center"
              >
                <svg className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span className="text-center">Buat Jalur FO</span>
              </Link>
              <Link
                href={route('admin.fo-management.routes.create')}
                className="group inline-flex items-center justify-center px-6 py-3 bg-green-500 text-white font-semibold rounded-xl hover:bg-green-600 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 w-full sm:w-auto text-center"
              >
                <svg className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span className="text-center">Tambah Jalur FO</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Enhanced Filters */}
        <div className="bg-white shadow-lg rounded-2xl border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Filter & Pencarian</h3>
                <p className="text-sm text-gray-600">Gunakan filter untuk mempersempit hasil pencarian</p>
              </div>
            </div>
          </div>
          
          <form onSubmit={(e) => e.preventDefault()}>
            <div className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="space-y-2">
                <label htmlFor="search" className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  Pencarian
                </label>
                <div className="relative">
                  <input
                    type="text"
                    id="search"
                    value={searchValue}
                    onChange={(e) => setSearchValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleFilterChange({ ...filters, search: searchValue });
                      }
                    }}
                    className="block w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 text-sm"
                    placeholder="Cari nama titik atau jalur..."
                  />
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <label htmlFor="status-filter" className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Status
                </label>
                <select
                  id="status-filter"
                  value={filters.status}
                  onChange={(e) => handleFilterChange({ ...filters, status: e.target.value })}
                  className="block w-full py-3 px-4 border border-gray-300 rounded-xl shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 text-sm bg-white"
                >
                  <option value="all">🔄 Semua Status</option>
                  <option value="active">✅ Aktif</option>
                  <option value="inactive">❌ Non-aktif</option>
                  <option value="maintenance">🔧 Maintenance</option>
                </select>
              </div>

              <div className="space-y-2">
                <label htmlFor="type-filter" className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                  Tipe
                </label>
                <select
                  id="type-filter"
                  value={filters.type}
                  onChange={(e) => handleFilterChange({ ...filters, type: e.target.value })}
                  className="block w-full py-3 px-4 border border-gray-300 rounded-xl shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 text-sm bg-white"
                >
                  <option value="all">📋 Semua Tipe</option>
                  <option value="pole">🏗️ Pole</option>
                  <option value="junction">🔗 Junction</option>
                  <option value="hub">🌐 Hub</option>
                  <option value="endpoint">📍 Endpoint</option>
                </select>
              </div>

              <div className="space-y-2">
                <label htmlFor="area-filter" className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  </svg>
                  Area
                </label>
                <select
                  id="area-filter"
                  value={filters.area}
                  onChange={(e) => handleFilterChange({ ...filters, area: e.target.value })}
                  className="block w-full py-3 px-4 border border-gray-300 rounded-xl shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 text-sm bg-white"
                >
                  {availableAreas.map((area: string) => (
                    <option key={area} value={area}>
                      📍 {area.charAt(0).toUpperCase() + area.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            </div>
          </form>
        </div>

        {/* Enhanced Tab Navigation */}
        <div className="bg-white shadow-xl rounded-2xl border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-gray-50 to-white border-b border-gray-200">
            <TabNavigation activeTab={selectedTab} onTabChange={handleTabChange} />
          </div>
          
          {/* Tab Content */}
          <div className="p-8">
            {renderTabContent()}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}