/**
 * ManagementTable — the Keluhan / Masukan list.
 *
 * REBUILT. This file was 776 lines and carried most of the admin surface's
 * structural problems at once. What changed, and why:
 *
 * 1. THREE STAT CARDS -> THE FILTER ITSELF.
 *    Baru / Progress / Selesai were rendered as three 104px cards with circled
 *    icons, computed client-side over the UNPAGINATED `items` — the same three
 *    numbers the Dashboard already renders from the server. They are now the
 *    counts printed on the status filter segments. One control, same four
 *    facts, and clicking a number does the thing the number is about.
 *
 * 2. SIX CONTAINERS -> ONE.
 *    Was: stats grid + search Card + table Card + summary Card ("Menampilkan
 *    1-5 dari 12") + pagination Card ("Halaman 1 dari 3"). The summary and the
 *    pager stated the same fact in two stacked boxes. Now one Card: toolbar on
 *    a well, table, footer on a well. The highlighted page number is what says
 *    which page you are on, so the "Halaman N dari M" sentence is gone.
 *
 * 3. DESKTOP AND MOBILE SHARED THE SAME CODE NOW.
 *    The status <select> (20 lines including its tri-state ternary), the media
 *    grid (48 lines) and the type badge were each written out twice, verbatim,
 *    ~140 lines apart — and the Detail button had two different labels for one
 *    action ("Detail" / "Lihat Detail"). Each is one local component now.
 *
 * 4. BUG: the mobile list mapped `filteredItems` while the desktop table mapped
 *    `paginatedItems`, so phones silently ignored pagination. Both paginate.
 *
 * 5. The Email column is folded into Pelapor. It was a separate <td> carrying
 *    an inline `style={{maxWidth:'200px'}}` truncation hack next to a Tailwind
 *    `truncate` doing the same job.
 *
 * TABLE SPEC: header row 40px on bg-well with a border-border-strong bottom
 * rule; body rows 44px minimum, divide-y divide-border/70, 12px horizontal
 * cell padding.
 *
 * SEMANTICS KEPT: the per-row status control keeps warning / info / success
 * fills, because those three states are the whole point of the screen.
 */

import React, { useState } from 'react';
import { router } from '@inertiajs/react';
import VideoThumbnail from '@/Components/VideoThumbnail';
import { formatDateFull } from '@/utils/dateHelpers';
import { getMediaUrl } from '@/utils/mediaHelpers';
import type { Report, Feedback, StatusItem, MediaItem } from '@/types/messages';
import { Button } from '@/Components/ui/button';
import { Badge } from '@/Components/ui/badge';
import { Card } from '@/Components/ui/card';
import { cn } from '@/lib/utils';

type BaseItem = Report | Feedback;

// Type guard helpers
const isReport = (item: BaseItem, itemType: 'complaints' | 'feedbacks'): item is Report => {
  return itemType === 'complaints';
};

interface Props {
  items: BaseItem[];
  statuses: StatusItem[];
  title: string;
  type: 'complaints' | 'feedbacks';
  respondRoute: string;
  updateStatusRoute: string;
}

/* ---------------------------------------------------------------------------
   Local pieces. Each one existed twice in the previous file.
   ------------------------------------------------------------------------- */

/** The three states this screen exists to move an item between. */
const STATUS_OPTIONS = [
  { value: 'pending', label: 'BARU' },
  { value: 'in_progress', label: 'PROGRESS' },
  { value: 'closed', label: 'SELESAI' },
];

const statusTone = (status: string) => {
  if (status === 'pending') return 'bg-warning-soft text-warning-strong border-warning-border';
  if (status === 'in_progress') return 'bg-info-soft text-info-strong border-info-border';
  return 'bg-success-soft text-success-strong border-success-border';
};

