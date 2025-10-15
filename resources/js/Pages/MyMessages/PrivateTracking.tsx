import React, { useState, useCallback } from 'react';
import { Head, router, Link } from '@inertiajs/react';
import MainLayout from '@/Layouts/MainLayout';
import MessageTable from '@/Components/MyMessages/MessageTable';
import MessageCard from '@/Components/MyMessages/MessageCard';
import MessageStats from '@/Components/MyMessages/MessageStats';
import VideoThumbnail from '@/Components/VideoThumbnail';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import PrimaryButton from '@/Components/PrimaryButton';
import AnimatedButton from '@/Components/AnimatedButton';
import StaggeredContainer from '@/Components/StaggeredContainer';

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
  <div className="bg-gradient-to-br from-amber-50 via-white to-amber-50 rounded-xl shadow-lg border border-amber-100 p-8 text-center">
    <div className="w-20 h-20 bg-gradient-to-br from-amber-500 to-amber-600 rounded-full flex items-center justify-center mx-auto mb-5 shadow-lg">
      <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    </div>
    <h3 className="text-2xl font-bold text-gray-900 mb-3">🔐 Lacak Pesan Pribadi</h3>
    <p className="text-gray-600 mb-8 max-w-md mx-auto">
      Masukkan email dan nomor telepon yang Anda gunakan saat mengirim keluhan atau masukan <span className="font-semibold">pribadi</span> untuk melihat status dan respons.
    </p>
    
    <form onSubmit={handleFormSubmit} className="max-w-md mx-auto space-y-5">
      <div>
        <InputLabel htmlFor="email" value="Alamat Email" className="text-left mb-2" />
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
            </svg>
          </div>
          <TextInput
            id="email"
            type="email"
            name="email"
            value={inputEmail}
            onChange={(e) => setInputEmail(e.target.value)}
            className="mt-1 block w-full pl-10"
            required
            placeholder="contoh@email.com"
            autoComplete="email"
          />
        </div>
      </div>
      
      <div>
        <InputLabel htmlFor="phone" value="Nomor Telepon" className="text-left mb-2" />
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
          </div>
          <TextInput
            id="phone"
            type="tel"
            name="phone"
            value={inputPhone}
            onChange={(e) => setInputPhone(e.target.value)}
            className="mt-1 block w-full pl-10"
            required
            placeholder="08xx-xxxx-xxxx"
            autoComplete="tel"
          />
        </div>
      </div>
      
      <AnimatedButton
        type="submit"
        variant="primary"
        size="lg"
        animation="glow"
        fullWidth
        icon={
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        }
      >
        Lacak Pesan Pribadi
      </AnimatedButton>
    </form>
    
    <div className="mt-6 p-4 bg-amber-50 border-l-4 border-amber-500 rounded-lg text-left">
      <p className="text-amber-900 text-sm leading-relaxed">
        <span className="font-semibold">💡 Tips:</span> Hanya pesan yang Anda kirim sebagai <span className="font-semibold">pribadi</span> yang akan muncul di sini. 
        Pastikan email dan nomor telepon sesuai dengan yang Anda gunakan saat mengirim pesan.
        Pesan publik dapat dilihat di <Link href="/my-messages" className="underline font-semibold hover:text-amber-700">halaman pesan utama</Link>.
      </p>
    </div>
  </div>
);

