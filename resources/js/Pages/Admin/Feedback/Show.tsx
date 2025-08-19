import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';

interface FeedbackAsset {
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

interface FeedbackResponseAsset {
  id: number;
  file_path: string;
  file_type: string;
  mime_type?: string;
}

interface FeedbackResponse {
  id: number;
  feedback_id: number;
  user_id: number;
  message: string;
  created_at: string;
  user?: User;
  assets?: FeedbackResponseAsset[];
}

interface Feedback {
  id: number;
  tower_id: number | null;
  user_id: number;
  sender_phone: string;
  category: string;
  message: string;
  status: string;
  created_at: string;
  updated_at: string;
  user?: User;
  tower?: Tower;
  assets?: FeedbackAsset[];
  responses?: FeedbackResponse[];
}

interface Props {
  feedback: Feedback;
}

const FeedbackShow: React.FC<Props> = ({ feedback }) => {
  // Fungsi untuk mengekstrak nama pengirim dari kategori
  const extractSenderName = (category: string): { name: string; category: string } => {
    const match = category.match(/\[Dari:\s(.+?)\]$/);
    if (match && match[1]) {
      return {
        name: match[1],
        category: category.replace(/\s*\[Dari:\s(.+?)\]$/, '')
      };
    }
    return { name: '', category };
  };

  const [replyMessage, setReplyMessage] = useState('');
  const [replyStatus, setReplyStatus] = useState(feedback.status);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxSrc, setLightboxSrc] = useState('');
  const [lightboxType, setLightboxType] = useState<'image' | 'video'>('image');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFileSelection = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      // Filter valid files (images, videos, max 5 files)
      const validFiles = files.filter(file => {
        const isImage = file.type.startsWith('image/');
        const isVideo = file.type.startsWith('video/');
        const validSize = isImage ? file.size <= 5 * 1024 * 1024 : file.size <= 50 * 1024 * 1024;
        return (isImage || isVideo) && validSize;
      }).slice(0, 5);
      
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
    
