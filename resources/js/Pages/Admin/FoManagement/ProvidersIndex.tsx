import React, { useState } from 'react';
import { AnimatePresence } from 'motion/react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import PageHeader from '@/Components/PageHeader';
import { useBodyScrollLock } from '@/Hooks/useBodyScrollLock';
import ModalBackdrop from '@/Components/ModalBackdrop';
import ModalContainer from '@/Components/ModalContainer';
import { Button } from '@/Components/ui/button';
import { Badge } from '@/Components/ui/badge';
import { Card } from '@/Components/ui/card';
import { cn } from '@/lib/utils';

interface Provider {
  id: number;
  name: string;
  description?: string;
  default_sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  points_count?: number;
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
  providers: Provider[];
  flash?: {
    success?: string;
    error?: string;
  };
  errors?: {
    provider?: string;
  };
  csrfToken: string;
  [key: string]: any;
}

/**
 * Shared control recipe for the inputs in this page's filter bar and modals.
 * h-11 = 44px touch target; the single 3px token ring, never ring-2.
 */
const FIELD_CLASS =
  'block h-11 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground placeholder:text-placeholder transition-colors duration-140 ease-state focus-visible:outline-none focus-visible:ring focus-visible:ring-offset-2';

/** Textarea needs its own height, so it gets the recipe without h-11. */
const TEXTAREA_CLASS =
  'block w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-placeholder transition-colors duration-140 ease-state focus-visible:outline-none focus-visible:ring focus-visible:ring-offset-2';

const LABEL_CLASSES = 'mb-1 block text-xs font-medium text-muted-foreground';
const MODAL_LABEL_CLASSES = 'mb-1 block text-sm font-medium text-foreground';

/** Header cell recipe — one string for every column on the page. */
const TH_CLASSES = 'h-10 px-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground';
/** Body cell recipe — 12px horizontal, rows land on 44px. */
const TD_CLASSES = 'px-3 py-2 align-middle';

/** 40px card head on the inset ground, strong bottom rule. */
const TableHead = ({ title, meta }: { title: string; meta: string }) => (
  <div className="flex min-h-[40px] flex-wrap items-center justify-between gap-x-3 gap-y-1 border-b border-border-strong bg-well px-3 py-2">
    <h2 className="text-sm font-semibold text-foreground">{title}</h2>
    <span className="text-xs tabular-nums text-muted-foreground">{meta}</span>
  </div>
);

