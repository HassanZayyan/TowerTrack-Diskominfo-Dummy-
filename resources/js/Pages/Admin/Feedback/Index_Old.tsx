import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Pagination } from '../../../Components/Pagination';

interface FeedbackAsset {
  id: number;
  file_path: string;
  file_type: string;
}

interface FeedbackResponse {
  id: number;
  message: string;
  created_at: string;
}

interface User {
  id: number;
  name: string;
  email: string;
}

interface Tower {
  id: number;
  site_name: string;
}

interface Feedback {
  id: number;
  user_id: number;
  tower_id: number | null;
  sender_phone: string;
  category: string;
  message: string;
  status: string;
  created_at: string;
  user?: User;
  tower?: Tower;
  assets?: FeedbackAsset[];
  responses?: FeedbackResponse[];
  responses_count?: number;
}

interface Status {
  id: number;
  name: string;
  slug: string;
  color: string;
  icon: string;
}

interface Props {
  feedbacks: Feedback[];
  statuses?: Status[];
}

const FeedbackIndex: React.FC<Props> = ({ feedbacks = [], statuses = [] }) => {
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

  // Default statuses if not provided by the backend
  const defaultStatuses = [
    { id: 1, name: 'Pending', slug: 'pending', color: 'red', icon: 'clock' },
    { id: 2, name: 'In Progress', slug: 'in_progress', color: 'orange', icon: 'refresh' },
    { id: 3, name: 'Closed', slug: 'closed', color: 'green', icon: 'check' }
  ];
  
  // Use provided statuses or fallback to default
  const availableStatuses = statuses.length > 0 ? statuses : defaultStatuses;
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSearching(true);
    
    router.get(route('admin.feedbacks.index'), {
      search: searchTerm,
      status: statusFilter
    }, {
      preserveState: true,
      onFinish: () => setIsSearching(false)
    });
  };
  
  const handleStatusChange = (feedbackId: number, newStatus: string) => {
    router.put(route('admin.feedbacks.updateStatus', { feedback: feedbackId }), { status_id: newStatus });
  };

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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setStatusFilter(e.target.value);
    router.get(route('admin.feedbacks.index'), {
      search: searchTerm,
      status: e.target.value
    }, {
      preserveState: true
    });
  };

  return (
    <AdminLayout title="Feedbacks">
      <Head title="Feedbacks" />
      
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Kelola Masukan</h1>
        <p className="text-gray-600">Pantau dan tanggapi masukan dari masyarakat terkait tower telekomunikasi</p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-lg p-6 shadow-lg border-l-4 border-red-500">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-800">Baru</h3>
              <p className="text-3xl font-bold text-red-600">
                {feedbacks.filter(f => f.status === 'pending').length}
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
                {feedbacks.filter(f => f.status === 'in_progress').length}
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
                {feedbacks.filter(f => f.status === 'closed').length}
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
              value={statusFilter}
              onChange={handleFilterChange}
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
        {feedbacks.length === 0 ? (
          <div className="p-8 sm:p-12 text-center">
            <svg className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm || statusFilter !== 'all' 
                ? 'Tidak ada masukan yang sesuai dengan filter'
                : 'Belum ada masukan yang masuk'}
            </h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || statusFilter !== 'all' 
                ? 'Coba ubah filter atau kata kunci pencarian'
                : 'Masukan dari masyarakat akan muncul di sini'}
            </p>
            {(searchTerm || statusFilter !== 'all') && (
              <button 
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('all');
                  router.get(route('admin.feedbacks.index'));
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
                      Pengirim
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tower
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Kategori
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
                  {feedbacks.map((feedback) => (
                    <tr key={feedback.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center">
                              <span className="text-white font-semibold">
                                {feedback.user?.name.charAt(0).toUpperCase() || '?'}
                              </span>
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {extractSenderName(feedback.category).name || feedback.user?.name || 'Unknown'}
                            </div>
                            <div className="text-sm text-gray-500">
                              {feedback.user?.email || feedback.sender_phone || '-'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {feedback.tower?.site_name || 'Tidak spesifik'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {extractSenderName(feedback.category).category}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <select
                          value={feedback.status}
                          onChange={(e) => handleStatusChange(feedback.id, e.target.value)}
                          className={`text-xs font-medium border rounded-full px-2 py-1 focus:outline-none focus:ring-2 focus:ring-offset-2 ${getStatusColor(feedback.status)}`}
                        >
                          <option value="pending">BARU</option>
                          <option value="in_progress">PROGRESS</option>
                          <option value="closed">SELESAI</option>
                        </select>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(feedback.created_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <Link
                          href={route('admin.feedbacks.show', feedback.id)}
                          className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
                        >
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          Detail
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Mobile Cards */}
            <div className="lg:hidden divide-y divide-gray-200">
              {feedbacks.map((feedback) => (
                <div key={feedback.id} className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-r from-red-500 to-red-600 flex items-center justify-center">
                          <span className="text-white font-semibold text-sm">
                            {(feedback.user?.name || '?').charAt(0).toUpperCase()}
                          </span>
                        </div>
                      </div>
                      <div className="ml-3">
                        <div className="text-sm font-medium text-gray-900">
                          {extractSenderName(feedback.category).name || feedback.user?.name || 'Unknown'}
                        </div>
                        <div className="text-xs text-gray-500">
                          {formatDate(feedback.created_at)}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <select
                        value={feedback.status}
                        onChange={(e) => handleStatusChange(feedback.id, e.target.value)}
                        className={`text-xs font-medium border rounded-full px-2 py-1 focus:outline-none focus:ring-2 focus:ring-offset-2 ${getStatusColor(feedback.status)}`}
                      >
                        <option value="pending">BARU</option>
                        <option value="in_progress">PROGRESS</option>
                        <option value="closed">SELESAI</option>
                      </select>
                      <Link
                        href={route('admin.feedbacks.show', feedback.id)}
                        className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
                      >
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        Detail
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
      
      {/* Summary */}
      <div className="mt-8 bg-white rounded-lg shadow-lg p-4 sm:p-6">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <span>
              Menampilkan <span className="font-semibold text-gray-800">{feedbacks.length}</span> masukan
              {(searchTerm || statusFilter !== 'all') && (
                <span className="text-gray-500"> (difilter)</span>
              )}
            </span>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default FeedbackIndex;