const MessageStatusSelect: React.FC<{
  status: string;
  busy: boolean;
  onChange: (next: string) => void;
}> = ({ status, busy, onChange }) => (
  <select
    value={status}
    onChange={(e) => onChange(e.target.value)}
    disabled={busy}
    aria-label="Ubah status"
    className={cn(
      // 44px would break the 44px row; this control is inside a row whose own
      // padding carries the target, and it keeps a full-width hit area.
      'h-8 w-full min-w-[104px] rounded-md border px-2 pr-6 text-xs font-medium',
      'appearance-none transition-colors duration-140 ease-state',
      'focus:outline-none focus-visible:outline-none focus-visible:ring focus-visible:ring-offset-1',
      busy ? 'cursor-not-allowed opacity-50' : 'cursor-pointer',
      statusTone(status),
    )}
  >
    {STATUS_OPTIONS.map((option) => (
      <option key={option.value} value={option.value}>
        {option.label}
      </option>
    ))}
  </select>
);

const VisibilityBadge: React.FC<{ isPublic?: boolean }> = ({ isPublic }) => {
  if (isPublic === undefined || isPublic === null) {
    return <Badge variant="secondary">-</Badge>;
  }

  return isPublic ? (
    <Badge variant="info">
      <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      Terbuka
    </Badge>
  ) : (
    <Badge variant="neutral">
      <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
      </svg>
      Tertutup
    </Badge>
  );
};

/** Placeholder painted when a thumbnail 404s. Was an innerHTML string, twice. */
const thumbFallback = (e: React.SyntheticEvent<HTMLImageElement>) => {
  const target = e.target as HTMLImageElement;
  target.style.display = 'none';
  const parent = target.parentElement;
  if (parent) {
    parent.classList.add('bg-muted');
  }
};

/**
 * Compact media strip. The old version was a 2-column grid of 80x64 thumbnails
 * inside a table cell, so three attachments made a row three times taller than
 * a row without them and the table lost its rhythm. Here it is a fixed-height
 * strip: a few small thumbs plus a count chip, and the detail page shows the
 * rest.
 */
const MediaStrip: React.FC<{
  assets: MediaItem[];
  limit: number;
  size: string;
  onOpen: (asset: MediaItem) => void;
}> = ({ assets, limit, size, onOpen }) => {
  if (assets.length === 0) return null;
  const shown = assets.slice(0, limit);
  const rest = assets.length - shown.length;

  return (
    <div className="mt-1.5 flex flex-wrap items-center gap-1">
      {shown.map((asset, index) => (
        <button
          key={index}
          type="button"
          onClick={() => onOpen(asset)}
          aria-label="Lihat lampiran"
          className={cn(
            'overflow-hidden rounded border border-border bg-card',
            'transition-colors duration-140 ease-state hover:border-border-strong',
            'focus-visible:outline-none focus-visible:ring focus-visible:ring-offset-1',
            size,
          )}
        >
          {asset.file_type === 'video' || asset.file_path.toLowerCase().match(/\.(mp4|mov|avi|webm)$/i) ? (
            <VideoThumbnail
              src={getMediaUrl(asset.file_path)}
              fileType="video"
              className={cn('h-full w-full', size)}
              onClick={() => onOpen(asset)}
              showPlayButton={true}
              alt="Video media"
              loading="lazy"
            />
          ) : (
            <img
              src={getMediaUrl(asset.file_path)}
              alt="Media"
              loading="lazy"
              className={cn('h-full w-full object-cover', size)}
              onError={thumbFallback}
            />
          )}
        </button>
      ))}
      {rest > 0 && (
        <span className="rounded border border-border bg-muted px-1.5 py-0.5 text-[11px] font-medium tabular-nums text-muted-foreground">
          +{rest} lainnya
        </span>
      )}
    </div>
  );
};

/* ------------------------------------------------------------------------- */

