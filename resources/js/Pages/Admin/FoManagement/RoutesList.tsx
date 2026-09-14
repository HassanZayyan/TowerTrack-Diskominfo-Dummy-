import React, { useState, useCallback, useEffect } from 'react';
import { Head, Link, usePage, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import PageHeader from '@/Components/PageHeader';
import { formatDateOnly } from '@/utils/dateHelpers';
import { useDebounce } from '@/Hooks/useDebounce';
import { getFOStatusColor } from '@/utils/statusHelpers';
import { Button } from '@/Components/ui/button';
import { Badge } from '@/Components/ui/badge';
import { Card } from '@/Components/ui/card';
import { cn } from '@/lib/utils';

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
  /** What the controller actually filtered by, echoed back so the controls agree with the results. */
  filters?: { search: string; status: string };
  csrfToken: string;
  [key: string]: any;
}

/**
 * Presentation-only mapping: an FO status is either healthy, broken or
 * in-maintenance. `inactive` keeps red because it means "this link is down",
 * which is exactly the destructive/wrong meaning red is reserved for now.
 */
type StatusTone = 'success' | 'warning' | 'destructive' | 'neutral';

const FO_STATUS_TONE: Record<string, StatusTone> = {
  active: 'success',
  inactive: 'destructive',
  maintenance: 'warning',
};

const statusTone = (status: string | undefined | null): StatusTone =>
  FO_STATUS_TONE[status ?? ''] ?? 'neutral';

/** One control recipe. h-11 = 44px target; the 3px token ring, never ring-2. */
const CONTROL_CLASSES =
  'block h-11 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground placeholder:text-placeholder transition-colors duration-140 ease-state focus-visible:outline-none focus-visible:ring focus-visible:ring-offset-2';

const LABEL_CLASSES = 'mb-1 block text-xs font-medium text-muted-foreground';

/** 40px card head on the inset ground, strong bottom rule. */
const TableHead = ({ title, meta }: { title: string; meta: string }) => (
  <div className="flex min-h-[40px] flex-wrap items-center justify-between gap-x-3 gap-y-1 border-b border-border-strong bg-well px-3 py-2">
    <h2 className="text-sm font-semibold text-foreground">{title}</h2>
    <span className="text-xs tabular-nums text-muted-foreground">{meta}</span>
  </div>
);

/** Stat tile: figure, label, one caption. No icon discs, no coloured tiles. */
const StatTile = ({ label, value, unit, caption, toneClass, index }: {
  label: string;
  value: string;
  unit?: string;
  caption: string;
  toneClass?: string;
  index: number;
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
    <p className="mt-1 truncate text-xs text-muted-foreground">{caption}</p>
  </Card>
);

// Stats Cards Component
const StatsCards = ({ stats }: { stats: Stats }) => {
  // Health score is a measurement, not brand chrome: low score stays red
  // because it is genuinely "something is wrong". The tone sits on the figure
  // instead of flooding the whole tile.
  const healthTone = (score: number) => {
    if (score >= 80) return 'text-success-strong';
    if (score >= 60) return 'text-warning-strong';
    return 'text-destructive-strong';
  };

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <StatTile index={0} label="Total Jalur" value={`${stats.total_routes}`} caption="Jalur FO" />
      <StatTile index={1} label="Jalur Aktif" value={`${stats.active_routes}`} caption="Beroperasi" />
      <StatTile
        index={2}
        label="Total Jarak"
        value={stats.total_distance?.toFixed(1) || '0.0'}
        unit="km"
        caption="Kilometer"
      />
      <StatTile
        index={3}
        label="Kesehatan Jaringan"
        value={`${stats.health_score}`}
        unit="%"
        caption="Health Score"
        toneClass={healthTone(stats.health_score)}
      />
    </div>
  );
};

