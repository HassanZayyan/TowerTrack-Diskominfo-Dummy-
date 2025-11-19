import React, { useState, useCallback } from 'react';
import { Head, router, Link, usePage } from '@inertiajs/react';
import MainLayout from '@/Layouts/MainLayout';
import MessageTable from '@/Components/MyMessages/MessageTable';
import MessageCard from '@/Components/MyMessages/MessageCard';
import MessageStats from '@/Components/MyMessages/MessageStats';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import PrimaryButton from '@/Components/PrimaryButton';
import AnimatedButton from '@/Components/AnimatedButton';
import StaggeredContainer from '@/Components/StaggeredContainer';
import type { ReportItem, FeedbackItem, MessageItem } from '@/types/messages';
import { getStatusColor } from '@/utils/statusHelpers';
import { formatDate } from '@/utils/dateHelpers';
import { useGuestFormData } from '@/Hooks/useGuestData';
import { useGuestAutoRedirect } from '@/Hooks/useGuestAutoRedirect';

type PrivateTrackingProps = {
  reports?: ReportItem[];
  feedbacks?: FeedbackItem[];
  email?: string | null;
  phone?: string | null;
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
  <StaggeredContainer delay={200} animationType="scaleIn" duration={500}>
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
  email = null,
  phone = null
}: PrivateTrackingProps) {
  const { auth } = usePage().props as any;
  const isAuthenticated = !!auth?.user;
  
  // Auto-fill from cookie if no query params provided
  const guestFormData = useGuestFormData({ email: email || undefined, phone: phone || undefined });
  const [inputEmail, setInputEmail] = useState(guestFormData.email);
  const [inputPhone, setInputPhone] = useState(guestFormData.phone);

  // Auto-redirect with query params from cookie if cookie exists and no query params
  useGuestAutoRedirect({
    email,
    phone,
    isAuthenticated,
    currentPath: '/my-messages/private',
  });

  const handleFormSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (inputEmail.trim() && inputPhone.trim()) {
      router.visit(`/my-messages/private?email=${encodeURIComponent(inputEmail.trim())}&phone=${encodeURIComponent(inputPhone.trim())}`);
    }
  }, [inputEmail, inputPhone]);

  // Use utility functions for status and date formatting
  const getStatusColorCallback = useCallback(getStatusColor, []);
  const formatDateCallback = useCallback(formatDate, []);

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
      commentsCount: r.comments_count ?? 0,
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
      commentsCount: f.comments_count ?? 0,
      // Extract sender info - prefer authenticated user info over anonymous info
      senderName: f.user?.name || f.sender_name || 'Anonymous',
      senderEmail: f.user?.email || f.email || '-',
      isAnonymous: !f.user_id, // Anonymous if no user_id
    }));

    return [...complaintItems, ...feedbackItems].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [reports, feedbacks]);
  
  // Open detail page for private messages
  const openDetail = useCallback((it: MessageItem) => {
    const [typ, raw] = it.id.split('-');
    const id = Number(raw);
    const queryParams = email && phone 
      ? `?email=${encodeURIComponent(email)}&phone=${encodeURIComponent(phone)}`
      : '';
    
    if (typ === 'report') {
      router.visit(`/my-messages/private/reports/${id}${queryParams}`);
    } else if (typ === 'feedback') {
      router.visit(`/my-messages/private/feedbacks/${id}${queryParams}`);
    }
  }, [email, phone]);

  const [previewAsset, setPreviewAsset] = React.useState<{ file_path: string; file_type?: string } | null>(null);

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
                    getStatusColor={getStatusColorCallback}
                    formatDate={formatDateCallback}
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
                        getStatusColor={getStatusColorCallback}
                        formatDate={formatDateCallback}
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
