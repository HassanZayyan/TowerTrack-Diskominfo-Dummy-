import React, { useState, useCallback, memo, useEffect } from 'react';
import { Head, Link, usePage, router, useForm } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import PageHeader from '@/Components/PageHeader';
import FoTable from '@/Components/DataFo/FoTable';
import { getFOStatusColor } from '@/utils/statusHelpers';
import { formatDateOnly } from '@/utils/dateHelpers';
import { useDebounce } from '@/Hooks/useDebounce';
import { Button } from '@/Components/ui/button';
import { Badge } from '@/Components/ui/badge';
import { Card } from '@/Components/ui/card';
import { cn } from '@/lib/utils';

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

/**
 * Shared control recipe. h-11 = 44px touch target, hairline input border,
 * the single 3px token ring — never `focus:ring-2`, never a bare outline-none.
 */
const CONTROL_CLASSES =
  'block h-11 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground placeholder:text-placeholder transition-colors duration-140 ease-state focus-visible:outline-none focus-visible:ring focus-visible:ring-offset-2';

/** One label recipe for the whole page — there used to be four. */
const LABEL_CLASSES = 'mb-1 block text-xs font-medium text-muted-foreground';

/** Section head: 16px down to its content, semibold, tracking-tight from text-xl up. */
const SectionHead = ({
  title,
  description,
  actions,
  children,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  children?: React.ReactNode;
}) => (
  <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
    <div className="min-w-0">
      <h2 className="text-xl font-semibold tracking-tight text-foreground">{title}</h2>
      {description && <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>}
      {children}
    </div>
    {actions && <div className="flex flex-wrap items-center gap-2 sm:flex-shrink-0">{actions}</div>}
  </div>
);

/** Card head rule: 40px band on the inset ground with a strong bottom rule. */
const TableHead = ({ title, meta }: { title: string; meta: string }) => (
  <div className="flex min-h-[40px] flex-wrap items-center justify-between gap-x-3 gap-y-1 border-b border-border-strong bg-well px-3 py-2">
    <h3 className="text-sm font-semibold text-foreground">{title}</h3>
    <span className="text-xs tabular-nums text-muted-foreground">{meta}</span>
  </div>
);

/** Consistent empty state across every FO screen: well ground, 24px padding. */
const EmptyState = ({ icon, title, description }: { icon: string; title: string; description?: string }) => (
  <div className="flex flex-col items-center justify-center gap-2 rounded-md border border-border bg-well p-6 text-center">
    <svg className="h-8 w-8 text-placeholder" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={icon} />
    </svg>
    <p className="text-sm font-medium text-foreground">{title}</p>
    {description && <p className="max-w-sm text-sm text-muted-foreground">{description}</p>}
  </div>
);

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

  // Was three 88px card-buttons in a stacked grid — a second copy of the page's
  // own navigation. An underline tab strip is 44px total and reads as one control.
  return (
    <div className="border-b border-border">
      <nav className="-mb-px flex gap-1 overflow-x-auto" aria-label="Tabs">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              role="tab"
              aria-selected={isActive}
              title={tab.description}
              onClick={() => onTabChange(tab.key)}
              className={cn(
                'inline-flex h-11 shrink-0 items-center gap-2 whitespace-nowrap border-b-2 px-3 text-sm font-medium',
                'transition-colors duration-140 ease-state focus-visible:outline-none focus-visible:ring focus-visible:ring-offset-2',
                isActive
                  ? 'border-primary text-primary-strong'
                  : 'border-transparent text-muted-foreground hover:border-border-strong hover:text-foreground',
              )}
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tab.icon} />
              </svg>
              {tab.label}
              <span className="hidden text-xs font-normal text-muted-foreground lg:inline">
                {tab.description}
              </span>
            </button>
          );
        })}
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

/** A stat tile: figure first, label above it, one caption line. No icon discs. */
const StatTile = ({
  label,
  value,
  unit,
  caption,
  toneClass,
  index,
  children,
}: {
  label: string;
  value: string;
  unit?: string;
  caption?: string;
  toneClass?: string;
  index: number;
  children?: React.ReactNode;
}) => (
  <Card
    padding="dense"
    className="tt-enter-up"
    style={{ '--tt-delay': `${index * 40}ms` } as React.CSSProperties}
  >
    <p className="text-sm text-muted-foreground">{label}</p>
    <p className={cn('mt-0.5 text-2xl font-semibold tabular-nums tracking-tight text-foreground', toneClass)}>
      {value}
      {unit && <span className="ml-1 text-sm font-medium text-muted-foreground">{unit}</span>}
    </p>
    {caption && <p className="mt-1 truncate text-xs text-muted-foreground" title={caption}>{caption}</p>}
    {children}
  </Card>
);

