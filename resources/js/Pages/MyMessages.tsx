import React from 'react';
import { Head, usePage, router } from '@inertiajs/react';
import MainLayout from '@/Layouts/MainLayout';

type ReportItem = {
  id: number;
  tower_id: number;
  category: string;
  message: string;
  status: string;
  created_at: string;
  tower?: { id: number; site_name: string };
  responses?: Array<{ id: number; report_id: number; created_at: string }>;
};

type FeedbackItem = {
  id: number;
  tower_id: number;
  category: string;
  message: string;
  status: string;
  created_at: string;
  tower?: { id: number; site_name: string };
  responses?: Array<{ id: number; feedback_id: number; created_at: string }>;
};

type MyMessagesProps = {
  reports?: ReportItem[];
  feedbacks?: FeedbackItem[];
};

export default function MyMessages({ reports = [] as ReportItem[], feedbacks = [] as FeedbackItem[] }: MyMessagesProps) {
  const { auth } = usePage().props as any;
  const isStaff = !!(auth?.user && ['admin','operator'].includes(auth.user.role));

  React.useEffect(() => {
    if (isStaff) {
      router.visit('/admin');
    }
  }, [isStaff]);

  if (isStaff) return null;

  const getStatusColor = (status: string) => {
    const statusConfig = {
      pending: { bg: '#FEF3C7', text: '#92400E', label: 'Menunggu' },
      in_progress: { bg: '#DBEAFE', text: '#1E40AF', label: 'Sedang Diproses' },
      responded: { bg: '#E0E7FF', text: '#3730A3', label: 'Sudah Dibalas' },
      resolved: { bg: '#D1FAE5', text: '#065F46', label: 'Selesai' },
    };
    return statusConfig[status as keyof typeof statusConfig] || { bg: '#F3F4F6', text: '#374151', label: status.replace('_', ' ') };
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Hari ini';
    if (diffDays === 2) return 'Kemarin';
    if (diffDays <= 7) return `${diffDays - 1} hari yang lalu`;
    
    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  // Merge complaints and feedbacks into a single unified list
  const items = React.useMemo(() => {
    const complaintItems = (reports || []).map((r) => ({
      id: `report-${r.id}`,
      type: 'Keluhan' as const,
      created_at: r.created_at,
      towerName: r.tower?.site_name ?? '-',
      category: r.category,
      status: r.status,
      responsesCount: r.responses?.length ?? 0,
    }));

    const feedbackItems = (feedbacks || []).map((f) => ({
      id: `feedback-${f.id}`,
      type: 'Masukan' as const,
      created_at: f.created_at,
      towerName: f.tower?.site_name ?? '-',
      category: f.category,
      status: f.status,
      responsesCount: f.responses?.length ?? 0,
    }));

    return [...complaintItems, ...feedbackItems].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [reports, feedbacks]);

  return (
    <MainLayout title="Pesan Saya" currentPage="/my-messages">
      <Head title="Pesan Saya" />
      <div className="p-3 sm:p-4 md:p-6 max-w-7xl mx-auto">
        {/* Header Card */}
        <div className="rounded-xl shadow-sm mb-4 sm:mb-6 px-4 sm:px-6 py-4 sm:py-5" style={{ backgroundColor: '#FFF8E1' }}>
          <h1 className="text-lg sm:text-xl md:text-2xl font-bold" style={{ color: '#212121' }}>
            Keluhan/Masukan
          </h1>
          <p className="text-xs sm:text-sm mt-2 text-gray-700">
            Lihat status penanganan, balasan, atau penutupan laporan Anda
          </p>
        </div>

        {/* Desktop Table View */}
        <div className="hidden lg:block bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Waktu</th>
                  <th className="px-4 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Jenis</th>
                  <th className="px-4 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Tower</th>
                  <th className="px-4 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Kategori</th>
                  <th className="px-4 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Balasan</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {items.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-gray-500">
                      <div className="flex flex-col items-center">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                          </svg>
                        </div>
                        <p className="text-gray-500 font-medium">Belum ada pesan</p>
                        <p className="text-gray-400 text-sm mt-1">Anda belum mengirimkan laporan apapun</p>
                      </div>
                    </td>
                  </tr>
                )}
                {items.map((item) => {
                  const statusConfig = getStatusColor(item.status);
                  return (
                    <tr key={item.id} className="hover:bg-gray-50 transition-colors duration-150">
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">
                        <div>
                          <div className="font-medium">{formatDate(item.created_at)}</div>
                          <div className="text-xs text-gray-500">{new Date(item.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</div>
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${item.type === 'Keluhan' ? 'bg-red-50 text-red-700' : 'bg-blue-50 text-blue-700'}`}>{item.type}</span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                        {item.towerName}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">
                        <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium">
                          {item.category}
                        </span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className="px-3 py-1 rounded-full text-xs font-medium" style={{
                          backgroundColor: statusConfig.bg,
                          color: statusConfig.text
                        }}>
                          {statusConfig.label}
                        </span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">
                        <div className="flex items-center">
                          <span className="font-medium">{item.responsesCount}</span>
                          <span className="text-gray-400 ml-1">balasan</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Mobile/Tablet Card View */}
        <div className="lg:hidden space-y-3">
          {items.length === 0 && (
            <div className="bg-white rounded-xl shadow-sm p-6 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <p className="text-gray-500 font-medium">Belum ada pesan</p>
              <p className="text-gray-400 text-sm mt-1">Anda belum mengirimkan laporan apapun</p>
            </div>
          )}
          
          {items.map((item) => {
            const statusConfig = getStatusColor(item.status);
            return (
              <div key={item.id} className="bg-white rounded-xl shadow-sm p-4 hover:shadow-md transition-shadow duration-150">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 text-sm mb-1">
                      {item.towerName ?? 'Tower tidak diketahui'}
                    </h3>
                    <p className="text-xs text-gray-500 mb-2">
                      {formatDate(item.created_at)} • {new Date(item.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${item.type === 'Keluhan' ? 'bg-red-50 text-red-700' : 'bg-blue-50 text-blue-700'}`}>
                    {item.type}
                  </span>
                  <span className="px-2 py-1 rounded-full text-xs font-medium" style={{
                    backgroundColor: statusConfig.bg,
                    color: statusConfig.text
                  }}>
                    {statusConfig.label}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium">
                    {item.category}
                  </span>
                  <div className="flex items-center text-xs text-gray-600">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    {item.responsesCount} balasan
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Summary Stats */}
        {items.length > 0 && (
          <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white rounded-lg p-3 text-center shadow-sm">
              <div className="text-2xl font-bold text-blue-600">{items.length}</div>
              <div className="text-xs text-gray-600">Total Laporan</div>
            </div>
            <div className="bg-white rounded-lg p-3 text-center shadow-sm">
              <div className="text-2xl font-bold text-yellow-600">
                {items.filter(r => r.status === 'pending').length}
              </div>
              <div className="text-xs text-gray-600">Menunggu</div>
            </div>
            <div className="bg-white rounded-lg p-3 text-center shadow-sm">
              <div className="text-2xl font-bold text-blue-600">
                {items.filter(r => r.status === 'in_progress').length}
              </div>
              <div className="text-xs text-gray-600">Diproses</div>
            </div>
            <div className="bg-white rounded-lg p-3 text-center shadow-sm">
              <div className="text-2xl font-bold text-green-600">
                {items.filter(r => r.status === 'resolved').length}
              </div>
              <div className="text-xs text-gray-600">Selesai</div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}


