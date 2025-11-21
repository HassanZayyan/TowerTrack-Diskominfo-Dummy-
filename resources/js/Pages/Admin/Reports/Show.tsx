import React, { useState, useEffect } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import VideoThumbnail from '@/Components/VideoThumbnail';
import AnimatedButton from '@/Components/AnimatedButton';
import StaggeredContainer from '@/Components/StaggeredContainer';
import MessageResponseTimeline, { MessageResponseItem } from '@/Components/MyMessages/MessageResponseTimeline';
import MediaLightbox from '@/Components/MediaLightbox';
import { PageProps } from '@/types';
import { formatDateWithTime } from '@/utils/dateHelpers';
import { renderMessageStatusBadge, getStatusColor } from '@/utils/statusHelpers';
import { getMediaUrl, isImage, isVideo, validateMediaFile } from '@/utils/mediaHelpers';
import { mapReportResponses } from '@/utils/responseMapper';

interface ReportAsset {
  id: number;
  file_path: string;
  file_type: string;
  mime_type?: string;
}

interface User {
  id: number;
  name: string;
  email: string;
}

interface Tower {
  id: number;
  site_name: string;
  alamat_menara?: string;
}

interface ReportResponseAsset {
  id: number;
  file_path: string;
  file_type: string;
  mime_type?: string;
}

interface ReportResponse {
  id: number;
  report_id: number;
  user_id: number | null;
  message: string | null;
  created_at: string;
  user?: User | null;
  assets?: ReportResponseAsset[];
  sender_type?: 'staff' | 'reporter' | 'guest';
  sender_name?: string | null;
  sender_email?: string | null;
  sender_phone?: string | null;
}

interface Report {
  id: number;
  tower_id: number | null;
  user_id: number;
  reporter_phone: string;
  reporter_name?: string;
  category: string;
  message: string;
  status: string;
  created_at: string;
  updated_at: string;
  user?: User;
  tower?: Tower;
  images?: ReportAsset[];
  responses?: ReportResponse[];
  email?: string;
}

interface Props extends PageProps {
  report: Report;
}