// Enhanced Stats Cards Component
const StatsCards = memo(({ stats }: { stats: Stats }) => {
  // A measurement, not brand chrome: a poor health score genuinely means
  // "something is wrong", so it keeps red via the destructive token. The tone
  // now lives on the figure only — a fully tinted tile made every KPI shout.
  const healthTone = (score: number) => {
    if (score >= 80) return 'text-success-strong';
    if (score >= 60) return 'text-warning-strong';
    return 'text-destructive-strong';
  };

  const coverage = Math.min(Math.max(safeNumber(stats.coverage_percentage), 0), 100);

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
      <StatTile
        index={0}
        label="Titik FO"
        value={stats.total_points.toLocaleString()}
        caption={`${stats.active_points} Aktif · ${stats.maintenance_points} Maintenance`}
      />
      <StatTile
        index={1}
        label="Jalur FO"
        value={stats.total_routes.toLocaleString()}
        caption={`${stats.active_routes} Aktif · ${stats.maintenance_routes} Maintenance`}
      />
      <StatTile
        index={2}
        label="Jarak Total"
        value={safeToFixed(stats.total_distance, 1)}
        unit="km"
        caption={`Avg: ${safeToFixed(stats.avg_points_per_route, 1)} titik/jalur`}
      />
      <StatTile index={3} label="Coverage Jaringan" value={`${coverage}`} unit="%" caption="Cakupan Aktif">
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-well">
          <div
            className="h-full origin-left animate-bar-grow rounded-full bg-success"
            style={{ width: `${coverage}%` }}
          />
        </div>
      </StatTile>
      <StatTile
        index={4}
        label="Kesehatan Jaringan"
        value={`${safeNumber(stats.health_score)}`}
        unit="%"
        caption="Health Score"
        toneClass={healthTone(stats.health_score)}
      />
    </div>
  );
});

StatsCards.displayName = 'StatsCards';

// Enhanced Point Types Chart Component
const PointTypesChart = memo(({ pointTypes }: { pointTypes: PointType[] }) => {
  const total = (pointTypes || []).reduce((sum, t) => sum + (t.count || 0), 0);

  // Type is a CATEGORY, not a status: it gets no hue. The old data-1..4 ramp
  // implied four different meanings where there is only "how many of each".
  return (
    <Card padding="none">
      <TableHead title="Distribusi Tipe Titik" meta={`${total} Total`} />
      <div className="p-3">
        {(pointTypes || []).length > 0 ? (
          <ul className="divide-y divide-border/70">
            {(pointTypes || []).map((type, index) => {
              const pct = Math.min(Math.max(type.percentage || 0, 0), 100);
              return (
                <li key={type.type || `type-${index}`} className="flex items-center gap-3 py-2">
                  <span
                    className="w-24 shrink-0 truncate text-sm text-foreground sm:w-28"
                    title={type.label || 'Unknown Type'}
                  >
                    {type.label || 'Unknown Type'}
                  </span>
                  <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-well">
                    <span
                      className="block h-full origin-left animate-bar-grow rounded-full bg-neutral-strong"
                      style={{ width: `${pct}%`, animationDelay: `${index * 40}ms` }}
                    />
                  </span>
                  <span className="w-10 shrink-0 text-right text-sm font-medium tabular-nums text-foreground">
                    {type.count || 0}
                  </span>
                  <span className="w-12 shrink-0 text-right text-xs tabular-nums text-muted-foreground">
                    {safeToFixed(type.percentage, 1)}%
                  </span>
                </li>
              );
            })}
          </ul>
        ) : (
          <EmptyState
            icon="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            title="Belum ada data tipe titik"
          />
        )}
      </div>
    </Card>
  );
});

PointTypesChart.displayName = 'PointTypesChart';

