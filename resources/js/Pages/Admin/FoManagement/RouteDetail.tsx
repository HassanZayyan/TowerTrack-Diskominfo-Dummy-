import React, { useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence } from 'motion/react';
import { Head, Link, usePage, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { formatDateOnly } from '@/utils/dateHelpers';
import { getFOStatusColor } from '@/utils/statusHelpers';
import { getTypeLabel } from '@/utils/foConstants';
import { useBodyScrollLock } from '@/Hooks/useBodyScrollLock';
import ModalBackdrop from '@/Components/ModalBackdrop';
import ModalContainer from '@/Components/ModalContainer';
import { Button } from '@/Components/ui/button';
import { Badge } from '@/Components/ui/badge';
import { Card } from '@/Components/ui/card';
import { cn } from '@/lib/utils';
import { FO_ROUTE_FALLBACK } from '@/lib/map-palette';

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
  csrfToken: string;
  [key: string]: any;
}

/**
 * getFOStatusColor still hands back raw stock-palette classes for green, red
 * and yellow. Its LABELS are the shared truth and stay shared; only the colour
 * decision is re-expressed here as a Badge variant, so the chips on this page
 * read from the token layer without forking the label map.
 *
 * "Non-aktif" is destructive on purpose: it is a fault state on a fibre route,
 * and that is one of the places red still earns its meaning.
 */
type FoBadgeVariant = 'success' | 'destructive' | 'warning' | 'neutral';
const FO_STATUS_VARIANT: Record<string, FoBadgeVariant> = {
  active: 'success',
  inactive: 'destructive',
  maintenance: 'warning',
};
const foStatusVariant = (status: string | undefined | null): FoBadgeVariant =>
  (status && FO_STATUS_VARIANT[status]) || 'neutral';

/** Destructive row action: soft fill at rest, full fill on hover. Still red,
 *  just not shouting from every row of the table. */
const DESTRUCTIVE_SOFT =
  'border border-destructive-border bg-destructive-soft text-destructive-strong hover:bg-destructive hover:text-destructive-foreground';

/** 40px header row, inset ground, one emphasis rule under it. */
const TH = 'h-10 whitespace-nowrap px-3 text-left align-middle text-xs font-semibold uppercase tracking-wide text-muted-foreground';
/** 12px horizontal cell padding, 44px minimum row height. */
const TD = 'px-3 py-2.5 align-middle text-sm';

// Route Header Component
const RouteHeader = ({ foRoute, canEdit }: { foRoute: FoRoute; canEdit: boolean }) => {
  const statusConfig = getFOStatusColor(foRoute.status);

  /* Was a 3-column grid of 18px figures plus a separate "Dibuat / Diperbarui"
     line plus a title block — three bands for five short facts. All five now
     sit on one inset meta rail at the base of the card. */
  const meta: Array<{ label: string; value: string; className?: string }> = [
    { label: 'Area', value: foRoute.area, className: 'capitalize' },
    { label: 'Total Jarak', value: `${foRoute.total_distance?.toFixed(1) || '0.0'} km`, className: 'tabular-nums' },
    { label: 'Total Titik', value: `${foRoute.total_points || 0} titik`, className: 'tabular-nums' },
    { label: 'Dibuat', value: formatDateOnly(foRoute.created_at) },
    { label: 'Diperbarui', value: formatDateOnly(foRoute.updated_at) },
  ];

  return (
    <Card padding="none">
      <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start sm:justify-between sm:p-5">
        <div className="min-w-0 flex-1">
          <div className="flex items-start gap-2.5">
            {/* Operator-chosen route colour — genuinely dynamic data, so it
                stays an inline literal rather than becoming a token. The ring
                keeps a pale pick visible against the card. */}
            <span
              className="mt-1 h-4 w-4 flex-shrink-0 rounded-sm ring-1 ring-inset ring-border-strong"
              style={{ backgroundColor: foRoute.color || FO_ROUTE_FALLBACK }}
              title={`Warna jalur: ${foRoute.color || FO_ROUTE_FALLBACK}`}
            />
            <div className="min-w-0">
              <h1 className="break-words text-xl font-semibold leading-tight tracking-tight text-foreground sm:text-2xl">
                {foRoute.name}
              </h1>
              <div className="mt-1.5">
                <Badge variant={foStatusVariant(foRoute.status)}>{statusConfig.label}</Badge>
              </div>
            </div>
          </div>

          {foRoute.description && (
            <p className="mt-3 break-words text-sm leading-relaxed text-muted-foreground">{foRoute.description}</p>
          )}
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:flex-shrink-0 sm:items-center">
          <Button asChild variant="outline">
            <Link
              href={route('admin.fo-management.routes.list')}
              title="Kembali ke daftar jalur FO"
            >
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Kembali
            </Link>
          </Button>

          {canEdit && (
            /* Edit was amber, which in the token layer means "warning". Editing a
               route warns about nothing — it is the primary action here. */
            <Button asChild>
              <Link
                href={route('admin.fo-management.routes.edit', foRoute.id)}
                title="Edit jalur FO"
              >
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit Jalur
              </Link>
            </Button>
          )}
        </div>
      </div>

      <dl className="flex flex-wrap gap-x-6 gap-y-2 border-t border-border bg-well px-4 py-2.5 sm:px-5">
        {meta.map((item) => (
          <div key={item.label} className="min-w-0">
            <dt className="text-xs text-muted-foreground">{item.label}</dt>
            <dd className={cn('truncate text-sm font-medium text-foreground', item.className)} title={item.value}>
              {item.value}
            </dd>
          </div>
        ))}
      </dl>
    </Card>
  );
};

