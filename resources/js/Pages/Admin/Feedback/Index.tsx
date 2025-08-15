import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';

interface Feedback {
  id: number;
  tower: {
    id: number;
    site_name: string;
  };
  user: {
    id: number;
    name: string;
    email: string;
  };
  category: string;
  message: string;
  status: 'pending' | 'in_progress' | 'responded' | 'resolved' | 'closed';
  created_at: string;
  assets: Array<{
    id: number;
    file_type: string;
  }>;
}

interface AdminFeedbackIndexProps {
  feedbacks: {
    data: Feedback[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
  filters: {
    search: string;
    status: string;
  };
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
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
      <span className="mr-1">{config.icon}</span>
      {config.label}
    </span>
  );
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('id-ID', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export default function AdminFeedbackIndex({ feedbacks, filters }: AdminFeedbackIndexProps) {
  const [searchQuery, setSearchQuery] = useState(filters.search || '');
  const [statusFilter, setStatusFilter] = useState(filters.status || 'all');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    router.get('/admin/feedbacks', {
      search: searchQuery,
      status: statusFilter,
    }, {
      preserveState: true,
      replace: true,
    });
  };

  const handleStatusChange = (newStatus: string) => {
    setStatusFilter(newStatus);
    router.get('/admin/feedbacks', {
      search: searchQuery,
      status: newStatus,
    }, {
      preserveState: true,
      replace: true,
    });
  };

  const handleQuickStatusUpdate = (feedbackId: number, newStatus: string) => {
    router.put(`/admin/feedbacks/${feedbackId}/status`, {
      status: newStatus,
    }, {
      preserveState: true,
    });
  };

  return (
    <AdminLayout>
      <Head title="Kelola Masukan" />
      
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Kelola Masukan</h1>
              <p className="text-gray-600 mt-1">
                Kelola dan tanggapi masukan dari pengguna
              </p>
            </div>
            <div className="text-sm text-gray-500">
              Total: {feedbacks.total} masukan
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <form onSubmit={handleSearch} className="flex gap-4 items-end">
            <div className="flex-1">
              <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
                Cari Masukan
              </label>
              <input
                type="text"
                id="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari berdasarkan pesan, kategori, nama tower, atau pengirim..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                id="status"
                value={statusFilter}
                onChange={(e) => handleStatusChange(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">Semua Status</option>
                <option value="pending">Menunggu</option>
                <option value="in_progress">Diproses</option>
                <option value="responded">Dibalas</option>
                <option value="resolved">Selesai</option>
                <option value="closed">Ditutup</option>
              </select>
            </div>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Cari
            </button>
          </form>
        </div>

        {/* Feedback List */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          {feedbacks.data.length === 0 ? (
            <div className="p-12 text-center">
              <svg className="mx-auto h-16 w-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-3.582 8-8 8a8.95 8.95 0 01-2.4-.322l-3.6 1.8A1 1 0 016 20.5V17a8 8 0 110-10z" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Tidak ada masukan</h3>
              <p className="text-gray-500">Tidak ada masukan yang sesuai dengan kriteria pencarian.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Masukan
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Pengirim
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
                  {feedbacks.data.map((feedback) => (
                    <tr key={feedback.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="max-w-xs">
                          <div className="flex items-center mb-1">
                            <span className="text-sm font-medium text-gray-900 mr-2">
                              #{feedback.id}
                            </span>
                            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                              {feedback.category}
                            </span>
                          </div>
                          <p className="text-sm text-gray-700 line-clamp-2">
                            {feedback.message}
                          </p>
                          {feedback.assets.length > 0 && (
                            <div className="flex items-center mt-2">
                              <svg className="w-4 h-4 text-gray-400 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                              </svg>
                              <span className="text-xs text-gray-500">
                                {feedback.assets.length} lampiran
                              </span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {feedback.user.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {feedback.user.email}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 max-w-xs truncate">
                          {feedback.tower.site_name}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          {getStatusBadge(feedback.status)}
                          <div className="relative">
                            <select
                              value={feedback.status}
                              onChange={(e) => handleQuickStatusUpdate(feedback.id, e.target.value)}
                              className="text-xs border border-gray-300 rounded px-2 py-1 bg-white focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                            >
                              <option value="pending">Menunggu</option>
                              <option value="in_progress">Diproses</option>
                              <option value="responded">Dibalas</option>
                              <option value="resolved">Selesai</option>
                              <option value="closed">Ditutup</option>
                            </select>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {formatDate(feedback.created_at)}
                      </td>
                      <td className="px-6 py-4">
                        <Link
                          href={`/admin/feedbacks/${feedback.id}`}
                          className="inline-flex items-center px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded hover:bg-blue-700 transition-colors duration-200"
                        >
                          <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                            <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                          </svg>
                          Detail
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination */}
        {feedbacks.last_page > 1 && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Menampilkan {((feedbacks.current_page - 1) * feedbacks.per_page) + 1} - {Math.min(feedbacks.current_page * feedbacks.per_page, feedbacks.total)} dari {feedbacks.total} masukan
              </div>
              <div className="flex space-x-2">
                {feedbacks.current_page > 1 && (
                  <Link
                    href={`/admin/feedbacks?page=${feedbacks.current_page - 1}&search=${searchQuery}&status=${statusFilter}`}
                    className="px-3 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors duration-200"
                  >
                    Sebelumnya
                  </Link>
                )}
                {feedbacks.current_page < feedbacks.last_page && (
                  <Link
                    href={`/admin/feedbacks?page=${feedbacks.current_page + 1}&search=${searchQuery}&status=${statusFilter}`}
                    className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
                  >
                    Selanjutnya
                  </Link>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