// Route Status Chart Component
const RouteStatusChart = memo(({ routeStatus }: { routeStatus: RouteStatus[] }) => {
  const total = (routeStatus || []).reduce((sum, status) => sum + (status.count || 0), 0);

  return (
    <Card padding="none">
      <TableHead title="Status Jalur" meta={`${total} Jalur`} />
      <div className="p-3">
        {(routeStatus || []).length > 0 ? (
          <ul className="divide-y divide-border/70">
            {(routeStatus || []).map((status, index) => {
              const percentage = total > 0 ? ((status.count || 0) / total) * 100 : 0;
              const colorConfig = getFOStatusColor(status.status);

              // Status DOES carry a hue — this is the one place colour is allowed.
              return (
                <li key={status.status || `status-${index}`} className="flex items-center gap-3 py-2">
                  <span className={cn('h-2 w-2 shrink-0 rounded-full', colorConfig.dot)} />
                  <span className="min-w-0 flex-1 truncate text-sm text-foreground">
                    {status.label || colorConfig.label}
                  </span>
                  <span className="text-sm font-semibold tabular-nums text-foreground">{status.count || 0}</span>
                  <span className="w-12 shrink-0 text-right text-xs tabular-nums text-muted-foreground">
                    {safeToFixed(percentage, 1)}%
                  </span>
                </li>
              );
            })}
          </ul>
        ) : (
          <EmptyState
            icon="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            title="Belum ada data status jalur"
          />
        )}
      </div>
    </Card>
  );
});

RouteStatusChart.displayName = 'RouteStatusChart';

/** FO status → badge tone. inactive stays destructive: it means "link is down". */
type StatusTone = 'success' | 'warning' | 'destructive' | 'neutral';
const FO_STATUS_TONE: Record<string, StatusTone> = {
  active: 'success',
  inactive: 'destructive',
  maintenance: 'warning',
};
const statusTone = (status: string | undefined | null): StatusTone =>
  FO_STATUS_TONE[status ?? ''] ?? 'neutral';
const statusLabel = (status: string | undefined | null): string =>
  status === 'active' ? 'Aktif' : status === 'inactive' ? 'Non-aktif' : 'Maintenance';

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
    <Card padding="none">
      <TableHead title="Aktivitas Terbaru" meta={`${(recentPoints || []).length + (recentRoutes || []).length} entri`} />

      <div className="px-3 py-2">
        <h4 className="flex h-7 items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          </svg>
          Titik Terbaru
        </h4>
        <ul className="divide-y divide-border/70">
          {(recentPoints || []).slice(0, 3).map((point) => (
            <li key={point.id} className="flex min-h-[44px] items-center justify-between gap-2 py-1.5">
              <div className="flex min-w-0 items-center gap-2">
                <svg className="h-4 w-4 shrink-0 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={getTypeIcon(point.type || 'pole')} />
                </svg>
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium text-foreground" title={point.name || 'Unnamed Point'}>
                    {point.name || 'Unnamed Point'}
                  </div>
                  <div className="text-xs tabular-nums text-muted-foreground">
                    {point.created_at ? formatDateOnly(point.created_at) : 'N/A'}
                  </div>
                </div>
              </div>
              <Badge variant={statusTone(point.status)}>{statusLabel(point.status)}</Badge>
            </li>
          ))}
          {(!recentPoints || recentPoints.length === 0) && (
            <li className="py-3 text-sm text-muted-foreground">Belum ada titik baru</li>
          )}
        </ul>
      </div>

      <div className="border-t border-border/70 px-3 py-2">
        <h4 className="flex h-7 items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
          </svg>
          Jalur Terbaru
        </h4>
        <ul className="divide-y divide-border/70">
          {(recentRoutes || []).slice(0, 3).map((foRoute) => (
            <li key={foRoute.id} className="flex min-h-[44px] items-center justify-between gap-2 py-1.5">
              <div className="flex min-w-0 items-center gap-2">
                <svg className="h-4 w-4 shrink-0 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium text-foreground" title={foRoute.name || 'Unnamed Route'}>
                    {foRoute.name || 'Unnamed Route'}
                  </div>
                  <div className="text-xs tabular-nums text-muted-foreground">
                    {safeToFixed(foRoute.total_distance, 1)} km • {foRoute.created_at ? formatDateOnly(foRoute.created_at) : 'N/A'}
                  </div>
                </div>
              </div>
              <Badge variant={statusTone(foRoute.status)}>{statusLabel(foRoute.status)}</Badge>
            </li>
          ))}
          {(!recentRoutes || recentRoutes.length === 0) && (
            <li className="py-3 text-sm text-muted-foreground">Belum ada jalur baru</li>
          )}
        </ul>
      </div>
    </Card>
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
    <Button
      type="button"
      variant="success"
      onClick={handleGenerateRoutes}
      disabled={isGenerating}
      className="h-11 shrink-0"
    >
      {isGenerating ? (
        <>
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          Generating...
        </>
      ) : (
        <>
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          Generate Semua Jalur
        </>
      )}
    </Button>
  );
}

