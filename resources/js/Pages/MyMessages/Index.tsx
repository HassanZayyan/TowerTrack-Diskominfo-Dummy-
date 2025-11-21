import React from 'react';
import { Head, usePage, router } from '@inertiajs/react';
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
import { useMemoized, useFiltered, useSorted } from '@/Hooks/useMemoized';

type MyMessagesProps = {
  reports?: ReportItem[];
  feedbacks?: FeedbackItem[];
  showEmailInput?: boolean;
  isAnonymous?: boolean;
  isMyPosts?: boolean; // Flag to indicate if this is the "My Posts" view
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


  // Merge complaints and feedbacks into a single unified list
  const allItems: MessageItem[] = useMemoized(() => {
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

    return [...complaintItems, ...feedbackItems];
  }, [reports, feedbacks]);

  // Sort items by date (newest first)
  const sortedItems = useSorted(allItems, (a, b) => 
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  // Extract unique categories for filter
  const uniqueCategories = useMemoized(() => {
    const categories = sortedItems.map(item => item.category);
    return Array.from(new Set(categories)).sort();
  }, [sortedItems]);

  // Apply filters
  const filteredItems = useMemoized(() => {
    let result = [...sortedItems];

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
  }, [sortedItems, filterType, filterStatus, filterCategory, searchQuery, isMyPosts]);

  // Apply pagination
  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
  const paginatedItems = useMemoized(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredItems.slice(startIndex, endIndex);
  }, [filteredItems, currentPage, itemsPerPage]);

  // Reset to page 1 when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [filterType, filterStatus, filterCategory, searchQuery, itemsPerPage]);
  
  // Navigate to detail page for public messages
  const openDetail = React.useCallback((it: MessageItem) => {
    const [typ, raw] = it.id.split('-');
    const id = Number(raw);
    if (typ === 'report') {
      router.visit(`/my-messages/reports/${id}`);
    } else if (typ === 'feedback') {
      router.visit(`/my-messages/feedbacks/${id}`);
    }
  }, []);
  
  const [previewAsset, setPreviewAsset] = React.useState<{ file_path: string; file_type?: string } | null>(null);


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
                    <option value="resolved">Selesai</option>
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
