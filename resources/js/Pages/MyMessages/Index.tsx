import React from 'react';
import { Head, usePage, router } from '@inertiajs/react';
import MainLayout from '@/Layouts/MainLayout';
import MessageTable from '@/Components/MyMessages/MessageTable';
import MessageCard from '@/Components/MyMessages/MessageCard';
import MessageStats from '@/Components/MyMessages/MessageStats';

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

type MessageItem = {
  id: string;
  type: 'Keluhan' | 'Masukan';
  created_at: string;
  towerName: string;
  category: string;
  status: string | undefined | null;
  responsesCount: number;
};

export default function MyMessagesIndex({ reports = [] as ReportItem[], feedbacks = [] as FeedbackItem[] }: MyMessagesProps) {
  const { auth } = usePage().props as any;
  const isStaff = !!(auth?.user && ['admin','operator'].includes(auth.user.role));

  React.useEffect(() => {
    if (isStaff) {
      router.visit('/admin');
    }
  }, [isStaff]);

  if (isStaff) return null;

  const getStatusColor = (status: string | undefined | null) => {
    const statusConfig = {
      pending: { bg: '#FEF3C7', text: '#92400E', label: 'Menunggu' },
      in_progress: { bg: '#DBEAFE', text: '#1E40AF', label: 'Sedang Diproses' },
      responded: { bg: '#E0E7FF', text: '#3730A3', label: 'Sudah Dibalas' },
      resolved: { bg: '#D1FAE5', text: '#065F46', label: 'Selesai' },
    };
    
    // If status is undefined or null, return a default styling
    if (!status) {
      return { bg: '#F3F4F6', text: '#374151', label: 'Tidak diketahui' };
    }
    
    // Check if the status exists in our config
    return statusConfig[status as keyof typeof statusConfig] || 
      { bg: '#F3F4F6', text: '#374151', label: status.replace ? status.replace('_', ' ') : status };
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
  const items: MessageItem[] = React.useMemo(() => {
    const complaintItems = (reports || []).map((r) => ({
      id: `report-${r.id}`,
      type: 'Keluhan' as const,
      created_at: r.created_at,
      towerName: r.tower?.site_name ?? '-',
      category: r.category || 'Umum',
      status: r.status || 'pending', // Use a default status if none provided
      responsesCount: r.responses?.length ?? 0,
    }));

    const feedbackItems = (feedbacks || []).map((f) => ({
      id: `feedback-${f.id}`,
      type: 'Masukan' as const,
      created_at: f.created_at,
      towerName: f.tower?.site_name ?? '-',
      category: f.category || 'Umum',
      status: f.status || 'pending', // Use a default status if none provided
      responsesCount: f.responses?.length ?? 0,
    }));

    return [...complaintItems, ...feedbackItems].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [reports, feedbacks]);
  
  // Detail modal state and helpers
  const [detail, setDetail] = React.useState<{ type: 'report' | 'feedback'; data: ReportItem | FeedbackItem } | null>(null);
  const openDetail = (it: MessageItem) => {
    const [typ, raw] = it.id.split('-');
    const id = Number(raw);
    if (typ === 'report') {
      const data = (reports || []).find(r => r.id === id);
      if (data) setDetail({ type: 'report', data });
    } else if (typ === 'feedback') {
      const data = (feedbacks || []).find(f => f.id === id);
      if (data) setDetail({ type: 'feedback', data });
    }
  };
  const closeDetail = () => setDetail(null);
  const renderAssets = (assets?: Array<{ file_path: string; file_type?: string }>) => {
    if (!assets || assets.length === 0) return null;
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-3">
        {assets.map((a, i) => (
          <div key={i} className="rounded overflow-hidden border">
            {a.file_type === 'video' ? (
              <video src={`/storage/${a.file_path}`} controls className="w-full h-32 object-cover" />
            ) : (
              <img src={`/storage/${a.file_path}`} className="w-full h-32 object-cover" />
            )}
          </div>
        ))}
      </div>
    );
  };

  const EmptyState = () => (
    <div className="bg-white rounded-xl shadow-sm p-6 text-center">
      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      </div>
      <p className="text-gray-500 font-medium">Belum ada pesan</p>
      <p className="text-gray-400 text-sm mt-1">Anda belum mengirimkan laporan apapun</p>
    </div>
  );

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
        <MessageTable 
          items={items}
          getStatusColor={getStatusColor}
          formatDate={formatDate}
          onOpen={openDetail}
        />

        {/* Mobile/Tablet Card View */}
        <div className="lg:hidden space-y-3">
          {items.length === 0 ? (
            <EmptyState />
          ) : (
            items.map((item) => (
              <MessageCard
                key={item.id}
                item={item}
                getStatusColor={getStatusColor}
                formatDate={formatDate}
                onOpen={openDetail}
              />
            ))
          )}
        </div>

        {/* Summary Stats */}
        <MessageStats items={items} />
        {detail && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={closeDetail}>
            <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full overflow-hidden" onClick={(e) => e.stopPropagation()}>
              <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">Detail {detail.type === 'report' ? 'Keluhan' : 'Masukan'}</h3>
                <button onClick={closeDetail} className="text-gray-400 hover:text-gray-600">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
              <div className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
                <div>
                  <div className="text-sm text-gray-700">Tower</div>
                  <div className="font-medium text-gray-900">{(detail.data as any).tower?.site_name ?? '-'}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-700">Kategori</div>
                  <div className="font-medium text-gray-900">{(detail.data as any).category ?? '-'}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-700">Pesan</div>
                  <div className="text-gray-900 whitespace-pre-wrap">{(detail.data as any).message}</div>
                </div>
                {detail.type === 'report' ? (
                  renderAssets((detail.data as any).images)
                ) : (
                  renderAssets((detail.data as any).assets)
                )}
                <div>
                  <div className="text-sm font-medium text-gray-900 mb-2">Balasan Admin</div>
                  {detail.type === 'report' && (detail.data as any).responses?.length > 0 ? (
                    <div className="space-y-3">
                      {(detail.data as any).responses.map((r: any, i: number) => (
                        <div key={i} className="bg-gray-50 rounded p-3">
                          <div className="text-sm text-gray-600 mb-1">{r.user?.name ?? 'Admin'} • {formatDate(r.created_at)}</div>
                          {r.message && <div className="text-gray-900">{r.message}</div>}
                          {renderAssets(r.assets)}
                        </div>
                      ))}
                    </div>
                  ) : null}
                  {detail.type === 'feedback' && (detail.data as any).responses?.length > 0 ? (
                    <div className="space-y-3">
                      {(detail.data as any).responses.map((r: any, i: number) => (
                        <div key={i} className="bg-gray-50 rounded p-3">
                          <div className="text-sm text-gray-600 mb-1">{r.user?.name ?? 'Admin'} • {formatDate(r.created_at)}</div>
                          {r.message && <div className="text-gray-900">{r.message}</div>}
                          {renderAssets(r.assets)}
                        </div>
                      ))}
                    </div>
                  ) : null}
                  {((detail.type === 'report' && (!(detail.data as any).responses || (detail.data as any).responses.length === 0)) ||
                   (detail.type === 'feedback' && (!(detail.data as any).responses || (detail.data as any).responses.length === 0))) && (
                    <div className="text-gray-500">Belum ada balasan.</div>
                  )}
                </div>
              </div>
              <div className="px-6 py-3 border-t bg-gray-50 text-right">
                <button onClick={closeDetail} className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300">Tutup</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
