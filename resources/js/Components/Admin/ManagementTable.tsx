import React, { useState } from 'react';
import { router } from '@inertiajs/react';

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
  sender_name?: string;
  sender_phone?: string;
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
  const [replyText, setReplyText] = useState<Record<number, string>>({});
  const [selectedFiles, setSelectedFiles] = useState<Record<number, File[]>>({});
  const [replyStatus, setReplyStatus] = useState<Record<number, string | number>>({});
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Count items by status
  const statusCounts = {
    pending: items.filter(item => item.status === 'pending').length,
    in_progress: items.filter(item => item.status === 'in_progress').length,
    closed: items.filter(item => item.status === 'closed').length
  };
  const [lightboxMedia, setLightboxMedia] = useState<{ url: string; type: string } | null>(null);
  const [replyModal, setReplyModal] = useState<{ isOpen: boolean; item: BaseItem | null }>({
    isOpen: false,
    item: null
  });

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

  const openReplyModal = (item: BaseItem) => {
    setReplyModal({ isOpen: true, item });
    // Set default status to current item status
    // item.status is a slug (eg 'pending') — map to status id for the select
    const findStatusIdFromSlug = (slug?: string) => {
      if (!slug) return '';
      const s = availableStatuses.find(st => st.slug === slug);
      return s ? s.id : '';
    };

    setReplyStatus({ [item.id]: findStatusIdFromSlug(item.status) });
  };

  const closeReplyModal = () => {
    setReplyModal({ isOpen: false, item: null });
    setReplyText({});
    setSelectedFiles({});
    setReplyStatus({});
  };

  const handleStatusChange = (itemId: number, newStatus: string) => {
    const routeUrl = updateStatusRoute.replace(':id', itemId.toString());
    // newStatus is the selected status id (string) — convert to number if possible
    const statusId = Number(newStatus) || newStatus;
    router.put(routeUrl, { status_id: statusId }, {
      onSuccess: () => {
        // optional: could show a toast or refresh data
      }
    });
  };

  const handleSendReply = (itemId: number) => {
    const msg = replyText[itemId];
    const status = replyStatus[itemId];
    if (!msg?.trim() || !status) return;
    
    const formData = new FormData();
    formData.append('message', msg);
  // status may be number or string — ensure it's appended as string
  formData.append('status_id', String(status));
    
    // Add selected files (images and videos) if any
    const files = selectedFiles[itemId] || [];
    files.forEach((file, index) => {
      if (file.type.startsWith('image/')) {
        formData.append(`images[${index}]`, file);
      } else if (file.type.startsWith('video/')) {
        formData.append(`videos[${index}]`, file);
      }
    });
    
    const routeUrl = respondRoute.replace(':id', itemId.toString());
    router.post(routeUrl, formData, {
      forceFormData: true,
      onSuccess: () => {
        closeReplyModal();
      }
    });
  };

  const handleFileSelect = (itemId: number, files: FileList | null) => {
    if (!files) return;
    
    const currentFiles = selectedFiles[itemId] || [];
    const currentImages = currentFiles.filter(file => file.type.startsWith('image/')).length;
    const currentVideos = currentFiles.filter(file => file.type.startsWith('video/')).length;
    
    const validFiles = Array.from(files).filter(file => {
      const isImage = file.type.startsWith('image/');
      const isVideo = file.type.startsWith('video/');
      
      if (isImage) {
        const isValidSize = file.size <= 5 * 1024 * 1024; // 5MB max for images
        const isValidType = ['image/jpeg', 'image/png', 'image/jpg'].includes(file.type);
        return isValidType && isValidSize && currentImages < 3;
      } else if (isVideo) {
        const isValidSize = file.size <= 50 * 1024 * 1024; // 50MB max for videos
        const isValidType = ['video/mp4', 'video/quicktime', 'video/avi', 'video/x-msvideo', 'video/x-matroska'].includes(file.type);
        return isValidType && isValidSize && currentVideos < 2;
      }
      
      return false;
    });
    
    setSelectedFiles({
      ...selectedFiles,
      [itemId]: [...currentFiles, ...validFiles]
    });
  };

  const removeFile = (itemId: number, fileIndex: number) => {
    const currentFiles = selectedFiles[itemId] || [];
    const updatedFiles = currentFiles.filter((_, index) => index !== fileIndex);
    setSelectedFiles({ ...selectedFiles, [itemId]: updatedFiles });
  };

  const openLightbox = (mediaPath: string, mediaType: string) => {
    setLightboxMedia({ url: mediaPath, type: mediaType });
  };

  const closeLightbox = () => {
    setLightboxMedia(null);
  };

  // Filter items
  const filteredItems = items.filter(item => {
    const matchesStatus = filterStatus === 'all' || item.status === filterStatus;
    const itemName = type === 'complaints' 
      ? (item.reporter_name || item.user?.name || '')
      : (item.user?.name || '');
    const itemEmail = item.user?.email || '';
    const matchesSearch = searchTerm === '' || 
      itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      itemEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.category || '').toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

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

  return (
    <>
      {/* Header Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Kelola {title}</h1>
        <p className="text-gray-600">
          Pantau dan tanggapi {title.toLowerCase()} dari masyarakat terkait tower telekomunikasi
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-lg p-6 shadow-lg border-l-4 border-red-500">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-800">Baru</h3>
              <p className="text-3xl font-bold text-red-600">
                {statusCounts.pending}
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
                {statusCounts.in_progress}
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
                {statusCounts.closed}
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
        {filteredItems.length === 0 ? (
          <div className="p-8 sm:p-12 text-center">
            <svg className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
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
            <div className="hidden lg:block">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Pelapor
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {type === 'complaints' ? 'Keluhan' : 'Masukan'}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tower
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tanggal
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredItems.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-gradient-to-r from-red-400 to-red-600 flex items-center justify-center">
                              <span className="text-sm font-medium text-white">
                                {getItemDisplayName(item).charAt(0).toUpperCase()}
                              </span>
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{getItemDisplayName(item)}</div>
                            <div className="text-sm text-gray-500">{getItemPhone(item)}</div>
                            {item.user?.email && (
                              <div className="text-sm text-gray-500">{item.user.email}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          <div className="font-medium mb-1">{getItemCategory(item)}</div>
                          <div className="max-w-xs">
                            {item.message.length > 100 
                              ? `${item.message.substring(0, 100)}...` 
                              : item.message
                            }
                          </div>
                          {getItemAssets(item).length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {getItemAssets(item).slice(0, 3).map((asset, index) => (
                                <button
                                  key={index}
                                  onClick={() => openLightbox(`/storage/${asset.file_path}`, asset.file_type || 'image')}
                                  className="relative w-12 h-12 rounded-lg overflow-hidden border-2 border-gray-200 hover:border-red-400 transition-colors"
                                >
                                  {asset.file_type === 'video' ? (
                                    <div className="relative w-full h-full bg-black">
                                      <video 
                                        className="w-full h-full object-cover"
                                        preload="metadata"
                                      >
                                        <source src={`/storage/${asset.file_path}#t=0.1`} type="video/mp4" />
                                      </video>
                                      <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-40">
                                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                                          <path d="M8 5v10l8-5-8-5z"/>
                                        </svg>
                                      </div>
                                    </div>
                                  ) : (
                                    <img 
                                      src={`/storage/${asset.file_path}`} 
                                      alt="Media"
                                      className="w-full h-full object-cover"
                                    />
                                  )}
                                </button>
                              ))}
                              {getItemAssets(item).length > 3 && (
                                <div className="w-12 h-12 rounded-lg bg-gray-100 border-2 border-gray-200 flex items-center justify-center">
                                  <span className="text-xs text-gray-500">+{getItemAssets(item).length - 3}</span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="max-w-xs">
                          {item.tower?.site_name || '-'}
                          {item.tower?.alamat_menara && (
                            <div className="text-xs text-gray-400 mt-1">
                              {item.tower.alamat_menara.length > 50 
                                ? `${item.tower.alamat_menara.substring(0, 50)}...`
                                : item.tower.alamat_menara
                              }
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(item.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(item.created_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => openReplyModal(item)}
                          className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
                        >
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                          </svg>
                          Balas
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
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-r from-red-400 to-red-600 flex items-center justify-center">
                          <span className="text-sm font-medium text-white">
                            {getItemDisplayName(item).charAt(0).toUpperCase()}
                          </span>
                        </div>
                      </div>
                      <div className="ml-3">
                        <div className="text-sm font-medium text-gray-900">{getItemDisplayName(item)}</div>
                        <div className="text-sm text-gray-500">{getItemPhone(item)}</div>
                      </div>
                    </div>
                    {getStatusBadge(item.status)}
                  </div>
                  
                  <div className="mb-3">
                    <div className="text-sm font-medium text-gray-700 mb-1">{getItemCategory(item)}</div>
                    <div className="text-sm text-gray-600">{item.message}</div>
                  </div>
                  
                  {item.tower && (
                    <div className="mb-3">
                      <div className="text-sm font-medium text-gray-700">{item.tower.site_name}</div>
                      {item.tower.alamat_menara && (
                        <div className="text-xs text-gray-500">{item.tower.alamat_menara}</div>
                      )}
                    </div>
                  )}
                  
                  {getItemAssets(item).length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {getItemAssets(item).slice(0, 4).map((asset, index) => (
                        <button
                          key={index}
                          onClick={() => openLightbox(`/storage/${asset.file_path}`, asset.file_type || 'image')}
                          className="relative w-16 h-16 rounded-lg overflow-hidden border-2 border-gray-200 hover:border-red-400 transition-colors"
                        >
                          {asset.file_type === 'video' ? (
                            <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                              <svg className="w-6 h-6 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M8 5v10l8-5-8-5z"/>
                              </svg>
                            </div>
                          ) : (
                            <img 
                              src={`/storage/${asset.file_path}`} 
                              alt="Media"
                              className="w-full h-full object-cover"
                            />
                          )}
                        </button>
                      ))}
                      {getItemAssets(item).length > 4 && (
                        <div className="w-16 h-16 rounded-lg bg-gray-100 border-2 border-gray-200 flex items-center justify-center">
                          <span className="text-xs text-gray-500">+{getItemAssets(item).length - 4}</span>
                        </div>
                      )}
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">{formatDate(item.created_at)}</span>
                    <button
                      onClick={() => openReplyModal(item)}
                      className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-red-600 hover:bg-red-700 transition-colors"
                    >
                      <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                      </svg>
                      Balas
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Reply Modal */}
      {replyModal.isOpen && replyModal.item && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-red-50 to-red-100">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                  </svg>
                  Balas {title}
                </h3>
                <button
                  onClick={closeReplyModal}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6 max-h-[calc(90vh-120px)] overflow-y-auto">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Column - Item Details */}
                <div className="space-y-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                      <svg className="w-4 h-4 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Detail {title.charAt(0).toUpperCase() + title.slice(1)}
                    </h4>
                    <div className="space-y-3">
                      <div>
                        <span className="text-sm font-medium text-gray-700">Pelapor:</span>
                        <p className="text-sm text-gray-900">{getItemDisplayName(replyModal.item)}</p>
                        <p className="text-sm text-gray-500">{getItemPhone(replyModal.item)}</p>
                        {replyModal.item.user?.email && (
                          <p className="text-sm text-gray-500">{replyModal.item.user.email}</p>
                        )}
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-700">Kategori:</span>
                        <p className="text-sm text-gray-900">{getItemCategory(replyModal.item)}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-700">Pesan:</span>
                        <p className="text-sm text-gray-900">{replyModal.item.message}</p>
                      </div>
                      {replyModal.item.tower && (
                        <div>
                          <span className="text-sm font-medium text-gray-700">Tower:</span>
                          <p className="text-sm text-gray-900">{replyModal.item.tower.site_name}</p>
                          {replyModal.item.tower.alamat_menara && (
                            <p className="text-sm text-gray-500">{replyModal.item.tower.alamat_menara}</p>
                          )}
                        </div>
                      )}
                      <div>
                        <span className="text-sm font-medium text-gray-700">Tanggal:</span>
                        <p className="text-sm text-gray-900">{formatDate(replyModal.item.created_at)}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-700">Status Saat Ini:</span>
                        <div className="mt-1">{getStatusBadge(replyModal.item.status)}</div>
                      </div>
                    </div>
                    
                    {/* Show attached media if any */}
                    {getItemAssets(replyModal.item).length > 0 && (
                      <div className="mt-4">
                        <span className="text-sm font-medium text-gray-700 block mb-2">Media Terlampir:</span>
                        <div className="grid grid-cols-3 gap-2">
                          {getItemAssets(replyModal.item).map((asset, index) => (
                            <button
                              key={index}
                              onClick={() => openLightbox(`/storage/${asset.file_path}`, asset.file_type || 'image')}
                              className="relative aspect-square rounded-lg overflow-hidden border-2 border-gray-200 hover:border-red-400 transition-colors"
                            >
                              {asset.file_type === 'video' ? (
                                <div className="relative w-full h-full bg-black">
                                  <video 
                                    className="w-full h-full object-cover"
                                    preload="metadata"
                                  >
                                    <source src={`/storage/${asset.file_path}#t=0.1`} type="video/mp4" />
                                  </video>
                                  <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30">
                                    <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                                      <path d="M8 5v10l8-5-8-5z"/>
                                    </svg>
                                  </div>
                                </div>
                              ) : (
                                <img 
                                  src={`/storage/${asset.file_path}`} 
                                  alt="Media terlampir"
                                  className="w-full h-full object-cover"
                                />
                              )}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Show previous responses if any */}
                  {replyModal.item.responses && replyModal.item.responses.length > 0 && (
                    <div className="bg-blue-50 rounded-lg p-4">
                      <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                        <svg className="w-4 h-4 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                        Respon Sebelumnya
                      </h4>
                      <div className="space-y-3 max-h-48 overflow-y-auto">
                        {replyModal.item.responses.map((response, index) => (
                          <div key={index} className="bg-white rounded-lg p-3 border border-blue-200">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium text-gray-700">
                                {response.user?.name || 'Admin'}
                              </span>
                              <span className="text-xs text-gray-500">
                                {formatDate(response.created_at)}
                              </span>
                            </div>
                            <p className="text-sm text-gray-900">{response.message}</p>
                            {response.assets && response.assets.length > 0 && (
                              <div className="mt-2 flex gap-1">
                                {response.assets.slice(0, 3).map((asset, assetIndex) => (
                                  <button
                                    key={assetIndex}
                                    onClick={() => openLightbox(`/storage/${asset.file_path}`, asset.file_type || 'image')}
                                    className="w-8 h-8 rounded border border-gray-300 overflow-hidden"
                                  >
                                    {asset.file_type === 'video' ? (
                                      <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                                        <svg className="w-3 h-3 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                                          <path d="M8 5v10l8-5-8-5z"/>
                                        </svg>
                                      </div>
                                    ) : (
                                      <img 
                                        src={`/storage/${asset.file_path}`} 
                                        alt="Response media"
                                        className="w-full h-full object-cover"
                                      />
                                    )}
                                  </button>
                                ))}
                                {response.assets.length > 3 && (
                                  <div className="w-8 h-8 rounded bg-gray-100 border border-gray-300 flex items-center justify-center">
                                    <span className="text-xs text-gray-500">+{response.assets.length - 3}</span>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Right Column - Reply Form */}
                <div className="space-y-4">
                  <div className="bg-green-50 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                      <svg className="w-4 h-4 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Tulis Respon
                    </h4>
                    
                    {/* Status Selection */}
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Ubah Status:
                      </label>
                      <select 
                        className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-green-400 focus:border-transparent"
                        value={replyModal.item ? (replyStatus[replyModal.item.id] ?? '') : ''}
                        onChange={(e) => replyModal.item && setReplyStatus({ ...replyStatus, [replyModal.item.id]: Number(e.target.value) || '' })}
                      >
                        <option value="">Pilih Status</option>
                        {availableStatuses.map((status) => (
                          <option key={status.id} value={status.id}>
                            {status.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Message Input */}
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Pesan Respon: <span className="text-red-500">*</span>
                      </label>
                      <textarea 
                        className="w-full border border-gray-300 rounded-lg p-3 h-32 focus:ring-2 focus:ring-green-400 focus:border-transparent resize-none"
                        placeholder="Tulis respon Anda di sini..."
                        value={replyModal.item ? (replyText[replyModal.item.id] || '') : ''}
                        onChange={(e) => replyModal.item && setReplyText({ ...replyText, [replyModal.item.id]: e.target.value })}
                      />
                      <div className="text-xs text-gray-500 mt-1">
                        {replyModal.item ? (replyText[replyModal.item.id] || '').length : 0}/1000 karakter
                      </div>
                    </div>

                    {/* File Upload */}
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Lampirkan Media (Opsional):
                      </label>
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-gray-400 transition-colors">
                        <input
                          type="file"
                          id={`file-upload-${replyModal.item?.id}`}
                          className="hidden"
                          multiple
                          accept="image/jpeg,image/png,image/jpg,video/mp4,video/quicktime,video/avi,video/x-msvideo,video/x-matroska"
                          onChange={(e) => replyModal.item && handleFileSelect(replyModal.item.id, e.target.files)}
                        />
                        <label 
                          htmlFor={`file-upload-${replyModal.item?.id}`}
                          className="cursor-pointer"
                        >
                          <svg className="w-8 h-8 mx-auto mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                          </svg>
                          <p className="text-sm text-gray-600">
                            <span className="font-medium text-green-600 hover:text-green-500">Klik untuk memilih file</span> atau drag & drop
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            Gambar: JPEG, PNG, JPG (Maks 5MB, 3 file)<br/>
                            Video: MP4, MOV, AVI, MKV (Maks 50MB, 2 file)
                          </p>
                        </label>
                      </div>

                      {/* Show selected files */}
                      {replyModal.item && selectedFiles[replyModal.item.id] && selectedFiles[replyModal.item.id].length > 0 && (
                        <div className="mt-3">
                          <p className="text-sm font-medium text-gray-700 mb-2">File Terpilih:</p>
                          <div className="space-y-2">
                            {selectedFiles[replyModal.item.id].map((file, index) => (
                              <div key={index} className="flex items-center justify-between bg-gray-100 rounded-lg p-2">
                                <div className="flex items-center">
                                  <div className="flex-shrink-0 mr-3">
                                    {file.type.startsWith('image/') ? (
                                      <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                      </svg>
                                    ) : (
                                      <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                      </svg>
                                    )}
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium text-gray-900">{file.name}</p>
                                    <p className="text-xs text-gray-500">
                                      {(file.size / 1024 / 1024).toFixed(2)} MB
                                    </p>
                                  </div>
                                </div>
                                <button
                                  onClick={() => replyModal.item && removeFile(replyModal.item.id, index)}
                                  className="text-red-500 hover:text-red-700 transition-colors"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end space-x-3">
              <button
                onClick={closeReplyModal}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Batal
              </button>
              <button 
                className="px-6 py-2 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg hover:from-red-700 hover:to-red-800 transition-all shadow-lg hover:shadow-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                onClick={() => replyModal.item && handleSendReply(replyModal.item.id)}
                disabled={!replyModal.item || !replyText[replyModal.item.id]?.trim() || !replyStatus[replyModal.item.id]}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
                Kirim Respon
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox Modal */}
      {lightboxMedia && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4" 
          onClick={closeLightbox}
        >
          <div className="relative max-w-5xl max-h-full">
            {lightboxMedia.type === 'video' ? (
              <div className="relative">
                <video 
                  src={lightboxMedia.url}
                  className="max-w-full max-h-full object-contain rounded-lg"
                  controls
                  autoPlay
                  onClick={(e) => e.stopPropagation()}
                  style={{ maxHeight: '80vh' }}
                />
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-70 text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Video
                </div>
              </div>
            ) : (
              <div className="relative">
                <img 
                  src={lightboxMedia.url}
                  className="max-w-full max-h-full object-contain rounded-lg"
                  alt="Media full size"
                  onClick={(e) => e.stopPropagation()}
                  style={{ maxHeight: '80vh' }}
                />
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-70 text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Gambar
                </div>
              </div>
            )}
            <button
              onClick={closeLightbox}
              className="absolute top-4 right-4 bg-black bg-opacity-50 hover:bg-opacity-70 text-white rounded-full p-3 transition-all z-10"
            >
              <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <div className="absolute top-4 left-4 bg-black bg-opacity-70 text-white px-3 py-2 rounded-lg text-sm">
              Klik di luar media untuk menutup
            </div>
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
              Menampilkan <span className="font-semibold text-gray-800">{filteredItems.length}</span> dari{' '}
              <span className="font-semibold text-gray-800">{items.length}</span> total {title.toLowerCase()}
              {filteredItems.length !== items.length && (
                <span className="text-orange-600 font-medium"> (terfilter)</span>
              )}
            </span>
          </div>
        </div>
      </div>
    </>
  );
};

export default ManagementTable;
