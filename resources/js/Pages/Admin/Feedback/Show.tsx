import React, { useState } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';

interface FeedbackAsset {
  id: number;
  file_path: string;
  file_name: string;
  file_type: 'image' | 'video';
  mime_type: string;
}

interface FeedbackResponse {
  id: number;
  message: string;
  created_at: string;
  user: {
    id: number;
    name: string;
  };
  assets: FeedbackAsset[];
}

interface Feedback {
  id: number;
  tower: {
    id: number;
    site_name: string;
    alamat_menara: string;
  };
  user: {
    id: number;
    name: string;
    email: string;
  };
  sender_phone: string;
  category: string;
  message: string;
  status: 'pending' | 'in_progress' | 'responded' | 'resolved' | 'closed';
  created_at: string;
  assets: FeedbackAsset[];
  responses: FeedbackResponse[];
}

interface AdminFeedbackShowProps {
  feedback: Feedback;
}

const getStatusBadge = (status: string) => {
  const statusConfig = {
    pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Menunggu', icon: '⏳' },
    in_progress: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Diproses', icon: '⚙️' },
    responded: { bg: 'bg-green-100', text: 'text-green-800', label: 'Dibalas', icon: '💬' },
    resolved: { bg: 'bg-purple-100', text: 'text-purple-800', label: 'Selesai', icon: '✅' },
    closed: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Ditutup', icon: '🔒' },
  };

  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
  
  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${config.bg} ${config.text}`}>
      <span className="mr-1">{config.icon}</span>
      {config.label}
    </span>
  );
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('id-ID', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const MediaPreview = ({ asset }: { asset: FeedbackAsset }) => {
  const fileUrl = `/storage/${asset.file_path}`;
  
  if (asset.file_type === 'image') {
    return (
      <div className="relative group">
        <img 
          src={fileUrl} 
          alt={asset.file_name}
          className="w-full h-32 object-cover rounded-lg shadow-md group-hover:shadow-lg transition-shadow duration-200"
        />
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-200 rounded-lg"></div>
      </div>
    );
  } else if (asset.file_type === 'video') {
    return (
      <div className="relative">
        <video 
          src={fileUrl}
          controls
          className="w-full h-32 object-cover rounded-lg shadow-md"
        />
      </div>
    );
  }
  
  return (
    <div className="flex items-center p-3 bg-gray-50 rounded-lg">
      <svg className="w-8 h-8 text-gray-400 mr-3" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 0v12h8V4H6z" clipRule="evenodd" />
      </svg>
      <div>
        <p className="text-sm font-medium text-gray-900">{asset.file_name}</p>
        <p className="text-xs text-gray-500">{asset.mime_type}</p>
      </div>
    </div>
  );
};

export default function AdminFeedbackShow({ feedback }: AdminFeedbackShowProps) {
  const { errors, flash } = usePage().props as any;
  const [isResponseFormOpen, setIsResponseFormOpen] = useState(false);
  const [responseData, setResponseData] = useState({
    message: '',
    status: feedback.status,
    assets: [] as File[]
  });
  const [previewImages, setPreviewImages] = useState<string[]>([]);
  const [previewVideos, setPreviewVideos] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter(file => {
      const isImage = file.type.startsWith('image/');
      const isVideo = file.type.startsWith('video/');
      const isValidSize = file.size <= 20 * 1024 * 1024; // 20MB
      return (isImage || isVideo) && isValidSize;
    });

    setResponseData(prev => ({ ...prev, assets: [...prev.assets, ...validFiles] }));

    // Create previews
    validFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        if (file.type.startsWith('image/')) {
          setPreviewImages(prev => [...prev, result]);
        } else if (file.type.startsWith('video/')) {
          setPreviewVideos(prev => [...prev, result]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const removeFile = (index: number) => {
    const removedFile = responseData.assets[index];
    const newAssets = responseData.assets.filter((_, i) => i !== index);
    setResponseData(prev => ({ ...prev, assets: newAssets }));

    // Remove preview
    if (removedFile.type.startsWith('image/')) {
      setPreviewImages(prev => prev.filter((_, i) => i !== index));
    } else if (removedFile.type.startsWith('video/')) {
      setPreviewVideos(prev => prev.filter((_, i) => i !== index));
    }
  };

  const handleSubmitResponse = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData();
    formData.append('message', responseData.message);
    formData.append('status', responseData.status);
    
    responseData.assets.forEach((file, index) => {
      formData.append(`assets[${index}]`, file);
    });

    router.post(`/admin/feedbacks/${feedback.id}/respond`, formData, {
      onFinish: () => setIsSubmitting(false),
      onSuccess: () => {
        setIsResponseFormOpen(false);
        setResponseData({
          message: '',
          status: feedback.status,
          assets: []
        });
        setPreviewImages([]);
        setPreviewVideos([]);
      }
    });
  };

  const handleQuickStatusUpdate = (newStatus: string) => {
    router.put(`/admin/feedbacks/${feedback.id}/status`, {
      status: newStatus,
    });
  };

  return (
    <AdminLayout>
      <Head title={`Detail Masukan #${feedback.id}`} />
      
      <div className="space-y-6">
        {/* Breadcrumb */}
        <nav>
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Link href="/admin/feedbacks" className="hover:text-blue-600 transition-colors duration-200">
              Kelola Masukan
            </Link>
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
            <span className="text-gray-900">Detail Masukan</span>
          </div>
        </nav>

        {/* Success Flash Message */}
        {flash?.success && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-green-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <p className="text-green-800">{flash.success}</p>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                <svg className="w-8 h-8 mr-3 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                Detail Masukan #{feedback.id}
              </h1>
              <p className="text-gray-600 mt-1">
                {feedback.tower.site_name} • {formatDate(feedback.created_at)}
              </p>
            </div>
            <div className="flex items-center space-x-3">
              {getStatusBadge(feedback.status)}
              <select
                value={feedback.status}
                onChange={(e) => handleQuickStatusUpdate(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="pending">Menunggu</option>
                <option value="in_progress">Diproses</option>
                <option value="responded">Dibalas</option>
                <option value="resolved">Selesai</option>
                <option value="closed">Ditutup</option>
              </select>
            </div>
          </div>
        </div>

        {/* Feedback Details */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="grid lg:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Informasi Masukan</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600">Kategori</label>
                  <p className="text-gray-900">{feedback.category}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600">Nomor Telepon</label>
                  <p className="text-gray-900">{feedback.sender_phone}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600">Pengirim</label>
                  <p className="text-gray-900">{feedback.user.name}</p>
                  <p className="text-sm text-gray-600">{feedback.user.email}</p>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Lokasi Menara</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600">Nama Site</label>
                  <p className="text-gray-900">{feedback.tower.site_name}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600">Alamat</label>
                  <p className="text-gray-900">{feedback.tower.alamat_menara}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Pesan Masukan</h3>
            <div className="bg-gray-50 rounded-lg p-6">
              <p className="text-gray-900 whitespace-pre-wrap leading-relaxed">
                {feedback.message}
              </p>
            </div>
          </div>

          {feedback.assets.length > 0 && (
            <div className="mt-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Lampiran ({feedback.assets.length} file)
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {feedback.assets.map((asset) => (
                  <MediaPreview key={asset.id} asset={asset} />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Responses */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-gray-900">
              Balasan ({feedback.responses.length})
            </h3>
            <button
              onClick={() => setIsResponseFormOpen(!isResponseFormOpen)}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
            >
              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              {isResponseFormOpen ? 'Batal' : 'Balas Masukan'}
            </button>
          </div>

          {/* Response Form */}
          {isResponseFormOpen && (
            <form onSubmit={handleSubmitResponse} className="mb-8 p-6 bg-blue-50 rounded-lg border border-blue-200">
              <h4 className="text-lg font-medium text-gray-900 mb-4">Kirim Balasan</h4>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Pesan Balasan *
                  </label>
                  <textarea
                    value={responseData.message}
                    onChange={(e) => setResponseData(prev => ({ ...prev, message: e.target.value }))}
                    rows={6}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 resize-none"
                    placeholder="Tuliskan balasan Anda..."
                    required
                  />
                  {errors.message && (
                    <p className="text-red-600 text-sm mt-1">{errors.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Update Status
                  </label>
                  <select
                    value={responseData.status}
                    onChange={(e) => setResponseData(prev => ({ ...prev, status: e.target.value as typeof prev.status }))}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="pending">Menunggu</option>
                    <option value="in_progress">Diproses</option>
                    <option value="responded">Dibalas</option>
                    <option value="resolved">Selesai</option>
                    <option value="closed">Ditutup</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Lampiran (Opsional)
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                    <input
                      type="file"
                      multiple
                      accept="image/*,video/*"
                      onChange={handleFileChange}
                      className="hidden"
                      id="response-files"
                    />
                    <label htmlFor="response-files" className="cursor-pointer">
                      <svg className="mx-auto h-8 w-8 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                        <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      <div className="mt-2">
                        <span className="text-blue-600 hover:text-blue-700 font-medium">
                          Klik untuk upload
                        </span>
                        <p className="text-gray-500 text-sm mt-1">
                          Foto atau video, maksimal 20MB per file
                        </p>
                      </div>
                    </label>
                  </div>

                  {/* File Previews */}
                  {(previewImages.length > 0 || previewVideos.length > 0) && (
                    <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-4">
                      {previewImages.map((preview, index) => (
                        <div key={`img-${index}`} className="relative">
                          <img src={preview} alt={`Preview ${index + 1}`} className="w-full h-20 object-cover rounded-lg" />
                          <button
                            type="button"
                            onClick={() => removeFile(index)}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                      {previewVideos.map((preview, index) => (
                        <div key={`vid-${index}`} className="relative">
                          <video src={preview} className="w-full h-20 object-cover rounded-lg" />
                          <button
                            type="button"
                            onClick={() => removeFile(previewImages.length + index)}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setIsResponseFormOpen(false)}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors duration-200"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                  >
                    {isSubmitting ? 'Mengirim...' : 'Kirim Balasan'}
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* Existing Responses */}
          {feedback.responses.length === 0 ? (
            <div className="text-center py-8">
              <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-3.582 8-8 8a8.95 8.95 0 01-2.4-.322l-3.6 1.8A1 1 0 016 20.5V17a8 8 0 110-10z" />
              </svg>
              <h4 className="text-lg font-medium text-gray-900 mb-2">Belum ada balasan</h4>
              <p className="text-gray-500">Masukan ini belum mendapat balasan. Klik tombol "Balas Masukan" untuk memberikan tanggapan.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {feedback.responses.map((response) => (
                <div key={response.id} className="bg-green-50 border border-green-200 rounded-lg p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h4 className="font-medium text-gray-900">{response.user.name}</h4>
                      <p className="text-sm text-gray-600">Admin</p>
                    </div>
                    <time className="text-sm text-gray-500">
                      {formatDate(response.created_at)}
                    </time>
                  </div>
                  
                  <div className="mb-4">
                    <p className="text-gray-900 whitespace-pre-wrap leading-relaxed">
                      {response.message}
                    </p>
                  </div>

                  {response.assets.length > 0 && (
                    <div>
                      <h5 className="text-sm font-medium text-gray-700 mb-3">
                        Lampiran Balasan ({response.assets.length} file)
                      </h5>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {response.assets.map((asset) => (
                          <MediaPreview key={asset.id} asset={asset} />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