/** Status tally line — three real counts, dots carry the meaning. */
const StatusTally = ({ active, inactive, maintenance, extra }: {
  active: number;
  inactive: number;
  maintenance: number;
  extra?: React.ReactNode;
}) => (
  <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
    <span className="flex items-center gap-1.5">
      <span className="h-2 w-2 rounded-full bg-success" />
      <span className="tabular-nums">{active}</span> Aktif
    </span>
    <span className="flex items-center gap-1.5">
      {/* Non-aktif is a fault state, so the dot stays red. */}
      <span className="h-2 w-2 rounded-full bg-destructive" />
      <span className="tabular-nums">{inactive}</span> Non-aktif
    </span>
    <span className="flex items-center gap-1.5">
      <span className="h-2 w-2 rounded-full bg-warning" />
      <span className="tabular-nums">{maintenance}</span> Maintenance
    </span>
    {extra}
  </div>
);

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
        // The centred "Dashboard Fiber Optic" welcome block was removed: it
        // restated the page <h1> two rows above it.
        return (
          <div className="space-y-5">
            <StatsCards stats={stats} />

            <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
              <div className="space-y-5 xl:col-span-2">
                <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                  <PointTypesChart pointTypes={pointTypes} />
                  <RouteStatusChart routeStatus={routeStatus} />
                </div>

                {/*
                  The "Aksi Cepat" grid is gone. Two of its four cards pointed at
                  routes.create — already the page header's action — and the other
                  two duplicated the tab strip directly above them. Only the route
                  generator was a real, otherwise-unreachable action, so it stays.
                */}
                <Card padding="none">
                  <TableHead title="Optimisasi Jalur" meta="Routing service" />
                  <div className="flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <h4 className="text-sm font-semibold text-foreground">Generate Jalur GeoJSON</h4>
                      <p className="mt-0.5 text-sm text-muted-foreground">
                        Buat jalur yang mengikuti jalan nyata menggunakan routing service. Jalur akan lebih akurat dan realistis.
                      </p>
                      <p className="mt-1 flex items-center gap-1.5 text-xs text-success-strong">
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Otomatis mengikuti jalan
                      </p>
                    </div>
                    <GenerateRoutesButton currentArea={currentArea} />
                  </div>
                </Card>
              </div>

              <div className="xl:col-span-1">
                <RecentActivity recentPoints={recentPoints} recentRoutes={recentRoutes} />
              </div>
            </div>
          </div>
        );

      case 'points':
        return (
          <div>
            <SectionHead
              title="Manajemen Titik FO"
              description="Kelola dan monitor semua titik fiber optic"
              actions={
                <>
                  <Button asChild className="h-11">
                    <Link href={route('admin.fo-management.routes.create')}>
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Buat Jalur Baru
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="h-11">
                    <a href={route('admin.fo-management.points.export', { ...filters, tab: 'points' })}>
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Export Data
                    </a>
                  </Button>
                </>
              }
            >
              <StatusTally
                active={stats.active_points}
                inactive={stats.inactive_points}
                maintenance={stats.maintenance_points}
              />
            </SectionHead>

            <Card padding="none">
              {/* "Total N titik terdaftar" was dropped — the line below contains it. */}
              <TableHead
                title="Daftar Titik FO"
                meta={`Menampilkan ${filteredPoints.length} dari ${stats.total_points} titik`}
              />
              <div className="p-3">
                <FoTable
                  filteredPoints={filteredPoints}
                  filteredRoutes={[]}
                  viewMode="table"
                  activeTab="points"
                />
              </div>
            </Card>
          </div>
        );

      case 'routes':
        return (
          <div>
            <SectionHead
              title="Manajemen Jalur FO"
              description="Kelola dan monitor semua jalur fiber optic"
              actions={
                <>
                  <Button asChild className="h-11">
                    <Link href={route('admin.fo-management.routes.create')}>
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Tambah Jalur Baru
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="h-11">
                    <a href={route('admin.fo-management.routes.export', { ...filters, tab: 'routes' })}>
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                      Laporan Jalur
                    </a>
                  </Button>
                </>
              }
            >
              <StatusTally
                active={stats.active_routes}
                inactive={stats.inactive_routes}
                maintenance={stats.maintenance_routes}
                extra={
                  <span className="flex items-center gap-1.5">
                    <svg className="h-4 w-4 text-placeholder" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                    <span className="tabular-nums">{safeToFixed(stats.total_distance)}</span> km Total
                  </span>
                }
              />
            </SectionHead>

            <Card padding="none">
              <TableHead
                title="Daftar Jalur FO"
                meta={`Menampilkan ${filteredRoutes.length} dari ${stats.total_routes} jalur`}
              />
              <div className="p-3">
                <FoTable
                  filteredPoints={[]}
                  filteredRoutes={filteredRoutes}
                  viewMode="table"
                  activeTab="routes"
                />
              </div>
            </Card>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <AdminLayout title="Manajemen Fiber Optic">
      <Head title="Manajemen Fiber Optic" />

      <div className="space-y-4 sm:space-y-5">
        {/*
          The maroon page band is gone — AdminLayout already renders a maroon top
          bar, and two brand bands stacked read as a broken layout. The duplicate
          "Buat Jalur FO" / "Tambah Jalur FO" pair (same route, two variants) is
          now a single action.
        */}
        <PageHeader
          title="Manajemen Fiber Optic"
          description={`Kelola titik dan jalur fiber optic untuk area ${currentArea} — Dashboard Monitoring & Kontrol`}
          showLogo={false}
          className="mb-0 pb-4"
          actions={
            <Button asChild className="h-11">
              <Link href={route('admin.fo-management.routes.create')}>
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Tambah Jalur FO
              </Link>
            </Button>
          }
        />

        <TabNavigation activeTab={selectedTab} onTabChange={handleTabChange} />

        {/* Filter rail: one inset row, four controls, no icon tiles, no card-in-card. */}
        <Card variant="well" padding="dense">
          <form onSubmit={(e) => e.preventDefault()}>
            <div className="mb-2 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
              <h3 className="text-sm font-semibold text-foreground">Filter &amp; Pencarian</h3>
              <p className="text-xs text-muted-foreground">Gunakan filter untuk mempersempit hasil pencarian</p>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <label htmlFor="search" className={LABEL_CLASSES}>Pencarian</label>
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
                    className={cn(CONTROL_CLASSES, 'pl-9')}
                    placeholder="Cari nama titik atau jalur..."
                  />
                  <svg
                    className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-placeholder"
                    fill="none" stroke="currentColor" viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>

              <div>
                <label htmlFor="status-filter" className={LABEL_CLASSES}>Status</label>
                <select
                  id="status-filter"
                  value={filters.status}
                  onChange={(e) => handleFilterChange({ ...filters, status: e.target.value })}
                  className={CONTROL_CLASSES}
                >
                  <option value="all">Semua Status</option>
                  <option value="active">Aktif</option>
                  <option value="inactive">Non-aktif</option>
                  <option value="maintenance">Maintenance</option>
                </select>
              </div>

              <div>
                <label htmlFor="type-filter" className={LABEL_CLASSES}>Tipe</label>
                <select
                  id="type-filter"
                  value={filters.type}
                  onChange={(e) => handleFilterChange({ ...filters, type: e.target.value })}
                  className={CONTROL_CLASSES}
                >
                  <option value="all">Semua Tipe</option>
                  <option value="pole">Pole</option>
                  <option value="junction">Junction</option>
                  <option value="hub">Hub</option>
                  <option value="endpoint">Endpoint</option>
                </select>
              </div>

              <div>
                <label htmlFor="area-filter" className={LABEL_CLASSES}>Area</label>
                <select
                  id="area-filter"
                  value={filters.area}
                  onChange={(e) => handleFilterChange({ ...filters, area: e.target.value })}
                  className={CONTROL_CLASSES}
                >
                  {availableAreas.map((area: string) => (
                    <option key={area} value={area}>
                      {area.charAt(0).toUpperCase() + area.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </form>
        </Card>

        {renderTabContent()}
      </div>
    </AdminLayout>
  );
}
