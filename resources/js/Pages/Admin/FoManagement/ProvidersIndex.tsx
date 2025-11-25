import React, { useState } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import HeroSection from '@/Components/HeroSection';
import { useBodyScrollLock } from '@/Hooks/useBodyScrollLock';
import ModalBackdrop from '@/Components/ModalBackdrop';
import ModalContainer from '@/Components/ModalContainer';

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

  return (
    <AdminLayout title="Manajemen Provider">
      <Head title="Manajemen Provider" />
      
      {/* Flash Messages */}
      {flash?.success && (
        <div className="mb-6 bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          {flash.success}
        </div>
      )}

      {flash?.error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
          {flash.error}
        </div>
      )}

      {errors?.provider && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {errors.provider}
        </div>
      )}

      {/* Hero Section */}
      <div className="mb-8">
        <HeroSection
          title="Manajemen Provider"
          subtitle="Kelola master provider untuk titik-titik FO"
          variant="brand"
          align="left"
          actions={
            canEdit ? (
              <div className="flex flex-col sm:flex-row gap-3">
                <Link
                  href={route('admin.fo-management.routes.list')}
                  className="inline-flex items-center justify-center px-4 py-2 bg-white/20 backdrop-blur-sm text-white font-medium rounded-lg hover:bg-white/30 transition-colors"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  Kembali ke Jalur
                </Link>
                <button
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
                  className="inline-flex items-center justify-center px-4 py-2 rounded-lg transition-colors shadow-sm"
                  style={{ 
                    backgroundColor: '#FFD700', 
                    color: '#B71C1C'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#FFC107';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#FFD700';
                  }}
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Tambah Provider
                </button>
              </div>
            ) : null
          }
        />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-700 font-medium">Total Provider</p>
              <p className="text-2xl font-bold text-blue-900">{stats.total}</p>
            </div>
            <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-700 font-medium">Aktif</p>
              <p className="text-2xl font-bold text-green-900">{stats.active}</p>
            </div>
            <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-700 font-medium">Nonaktif</p>
              <p className="text-2xl font-bold text-gray-900">{stats.inactive}</p>
            </div>
            <div className="w-12 h-12 bg-gray-500 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
              Cari Provider
            </label>
            <div className="relative">
              <input
                type="text"
                id="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari berdasarkan nama..."
                className="w-full px-4 py-2 pl-10 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all"
              />
              <svg className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
              Filter Status
            </label>
            <select
              id="status"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as 'all' | 'active' | 'inactive')}
              className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all appearance-none bg-white"
            >
              <option value="all">Semua Status</option>
              <option value="active">Aktif</option>
              <option value="inactive">Nonaktif</option>
            </select>
          </div>
        </div>
      </div>

      {/* Providers Table */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        {/* Desktop Table - Semua Kolom */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full divide-y divide-gray-200">
            <thead className="bg-gradient-to-r from-red-50 to-red-100">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Nama Provider
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Deskripsi
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Jumlah Titik FO
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Urutan
                </th>
                {canEdit && (
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Aksi
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedProviders.length > 0 ? (
                sortedProviders.map((provider) => (
                  <tr key={provider.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{provider.name}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-600 max-w-md truncate" title={provider.description || '-'}>
                        {provider.description || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        provider.is_active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {provider.is_active ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {provider.points_count || 0} titik
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-600">{provider.default_sort_order}</div>
                    </td>
                    {canEdit && (
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                          {/* Edit Button */}
                          <button
                            onClick={() => {
                              setEditForm({
                                name: provider.name,
                                description: provider.description || '',
                                default_sort_order: provider.default_sort_order,
                                is_active: provider.is_active,
                              });
                              setShowEditModal(provider);
                            }}
                            className="text-blue-600 hover:text-blue-900 transition-colors"
                            title="Edit Provider"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          
                          {/* Restore/Delete Button - Saling menggantikan berdasarkan status */}
                          {!provider.is_active ? (
                            <button
                              onClick={() => handleRestore(provider)}
                              className="text-green-600 hover:text-green-900 transition-colors"
                              title="Aktifkan Kembali Provider"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            </button>
                          ) : (
                            <button
                              onClick={() => handleDelete(provider)}
                              className="text-red-600 hover:text-red-900 transition-colors"
                              title="Nonaktifkan/Hapus Provider"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={canEdit ? 6 : 5} className="px-6 py-12 text-center">
                    <div className="text-gray-500">
                      <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                      <p className="text-lg font-medium">Tidak ada provider ditemukan</p>
                      <p className="text-sm mt-1">Coba ubah filter atau tambah provider baru</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Table - Hanya Nama Provider dan Aksi */}
        <div className="md:hidden overflow-hidden">
          <table className="w-full divide-y divide-gray-200">
            <thead className="bg-gradient-to-r from-red-50 to-red-100">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Nama Provider
                </th>
                {canEdit && (
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Aksi
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedProviders.length > 0 ? (
                sortedProviders.map((provider) => (
                  <tr key={provider.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-4">
                      <div className="text-sm font-medium text-gray-900">{provider.name}</div>
                    </td>
                    {canEdit && (
                      <td className="px-4 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {/* View Button - Hanya Mobile */}
                          <button
                            onClick={() => setShowDetailModal(provider)}
                            className="text-indigo-600 hover:text-indigo-900 transition-colors"
                            title="Lihat Detail"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </button>
                          
                          {/* Edit Button */}
                          <button
                            onClick={() => {
                              setEditForm({
                                name: provider.name,
                                description: provider.description || '',
                                default_sort_order: provider.default_sort_order,
                                is_active: provider.is_active,
                              });
                              setShowEditModal(provider);
                            }}
                            className="text-blue-600 hover:text-blue-900 transition-colors"
                            title="Edit Provider"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          
                          {/* Restore/Delete Button - Saling menggantikan berdasarkan status */}
                          {!provider.is_active ? (
                            <button
                              onClick={() => handleRestore(provider)}
                              className="text-green-600 hover:text-green-900 transition-colors"
                              title="Aktifkan Kembali Provider"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            </button>
                          ) : (
                            <button
                              onClick={() => handleDelete(provider)}
                              className="text-red-600 hover:text-red-900 transition-colors"
                              title="Nonaktifkan/Hapus Provider"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={canEdit ? 2 : 1} className="px-4 py-12 text-center">
                    <div className="text-gray-500">
                      <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                      <p className="text-lg font-medium">Tidak ada provider ditemukan</p>
                      <p className="text-sm mt-1">Coba ubah filter atau tambah provider baru</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Provider Modal */}
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
            <div className="px-4 sm:px-6 py-4 bg-gradient-to-r from-green-50 to-green-100 border-b border-green-200 flex justify-between items-center flex-shrink-0">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                <svg className="w-5 h-5 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Tambah Provider Baru
              </h3>
              <button 
                onClick={() => {
                  setShowCreateModal(false);
                  setCreateForm({ name: '', description: '', default_sort_order: 0, is_active: true });
                }}
                className="text-gray-500 hover:text-gray-700 transition-colors flex-shrink-0"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div 
              className="p-4 sm:p-6 overflow-y-auto flex-1 min-h-0"
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
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Nama Provider <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={createForm.name}
                    onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-green-400 focus:border-transparent transition-all"
                    placeholder="Masukkan nama provider"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Deskripsi
                  </label>
                  <textarea
                    value={createForm.description}
                    onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-green-400 focus:border-transparent transition-all resize-none"
                    placeholder="Masukkan deskripsi provider (opsional)"
                    rows={4}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      Urutan Sort
                    </label>
                    <input
                      type="number"
                      value={createForm.default_sort_order}
                      onChange={(e) => setCreateForm({ ...createForm, default_sort_order: parseInt(e.target.value) || 0 })}
                      className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-green-400 focus:border-transparent transition-all"
                      placeholder="0"
                      min="0"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      Status
                    </label>
                    <select
                      value={createForm.is_active ? 'active' : 'inactive'}
                      onChange={(e) => setCreateForm({ ...createForm, is_active: e.target.value === 'active' })}
                      className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-green-400 focus:border-transparent transition-all appearance-none bg-white"
                    >
                      <option value="active">Aktif</option>
                      <option value="inactive">Nonaktif</option>
                    </select>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row justify-end pt-4 space-y-2 sm:space-y-0 sm:space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateModal(false);
                      setCreateForm({ name: '', description: '', default_sort_order: 0, is_active: true });
                    }}
                    className="w-full sm:w-auto px-6 py-3 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="w-full sm:w-auto px-8 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 transition-all shadow-lg hover:shadow-xl font-medium"
                  >
                    Tambah Provider
                  </button>
                </div>
              </form>
            </div>
          </ModalContainer>
        </ModalBackdrop>
      )}

      {/* Edit Provider Modal */}
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
            <div className="px-4 sm:px-6 py-4 bg-gradient-to-r from-red-50 to-red-100 border-b border-red-200 flex justify-between items-center flex-shrink-0">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                <svg className="w-5 h-5 mr-2 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit Provider
              </h3>
              <button 
                onClick={() => {
                  setShowEditModal(null);
                  setEditForm({ name: '', description: '', default_sort_order: 0, is_active: true });
                }}
                className="text-gray-500 hover:text-gray-700 transition-colors flex-shrink-0"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div 
              className="p-4 sm:p-6 overflow-y-auto flex-1 min-h-0"
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
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Nama Provider <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                    placeholder="Masukkan nama provider"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Deskripsi
                  </label>
                  <textarea
                    value={editForm.description}
                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all resize-none"
                    placeholder="Masukkan deskripsi provider (opsional)"
                    rows={4}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      Urutan Sort
                    </label>
                    <input
                      type="number"
                      value={editForm.default_sort_order}
                      onChange={(e) => setEditForm({ ...editForm, default_sort_order: parseInt(e.target.value) || 0 })}
                      className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                      placeholder="0"
                      min="0"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      Status
                    </label>
                    <select
                      value={editForm.is_active ? 'active' : 'inactive'}
                      onChange={(e) => setEditForm({ ...editForm, is_active: e.target.value === 'active' })}
                      className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all appearance-none bg-white"
                    >
                      <option value="active">Aktif</option>
                      <option value="inactive">Nonaktif</option>
                    </select>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row justify-end pt-4 space-y-2 sm:space-y-0 sm:space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditModal(null);
                      setEditForm({ name: '', description: '', default_sort_order: 0, is_active: true });
                    }}
                    className="w-full sm:w-auto px-6 py-3 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="w-full sm:w-auto px-8 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg hover:from-red-700 hover:to-red-800 transition-all shadow-lg hover:shadow-xl font-medium"
                  >
                    Update Provider
                  </button>
                </div>
              </form>
            </div>
          </ModalContainer>
        </ModalBackdrop>
      )}

      {/* Restore Confirmation Modal */}
      {showRestoreModal && (
        <ModalBackdrop onClick={() => setShowRestoreModal(null)} opacity={50} zIndex={50}>
          <ModalContainer maxWidth="md" maxHeight="90vh" className="p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Konfirmasi Aktifkan Provider</h3>
                <p className="text-sm text-gray-600">Provider: <span className="font-semibold">{showRestoreModal.name}</span></p>
              </div>
            </div>

            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-start gap-2">
                <svg className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p className="text-sm font-medium text-green-800">
                    Provider akan diaktifkan kembali dan akan muncul di dropdown saat menambah atau mengedit titik FO.
                  </p>
                  {showRestoreModal.points_count && showRestoreModal.points_count > 0 && (
                    <p className="text-xs text-green-700 mt-1">
                      Provider ini digunakan oleh {showRestoreModal.points_count} titik FO.
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-end">
              <button
                onClick={() => setShowRestoreModal(null)}
                className="px-4 py-2 border-2 border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
              >
                Batal
              </button>
              <button
                onClick={confirmRestore}
                className="px-4 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors"
              >
                Aktifkan Provider
              </button>
            </div>
          </ModalContainer>
        </ModalBackdrop>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <ModalBackdrop onClick={() => setShowDeleteModal(null)} opacity={50} zIndex={50}>
          <ModalContainer maxWidth="md" maxHeight="90vh" className="p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Konfirmasi Hapus Provider</h3>
                <p className="text-sm text-gray-600">Provider: <span className="font-semibold">{showDeleteModal.provider.name}</span></p>
              </div>
            </div>

            {showDeleteModal.isUsed ? (
              <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  <div>
                    <p className="text-sm font-medium text-yellow-800">
                      Provider ini masih digunakan oleh {showDeleteModal.provider.points_count || 0} titik FO.
                    </p>
                    <p className="text-xs text-yellow-700 mt-1">
                      Provider akan dinonaktifkan (tidak akan muncul di dropdown, tapi data tetap tersimpan).
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-800">
                  Provider ini tidak digunakan oleh titik FO manapun. Data akan dihapus permanen dan tidak dapat dikembalikan.
                </p>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 justify-end">
              <button
                onClick={() => setShowDeleteModal(null)}
                className="px-4 py-2 border-2 border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
              >
                Batal
              </button>
              <button
                onClick={confirmDelete}
                className={`px-4 py-2 font-medium rounded-lg transition-colors ${
                  showDeleteModal.isUsed
                    ? 'bg-yellow-600 text-white hover:bg-yellow-700'
                    : 'bg-red-600 text-white hover:bg-red-700'
                }`}
              >
                {showDeleteModal.isUsed ? 'Nonaktifkan Provider' : 'Hapus Permanen'}
              </button>
            </div>
          </ModalContainer>
        </ModalBackdrop>
      )}

      {/* Detail Modal - Mobile Only - Untuk lihat kolom tersembunyi */}
      {showDetailModal && (
        <ModalBackdrop onClick={() => setShowDetailModal(null)} opacity={50} zIndex={50} className="md:hidden">
          <ModalContainer maxWidth="sm" maxHeight="85vh" onClick={(e) => e.stopPropagation()}>
            <div className="px-4 py-4 bg-gradient-to-r from-red-50 to-red-100 border-b border-red-200 flex justify-between items-center flex-shrink-0">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                <svg className="w-5 h-5 mr-2 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Detail Provider
              </h3>
              <button 
                onClick={() => setShowDetailModal(null)}
                className="text-gray-500 hover:text-gray-700 transition-colors flex-shrink-0"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div 
              className="p-4 overflow-y-auto flex-1 min-h-0"
              style={{
                maxHeight: 'calc(100vh - 12rem)',
                WebkitOverflowScrolling: 'touch',
                overscrollBehavior: 'contain'
              }}
            >
              <div className="space-y-4">
                {/* Nama Provider */}
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Nama Provider</label>
                  <p className="mt-1 text-sm font-medium text-gray-900">{showDetailModal.name}</p>
                </div>

                {/* Deskripsi */}
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Deskripsi</label>
                  <p className="mt-1 text-sm text-gray-600 whitespace-pre-wrap">{showDetailModal.description || '-'}</p>
                </div>

                {/* Status */}
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Status</label>
                  <div className="mt-1">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      showDetailModal.is_active
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {showDetailModal.is_active ? 'Aktif' : 'Nonaktif'}
                    </span>
                  </div>
                </div>

                {/* Jumlah Titik FO */}
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Jumlah Titik FO</label>
                  <p className="mt-1 text-sm text-gray-900">{showDetailModal.points_count || 0} titik</p>
                </div>

                {/* Urutan */}
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Urutan</label>
                  <p className="mt-1 text-sm text-gray-600">{showDetailModal.default_sort_order}</p>
                </div>
              </div>
            </div>
            <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 flex-shrink-0">
              <button
                onClick={() => setShowDetailModal(null)}
                className="w-full px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors"
              >
                Tutup
              </button>
            </div>
          </ModalContainer>
        </ModalBackdrop>
      )}
    </AdminLayout>
  );
}

