import React, { useState, useCallback, memo } from 'react';
import { Head, Link, usePage, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import FoTable from '@/Components/DataFo/FoTable';

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
  [key: string]: any; // Index signature to satisfy constraint
}

// Tab Navigation Component
const TabNavigation = memo(({ activeTab, onTabChange }: { 
  activeTab: string; 
  onTabChange: (tab: string) => void; 
}) => {
  const tabs = [
    { key: 'overview', label: 'Overview', icon: 'M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z' },
    { key: 'points', label: 'Titik FO', icon: 'M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z' },
    { key: 'routes', label: 'Jalur FO', icon: 'M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7' }
  ];

  return (
    <div className="border-b border-gray-200">
      <nav className="-mb-px flex space-x-8" aria-label="Tabs">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => onTabChange(tab.key)}
            className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === tab.key
                ? 'border-red-600 text-red-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tab.icon} />
            </svg>
            {tab.label}
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
  const statusColors = {
    'active': { bg: 'bg-green-500', text: 'text-green-600', light: 'bg-green-50' },
    'inactive': { bg: 'bg-red-500', text: 'text-red-600', light: 'bg-red-50' },
    'maintenance': { bg: 'bg-yellow-500', text: 'text-yellow-600', light: 'bg-yellow-50' }
  };
  
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
          const colorConfig = statusColors[status.status as keyof typeof statusColors] || statusColors.active;
          
          return (
            <div key={status.status || `status-${index}`} className={`p-4 rounded-lg ${colorConfig?.light || 'bg-gray-50'}`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${colorConfig?.bg || 'bg-gray-400'}`} />
                  <span className="font-medium text-gray-700">{status.label || 'Unknown Status'}</span>
                </div>
                <div className="text-right">
                  <div className={`text-lg font-bold ${colorConfig?.text || 'text-gray-600'}`}>{status.count || 0}</div>
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
  const getStatusBadge = (status: string) => {
    const configs = {
      'active': 'bg-green-100 text-green-800',
      'inactive': 'bg-red-100 text-red-800',
      'maintenance': 'bg-yellow-100 text-yellow-800'
    };
    return configs[status as keyof typeof configs] || 'bg-gray-100 text-gray-800';
  };

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
                    <div className="text-xs text-gray-500">{point.created_at ? new Date(point.created_at).toLocaleDateString('id-ID') : 'N/A'}</div>
                  </div>
                </div>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(point.status || 'inactive')}`}>
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
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 713 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
            Jalur Terbaru
          </h4>
          <div className="space-y-2">
            {(recentRoutes || []).slice(0, 3).map((route) => (
              <div key={route.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 713 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                  </svg>
                  <div>
                    <div className="text-sm font-medium text-gray-900">{route.name || 'Unnamed Route'}</div>
                    <div className="text-xs text-gray-500">
                      {safeToFixed(route.total_distance, 1)} km • {route.created_at ? new Date(route.created_at).toLocaleDateString('id-ID') : 'N/A'}
                    </div>
                  </div>
                </div>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(route.status || 'inactive')}`}>
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

  // Handle tab change with URL update
  const handleTabChange = useCallback((tab: string) => {
    setSelectedTab(tab);
    router.get(route('admin.fo-management.index'), 
      { tab, area: filters.area } as any, 
      { preserveState: true, replace: true }
    );
  }, [filters.area]);

  // Handle filter changes
  const handleFilterChange = useCallback((newFilters: typeof filters) => {
    setFilters(newFilters);
    router.get(route('admin.fo-management.index'), 
      { ...newFilters, tab: selectedTab } as any, 
      { preserveState: true, replace: true }
    );
  }, [selectedTab]);

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
            <StatsCards stats={stats} />
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <PointTypesChart pointTypes={pointTypes} />
                  <RouteStatusChart routeStatus={routeStatus} />
                </div>
                
                {/* Quick Actions */}
                <div className="bg-white shadow-sm border border-gray-200 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Aksi Cepat</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Link
                      href={route('admin.fo-management.points.create')}
                      className="flex items-center justify-center px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-sm"
                    >
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Tambah Titik FO
                    </Link>
                    <Link
                      href={route('admin.fo-management.routes.create')}
                      className="flex items-center justify-center px-4 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 transition-all duration-200 shadow-sm"
                    >
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Tambah Jalur FO
                    </Link>
                  </div>
                </div>
              </div>
              
              <div className="lg:col-span-1">
                <RecentActivity recentPoints={recentPoints} recentRoutes={recentRoutes} />
              </div>
            </div>
          </div>
        );
      
      case 'points':
        return (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <h3 className="text-lg font-semibold text-gray-900">Manajemen Titik FO</h3>
              <Link
                href={route('admin.fo-management.points.create')}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Tambah Titik
              </Link>
            </div>
            <FoTable
              filteredPoints={filteredPoints}
              filteredRoutes={[]}
              viewMode="table"
              activeTab="points"
            />
          </div>
        );
      
      case 'routes':
        return (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <h3 className="text-lg font-semibold text-gray-900">Manajemen Jalur FO</h3>
              <Link
                href={route('admin.fo-management.routes.create')}
                className="inline-flex items-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Tambah Jalur
              </Link>
            </div>
            <FoTable
              filteredPoints={[]}
              filteredRoutes={filteredRoutes}
              viewMode="table"
              activeTab="routes"
            />
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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Manajemen Fiber Optic</h1>
            <p className="text-sm text-gray-600 mt-1">
              Kelola titik dan jalur fiber optic untuk area {currentArea}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white shadow rounded-lg p-4">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div>
              <label htmlFor="search" className="block text-sm font-medium text-gray-700">
                Pencarian
              </label>
              <input
                type="text"
                id="search"
                value={filters.search}
                onChange={(e) => handleFilterChange({ ...filters, search: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm"
                placeholder="Cari nama..."
              />
            </div>
            
            <div>
              <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700">
                Status
              </label>
              <select
                id="status-filter"
                value={filters.status}
                onChange={(e) => handleFilterChange({ ...filters, status: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm"
              >
                <option value="all">Semua Status</option>
                <option value="active">Aktif</option>
                <option value="inactive">Non-aktif</option>
                <option value="maintenance">Maintenance</option>
              </select>
            </div>

            <div>
              <label htmlFor="type-filter" className="block text-sm font-medium text-gray-700">
                Tipe
              </label>
              <select
                id="type-filter"
                value={filters.type}
                onChange={(e) => handleFilterChange({ ...filters, type: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm"
              >
                <option value="all">Semua Tipe</option>
                <option value="pole">Pole</option>
                <option value="junction">Junction</option>
                <option value="hub">Hub</option>
                <option value="endpoint">Endpoint</option>
              </select>
            </div>

            <div>
              <label htmlFor="area-filter" className="block text-sm font-medium text-gray-700">
                Area
              </label>
              <select
                id="area-filter"
                value={filters.area}
                onChange={(e) => handleFilterChange({ ...filters, area: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm"
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

        {/* Tab Navigation */}
        <div className="bg-white shadow rounded-lg">
          <TabNavigation activeTab={selectedTab} onTabChange={handleTabChange} />
          
          {/* Tab Content */}
          <div className="p-6">
            {renderTabContent()}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
