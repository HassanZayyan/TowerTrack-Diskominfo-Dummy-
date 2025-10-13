import React, { useState, useCallback } from 'react';
import { Head, router, Link } from '@inertiajs/react';
import MainLayout from '@/Layouts/MainLayout';
import MessageTable from '@/Components/MyMessages/MessageTable';
import MessageCard from '@/Components/MyMessages/MessageCard';
import MessageStats from '@/Components/MyMessages/MessageStats';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import PrimaryButton from '@/Components/PrimaryButton';

type ReportItem = {
  id: number;
  tower_id: number;
  category: string;
  message: string;
  status: string;
  created_at: string;
  email?: string | null;
  reporter_name?: string | null;
  reporter_phone?: string | null;
  user_id?: number | null;
  user?: { id: number; name: string; email: string } | null;
  tower?: { id: number; site_name: string; alamat_menara?: string };
  responses?: Array<{ id: number; report_id: number; created_at: string }>;
};

type FeedbackItem = {
  id: number;
  tower_id: number;
  category: string;
  message: string;
  status: string;
  created_at: string;
  email?: string | null;
  sender_name?: string | null;
  sender_phone?: string | null;
  user_id?: number | null;
  user?: { id: number; name: string; email: string } | null;
  tower?: { id: number; site_name: string; alamat_menara?: string };
  responses?: Array<{ id: number; feedback_id: number; created_at: string }>;
};

type PrivateTrackingProps = {
  reports?: ReportItem[];
  feedbacks?: FeedbackItem[];
  email?: string;
  phone?: string;
};

type MessageItem = {
  id: string;
  type: 'Keluhan' | 'Masukan';
  created_at: string;
  towerName: string;
  category: string;
  status: string | undefined | null;
  responsesCount: number;
  senderName: string;
  senderEmail: string;
  isAnonymous: boolean;
};

// Email Input Form Component - Moved outside to prevent recreation on each render
const EmailInputForm = ({ 
  inputEmail, 
  setInputEmail, 
  inputPhone, 
  setInputPhone, 
  handleFormSubmit 
}: {
  inputEmail: string;
  setInputEmail: (value: string) => void;
  inputPhone: string;
  setInputPhone: (value: string) => void;
  handleFormSubmit: (e: React.FormEvent) => void;
}) => (
  <div className="bg-white rounded-xl shadow-sm p-6 text-center">
    <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
      <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    </div>
    <h3 className="text-lg font-medium text-gray-900 mb-2">Lacak Pesan Pribadi</h3>
    <p className="text-gray-600 mb-6">
      Masukkan email dan nomor telepon yang Anda gunakan saat mengirim keluhan atau masukan pribadi untuk melihat status dan respons.
    </p>
    
    <form onSubmit={handleFormSubmit} className="max-w-md mx-auto">
      <div className="mb-4">
        <InputLabel htmlFor="email" value="Email" />
        <TextInput
          id="email"
          type="email"
          name="email"
          value={inputEmail}
          onChange={(e) => setInputEmail(e.target.value)}
          className="mt-1 block w-full"
          required
          placeholder="Masukkan email Anda"
          autoComplete="email"
        />
      </div>
      
      <div className="mb-4">
        <InputLabel htmlFor="phone" value="Nomor Telepon" />
        <TextInput
          id="phone"
          type="tel"
          name="phone"
          value={inputPhone}
          onChange={(e) => setInputPhone(e.target.value)}
          className="mt-1 block w-full"
          required
          placeholder="Masukkan nomor telepon Anda"
          autoComplete="tel"
        />
      </div>
      
      <PrimaryButton
        type="submit"
        className="w-full px-6 py-3 font-semibold rounded-lg transition-all duration-200 hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 justify-center text-lg"
        style={{ backgroundColor: '#D97706', color: '#FFFFFF' }}
      >
        <span className="flex items-center justify-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Lacak Pesan Pribadi
        </span>
      </PrimaryButton>
    </form>
    
    <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
      <p className="text-yellow-800 text-sm">
        <strong>Tips:</strong> Hanya pesan yang Anda kirim sebagai <strong>pribadi</strong> yang akan muncul di sini. 
        Pastikan email dan nomor telepon sesuai dengan yang Anda gunakan saat mengirim pesan.
        Pesan publik dapat dilihat di <a href="/my-messages" className="underline font-medium">halaman pesan utama</a>.
      </p>
    </div>
  </div>
);

// Empty State Component - Moved outside to prevent recreation
const EmptyState = ({ email, phone }: { email: string; phone: string }) => (
  <div className="bg-white rounded-xl shadow-sm p-6 text-center">
    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    </div>
    <p className="text-gray-500 font-medium">Tidak ada pesan pribadi</p>
    <p className="text-gray-400 text-sm mt-1">
      {email && phone ? 
        'Tidak ada pesan pribadi yang ditemukan untuk email dan nomor telepon ini' : 
        'Masukkan email dan nomor telepon Anda untuk melihat pesan pribadi'
      }
    </p>
  </div>
);