// Empty State Component - Moved outside to prevent recreation
const EmptyState = ({ email, phone }: { email: string; phone: string }) => (
  <StaggeredContainer delay={200} animationType="bounceIn" duration={500}>
    <div className="bg-gradient-to-br from-gray-50 via-white to-gray-50 rounded-xl shadow-lg border border-gray-200 p-12 text-center">
      <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
        <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <h3 className="text-2xl font-bold text-gray-900 mb-3">Tidak Ada Pesan Pribadi</h3>
      <p className="text-gray-600 max-w-md mx-auto text-base">
        {email && phone ? 
          'Tidak ada pesan pribadi yang ditemukan untuk email dan nomor telepon ini. Pastikan data yang Anda masukkan sesuai dengan yang digunakan saat mengirim pesan.' : 
          'Masukkan email dan nomor telepon Anda untuk melihat pesan pribadi yang telah Anda kirim.'
        }
      </p>
    </div>
  </StaggeredContainer>
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
          <div key={i} className="rounded overflow-hidden border border-gray-200 bg-white shadow-sm hover:shadow-md transition-all duration-200">
            {a.file_type === 'video' ? (
              <VideoThumbnail
                src={`/storage/${a.file_path}`}
                fileType="video"
                className="w-full h-40"
                onClick={() => setPreviewAsset(a)}
                showPlayButton={true}
                alt={`Video attachment ${i + 1}`}
                loading="lazy"
              />
            ) : (
              <div className="relative w-full h-40 bg-gray-100">
                <img 
                  src={`/storage/${a.file_path}`} 
                  className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform duration-200" 
                  alt={`Image attachment ${i + 1}`}
                  loading="lazy"
                  onClick={() => setPreviewAsset(a)}
                  onError={(e) => {
                    e.currentTarget.src = '/images/placeholder-image.png';
                  }}
                />
                <div className="absolute top-2 right-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
                  🖼️ Image
                </div>
              </div>
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
        <StaggeredContainer delay={0} animationType="fadeInLeft" duration={400}>
          <div className="mb-6">
            <AnimatedButton
              variant="outline"
              size="md"
              animation="scale"
              onClick={() => router.visit('/my-messages')}
              icon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                </svg>
              }
              className="border-amber-500 text-amber-700 hover:bg-amber-500 hover:text-white"
            >
              Kembali ke Pesan Publik
            </AnimatedButton>
          </div>
        </StaggeredContainer>

        <StaggeredContainer delay={100} animationType="fadeInUp" duration={500}>
          <div className="relative rounded-xl shadow-lg mb-8 px-6 sm:px-8 py-6 overflow-hidden bg-gradient-to-br from-amber-50 via-white to-amber-50 border border-amber-100">
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-amber-100/30 to-transparent rounded-full blur-3xl -z-0"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-amber-100/20 to-transparent rounded-full blur-2xl -z-0"></div>
            
            <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-gradient-to-br from-amber-500 to-amber-600 rounded-lg shadow-md">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-amber-700 to-amber-600 bg-clip-text text-transparent">
                    Lacak Pesan Pribadi
                  </h1>
                </div>
                <p className="text-sm sm:text-base text-gray-700 ml-14">
                  Pantau status penanganan pesan pribadi yang Anda kirim dengan aman dan mudah
                </p>
              </div>
              <div className="hidden sm:flex items-center gap-3">
                <div className="text-right">
                  <p className="text-xs text-gray-500 font-medium">Kabupaten</p>
                  <p className="text-sm font-bold text-amber-700">Semarang</p>
                </div>
                <img 
                  src="/images/kab-smg-logo.png" 
                  alt="Kabupaten Semarang" 
                  className="h-12 w-12 object-contain drop-shadow-md" 
                />
              </div>
            </div>
          </div>
        </StaggeredContainer>

        {/* Show form if no email or phone provided */}
        {(!email || !phone) && (
          <StaggeredContainer delay={200} animationType="scaleIn" duration={500}>
            <EmailInputForm 
              inputEmail={inputEmail}
              setInputEmail={setInputEmail}
              inputPhone={inputPhone}
              setInputPhone={setInputPhone}
              handleFormSubmit={handleFormSubmit}
            />
          </StaggeredContainer>
        )}

        {/* Show results if both email and phone are provided */}
        {email && phone && (
          <>
            {items.length > 0 ? (
              <>
                {/* Summary Stats */}
                <StaggeredContainer delay={200} animationType="fadeInUp" duration={400}>
                  <div className="mb-6">
                    <MessageStats items={items} />
                  </div>
                </StaggeredContainer>

                {/* Desktop Table View */}
                <StaggeredContainer delay={300} animationType="fadeInUp" duration={500}>
                  <MessageTable 
                    items={items}
                    getStatusColor={getStatusColor}
                    formatDate={formatDate}
                    onOpen={openDetail}
                  />
                </StaggeredContainer>

                {/* Mobile/Tablet Card View */}
                <div className="lg:hidden space-y-3">
                  {items.map((item, index) => (
                    <StaggeredContainer 
                      key={item.id} 
                      delay={300 + (index * 50)} 
                      animationType="scaleIn" 
                      duration={400}
                    >
                      <MessageCard
                        item={item}
                        getStatusColor={getStatusColor}
                        formatDate={formatDate}
                        onOpen={openDetail}
                      />
                    </StaggeredContainer>
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
          <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn" onClick={closeDetail}>
            <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full overflow-hidden transform transition-all duration-300 animate-scaleIn" onClick={(e) => e.stopPropagation()}>
              <div className="px-6 py-5 bg-gradient-to-r from-amber-500 to-amber-600 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-white">Detail {detail.type === 'report' ? 'Keluhan' : 'Masukan'} Pribadi</h3>
                </div>
                <button 
                  onClick={closeDetail} 
                  className="text-white hover:bg-white/20 p-2 rounded-lg transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto bg-gray-50">
                {/* Tower & Category Information */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="p-2 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow-sm">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                      </div>
                      <h5 className="text-sm font-bold text-gray-900">Lokasi Tower</h5>
                    </div>
                    <div className="font-semibold text-gray-900 text-base mb-1">{(detail.data as any).tower?.site_name ?? '-'}</div>
                    {(detail.data as any).tower?.alamat_menara && (
                      <div className="text-sm text-gray-600 flex items-start gap-1">
                        <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        {(detail.data as any).tower?.alamat_menara}
                      </div>
                    )}
                  </div>
                  <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="p-2 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg shadow-sm">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                        </svg>
                      </div>
                      <h5 className="text-sm font-bold text-gray-900">Kategori</h5>
                    </div>
                    <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-semibold bg-orange-100 text-orange-800 border border-orange-200">
                      {(detail.data as any).category ?? '-'}
                    </span>
                  </div>
                </div>

                {/* Message Content */}
                <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="p-2 bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-sm">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                      </svg>
                    </div>
                    <h5 className="text-sm font-bold text-gray-900">Isi Pesan</h5>
                  </div>
                  <div className="text-gray-900 whitespace-pre-wrap leading-relaxed bg-gray-50 rounded-lg p-4 border border-gray-100">
                    {(detail.data as any).message}
                  </div>
                </div>
                {detail.type === 'report' ? (
                  renderAssets((detail.data as any).images || (detail.data as any).assets)
                ) : (
                  renderAssets((detail.data as any).assets || (detail.data as any).images)
                )}
                {/* Admin Responses */}
                <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="p-2 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg shadow-sm">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                    </div>
                    <h5 className="text-sm font-bold text-gray-900">Balasan Admin</h5>
                  </div>
                  {detail.type === 'report' && (detail.data as any).responses?.length > 0 ? (
                    <div className="relative space-y-4">
                      {/* Timeline line */}
                      <div className="absolute left-4 top-6 bottom-6 w-0.5 bg-gradient-to-b from-indigo-200 via-indigo-300 to-indigo-200"></div>
                      
                      {(detail.data as any).responses.map((r: any, i: number) => {
                        const isLastResponse = i === (detail.data as any).responses.length - 1;
                        const overallStatus = (detail.data as any).status;
                        let statusLabel = 'Diproses';
                        let statusColor = 'bg-blue-100 text-blue-800 border-blue-200';
                        let dotColor = 'bg-blue-500';
                        
                        if (isLastResponse) {
                          const statusConfig = getStatusColor(overallStatus);
                          statusLabel = statusConfig.label;
                          if (overallStatus === 'closed' || overallStatus === 'resolved') {
                            statusColor = 'bg-green-100 text-green-800 border-green-200';
                            dotColor = 'bg-green-500';
                          } else if (overallStatus === 'pending') {
                            statusColor = 'bg-amber-100 text-amber-800 border-amber-200';
                            dotColor = 'bg-amber-500';
                          } else if (overallStatus === 'in_progress') {
                            statusColor = 'bg-blue-100 text-blue-800 border-blue-200';
                            dotColor = 'bg-blue-500';
                          }
                        }
                        
                        return (
                          <div key={i} className="relative pl-12">
                            {/* Timeline dot */}
                            <div className={`absolute left-2.5 top-3 w-3 h-3 rounded-full ${dotColor} ring-4 ring-white shadow-md z-10`}></div>
                            
                            <div className="bg-gradient-to-br from-indigo-50 to-white rounded-lg p-4 border border-indigo-100 shadow-sm">
                              <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center gap-2">
                                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-indigo-600 shadow-sm">
                                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                  </div>
                                  <div>
                                    <div className="text-sm font-semibold text-gray-900">{r.user?.name ?? 'Admin'}</div>
                                    <div className="text-xs text-gray-500 flex items-center gap-1">
                                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                      </svg>
                                      {formatDate(r.created_at)} • {new Date(r.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                  </div>
                                </div>
                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${statusColor}`}>
                                  {statusLabel}
                                </span>
                              </div>
                              {r.message && (
                                <div className="text-gray-900 leading-relaxed bg-white/60 backdrop-blur-sm rounded-lg p-3 border border-indigo-100">
                                  {r.message}
                                </div>
                              )}
                              {r.assets && r.assets.length > 0 && (
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-3">
                                  {r.assets.map((a: any, idx: number) => (
                                    <div key={idx} className="rounded-lg overflow-hidden border-2 border-indigo-200 bg-white shadow-sm hover:shadow-md cursor-pointer transform transition-all duration-200">
                                      {a.file_type === 'video' ? (
                                        <VideoThumbnail
                                          src={`/storage/${a.file_path}`}
                                          fileType="video"
                                          className="w-full h-32"
                                          onClick={() => setPreviewAsset(a)}
                                          showPlayButton={true}
                                          alt={`Admin response video ${idx + 1}`}
                                          loading="lazy"
                                        />
                                      ) : (
                                        <div className="relative w-full h-32 bg-gray-100">
                                          <img 
                                            src={`/storage/${a.file_path}`} 
                                            className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform duration-200" 
                                            alt={`Admin response image ${idx + 1}`}
                                            loading="lazy"
                                            onClick={() => setPreviewAsset(a)}
                                            onError={(e) => {
                                              e.currentTarget.src = '/images/placeholder-image.png';
                                            }}
                                          />
                                          <div className="absolute top-2 right-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
                                            🖼️ Image
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : null}
                  {detail.type === 'feedback' && (detail.data as any).responses?.length > 0 ? (
                    <div className="relative space-y-4">
                      {/* Timeline line */}
                      <div className="absolute left-4 top-6 bottom-6 w-0.5 bg-gradient-to-b from-indigo-200 via-indigo-300 to-indigo-200"></div>
                      
                      {(detail.data as any).responses.map((r: any, i: number) => {
                        const isLastResponse = i === (detail.data as any).responses.length - 1;
                        const overallStatus = (detail.data as any).status;
                        let statusLabel = 'Diproses';
                        let statusColor = 'bg-blue-100 text-blue-800 border-blue-200';
                        let dotColor = 'bg-blue-500';
                        
                        if (isLastResponse) {
                          const statusConfig = getStatusColor(overallStatus);
                          statusLabel = statusConfig.label;
                          if (overallStatus === 'closed' || overallStatus === 'resolved') {
                            statusColor = 'bg-green-100 text-green-800 border-green-200';
                            dotColor = 'bg-green-500';
                          } else if (overallStatus === 'pending') {
                            statusColor = 'bg-amber-100 text-amber-800 border-amber-200';
                            dotColor = 'bg-amber-500';
                          } else if (overallStatus === 'in_progress') {
                            statusColor = 'bg-blue-100 text-blue-800 border-blue-200';
                            dotColor = 'bg-blue-500';
                          }
                        }
                        
                        return (
                          <div key={i} className="relative pl-12">
                            {/* Timeline dot */}
                            <div className={`absolute left-2.5 top-3 w-3 h-3 rounded-full ${dotColor} ring-4 ring-white shadow-md z-10`}></div>
                            
                            <div className="bg-gradient-to-br from-indigo-50 to-white rounded-lg p-4 border border-indigo-100 shadow-sm">
                              <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center gap-2">
                                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-indigo-600 shadow-sm">
                                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                  </div>
                                  <div>
                                    <div className="text-sm font-semibold text-gray-900">{r.user?.name ?? 'Admin'}</div>
                                    <div className="text-xs text-gray-500 flex items-center gap-1">
                                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                      </svg>
                                      {formatDate(r.created_at)} • {new Date(r.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                  </div>
                                </div>
                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${statusColor}`}>
                                  {statusLabel}
                                </span>
                              </div>
                              {r.message && (
                                <div className="text-gray-900 leading-relaxed bg-white/60 backdrop-blur-sm rounded-lg p-3 border border-indigo-100">
                                  {r.message}
                                </div>
                              )}
                              {r.assets && r.assets.length > 0 && (
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-3">
                                  {r.assets.map((a: any, idx: number) => (
                                    <div key={idx} className="rounded-lg overflow-hidden border-2 border-indigo-200 bg-white shadow-sm hover:shadow-md cursor-pointer transform transition-all duration-200">
                                      {a.file_type === 'video' ? (
                                        <VideoThumbnail
                                          src={`/storage/${a.file_path}`}
                                          fileType="video"
                                          className="w-full h-32"
                                          onClick={() => setPreviewAsset(a)}
                                          showPlayButton={true}
                                          alt={`Admin response video ${idx + 1}`}
                                          loading="lazy"
                                        />
                                      ) : (
                                        <div className="relative w-full h-32 bg-gray-100">
                                          <img 
                                            src={`/storage/${a.file_path}`} 
                                            className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform duration-200" 
                                            alt={`Admin response image ${idx + 1}`}
                                            loading="lazy"
                                            onClick={() => setPreviewAsset(a)}
                                            onError={(e) => {
                                              e.currentTarget.src = '/images/placeholder-image.png';
                                            }}
                                          />
                                          <div className="absolute top-2 right-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
                                            🖼️ Image
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : null}
                  {((detail.type === 'report' && (!(detail.data as any).responses || (detail.data as any).responses.length === 0)) ||
                   (detail.type === 'feedback' && (!(detail.data as any).responses || (detail.data as any).responses.length === 0))) && (
                    <div className="bg-gradient-to-br from-gray-50 to-white rounded-lg p-8 text-center border-2 border-dashed border-gray-300">
                      <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-3">
                        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                      </div>
                      <p className="text-gray-500 font-medium">Belum ada balasan dari admin</p>
                      <p className="text-gray-400 text-sm mt-1">Kami akan segera merespons pesan Anda</p>
                    </div>
                  )}
                </div>
              </div>
              <div className="px-6 py-4 border-t bg-gray-50 flex justify-end gap-3">
                <AnimatedButton
                  variant="secondary"
                  size="md"
                  animation="scale"
                  onClick={closeDetail}
                  icon={
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  }
                >
                  Tutup
                </AnimatedButton>
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
