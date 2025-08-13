import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';

interface ReportImage { id: number; image_path: string }
interface Tower { id: number; site_name: string }
interface Report { id: number; reporter_name: string; reporter_email: string; reporter_phone: string; category: string; message: string; status: string; images?: ReportImage[]; tower?: Tower; created_at?: string }

interface Props { reports: Report[] }

const ComplaintsPage: React.FC<Props> = ({ reports = [] }) => {
  const [replyText, setReplyText] = useState<Record<number, string>>({});
  const [selectedImages, setSelectedImages] = useState<Record<number, File[]>>({});
  const [expandedCards, setExpandedCards] = useState<Record<number, boolean>>({});
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'responded':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'closed':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'in_progress':
        return (
          <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        );
      case 'responded':
        return (
          <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        );
      case 'closed':
        return (
          <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      default:
        return null;
    }
  };

  const handleStatusChange = (reportId: number, newStatus: string) => {
    router.put(route('admin.complaints.updateStatus', { report: reportId }), { status: newStatus });
  };

  const handleSendReply = (reportId: number) => {
    const msg = replyText[reportId];
    if (!msg?.trim()) return;
    
    const formData = new FormData();
    formData.append('message', msg);
    
    // Add selected images if any
    const images = selectedImages[reportId] || [];
    images.forEach((image, index) => {
      formData.append(`images[${index}]`, image);
    });
    
    router.post(route('admin.complaints.respond', { report: reportId }), formData, {
      forceFormData: true,
      onSuccess: () => {
        setReplyText({ ...replyText, [reportId]: '' });
        setSelectedImages({ ...selectedImages, [reportId]: [] });
      }
    });
  };

  const handleImageSelect = (reportId: number, files: FileList | null) => {
    if (!files) return;
    
    const validImages = Array.from(files).filter(file => {
      const isValidType = file.type.startsWith('image/');
      const isValidSize = file.size <= 5 * 1024 * 1024; // 5MB max
      return isValidType && isValidSize;
    });
    
    setSelectedImages({
      ...selectedImages,
      [reportId]: [...(selectedImages[reportId] || []), ...validImages].slice(0, 5) // Max 5 images
    });
  };

  const removeImage = (reportId: number, imageIndex: number) => {
    const currentImages = selectedImages[reportId] || [];
    const updatedImages = currentImages.filter((_, index) => index !== imageIndex);
    setSelectedImages({ ...selectedImages, [reportId]: updatedImages });
  };

  const toggleCardExpansion = (reportId: number) => {
    setExpandedCards(prev => ({ ...prev, [reportId]: !prev[reportId] }));
  };

  const openLightbox = (imagePath: string) => {
    setLightboxImage(imagePath);
  };

  const closeLightbox = () => {
    setLightboxImage(null);
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      in_progress: 'bg-blue-100 text-blue-800 border-blue-300',
      responded: 'bg-purple-100 text-purple-800 border-purple-300',
      closed: 'bg-green-100 text-green-800 border-green-300'
    };
    
    const icons = {
      pending: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
      in_progress: 'M13 10V3L4 14h7v7l9-11h-7z',
      responded: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z',
      closed: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'
    };

    const labels = {
      pending: 'PENDING',
      in_progress: 'IN PROGRESS',
      responded: 'RESPONDED',
      closed: 'CLOSED'
    };

    const mobileLabels = {
      pending: 'PENDING',
      in_progress: 'PROGRESS',
      responded: 'REPLIED',
      closed: 'CLOSED'
    };

    return (
      <span className={`inline-flex items-center px-2 sm:px-3 py-1 rounded-full text-xs font-medium border ${colors[status as keyof typeof colors] || colors.pending}`}>
        <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icons[status as keyof typeof icons] || icons.pending} />
        </svg>
        <span className="hidden sm:inline">{labels[status as keyof typeof labels] || labels.pending}</span>
        <span className="sm:hidden">{mobileLabels[status as keyof typeof mobileLabels] || mobileLabels.pending}</span>
      </span>
    );
  };

  // Filter reports
  const filteredReports = reports.filter(report => {
    const matchesStatus = filterStatus === 'all' || report.status === filterStatus;
    const matchesSearch = searchTerm === '' || 
      report.reporter_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.category.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <AdminLayout title="Complaints">
      <Head title="Complaints" />
      
      {/* Header Section */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">Kelola Keluhan</h1>
        <p className="text-sm sm:text-base text-gray-600">Pantau dan tanggapi keluhan dari masyarakat terkait tower telekomunikasi</p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
        <div className="bg-white rounded-lg p-3 sm:p-4 shadow-lg border-l-4 border-yellow-500">
          <div className="flex items-center">
            <div className="bg-yellow-100 p-2 sm:p-3 rounded-full mr-3 sm:mr-4">
              <svg className="w-4 h-4 sm:w-6 sm:h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-xs sm:text-sm font-medium text-gray-600">Pending</p>
              <p className="text-lg sm:text-2xl font-bold text-yellow-600">
                {reports.filter(r => r.status === 'pending').length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg p-3 sm:p-4 shadow-lg border-l-4 border-blue-500">
          <div className="flex items-center">
            <div className="bg-blue-100 p-2 sm:p-3 rounded-full mr-3 sm:mr-4">
              <svg className="w-4 h-4 sm:w-6 sm:h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <p className="text-xs sm:text-sm font-medium text-gray-600">
                <span className="hidden sm:inline">In Progress</span>
                <span className="sm:hidden">Progress</span>
              </p>
              <p className="text-lg sm:text-2xl font-bold text-blue-600">
                {reports.filter(r => r.status === 'in_progress').length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg p-3 sm:p-4 shadow-lg border-l-4 border-purple-500">
          <div className="flex items-center">
            <div className="bg-purple-100 p-2 sm:p-3 rounded-full mr-3 sm:mr-4">
              <svg className="w-4 h-4 sm:w-6 sm:h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <div>
              <p className="text-xs sm:text-sm font-medium text-gray-600">Responded</p>
              <p className="text-lg sm:text-2xl font-bold text-purple-600">
                {reports.filter(r => r.status === 'responded').length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg p-3 sm:p-4 shadow-lg border-l-4 border-green-500">
          <div className="flex items-center">
            <div className="bg-green-100 p-2 sm:p-3 rounded-full mr-3 sm:mr-4">
              <svg className="w-4 h-4 sm:w-6 sm:h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-xs sm:text-sm font-medium text-gray-600">Closed</p>
              <p className="text-lg sm:text-2xl font-bold text-green-600">
                {reports.filter(r => r.status === 'closed').length}
              </p>
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
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="responded">Responded</option>
              <option value="closed">Closed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Content - Card Layout */}
      <div className="space-y-4 sm:space-y-6">
        {filteredReports.length === 0 ? (
          <div className="bg-white rounded-lg shadow-lg p-8 sm:p-12 text-center">
            <svg className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm || filterStatus !== 'all' 
                ? 'Tidak ada keluhan yang sesuai dengan filter'
                : 'Belum ada keluhan yang masuk'
              }
            </h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || filterStatus !== 'all' 
                ? 'Coba ubah filter atau kata kunci pencarian'
                : 'Keluhan dari masyarakat akan muncul di sini'
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
          filteredReports.map((report) => (
            <div key={report.id} className="bg-white rounded-lg shadow-lg overflow-hidden border border-gray-200 hover:shadow-xl transition-shadow">
              {/* Card Header */}
              <div className="px-4 sm:px-6 py-4 bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                <div className="flex items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center space-x-3 sm:space-x-4 min-w-0 flex-1">
                    <div className="flex-shrink-0 h-10 w-10 sm:h-12 sm:w-12">
                      <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-gradient-to-r from-red-500 to-red-600 flex items-center justify-center">
                        <span className="text-white font-semibold text-sm sm:text-lg">
                          {report.reporter_name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-base sm:text-lg font-semibold text-gray-900 truncate">{report.reporter_name}</h3>
                      <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 space-y-1 sm:space-y-0 text-xs sm:text-sm text-gray-600">
                        <span className="flex items-center truncate">
                          <svg className="w-3 h-3 sm:w-4 sm:h-4 mr-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                          <span className="truncate">{report.reporter_email}</span>
                        </span>
                        <span className="flex items-center">
                          <svg className="w-3 h-3 sm:w-4 sm:h-4 mr-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                          </svg>
                          {report.reporter_phone}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 sm:space-x-3 flex-shrink-0">
                    {getStatusBadge(report.status)}
                    <button
                      onClick={() => toggleCardExpansion(report.id)}
                      className="p-1.5 sm:p-2 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      <svg 
                        className={`w-4 h-4 sm:w-5 sm:h-5 text-gray-600 transform transition-transform ${expandedCards[report.id] ? 'rotate-180' : ''}`} 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>

              {/* Card Content */}
              <div className="p-4 sm:p-6">
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6">
                  {/* Left Column - Report Details */}
                  <div className="xl:col-span-2 space-y-4">
                    <div className="flex flex-wrap items-center gap-2 sm:gap-4">
                      <span className="inline-flex items-center px-2 sm:px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200">
                        <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                        </svg>
                        {report.category}
                      </span>
                      {report.tower?.site_name && (
                        <span className="inline-flex items-center px-2 sm:px-3 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                          <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                          </svg>
                          <span className="truncate">{report.tower.site_name}</span>
                        </span>
                      )}
                    </div>

                    <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                        Pesan Keluhan
                      </h4>
                      <p className="text-sm text-gray-900 leading-relaxed">{report.message}</p>
                    </div>

                    {/* Images */}
                    {/* Images */}
                    {report.images && report.images.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          Lampiran Gambar ({report.images.length})
                        </h4>
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3">
                          {report.images.map((img, index) => (
                            <div key={img.id} className="relative group">
                              <img 
                                src={`/storage/${img.image_path}`} 
                                className="w-full h-16 sm:h-20 lg:h-24 object-cover rounded-lg border-2 border-gray-200 hover:border-red-400 transition-all cursor-pointer transform hover:scale-105"
                                alt={`Lampiran keluhan ${index + 1}`}
                                onClick={() => openLightbox(`/storage/${img.image_path}`)}
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 rounded-lg transition-all flex items-end justify-center pb-1 sm:pb-2">
                                <div className="text-white text-xs bg-black/70 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded">
                                  Klik untuk memperbesar
                                </div>
                              </div>
                              <div className="absolute top-1 right-1 bg-black/50 text-white text-xs px-1 sm:px-1.5 py-0.5 rounded">
                                {index + 1}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Right Column - Actions */}
                  <div className="space-y-4">
                    {/* Status Change */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Status Keluhan
                      </label>
                      <select 
                        className="w-full border border-gray-300 rounded-lg p-2 sm:p-3 text-sm focus:ring-2 focus:ring-red-400 focus:border-transparent transition-all" 
                        value={report.status} 
                        onChange={(e) => handleStatusChange(report.id, e.target.value)}
                      >
                        <option value="pending">Pending</option>
                        <option value="in_progress">In Progress</option>
                        <option value="responded">Responded</option>
                        <option value="closed">Closed</option>
                      </select>
                    </div>

                    {/* Response Section */}
                    <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                        </svg>
                        Kirim Respon
                      </h4>
                      <div className="space-y-3">
                        <textarea
                          className="w-full border border-gray-300 rounded-lg p-2 sm:p-3 text-sm focus:ring-2 focus:ring-red-400 focus:border-transparent transition-all resize-none" 
                          rows={3}
                          placeholder="Tulis respon untuk keluhan ini..." 
                          value={replyText[report.id] ?? ''} 
                          onChange={(e) => setReplyText({ ...replyText, [report.id]: e.target.value })}
                        />
                        
                        {/* Image Upload */}
                        <div className="space-y-2">
                          <label className="flex items-center gap-2 px-2 sm:px-3 py-2 bg-white hover:bg-gray-50 text-gray-700 rounded-lg cursor-pointer transition-colors text-sm border border-gray-300">
                            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <span className="truncate">Lampirkan Gambar</span>
                            <input
                              type="file"
                              accept="image/*"
                              multiple
                              className="hidden"
                              onChange={(e) => handleImageSelect(report.id, e.target.files)}
                            />
                          </label>
                          <p className="text-xs text-gray-500">Max 5 gambar, 5MB per file</p>
                          
                          {/* Selected Images Preview */}
                          {selectedImages[report.id] && selectedImages[report.id].length > 0 && (
                            <div className="grid grid-cols-3 gap-2 p-2 bg-white rounded-lg border border-gray-200">
                              {selectedImages[report.id].map((image, index) => (
                                <div key={index} className="relative group">
                                  <img
                                    src={URL.createObjectURL(image)}
                                    className="w-full h-12 sm:h-16 object-cover rounded-lg border border-gray-300"
                                    alt={`Preview ${index + 1}`}
                                  />
                                  <button
                                    onClick={() => removeImage(report.id, index)}
                                    className="absolute -top-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xs hover:bg-red-600"
                                  >
                                    ×
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        <button 
                          className="w-full px-4 py-2 sm:py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg hover:from-red-700 hover:to-red-800 transition-all shadow-lg hover:shadow-xl font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                          onClick={() => handleSendReply(report.id)}
                          disabled={!replyText[report.id]?.trim()}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                          </svg>
                          Kirim Respon
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Lightbox Modal */}
      {lightboxImage && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4" 
          onClick={closeLightbox}
        >
          <div className="relative max-w-4xl max-h-full">
            <img 
              src={lightboxImage}
              className="max-w-full max-h-full object-contain rounded-lg"
              alt="Gambar keluhan full size"
              onClick={(e) => e.stopPropagation()}
            />
            <button
              onClick={closeLightbox}
              className="absolute top-2 right-2 bg-black bg-opacity-50 hover:bg-opacity-70 text-white rounded-full p-2 transition-all"
            >
              <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-50 text-white px-3 py-1 rounded-lg text-sm">
              Klik di luar gambar untuk menutup
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
              Menampilkan <span className="font-semibold text-gray-800">{filteredReports.length}</span> dari{' '}
              <span className="font-semibold text-gray-800">{reports.length}</span> total keluhan
              {filteredReports.length !== reports.length && (
                <span className="text-gray-500"> (difilter)</span>
              )}
            </span>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default ComplaintsPage;


