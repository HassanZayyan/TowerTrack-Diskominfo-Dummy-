import React from 'react';
import { Head, usePage, router } from '@inertiajs/react';
import MainLayout from '@/Layouts/MainLayout';
import MessageTable from '@/Components/MyMessages/MessageTable';
import MessageCard from '@/Components/MyMessages/MessageCard';
import MessageStats from '@/Components/MyMessages/MessageStats';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import PrimaryButton from '@/Components/PrimaryButton';
import type { ReportItem, FeedbackItem, MessageItem } from '@/types/messages';
import { getStatusColor } from '@/utils/statusHelpers';
import { formatDate } from '@/utils/dateHelpers';
import { useMemoized, useSorted } from '@/Hooks/useMemoized';

// Pagination type for Laravel LengthAwarePaginator
type PaginationData<T> = {
  data: T[];
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
  links: Array<{ url: string | null; label: string; active: boolean }>;
};

type MyMessagesProps = {
  // Support both array (for public messages) and pagination object (for my posts)
  reports?: ReportItem[] | PaginationData<ReportItem>;
  feedbacks?: FeedbackItem[] | PaginationData<FeedbackItem>;
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
  const [email, setEmail] = React.useState('');

  // Pagination state
  const [currentPage, setCurrentPage] = React.useState(1);
  const [itemsPerPage, setItemsPerPage] = React.useState(5);

  // Filter state
  const [filterType, setFilterType] = React.useState<'all' | 'Keluhan' | 'Masukan'>('all');
  const [filterStatus, setFilterStatus] = React.useState<string>('all');
  const [searchQuery, setSearchQuery] = React.useState('');
  const [filterCategory, setFilterCategory] = React.useState<string>('all');
  const [filterVisibility, setFilterVisibility] = React.useState<'all' | 'public' | 'private'>('all');
  const [filterLocationType, setFilterLocationType] = React.useState<'all' | 'Tower' | 'Fiber Optik'>('all');
  const [showAdvancedFilters, setShowAdvancedFilters] = React.useState(false);

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      router.visit(`/my-messages?email=${encodeURIComponent(email.trim())}`);
    }
  };


  // Merge complaints and feedbacks into a single unified list
  const allItems: MessageItem[] = useMemoized(() => {
    // Extract data from pagination object or use array directly
    // Handle both array (public messages) and pagination object (my posts)
    const reportsData = Array.isArray(reports)
      ? reports
      : (reports && 'data' in reports ? reports.data : []);

    const feedbacksData = Array.isArray(feedbacks)
      ? feedbacks
      : (feedbacks && 'data' in feedbacks ? feedbacks.data : []);

    const complaintItems = (reportsData || []).map((r) => {
      // Determine location type from reportable_type
      // Fallback to checking reportable object properties if reportable_type is not available
      let locationType: 'Tower' | 'Fiber Optik' = 'Tower';
      if (r.reportable_type === 'App\\Models\\FoPoint') {
        locationType = 'Fiber Optik';
      } else if (r.reportable_type === 'App\\Models\\Tower') {
        locationType = 'Tower';
      } else if (r.reportable) {
        // Fallback: check if reportable has 'name' (FoPoint) or 'site_name' (Tower)
        locationType = r.reportable.name && !r.reportable.site_name ? 'Fiber Optik' : 'Tower';
      }
      return {
        id: `report-${r.id}`,
        type: 'Keluhan' as const,
        created_at: r.created_at,
        towerName: r.tower?.site_name ?? r.reportable?.site_name ?? r.reportable?.name ?? '-',
        locationType: locationType as 'Tower' | 'Fiber Optik',
        category: (r.category || 'Umum').replace(/\[Dari:\s*[^\]]+\]/gi, '').trim(),
        status: r.status || 'pending',
        responsesCount: r.responses?.length ?? 0,
        commentsCount: r.comments_count ?? 0,
        // Extract sender info - prefer authenticated user info over anonymous info
        senderName: r.user?.name || r.reporter_name || 'Anonymous',
        senderEmail: r.user?.email || r.email || '-',
        isAnonymous: !r.user_id, // Anonymous if no user_id
        isPublic: r.is_public ?? false, // Extract visibility flag
      };
    });

    const feedbackItems = (feedbacksData || []).map((f) => {
      // Determine location type from feedbackable_type
      // Fallback to checking feedbackable object properties if feedbackable_type is not available
      let locationType: 'Tower' | 'Fiber Optik' = 'Tower';
      if (f.feedbackable_type === 'App\\Models\\FoPoint') {
        locationType = 'Fiber Optik';
      } else if (f.feedbackable_type === 'App\\Models\\Tower') {
        locationType = 'Tower';
      } else if (f.feedbackable) {
        // Fallback: check if feedbackable has 'name' (FoPoint) or 'site_name' (Tower)
        locationType = f.feedbackable.name && !f.feedbackable.site_name ? 'Fiber Optik' : 'Tower';
      }
      return {
        id: `feedback-${f.id}`,
        type: 'Masukan' as const,
        created_at: f.created_at,
        towerName: f.tower?.site_name ?? f.feedbackable?.site_name ?? f.feedbackable?.name ?? '-',
        locationType: locationType as 'Tower' | 'Fiber Optik',
        category: (f.category || 'Umum').replace(/\[Dari:\s*[^\]]+\]/gi, '').trim(),
        status: f.status || 'pending',
        responsesCount: f.responses?.length ?? 0,
        commentsCount: f.comments_count ?? 0,
        // Extract sender info - prefer authenticated user info over anonymous info
        senderName: f.user?.name || f.sender_name || 'Anonymous',
        senderEmail: f.user?.email || f.email || '-',
        isAnonymous: !f.user_id, // Anonymous if no user_id
        isPublic: f.is_public ?? false, // Extract visibility flag
      };
    });

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

    // Filter by location type (Tower/Fiber Optik)
    if (filterLocationType !== 'all') {
      result = result.filter(item => item.locationType === filterLocationType);
    }

    // Filter by visibility (only for my posts page)
    if (isMyPosts && filterVisibility !== 'all') {
      if (filterVisibility === 'public') {
        result = result.filter(item => item.isPublic === true);
      } else if (filterVisibility === 'private') {
        result = result.filter(item => item.isPublic === false);
      }
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
  }, [sortedItems, filterType, filterStatus, filterCategory, filterLocationType, filterVisibility, searchQuery, isMyPosts]);

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
  }, [filterType, filterStatus, filterCategory, filterLocationType, filterVisibility, searchQuery, itemsPerPage]);

  // Navigate to detail page for public messages
  const openDetail = React.useCallback((it: MessageItem) => {
    const [typ, raw] = it.id.split('-');
    const id = Number(raw);

    // Add query parameter if coming from my-posts page
    const fromParam = isMyPosts ? '?from=my-posts' : '';

    if (typ === 'report') {
      router.visit(`/my-messages/reports/${id}${fromParam}`);
    } else if (typ === 'feedback') {
      router.visit(`/my-messages/feedbacks/${id}${fromParam}`);
    }
  }, [isMyPosts]);

  const [previewAsset, setPreviewAsset] = React.useState<{ file_path: string; file_type?: string } | null>(null);


  // Memoize EmailInputForm to prevent unnecessary re-renders
  const EmailInputForm = React.memo(() => {
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setEmail(e.target.value);
    };

    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center max-w-2xl mx-auto mt-8">
        <div className="w-16 h-16 bg-teal-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">Lihat Pesan Anda</h3>
        <p className="text-gray-600 mb-6 max-w-md mx-auto">
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

          <PrimaryButton
            type="submit"
            className="w-full justify-center py-3 text-base"
          >
            <span className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Lihat Pesan Saya
            </span>
          </PrimaryButton>
        </form>
      </div>
    );
  });

  // Memoize EmptyState to prevent unnecessary re-renders
  const EmptyState = React.memo(() => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center mt-6">
      <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
        <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      </div>
      <h3 className="text-xl font-bold text-gray-900 mb-2">Belum Ada Pesan</h3>
      <p className="text-gray-600 max-w-md mx-auto">
        {isAnonymous
          ? 'Belum ada pesan publik yang tersedia saat ini. Pesan akan muncul ketika ada laporan dari masyarakat.'
          : 'Anda belum mengirimkan laporan apapun. Mulai laporkan keluhan atau berikan masukan Anda.'
        }
      </p>
    </div>
  ));

  // Determine the title based on the view
  const pageTitle = isMyPosts ? "Pesan Saya" : (isAnonymous ? "Pesan Publik" : "Pesan Publik");

  const headerContent = (
    <div className="bg-red-700 border-b border-red-800 w-full shadow-md relative z-10 overflow-hidden">
      <div className="mx-auto max-w-screen-2xl px-3 sm:px-4 md:px-6 lg:px-8 py-8 sm:py-10 flex flex-col md:flex-row items-center md:items-start justify-between gap-6">
        <div className="flex-1 text-center md:text-left">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-3 drop-shadow-sm">
            {pageTitle}
          </h1>
          <p className="text-lg text-red-100 max-w-2xl leading-relaxed mx-auto md:mx-0">
            {isMyPosts
              ? 'Kelola semua pesan yang telah Anda kirim, baik yang bersifat publik maupun pribadi.'
              : isAnonymous
                ? 'Jelajahi aspirasi dan laporan terkini dari masyarakat Kabupaten Semarang.'
                : 'Pantau pesan publik dari komunitas untuk wawasan yang lebih luas.'
            }
          </p>

          {/* Action Buttons */}
          {!isAnonymous && auth?.user && (
            <div className="mt-6 flex justify-center md:justify-start">
              {isMyPosts ? (
                <button
                  type="button"
                  onClick={() => router.visit('/my-messages')}
                  className="inline-flex items-center px-5 py-2.5 bg-yellow-400 text-red-900 font-bold rounded-lg shadow-lg hover:bg-yellow-300 hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-400"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  Kembali ke Pesan Publik
                </button>
              ) : (
                !['admin', 'operator'].includes(auth.user.role) && (
                  <button
                    type="button"
                    onClick={() => router.visit('/my-messages/my-posts')}
                    className="inline-flex items-center px-5 py-2.5 bg-yellow-400 text-red-900 font-bold rounded-lg shadow-lg hover:bg-yellow-300 hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-400"
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Pesan Saya
                  </button>
                )
              )}
            </div>
          )}
        </div>
        <div className="hidden md:block flex-shrink-0">
          <div className="bg-yellow-400 p-3 rounded-xl shadow-md transform hover:scale-105 transition-transform duration-300">
            <img
              src="/images/kab-smg-logo.png"
              alt="Logo Kabupaten Semarang"
              className="h-20 w-auto object-contain drop-shadow-sm"
            />
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <MainLayout
      title={pageTitle}
      currentPage="/my-messages"
      headerSlot={headerContent}
    >
      <Head title={pageTitle} />

      <div className="animate-fade-in-up">

        {/* Show content if there are items */}
        {allItems.length > 0 && (
          <>
            {/* Summary Stats */}
            <div className="mb-6">
              <MessageStats items={allItems} />
            </div>

            {/* Main Content Area */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              {/* Top Bar: Tabs & Search */}
              <div className="border-b border-gray-100">
                <div className="flex flex-col md:flex-row md:items-center justify-between p-4 md:px-6 gap-4">
                  {/* Type Tabs */}
                  <div className="flex p-1 bg-gray-100 rounded-lg self-start md:self-auto">
                    {(['all', 'Keluhan', 'Masukan'] as const).map((type) => (
                      <button
                        key={type}
                        onClick={() => setFilterType(type)}
                        className={`px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${filterType === type
                          ? 'bg-red-600 text-white shadow-sm'
                          : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'
                          }`}
                      >
                        {type === 'all' ? 'Semua' : type}
                      </button>
                    ))}
                  </div>

                  {/* Search & Filter Toggle */}
                  <div className="flex items-center gap-3 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
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
                        className="pl-10 block w-full border-gray-200 focus:border-red-500 focus:ring-red-500 rounded-lg sm:text-sm"
                        placeholder="Cari pesan..."
                      />
                    </div>

                    <button
                      onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                      className={`relative inline-flex items-center px-4 py-2 border rounded-lg text-sm font-medium transition-colors ${showAdvancedFilters || (filterStatus !== 'all' || filterCategory !== 'all' || filterLocationType !== 'all' || (isMyPosts && filterVisibility !== 'all'))
                        ? 'bg-red-50 border-red-200 text-red-700'
                        : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                        }`}
                    >
                      <svg className="h-5 w-5 mr-2 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                      </svg>
                      Filter
                      {/* Active Filter Count Badge */}
                      {((filterStatus !== 'all' ? 1 : 0) + (filterCategory !== 'all' ? 1 : 0) + (filterLocationType !== 'all' ? 1 : 0) + ((isMyPosts && filterVisibility !== 'all') ? 1 : 0)) > 0 && (
                        <span className="ml-2 inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-700">
                          {(filterStatus !== 'all' ? 1 : 0) + (filterCategory !== 'all' ? 1 : 0) + (filterLocationType !== 'all' ? 1 : 0) + ((isMyPosts && filterVisibility !== 'all') ? 1 : 0)}
                        </span>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Advanced Filters Panel */}
              {showAdvancedFilters && (
                <div className="p-4 md:px-6 md:py-5 border-b border-gray-100 bg-gray-50/50">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Status Filter */}
                    <div>
                      <InputLabel htmlFor="filterStatus" value="Status" className="text-xs uppercase tracking-wider text-gray-500 mb-1" />
                      <select
                        id="filterStatus"
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="block w-full border-gray-200 focus:border-red-500 focus:ring-red-500 rounded-lg sm:text-sm"
                      >
                        <option value="all">Semua Status</option>
                        <option value="pending">Menunggu</option>
                        <option value="in_progress">Sedang Diproses</option>
                        <option value="closed">Selesai</option>
                      </select>
                    </div>

                    {/* Category Filter */}
                    <div>
                      <InputLabel htmlFor="filterCategory" value="Kategori" className="text-xs uppercase tracking-wider text-gray-500 mb-1" />
                      <select
                        id="filterCategory"
                        value={filterCategory}
                        onChange={(e) => setFilterCategory(e.target.value)}
                        className="block w-full border-gray-200 focus:border-red-500 focus:ring-red-500 rounded-lg sm:text-sm"
                      >
                        <option value="all">Semua Kategori</option>
                        {uniqueCategories.map((cat) => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>

                    {/* Location Type Filter */}
                    <div>
                      <InputLabel htmlFor="filterLocationType" value="Lokasi" className="text-xs uppercase tracking-wider text-gray-500 mb-1" />
                      <select
                        id="filterLocationType"
                        value={filterLocationType}
                        onChange={(e) => setFilterLocationType(e.target.value as 'all' | 'Tower' | 'Fiber Optik')}
                        className="block w-full border-gray-200 focus:border-red-500 focus:ring-red-500 rounded-lg sm:text-sm"
                      >
                        <option value="all">Semua Lokasi</option>
                        <option value="Tower">Tower</option>
                        <option value="Fiber Optik">Fiber Optik</option>
                      </select>
                    </div>

                    {/* Visibility Filter (Only My Posts) */}
                    {isMyPosts && (
                      <div>
                        <InputLabel htmlFor="filterVisibility" value="Visibilitas" className="text-xs uppercase tracking-wider text-gray-500 mb-1" />
                        <select
                          id="filterVisibility"
                          value={filterVisibility}
                          onChange={(e) => setFilterVisibility(e.target.value as 'all' | 'public' | 'private')}
                          className="block w-full border-gray-200 focus:border-red-500 focus:ring-red-500 rounded-lg sm:text-sm"
                        >
                          <option value="all">Semua Visibilitas</option>
                          <option value="public">Publik</option>
                          <option value="private">Privat</option>
                        </select>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 flex justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        setFilterStatus('all');
                        setFilterCategory('all');
                        setFilterLocationType('all');
                        setFilterVisibility('all');
                      }}
                      className="text-xs text-red-600 hover:text-red-800 font-medium flex items-center"
                    >
                      <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      Reset Filter Tambahan
                    </button>
                  </div>
                </div>
              )}

              {/* Status Bar / Results Info */}
              <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                <p className="text-sm text-gray-600">
                  Menampilkan <span className="font-bold text-gray-900">{filteredItems.length}</span> dari <span className="font-semibold">{allItems.length}</span> pesan
                </p>

                {/* Mobile View Toggle or Sort could go here if needed */}
              </div>

              {/* Content Area */}
              <div className="p-0">
                {/* No results message */}
                {filteredItems.length === 0 && (
                  <div className="p-12 text-center">
                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">Tidak ada pesan ditemukan</h3>
                    <p className="text-gray-500 max-w-sm mx-auto mb-6">
                      Coba ubah kata kunci pencarian atau sesuaikan filter Anda.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setFilterType('all');
                        setFilterStatus('all');
                        setFilterCategory('all');
                        setFilterLocationType('all');
                        setFilterVisibility('all');
                        setSearchQuery('');
                      }}
                      className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                    >
                      Reset Semua Filter
                    </button>
                  </div>
                )}

                {/* Desktop Table View */}
                {filteredItems.length > 0 && (
                  <MessageTable
                    items={paginatedItems}
                    getStatusColor={getStatusColor}
                    formatDate={formatDate}
                    onOpen={openDetail}
                    hideEmail={!isMyPosts}
                  />
                )}

                {/* Mobile/Tablet Card View - Visible only on smaller screens if you strictly follow responsive patterns, 
                    but MessageTable usually hides on mobile. 
                    Let's ensure these two don't double render if MessageTable handles hidden-lg logic internally
                    MessageTable has `hidden lg:block`
                    So we need the cards to be `lg:hidden`
                */}
                {filteredItems.length > 0 && (
                  <div className="lg:hidden divide-y divide-gray-100 bg-gray-50 p-4 space-y-4">
                    {paginatedItems.map((item) => (
                      <MessageCard
                        key={item.id}
                        item={item}
                        getStatusColor={getStatusColor}
                        formatDate={formatDate}
                        onOpen={openDetail}
                        hideEmail={!isMyPosts}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Pagination Controls */}
            {filteredItems.length > 0 && (
              <div className="mt-4 sm:mt-6">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">Baris per halaman:</span>
                    <select
                      value={itemsPerPage}
                      onChange={(e) => setItemsPerPage(Number(e.target.value))}
                      className="border-gray-200 focus:border-red-500 focus:ring-red-500 rounded-lg text-sm"
                    >
                      <option value={5}>5</option>
                      <option value={10}>10</option>
                      <option value={20}>20</option>
                      <option value={50}>50</option>
                    </select>
                  </div>
                </div>

                {/* Page navigation */}
                <div className="flex items-center gap-2 mt-4">
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
                              className={`px-3 py-2 text-sm font-medium rounded-md ${currentPage === page
                                ? 'text-white bg-red-600'
                                : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                                }`}
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