/** Header cell recipe — one string, used by every column. */
const TH_CLASSES = 'h-10 px-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground';
/** Body cell recipe — 12px horizontal, rows land on 44px. */
const TD_CLASSES = 'px-3 py-2 align-middle';

/** Row actions. Destructive keeps its token, its icon and the explicit verb. */
const RouteActions = ({ foRoute, canEdit, onDelete, className }: {
  foRoute: FoRoute;
  canEdit: boolean;
  onDelete: (route: FoRoute) => void;
  className?: string;
}) => (
  <div className={cn('flex flex-wrap items-center gap-1', className)}>
    <Button asChild variant="outline" size="sm" className="h-11">
      <Link href={route('admin.fo-management.routes.detail', foRoute.id)} title="Lihat detail jalur FO">
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
        Detail
      </Link>
    </Button>

    {canEdit && (
      <>
        <Button asChild variant="ghost" size="sm" className="h-11">
          <Link href={route('admin.fo-management.routes.edit', foRoute.id)} title="Edit jalur FO">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Edit
          </Link>
        </Button>

        {/* Irreversible, so it keeps red: destructive tokens + icon + verb. */}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => onDelete(foRoute)}
          className="h-11 text-destructive hover:bg-destructive-soft hover:text-destructive-strong"
          title="Hapus jalur FO"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          Hapus
        </Button>
      </>
    )}
  </div>
);