    router.post(route('admin.feedbacks.respond', feedback.id), formData, {
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
    
    // If only updating status without reply
    if (!replyMessage.trim() && newStatus !== feedback.status) {
      if (window.confirm('Apakah Anda ingin mengubah status masukan tanpa menambahkan balasan?')) {
        router.put(route('admin.feedbacks.updateStatus', feedback.id), {
          status_id: newStatus
        });
      }
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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

  const getMediaUrl = (path: string) => {
    if (path.startsWith('http')) return path;
    return `/storage/${path}`;
  };

  const isImage = (path: string, type?: string) => {
    if (type) return type === 'image' || type.startsWith('image/');
    return /\.(jpg|jpeg|png|gif|webp)$/i.test(path);
  };

  const isVideo = (path: string, type?: string) => {
    if (type) return type === 'video' || type.startsWith('video/');
    return /\.(mp4|mov|avi|webm)$/i.test(path);
  };

  return (
    <AdminLayout title="Detail Masukan">
      <Head title="Detail Masukan" />
      
      {/* Back button */}
      <div className="mb-6">
        <a
          href={route('admin.feedbacks.index')}
          className="inline-flex items-center text-red-600 hover:text-red-800"
        >
          <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 17l-5-5m0 0l5-5m-5 5h12" />
          </svg>
          <span>Kembali ke daftar masukan</span>
        </a>
      </div>

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Detail Masukan #{feedback.id}</h1>
        <div className="flex items-center gap-3">
          <p className="text-gray-600">Status: {getStatusBadge(feedback.status)}</p>
          <p className="text-gray-600">Dikirim: {formatDate(feedback.created_at)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column - Feedback details */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="h-12 w-12 rounded-full bg-red-500 flex items-center justify-center">
                    <span className="text-white font-semibold text-lg">
                      {extractSenderName(feedback.category).name.charAt(0).toUpperCase() || '?'}
                    </span>
                  </div>
                  <div className="ml-4">
                    <h2 className="text-lg font-medium text-gray-800">
                      {extractSenderName(feedback.category).name || feedback.user?.name || 'Pengguna'}
                    </h2>
                    <p className="text-sm text-gray-600">
                      {feedback.sender_phone || feedback.user?.email || '-'}
                    </p>
                  </div>
                </div>
                <div>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {extractSenderName(feedback.category).category}
                  </span>
                </div>
              </div>
            </div>

            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-800 mb-4">Pesan</h3>
              <div className="text-gray-700 whitespace-pre-wrap bg-gray-50 p-4 rounded-lg border border-gray-200">
                {feedback.message}
              </div>

              {/* Tower Information */}
              {feedback.tower && (
                <div className="mt-6">
                  <h3 className="text-lg font-medium text-gray-800 mb-4">Informasi Tower</h3>
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <p className="text-gray-700">
                      <span className="font-medium">Nama Site:</span> {feedback.tower.site_name}
                    </p>
                    {feedback.tower.alamat_menara && (
                      <p className="text-gray-700 mt-2">
                        <span className="font-medium">Alamat:</span> {feedback.tower.alamat_menara}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Attached Media */}
              {feedback.assets && feedback.assets.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-lg font-medium text-gray-800 mb-4">Media Lampiran</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {feedback.assets.map((asset, index) => {
                      const mediaUrl = getMediaUrl(asset.file_path);
                      const isImg = isImage(asset.file_path, asset.file_type);
                      const isVid = isVideo(asset.file_path, asset.file_type);

                      return (
                        <div key={asset.id} className="relative group overflow-hidden rounded-lg border border-gray-200">
                          {isImg ? (
                            <img
                              src={mediaUrl}
                              alt={`Lampiran ${index + 1}`}
                              className="w-full h-32 object-cover cursor-pointer"
                              onClick={() => openLightbox(mediaUrl, 'image')}
                            />
                          ) : isVid ? (
                            <div
                              className="w-full h-32 bg-gray-100 flex items-center justify-center cursor-pointer"
                              onClick={() => openLightbox(mediaUrl, 'video')}
                            >
                              <div className="text-center">
                                <svg className="w-10 h-10 text-blue-500 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                                </svg>
                                <span className="text-xs text-gray-600">Play Video</span>
                              </div>
                            </div>
                          ) : (
                            <div className="w-full h-32 bg-gray-100 flex items-center justify-center">
                              <div className="text-center">
                                <svg className="w-10 h-10 text-gray-400 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                                </svg>
                                <span className="text-xs text-gray-600">File</span>
                              </div>
                            </div>
                          )}
                          
                          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                            <button
                              onClick={() => openLightbox(mediaUrl, isImg ? 'image' : 'video')}
                              className="p-1 bg-white rounded-full"
                            >
                              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
              )}
            </div>
          </div>
        </div>

        {/* Right column - Reply form and previous responses */}
        <div className="lg:col-span-1">
          {/* Reply Form */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h3 className="text-lg font-medium text-gray-800 mb-4">Balas Masukan</h3>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  id="status"
                  value={replyStatus}
                  onChange={handleStatusChange}
                  className="w-full border-gray-300 rounded-md shadow-sm focus:ring focus:ring-red-200 focus:border-red-400"
                  required
                >
                  <option value="pending">BARU</option>
                  <option value="in_progress">PROGRESS</option>
                  <option value="closed">SELESAI</option>
                </select>
              </div>

              <div className="mb-4">
                <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
                  Pesan Balasan
                </label>
                <textarea
                  id="message"
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  rows={5}
                  className="w-full border-gray-300 rounded-md shadow-sm focus:ring focus:ring-blue-200 focus:border-blue-400"
                  placeholder="Tulis balasan untuk masukan ini..."
                  required
                ></textarea>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Lampirkan Media (Opsional)
                </label>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                  <div className="space-y-1 text-center">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <div className="flex text-sm text-gray-600">
                      <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500">
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
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    {selectedFiles.map((file, index) => (
                      <div key={index} className="relative border rounded-md p-2">
                        <div className="flex items-center">
                          <svg className="h-6 w-6 text-gray-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            {file.type.startsWith('image/') ? (
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            ) : (
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                            )}
                          </svg>
                          <span className="text-sm truncate">{file.name}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeFile(index)}
                          className="absolute top-1 right-1 text-red-500 hover:text-red-700"
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

              <div>
                <button
                  type="submit"
                  disabled={isSubmitting || !replyMessage.trim()}
                  className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Mengirim...
                    </>
                  ) : (
                    'Kirim Balasan'
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Previous Responses */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-medium text-gray-800 mb-4">Riwayat Balasan</h3>
            
            {feedback.responses && feedback.responses.length > 0 ? (
              <div className="space-y-6 max-h-[600px] overflow-y-auto">
                {feedback.responses.map((response) => (
                  <div key={response.id} className="border rounded-lg p-4 bg-gray-50">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center">
                        <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center">
                          <span className="text-white font-semibold text-sm">
                            {response.user?.name.charAt(0).toUpperCase() || 'A'}
                          </span>
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-gray-800">
                            {response.user?.name || 'Admin'}
                          </p>
                          <p className="text-xs text-gray-500">
                            {formatDate(response.created_at)}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-sm text-gray-700 whitespace-pre-wrap mb-4">
                      {response.message}
                    </div>
                    
                    {/* Response attachments */}
                    {response.assets && response.assets.length > 0 && (
                      <div className="mt-3 grid grid-cols-3 gap-2">
                        {response.assets.map((asset, index) => {
                          const mediaUrl = getMediaUrl(asset.file_path);
                          const isImg = isImage(asset.file_path, asset.file_type);
                          const isVid = isVideo(asset.file_path, asset.file_type);

                          return (
                            <div key={asset.id} className="relative rounded overflow-hidden border border-gray-200">
                              {isImg ? (
                                <img
                                  src={mediaUrl}
                                  alt={`Response media ${index + 1}`}
                                  className="w-full h-20 object-cover cursor-pointer"
                                  onClick={() => openLightbox(mediaUrl, 'image')}
                                />
                              ) : isVid ? (
                                <div 
                                  className="w-full h-20 bg-gray-100 flex items-center justify-center cursor-pointer"
                                  onClick={() => openLightbox(mediaUrl, 'video')}
                                >
                                  <svg className="w-8 h-8 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                                  </svg>
                                </div>
                              ) : (
                                <div className="w-full h-20 bg-gray-100 flex items-center justify-center">
                                  <svg className="w-8 h-8 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                                  </svg>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <svg className="mx-auto h-12 w-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
                <p className="mt-2 text-sm text-gray-500">
                  Belum ada balasan untuk masukan ini
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Lightbox */}
      {lightboxOpen && (
        <div
          className="fixed inset-0 z-50 bg-black bg-opacity-90 flex items-center justify-center p-4"
          onClick={() => setLightboxOpen(false)}
        >
          <div className="relative max-w-4xl max-h-[90vh]">
            {lightboxType === 'image' ? (
              <img
                src={lightboxSrc}
                alt="Full size preview"
                className="max-w-full max-h-full object-contain"
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <video
                src={lightboxSrc}
                className="max-w-full max-h-full"
                controls
                autoPlay
                onClick={(e) => e.stopPropagation()}
              />
            )}
            <button
              className="absolute top-2 right-2 bg-black bg-opacity-50 text-white rounded-full p-2"
              onClick={() => setLightboxOpen(false)}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default FeedbackShow;