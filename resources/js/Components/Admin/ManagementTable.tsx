import React, { useState } from 'react';
import { router } from '@inertiajs/react';
import VideoThumbnail from '@/Components/VideoThumbnail';

interface MediaItem {
  id: number;
  file_path: string;
  file_type?: string;
  file_name?: string;
}

interface ResponseItem {
  id: number;
  message: string;
  created_at?: string;
  user?: { id?: number; name: string };
  assets?: MediaItem[];
}

interface Tower {
  id: number;
  site_name: string;
  alamat_menara?: string;
}

interface User {
  id?: number;
  name: string;
  email?: string;
}

interface Status {
  id: number;
  name: string;
  slug: string;
  color: string;
  icon: string;
}

interface BaseItem {
  id: number;
  user_id: number;
  message: string;
  status: string;
  created_at?: string;
  is_public?: boolean;
  tower?: Tower;
  user?: User;
  responses?: ResponseItem[];
  images?: MediaItem[];
  assets?: MediaItem[];
  // For reports
  reporter_name?: string;
  reporter_phone?: string;
  category?: string;
  // For feedbacks
  sender_phone?: string;
  sender_name?: string;
  // Email field for guest users
  email?: string;
}

interface Props {
  items: BaseItem[];
  statuses: Status[];
  title: string;
  type: 'complaints' | 'feedbacks';
  respondRoute: string;
  updateStatusRoute: string;
}