const ManagementTable: React.FC<Props> = ({
  items = [],
  statuses = [],
  title,
  type,
  respondRoute,
  updateStatusRoute
}) => {
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [previewAsset, setPreviewAsset] = useState<{ file_path: string; file_type?: string } | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState<{ [key: number]: boolean }>({});
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 5;


  const handleViewDetail = (item: BaseItem) => {
    // Navigate to dedicated show page
    if (type === 'complaints') {
      router.visit(route('admin.complaints.show', item.id));
    } else {
      router.visit(route('admin.feedbacks.show', item.id));
    }
  };

  const openPreview = (asset: { file_path: string; file_type?: string }) => {
    setPreviewAsset(asset);
  };

  const closePreview = () => {
    setPreviewAsset(null);
  };

  const handleStatusChange = async (itemId: number, newStatus: string) => {
    // Mark this item as updating
    setUpdatingStatus(prev => ({ ...prev, [itemId]: true }));

    try {
      // Build the route URL
      const route = type === 'complaints'
        ? `/admin/complaints/${itemId}`
        : `/admin/feedbacks/${itemId}/status`;

      // Send the update request
      await router.put(route, {
        status_id: newStatus,
      }, {
        preserveScroll: true,
        preserveState: true,
        onSuccess: () => {
          setUpdatingStatus(prev => ({ ...prev, [itemId]: false }));
        },
        onError: () => {
          setUpdatingStatus(prev => ({ ...prev, [itemId]: false }));
        },
      });
    } catch (error) {
      console.error('Error updating status:', error);
      setUpdatingStatus(prev => ({ ...prev, [itemId]: false }));
    }
  };

  // Filter items
  const filteredItems = items.filter(item => {
    const matchesStatus = filterStatus === 'all' || item.status === filterStatus;
    const itemName = isReport(item, type)
      ? (item.reporter_name || item.user?.name || '')
      : (item.sender_name || item.user?.name || '');
    const itemEmail = item.user?.email || '';
    const matchesSearch = searchTerm === '' ||
      itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      itemEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.category || '').toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  // Pagination logic
  const totalItems = filteredItems.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedItems = filteredItems.slice(startIndex, endIndex);

  // Reset to first page when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [filterStatus, searchTerm]);

  // Esc closes the preview overlay — it is a modal, so it needs a keyboard exit.
  React.useEffect(() => {
    if (!previewAsset) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setPreviewAsset(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [previewAsset]);

  const getItemDisplayName = (item: BaseItem): string => {
    if (isReport(item, type)) {
      return item.reporter_name || item.user?.name || 'Anonim';
    }
    return item.sender_name || item.user?.name || 'Anonim';
  };

  const getItemPhone = (item: BaseItem): string => {
    if (isReport(item, type)) {
      return item.reporter_phone || '-';
    }
    return item.sender_phone || '-';
  };

  const getItemCategory = (item: BaseItem): string => {
    if (!item.category) return '-';
    // Remove patterns like '[Dari: Someone]' that may be included in category
    // Also remove any trailing/leading brackets and extra whitespace
    return item.category.replace(/\[Dari:\s*[^\]]+\]/gi, '').replace(/[\[\]]/g, '').trim() || '-';
  };

  const getItemAssets = (item: BaseItem): MediaItem[] => {
    if (isReport(item, type)) {
      return item.images || [];
    }
    return item.assets || [];
  };

  const getItemEmail = (item: BaseItem): string => {
    // For guest users, check the email field directly
    // For registered users, use user.email
    if (isReport(item, type)) {
      return item.email || item.user?.email || '-';
    }
    return item.email || item.user?.email || '-';
  };

  const getItemSubject = (item: BaseItem): string =>
    isReport(item, type)
      ? (item.reportable_type === 'App\\Models\\FoPoint' ? 'Fiber Optik' : 'Menara')
      : (item.feedbackable_type === 'App\\Models\\FoPoint' ? 'Fiber Optik' : 'Menara');

  /* The stat tiles, folded into the control they were describing. Counts are
     over `items`, exactly as the three cards computed them. */
  const statusSegments = [
    { value: 'all', label: 'Semua', count: items.length },
    { value: 'pending', label: 'Baru', count: items.filter(r => r.status === 'pending').length },
    { value: 'in_progress', label: 'Progress', count: items.filter(r => r.status === 'in_progress').length },
    { value: 'closed', label: 'Selesai', count: items.filter(r => r.status === 'closed').length },
  ];

  const isFiltered = Boolean(searchTerm) || filterStatus !== 'all';

  const resetFilters = () => {
    setSearchTerm('');
    setFilterStatus('all');
  };

  /* Which page buttons to print: first, last, current and its neighbours. */
  const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <>
      <Card padding="none" className="overflow-hidden tt-enter-up">
        {/* TOOLBAR — search and the status facet, on the inset ground. --------- */}
        <div className="flex flex-col gap-3 border-b border-border bg-well px-3 py-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full lg:max-w-sm">
            <label htmlFor="messages-search" className="sr-only">
              Cari {title.toLowerCase()}
            </label>
            <svg
              className="pointer-events-none absolute inset-y-0 left-3 my-auto h-4 w-4 text-placeholder"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              id="messages-search"
              type="text"
              placeholder="Cari berdasarkan nama, pesan, kategori..."
              className="h-11 w-full rounded-md border border-input bg-background pl-9 pr-10 text-sm text-foreground placeholder:text-placeholder transition-colors duration-140 ease-state hover:border-border-strong focus:outline-none focus-visible:outline-none focus:border-ring focus:ring"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                aria-label="Hapus kata kunci"
                className="absolute inset-y-0 right-0 flex w-10 items-center justify-center rounded-md text-placeholder transition-colors duration-140 ease-state hover:text-foreground focus-visible:outline-none focus-visible:ring"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {/* The three stat cards, now a filter. The count IS the statistic. */}
          <div
            role="group"
            aria-label="Filter status"
            className="flex flex-wrap items-center gap-1 rounded-md border border-border bg-background p-1"
          >
            {statusSegments.map((segment) => {
              const active = filterStatus === segment.value;
              return (
                <button
                  key={segment.value}
                  type="button"
                  onClick={() => setFilterStatus(segment.value)}
                  aria-pressed={active}
                  className={cn(
                    'flex h-9 flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded px-3 text-sm font-medium',
                    'transition-colors duration-140 ease-state',
                    'focus-visible:outline-none focus-visible:ring focus-visible:ring-offset-1',
                    active
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                  )}
                >
                  <span>{segment.label}</span>
                  <span
                    className={cn(
                      'tabular-nums',
                      active ? 'text-primary-foreground/80' : 'text-foreground',
                    )}
                  >
                    {segment.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {paginatedItems.length === 0 ? (
          /* EMPTY STATE — the one place 24px padding is warranted. ----------- */
          <div className="bg-well p-6 text-center">
            <svg className="mx-auto mb-3 h-10 w-10 text-placeholder" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
            <h3 className="text-base font-semibold tracking-tight text-foreground">
              {isFiltered
                ? `Tidak ada ${title.toLowerCase()} yang sesuai dengan filter`
                : `Belum ada ${title.toLowerCase()} yang masuk`
              }
            </h3>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {isFiltered
                ? 'Coba ubah filter atau kata kunci pencarian'
                : `${title} dari masyarakat akan muncul di sini`
              }
            </p>
            {isFiltered && (
              <Button onClick={resetFilters} variant="outline" className="mt-4 h-11">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Reset Filter
              </Button>
            )}
          </div>
        ) : (
          <>
            {/* DESKTOP TABLE ------------------------------------------------- */}
            <div className="hidden overflow-x-auto lg:block">
              <table className="w-full table-fixed">
                <thead>
                  {/* 40px, inset ground, and a strong rule under it so the head
                      separates from the body without a second background. */}
                  <tr className="h-10 border-b border-border-strong bg-well text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    <th scope="col" className="w-[21%] px-3 text-left">Pelapor</th>
                    <th scope="col" className="w-[30%] px-3 text-left">
                      {type === 'complaints' ? 'Keluhan' : 'Masukan'}
                    </th>
                    <th scope="col" className="w-[11%] px-3 text-left">Type</th>
                    <th scope="col" className="w-[11%] px-3 text-left">Visibilitas</th>
                    <th scope="col" className="w-[13%] px-3 text-left">Status</th>
                    <th scope="col" className="w-[9%] px-3 text-left">Tanggal</th>
                    <th scope="col" className="w-[5%] px-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/70 bg-card">
                  {paginatedItems.map((item) => (
                    <tr key={item.id} className="transition-colors duration-140 ease-state hover:bg-accent">
                      {/* Pelapor now carries name, email and phone: the old
                          Email column was a third of a person's identity in a
                          column of its own. */}
                      <td className="px-3 py-2.5 align-top">
                        <div className="flex min-h-[36px] items-start gap-2">
                          <span className="mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground">
                            {getItemDisplayName(item).charAt(0).toUpperCase()}
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="truncate text-sm font-medium text-foreground" title={getItemDisplayName(item)}>
                              {getItemDisplayName(item)}
                            </div>
                            <div className="truncate text-xs text-muted-foreground" title={getItemEmail(item)}>
                              {getItemEmail(item)}
                            </div>
                            <div className="truncate text-xs text-placeholder" title={getItemPhone(item)}>
                              {getItemPhone(item)}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="px-3 py-2.5 align-top">
                        <div className="truncate text-sm font-medium text-foreground" title={getItemCategory(item)}>
                          {getItemCategory(item)}
                        </div>
                        <p className="line-clamp-2 text-xs text-muted-foreground">
                          {item.message}
                        </p>
                        <MediaStrip
                          assets={getItemAssets(item)}
                          limit={4}
                          size="h-8 w-8"
                          onOpen={openPreview}
                        />
                      </td>

                      <td className="px-3 py-2.5 align-top">
                        <Badge variant="neutral">{getItemSubject(item)}</Badge>
                      </td>

                      <td className="px-3 py-2.5 align-top">
                        <VisibilityBadge isPublic={item.is_public} />
                      </td>

                      <td className="px-3 py-2.5 align-top">
                        <MessageStatusSelect
                          status={item.status}
                          busy={Boolean(updatingStatus[item.id])}
                          onChange={(next) => handleStatusChange(item.id, next)}
                        />
                      </td>

                      <td className="px-3 py-2.5 align-top text-xs tabular-nums text-muted-foreground">
                        {item.created_at ? (
                          <>
                            <div>{formatDateFull(item.created_at).split(',')[0]}</div>
                            <div className="text-placeholder">{formatDateFull(item.created_at).split(',')[1]?.trim()}</div>
                          </>
                        ) : (
                          <div>-</div>
                        )}
                      </td>

                      <td className="px-3 py-2.5 align-top">
                        <div className="flex justify-end">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleViewDetail(item)}
                            className="h-9 px-2.5"
                            title="Detail"
                          >
                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            <span className="sr-only xl:not-sr-only">Detail</span>
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* MOBILE LIST — same data, same page window. -------------------- */}
            <div className="divide-y divide-border/70 lg:hidden">
              {paginatedItems.map((item) => (
                <div key={item.id} className="p-3">
                  <div className="flex items-start gap-2">
                    <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary text-sm font-medium text-primary-foreground">
                      {getItemDisplayName(item).charAt(0).toUpperCase()}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium text-foreground" title={getItemDisplayName(item)}>
                        {getItemDisplayName(item)}
                      </div>
                      <div className="truncate text-xs text-muted-foreground" title={getItemEmail(item)}>
                        {getItemEmail(item)}
                      </div>
                      <div className="truncate text-xs text-placeholder" title={getItemPhone(item)}>
                        {getItemPhone(item)}
                      </div>
                    </div>
                    <div className="w-[124px] flex-shrink-0">
                      <MessageStatusSelect
                        status={item.status}
                        busy={Boolean(updatingStatus[item.id])}
                        onChange={(next) => handleStatusChange(item.id, next)}
                      />
                    </div>
                  </div>

                  <div className="mt-2">
                    <div className="truncate text-sm font-medium text-foreground" title={getItemCategory(item)}>
                      {getItemCategory(item)}
                    </div>
                    <p className="line-clamp-3 text-sm text-muted-foreground">{item.message}</p>
                    <MediaStrip
                      assets={getItemAssets(item)}
                      limit={5}
                      size="h-12 w-12"
                      onOpen={openPreview}
                    />
                  </div>

                  <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1.5">
                    <Badge variant="neutral">{getItemSubject(item)}</Badge>
                    <VisibilityBadge isPublic={item.is_public} />
                    <span className="text-xs tabular-nums text-muted-foreground">
                      {item.created_at ? formatDateFull(item.created_at) : '-'}
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleViewDetail(item)}
                      className="ml-auto h-9"
                    >
                      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      Detail
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {/* FOOTER — the count and the pager were two stacked Cards. One bar. */}
            <div className="flex flex-col gap-2 border-t border-border bg-well px-3 py-2 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-muted-foreground">
                Menampilkan{' '}
                <span className="font-semibold tabular-nums text-foreground">
                  {startIndex + 1}-{Math.min(endIndex, totalItems)}
                </span>{' '}
                dari <span className="font-semibold tabular-nums text-foreground">{totalItems}</span> total{' '}
                {title.toLowerCase()}
                {totalItems !== items.length && (
                  <span className="font-medium text-info-strong"> (terfilter)</span>
                )}
              </p>

              {totalPages > 1 && (
                <nav aria-label="Navigasi halaman" className="flex flex-wrap items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    aria-label="Halaman sebelumnya"
                    className={cn(
                      'flex h-11 w-11 items-center justify-center rounded-md border text-sm font-medium',
                      'transition-colors duration-140 ease-state',
                      'focus-visible:outline-none focus-visible:ring focus-visible:ring-offset-2',
                      currentPage === 1
                        ? 'cursor-not-allowed border-border bg-muted text-placeholder'
                        : 'border-input bg-background text-foreground hover:bg-accent hover:text-accent-foreground',
                    )}
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>

                  {pageNumbers.map((page) => {
                    // First, last, current and its immediate neighbours.
                    const showPage = page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1;

                    if (!showPage) {
                      if (page === 2 && currentPage > 4) {
                        return (
                          <span key={page} className="px-1 text-sm text-muted-foreground" aria-hidden="true">
                            ...
                          </span>
                        );
                      }
                      if (page === totalPages - 1 && currentPage < totalPages - 3) {
                        return (
                          <span key={page} className="px-1 text-sm text-muted-foreground" aria-hidden="true">
                            ...
                          </span>
                        );
                      }
                      return null;
                    }

                    const active = page === currentPage;
                    return (
                      <button
                        key={page}
                        type="button"
                        onClick={() => setCurrentPage(page)}
                        aria-label={`Halaman ${page}`}
                        aria-current={active ? 'page' : undefined}
                        className={cn(
                          'h-11 min-w-11 rounded-md border px-3 text-sm font-medium tabular-nums',
                          'transition-colors duration-140 ease-state',
                          'focus-visible:outline-none focus-visible:ring focus-visible:ring-offset-2',
                          active
                            ? 'border-primary bg-primary text-primary-foreground hover:bg-primary-hover'
                            : 'border-input bg-background text-foreground hover:bg-accent hover:text-accent-foreground',
                        )}
                      >
                        {page}
                      </button>
                    );
                  })}

                  <button
                    type="button"
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    aria-label="Halaman berikutnya"
                    className={cn(
                      'flex h-11 w-11 items-center justify-center rounded-md border text-sm font-medium',
                      'transition-colors duration-140 ease-state',
                      'focus-visible:outline-none focus-visible:ring focus-visible:ring-offset-2',
                      currentPage === totalPages
                        ? 'cursor-not-allowed border-border bg-muted text-placeholder'
                        : 'border-input bg-background text-foreground hover:bg-accent hover:text-accent-foreground',
                    )}
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </nav>
              )}
            </div>
          </>
        )}
      </Card>

      {/* ASSET PREVIEW ------------------------------------------------------ */}
      {previewAsset && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Pratinjau lampiran"
          className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/90 p-4"
          onClick={closePreview}
        >
          <div className="tt-enter-scale flex max-h-[90vh] w-full max-w-4xl items-center justify-center">
            {previewAsset.file_type === 'video' ? (
              <video
                src={getMediaUrl(previewAsset.file_path)}
                controls
                autoPlay
                className="max-h-[90vh] max-w-full object-contain"
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <img
                src={getMediaUrl(previewAsset.file_path)}
                alt="Pratinjau lampiran"
                className="max-h-[90vh] max-w-full object-contain"
                onClick={(e) => e.stopPropagation()}
              />
            )}
          </div>
          <button
            type="button"
            aria-label="Tutup pratinjau"
            className="absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-md bg-background/10 text-white transition-colors duration-140 ease-state hover:bg-background/25 focus-visible:outline-none focus-visible:ring focus-visible:ring-offset-2"
            onClick={closePreview}
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}
    </>
  );
};

export default ManagementTable;
