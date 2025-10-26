import React from 'react';
import { Head, usePage, router } from '@inertiajs/react';
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
  email?: string | null; // For anonymous users
  reporter_name?: string | null; // For anonymous users
  reporter_phone?: string | null; // For anonymous users
  user_id?: number | null;
  user?: { id: number; name: string; email: string } | null; // For authenticated users
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
  email?: string | null; // For anonymous users
  sender_name?: string | null; // For anonymous users
  sender_phone?: string | null; // For anonymous users
  user_id?: number | null;
  user?: { id: number; name: string; email: string } | null; // For authenticated users
  tower?: { id: number; site_name: string; alamat_menara?: string };
  responses?: Array<{ id: number; feedback_id: number; created_at: string }>;
};

type MyMessagesProps = {
  reports?: ReportItem[];
  feedbacks?: FeedbackItem[];
  showEmailInput?: boolean;
  isAnonymous?: boolean;
  isMyPosts?: boolean; // Flag to indicate if this is the "My Posts" view
};

type MessageItem = {
  id: string;
  type: 'Keluhan' | 'Masukan';
  created_at: string;
  towerName: string;
  category: string;
  status: string | undefined | null;
  responsesCount: number;
  senderName: string; // Display name (from user.name or reporter_name/sender_name)
  senderEmail: string; // Display email (from user.email or email field)
  isAnonymous: boolean; // Whether the sender is anonymous
};