export default function RoutesList() {
  const { props } = usePage<PageProps>();
  const { routes, stats, currentArea, availableAreas, auth, filters: applied } = props;

  // Seeded from the server, not from empty. See the note on the controller.
  const [filters, setFilters] = useState({
    area: currentArea,
    status: applied?.status ?? 'all',
    search: applied?.search ?? '',
  });

  // Debounced search state
  const [searchValue, setSearchValue] = useState(applied?.search ?? '');
  const debouncedSearchValue = useDebounce(searchValue, 500);

  const canEdit = ['admin', 'operator'].includes(auth.user.role);

  // Handle filter changes
  const handleFilterChange = useCallback((newFilters: typeof filters) => {
    setFilters(newFilters);
    router.get(route('admin.fo-management.routes.list'),
      newFilters as any,
      { preserveState: true, preserveScroll: true, replace: true }
    );
  }, []);

  // Debounced search effect
  useEffect(() => {
    if (debouncedSearchValue !== filters.search) {
      handleFilterChange({ ...filters, search: debouncedSearchValue });
    }
  }, [debouncedSearchValue, filters, handleFilterChange]);

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

  // Server-filtered, server-paginated. This used to re-filter `routes.data` in
  // the browser on top of the request it had just sent, which only ever agreed
  // with the pager because the page size was larger than the whole table. The
  // controller applies area, search and status now; this page renders the page
  // it was given.
  const filteredRoutes = routes.data;

  const emptyDescription = filters.search || filters.status !== 'all'
    ? 'Coba ubah filter pencarian Anda.'
    : 'Belum ada jalur FO yang tersedia. Mulai dengan menambahkan jalur baru.';

  return (
    <AdminLayout title="Manajemen Jalur Fiber Optic">
      <Head title="Manajemen Jalur FO" />

      <div className="space-y-4 sm:space-y-5">
        {/*
          Was a HeroSection band whose actions were re-implemented as a toolbar
          100px lower. The header is now type plus a hairline rule, and it owns
          the page's only action zone.
        */}
        <PageHeader
          title="Manajemen Jalur FO"
          description={`Kelola jalur fiber optic untuk area ${currentArea.charAt(0).toUpperCase() + currentArea.slice(1)}`}
          showLogo={false}
          className="mb-0 pb-4"
          actions={
            canEdit ? (
              <>
                {/* Provider Management removed - Providers are now managed via User Management */}
                <Button asChild variant="outline" className="h-11">
                  <Link href={route('admin.fo-management.points.import')}>
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    Import FO Points
                  </Link>
                </Button>
                {/* Was gold #FFD700 on #B71C1C — old brand chrome, now the primary action. */}
                <Button asChild className="h-11">
                  <Link href={route('admin.fo-management.routes.create')}>
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Tambah Jalur Baru
                  </Link>
                </Button>
              </>
            ) : null
          }
        />

        <StatsCards stats={stats} />

        {/* Filter rail: one inset row, three controls, no nested card. */}
        <Card variant="well" padding="dense">
          <form onSubmit={(e) => e.preventDefault()}>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div>
                <label htmlFor="search" className={LABEL_CLASSES}>Cari Jalur</label>
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
                  className={CONTROL_CLASSES}
                  placeholder="Masukkan nama jalur..."
                />
              </div>

              <div>
                <label htmlFor="status-filter" className={LABEL_CLASSES}>Status Jalur</label>
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

        {/*
          Was a 3-up grid of 320px cards — six rows of route data needed three
          screens. The same data is a table: one row per route, scannable.
        */}
        <Card padding="none">
          <TableHead title="Daftar Jalur FO" meta={`${filteredRoutes.length} jalur`} />

          {filteredRoutes.length > 0 ? (
            <>
              {/* Desktop table */}
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border-strong bg-well">
                      <th scope="col" className={TH_CLASSES}>Nama Jalur</th>
                      <th scope="col" className={TH_CLASSES}>Status</th>
                      <th scope="col" className={cn(TH_CLASSES, 'text-right')}>Jarak</th>
                      <th scope="col" className={cn(TH_CLASSES, 'text-right')}>Titik</th>
                      <th scope="col" className={TH_CLASSES}>Area</th>
                      <th scope="col" className={cn(TH_CLASSES, 'text-right')}>Diperbarui</th>
                      <th scope="col" className={cn(TH_CLASSES, 'text-right')}>Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/70">
                    {filteredRoutes.map((foRoute) => {
                      const statusConfig = getFOStatusColor(foRoute.status);
                      return (
                        <tr key={foRoute.id} className="transition-colors duration-140 ease-state hover:bg-well/60">
                          <td className={cn(TD_CLASSES, 'max-w-[320px]')}>
                            <div className="flex items-center gap-2">
                              {/* Per-route identity colour comes from the database, so it stays a literal. */}
                              <span
                                className="h-2.5 w-2.5 shrink-0 rounded-full ring-1 ring-inset ring-border"
                                style={{ backgroundColor: foRoute.color || 'hsl(var(--neutral))' }}
                                aria-hidden="true"
                              />
                              <div className="min-w-0">
                                <div className="truncate text-sm font-medium text-foreground" title={foRoute.name}>
                                  {foRoute.name}
                                </div>
                                {foRoute.description && (
                                  <div className="truncate text-xs text-muted-foreground" title={foRoute.description}>
                                    {foRoute.description}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className={cn(TD_CLASSES, 'whitespace-nowrap')}>
                            <Badge variant={statusTone(foRoute.status)}>{statusConfig.label}</Badge>
                          </td>
                          <td className={cn(TD_CLASSES, 'whitespace-nowrap text-right text-sm tabular-nums text-foreground')}>
                            {foRoute.total_distance?.toFixed(1) || '0.0'} km
                          </td>
                          <td className={cn(TD_CLASSES, 'whitespace-nowrap text-right text-sm tabular-nums text-foreground')}>
                            {foRoute.total_points || 0}
                          </td>
                          <td className={cn(TD_CLASSES, 'whitespace-nowrap text-sm capitalize text-muted-foreground')}>
                            {foRoute.area}
                          </td>
                          <td className={cn(TD_CLASSES, 'whitespace-nowrap text-right text-sm tabular-nums text-muted-foreground')}>
                            {formatDateOnly(foRoute.updated_at)}
                          </td>
                          <td className={cn(TD_CLASSES, 'whitespace-nowrap')}>
                            <RouteActions
                              foRoute={foRoute}
                              canEdit={canEdit}
                              onDelete={handleDelete}
                              className="justify-end"
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile list — same data, stacked */}
              <ul className="divide-y divide-border/70 md:hidden">
                {filteredRoutes.map((foRoute) => {
                  const statusConfig = getFOStatusColor(foRoute.status);
                  return (
                    <li key={foRoute.id} className="p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex min-w-0 items-center gap-2">
                          <span
                            className="h-2.5 w-2.5 shrink-0 rounded-full ring-1 ring-inset ring-border"
                            style={{ backgroundColor: foRoute.color || 'hsl(var(--neutral))' }}
                            aria-hidden="true"
                          />
                          <span className="truncate text-sm font-medium text-foreground" title={foRoute.name}>
                            {foRoute.name}
                          </span>
                        </div>
                        <Badge variant={statusTone(foRoute.status)}>{statusConfig.label}</Badge>
                      </div>

                      {foRoute.description && (
                        <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{foRoute.description}</p>
                      )}

                      <dl className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <dt>Jarak Total</dt>
                          <dd className="font-medium tabular-nums text-foreground">
                            {foRoute.total_distance?.toFixed(1) || '0.0'} km
                          </dd>
                        </div>
                        <div className="flex items-center gap-1">
                          <dt>Total Titik</dt>
                          <dd className="font-medium tabular-nums text-foreground">
                            {foRoute.total_points || 0} titik
                          </dd>
                        </div>
                        <div className="flex items-center gap-1">
                          <dt>Area</dt>
                          <dd className="font-medium capitalize text-foreground">{foRoute.area}</dd>
                        </div>
                        <span className="tabular-nums">{formatDateOnly(foRoute.updated_at)}</span>
                      </dl>

                      <RouteActions
                        foRoute={foRoute}
                        canEdit={canEdit}
                        onDelete={handleDelete}
                        className="mt-2"
                      />
                    </li>
                  );
                })}
              </ul>
            </>
          ) : (
            <div className="p-6">
              <div className="flex flex-col items-center justify-center gap-2 text-center">
                <svg className="h-8 w-8 text-placeholder" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
                <p className="text-sm font-medium text-foreground">Tidak ada jalur FO yang ditemukan</p>
                <p className="max-w-sm text-sm text-muted-foreground">{emptyDescription}</p>
              </div>
            </div>
          )}

          {/* Pagination */}
          {routes.total > routes.per_page && (
            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border bg-well px-3 py-2">
              <p className="text-xs text-muted-foreground">
                Menampilkan{' '}
                <span className="font-medium tabular-nums text-foreground">
                  {(routes.current_page - 1) * routes.per_page + 1}
                </span>{' '}
                hingga{' '}
                <span className="font-medium tabular-nums text-foreground">
                  {Math.min(routes.current_page * routes.per_page, routes.total)}
                </span>{' '}
                dari{' '}
                <span className="font-medium tabular-nums text-foreground">{routes.total}</span> hasil
              </p>

              <nav className="flex flex-wrap items-center gap-1" aria-label="Pagination">
                {routes.links.map((link, index) => (
                  <Link
                    key={index}
                    href={link.url || '#'}
                    aria-current={link.active ? 'page' : undefined}
                    className={cn(
                      'inline-flex h-11 min-w-[44px] items-center justify-center rounded-md border px-2 text-sm tabular-nums',
                      'transition-colors duration-140 ease-state focus-visible:outline-none focus-visible:ring focus-visible:ring-offset-2',
                      link.active
                        ? 'border-primary-border bg-primary-soft font-medium text-primary-strong'
                        : link.url
                        ? 'border-input bg-card text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                        : 'pointer-events-none border-border bg-muted text-placeholder',
                    )}
                    dangerouslySetInnerHTML={{ __html: link.label }}
                  />
                ))}
              </nav>
            </div>
          )}
        </Card>
      </div>
    </AdminLayout>
  );
}