export default function PrivateTracking({ 
  reports = [] as ReportItem[], 
  feedbacks = [] as FeedbackItem[],
  email = '',
  phone = ''
}: PrivateTrackingProps) {
  const [inputEmail, setInputEmail] = useState(email);
  const [inputPhone, setInputPhone] = useState(phone);

  const handleFormSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (inputEmail.trim() && inputPhone.trim()) {
      router.visit(`/my-messages/private?email=${encodeURIComponent(inputEmail.trim())}&phone=${encodeURIComponent(inputPhone.trim())}`);
    }
  }, [inputEmail, inputPhone]);

  const getStatusColor = useCallback((status: string | undefined | null) => {
    const statusConfig = {
      pending: { bg: '#FEF3C7', text: '#92400E', label: 'Menunggu' },
      in_progress: { bg: '#DBEAFE', text: '#1E40AF', label: 'Sedang Diproses' },
      responded: { bg: '#E0E7FF', text: '#3730A3', label: 'Sudah Dibalas' },
      resolved: { bg: '#D1FAE5', text: '#065F46', label: 'Selesai' },
      closed: { bg: '#D1FAE5', text: '#065F46', label: 'Selesai' },
    };
    
    if (!status) {
      return { bg: '#F3F4F6', text: '#374151', label: 'Tidak diketahui' };
    }
    
    return statusConfig[status as keyof typeof statusConfig] || 
      { bg: '#F3F4F6', text: '#374151', label: status.replace ? status.replace('_', ' ') : status };
  }, []);

  const formatDate = useCallback((dateString: string) => {
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
  }, []);

  // Merge complaints and feedbacks into a single unified list
  const items: MessageItem[] = React.useMemo(() => {
    const complaintItems = (reports || []).map((r) => ({
      id: `report-${r.id}`,
      type: 'Keluhan' as const,
      created_at: r.created_at,
      towerName: r.tower?.site_name ?? '-',
      category: (r.category || 'Umum').replace(/\[Dari:\s*[^\]]+\]/gi, '').trim(),
      status: r.status || 'pending',
      responsesCount: r.responses?.length ?? 0,
      // Extract sender info - prefer authenticated user info over anonymous info
      senderName: r.user?.name || r.reporter_name || 'Anonymous',
      senderEmail: r.user?.email || r.email || '-',
      isAnonymous: !r.user_id, // Anonymous if no user_id
    }));

    const feedbackItems = (feedbacks || []).map((f) => ({
      id: `feedback-${f.id}`,
      type: 'Masukan' as const,
      created_at: f.created_at,
      towerName: f.tower?.site_name ?? '-',
      category: (f.category || 'Umum').replace(/\[Dari:\s*[^\]]+\]/gi, '').trim(),
      status: f.status || 'pending',
      responsesCount: f.responses?.length ?? 0,
      // Extract sender info - prefer authenticated user info over anonymous info
      senderName: f.user?.name || f.sender_name || 'Anonymous',
      senderEmail: f.user?.email || f.email || '-',
      isAnonymous: !f.user_id, // Anonymous if no user_id
    }));

    return [...complaintItems, ...feedbackItems].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [reports, feedbacks]);
  
  // Detail modal state and helpers
  const [detail, setDetail] = React.useState<{ type: 'report' | 'feedback'; data: ReportItem | FeedbackItem } | null>(null);
  const openDetail = useCallback((it: MessageItem) => {
    const [typ, raw] = it.id.split('-');
    const id = Number(raw);
    if (typ === 'report') {
      const data = (reports || []).find(r => r.id === id);
      if (data) setDetail({ type: 'report', data });
    } else if (typ === 'feedback') {
      const data = (feedbacks || []).find(f => f.id === id);
      if (data) setDetail({ type: 'feedback', data });
    }
  }, [reports, feedbacks]);
  const closeDetail = useCallback(() => setDetail(null), []);
  const [previewAsset, setPreviewAsset] = React.useState<{ file_path: string; file_type?: string } | null>(null);

  const renderAssets = (assets?: Array<{ file_path: string; file_type?: string }>) => {
    if (!assets || assets.length === 0) return null;
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-3">
        {assets.map((a, i) => (
          <div key={i} className="rounded overflow-hidden border bg-black cursor-pointer" onClick={() => setPreviewAsset(a)}>
            {a.file_type === 'video' ? (
              <div className="relative w-full h-40 bg-black">
                <video
                  src={`/storage/${a.file_path}#t=0.1`}
                  preload="metadata"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-40">
                  <div className="w-12 h-12 bg-white bg-opacity-90 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-gray-800 ml-1" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M8 5v10l8-5-8-5z"/>
                    </svg>
                  </div>
                </div>
              </div>
            ) : (
              <img src={`/storage/${a.file_path}`} className="w-full h-40 object-cover" />
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <MainLayout title="Lacak Pesan Pribadi" currentPage="/my-messages">
      <Head title="Lacak Pesan Pribadi" />
      
      <div className="p-4 sm:p-6">
        {/* Back Button */}
        <div className="mb-6">
          <Link
            href="/my-messages"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold transition-all duration-200 hover:shadow-md transform hover:-translate-x-1"
            style={{ 
              backgroundColor: '#FEF3C7', 
              color: '#92400E',
              border: '2px solid #F59E0B'
            }}
          >
            <svg className="w-5 h-5 font-bold" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            <span>Kembali ke Pesan Publik</span>
          </Link>
        </div>

        <div 
          className="rounded-lg shadow mb-8 px-4 sm:px-6 py-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3" 
          style={{ backgroundColor: '#FEF3C7' }}
        >
          <div>
            <h1 className="text-xl sm:text-2xl font-bold mb-1" style={{ color: '#92400E' }}>
              Lacak Pesan Pribadi
            </h1>
            <p className="text-sm sm:text-base" style={{ color: '#92400E', opacity: 0.85 }}>
              Lihat status penanganan pesan pribadi yang Anda kirim
            </p>
          </div>
          <img 
            src="/images/kab-smg-logo.png" 
            alt="Kabupaten Semarang" 
            className="h-8 w-8 sm:h-10 sm:w-10 hidden xs:block" 
          />
        </div>

        {/* Show form if no email or phone provided */}
        {(!email || !phone) && (
          <div className="mb-6">
            <EmailInputForm 
              inputEmail={inputEmail}
              setInputEmail={setInputEmail}
              inputPhone={inputPhone}
              setInputPhone={setInputPhone}
              handleFormSubmit={handleFormSubmit}
            />
          </div>
        )}

        {/* Show results if both email and phone are provided */}
        {email && phone && (
          <>
            {items.length > 0 ? (
              <>
                {/* Summary Stats */}
                <div className="mb-4 sm:mb-6">
                  <MessageStats items={items} />
                </div>

                {/* Desktop Table View */}
                <div>
                  <MessageTable 
                    items={items}
                    getStatusColor={getStatusColor}
                    formatDate={formatDate}
                    onOpen={openDetail}
                  />
                </div>

                {/* Mobile/Tablet Card View */}
                <div className="lg:hidden space-y-3">
                  {items.map((item) => (
                    <MessageCard
                      key={item.id}
                      item={item}
                      getStatusColor={getStatusColor}
                      formatDate={formatDate}
                      onOpen={openDetail}
                    />
                  ))}
                </div>
              </>
            ) : (
              <EmptyState email={email} phone={phone} />
            )}
          </>
        )}

        {/* Detail Modal */}
        {detail && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={closeDetail}>
            <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full overflow-hidden" onClick={(e) => e.stopPropagation()}>
              <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">Detail {detail.type === 'report' ? 'Keluhan' : 'Masukan'} Pribadi</h3>
                <button onClick={closeDetail} className="text-gray-400 hover:text-gray-600">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
              <div className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
                <div>
                  <div className="text-sm text-gray-700">Tower</div>
                  <div className="font-medium text-gray-900">{(detail.data as any).tower?.site_name ?? '-'}</div>
                  {(detail.data as any).tower?.alamat_menara && (
                    <div className="text-sm text-gray-600">{(detail.data as any).tower?.alamat_menara}</div>
                  )}
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
                  renderAssets((detail.data as any).images || (detail.data as any).assets)
                ) : (
                  renderAssets((detail.data as any).assets || (detail.data as any).images)
                )}
                <div>
                  <div className="text-sm font-medium text-gray-900 mb-2">Balasan Admin</div>
                  {detail.type === 'report' && (detail.data as any).responses?.length > 0 ? (
                    <div className="space-y-3">
                      {(detail.data as any).responses.map((r: any, i: number) => {
                        const isLastResponse = i === (detail.data as any).responses.length - 1;
                        const overallStatus = (detail.data as any).status;
                        let statusLabel = 'Diproses';
                        let statusColor = 'bg-blue-100 text-blue-800';
                        
                        if (isLastResponse) {
                          const statusConfig = getStatusColor(overallStatus);
                          statusLabel = statusConfig.label;
                          if (overallStatus === 'closed' || overallStatus === 'resolved') {
                            statusColor = 'bg-green-100 text-green-800';
                          } else if (overallStatus === 'pending') {
                            statusColor = 'bg-yellow-100 text-yellow-800';
                          }
                        }
                        
                        return (
                        <div key={i} className="bg-gray-50 rounded p-3">
                          <div className="flex items-center justify-between mb-2">
                            <div className="text-sm text-gray-600">{r.user?.name ?? 'Admin'} • {formatDate(r.created_at)}</div>
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${statusColor}`}>
                              {statusLabel}
                            </span>
                          </div>
                          {r.message && <div className="text-gray-900">{r.message}</div>}
                          {r.assets && r.assets.length > 0 && (
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-3">
                              {r.assets.map((a: any, idx: number) => (
                                <div key={idx} className="rounded overflow-hidden border bg-black cursor-pointer" onClick={() => setPreviewAsset(a)}>
                                  {a.file_type === 'video' ? (
                                    <div className="relative w-full h-40 bg-black">
                                      <video
                                        src={`/storage/${a.file_path}#t=0.1`}
                                        preload="metadata"
                                        className="w-full h-full object-cover"
                                      />
                                      <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-40">
                                        <div className="w-12 h-12 bg-white bg-opacity-90 rounded-full flex items-center justify-center">
                                          <svg className="w-6 h-6 text-gray-800 ml-1" fill="currentColor" viewBox="0 0 20 20">
                                            <path d="M8 5v10l8-5-8-5z"/>
                                          </svg>
                                        </div>
                                      </div>
                                    </div>
                                  ) : (
                                    <img src={`/storage/${a.file_path}`} className="w-full h-40 object-cover" />
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                        );
                      })}
                    </div>
                  ) : null}
                  {detail.type === 'feedback' && (detail.data as any).responses?.length > 0 ? (
                    <div className="space-y-3">
                      {(detail.data as any).responses.map((r: any, i: number) => {
                        const isLastResponse = i === (detail.data as any).responses.length - 1;
                        const overallStatus = (detail.data as any).status;
                        let statusLabel = 'Diproses';
                        let statusColor = 'bg-blue-100 text-blue-800';
                        
                        if (isLastResponse) {
                          const statusConfig = getStatusColor(overallStatus);
                          statusLabel = statusConfig.label;
                          if (overallStatus === 'closed' || overallStatus === 'resolved') {
                            statusColor = 'bg-green-100 text-green-800';
                          } else if (overallStatus === 'pending') {
                            statusColor = 'bg-yellow-100 text-yellow-800';
                          }
                        }
                        
                        return (
                        <div key={i} className="bg-gray-50 rounded p-3">
                          <div className="flex items-center justify-between mb-2">
                            <div className="text-sm text-gray-600">{r.user?.name ?? 'Admin'} • {formatDate(r.created_at)}</div>
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${statusColor}`}>
                              {statusLabel}
                            </span>
                          </div>
                          {r.message && <div className="text-gray-900">{r.message}</div>}
                          {r.assets && r.assets.length > 0 && (
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-3">
                              {r.assets.map((a: any, idx: number) => (
                                <div key={idx} className="rounded overflow-hidden border bg-black cursor-pointer" onClick={() => setPreviewAsset(a)}>
                                  {a.file_type === 'video' ? (
                                    <div className="relative w-full h-40 bg-black">
                                      <video
                                        src={`/storage/${a.file_path}#t=0.1`}
                                        preload="metadata"
                                        className="w-full h-full object-cover"
                                      />
                                      <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-40">
                                        <div className="w-12 h-12 bg-white bg-opacity-90 rounded-full flex items-center justify-center">
                                          <svg className="w-6 h-6 text-gray-800 ml-1" fill="currentColor" viewBox="0 0 20 20">
                                            <path d="M8 5v10l8-5-8-5z"/>
                                          </svg>
                                        </div>
                                      </div>
                                    </div>
                                  ) : (
                                    <img src={`/storage/${a.file_path}`} className="w-full h-40 object-cover" />
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                        );
                      })}
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
      
        {/* Asset Preview Modal */}
        {previewAsset && (
          <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50" onClick={() => setPreviewAsset(null)}>
            <div className="max-w-4xl w-full max-h-[90vh] flex items-center justify-center p-4">
              {previewAsset.file_type === 'video' ? (
                <video
                  src={`/storage/${previewAsset.file_path}`}
                  controls
                  autoPlay
                  className="max-w-full max-h-[90vh] object-contain"
                  onClick={(e) => e.stopPropagation()}
                />
              ) : (
                <img 
                  src={`/storage/${previewAsset.file_path}`} 
                  className="max-w-full max-h-[90vh] object-contain" 
                  onClick={(e) => e.stopPropagation()}
                />
              )}
              <button 
                className="absolute top-4 right-4 text-white bg-black bg-opacity-50 rounded-full p-2 hover:bg-opacity-70"
                onClick={() => setPreviewAsset(null)}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