export default function MyMessagesIndex({ 
  reports = [] as ReportItem[], 
  feedbacks = [] as FeedbackItem[],
  showEmailInput = false,
  isAnonymous = false,
  isMyPosts = false
}: MyMessagesProps) {
  const { auth } = usePage().props as any;
  const isStaff = !!(auth?.user && ['admin','operator'].includes(auth.user.role));

  const [email, setEmail] = React.useState('');
  
  // Pagination state
  const [currentPage, setCurrentPage] = React.useState(1);
  const [itemsPerPage, setItemsPerPage] = React.useState(5);
  
  // Filter state
  const [filterType, setFilterType] = React.useState<'all' | 'Keluhan' | 'Masukan'>('all');
  const [filterStatus, setFilterStatus] = React.useState<string>('all');
  const [searchQuery, setSearchQuery] = React.useState('');
  const [filterCategory, setFilterCategory] = React.useState<string>('all');

  React.useEffect(() => {
    if (isStaff) {
      router.visit('/admin');
    }
  }, [isStaff]);

  if (isStaff) return null;

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      router.visit(`/my-messages?email=${encodeURIComponent(email.trim())}`);
    }
  };

  const getStatusColor = (status: string | undefined | null) => {
    const statusConfig = {
      pending: { bg: '#FEF3C7', text: '#92400E', label: 'Menunggu' },
      in_progress: { bg: '#DBEAFE', text: '#1E40AF', label: 'Sedang Diproses' },
      responded: { bg: '#E0E7FF', text: '#3730A3', label: 'Sudah Dibalas' },
      resolved: { bg: '#D1FAE5', text: '#065F46', label: 'Selesai' },
      closed: { bg: '#D1FAE5', text: '#065F46', label: 'Selesai' },
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
  const allItems: MessageItem[] = React.useMemo(() => {
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

  // Extract unique categories for filter
  const uniqueCategories = React.useMemo(() => {
    const categories = allItems.map(item => item.category);
    return Array.from(new Set(categories)).sort();
  }, [allItems]);

  // Apply filters
  const filteredItems = React.useMemo(() => {
    let result = [...allItems];

    // Filter by type
    if (filterType !== 'all') {
      result = result.filter(item => item.type === filterType);
    }

    // Filter by status
    if (filterStatus !== 'all') {
      result = result.filter(item => item.status === filterStatus);
    }

    // Filter by category
    if (filterCategory !== 'all') {
      result = result.filter(item => item.category === filterCategory);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(item => {
        const basicMatch = 
          item.towerName.toLowerCase().includes(query) ||
          item.category.toLowerCase().includes(query) ||
          item.senderName.toLowerCase().includes(query);
        
        // Only search by email on "My Posts" page for privacy
        const emailMatch = isMyPosts ? item.senderEmail.toLowerCase().includes(query) : false;
        
        return basicMatch || emailMatch;
      });
    }

    return result;
  }, [allItems, filterType, filterStatus, filterCategory, searchQuery]);

  // Apply pagination
  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
  const paginatedItems = React.useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredItems.slice(startIndex, endIndex);
  }, [filteredItems, currentPage, itemsPerPage]);

  // Reset to page 1 when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [filterType, filterStatus, filterCategory, searchQuery, itemsPerPage]);
  
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
                  className="w-full h-full object-cover cursor-pointer transition-transform duration-200" 
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

  // Memoize EmailInputForm to prevent unnecessary re-renders
  const EmailInputForm = React.memo(() => {
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setEmail(e.target.value);
    };

    return (
      <div className="bg-gradient-to-br from-teal-50 via-white to-teal-50 rounded-xl shadow-lg border border-teal-100 p-8 text-center">
        <div className="w-20 h-20 bg-gradient-to-br from-teal-500 to-teal-600 rounded-full flex items-center justify-center mx-auto mb-5 shadow-lg">
          <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        <h3 className="text-2xl font-bold text-gray-900 mb-3">Lihat Pesan Anda</h3>
        <p className="text-gray-600 mb-8 max-w-md mx-auto">
          Masukkan email yang Anda gunakan saat mengirim keluhan atau masukan untuk melihat status dan respons dari admin.
        </p>
        
        <form onSubmit={handleEmailSubmit} className="max-w-md mx-auto">
          <div className="mb-6">
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
                value={email}
                onChange={handleInputChange}
                className="mt-1 block w-full pl-10"
                required
                placeholder="contoh@email.com"
                autoComplete="email"
                autoFocus={showEmailInput}
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
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          >
            Lihat Pesan Saya
          </AnimatedButton>
        </form>
      </div>
    );
  });

  // Memoize EmptyState to prevent unnecessary re-renders
  const EmptyState = React.memo(() => (
    <StaggeredContainer delay={200} animationType="scaleIn" duration={500}>
      <div className="bg-gradient-to-br from-gray-50 via-white to-gray-50 rounded-xl shadow-lg border border-gray-200 p-12 text-center">
        <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
          <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </div>
        <h3 className="text-2xl font-bold text-gray-900 mb-3">Belum Ada Pesan</h3>
        <p className="text-gray-600 max-w-md mx-auto text-base">
          {isAnonymous 
            ? 'Belum ada pesan publik yang tersedia saat ini. Pesan akan muncul ketika ada laporan dari masyarakat.' 
            : 'Anda belum mengirimkan laporan apapun. Mulai laporkan keluhan atau berikan masukan Anda.'
          }
        </p>
      </div>
    </StaggeredContainer>
  ));

  // Determine the title based on the view
  const pageTitle = isMyPosts ? "Pesan Saya" : (isAnonymous ? "Pesan Publik" : "Pesan Publik");
  
  return (
    <MainLayout title={pageTitle} currentPage="/my-messages">
      <Head title={pageTitle} />
      
      <div className="p-4 sm:p-6">
        <StaggeredContainer delay={0} animationType="fadeInUp" duration={500}>
          <div className="relative rounded-xl shadow-lg mb-8 px-6 sm:px-8 py-6 overflow-hidden bg-gradient-to-br from-red-50 via-white to-red-50 border border-red-100">
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-red-100/30 to-transparent rounded-full blur-3xl -z-0"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-red-100/20 to-transparent rounded-full blur-2xl -z-0"></div>
            
            <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-gradient-to-br from-red-600 to-red-700 rounded-lg shadow-md">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-red-700 to-red-600 bg-clip-text text-transparent">
                    {pageTitle}
                  </h1>
                </div>
                <p className="text-sm sm:text-base text-gray-700 ml-14">
                  {isMyPosts 
                    ? 'Lihat semua pesan Anda, baik yang publik maupun pribadi'
                    : isAnonymous 
                      ? 'Pantau semua keluhan dan masukan publik dari seluruh masyarakat'
                      : 'Pantau pesan publik dari semua pengguna'
                  }
                </p>
              </div>
              <div className="hidden sm:flex items-center gap-3">
                <div className="text-right">
                  <p className="text-xs text-gray-500 font-medium">Kabupaten</p>
                  <p className="text-sm font-bold text-red-700">Semarang</p>
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

        {/* Show info banner for anonymous users about private message tracking */}
        {isAnonymous && (
          <StaggeredContainer delay={100} animationType="scaleIn" duration={400}>
            <div className="mb-6 p-5 bg-gradient-to-r from-amber-50 to-yellow-50 border-l-4 border-amber-500 rounded-lg shadow-md">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <div className="p-2 bg-amber-500 rounded-lg shadow-sm">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-base font-semibold text-amber-900 mb-2">💡 Informasi Penting</h3>
                  <p className="text-sm text-amber-800 leading-relaxed mb-3">
                    Halaman ini menampilkan semua pesan <span className="font-semibold">publik</span>. Jika Anda ingin melihat pesan <span className="font-semibold">pribadi</span> yang Anda kirim, silakan gunakan fitur tracking pesan pribadi.
                  </p>
                  <AnimatedButton
                    variant="outline"
                    size="sm"
                    animation="scale"
                    onClick={() => router.visit('/my-messages/private')}
                    icon={
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    }
                    className="border-amber-600 text-amber-800 hover:bg-amber-600 hover:text-white"
                  >
                    Lacak Pesan Pribadi
                  </AnimatedButton>
                </div>
              </div>
            </div>
          </StaggeredContainer>
        )}

        {/* Show info banner for authenticated users about public messages */}
        {!isAnonymous && auth?.user && !isMyPosts && (
          <StaggeredContainer delay={100} animationType="scaleIn" duration={400}>
            <div className="mb-6 p-5 bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-500 rounded-lg shadow-md">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <div className="p-2 bg-blue-500 rounded-lg shadow-sm">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-base font-semibold text-blue-900 mb-2">💡 Informasi Penting</h3>
                  <p className="text-sm text-blue-800 leading-relaxed mb-3">
                    Halaman ini menampilkan pesan <span className="font-semibold">publik</span> dari semua pengguna. Anda dapat melihat semua pesan publik yang dikirim oleh masyarakat.
                  </p>
                  <AnimatedButton
                    variant="outline"
                    size="sm"
                    animation="scale"
                    onClick={() => router.visit('/my-messages/my-posts')}
                    icon={
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    }
                    className="border-blue-600 text-blue-800 hover:bg-blue-600 hover:text-white"
                  >
                    Pesan Saya
                  </AnimatedButton>
                </div>
              </div>
            </div>
          </StaggeredContainer>
        )}

        {/* Show info banner for "My Posts" view with back button */}
        {!isAnonymous && auth?.user && isMyPosts && (
          <>
            {/* Back Button */}
            <StaggeredContainer delay={50} animationType="fadeInUp" duration={400}>
              <div className="mb-4">
                <AnimatedButton
                  variant="primary"
                  size="sm"
                  animation="scale"
                  onClick={() => router.visit('/my-messages')}
                  icon={
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                  }
                >
                  Kembali ke Pesan Publik
                </AnimatedButton>
              </div>
            </StaggeredContainer>
            
            <StaggeredContainer delay={100} animationType="scaleIn" duration={400}>
              <div className="mb-6 p-5 bg-gradient-to-r from-green-50 to-emerald-50 border-l-4 border-green-500 rounded-lg shadow-md">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <div className="p-2 bg-green-500 rounded-lg shadow-sm">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-base font-semibold text-green-900 mb-2">💡 Informasi Penting</h3>
                    <p className="text-sm text-green-800 leading-relaxed">
                      Halaman ini menampilkan semua pesan yang Anda kirim, baik yang <span className="font-semibold">publik</span> maupun yang <span className="font-semibold">pribadi</span>. Anda dapat melihat status dan balasan admin untuk semua laporan Anda.
                    </p>
                  </div>
                </div>
              </div>
            </StaggeredContainer>
          </>
        )}

        {/* Show content if there are items */}
        {allItems.length > 0 && (
          <>
            {/* Summary Stats */}
            <StaggeredContainer delay={150} animationType="fadeInUp" duration={400}>
              <div className="mb-6">
                <MessageStats items={allItems} />
              </div>
            </StaggeredContainer>

            {/* Filters and Search */}
            <StaggeredContainer delay={200} animationType="scaleIn" duration={400}>
              <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-5 sm:p-6 mb-6">
                <div className="flex items-center gap-2 mb-5">
                  <div className="p-2 bg-gradient-to-br from-red-500 to-red-600 rounded-lg shadow-sm">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">Filter & Pencarian</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                {/* Search */}
                <div className="sm:col-span-2">
                  <InputLabel htmlFor="search" value="Cari" />
                  <div className="relative mt-1">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                    <TextInput
                      id="search"
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 pr-20 block w-full"
                      placeholder={isMyPosts ? "Cari berdasarkan tower, kategori, nama, atau email..." : "Cari berdasarkan tower, kategori, atau nama..."}
                    />
                    {(searchQuery || filterType !== 'all' || filterStatus !== 'all' || filterCategory !== 'all') && (
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                        <button
                          type="button"
                          onClick={() => {
                            setFilterType('all');
                            setFilterStatus('all');
                            setFilterCategory('all');
                            setSearchQuery('');
                          }}
                          className="text-gray-400 hover:text-gray-600 focus:outline-none"
                          title="Reset semua filter"
                        >
                          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Type Filter */}
                <div>
                  <InputLabel htmlFor="filterType" value="Tipe" />
                  <select
                    id="filterType"
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value as 'all' | 'Keluhan' | 'Masukan')}
                    className="mt-1 block w-full border-gray-300 focus:border-yellow-500 focus:ring-yellow-500 rounded-md shadow-sm"
                  >
                    <option value="all">Semua Tipe</option>
                    <option value="Keluhan">Keluhan</option>
                    <option value="Masukan">Masukan</option>
                  </select>
                </div>

                {/* Status Filter */}
                <div>
                  <InputLabel htmlFor="filterStatus" value="Status" />
                  <select
                    id="filterStatus"
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="mt-1 block w-full border-gray-300 focus:border-yellow-500 focus:ring-yellow-500 rounded-md shadow-sm"
                  >
                    <option value="all">Semua Status</option>
                    <option value="pending">Menunggu</option>
                    <option value="in_progress">Sedang Diproses</option>
                    <option value="responded">Sudah Dibalas</option>
                    <option value="resolved">Selesai</option>
                    <option value="closed">Ditutup</option>
                  </select>
                </div>
              </div>

              {/* Category Filter - Full width on second row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="sm:col-span-2 lg:col-span-1">
                  <InputLabel htmlFor="filterCategory" value="Kategori" />
                  <select
                    id="filterCategory"
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    className="mt-1 block w-full border-gray-300 focus:border-yellow-500 focus:ring-yellow-500 rounded-md shadow-sm"
                  >
                    <option value="all">Semua Kategori</option>
                    {uniqueCategories.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Results count and active filters */}
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  {(filterType !== 'all' || filterStatus !== 'all' || filterCategory !== 'all' || searchQuery) && (
                    <>
                      <span className="text-sm text-gray-600">Filter aktif:</span>
                      {filterType !== 'all' && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          Tipe: {filterType}
                          <button
                            onClick={() => setFilterType('all')}
                            className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full hover:bg-yellow-200"
                          >
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                          </button>
                        </span>
                      )}
                      {filterStatus !== 'all' && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          Status: {getStatusColor(filterStatus).label}
                          <button
                            onClick={() => setFilterStatus('all')}
                            className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full hover:bg-blue-200"
                          >
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                          </button>
                        </span>
                      )}
                      {filterCategory !== 'all' && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                          Kategori: {filterCategory}
                          <button
                            onClick={() => setFilterCategory('all')}
                            className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full hover:bg-purple-200"
                          >
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                          </button>
                        </span>
                      )}
                      {searchQuery && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Pencarian: "{searchQuery}"
                          <button
                            onClick={() => setSearchQuery('')}
                            className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full hover:bg-green-200"
                          >
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                          </button>
                        </span>
                      )}
                    </>
                  )}
                </div>
                <p className="text-sm text-gray-600">
                  Menampilkan <span className="font-medium">{filteredItems.length}</span> dari <span className="font-medium">{allItems.length}</span> pesan
                </p>
              </div>
              </div>
            </StaggeredContainer>

            {/* No results message */}
            {filteredItems.length === 0 && (
              <StaggeredContainer delay={250} animationType="scaleIn" duration={500}>
                <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl shadow-lg border border-gray-200 p-10 text-center">
                  <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-5 shadow-inner">
                    <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Tidak Ada Hasil</h3>
                  <p className="text-gray-600 mb-6 max-w-md mx-auto">
                    Tidak ada pesan yang sesuai dengan filter yang Anda pilih. Coba ubah kriteria pencarian.
                  </p>
                  <AnimatedButton
                    variant="primary"
                    size="md"
                    animation="glow"
                    onClick={() => {
                      setFilterType('all');
                      setFilterStatus('all');
                      setFilterCategory('all');
                      setSearchQuery('');
                    }}
                    icon={
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    }
                  >
                    Reset Semua Filter
                  </AnimatedButton>
                </div>
              </StaggeredContainer>
            )}

            {/* Desktop Table View */}
            {filteredItems.length > 0 && (
              <StaggeredContainer delay={300} animationType="fadeInUp" duration={500}>
                <MessageTable 
                  items={paginatedItems}
                  getStatusColor={getStatusColor}
                  formatDate={formatDate}
                  onOpen={openDetail}
                  hideEmail={!isMyPosts} // Hide email on public pages (not my posts)
                />
              </StaggeredContainer>
            )}

            {/* Mobile/Tablet Card View */}
            {filteredItems.length > 0 && (
              <div className="lg:hidden space-y-3">
                {paginatedItems.map((item, index) => (
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
                      hideEmail={!isMyPosts} // Hide email on public pages (not my posts)
                    />
                  </StaggeredContainer>
                ))}
              </div>
            )}

            {/* Pagination Controls */}
            {filteredItems.length > 0 && (
              <StaggeredContainer delay={350} animationType="fadeInUp" duration={400}>
                <div className="bg-white rounded-xl shadow-md border border-gray-100 p-5 mt-6">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  {/* Items per page */}
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-700">Tampilkan:</span>
                    <select
                      value={itemsPerPage}
                      onChange={(e) => setItemsPerPage(Number(e.target.value))}
                      className="border-gray-300 focus:border-yellow-500 focus:ring-yellow-500 rounded-md shadow-sm text-sm"
                    >
                      <option value={5}>5</option>
                      <option value={10}>10</option>
                      <option value={25}>25</option>
                      <option value={50}>50</option>
                    </select>
                    <span className="text-sm text-gray-700">per halaman</span>
                  </div>

                  {/* Page navigation */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    
                    <div className="flex items-center gap-1">
                      {Array.from({ length: totalPages }, (_, i) => i + 1)
                        .filter(page => {
                          // Show first page, last page, current page, and pages around current
                          if (page === 1 || page === totalPages) return true;
                          if (Math.abs(page - currentPage) <= 1) return true;
                          return false;
                        })
                        .map((page, idx, arr) => {
                          // Add ellipsis when there's a gap
                          const showEllipsisBefore = idx > 0 && page - arr[idx - 1] > 1;
                          
                          return (
                            <React.Fragment key={page}>
                              {showEllipsisBefore && (
                                <span className="px-2 text-gray-500">...</span>
                              )}
                              <button
                                onClick={() => setCurrentPage(page)}
                                className={`px-3 py-2 text-sm font-medium rounded-md ${
                                  currentPage === page
                                    ? 'text-white'
                                    : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                                }`}
                                style={currentPage === page ? { backgroundColor: '#FFD700', color: '#212121' } : {}}
                              >
                                {page}
                              </button>
                            </React.Fragment>
                          );
                        })}
                    </div>

                    <button
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>

                  {/* Page info */}
                  <div className="text-sm text-gray-700">
                    Halaman <span className="font-medium">{currentPage}</span> dari <span className="font-medium">{totalPages}</span>
                  </div>
                  </div>
                </div>
              </StaggeredContainer>
            )}
          </>
        )}

        {/* Show empty state if no items */}
        {allItems.length === 0 && <EmptyState />}

        {detail && (
          <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn" onClick={closeDetail}>
            <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full overflow-hidden transform transition-all duration-300 animate-scaleIn" onClick={(e) => e.stopPropagation()}>
              <div className="px-6 py-5 bg-gradient-to-r from-red-600 to-red-700 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-white">Detail {detail.type === 'report' ? 'Keluhan' : 'Masukan'}</h3>
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
                {/* Sender Information Card */}
                <div className="bg-gradient-to-br from-teal-50 to-cyan-50 rounded-xl p-5 border border-teal-200 shadow-sm">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2.5 bg-gradient-to-br from-teal-500 to-teal-600 rounded-lg shadow-md">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <h4 className="text-base font-bold text-gray-900">Informasi Pengirim</h4>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-white/60 backdrop-blur-sm rounded-lg p-3">
                      <div className="text-xs font-medium text-teal-700 mb-1.5 flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        Nama
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-900">
                          {(detail.data as any).user?.name || (detail.data as any).reporter_name || (detail.data as any).sender_name || 'Anonymous'}
                        </span>
                        {!(detail.data as any).user_id && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 border border-amber-200">
                            Guest
                          </span>
                        )}
                      </div>
                    </div>
                    {isMyPosts && (
                      <div className="bg-white/60 backdrop-blur-sm rounded-lg p-3">
                        <div className="text-xs font-medium text-teal-700 mb-1.5 flex items-center gap-1">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                          Email
                        </div>
                        <div className="font-semibold text-gray-900 truncate">
                          {(detail.data as any).user?.email || (detail.data as any).email || '-'}
                        </div>
                      </div>
                    )}
                    {isMyPosts && ((detail.data as any).reporter_phone || (detail.data as any).sender_phone) && (
                      <div className="bg-white/60 backdrop-blur-sm rounded-lg p-3">
                        <div className="text-xs font-medium text-teal-700 mb-1.5 flex items-center gap-1">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                          </svg>
                          No. Telepon
                        </div>
                        <div className="font-semibold text-gray-900">
                          {(detail.data as any).reporter_phone || (detail.data as any).sender_phone}
                        </div>
                      </div>
                    )}
                    <div className="bg-white/60 backdrop-blur-sm rounded-lg p-3">
                      <div className="text-xs font-medium text-teal-700 mb-1.5 flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Waktu Kirim
                      </div>
                      <div className="font-semibold text-gray-900">
                        {formatDate((detail.data as any).created_at)} • {new Date((detail.data as any).created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                </div>

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
                                            className="w-full h-full object-cover cursor-pointer transition-transform duration-200" 
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
                                            className="w-full h-full object-cover cursor-pointer transition-transform duration-200" 
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