/** Stat tile: figure, label, no icon disc. */
const StatTile = ({ label, value, toneClass, index }: {
  label: string;
  value: number;
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
    </p>
  </Card>
);

/** One empty state, used by both the desktop table and the mobile list. */
const EmptyProviders = () => (
  <div className="flex flex-col items-center justify-center gap-2 p-6 text-center">
    <svg className="h-8 w-8 text-placeholder" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
    <p className="text-sm font-medium text-foreground">Tidak ada provider ditemukan</p>
    <p className="max-w-sm text-sm text-muted-foreground">Coba ubah filter atau tambah provider baru</p>
  </div>
);

export default function ProvidersIndex() {
  const { props } = usePage<PageProps>();
  const { providers, auth, flash, errors } = props;

  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState<{ provider: Provider; isUsed: boolean } | null>(null);
  const [deleteAction, setDeleteAction] = useState<'deactivate' | 'delete'>('deactivate');
  const [showRestoreModal, setShowRestoreModal] = useState<Provider | null>(null);
  const [showEditModal, setShowEditModal] = useState<Provider | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState<Provider | null>(null);
  const [editForm, setEditForm] = useState({
    name: '',
    description: '',
    default_sort_order: 0,
    is_active: true,
  });
  const [createForm, setCreateForm] = useState({
    name: '',
    description: '',
    default_sort_order: 0,
    is_active: true,
  });

  const canEdit = ['admin', 'operator'].includes(auth.user.role);

  // Prevent body scroll saat modal terbuka
  const isAnyModalOpen = Boolean(showEditModal || showDetailModal || showCreateModal || showDeleteModal || showRestoreModal);
  useBodyScrollLock(isAnyModalOpen);

  // Filter providers
  const filteredProviders = providers.filter(provider => {
    // Status filter
    if (filterStatus === 'active' && !provider.is_active) return false;
    if (filterStatus === 'inactive' && provider.is_active) return false;

    // Search filter
    if (searchQuery && !provider.name.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }

    return true;
  });

  // Sort by default_sort_order then name
  const sortedProviders = [...filteredProviders].sort((a, b) => {
    if (a.default_sort_order !== b.default_sort_order) {
      return a.default_sort_order - b.default_sort_order;
    }
    return a.name.localeCompare(b.name);
  });

  const handleDelete = (provider: Provider) => {
    // Jika provider sudah nonaktif, tidak lakukan apa-apa
    if (!provider.is_active) {
      return; // Skip dialog untuk provider nonaktif
    }

    const pointsCount = provider.points_count || 0;
    const isUsed = pointsCount > 0;

    setShowDeleteModal({ provider, isUsed });
    setDeleteAction(isUsed ? 'deactivate' : 'delete');
  };

  const handleRestore = (provider: Provider) => {
    setShowRestoreModal(provider);
  };

  const confirmRestore = () => {
    if (!showRestoreModal) return;

    router.put(route('admin.fo-management.providers.update', showRestoreModal.id), {
      ...showRestoreModal,
      is_active: true,
    }, {
      onSuccess: () => {
        setShowRestoreModal(null);
      },
      onError: () => {
        setShowRestoreModal(null);
      }
    });
  };

  const confirmDelete = () => {
    if (!showDeleteModal) return;

    const { provider } = showDeleteModal;

    if (deleteAction === 'deactivate') {
      // Soft delete: set is_active = false
      router.put(route('admin.fo-management.providers.update', provider.id), {
        ...provider,
        is_active: false,
      }, {
        onSuccess: () => {
          setShowDeleteModal(null);
        },
        onError: () => {
          setShowDeleteModal(null);
        }
      });
    } else {
      // Hard delete
      router.delete(route('admin.fo-management.providers.destroy', provider.id), {
        onSuccess: () => {
          setShowDeleteModal(null);
        },
        onError: () => {
          setShowDeleteModal(null);
        }
      });
    }
  };

  const stats = {
    total: providers.length,
    active: providers.filter(p => p.is_active).length,
    inactive: providers.filter(p => !p.is_active).length,
  };

  const openEdit = (provider: Provider) => {
    setEditForm({
      name: provider.name,
      description: provider.description || '',
      default_sort_order: provider.default_sort_order,
      is_active: provider.is_active,
    });
    setShowEditModal(provider);
  };

  /**
   * Row actions. The destructive control keeps its token, its icon AND an
   * explicit verb — it used to be an unlabelled red trash glyph, which is the
   * one place colour alone was carrying "dangerous".
   */
  const RowActions = ({ provider, className, showDetail }: {
    provider: Provider;
    className?: string;
    showDetail?: boolean;
  }) => (
    <div className={cn('flex flex-wrap items-center gap-1', className)}>
      {showDetail && (
        <Button
          variant="ghost"
          size="sm"
          className="h-11"
          onClick={() => setShowDetailModal(provider)}
          title="Lihat Detail"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
          Detail
        </Button>
      )}

      <Button
        variant="ghost"
        size="sm"
        className="h-11"
        onClick={() => openEdit(provider)}
        title="Edit Provider"
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
        Edit
      </Button>

      {/* Restore/Delete Button - Saling menggantikan berdasarkan status */}
      {!provider.is_active ? (
        <Button
          variant="ghost"
          size="sm"
          className="h-11 text-success-strong hover:bg-success-soft hover:text-success-strong"
          onClick={() => handleRestore(provider)}
          title="Aktifkan Kembali Provider"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Aktifkan
        </Button>
      ) : (
        /* Semantic red: destructive action, kept red on destructive tokens. */
        <Button
          variant="ghost"
          size="sm"
          className="h-11 text-destructive hover:bg-destructive-soft hover:text-destructive-strong"
          onClick={() => handleDelete(provider)}
          title="Nonaktifkan/Hapus Provider"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          <span className="truncate">Nonaktifkan</span>
        </Button>
      )}
    </div>
  );

  return (
    <AdminLayout title="Manajemen Provider">
      <Head title="Manajemen Provider" />

      <div className="space-y-4 sm:space-y-5">
        {/* Flash Messages */}
        {flash?.success && (
          <div className="flex items-center gap-2 rounded-md border border-success-border bg-success-soft px-3 py-2 text-sm text-success-strong">
            <svg className="h-4 w-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            {flash.success}
          </div>
        )}

        {/* Semantic red: a failed action. Stays red, on destructive tokens. */}
        {flash?.error && (
          <div className="flex items-center gap-2 rounded-md border border-destructive-border bg-destructive-soft px-3 py-2 text-sm text-destructive-strong">
            <svg className="h-4 w-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            {flash.error}
          </div>
        )}

        {/* Semantic red: validation error. */}
        {errors?.provider && (
          <div className="flex items-center gap-2 rounded-md border border-destructive-border bg-destructive-soft px-3 py-2 text-sm text-destructive-strong">
            <svg className="h-4 w-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {errors.provider}
          </div>
        )}

        {/*
          Was a HeroSection band; the page header is now type plus a hairline
          rule and owns the only action zone on the screen.
        */}
        <PageHeader
          title="Manajemen Provider"
          description="Kelola master provider untuk titik-titik FO"
          showLogo={false}
          className="mb-0 pb-4"
          actions={
            canEdit ? (
              <>
                <Button asChild variant="outline" className="h-11">
                  <Link href={route('admin.fo-management.routes.list')}>
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    Kembali ke Jalur
                  </Link>
                </Button>
                {/* Brand chrome: was gold on deep red. Now the page's primary action. */}
                <Button
                  className="h-11"
                  onClick={() => {
                    // Get max sort order for new provider
                    const maxSortOrder = providers.length > 0
                      ? Math.max(...providers.map(p => p.default_sort_order))
                      : 0;
                    setCreateForm({
                      name: '',
                      description: '',
                      default_sort_order: maxSortOrder + 1,
                      is_active: true,
                    });
                    setShowCreateModal(true);
                  }}
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Tambah Provider
                </Button>
              </>
            ) : null
          }
        />

        {/* Stats: three real counts, no 48px icon tiles. */}
        <div className="grid grid-cols-3 gap-3">
          <StatTile index={0} label="Total Provider" value={stats.total} />
          <StatTile index={1} label="Aktif" value={stats.active} toneClass="text-success-strong" />
          <StatTile index={2} label="Nonaktif" value={stats.inactive} />
        </div>

        {/* Filters and Search — one inset rail, two controls. */}
        <Card variant="well" padding="dense">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="search" className={LABEL_CLASSES}>Cari Provider</label>
              <div className="relative">
                <input
                  type="text"
                  id="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari berdasarkan nama..."
                  className={cn(FIELD_CLASS, 'pl-9')}
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
              <label htmlFor="status" className={LABEL_CLASSES}>Filter Status</label>
              <select
                id="status"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as 'all' | 'active' | 'inactive')}
                className={FIELD_CLASS}
              >
                <option value="all">Semua Status</option>
                <option value="active">Aktif</option>
                <option value="inactive">Nonaktif</option>
              </select>
            </div>
          </div>
        </Card>

        {/* Providers Table */}
        <Card padding="none">
          <TableHead title="Daftar Provider" meta={`${sortedProviders.length} dari ${stats.total} provider`} />

          {sortedProviders.length > 0 ? (
            <>
              {/* Desktop Table - Semua Kolom */}
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border-strong bg-well">
                      <th scope="col" className={TH_CLASSES}>Nama Provider</th>
                      <th scope="col" className={TH_CLASSES}>Deskripsi</th>
                      <th scope="col" className={TH_CLASSES}>Status</th>
                      <th scope="col" className={cn(TH_CLASSES, 'text-right')}>Jumlah Titik FO</th>
                      <th scope="col" className={cn(TH_CLASSES, 'text-right')}>Urutan</th>
                      {canEdit && (
                        <th scope="col" className={cn(TH_CLASSES, 'text-right')}>Aksi</th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/70">
                    {sortedProviders.map((provider) => (
                      <tr key={provider.id} className="transition-colors duration-140 ease-state hover:bg-well/60">
                        <td className={cn(TD_CLASSES, 'max-w-[220px]')}>
                          <div className="truncate text-sm font-medium text-foreground" title={provider.name}>
                            {provider.name}
                          </div>
                        </td>
                        <td className={cn(TD_CLASSES, 'max-w-[360px]')}>
                          <div className="truncate text-sm text-muted-foreground" title={provider.description || '-'}>
                            {provider.description || '-'}
                          </div>
                        </td>
                        <td className={cn(TD_CLASSES, 'whitespace-nowrap')}>
                          <Badge variant={provider.is_active ? 'success' : 'neutral'}>
                            {provider.is_active ? 'Aktif' : 'Nonaktif'}
                          </Badge>
                        </td>
                        <td className={cn(TD_CLASSES, 'whitespace-nowrap text-right text-sm tabular-nums text-foreground')}>
                          {provider.points_count || 0} titik
                        </td>
                        <td className={cn(TD_CLASSES, 'whitespace-nowrap text-right text-sm tabular-nums text-muted-foreground')}>
                          {provider.default_sort_order}
                        </td>
                        {canEdit && (
                          <td className={cn(TD_CLASSES, 'whitespace-nowrap')}>
                            <RowActions provider={provider} className="justify-end" />
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile list - nama + status, sisa kolom lewat Detail */}
              <ul className="divide-y divide-border/70 md:hidden">
                {sortedProviders.map((provider) => (
                  <li key={provider.id} className="p-3">
                    <div className="flex items-start justify-between gap-2">
                      <span className="truncate text-sm font-medium text-foreground" title={provider.name}>
                        {provider.name}
                      </span>
                      <Badge variant={provider.is_active ? 'success' : 'neutral'}>
                        {provider.is_active ? 'Aktif' : 'Nonaktif'}
                      </Badge>
                    </div>
                    {canEdit && <RowActions provider={provider} showDetail className="mt-2" />}
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <EmptyProviders />
          )}
        </Card>
      </div>

      {/* Create Provider Modal */}
      {/* AnimatePresence keeps the tree alive for the leave animation; without it React unmounts on the same paint and the dialog cuts out. */}
      <AnimatePresence>
      {showCreateModal && (
        <ModalBackdrop
          onClick={() => {
            setShowCreateModal(false);
            setCreateForm({ name: '', description: '', default_sort_order: 0, is_active: true });
          }}
          opacity={50}
          zIndex={50}
        >
          <ModalContainer maxWidth="2xl" maxHeight="90vh" className="my-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex flex-shrink-0 items-center justify-between gap-2 border-b border-border-strong bg-well px-4 py-2.5">
              <h3 className="flex items-center gap-2 text-base font-semibold tracking-tight text-foreground">
                <svg className="h-4 w-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Tambah Provider Baru
              </h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setShowCreateModal(false);
                  setCreateForm({ name: '', description: '', default_sort_order: 0, is_active: true });
                }}
                className="h-11 w-11 flex-shrink-0 text-muted-foreground"
                title="Tutup"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </Button>
            </div>
            <div
              className="min-h-0 flex-1 overflow-y-auto p-4"
              style={{
                maxHeight: 'calc(100vh - 12rem)',
                WebkitOverflowScrolling: 'touch',
                overscrollBehavior: 'contain'
              }}
            >
              <form onSubmit={(e) => {
                e.preventDefault();
                router.post(route('admin.fo-management.providers.store'), createForm, {
                  onSuccess: () => {
                    setShowCreateModal(false);
                    setCreateForm({ name: '', description: '', default_sort_order: 0, is_active: true });
                  },
                });
              }} className="space-y-4">
                <div>
                  <label className={MODAL_LABEL_CLASSES}>
                    {/* Semantic red: required-field marker. */}
                    Nama Provider <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="text"
                    value={createForm.name}
                    onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                    className={FIELD_CLASS}
                    placeholder="Masukkan nama provider"
                    required
                  />
                </div>

                <div>
                  <label className={MODAL_LABEL_CLASSES}>Deskripsi</label>
                  <textarea
                    value={createForm.description}
                    onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                    className={cn(TEXTAREA_CLASS, 'resize-none')}
                    placeholder="Masukkan deskripsi provider (opsional)"
                    rows={4}
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className={MODAL_LABEL_CLASSES}>Urutan Sort</label>
                    <input
                      type="number"
                      value={createForm.default_sort_order}
                      onChange={(e) => setCreateForm({ ...createForm, default_sort_order: parseInt(e.target.value) || 0 })}
                      className={FIELD_CLASS}
                      placeholder="0"
                      min="0"
                    />
                  </div>

                  <div>
                    <label className={MODAL_LABEL_CLASSES}>Status</label>
                    <select
                      value={createForm.is_active ? 'active' : 'inactive'}
                      onChange={(e) => setCreateForm({ ...createForm, is_active: e.target.value === 'active' })}
                      className={FIELD_CLASS}
                    >
                      <option value="active">Aktif</option>
                      <option value="inactive">Nonaktif</option>
                    </select>
                  </div>
                </div>

                <div className="flex flex-col justify-end gap-2 border-t border-border/70 pt-4 sm:flex-row">
                  <Button
                    type="button"
                    variant="outline"
                    className="h-11 w-full sm:w-auto"
                    onClick={() => {
                      setShowCreateModal(false);
                      setCreateForm({ name: '', description: '', default_sort_order: 0, is_active: true });
                    }}
                  >
                    Batal
                  </Button>
                  <Button type="submit" className="h-11 w-full sm:w-auto">
                    Tambah Provider
                  </Button>
                </div>
              </form>
            </div>
          </ModalContainer>
        </ModalBackdrop>
      )}
      </AnimatePresence>

      {/* Edit Provider Modal */}
      {/* AnimatePresence keeps the tree alive for the leave animation; without it React unmounts on the same paint and the dialog cuts out. */}
      <AnimatePresence>
      {showEditModal && (
        <ModalBackdrop
          onClick={() => {
            setShowEditModal(null);
            setEditForm({ name: '', description: '', default_sort_order: 0, is_active: true });
          }}
          opacity={50}
          zIndex={50}
        >
          <ModalContainer maxWidth="2xl" maxHeight="90vh" className="my-4" onClick={(e) => e.stopPropagation()}>
            {/* Brand chrome: the old red gradient header band is now the inset ground. */}
            <div className="flex flex-shrink-0 items-center justify-between gap-2 border-b border-border-strong bg-well px-4 py-2.5">
              <h3 className="flex items-center gap-2 text-base font-semibold tracking-tight text-foreground">
                <svg className="h-4 w-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit Provider
              </h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setShowEditModal(null);
                  setEditForm({ name: '', description: '', default_sort_order: 0, is_active: true });
                }}
                className="h-11 w-11 flex-shrink-0 text-muted-foreground"
                title="Tutup"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </Button>
            </div>
            <div
              className="min-h-0 flex-1 overflow-y-auto p-4"
              style={{
                maxHeight: 'calc(100vh - 12rem)',
                WebkitOverflowScrolling: 'touch',
                overscrollBehavior: 'contain'
              }}
            >
              <form onSubmit={(e) => {
                e.preventDefault();
                router.put(route('admin.fo-management.providers.update', showEditModal.id), editForm, {
                  onSuccess: () => {
                    setShowEditModal(null);
                    setEditForm({ name: '', description: '', default_sort_order: 0, is_active: true });
                  },
                });
              }} className="space-y-4">
                <div>
                  <label className={MODAL_LABEL_CLASSES}>
                    {/* Semantic red: required-field marker. */}
                    Nama Provider <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className={FIELD_CLASS}
                    placeholder="Masukkan nama provider"
                    required
                  />
                </div>

                <div>
                  <label className={MODAL_LABEL_CLASSES}>Deskripsi</label>
                  <textarea
                    value={editForm.description}
                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                    className={cn(TEXTAREA_CLASS, 'resize-none')}
                    placeholder="Masukkan deskripsi provider (opsional)"
                    rows={4}
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className={MODAL_LABEL_CLASSES}>Urutan Sort</label>
                    <input
                      type="number"
                      value={editForm.default_sort_order}
                      onChange={(e) => setEditForm({ ...editForm, default_sort_order: parseInt(e.target.value) || 0 })}
                      className={FIELD_CLASS}
                      placeholder="0"
                      min="0"
                    />
                  </div>

                  <div>
                    <label className={MODAL_LABEL_CLASSES}>Status</label>
                    <select
                      value={editForm.is_active ? 'active' : 'inactive'}
                      onChange={(e) => setEditForm({ ...editForm, is_active: e.target.value === 'active' })}
                      className={FIELD_CLASS}
                    >
                      <option value="active">Aktif</option>
                      <option value="inactive">Nonaktif</option>
                    </select>
                  </div>
                </div>

                <div className="flex flex-col justify-end gap-2 border-t border-border/70 pt-4 sm:flex-row">
                  <Button
                    type="button"
                    variant="outline"
                    className="h-11 w-full sm:w-auto"
                    onClick={() => {
                      setShowEditModal(null);
                      setEditForm({ name: '', description: '', default_sort_order: 0, is_active: true });
                    }}
                  >
                    Batal
                  </Button>
                  <Button type="submit" className="h-11 w-full sm:w-auto">
                    Update Provider
                  </Button>
                </div>
              </form>
            </div>
          </ModalContainer>
        </ModalBackdrop>
      )}
      </AnimatePresence>

      {/* Restore Confirmation Modal */}
      {/* AnimatePresence keeps the tree alive for the leave animation; without it React unmounts on the same paint and the dialog cuts out. */}
      <AnimatePresence>
      {showRestoreModal && (
        <ModalBackdrop onClick={() => setShowRestoreModal(null)} opacity={50} zIndex={50}>
          <ModalContainer maxWidth="md" maxHeight="90vh" className="p-5" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-start gap-3">
              <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-md border border-success-border bg-success-soft">
                <svg className="h-5 w-5 text-success-strong" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </span>
              <div className="min-w-0">
                <h3 className="text-base font-semibold tracking-tight text-foreground">Konfirmasi Aktifkan Provider</h3>
                <p className="mt-0.5 truncate text-sm text-muted-foreground" title={showRestoreModal.name}>
                  Provider: <span className="font-medium text-foreground">{showRestoreModal.name}</span>
                </p>
              </div>
            </div>

            <div className="mb-4 rounded-md border border-success-border bg-success-soft p-3">
              <p className="text-sm text-success-strong">
                Provider akan diaktifkan kembali dan akan muncul di dropdown saat menambah atau mengedit titik FO.
              </p>
              {showRestoreModal.points_count && showRestoreModal.points_count > 0 && (
                <p className="mt-1 text-xs text-success-strong">
                  Provider ini digunakan oleh {showRestoreModal.points_count} titik FO.
                </p>
              )}
            </div>

            <div className="flex flex-col justify-end gap-2 sm:flex-row">
              <Button variant="outline" className="h-11" onClick={() => setShowRestoreModal(null)}>
                Batal
              </Button>
              <Button variant="success" className="h-11" onClick={confirmRestore}>
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Aktifkan Provider
              </Button>
            </div>
          </ModalContainer>
        </ModalBackdrop>
      )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      {/* AnimatePresence keeps the tree alive for the leave animation; without it React unmounts on the same paint and the dialog cuts out. */}
      <AnimatePresence>
      {showDeleteModal && (
        <ModalBackdrop onClick={() => setShowDeleteModal(null)} opacity={50} zIndex={50}>
          <ModalContainer maxWidth="md" maxHeight="90vh" className="p-5" onClick={(e) => e.stopPropagation()}>
            {/* Semantic red throughout: this dialog confirms an irreversible action. */}
            <div className="mb-4 flex items-start gap-3">
              <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-md border border-destructive-border bg-destructive-soft">
                <svg className="h-5 w-5 text-destructive-strong" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </span>
              <div className="min-w-0">
                <h3 className="text-base font-semibold tracking-tight text-foreground">Konfirmasi Hapus Provider</h3>
                <p className="mt-0.5 truncate text-sm text-muted-foreground" title={showDeleteModal.provider.name}>
                  Provider: <span className="font-medium text-foreground">{showDeleteModal.provider.name}</span>
                </p>
              </div>
            </div>

            {showDeleteModal.isUsed ? (
              <div className="mb-4 rounded-md border border-warning-border bg-warning-soft p-3">
                <p className="text-sm font-medium text-warning-strong">
                  Provider ini masih digunakan oleh {showDeleteModal.provider.points_count || 0} titik FO.
                </p>
                <p className="mt-1 text-xs text-warning-strong">
                  Provider akan dinonaktifkan (tidak akan muncul di dropdown, tapi data tetap tersimpan).
                </p>
              </div>
            ) : (
              <div className="mb-4 rounded-md border border-destructive-border bg-destructive-soft p-3">
                <p className="text-sm text-destructive-strong">
                  Provider ini tidak digunakan oleh titik FO manapun. Data akan dihapus permanen dan tidak dapat dikembalikan.
                </p>
              </div>
            )}

            <div className="flex flex-col justify-end gap-2 sm:flex-row">
              <Button variant="outline" className="h-11" onClick={() => setShowDeleteModal(null)}>
                Batal
              </Button>
              <Button
                variant="destructive"
                onClick={confirmDelete}
                className={cn(
                  'h-11',
                  showDeleteModal.isUsed && 'bg-warning text-warning-foreground hover:bg-warning-strong',
                )}
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {showDeleteModal.isUsed ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  )}
                </svg>
                {showDeleteModal.isUsed ? 'Nonaktifkan Provider' : 'Hapus Permanen'}
              </Button>
            </div>
          </ModalContainer>
        </ModalBackdrop>
      )}
      </AnimatePresence>

      {/* Detail Modal - Mobile Only - Untuk lihat kolom tersembunyi */}
      {/* AnimatePresence keeps the tree alive for the leave animation; without it React unmounts on the same paint and the dialog cuts out. */}
      <AnimatePresence>
      {showDetailModal && (
        <ModalBackdrop onClick={() => setShowDetailModal(null)} opacity={50} zIndex={50} className="md:hidden">
          <ModalContainer maxWidth="sm" maxHeight="85vh" onClick={(e) => e.stopPropagation()}>
            {/* Brand chrome: the old red gradient header band is now the inset ground. */}
            <div className="flex flex-shrink-0 items-center justify-between gap-2 border-b border-border-strong bg-well px-4 py-2.5">
              <h3 className="flex items-center gap-2 text-base font-semibold tracking-tight text-foreground">
                <svg className="h-4 w-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Detail Provider
              </h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowDetailModal(null)}
                className="h-11 w-11 flex-shrink-0 text-muted-foreground"
                title="Tutup"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </Button>
            </div>
            <div
              className="min-h-0 flex-1 overflow-y-auto p-4"
              style={{
                maxHeight: 'calc(100vh - 12rem)',
                WebkitOverflowScrolling: 'touch',
                overscrollBehavior: 'contain'
              }}
            >
              <dl className="divide-y divide-border/70">
                {/* Nama Provider */}
                <div className="flex items-start justify-between gap-3 py-2">
                  <dt className="text-sm text-muted-foreground">Nama Provider</dt>
                  <dd className="min-w-0 text-right text-sm font-medium text-foreground">{showDetailModal.name}</dd>
                </div>

                {/* Deskripsi */}
                <div className="py-2">
                  <dt className="text-sm text-muted-foreground">Deskripsi</dt>
                  <dd className="mt-1 whitespace-pre-wrap text-sm text-foreground">{showDetailModal.description || '-'}</dd>
                </div>

                {/* Status */}
                <div className="flex items-center justify-between gap-3 py-2">
                  <dt className="text-sm text-muted-foreground">Status</dt>
                  <dd>
                    <Badge variant={showDetailModal.is_active ? 'success' : 'neutral'}>
                      {showDetailModal.is_active ? 'Aktif' : 'Nonaktif'}
                    </Badge>
                  </dd>
                </div>

                {/* Jumlah Titik FO */}
                <div className="flex items-center justify-between gap-3 py-2">
                  <dt className="text-sm text-muted-foreground">Jumlah Titik FO</dt>
                  <dd className="text-sm tabular-nums text-foreground">{showDetailModal.points_count || 0} titik</dd>
                </div>

                {/* Urutan */}
                <div className="flex items-center justify-between gap-3 py-2">
                  <dt className="text-sm text-muted-foreground">Urutan</dt>
                  <dd className="text-sm tabular-nums text-foreground">{showDetailModal.default_sort_order}</dd>
                </div>
              </dl>
            </div>
            <div className="flex-shrink-0 border-t border-border bg-well px-4 py-2.5">
              <Button
                variant="secondary"
                className="h-11 w-full"
                onClick={() => setShowDetailModal(null)}
              >
                Tutup
              </Button>
            </div>
          </ModalContainer>
        </ModalBackdrop>
      )}
      </AnimatePresence>
    </AdminLayout>
  );
}