// Points Stats Component
const PointsStats = ({ stats }: { stats: PageProps['routeStats'] }) => {
  /* Four tiles, no icon discs, no tinted grounds. The status meaning rides on
     the figure colour and the label text, which is where it is readable —
     a 40px coloured circle repeated four times told the operator nothing. */
  const tiles: Array<{ label: string; value: number; tone: string }> = [
    { label: 'Titik Aktif', value: stats.active_points, tone: 'text-success-strong' },
    // A down fibre point is a fault, so this red is earned.
    { label: 'Titik Non-aktif', value: stats.inactive_points, tone: 'text-destructive-strong' },
    { label: 'Maintenance', value: stats.maintenance_points, tone: 'text-warning-strong' },
  ];

  return (
    <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">
      {tiles.map((tile) => (
        <Card key={tile.label} padding="dense">
          <div className="text-sm text-muted-foreground">{tile.label}</div>
          <div className={cn('mt-0.5 text-2xl font-semibold tabular-nums tracking-tight', tile.tone)}>
            {tile.value}
          </div>
        </Card>
      ))}

      {/* This tile carries no status at all, so it stays neutral — three
          meaningful colours beside one quiet one are easier to read than four. */}
      <Card padding="dense">
        <div className="text-sm text-muted-foreground">Distribusi Tipe</div>
        <dl className="mt-1 space-y-0.5">
          {stats.points_by_type.slice(0, 3).map((item) => (
            <div key={item.type} className="flex items-baseline justify-between gap-2 text-sm">
              <dt className="truncate text-muted-foreground" title={item.label}>{item.label}</dt>
              <dd className="font-medium tabular-nums text-foreground">{item.count}</dd>
            </div>
          ))}
          {stats.points_by_type.length === 0 && (
            <div className="text-sm text-placeholder">—</div>
          )}
          {stats.points_by_type.length > 3 && (
            <div className="text-xs text-muted-foreground">+{stats.points_by_type.length - 3} lainnya</div>
          )}
        </dl>
      </Card>
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
  onShowDetail,
  onBulkActivate,
  onBulkDeactivate,
  onBulkDelete,
  isProcessing,
  areAllSelectedPointsActive,
}: {
  points: FoPoint[];
  canEdit: boolean;
  onDelete: (point: FoPoint) => void;
  selectedPoints: number[];
  onSelectPoint: (pointId: number) => void;
  onSelectAll: (selected: boolean) => void;
  routeId: number;
  onShowDetail: (point: FoPoint) => void;
  onBulkActivate: () => void;
  onBulkDeactivate: () => void;
  onBulkDelete: () => void;
  isProcessing: boolean;
  areAllSelectedPointsActive: boolean;
}) => {
  const allSelected = points.length > 0 && selectedPoints.length === points.length;
  const someSelected = selectedPoints.length > 0 && selectedPoints.length < points.length;

  return (
    <Card padding="none" className="overflow-hidden">
      {/* Toolbar sits on the inset ground, so the table below reads as the
          content and this reads as its controls. */}
      <div className="flex flex-col gap-2 border-b border-border bg-well px-4 py-2.5 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-base font-semibold leading-tight tracking-tight text-foreground">
          Daftar Titik FO ({points.length})
        </h2>
        {canEdit && (
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            {selectedPoints.length > 0 && (
              <>
                {areAllSelectedPointsActive ? (
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={onBulkDeactivate}
                    disabled={isProcessing}
                    title="Nonaktifkan titik yang dipilih"
                  >
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    {isProcessing ? 'Memproses...' : `Nonaktifkan (${selectedPoints.length})`}
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="success"
                    onClick={onBulkActivate}
                    disabled={isProcessing}
                    title="Aktifkan titik yang dipilih"
                  >
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {isProcessing ? 'Memproses...' : `Aktifkan (${selectedPoints.length})`}
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={onBulkDelete}
                  disabled={isProcessing}
                  title="Hapus titik yang dipilih"
                >
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  {isProcessing ? 'Memproses...' : `Hapus (${selectedPoints.length})`}
                </Button>
                <span aria-hidden="true" className="hidden h-5 w-px bg-border sm:block" />
              </>
            )}

            {/* "Tambah Titik" was red because red used to be the brand. It adds
                data, it destroys nothing — primary. */}
            <Button asChild size="sm">
              <Link
                href={route('admin.fo-management.points.create', { foRoute: routeId })}
                title="Tambah titik/koordinat pada jalur ini"
              >
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Tambah Titik
              </Link>
            </Button>
          </div>
        )}
      </div>

      {points.length > 0 ? (
        /* Horizontal scroll rather than hiding half the columns below 640px:
           koordinat and tipe are the reason an operator opens this table. */
        <div className="max-h-[32rem] overflow-auto">
          <table className="w-full min-w-[900px] border-collapse">
            <thead className="sticky top-0 z-10 bg-well">
              <tr className="border-b border-border-strong">
                {canEdit && (
                  <th scope="col" className={cn(TH, 'w-11')}>
                    <input
                      type="checkbox"
                      checked={allSelected}
                      ref={(el) => {
                        if (el) el.indeterminate = someSelected;
                      }}
                      onChange={(e) => onSelectAll(e.target.checked)}
                      aria-label="Pilih semua titik"
                      className="h-4 w-4 rounded border-input text-primary focus-visible:ring focus-visible:ring-offset-2"
                    />
                  </th>
                )}
                <th scope="col" className={cn(TH, 'w-12')}>#</th>
                <th scope="col" className={cn(TH, 'min-w-[14rem]')}>Nama Titik</th>
                <th scope="col" className={cn(TH, 'w-32')}>Tipe</th>
                <th scope="col" className={cn(TH, 'w-28')}>Status</th>
                <th scope="col" className={cn(TH, 'w-36')}>Koordinat</th>
                <th scope="col" className={cn(TH, 'w-24')}>Dibuat</th>
                <th scope="col" className={cn(TH, 'w-56')}>Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/70 bg-card">
              {points.map((point) => {
                const statusConfig = getFOStatusColor(point.status);
                const isSelected = selectedPoints.includes(point.id);

                return (
                  /* Selection used to tint the row red, which read as "these rows
                     are broken". Selection is chrome, so it takes the brand tint. */
                  <tr
                    key={point.id}
                    className={cn(
                      'transition-colors duration-140 ease-state',
                      isSelected ? 'bg-primary-soft' : 'hover:bg-accent',
                    )}
                  >
                    {canEdit && (
                      <td className={cn(TD, 'w-11')}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => onSelectPoint(point.id)}
                          aria-label={`Pilih titik ${point.name}`}
                          className="h-4 w-4 rounded border-input text-primary focus-visible:ring focus-visible:ring-offset-2"
                        />
                      </td>
                    )}
                    <td className={cn(TD, 'w-12 font-medium tabular-nums text-muted-foreground')}>
                      {point.sequence_number}
                    </td>
                    <td className={cn(TD, 'min-w-[14rem]')}>
                      <div className="truncate font-medium text-foreground" title={point.name}>{point.name}</div>
                      {point.description && (
                        <div className="truncate text-xs text-muted-foreground" title={point.description}>
                          {point.description}
                        </div>
                      )}
                    </td>
                    <td className={cn(TD, 'w-32 text-foreground')}>
                      <span className="block truncate" title={getTypeLabel(point.type)}>
                        {getTypeLabel(point.type)}
                      </span>
                    </td>
                    <td className={cn(TD, 'w-28')}>
                      <Badge variant={foStatusVariant(point.status)}>{statusConfig.label}</Badge>
                    </td>
                    <td className={cn(TD, 'w-36 font-mono text-xs tabular-nums text-foreground')}>
                      <div>{point.latitude.toFixed(4)}</div>
                      <div>{point.longitude.toFixed(4)}</div>
                    </td>
                    <td className={cn(TD, 'w-24 whitespace-nowrap tabular-nums text-muted-foreground')}>
                      {new Date(point.created_at).toLocaleDateString('id-ID', {
                        day: '2-digit',
                        month: '2-digit',
                        year: '2-digit'
                      })}
                    </td>
                    <td className={cn(TD, 'w-56')}>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onShowDetail(point)}
                          title="Lihat detail titik FO"
                        >
                          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          Detail
                        </Button>
                        {canEdit && (
                          <>
                            <Button asChild size="sm" variant="secondary">
                              <Link
                                href={route('admin.fo-management.points.edit', { foPoint: point.id, from_route: 'detail' })}
                                title="Edit titik FO"
                              >
                                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                                Edit
                              </Link>
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              className={DESTRUCTIVE_SOFT}
                              onClick={() => onDelete(point)}
                              title="Hapus titik FO"
                            >
                              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                              Hapus
                            </Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        /* The one place 24px padding is right: a genuine empty state. */
        <div className="bg-well p-6 text-center">
          <h3 className="text-base font-semibold tracking-tight text-foreground">
            Belum ada titik FO
          </h3>
          <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
            Jalur ini belum memiliki titik FO. Mulai dengan menambahkan titik pertama.
          </p>
          {canEdit && (
            <Button asChild className="mt-4 w-full sm:w-auto">
              <Link href={route('admin.fo-management.points.create', { foRoute: routeId })}>
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Tambah Titik Pertama
              </Link>
            </Button>
          )}
        </div>
      )}
    </Card>
  );
};

/** Modal field row — 18 hand-written copies of the same two lines, once. */
const DetailRow = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="flex flex-col gap-0.5 border-b border-border/70 py-2 sm:flex-row sm:items-baseline sm:gap-4">
    <dt className="w-32 flex-shrink-0 text-sm text-muted-foreground">{label}</dt>
    <dd className="min-w-0 break-words text-sm text-foreground">{children}</dd>
  </div>
);

export default function RouteDetail() {
  const { props } = usePage<PageProps>();
  const { route: foRoute, points, routeStats, auth } = props;

  const [selectedPoints, setSelectedPoints] = useState<number[]>([]);
  const [selectedPointDetail, setSelectedPointDetail] = useState<FoPoint | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [pointToDelete, setPointToDelete] = useState<FoPoint | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const canEdit = ['admin', 'operator', 'provider_owner'].includes(auth.user.role);

  // Prevent body scroll saat modal terbuka (Detail atau Delete)
  useBodyScrollLock(showDetailDialog || showDeleteDialog);

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
    setPointToDelete(point);
    setShowDeleteDialog(true);
  };

  const handleCloseDeleteDialog = () => {
    setShowDeleteDialog(false);
    setPointToDelete(null);
  };

  const handleConfirmDelete = () => {
    if (!pointToDelete) return;

    router.delete(route('admin.fo-management.points.destroy', { foPoint: pointToDelete.id }), {
      onSuccess: () => {
        setSelectedPoints(prev => prev.filter(id => id !== pointToDelete.id));
        setShowDeleteDialog(false);
        setPointToDelete(null);
      },
      onError: () => {
        alert('Terjadi kesalahan saat menghapus titik.');
        setShowDeleteDialog(false);
        setPointToDelete(null);
      }
    });
  };

  const handleShowDetail = (point: FoPoint) => {
    setSelectedPointDetail(point);
    setShowDetailDialog(true);
  };

  const handleCloseDetail = () => {
    setShowDetailDialog(false);
    setSelectedPointDetail(null);
  };

  // Check if all selected points are active
  const areAllSelectedPointsActive = () => {
    if (selectedPoints.length === 0) return false;
    const selectedPointsData = points.data.filter(p => selectedPoints.includes(p.id));
    return selectedPointsData.every(p => p.status === 'active');
  };

  // Bulk activate handler
  const handleBulkActivate = () => {
    if (selectedPoints.length === 0 || isProcessing) return;

    setIsProcessing(true);
    router.post(route('admin.fo-management.points.bulk-action'), {
      action: 'activate',
      point_ids: selectedPoints,
    }, {
      onSuccess: () => {
        setSelectedPoints([]);
        setIsProcessing(false);
      },
      onError: () => {
        alert('Terjadi kesalahan saat mengaktifkan titik.');
        setIsProcessing(false);
      }
    });
  };

  // Bulk deactivate handler
  const handleBulkDeactivate = () => {
    if (selectedPoints.length === 0 || isProcessing) return;

    setIsProcessing(true);
    router.post(route('admin.fo-management.points.bulk-action'), {
      action: 'deactivate',
      point_ids: selectedPoints,
    }, {
      onSuccess: () => {
        setSelectedPoints([]);
        setIsProcessing(false);
      },
      onError: () => {
        alert('Terjadi kesalahan saat menonaktifkan titik.');
        setIsProcessing(false);
      }
    });
  };

  // Bulk delete handler
  const handleBulkDelete = () => {
    if (selectedPoints.length === 0 || isProcessing) return;

    if (!confirm(`Apakah Anda yakin ingin menghapus ${selectedPoints.length} titik yang dipilih? Tindakan ini tidak dapat dibatalkan.`)) {
      return;
    }

    setIsProcessing(true);
    router.post(route('admin.fo-management.points.bulk-action'), {
      action: 'delete',
      point_ids: selectedPoints,
    }, {
      onSuccess: () => {
        setSelectedPoints([]);
        setIsProcessing(false);
      },
      onError: () => {
        alert('Terjadi kesalahan saat menghapus titik.');
        setIsProcessing(false);
      }
    });
  };

  return (
    <AdminLayout title={`Detail Jalur - ${foRoute.name}`}>
      <Head title={`Detail Jalur - ${foRoute.name}`} />

      <div className="space-y-4 sm:space-y-5">
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
          onShowDetail={handleShowDetail}
          onBulkActivate={handleBulkActivate}
          onBulkDeactivate={handleBulkDeactivate}
          onBulkDelete={handleBulkDelete}
          isProcessing={isProcessing}
          areAllSelectedPointsActive={areAllSelectedPointsActive()}
        />

        {/* Pagination — one row, one ground, no card around a sentence. */}
        {points.total > points.per_page && (
          <div className="flex flex-col gap-2 rounded-lg border border-border bg-well px-4 py-2.5 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              Menampilkan{' '}
              <span className="font-medium tabular-nums text-foreground">
                {(points.current_page - 1) * points.per_page + 1}
              </span>{' '}
              hingga{' '}
              <span className="font-medium tabular-nums text-foreground">
                {Math.min(points.current_page * points.per_page, points.total)}
              </span>{' '}
              dari{' '}
              <span className="font-medium tabular-nums text-foreground">{points.total}</span> hasil
            </p>
            <nav className="-space-x-px inline-flex overflow-x-auto rounded-md">
              {points.links.map((link, index) => (
                <Link
                  key={index}
                  href={link.url || '#'}
                  className={cn(
                    'relative inline-flex h-9 min-w-9 items-center justify-center border px-2.5 text-sm font-medium tabular-nums transition-colors duration-140 ease-state focus-visible:outline-none focus-visible:ring focus-visible:ring-offset-2',
                    link.active
                      ? 'z-10 border-primary-border bg-primary-soft text-primary-strong'
                      : link.url
                      ? 'border-border bg-card text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                      : 'cursor-not-allowed border-border bg-muted text-placeholder',
                    index === 0 && 'rounded-l-md',
                    index === points.links.length - 1 && 'rounded-r-md',
                  )}
                  dangerouslySetInnerHTML={{ __html: link.label }}
                />
              ))}
            </nav>
          </div>
        )}

        {/* Detail Dialog - Using Portal to render outside AdminLayout DOM structure.

            The AnimatePresence sits INSIDE the portal, not around it. It has to
            be the parent of the element that leaves, and after createPortal the
            dialog's parent in the React tree is whatever is inside that call —
            wrapping the portal itself would leave AnimatePresence watching a
            child that never changes. The open condition moved in with it for
            the same reason: a portal that stops being created cannot animate. */}
        {typeof window !== 'undefined' && createPortal(
          <AnimatePresence>
          {showDetailDialog && selectedPointDetail && (
          <ModalBackdrop
            onClick={(e) => {
              // Close modal when clicking on backdrop
              if (e && e.target === e.currentTarget) {
                handleCloseDetail();
              }
            }}
            opacity={50}
            zIndex={100}
          >
            <ModalContainer maxWidth="md" maxHeight="90vh" onClick={(e) => e.stopPropagation()}>
              <div className="flex flex-shrink-0 items-center justify-between gap-3 border-b border-border px-5 py-3">
                <div className="min-w-0">
                  <h3 className="text-base font-semibold leading-tight tracking-tight text-foreground">Detail Titik FO</h3>
                  <p className="mt-0.5 truncate text-sm text-muted-foreground" title={selectedPointDetail.name}>
                    {selectedPointDetail.name}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleCloseDetail}
                  aria-label="Tutup"
                  className="-mr-1 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors duration-140 ease-state hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring focus-visible:ring-offset-2"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div
                className="min-h-0 flex-1 overflow-y-auto px-5"
                style={{
                  maxHeight: 'calc(100vh - 12rem)',
                  WebkitOverflowScrolling: 'touch',
                  overscrollBehavior: 'contain'
                }}
              >
                <dl className="py-1">
                  <DetailRow label="Nama Titik">{selectedPointDetail.name}</DetailRow>

                  {selectedPointDetail.description && (
                    <DetailRow label="Deskripsi">{selectedPointDetail.description}</DetailRow>
                  )}

                  <DetailRow label="Tipe">{getTypeLabel(selectedPointDetail.type)}</DetailRow>

                  <DetailRow label="Status">
                    <Badge variant={foStatusVariant(selectedPointDetail.status)}>
                      {getFOStatusColor(selectedPointDetail.status).label}
                    </Badge>
                  </DetailRow>

                  <DetailRow label="Koordinat">
                    <span className="font-mono tabular-nums">
                      Latitude: {selectedPointDetail.latitude.toFixed(6)}
                      <br />
                      Longitude: {selectedPointDetail.longitude.toFixed(6)}
                    </span>
                  </DetailRow>

                  <DetailRow label="Urutan">
                    <span className="tabular-nums">{selectedPointDetail.sequence_number}</span>
                  </DetailRow>

                  <DetailRow label="Dibuat">
                    {new Date(selectedPointDetail.created_at).toLocaleDateString('id-ID', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </DetailRow>

                  <DetailRow label="Diperbarui">
                    {new Date(selectedPointDetail.updated_at).toLocaleDateString('id-ID', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </DetailRow>
                </dl>
              </div>

              <div className="flex flex-shrink-0 gap-2 border-t border-border bg-well px-5 py-3">
                {canEdit && (
                  <Button asChild className="flex-1">
                    <Link
                      href={route('admin.fo-management.points.edit', { foPoint: selectedPointDetail.id, from_route: 'detail' })}
                    >
                      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Edit Titik
                    </Link>
                  </Button>
                )}
                <Button variant="outline" className="flex-1" onClick={handleCloseDetail}>
                  Tutup
                </Button>
              </div>
            </ModalContainer>
          </ModalBackdrop>
          )}
          </AnimatePresence>,
          document.body
        )}

        {/* Delete Confirmation Dialog - Using Portal.
            Every red below is semantic: this is the irreversible one. */}
        {typeof window !== 'undefined' && createPortal(
          <AnimatePresence>
          {showDeleteDialog && pointToDelete && (
          <ModalBackdrop
            onClick={() => handleCloseDeleteDialog()}
            opacity={50}
            zIndex={100}
          >
            <ModalContainer maxWidth="md" maxHeight="90vh" className="p-5" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-md bg-destructive-soft">
                  <svg className="h-5 w-5 text-destructive-strong" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <div className="min-w-0">
                  <h3 className="text-base font-semibold leading-tight tracking-tight text-foreground">Konfirmasi Hapus Titik FO</h3>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    Titik: <span className="font-medium text-foreground">{pointToDelete.name}</span>
                  </p>
                </div>
              </div>

              <div className="mt-4 rounded-md border border-destructive-border bg-destructive-soft px-3 py-2.5">
                <p className="text-sm font-medium text-destructive-strong">
                  Apakah Anda yakin ingin menghapus titik FO ini?
                </p>
                <p className="mt-1 text-xs text-destructive-strong">
                  Data akan dihapus permanen dan tidak dapat dikembalikan. Tindakan ini akan mempengaruhi urutan titik pada jalur ini.
                </p>
              </div>

              <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-end">
                <Button variant="outline" onClick={handleCloseDeleteDialog}>
                  Batal
                </Button>
                <Button variant="destructive" onClick={handleConfirmDelete}>
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Hapus Permanen
                </Button>
              </div>
            </ModalContainer>
          </ModalBackdrop>
          )}
          </AnimatePresence>,
          document.body
        )}
      </div>
    </AdminLayout>
  );
}
