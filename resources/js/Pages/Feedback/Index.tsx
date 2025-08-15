import React from 'react';
import { Head, Link } from '@inertiajs/react';
import MainLayout from '@/Layouts/MainLayout';
import Footer from '@/Components/Footer';

interface Feedback {
  id: number;
  tower: {
    id: number;
    site_name: string;
  };
  category: string;
  message: string;
  status: 'pending' | 'in_progress' | 'responded' | 'resolved' | 'closed';
  created_at: string;
  assets: Array<{
    id: number;
    file_type: string;
    file_name: string;
  }>;
  responses: Array<{
    id: number;
    user: {
      id: number;
      name: string;
    };
  }>;
}

interface FeedbackIndexProps {
  feedbacks: {
    data: Feedback[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

const getStatusBadge = (status: string) => {
  const statusConfig = {
    pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Menunggu' },
    in_progress: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Diproses' },
    responded: { bg: 'bg-green-100', text: 'text-green-800', label: 'Dibalas' },
    resolved: { bg: 'bg-purple-100', text: 'text-purple-800', label: 'Selesai' },
    closed: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Ditutup' },
  };

  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
  
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
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

export default function FeedbackIndex({ feedbacks }: FeedbackIndexProps) {
  return (
    <MainLayout>
      <Head title="Masukan Saya" />
      
      <div className="min-h-screen bg-gray-50">
        <div className="p-4 sm:p-6">
          {/* Welcome Bar */}
          <div className="px-4 sm:px-6 py-6 mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between rounded" style={{ backgroundColor: '#FFF8E1' }}>
            <div className="mb-3 sm:mb-0">
              <h1 className="text-xl sm:text-2xl font-bold leading-snug" style={{ color: '#212121' }}>
                <svg className="w-8 h-8 mr-3 inline-block" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm0 4a1 1 0 011-1h12a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1V8zm2 2a1 1 0 000 2h8a1 1 0 100-2H5z" clipRule="evenodd" />
                </svg>
                Masukan Saya
              </h1>
              <p className="mt-1 text-sm sm:text-base" style={{ color: '#212121', opacity: 0.8 }}>
                Riwayat masukan yang telah Anda kirimkan
              </p>
            </div>
            <div className="flex items-center gap-4">
              <Link
                href="/feedback"
                className="px-4 py-2 rounded-lg font-medium text-white hover:opacity-90 transition-all duration-200"
                style={{ backgroundColor: '#B71C1C' }}
              >
                Kirim Masukan Baru
              </Link>
              <img src="/images/dprd-logo.png" alt="DPRD Kabupaten Semarang" className="h-10 w-10 sm:h-12 sm:w-12 hidden sm:block" />
            </div>
          </div>

          <div className="max-w-4xl mx-auto">

            {/* Feedback List */}
            {feedbacks.data.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-12 text-center">
                <svg className="mx-auto h-16 w-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-3.582 8-8 8a8.95 8.95 0 01-2.4-.322l-3.6 1.8A1 1 0 016 20.5V17a8 8 0 110-10z" />
                </svg>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Belum ada masukan</h3>
                <p className="text-gray-500 mb-6">Anda belum pernah mengirim masukan. Mulai kirim masukan pertama Anda!</p>
                <Link
                  href="/feedback"
                  className="inline-flex items-center px-6 py-3 text-white font-medium rounded-lg hover:opacity-90 transition-all duration-200"
                  style={{ backgroundColor: '#B71C1C' }}
                >
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                  </svg>
                  Kirim Masukan
                </Link>
              </div>
            ) : (
              <div className="space-y-6">
                {feedbacks.data.map((feedback) => (
                  <div key={feedback.id} className="bg-white rounded-lg shadow overflow-hidden hover:shadow-lg transition-shadow duration-300">
                    <div className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex-1">
                          <div className="flex items-center mb-2">
                            <h3 className="text-lg font-semibold text-gray-900 mr-3">
                              {feedback.tower.site_name}
                            </h3>
                            {getStatusBadge(feedback.status)}
                          </div>
                          <p className="text-sm text-gray-600 mb-2">
                            Kategori: <span className="font-medium">{feedback.category}</span>
                          </p>
                          <p className="text-sm text-gray-500">
                            {formatDate(feedback.created_at)}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2 ml-4">
                          {feedback.assets.length > 0 && (
                            <span className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                              {feedback.assets.length} file
                            </span>
                          )}
                          {feedback.responses.length > 0 && (
                            <span className="inline-flex items-center px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                              {feedback.responses.length} balasan
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="mb-4">
                        <p className="text-gray-700 line-clamp-3">
                          {feedback.message}
                        </p>
                      </div>

                      <div className="flex justify-between items-center">
                        <div className="text-sm text-gray-500">
                          ID: #{feedback.id}
                        </div>
                        <Link
                          href={`/feedback/${feedback.id}`}
                          className="inline-flex items-center px-4 py-2 text-white text-sm font-medium rounded-lg hover:opacity-90 transition-all duration-200"
                          style={{ backgroundColor: '#B71C1C' }}
                        >
                          Lihat Detail
                          <svg className="w-4 h-4 ml-2" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Pagination */}
                {feedbacks.last_page > 1 && (
                  <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-700">
                        Menampilkan {((feedbacks.current_page - 1) * feedbacks.per_page) + 1} - {Math.min(feedbacks.current_page * feedbacks.per_page, feedbacks.total)} dari {feedbacks.total} masukan
                      </div>
                      <div className="flex space-x-2">
                        {feedbacks.current_page > 1 && (
                          <Link
                            href={`/my-feedbacks?page=${feedbacks.current_page - 1}`}
                            className="px-3 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors duration-200"
                          >
                            Sebelumnya
                          </Link>
                        )}
                        {feedbacks.current_page < feedbacks.last_page && (
                          <Link
                            href={`/my-feedbacks?page=${feedbacks.current_page + 1}`}
                            className="px-3 py-2 text-white rounded-lg hover:opacity-90 transition-all duration-200"
                            style={{ backgroundColor: '#B71C1C' }}
                          >
                            Selanjutnya
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      
      <Footer />
    </MainLayout>
  );
}