const ReportShow: React.FC<Props> = ({ report: initialReport }) => {
  const { props } = usePage<Props>();
  const report = props.report;
  
  const [replyMessage, setReplyMessage] = useState('');
  const [replyStatus, setReplyStatus] = useState(report.status);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxSrc, setLightboxSrc] = useState('');
  const [lightboxType, setLightboxType] = useState<'image' | 'video'>('image');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Sync replyStatus with report status from server
  useEffect(() => {
    setReplyStatus(report.status);
  }, [report.status]);

  const handleFileSelection = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      // Filter valid files (images, videos, max 5 files)
      const validFiles = files
        .filter(file => {
          const validation = validateMediaFile(file);
          return validation.valid;
        })
        .slice(0, 5);
      
      setSelectedFiles(currentFiles => [...currentFiles, ...validFiles].slice(0, 5));
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(files => files.filter((_, i) => i !== index));
  };

  const openLightbox = (src: string, type: 'image' | 'video') => {
    setLightboxSrc(src);
    setLightboxType(type);
    setLightboxOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // First update the status if it has changed
    if (replyStatus !== report.status) {
      router.put(route('admin.complaints.updateStatus', report.id), {
        status_id: replyStatus,
      }, {
        onSuccess: () => {
          // After status update, send the response if there's a message
          if (replyMessage.trim()) {
            sendResponse();
          } else {
            setIsSubmitting(false);
          }
        },
        onError: () => {
          setIsSubmitting(false);
        }
      });
    } else if (replyMessage.trim()) {
      // If status hasn't changed but there's a message, send response directly
      sendResponse();
    } else {
      setIsSubmitting(false);
    }
  };

  const sendResponse = () => {
    const formData = new FormData();
    formData.append('message', replyMessage);
    formData.append('status_id', replyStatus);
    
    // Add files to form data
    selectedFiles.forEach((file, index) => {
      if (file.type.startsWith('image/')) {
        formData.append(`images[${index}]`, file);
      } else if (file.type.startsWith('video/')) {
        formData.append(`videos[${index}]`, file);
      }
    });
    
    router.post(route('admin.complaints.respond', report.id), formData, {
      forceFormData: true,
      onSuccess: () => {
        setReplyMessage('');
        setSelectedFiles([]);
        setIsSubmitting(false);
      },
      onError: () => {
        setIsSubmitting(false);
      }
    });
  };

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value;
    setReplyStatus(newStatus);
  };

  const mappedResponses = mapReportResponses(report.responses);

  const resolveReportStatusStyle = (statusValue: string | null | undefined) => {
    return getStatusColor(statusValue);
  };

  return (
    <AdminLayout title="Detail Keluhan">
      <Head title="Detail Keluhan" />
      
      {/* Back button */}
      <StaggeredContainer delay={0} animationType="fadeInLeft" duration={400}>
        <div className="mb-6">
          <AnimatedButton
            variant="outline"
            size="md"
            animation="scale"
            onClick={() => router.visit(route('admin.messages.index', { tab: 'complaints' }))}
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
              </svg>
            }
            className="border-red-500 text-red-700 hover:bg-red-600 hover:text-white"
          >
            Kembali ke Daftar Keluhan
          </AnimatedButton>
        </div>
      </StaggeredContainer>

      <StaggeredContainer delay={100} animationType="fadeInUp" duration={500}>
        <div className="relative rounded-xl shadow-lg mb-8 px-6 sm:px-8 py-6 overflow-hidden bg-gradient-to-br from-red-50 via-white to-red-50 border border-red-100">
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-red-100/30 to-transparent rounded-full blur-3xl -z-0"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-red-100/20 to-transparent rounded-full blur-2xl -z-0"></div>
          
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-red-600 to-red-700 rounded-lg shadow-md">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-red-700 to-red-600 bg-clip-text text-transparent">
                    Detail Keluhan #{report.id}
                  </h1>
                  <p className="text-sm text-gray-600 mt-1">
                    Dikirim: {formatDateWithTime(report.created_at)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-600 font-medium">Status:</span>
                {renderMessageStatusBadge(report.status)}
              </div>
            </div>
          </div>
        </div>
      </StaggeredContainer>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column - Report details */}
        <div className="lg:col-span-2 space-y-6">
          <StaggeredContainer delay={200} animationType="fadeInUp" duration={500}>
            {/* Sender Information Card */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200 shadow-md">
              <div className="flex items-center gap-3 mb-5">
                <div className="p-2.5 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-md">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-gray-900">Informasi Pelapor</h3>
              </div>
              
              <div className="flex flex-col sm:flex-row sm:items-center gap-4 bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-blue-100">
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className="flex-shrink-0 h-16 w-16 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-lg ring-4 ring-white">
                    <span className="text-white font-bold text-2xl">
                      {(report.reporter_name || report.user?.name || '?').charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-1 truncate">
                      {report.reporter_name || report.user?.name || 'Anonim'}
                    </h2>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-sm text-gray-600">
                      <div className="flex items-center gap-1 min-w-0">
                        <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                        <span className="font-medium break-all">{report.reporter_phone || '-'}</span>
                      </div>
                      {(report.user?.email || (report as any).email) && (
                        <>
                          <span className="hidden sm:inline text-gray-400">•</span>
                          <div className="flex items-center gap-1 min-w-0">
                            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                            <span className="font-medium break-all truncate">{(report as any).email || report.user?.email}</span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <span className="inline-flex items-center px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold bg-red-100 text-red-800 border border-red-200 shadow-sm flex-shrink-0 self-start sm:self-center">
                  {report.category}
                </span>
              </div>
            </div>
          </StaggeredContainer>

          <StaggeredContainer delay={250} animationType="fadeInUp" duration={500}>
            {/* Message Content Card */}
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-md">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-sm">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-gray-900">Pesan Keluhan</h3>
              </div>
              <div className="text-gray-900 whitespace-pre-wrap leading-relaxed bg-gradient-to-br from-gray-50 to-white p-5 rounded-lg border border-gray-200">
                {report.message}
              </div>
            </div>
          </StaggeredContainer>

          {/* Tower Information */}
          {report.tower && (
            <StaggeredContainer delay={300} animationType="fadeInUp" duration={500}>
              <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-md">
                <div className="flex items-center gap-2 mb-4">
                  <div className="p-2 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow-sm">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">Informasi Tower</h3>
                </div>
                <div className="bg-gradient-to-br from-purple-50 to-white p-5 rounded-lg border border-purple-100">
                  <div className="flex items-start gap-2 mb-3">
                    <svg className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-600 mb-1 font-medium">Nama Site</p>
                      <p className="text-base font-bold text-gray-900 break-words">{report.tower.site_name}</p>
                    </div>
                  </div>
                  {report.tower.alamat_menara && (
                    <div className="flex items-start gap-2 pt-3 border-t border-purple-100">
                      <svg className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-600 mb-1 font-medium">Alamat</p>
                        <p className="text-sm text-gray-700 break-words leading-relaxed">{report.tower.alamat_menara}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </StaggeredContainer>
          )}

          {/* Attached Media */}
          {report.images && report.images.length > 0 && (
            <StaggeredContainer delay={350} animationType="fadeInUp" duration={500}>
              <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-md">
                <div className="flex items-center gap-2 mb-4">
                  <div className="p-2 bg-gradient-to-br from-pink-500 to-pink-600 rounded-lg shadow-sm">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">Media Lampiran</h3>
                  <span className="ml-auto text-xs font-medium text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                    {report.images.length} file
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {report.images.map((asset, index) => {
                    const mediaUrl = getMediaUrl(asset.file_path);
                    const isImg = isImage(asset.file_path, asset.file_type);
                    const isVid = isVideo(asset.file_path, asset.file_type);

                    return (
                      <div key={asset.id} className="relative group overflow-hidden rounded-xl border-2 border-gray-200 hover:border-pink-400 transition-all shadow-sm hover:shadow-lg duration-300">
                        {isImg ? (
                          <img
                            src={mediaUrl}
                            alt={`Lampiran ${index + 1}`}
                            className="w-full h-32 object-contain cursor-pointer bg-gray-50"
                            onClick={() => openLightbox(mediaUrl, 'image')}
                          />
                        ) : isVid ? (
                          <VideoThumbnail
                            src={mediaUrl}
                            fileType="video"
                            className="w-full h-32 rounded-xl"
                            onClick={() => openLightbox(mediaUrl, 'video')}
                            showPlayButton={true}
                            alt={`Video lampiran ${index + 1}`}
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-full h-32 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                            <div className="text-center">
                              <svg className="w-10 h-10 text-gray-400 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                              </svg>
                              <span className="text-xs text-gray-600">File</span>
                            </div>
                          </div>
                        )}
                        
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center">
                          <button
                            onClick={() => openLightbox(mediaUrl, isImg ? 'image' : 'video')}
                            className="p-2 bg-white rounded-full shadow-lg transform scale-90 group-hover:scale-100 transition-transform"
                          >
                            <svg className="w-6 h-6 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </StaggeredContainer>
          )}

        </div>

        {/* Right column - Reply form */}
        <div className="lg:col-span-1 space-y-6">
          {/* Reply Form */}
          <StaggeredContainer delay={400} animationType="fadeInRight" duration={500}>
            <div className="bg-gradient-to-br from-indigo-50 to-white rounded-xl shadow-lg border border-indigo-200 p-6">
              <div className="flex items-center gap-2 mb-5">
                <div className="p-2 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg shadow-sm">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-gray-900">Balas Keluhan</h3>
              </div>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label htmlFor="status" className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                    <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Update Status
                  </label>
                  <div className="relative">
                    <select
                      id="status"
                      value={replyStatus}
                      onChange={handleStatusChange}
                      className="w-full appearance-none bg-white border-2 border-indigo-200 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 pr-10 py-3 px-4 cursor-pointer transition-all duration-200 hover:border-indigo-300 font-medium"
                      required
                    >
                      <option value="pending">🔴 BARU</option>
                      <option value="in_progress">🟡 PROGRESS</option>
                      <option value="closed">🟢 SELESAI</option>
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>

                <div>
                  <label htmlFor="message" className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                    <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                    </svg>
                    Pesan Balasan
                  </label>
                  <textarea
                    id="message"
                    value={replyMessage}
                    onChange={(e) => setReplyMessage(e.target.value)}
                    rows={6}
                    maxLength={1000}
                    className="w-full border-2 border-indigo-200 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 p-3 transition-all duration-200 hover:border-indigo-300"
                    placeholder="Tulis balasan untuk keluhan ini... (opsional jika hanya ingin update status)"
                  ></textarea>
                  <div className="flex items-center justify-between mt-2">
                    <div className="text-xs text-gray-500">
                      {replyMessage.length}/1000 karakter
                    </div>
                    <div className={`text-xs font-medium ${replyMessage.length > 900 ? 'text-red-600' : 'text-gray-500'}`}>
                      {1000 - replyMessage.length} tersisa
                    </div>
                  </div>
                </div>

                <div>
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                    <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Lampirkan Media <span className="text-gray-500 font-normal">(Opsional)</span>
                  </label>
                  <div className="mt-1 flex justify-center px-6 pt-6 pb-6 border-2 border-indigo-200 border-dashed rounded-xl bg-white/50 backdrop-blur-sm hover:border-indigo-300 transition-colors">
                    <div className="space-y-2 text-center">
                      <svg className="mx-auto h-12 w-12 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      <div className="flex text-sm text-gray-600">
                        <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-semibold text-indigo-600 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500 px-2 py-1">
                          <span>Upload file</span>
                          <input
                            id="file-upload"
                            name="file-upload"
                            type="file"
                            className="sr-only"
                            multiple
                            accept="image/*,video/*"
                            onChange={handleFileSelection}
                          />
                        </label>
                        <p className="pl-1">atau drag and drop</p>
                      </div>
                      <p className="text-xs text-gray-500">
                        PNG, JPG, MP4 hingga 5MB (gambar) atau 50MB (video)
                      </p>
                    </div>
                  </div>
                  
                  {/* Selected files preview */}
                  {selectedFiles.length > 0 && (
                    <div className="mt-4 space-y-2">
                      {selectedFiles.map((file, index) => (
                        <div key={index} className="relative bg-white border-2 border-indigo-100 rounded-lg p-3 hover:border-indigo-300 transition-colors">
                          <div className="flex items-center gap-3">
                            <div className="flex-shrink-0 p-2 bg-indigo-100 rounded-lg">
                              <svg className="h-5 w-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                {file.type.startsWith('image/') ? (
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                ) : (
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                )}
                              </svg>
                            </div>
                            <div className="flex-1 min-w-0">
                              <span className="text-sm font-medium text-gray-900 truncate block">{file.name}</span>
                              <span className="text-xs text-gray-500">{(file.size / 1024).toFixed(1)} KB</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeFile(index)}
                              className="flex-shrink-0 p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <AnimatedButton
                    type="submit"
                    variant="primary"
                    size="lg"
                    animation="glow"
                    fullWidth
                    disabled={isSubmitting || (!replyMessage.trim() && replyStatus === report.status)}
                    loading={isSubmitting}
                    icon={
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      </svg>
                    }
                  >
                    {isSubmitting ? 'Memproses...' : (replyMessage.trim() ? 'Kirim Balasan' : 'Update Status')}
                  </AnimatedButton>
                </div>
              </form>
            </div>
          </StaggeredContainer>

        </div>
      </div>

      {/* Previous Responses */}
      <StaggeredContainer delay={450} animationType="fadeInUp" duration={500}>
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 mt-6">
          <div className="flex items-center gap-2 mb-5">
            <div className="p-2 bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-lg shadow-sm">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-gray-900">Riwayat Balasan</h3>
            {report.responses && report.responses.length > 0 && (
              <span className="ml-auto text-xs font-medium text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                {report.responses.length} balasan
              </span>
            )}
          </div>
          
          {mappedResponses.length > 0 ? (
            <MessageResponseTimeline
              responses={mappedResponses}
              status={report.status}
              statusResolver={resolveReportStatusStyle}
              heading={null}
              accentColorClass="from-cyan-500 to-cyan-600"
              onPreviewAsset={(asset) => {
                const mediaUrl = getMediaUrl(asset.file_path);
                const type = asset.file_type === 'video' ? 'video' : 'image';
                openLightbox(mediaUrl, type as 'image' | 'video');
              }}
            />
          ) : (
            <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl p-10 text-center border-2 border-dashed border-gray-300">
              <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-4 shadow-inner">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
              </div>
              <p className="text-base font-semibold text-gray-600 mb-1">
                Belum Ada Balasan
              </p>
              <p className="text-sm text-gray-500">
                Kirim balasan pertama untuk keluhan ini
              </p>
            </div>
          )}
        </div>
      </StaggeredContainer>

      {/* Lightbox */}
      <MediaLightbox
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        src={lightboxSrc}
        type={lightboxType}
        alt="Full size preview"
      />
    </AdminLayout>
  );
};

export default ReportShow;

