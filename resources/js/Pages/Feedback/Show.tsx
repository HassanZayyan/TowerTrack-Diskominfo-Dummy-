import React from 'react';
import { Head, Link } from '@inertiajs/react';
import MainLayout from '@/Layouts/MainLayout';
import Footer from '@/Components/Footer';

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

interface FeedbackShowProps {
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

export default function FeedbackShow({ feedback }: FeedbackShowProps) {
  return (
    <MainLayout>
      <Head title={`Detail Masukan #${feedback.id}`} />
      
      <div className="min-h-screen bg-gray-50">
        <div className="p-4 sm:p-6">
          {/* Welcome Bar */}
          <div className="px-4 sm:px-6 py-6 mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between rounded" style={{ backgroundColor: '#FFF8E1' }}>
            <div className="mb-3 sm:mb-0">
              <h1 className="text-xl sm:text-2xl font-bold leading-snug" style={{ color: '#212121' }}>
                <svg className="w-8 h-8 mr-3 inline-block" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                Detail Masukan #{feedback.id}
              </h1>
              <p className="mt-1 text-sm sm:text-base" style={{ color: '#212121', opacity: 0.8 }}>
                {feedback.tower.site_name}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right hidden sm:block">
                {getStatusBadge(feedback.status)}
                <p className="text-sm mt-2" style={{ color: '#212121', opacity: 0.7 }}>
                  {formatDate(feedback.created_at)}
                </p>
              </div>
              <img src="/images/dprd-logo.png" alt="DPRD Kabupaten Semarang" className="h-10 w-10 sm:h-12 sm:w-12 hidden sm:block" />
            </div>
          </div>

          <div className="max-w-4xl mx-auto">
            {/* Breadcrumb */}
            <nav className="mb-6">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Link href="/my-feedbacks" className="hover:opacity-75 transition-opacity duration-200" style={{ color: '#B71C1C' }}>
                  Masukan Saya
                </Link>
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
                <span className="text-gray-900">Detail Masukan</span>
              </div>
            </nav>

            {/* Main Content */}
            <div className="bg-white rounded-lg shadow overflow-hidden">

              <div className="p-6">
                {/* Status Badge - Mobile */}
                <div className="sm:hidden mb-6 text-center">
                  {getStatusBadge(feedback.status)}
                  <p className="text-sm text-gray-600 mt-2">
                    {formatDate(feedback.created_at)}
                  </p>
                </div>

                {/* Feedback Details */}
                <div className="grid md:grid-cols-2 gap-8 mb-8">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20" style={{ color: '#B71C1C' }}>
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                      Informasi Masukan
                    </h3>
                    <div className="space-y-3">
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
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20" style={{ color: '#B71C1C' }}>
                        <path fillRule="evenodd" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 111.414-1.414l4.243 4.242a.998.998 0 001.414 0l4.243-4.243a8 8 0 00-1.414-1.414z" clipRule="evenodd" />
                      </svg>
                      Lokasi Menara
                    </h3>
                    <div className="space-y-3">
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

                {/* Message */}
                <div className="mb-8">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20" style={{ color: '#B71C1C' }}>
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    Pesan Masukan
                  </h3>
                  <div className="bg-gray-50 rounded-lg p-6 border-l-4" style={{ borderLeftColor: '#B71C1C' }}>
                    <p className="text-gray-900 whitespace-pre-wrap leading-relaxed">
                      {feedback.message}
                    </p>
                  </div>
                </div>

                {/* Assets */}
                {feedback.assets.length > 0 && (
                  <div className="mb-8">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20" style={{ color: '#B71C1C' }}>
                        <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                      </svg>
                      Lampiran ({feedback.assets.length} file)
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {feedback.assets.map((asset) => (
                        <MediaPreview key={asset.id} asset={asset} />
                      ))}
                    </div>
                  </div>
                )}

                {/* Responses */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20" style={{ color: '#B71C1C' }}>
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    Balasan ({feedback.responses.length})
                  </h3>
                  
                  {feedback.responses.length === 0 ? (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
                      <svg className="mx-auto h-12 w-12 text-yellow-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <h4 className="text-lg font-medium text-yellow-800 mb-2">Menunggu Balasan</h4>
                      <p className="text-yellow-700">
                        Masukan Anda sedang ditinjau. Tim kami akan segera memberikan balasan.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {feedback.responses.map((response) => (
                        <div key={response.id} className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <h4 className="font-medium text-gray-900">{response.user.name}</h4>
                              <p className="text-sm text-gray-600">Tim Support</p>
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

              {/* Footer Actions */}
              <div className="bg-gray-50 px-6 py-4">
                <div className="flex justify-between items-center">
                  <Link
                    href="/my-feedbacks"
                    className="inline-flex items-center px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors duration-200"
                  >
                    <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                    </svg>
                    Kembali ke Daftar
                  </Link>
                  
                  <div className="text-sm text-gray-500">
                    ID Masukan: #{feedback.id}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <Footer />
    </MainLayout>
  );
}
