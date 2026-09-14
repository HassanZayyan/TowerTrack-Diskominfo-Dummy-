import React, { useState, useEffect } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import VideoThumbnail from '@/Components/VideoThumbnail';
import StaggeredContainer from '@/Components/StaggeredContainer';
import MessageResponseTimeline, { MessageResponseItem } from '@/Components/MyMessages/MessageResponseTimeline';
import LocationCard from '@/Components/MyMessages/LocationCard';
import MediaLightbox from '@/Components/MediaLightbox';
import { Button } from '@/Components/ui/button';
import { Badge } from '@/Components/ui/badge';
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
  reportable_type?: string | null;
  reportable_id?: number | null;
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
  reportable?: Tower | { id: number; name?: string; site_name?: string; alamat_menara?: string; description?: string; area?: string };
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


      <StaggeredContainer delay={100} animationType="fadeInUp" duration={500}>
        <div className="relative rounded-lg mb-5 px-4 sm:px-6 lg:px-8 py-4 sm:py-6 overflow-hidden bg-card border border-border shadow-xs">
          <div className="relative z-10">
            <div className="mb-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.visit(route('admin.messages.index', { tab: 'complaints' }))}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <span>Kembali ke Daftar Keluhan</span>
              </Button>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
              <div className="flex items-center gap-4 flex-1 min-w-0">
                <div className="p-3 bg-primary text-primary-foreground rounded-lg flex-shrink-0">
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <h1 className="text-xl font-semibold tracking-tight tracking-tight text-foreground break-words">
                    Detail Keluhan #{report.id}
                  </h1>
                  <p className="text-sm font-medium text-muted-foreground mt-1 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                    Dikirim: {formatDateWithTime(report.created_at)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0 bg-muted px-4 py-2 rounded-md border border-border">
                <span className="text-sm text-muted-foreground font-semibold hidden sm:inline">Status:</span>
                {renderMessageStatusBadge(report.status)}
              </div>
            </div>
          </div>
        </div>
      </StaggeredContainer>

      {/* Unified Main Card */}
      <StaggeredContainer delay={200} animationType="fadeInUp" duration={500}>
        <div className="bg-card rounded-lg shadow-xs border border-border overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x divide-border">

            {/* Left Column: Message, Timeline */}
            <div className="lg:col-span-2 p-5 space-y-5">

              {/* Message Content */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="p-2 bg-primary text-primary-foreground rounded-md">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-foreground">Isi Pesan</h3>
                </div>
                <div className="text-foreground whitespace-pre-wrap leading-relaxed">
                  <div className="p-5 bg-muted rounded-lg border border-border text-base">
                    {report.message}
                  </div>
                </div>

                {/* Attached Media */}
                {report.images && report.images.length > 0 && (
                  <div className="mt-6">
                    <h4 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-3">
                      <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      Lampiran ({report.images.length})
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                      {report.images.map((asset, index) => {
                        const mediaUrl = getMediaUrl(asset.file_path);
                        const isImg = isImage(asset.file_path, asset.file_type);
                        const isVid = isVideo(asset.file_path, asset.file_type);

                        return (
                          <div key={asset.id} className="relative group overflow-hidden rounded-lg border border-border hover:border-primary transition-colors duration-200">
                            {isImg ? (
                              <img
                                src={mediaUrl}
                                alt={`Lampiran ${index + 1}`}
                                className="w-full h-24 object-cover cursor-pointer bg-muted"
                                onClick={() => openLightbox(mediaUrl, 'image')}
                              />
                            ) : isVid ? (
                              <VideoThumbnail
                                src={mediaUrl}
                                fileType="video"
                                className="w-full h-24 rounded-lg object-cover"
                                onClick={() => openLightbox(mediaUrl, 'video')}
                                showPlayButton={true}
                                alt={`Video lampiran ${index + 1}`}
                                loading="lazy"
                              />
                            ) : (
                              <div className="w-full h-24 bg-muted flex items-center justify-center">
                                <span className="text-xs text-muted-foreground">File</span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              <hr className="border-border" />

              {/* Discussion History */}
              <div>
                <div className="flex items-center gap-2 mb-6">
                  <div className="p-2 bg-primary text-primary-foreground rounded-md">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-foreground">Riwayat Diskusi</h3>
                  {report.responses && report.responses.length > 0 && (
                    <Badge className="ml-auto">
                      {report.responses.length}
                    </Badge>
                  )}
                </div>

                {mappedResponses.length > 0 ? (
                  <MessageResponseTimeline
                    responses={mappedResponses}
                    status={report.status}
                    statusResolver={resolveReportStatusStyle}
                    heading={null}
                    onPreviewAsset={(asset) => {
                      const mediaUrl = getMediaUrl(asset.file_path);
                      const type = asset.file_type === 'video' ? 'video' : 'image';
                      openLightbox(mediaUrl, type as 'image' | 'video');
                    }}
                  />
                ) : (
                  <div className="bg-muted rounded-lg p-8 text-center border border-dashed border-border-strong">
                    <p className="text-sm font-medium text-muted-foreground">Kirim balasan pertama untuk keluhan ini</p>
                  </div>
                )}
              </div>

            </div>

            {/* Right Column: Sender Info, Location */}
            <div className="lg:col-span-1 bg-well p-5 space-y-5">

              {/* Sender Info */}
              <div>
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-border">
                  <div className="p-2 bg-primary-soft rounded-md flex-shrink-0 text-primary-strong">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <h3 className="text-base font-semibold text-foreground">Informasi Pelapor</h3>
                </div>

                <div className="space-y-6">
                  {/* Name & Category */}
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground mb-2 block">Nama Pelapor</label>
                    <div>
                      <div className="text-lg font-semibold text-foreground break-words leading-tight mb-2">
                        {report.reporter_name || report.user?.name || 'Anonim'}
                      </div>
                      <Badge variant="secondary">
                        {report.category}
                      </Badge>
                    </div>
                  </div>

                  {/* Contact Info */}
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground mb-3 block">Kontak</label>
                    <div className="space-y-3">
                      <div className="flex items-start gap-3 text-sm text-foreground">
                        <div className="w-8 h-8 rounded-full bg-card border border-border flex items-center justify-center flex-shrink-0 text-placeholder">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                          </svg>
                        </div>
                        <div className="pt-1.5 font-medium">{report.reporter_phone || '-'}</div>
                      </div>
                      {(report.user?.email || (report as any).email) && (
                        <div className="flex items-start gap-3 text-sm text-foreground">
                          <div className="w-8 h-8 rounded-full bg-card border border-border flex items-center justify-center flex-shrink-0 text-placeholder">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                          </div>
                          <div className="pt-1.5 font-medium break-all">{(report as any).email || report.user?.email}</div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <hr className="border-border" />

              {/* Location Info */}
              {(report.reportable || report.tower) && (
                <div>
                  <div className="flex items-center gap-3 mb-4 pb-3 border-b border-border">
                    <div className="p-2 bg-neutral-soft rounded-md flex-shrink-0 text-neutral-strong">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    </div>
                    <h3 className="text-base font-semibold text-foreground">Lokasi / Aset</h3>
                  </div>
                  <LocationCard
                    tower={report.tower}
                    reportable={report.reportable}
                    reportableType={report.reportable_type}
                  />
                </div>
              )}

            </div>

          </div>

          {/* Reply Form - Full Width Footer */}
          <div className="bg-card p-5 border-t border-border">
            <div className="flex items-center gap-2 mb-5">
              <div className="p-2 bg-primary text-primary-foreground rounded-md">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-foreground">Kirim Balasan</h3>
            </div>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="status" className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
                    Update Status
                  </label>
                  <div className="relative">
                    <select
                      id="status"
                      value={replyStatus}
                      onChange={handleStatusChange}
                      className="w-full appearance-none bg-background text-foreground border border-input rounded-md focus-visible:outline-none focus-visible:ring focus-visible:ring-offset-2 pr-10 py-2.5 px-4 cursor-pointer transition-colors duration-200 hover:border-border-strong text-sm font-medium"
                      required
                    >
                      <option value="pending">BARU</option>
                      <option value="in_progress">PROGRESS</option>
                      <option value="closed">SELESAI</option>
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <svg className="w-5 h-5 text-placeholder" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <textarea
                  id="message"
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  rows={4}
                  maxLength={1000}
                  className="w-full bg-background text-foreground border border-input rounded-md focus-visible:outline-none focus-visible:ring focus-visible:ring-offset-2 p-3 text-sm transition-colors duration-200 hover:border-border-strong placeholder:text-placeholder"
                  placeholder="Tulis pesan balasan..."
                ></textarea>
                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center">
                    <label htmlFor="file-upload" className="cursor-pointer flex items-center gap-2 text-sm text-primary font-medium p-2 hover:bg-accent hover:text-accent-foreground rounded-md transition-colors">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                      </svg>
                      Lampirkan File
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
                    {selectedFiles.length > 0 && <span className="text-xs text-muted-foreground ml-2">{selectedFiles.length} file dipilih</span>}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {1000 - replyMessage.length} surat tersisa
                  </div>
                </div>

                {/* Selected files preview compact */}
                {selectedFiles.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {selectedFiles.map((file, index) => (
                      <div key={index} className="flex items-center gap-2 bg-muted border border-border rounded-md px-3 py-1.5">
                        <span className="text-xs font-medium text-muted-foreground truncate max-w-[150px]">{file.name}</span>
                        <button
                          type="button"
                          onClick={() => removeFile(index)}
                          className="text-muted-foreground hover:text-destructive transition-colors"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  size="lg"
                  className="w-full"
                  disabled={isSubmitting || (!replyMessage.trim() && replyStatus === report.status)}
                  aria-busy={isSubmitting || undefined}
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                  {isSubmitting ? 'Memproses...' : (replyMessage.trim() ? 'Kirim Balasan' : 'Update Status')}
                </Button>
              </div>
            </form>
          </div>
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
