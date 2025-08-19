import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';

interface ReportImage { id: number; image_path: string; file_type?: string }
interface ReportResponse { 
  id: number; 
  report_id: number; 
  user_id: number; 
  message: string; 
  image_path?: string; 
  file_type?: string; 
  status: string;
  created_at: string; 
}
interface Tower { id: number; site_name: string; alamat_menara?: string }
interface Report { 
  id: number; 
  user_id: number; 
  reporter_name?: string;
  reporter_phone: string; 
  category: string; 
  message: string; 
  status: string; 
  images?: ReportImage[]; 
  tower?: Tower; 
  user?: { name: string; email: string }; 
  created_at?: string;
  responses?: ReportResponse[];
}

interface Status {
  id: number;
  name: string;
  slug: string;
  color: string;
  icon: string;
}

interface Props { 
  reports: Report[];
  statuses?: Status[];
}

const ComplaintsPage: React.FC<Props> = ({ reports = [], statuses = [] }) => {
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
  const [replyStatus, setReplyStatus] = useState<Record<number, string>>({});
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [lightboxMedia, setLightboxMedia] = useState<{ url: string; type: string } | null>(null);
  const [replyModal, setReplyModal] = useState<{ isOpen: boolean; report: Report | null }>({
    isOpen: false,
    report: null
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

  const openReplyModal = (report: Report) => {
    setReplyModal({ isOpen: true, report });
    // Set default status to current report status
    setReplyStatus({ [report.id]: report.status });
  };

  const closeReplyModal = () => {
    setReplyModal({ isOpen: false, report: null });
    setReplyText({});
    setSelectedFiles({});
    setReplyStatus({});
  };

  const handleStatusChange = (reportId: number, newStatus: string) => {
    router.put(route('admin.complaints.updateStatus', { report: reportId }), { status_id: newStatus });
  };

  const handleSendReply = (reportId: number) => {
    const msg = replyText[reportId];
    const status = replyStatus[reportId];
    if (!msg?.trim() || !status) return;
    
    const formData = new FormData();
    formData.append('message', msg);
    formData.append('status_id', status);
    
    // Add selected files (images and videos) if any
    const files = selectedFiles[reportId] || [];
    files.forEach((file, index) => {
      if (file.type.startsWith('image/')) {
        formData.append(`images[${index}]`, file);
      } else if (file.type.startsWith('video/')) {
        formData.append(`videos[${index}]`, file);
      }
    });
    
    router.post(route('admin.complaints.respond', { report: reportId }), formData, {
      forceFormData: true,
      onSuccess: () => {
        closeReplyModal();
      }
    });
  };

  const handleFileSelect = (reportId: number, files: FileList | null) => {
    if (!files) return;
    
    const currentFiles = selectedFiles[reportId] || [];
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
      [reportId]: [...currentFiles, ...validFiles]
    });
  };

  const removeFile = (reportId: number, fileIndex: number) => {
    const currentFiles = selectedFiles[reportId] || [];
    const updatedFiles = currentFiles.filter((_, index) => index !== fileIndex);
    setSelectedFiles({ ...selectedFiles, [reportId]: updatedFiles });
  };

  const openLightbox = (mediaPath: string, mediaType: string) => {
    setLightboxMedia({ url: mediaPath, type: mediaType });
  };

  const closeLightbox = () => {
    setLightboxMedia(null);
  };

  // Filter reports
  const filteredReports = reports.filter(report => {
    const matchesStatus = filterStatus === 'all' || report.status === filterStatus;
    const reporterName = report.reporter_name || report.user?.name || '';
    const reporterEmail = report.user?.email || '';
    const matchesSearch = searchTerm === '' || 
      reporterName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reporterEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.category.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <AdminLayout title="Complaints">
      <Head title="Complaints" />
      
      {/* Header Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Kelola Keluhan</h1>
        <p className="text-gray-600">Pantau dan tanggapi keluhan dari masyarakat terkait tower telekomunikasi</p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-lg p-6 shadow-lg border-l-4 border-red-500">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-800">Baru</h3>
              <p className="text-3xl font-bold text-red-600">
                {reports.filter(r => r.status === 'pending').length}
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
                {reports.filter(r => r.status === 'in_progress').length}
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
                {reports.filter(r => r.status === 'closed').length}
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
        {filteredReports.length === 0 ? (
          <div className="p-8 sm:p-12 text-center">
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
          <>
            {/* Desktop Table */}
            <div className="hidden lg:block">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Nama
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
                  {filteredReports.map((report) => (
                    <tr key={report.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-gradient-to-r from-red-500 to-red-600 flex items-center justify-center">
                              <span className="text-white font-semibold text-sm">
                                {(report.reporter_name || report.user?.name || '?').charAt(0).toUpperCase()}
                              </span>
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {report.reporter_name || report.user?.name || 'Unknown'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <select
                          value={report.status || 'pending'}
                          onChange={(e) => handleStatusChange(report.id, e.target.value)}
                          className={`text-xs font-medium border rounded-full px-2 py-1 focus:outline-none focus:ring-2 focus:ring-offset-2 ${getStatusColor(report.status || 'pending')}`}
                        >
                          <option value="pending">BARU</option>
                          <option value="in_progress">PROGRESS</option>
                          <option value="closed">SELESAI</option>
                        </select>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(report.created_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => openReplyModal(report)}
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
              {filteredReports.map((report) => (
                <div key={report.id} className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-r from-red-500 to-red-600 flex items-center justify-center">
                          <span className="text-white font-semibold text-sm">
                            {(report.reporter_name || report.user?.name || '?').charAt(0).toUpperCase()}
                          </span>
                        </div>
                      </div>
                      <div className="ml-3">
                        <div className="text-sm font-medium text-gray-900">
                          {report.reporter_name || report.user?.name || 'Unknown'}
                        </div>
                        <div className="text-xs text-gray-500">
                          {formatDate(report.created_at)}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <select
                        value={report.status || 'pending'}
                        onChange={(e) => handleStatusChange(report.id, e.target.value)}
                        className={`text-xs font-medium border rounded-full px-2 py-1 focus:outline-none focus:ring-2 focus:ring-offset-2 ${getStatusColor(report.status || 'pending')}`}
                      >
                        <option value="pending">BARU</option>
                        <option value="in_progress">PROGRESS</option>
                        <option value="closed">SELESAI</option>
                      </select>
                      <button
                        onClick={() => openReplyModal(report)}
                        className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
                      >
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                        </svg>
                        Balas
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Reply Modal */}
      {replyModal.isOpen && replyModal.report && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-red-50 to-red-100">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                  </svg>
                  Balas Keluhan
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
                {/* Left Column - Report Details */}
                <div className="space-y-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      Informasi Pelapor
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center">
                        <span className="font-medium text-gray-600 w-16">Nama:</span>
                        <span className="text-gray-900">{replyModal.report.reporter_name || replyModal.report.user?.name || '-'}</span>
                      </div>
                      <div className="flex items-center">
                        <span className="font-medium text-gray-600 w-16">Email:</span>
                        <span className="text-gray-900">{replyModal.report.user?.email || '-'}</span>
                      </div>
                      <div className="flex items-center">
                        <span className="font-medium text-gray-600 w-16">Telepon:</span>
                        <span className="text-gray-900">{replyModal.report.reporter_phone}</span>
                      </div>
                      <div className="flex items-center">
                        <span className="font-medium text-gray-600 w-16">Status:</span>
                        <div className="ml-1">
                          {getStatusBadge(replyModal.report.status)}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                      Detail Keluhan
                    </h4>
                    <div className="space-y-3 text-sm">
                      <div>
                        <span className="font-medium text-gray-600 block mb-1">Kategori:</span>
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
                          <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                          </svg>
                          {replyModal.report.category}
                        </span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-600 block mb-1">Pesan Keluhan:</span>
                        <p className="text-gray-900 leading-relaxed bg-white p-3 rounded border">{replyModal.report.message}</p>
                      </div>
                    </div>
                  </div>

                  {replyModal.report.tower && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        Informasi Tower
                      </h4>
                      <div className="space-y-2 text-sm">
                        <div>
                          <span className="font-medium text-gray-600 block mb-1">Nama Site:</span>
                          <span className="text-gray-900">{replyModal.report.tower.site_name}</span>
                        </div>
                        {replyModal.report.tower.alamat_menara && (
                          <div>
                            <span className="font-medium text-gray-600 block mb-1">Alamat Detail:</span>
                            <p className="text-gray-900 leading-relaxed">{replyModal.report.tower.alamat_menara}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Media Files */}
                  {replyModal.report.images && replyModal.report.images.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 002 2z" />
                        </svg>
                        Lampiran Media ({replyModal.report.images.length})
                      </h4>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {replyModal.report.images.map((media, index) => {
                          const mediaPath = `/storage/${media.image_path}`;
                          const isVideo = media.file_type?.startsWith('video/') || media.image_path.match(/\.(mp4|mov|avi|mkv)$/i);
                          
                          return (
                            <div key={media.id} className="relative group">
                              {isVideo ? (
                                <div className="relative">
                                  <video 
                                    src={mediaPath}
                                    className="w-full h-20 object-cover rounded-lg border-2 border-gray-200 hover:border-red-400 transition-all cursor-pointer"
                                    onClick={() => openLightbox(mediaPath, 'video')}
                                    onMouseEnter={(e) => {
                                      const video = e.target as HTMLVideoElement;
                                      video.currentTime = 1; // Set to 1 second for better thumbnail
                                    }}
                                  />
                                  <div 
                                    className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-40 rounded-lg cursor-pointer hover:bg-opacity-30 transition-all"
                                    onClick={() => openLightbox(mediaPath, 'video')}
                                  >
                                    <div className="bg-red-600 hover:bg-red-700 rounded-full p-2 transition-all transform hover:scale-110">
                                      <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M8 5v14l11-7z"/>
                                      </svg>
                                    </div>
                                  </div>
                                  <div className="absolute top-1 left-1 bg-red-600 text-white text-xs px-1.5 py-0.5 rounded">
                                    VIDEO
                                  </div>
                                </div>
                              ) : (
                                <img 
                                  src={mediaPath}
                                  className="w-full h-20 object-cover rounded-lg border-2 border-gray-200 hover:border-red-400 transition-all cursor-pointer transform hover:scale-105"
                                  alt={`Lampiran keluhan ${index + 1}`}
                                  onClick={() => openLightbox(mediaPath, 'image')}
                                />
                              )}
                              <div className="absolute top-1 right-1 bg-black/50 text-white text-xs px-1.5 py-0.5 rounded">
                                {index + 1}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* Right Column - Response Form */}
                <div className="space-y-4">
                  {/* Response Section */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      </svg>
                      Kirim Respon
                    </label>
                    <textarea
                      className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-red-400 focus:border-transparent transition-all resize-none" 
                      rows={4}
                      placeholder="Tulis respon untuk keluhan ini..." 
                      value={replyModal.report ? (replyText[replyModal.report.id] ?? '') : ''} 
                      onChange={(e) => replyModal.report && setReplyText({ ...replyText, [replyModal.report.id]: e.target.value })}
                    />
                  </div>

                  {/* Status Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Status Keluhan
                    </label>
                    <select
                      className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-red-400 focus:border-transparent transition-all"
                      value={replyModal.report ? (replyStatus[replyModal.report.id] ?? replyModal.report.status ?? 'pending') : 'pending'}
                      onChange={(e) => replyModal.report && setReplyStatus({ ...replyStatus, [replyModal.report.id]: e.target.value })}
                    >
                      <option value="pending">Pending</option>
                      <option value="in_progress">Progress</option>
                      <option value="closed">Selesai</option>
                    </select>
                  </div>
                  
                  {/* Image Upload */}
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 px-3 py-2 bg-white hover:bg-gray-50 text-gray-700 rounded-lg cursor-pointer transition-colors text-sm border border-gray-300">
                      <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span>Lampirkan File (Gambar/Video)</span>
                      <input
                        type="file"
                        accept="image/*,video/*,.mp4,.mov,.avi,.mkv"
                        multiple
                        className="hidden"
                        onChange={(e) => replyModal.report && handleFileSelect(replyModal.report.id, e.target.files)}
                      />
                    </label>
                    <p className="text-xs text-gray-500">Max 3 gambar (5MB), 2 video (50MB)</p>
                    
                    {/* Selected Files Preview */}
                    {replyModal.report && selectedFiles[replyModal.report.id] && selectedFiles[replyModal.report.id].length > 0 && (
                      <div className="grid grid-cols-3 gap-2 p-2 bg-white rounded-lg border border-gray-200">
                        {selectedFiles[replyModal.report.id].map((file: File, index: number) => (
                          <div key={index} className="relative group">
                            {file.type.startsWith('image/') ? (
                              <img
                                src={URL.createObjectURL(file)}
                                className="w-full h-16 object-cover rounded-lg border border-gray-300"
                                alt={`Preview ${index + 1}`}
                              />
                            ) : (
                              <div className="w-full h-16 bg-gray-100 rounded-lg border border-gray-300 flex items-center justify-center">
                                <div className="text-center">
                                  <svg className="w-4 h-4 text-gray-500 mx-auto mb-1" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M8 5v14l11-7z"/>
                                  </svg>
                                  <span className="text-xs text-gray-500">VIDEO</span>
                                </div>
                              </div>
                            )}
                            <div className="absolute -bottom-1 left-0 right-0 bg-black bg-opacity-75 text-white text-xs px-1 py-0.5 rounded-b truncate">
                              {file.name}
                            </div>
                            <button
                              onClick={() => replyModal.report && removeFile(replyModal.report.id, index)}
                              className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xs hover:bg-red-600"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Response History */}
                  {replyModal.report && replyModal.report.responses && replyModal.report.responses.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                        Riwayat Balasan ({replyModal.report.responses.length})
                      </h4>
                      <div className="space-y-3 max-h-60 overflow-y-auto">
                        {replyModal.report.responses.map((response, index) => (
                          <div key={response.id} className="bg-white border border-gray-200 rounded-lg p-3">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center">
                                <div className="flex-shrink-0 h-8 w-8">
                                  <div className="h-8 w-8 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center">
                                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                  </div>
                                </div>
                                <div className="ml-3">
                                  <p className="text-sm font-medium text-gray-900">Admin</p>
                                  <p className="text-xs text-gray-500">{formatDate(response.created_at)}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                                  Balasan #{index + 1}
                                </span>
                                <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                                  response.status === 'in_progress' 
                                    ? 'bg-orange-100 text-orange-800' 
                                    : response.status === 'closed'
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-gray-100 text-gray-800'
                                }`}>
                                  {response.status === 'in_progress' ? 'PROGRESS' : 
                                   response.status === 'closed' ? 'SELESAI' : 'PENDING'}
                                </span>
                              </div>
                            </div>
                            <p className="text-sm text-gray-700 leading-relaxed">{response.message}</p>
                            
                            {/* Response Media */}
                            {response.image_path && (
                              <div className="mt-3">
                                <p className="text-xs text-gray-500 mb-2">📎 Lampiran</p>
                                <div className="grid grid-cols-3 gap-2">
                                  {(() => {
                                    const mediaPath = `/storage/${response.image_path}`;
                                    const isVideo = response.file_type?.startsWith('video/') || response.image_path.match(/\.(mp4|mov|avi|mkv)$/i);
                                    
                                    return (
                                      <div className="relative group">
                                        {isVideo ? (
                                          <div className="relative">
                                            <video 
                                              src={mediaPath}
                                              className="w-full h-16 object-cover rounded-lg border-2 border-gray-200 hover:border-blue-400 transition-all cursor-pointer"
                                              onClick={() => openLightbox(mediaPath, 'video')}
                                              onMouseEnter={(e) => {
                                                const video = e.target as HTMLVideoElement;
                                                video.currentTime = 1;
                                              }}
                                            />
                                            <div 
                                              className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-40 rounded-lg cursor-pointer hover:bg-opacity-30 transition-all"
                                              onClick={() => openLightbox(mediaPath, 'video')}
                                            >
                                              <div className="bg-blue-600 hover:bg-blue-700 rounded-full p-1.5 transition-all transform hover:scale-110">
                                                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                                                  <path d="M8 5v14l11-7z"/>
                                                </svg>
                                              </div>
                                            </div>
                                            <div className="absolute top-1 left-1 bg-blue-600 text-white text-xs px-1.5 py-0.5 rounded">
                                              VIDEO
                                            </div>
                                          </div>
                                        ) : (
                                          <img 
                                            src={mediaPath}
                                            className="w-full h-16 object-cover rounded-lg border-2 border-gray-200 hover:border-blue-400 transition-all cursor-pointer transform hover:scale-105"
                                            alt={`Lampiran balasan ${index + 1}`}
                                            onClick={() => openLightbox(mediaPath, 'image')}
                                          />
                                        )}
                                      </div>
                                    );
                                  })()}
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
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
                onClick={() => replyModal.report && handleSendReply(replyModal.report.id)}
                disabled={!replyModal.report || !replyText[replyModal.report.id]?.trim() || !replyStatus[replyModal.report.id]}
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
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z"/>
                  </svg>
                  <span>Video Lampiran Keluhan</span>
                </div>
              </div>
            ) : (
              <div className="relative">
                <img 
                  src={lightboxMedia.url}
                  className="max-w-full max-h-full object-contain rounded-lg"
                  alt="Media keluhan full size"
                  onClick={(e) => e.stopPropagation()}
                  style={{ maxHeight: '80vh' }}
                />
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-70 text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span>Foto Lampiran Keluhan</span>
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