const ManagementTable: React.FC<Props> = ({ 
  items = [], 
  statuses = [], 
  title,
  type,
  respondRoute,
  updateStatusRoute
}) => {
  // Default statuses if not provided by the backend
  const defaultStatuses = [
    { id: 1, name: 'Pending', slug: 'pending', color: 'red', icon: 'clock' },
    { id: 2, name: 'In Progress', slug: 'in_progress', color: 'orange', icon: 'refresh' },
    { id: 3, name: 'Closed', slug: 'closed', color: 'green', icon: 'check' }
  ];
  
  // Use provided statuses or fallback to default
  const availableStatuses = statuses.length > 0 ? statuses : defaultStatuses;
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [previewAsset, setPreviewAsset] = useState<{ file_path: string; file_type?: string } | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState<{ [key: number]: boolean }>({});
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 5;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'in_progress':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'closed':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      pending: 'bg-red-100 text-red-800 border-red-300',
      in_progress: 'bg-orange-100 text-orange-800 border-orange-300',
      closed: 'bg-green-100 text-green-800 border-green-300'
    };
    
    const labels = {
      pending: 'BARU',
      in_progress: 'PROGRESS',
      closed: 'SELESAI'
    };

    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${colors[status as keyof typeof colors] || colors.pending}`}>
        {labels[status as keyof typeof labels] || labels.pending}
      </span>
    );
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

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
    const itemName = type === 'complaints' 
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

  const getItemDisplayName = (item: BaseItem) => {
    if (type === 'complaints') {
      return item.reporter_name || item.user?.name || 'Anonim';
    }
    return item.sender_name || item.user?.name || 'Anonim';
  };

  const getItemPhone = (item: BaseItem) => {
    if (type === 'complaints') {
      return item.reporter_phone || '-';
    }
    return item.sender_phone || '-';
  };

  const getItemCategory = (item: BaseItem) => {
  if (!item.category) return '-';
  // Remove patterns like '[Dari: Someone]' that may be included in category
  // Also remove any trailing/leading brackets and extra whitespace
  return item.category.replace(/\[Dari:\s*[^\]]+\]/gi, '').replace(/[\[\]]/g, '').trim() || '-';
  };

  const getItemAssets = (item: BaseItem) => {
    return item.images || item.assets || [];
  };

  const getItemEmail = (item: BaseItem) => {
    // For guest users, check the email field directly
    // For registered users, use user.email
    return (item as any).email || item.user?.email || '-';
  };

  const getVisibilityBadge = (isPublic?: boolean) => {
    if (isPublic === undefined || isPublic === null) {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600 border border-gray-300">
          -
        </span>
      );
    }
    
    return isPublic ? (
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-300">
        <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        Terbuka
      </span>
    ) : (
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 border border-purple-300">
        <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
        Tertutup
      </span>
    );
  };

  return (
    <>
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-lg p-6 shadow-lg border-l-4 border-red-500">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-800">Baru</h3>
              <p className="text-3xl font-bold text-red-600">
                {items.filter(r => r.status === 'pending').length}
              </p>
            </div>
            <div className="bg-red-100 p-3 rounded-full">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg p-6 shadow-lg border-l-4 border-orange-500">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-800">Progress</h3>
              <p className="text-3xl font-bold text-orange-600">
                {items.filter(r => r.status === 'in_progress').length}
              </p>
            </div>
            <div className="bg-orange-100 p-3 rounded-full">
              <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg p-6 shadow-lg border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-800">Selesai</h3>
              <p className="text-3xl font-bold text-green-600">
                {items.filter(r => r.status === 'closed').length}
              </p>
            </div>
            <div className="bg-green-100 p-3 rounded-full">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6 mb-6 sm:mb-8">
        <div className="flex flex-col space-y-4 lg:flex-row lg:space-y-0 lg:gap-4 lg:items-center lg:justify-between">
          <div className="flex-1 max-w-full lg:max-w-md">
            <div className="relative">
              <input
                type="text"
                placeholder="Cari berdasarkan nama, pesan, kategori..."
                className="w-full pl-10 pr-10 py-2 sm:py-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-400 focus:border-transparent"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <svg className="absolute left-3 top-2.5 sm:top-3.5 h-4 w-4 sm:h-5 sm:w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-2.5 sm:top-3.5 h-4 w-4 sm:h-5 sm:w-5 text-gray-400 hover:text-gray-600"
                >
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>
          <div className="flex-shrink-0">
            <select
              className="w-full sm:w-auto border border-gray-300 rounded-lg p-2 sm:p-3 text-sm focus:ring-2 focus:ring-red-400 focus:border-transparent"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">Semua Status</option>
              <option value="pending">Baru</option>
              <option value="in_progress">Progress</option>
              <option value="closed">Selesai</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Content - Table Layout */}
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        {paginatedItems.length === 0 ? (
          <div className="p-8 sm:p-12 text-center">
            <svg className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm || filterStatus !== 'all' 
                ? `Tidak ada ${title.toLowerCase()} yang sesuai dengan filter`
                : `Belum ada ${title.toLowerCase()} yang masuk`
              }
            </h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || filterStatus !== 'all' 
                ? 'Coba ubah filter atau kata kunci pencarian'
                : `${title} dari masyarakat akan muncul di sini`
              }
            </p>
            {(searchTerm || filterStatus !== 'all') && (
              <button 
                onClick={() => {
                  setSearchTerm('');
                  setFilterStatus('all');
                }}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Reset Filter
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200" style={{ minWidth: '1200px' }}>
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-48">
                      Pelapor
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-40">
                      Email
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-80">
                      {type === 'complaints' ? 'Keluhan' : 'Masukan'}
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-48">
                      Tower
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                      Visibilitas
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-28">
                      Status
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-36">
                      Tanggal
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedItems.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-3 py-4 align-top">
                        <div className="flex items-start">
                          <div className="flex-shrink-0 h-8 w-8">
                            <div className="h-8 w-8 rounded-full bg-gradient-to-r from-red-400 to-red-600 flex items-center justify-center">
                              <span className="text-xs font-medium text-white">
                                {getItemDisplayName(item).charAt(0).toUpperCase()}
                              </span>
                            </div>
                          </div>
                          <div className="ml-3 min-w-0 flex-1">
                            <div className="text-sm font-medium text-gray-900 truncate">{getItemDisplayName(item)}</div>
                            <div className="text-xs text-gray-500 truncate">{getItemPhone(item)}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-4 align-top">
                        <div className="text-sm text-gray-700 truncate" title={getItemEmail(item)}>
                          {getItemEmail(item)}
                        </div>
                      </td>
                      <td className="px-3 py-4 align-top">
                        <div className="text-sm">
                          <div className="font-medium text-gray-900 mb-1 truncate">{getItemCategory(item)}</div>
                          <div className="text-gray-600 text-xs line-clamp-2 max-h-8 overflow-hidden">
                            {item.message.length > 80 
                              ? `${item.message.substring(0, 80)}...` 
                              : item.message
                            }
                          </div>
                          {getItemAssets(item).length > 0 && (
                            <div className="grid grid-cols-2 gap-1 mt-2">
                              {getItemAssets(item).slice(0, 6).map((asset, index) => (
                                <div
                                  key={index}
                                  className="rounded overflow-hidden border border-gray-200 bg-white shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer"
                                  onClick={() => openPreview(asset)}
                                >
                                  {asset.file_type === 'video' || asset.file_path.toLowerCase().match(/\.(mp4|mov|avi|webm)$/i) ? (
                                    <VideoThumbnail
                                      src={`/storage/${asset.file_path}`}
                                      fileType="video"
                                      className="w-20 h-16"
                                      onClick={() => openPreview(asset)}
                                      showPlayButton={true}
                                      alt="Video media"
                                      loading="lazy"
                                    />
                                  ) : (
                                    <img 
                                      src={`/storage/${asset.file_path}`} 
                                      alt="Media"
                                      className="w-20 h-16 object-cover"
                                      onError={(e) => {
                                        const target = e.target as HTMLImageElement;
                                        target.style.display = 'none';
                                        const parent = target.parentElement;
                                        if (parent) {
                                          parent.innerHTML = `
                                            <div class="w-20 h-16 bg-gray-100 flex items-center justify-center">
                                              <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                              </svg>
                                            </div>
                                          `;
                                        }
                                      }}
                                    />
                                  )}
                                </div>
                              ))}
                              {getItemAssets(item).length > 6 && (
                                <div className="col-span-2 flex justify-center">
                                  <div className="w-16 h-10 rounded-md bg-gray-100 border border-gray-200 flex items-center justify-center">
                                    <span className="text-xs text-gray-500">+{getItemAssets(item).length - 6} lainnya</span>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-4 align-top">
                        <div className="text-sm text-gray-700">
                          <div className="font-medium truncate" title={item.tower?.site_name || '-'}>
                            {item.tower?.site_name || '-'}
                          </div>
                          {item.tower?.alamat_menara && (
                            <div className="text-xs text-gray-500 truncate mt-1" title={item.tower.alamat_menara}>
                              {item.tower.alamat_menara.length > 30 
                                ? `${item.tower.alamat_menara.substring(0, 30)}...`
                                : item.tower.alamat_menara
                              }
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-4 align-top">
                        <div className="flex justify-center">
                          {getVisibilityBadge(item.is_public)}
                        </div>
                      </td>
                      <td className="px-3 py-4 align-top">
                        <div className="flex justify-center">
                          <select
                            value={item.status}
                            onChange={(e) => handleStatusChange(item.id, e.target.value)}
                            disabled={updatingStatus[item.id]}
                            className={`text-xs font-medium border rounded-lg px-2 py-1 transition-all focus:ring-2 focus:ring-offset-1 ${
                              updatingStatus[item.id] 
                                ? 'opacity-50 cursor-not-allowed' 
                                : 'cursor-pointer hover:shadow-md'
                            } ${
                              item.status === 'pending' 
                                ? 'bg-red-100 text-red-800 border-red-300 focus:ring-red-400' 
                                : item.status === 'in_progress'
                                ? 'bg-orange-100 text-orange-800 border-orange-300 focus:ring-orange-400'
                                : 'bg-green-100 text-green-800 border-green-300 focus:ring-green-400'
                            }`}
                          >
                            <option value="pending">BARU</option>
                            <option value="in_progress">PROGRESS</option>
                            <option value="closed">SELESAI</option>
                          </select>
                        </div>
                      </td>
                      <td className="px-3 py-4 align-top">
                        <div className="text-sm text-gray-500">
                          <div className="text-xs">{formatDate(item.created_at).split(',')[0]}</div>
                          <div className="text-xs text-gray-400">{formatDate(item.created_at).split(',')[1]?.trim()}</div>
                        </div>
                      </td>
                      <td className="px-3 py-4 align-top">
                        <button
                          onClick={() => handleViewDetail(item)}
                          className="inline-flex items-center px-2 py-1 border border-transparent text-xs leading-4 font-medium rounded text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
                        >
                          <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          Detail
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="lg:hidden divide-y divide-gray-200">
              {filteredItems.map((item) => (
                <div key={item.id} className="p-4 sm:p-6">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center min-w-0 flex-1">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-r from-red-400 to-red-600 flex items-center justify-center">
                          <span className="text-sm font-medium text-white">
                            {getItemDisplayName(item).charAt(0).toUpperCase()}
                          </span>
                        </div>
                      </div>
                      <div className="ml-3 min-w-0 flex-1">
                        <div className="text-sm font-medium text-gray-900 truncate">{getItemDisplayName(item)}</div>
                        <div className="text-xs text-gray-500 truncate">{getItemPhone(item)}</div>
                        <div className="text-xs text-gray-500 truncate">{getItemEmail(item)}</div>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1 items-end ml-2">
                      <select
                        value={item.status}
                        onChange={(e) => handleStatusChange(item.id, e.target.value)}
                        disabled={updatingStatus[item.id]}
                        className={`text-xs font-medium border rounded-full px-2 py-1 transition-all focus:ring-2 focus:ring-offset-1 ${
                          updatingStatus[item.id] 
                            ? 'opacity-50 cursor-not-allowed' 
                            : 'cursor-pointer hover:shadow-md'
                        } ${
                          item.status === 'pending' 
                            ? 'bg-red-100 text-red-800 border-red-300 focus:ring-red-400' 
                            : item.status === 'in_progress'
                            ? 'bg-orange-100 text-orange-800 border-orange-300 focus:ring-orange-400'
                            : 'bg-green-100 text-green-800 border-green-300 focus:ring-green-400'
                        }`}
                      >
                        <option value="pending">BARU</option>
                        <option value="in_progress">PROGRESS</option>
                        <option value="closed">SELESAI</option>
                      </select>
                      {getVisibilityBadge(item.is_public)}
                    </div>
                  </div>
                  
                  <div className="mb-3">
                    <div className="text-sm font-medium text-gray-700 mb-1">{getItemCategory(item)}</div>
                    <div className="text-sm text-gray-600 line-clamp-3">{item.message}</div>
                  </div>
                  
                  {item.tower && (
                    <div className="mb-3">
                      <div className="text-sm font-medium text-gray-700 truncate">{item.tower.site_name}</div>
                      {item.tower.alamat_menara && (
                        <div className="text-xs text-gray-500 truncate">{item.tower.alamat_menara}</div>
                      )}
                    </div>
                  )}
                  
                  {getItemAssets(item).length > 0 && (
                    <div className="grid grid-cols-2 gap-2 mb-3">
                      {getItemAssets(item).slice(0, 6).map((asset, index) => (
                        <div
                          key={index}
                          className="rounded overflow-hidden border border-gray-200 bg-white shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer"
                          onClick={() => openPreview(asset)}
                        >
                          {asset.file_type === 'video' || asset.file_path.toLowerCase().match(/\.(mp4|mov|avi|webm)$/i) ? (
                            <VideoThumbnail
                              src={`/storage/${asset.file_path}`}
                              fileType="video"
                              className="w-20 h-16"
                              onClick={() => openPreview(asset)}
                              showPlayButton={true}
                              alt="Video media"
                              loading="lazy"
                            />
                          ) : (
                            <img 
                              src={`/storage/${asset.file_path}`} 
                              alt="Media"
                              className="w-20 h-16 object-cover"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                                const parent = target.parentElement;
                                if (parent) {
                                  parent.innerHTML = `
                                    <div class="w-20 h-16 bg-gray-100 flex items-center justify-center">
                                      <svg class="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                      </svg>
                                    </div>
                                  `;
                                }
                              }}
                            />
                          )}
                        </div>
                      ))}
                      {getItemAssets(item).length > 6 && (
                        <div className="col-span-2 flex justify-center">
                          <div className="w-20 h-16 rounded-lg bg-gray-100 border-2 border-gray-200 flex items-center justify-center">
                            <span className="text-xs text-gray-500">+{getItemAssets(item).length - 6} lainnya</span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">{formatDate(item.created_at)}</span>
                    <button
                      onClick={() => handleViewDetail(item)}
                      className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-red-600 hover:bg-red-700 transition-colors"
                    >
                      <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      Lihat Detail
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Asset Preview Modal */}
      {previewAsset && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50" onClick={() => setPreviewAsset(null)}>
          <div className="max-w-4xl w-full max-h-[90vh] flex items-center justify-center p-4">
            {previewAsset.file_type === 'video' ? (
              <video
                src={`/storage/${previewAsset.file_path}`}
                controls
                autoPlay
                className="max-w-full max-h-[90vh] object-contain"
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <img 
                src={`/storage/${previewAsset.file_path}`} 
                className="max-w-full max-h-[90vh] object-contain" 
                onClick={(e) => e.stopPropagation()}
              />
            )}
            <button 
              className="absolute top-4 right-4 text-white bg-black bg-opacity-50 rounded-full p-2 hover:bg-opacity-70"
              onClick={() => setPreviewAsset(null)}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Summary */}
      <div className="mt-8 bg-white rounded-lg shadow-lg p-4 sm:p-6">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <span>
              Menampilkan <span className="font-semibold text-gray-800">{startIndex + 1}-{Math.min(endIndex, totalItems)}</span> dari{' '}
              <span className="font-semibold text-gray-800">{totalItems}</span> total {title.toLowerCase()}
              {totalItems !== items.length && (
                <span className="text-orange-600 font-medium"> (terfilter)</span>
              )}
            </span>
          </div>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-4 bg-white rounded-lg shadow-lg p-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Halaman <span className="font-semibold">{currentPage}</span> dari{' '}
              <span className="font-semibold">{totalPages}</span>
            </div>
            
            <div className="flex items-center space-x-1">
              {/* Previous Button */}
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  currentPage === 1
                    ? 'text-gray-400 cursor-not-allowed bg-gray-100'
                    : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900 bg-white border border-gray-300'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>

              {/* Page Numbers */}
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                // Show first 2 pages, last 2 pages, current page, and pages around current
                const showPage = page === 1 || 
                  page === totalPages || 
                  Math.abs(page - currentPage) <= 1;
                
                if (!showPage) {
                  // Show ellipsis
                  if (page === 2 && currentPage > 4) {
                    return (
                      <span key={page} className="px-3 py-2 text-sm text-gray-500">
                        ...
                      </span>
                    );
                  }
                  if (page === totalPages - 1 && currentPage < totalPages - 3) {
                    return (
                      <span key={page} className="px-3 py-2 text-sm text-gray-500">
                        ...
                      </span>
                    );
                  }
                  return null;
                }

                return (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                      page === currentPage
                        ? 'text-white bg-red-600 hover:bg-red-700'
                        : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900 bg-white border border-gray-300'
                    }`}
                  >
                    {page}
                  </button>
                );
              })}

              {/* Next Button */}
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  currentPage === totalPages
                    ? 'text-gray-400 cursor-not-allowed bg-gray-100'
                    : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900 bg-white border border-gray-300'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ManagementTable;
