import React, { useState } from 'react';
import { Head, usePage } from '@inertiajs/react';
import MainLayout from '@/Layouts/MainLayout';
import Footer from '@/Components/Footer';

type ReportResponse = {
  id: number;
  report_id: number;
  message: string;
  image_path?: string;
  file_type?: string;
  status: string;
  created_at: string;
};

type ReportImage = {
  id: number;
  image_path: string;
  file_type?: string;
};

type ReportItem = {
  id: number;
  tower_id: number;
  category: string;
  message: string;
  status: string;
  reporter_name?: string;
  reporter_phone?: string;
  created_at: string;
  tower?: { id: number; site_name: string; alamat_menara?: string };
  responses?: ReportResponse[];
  images?: ReportImage[];
};

export default function MyMessages({ reports = [] as ReportItem[] }) {
  const { auth } = usePage().props as any;
  const [selectedReport, setSelectedReport] = useState<ReportItem | null>(null);
  const [lightboxMedia, setLightboxMedia] = useState<{ url: string; type: string } | null>(null);

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'pending':
        return {
          label: 'Menunggu',
          bg: 'bg-yellow-100',
          text: 'text-yellow-800',
          border: 'border-yellow-200',
          icon: '⏳'
        };
      case 'in_progress':
        return {
          label: 'Sedang Diproses',
          bg: 'bg-blue-100',
          text: 'text-blue-800',
          border: 'border-blue-200',
          icon: '🔄'
        };
      case 'responded':
        return {
          label: 'Ada Balasan',
          bg: 'bg-purple-100',
          text: 'text-purple-800',
          border: 'border-purple-200',
          icon: '💬'
        };
      case 'closed':
      case 'resolved':
        return {
          label: 'Selesai',
          bg: 'bg-green-100',
          text: 'text-green-800',
          border: 'border-green-200',
          icon: '✅'
        };
      default:
        return {
          label: 'Unknown',
          bg: 'bg-gray-100',
          text: 'text-gray-800',
          border: 'border-gray-200',
          icon: '❓'
        };
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const openLightbox = (mediaPath: string, mediaType: string) => {
    setLightboxMedia({ url: mediaPath, type: mediaType });
  };

  const closeLightbox = () => {
    setLightboxMedia(null);
  };

  const openDetailDialog = (report: ReportItem) => {
    setSelectedReport(report);
  };

  const closeDetailDialog = () => {
    setSelectedReport(null);
  };

  return (
    <MainLayout title="Pesan Saya" currentPage="/my-messages">
      <Head title="Pesan Saya" />
      
      <div className="p-4 sm:p-6">
        {/* Header Section */}
        <div className="rounded-lg shadow mb-8 px-4 sm:px-6 py-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3" style={{ backgroundColor: '#FFF8E1' }}>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold mb-1" style={{ color: '#212121' }}>
              Pesan & Keluhan Saya
            </h1>
            <p className="text-sm sm:text-base" style={{ color: '#212121', opacity: 0.85 }}>
              Pantau status dan balasan dari keluhan yang telah Anda kirimkan
            </p>
          </div>
          <img src="/images/dprd-logo.png" alt="DPRD Kabupaten Semarang" className="h-8 w-8 sm:h-10 sm:w-10 hidden xs:block" />
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-lg p-4 shadow-lg border-l-4 border-yellow-500">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-600">Menunggu</h3>
                <p className="text-2xl font-bold text-yellow-600">
                  {reports.filter(r => r.status === 'pending').length}
                </p>
              </div>
              <div className="bg-yellow-100 p-2 rounded-full">
                <span className="text-xl">⏳</span>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-4 shadow-lg border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-600">Diproses</h3>
                <p className="text-2xl font-bold text-blue-600">
                  {reports.filter(r => r.status === 'in_progress').length}
                </p>
              </div>
              <div className="bg-blue-100 p-2 rounded-full">
                <span className="text-xl">🔄</span>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-4 shadow-lg border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-600">Selesai</h3>
                <p className="text-2xl font-bold text-green-600">
                  {reports.filter(r => ['closed', 'resolved'].includes(r.status)).length}
                </p>
              </div>
              <div className="bg-green-100 p-2 rounded-full">
                <span className="text-xl">✅</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        {reports.length === 0 ? (
          <div className="bg-white rounded-lg shadow-lg p-12 text-center">
            <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Belum Ada Keluhan</h3>
            <p className="text-gray-600 mb-4">Anda belum pernah mengirimkan keluhan atau laporan</p>
            <a
              href="/complaint"
              className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Kirim Keluhan Pertama
            </a>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden lg:block bg-white rounded-lg shadow-lg overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Keluhan</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tanggal</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Balasan</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {reports.map((report) => {
                    const statusInfo = getStatusInfo(report.status);
                    return (
                      <tr key={report.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div>
                            <div className="text-sm font-medium text-gray-900 mb-1">
                              {report.tower?.site_name || 'Tower tidak diketahui'}
                            </div>
                            <div className="text-sm text-gray-600">{report.category}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusInfo.bg} ${statusInfo.text} ${statusInfo.border}`}>
                            <span className="mr-1">{statusInfo.icon}</span>
                            {statusInfo.label}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {formatDate(report.created_at)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <span className="text-sm font-medium text-gray-900">
                              {report.responses?.length || 0}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            onClick={() => openDetailDialog(report)}
                            className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
                          >
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            Detail
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="lg:hidden space-y-4">
              {reports.map((report) => {
                const statusInfo = getStatusInfo(report.status);
                return (
                  <div key={report.id} className="bg-white rounded-lg shadow-lg p-4 border border-gray-200">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="text-sm font-medium text-gray-900 mb-1">
                          {report.tower?.site_name || 'Tower tidak diketahui'}
                        </h3>
                        <p className="text-xs text-gray-600">{report.category}</p>
                      </div>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${statusInfo.bg} ${statusInfo.text} ${statusInfo.border}`}>
                        <span className="mr-1">{statusInfo.icon}</span>
                        {statusInfo.label}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <span>📅 {formatDate(report.created_at)}</span>
                        <span>💬 {report.responses?.length || 0} balasan</span>
                      </div>
                      <button
                        onClick={() => openDetailDialog(report)}
                        className="px-3 py-1 bg-red-600 text-white text-xs rounded-lg hover:bg-red-700 transition-colors"
                      >
                        Detail
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* Summary */}
        {reports.length > 0 && (
          <div className="mt-8 bg-white rounded-lg shadow-lg p-4 sm:p-6">
            <div className="flex items-center justify-between text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <span>
                  Total <span className="font-semibold text-gray-800">{reports.length}</span> keluhan telah dikirimkan
                </span>
              </div>
              <a
                href="/complaint"
                className="flex items-center gap-1 text-red-600 hover:text-red-800 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Kirim Keluhan Baru
              </a>
            </div>
          </div>
        )}
      </div>

      {/* Detail Dialog */}
      {selectedReport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            {/* Dialog Header */}
            <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-red-50 to-red-100">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  Detail Keluhan
                </h3>
                <button
                  onClick={closeDetailDialog}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Dialog Content */}
            <div className="p-6 max-h-[calc(90vh-120px)] overflow-y-auto">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Column - Report Details */}
                <div className="space-y-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Informasi Keluhan
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center">
                        <span className="font-medium text-gray-600 w-20">Status:</span>
                        <div className="ml-1">
                          {(() => {
                            const statusInfo = getStatusInfo(selectedReport.status);
                            return (
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusInfo.bg} ${statusInfo.text} ${statusInfo.border}`}>
                                <span className="mr-1">{statusInfo.icon}</span>
                                {statusInfo.label}
                              </span>
                            );
                          })()}
                        </div>
                      </div>
                      <div className="flex items-center">
                        <span className="font-medium text-gray-600 w-20">Kategori:</span>
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
                          <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                          </svg>
                          {selectedReport.category}
                        </span>
                      </div>
                      <div className="flex items-center">
                        <span className="font-medium text-gray-600 w-20">Tanggal:</span>
                        <span className="text-gray-900">{formatDate(selectedReport.created_at)}</span>
                      </div>
                    </div>
                  </div>

                  {selectedReport.tower && (
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
                          <span className="text-gray-900">{selectedReport.tower.site_name}</span>
                        </div>
                        {selectedReport.tower.alamat_menara && (
                          <div>
                            <span className="font-medium text-gray-600 block mb-1">Alamat:</span>
                            <p className="text-gray-900 leading-relaxed">{selectedReport.tower.alamat_menara}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                      Isi Keluhan
                    </h4>
                    <p className="text-gray-900 leading-relaxed bg-white p-3 rounded border text-sm">{selectedReport.message}</p>
                  </div>

                  {/* Media Files */}
                  {selectedReport.images && selectedReport.images.length > 0 ? (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        Lampiran Media ({selectedReport.images.length})
                      </h4>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {selectedReport.images.map((media, index) => {
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
                                      video.currentTime = 1;
                                    }}
                                  />
                                  <div 
                                    className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-40 rounded-lg cursor-pointer hover:bg-opacity-30 transition-all"
                                    onClick={() => openLightbox(mediaPath, 'video')}
                                  >
                                    <div className="bg-red-600 hover:bg-red-700 rounded-full p-2 transition-all transform hover:scale-110">
                                      <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
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
                                  alt={`Lampiran ${index + 1}`}
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
                  ) : (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        Lampiran Media
                      </h4>
                      <div className="text-center py-6">
                        <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <p className="text-gray-500 text-sm">Tidak ada lampiran media</p>
                        <p className="text-gray-400 text-xs mt-1">
                          {selectedReport.images ? 
                            `Data ada tapi kosong (${selectedReport.images.length} items)` : 
                            'Data images tidak ada'
                          }
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Right Column - Responses */}
                <div className="space-y-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a2 2 0 01-2-2v-6a2 2 0 012-2h8z" />
                      </svg>
                      Balasan dari Admin ({selectedReport.responses?.length || 0})
                    </h4>
                    
                    {!selectedReport.responses || selectedReport.responses.length === 0 ? (
                      <div className="text-center py-8">
                        <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                        <p className="text-gray-500 text-sm">Belum ada balasan dari admin</p>
                        <p className="text-gray-400 text-xs mt-1">Admin akan segera merespons keluhan Anda</p>
                      </div>
                    ) : (
                      <div className="space-y-4 max-h-96 overflow-y-auto">
                        {selectedReport.responses.map((response, index) => (
                          <div key={response.id} className="bg-white rounded-lg p-4 border border-gray-200">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center">
                                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                  <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                  </svg>
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
                            
                            {/* Response Images */}
                            {response.image_path && (
                              <div className="mt-3">
                                <p className="text-xs text-gray-500 mb-2">📎 Lampiran</p>
                                <div className="grid grid-cols-3 gap-2">
                                  {(() => {
                                    const mediaPath = `/storage/${response.image_path}`;
                                    const isVideo = response.file_type?.startsWith('video/') || response.image_path.match(/\.(mp4|mov|avi|mkv)$/i);
                                    
                                    return (
                                      <div className="relative">
                                        {isVideo ? (
                                          <div className="relative">
                                            <video 
                                              src={mediaPath}
                                              className="w-full h-16 object-cover rounded border cursor-pointer hover:border-blue-400 transition-all"
                                              onClick={() => openLightbox(mediaPath, 'video')}
                                            />
                                            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-40 rounded">
                                              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                                                <path d="M8 5v14l11-7z"/>
                                              </svg>
                                            </div>
                                          </div>
                                        ) : (
                                          <img 
                                            src={mediaPath}
                                            className="w-full h-16 object-cover rounded border cursor-pointer hover:border-blue-400 transition-all"
                                            alt="Lampiran balasan"
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
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Dialog Footer */}
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end">
              <button
                onClick={closeDetailDialog}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Tutup
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
                  <span>Video Lampiran</span>
                </div>
              </div>
            ) : (
              <div className="relative">
                <img 
                  src={lightboxMedia.url}
                  className="max-w-full max-h-full object-contain rounded-lg"
                  alt="Media lampiran full size"
                  onClick={(e) => e.stopPropagation()}
                  style={{ maxHeight: '80vh' }}
                />
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-70 text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span>Foto Lampiran</span>
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

      <Footer />
    </MainLayout>
  );
}


