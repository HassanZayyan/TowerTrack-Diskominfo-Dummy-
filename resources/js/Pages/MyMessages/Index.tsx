import React from 'react';
import { Head, usePage, router } from '@inertiajs/react';
import MainLayout from '@/Layouts/MainLayout';
import MessageTable from '@/Components/MyMessages/MessageTable';
import MessageCard from '@/Components/MyMessages/MessageCard';
import MessageStats from '@/Components/MyMessages/MessageStats';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import { Button } from '@/Components/ui/button';
import { Badge } from '@/Components/ui/badge';
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
      <div className="mx-auto mt-8 max-w-2xl rounded-lg border border-border bg-card p-8 text-center shadow-xs">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary-soft">
          <svg className="h-8 w-8 text-primary-strong" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        <h3 className="mb-2 text-xl font-semibold tracking-tight text-foreground">Lihat Pesan Anda</h3>
        <p className="mx-auto mb-6 max-w-md text-muted-foreground">
          Masukkan email yang Anda gunakan saat mengirim keluhan atau masukan untuk melihat status dan respons dari admin.
        </p>

        <form onSubmit={handleEmailSubmit} className="max-w-md mx-auto">
          <div className="mb-6">
            <InputLabel htmlFor="email" value="Alamat Email" className="text-left mb-2" />
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <svg className="h-5 w-5 text-placeholder" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

          <Button type="submit" size="lg" className="w-full">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Lihat Pesan Saya
          </Button>
        </form>
      </div>
    );
  });

  // Memoize EmptyState to prevent unnecessary re-renders
  const EmptyState = React.memo(() => (
    <div className="mt-6 rounded-lg border border-border bg-card p-12 text-center shadow-xs">
      <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-muted">
        <svg className="h-10 w-10 text-placeholder" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      </div>
      <h3 className="mb-2 text-xl font-semibold tracking-tight text-foreground">Belum Ada Pesan</h3>
      <p className="mx-auto max-w-md text-muted-foreground">
        {isAnonymous
          ? 'Belum ada pesan publik yang tersedia saat ini. Pesan akan muncul ketika ada laporan dari masyarakat.'
          : 'Anda belum mengirimkan laporan apapun. Mulai laporkan keluhan atau berikan masukan Anda.'
        }
      </p>
    </div>
  ));

  // Determine the title based on the view
  const pageTitle = isMyPosts ? "Pesan Saya" : (isAnonymous ? "Pesan Publik" : "Pesan Publik");

  /**
   * Page band. Was a saturated #B71C1C bar with gold buttons — brand chrome from
   * the old identity, not a status. It is typographic now, in the same register
   * as HeroSection: a hairline rule instead of a coloured block, and the two
   * navigation buttons carried by the Button primitive rather than a gold pill
   * that lifted on hover.
   */
  const headerContent = (
    <div className="relative z-10 w-full border-b border-border bg-card">
      <div className="mx-auto flex max-w-screen-2xl flex-col items-center justify-between gap-6 px-3 py-8 sm:px-4 sm:py-10 md:flex-row md:items-start md:px-6 lg:px-8">
        <div className="flex-1 text-center md:text-left">
          <h1 className="mb-3 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            {pageTitle}
          </h1>
          <p className="mx-auto max-w-2xl text-lg leading-relaxed text-muted-foreground md:mx-0">
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
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.visit('/my-messages')}
                >
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  Kembali ke Pesan Publik
                </Button>
              ) : (
                !['admin', 'operator'].includes(auth.user.role) && (
                  <Button
                    type="button"
                    onClick={() => router.visit('/my-messages/my-posts')}
                  >
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Pesan Saya
                  </Button>
                )
              )}
            </div>
          )}
        </div>
        <div className="hidden flex-shrink-0 md:block">
          <div className="rounded-lg border border-border bg-muted p-3">
            <img
              src="/images/kab-smg-logo.webp"
              alt="Logo Kabupaten Semarang"
              className="h-20 w-auto object-contain"
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
            <div className="overflow-hidden rounded-lg border border-border bg-card shadow-xs">
              {/* Top Bar: Tabs & Search */}
              <div className="border-b border-border">
                <div className="flex flex-col justify-between gap-4 p-4 md:flex-row md:items-center md:px-6">
                  {/* Type Tabs */}
                  <div className="flex self-start rounded-lg bg-muted p-1 md:self-auto">
                    {(['all', 'Keluhan', 'Masukan'] as const).map((type) => (
                      <button
                        key={type}
                        onClick={() => setFilterType(type)}
                        className={`rounded-md px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring focus-visible:ring-offset-2 ${filterType === type
                          ? 'bg-primary text-primary-foreground shadow-xs'
                          : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                          }`}
                      >
                        {type === 'all' ? 'Semua' : type}
                      </button>
                    ))}
                  </div>

                  {/* Search & Filter Toggle */}
                  <div className="flex items-center gap-3 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                        <svg className="h-5 w-5 text-placeholder" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                      </div>
                      <TextInput
                        id="search"
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="block w-full pl-10 sm:text-sm"
                        placeholder="Cari pesan..."
                      />
                    </div>

                    <button
                      onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                      className={`relative inline-flex items-center rounded-md border px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring focus-visible:ring-offset-2 ${showAdvancedFilters || (filterStatus !== 'all' || filterCategory !== 'all' || filterLocationType !== 'all' || (isMyPosts && filterVisibility !== 'all'))
                        ? 'border-primary-border bg-primary-soft text-primary-strong'
                        : 'border-input bg-background text-foreground hover:bg-accent hover:text-accent-foreground'
                        }`}
                    >
                      <svg className="mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                      </svg>
                      Filter
                      {/* Active Filter Count Badge */}
                      {((filterStatus !== 'all' ? 1 : 0) + (filterCategory !== 'all' ? 1 : 0) + (filterLocationType !== 'all' ? 1 : 0) + ((isMyPosts && filterVisibility !== 'all') ? 1 : 0)) > 0 && (
                        <Badge className="ml-2 tabular-nums">
                          {(filterStatus !== 'all' ? 1 : 0) + (filterCategory !== 'all' ? 1 : 0) + (filterLocationType !== 'all' ? 1 : 0) + ((isMyPosts && filterVisibility !== 'all') ? 1 : 0)}
                        </Badge>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Advanced Filters Panel */}
              {showAdvancedFilters && (
                <div className="border-b border-border bg-muted/50 p-4 md:px-6 md:py-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Status Filter */}
                    <div>
                      <InputLabel htmlFor="filterStatus" value="Status" className="mb-1 text-xs font-medium text-muted-foreground" />
                      <select
                        id="filterStatus"
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="block w-full rounded-md border-input bg-background text-foreground shadow-xs transition-colors focus:border-ring focus:ring focus:ring-offset-0 sm:text-sm"
                      >
                        <option value="all">Semua Status</option>
                        <option value="pending">Menunggu</option>
                        <option value="in_progress">Sedang Diproses</option>
                        <option value="closed">Selesai</option>
                      </select>
                    </div>

                    {/* Category Filter */}
                    <div>
                      <InputLabel htmlFor="filterCategory" value="Kategori" className="mb-1 text-xs font-medium text-muted-foreground" />
                      <select
                        id="filterCategory"
                        value={filterCategory}
                        onChange={(e) => setFilterCategory(e.target.value)}
                        className="block w-full rounded-md border-input bg-background text-foreground shadow-xs transition-colors focus:border-ring focus:ring focus:ring-offset-0 sm:text-sm"
                      >
                        <option value="all">Semua Kategori</option>
                        {uniqueCategories.map((cat) => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>

                    {/* Location Type Filter */}
                    <div>
                      <InputLabel htmlFor="filterLocationType" value="Lokasi" className="mb-1 text-xs font-medium text-muted-foreground" />
                      <select
                        id="filterLocationType"
                        value={filterLocationType}
                        onChange={(e) => setFilterLocationType(e.target.value as 'all' | 'Tower' | 'Fiber Optik')}
                        className="block w-full rounded-md border-input bg-background text-foreground shadow-xs transition-colors focus:border-ring focus:ring focus:ring-offset-0 sm:text-sm"
                      >
                        <option value="all">Semua Lokasi</option>
                        <option value="Tower">Menara</option>
                        <option value="Fiber Optik">Fiber Optik</option>
                      </select>
                    </div>

                    {/* Visibility Filter (Only My Posts) */}
                    {isMyPosts && (
                      <div>
                        <InputLabel htmlFor="filterVisibility" value="Visibilitas" className="mb-1 text-xs font-medium text-muted-foreground" />
                        <select
                          id="filterVisibility"
                          value={filterVisibility}
                          onChange={(e) => setFilterVisibility(e.target.value as 'all' | 'public' | 'private')}
                          className="block w-full rounded-md border-input bg-background text-foreground shadow-xs transition-colors focus:border-ring focus:ring focus:ring-offset-0 sm:text-sm"
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
                      className="flex items-center text-xs font-medium text-primary transition-colors hover:text-primary-hover hover:underline"
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
              <div className="flex items-center justify-between border-b border-border bg-muted px-4 py-3">
                <p className="text-sm text-muted-foreground">
                  Menampilkan <span className="font-semibold text-foreground">{filteredItems.length}</span> dari <span className="font-semibold">{allItems.length}</span> pesan
                </p>

                {/* Mobile View Toggle or Sort could go here if needed */}
              </div>

              {/* Content Area */}
              <div className="p-0">
                {/* No results message */}
                {filteredItems.length === 0 && (
                  <div className="p-12 text-center">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                      <svg className="h-8 w-8 text-placeholder" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <h3 className="mb-2 text-lg font-semibold text-foreground">Tidak ada pesan ditemukan</h3>
                    <p className="mx-auto mb-6 max-w-sm text-muted-foreground">
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
                      className="inline-flex items-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground shadow-xs transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring focus-visible:ring-offset-2"
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
                  <div className="space-y-4 divide-y divide-border bg-muted p-4 lg:hidden">
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
                <div className="flex flex-col items-center justify-between gap-4 rounded-lg border border-border bg-card p-4 shadow-xs sm:flex-row">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Baris per halaman:</span>
                    <select
                      value={itemsPerPage}
                      onChange={(e) => setItemsPerPage(Number(e.target.value))}
                      className="rounded-md border-input bg-background text-sm text-foreground shadow-xs transition-colors focus:border-ring focus:ring focus:ring-offset-0"
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
                    className="rounded-md border border-input bg-background px-3 py-2 text-sm font-medium text-foreground shadow-xs transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
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
                              <span className="px-2 text-muted-foreground">...</span>
                            )}
                            <button
                              onClick={() => setCurrentPage(page)}
                              className={`rounded-md px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring focus-visible:ring-offset-2 ${currentPage === page
                                ? 'bg-primary text-primary-foreground'
                                : 'border border-input bg-background text-foreground shadow-xs hover:bg-accent hover:text-accent-foreground'
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
                    className="rounded-md border border-input bg-background px-3 py-2 text-sm font-medium text-foreground shadow-xs transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>

                {/* Page info */}
                <div className="mt-4 text-sm text-muted-foreground">
                  Halaman <span className="font-medium text-foreground">{currentPage}</span> dari <span className="font-medium text-foreground">{totalPages}</span>
                </div>
              </div>
            )}
          </>
        )}

        {/* Show empty state if no items */}
        {allItems.length === 0 && <EmptyState />}

        {/* Asset Preview Modal */}
        {previewAsset && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/90" onClick={() => setPreviewAsset(null)}>
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
                  alt="Lampiran gambar pada pesan ini, tampilan penuh"
                  className="max-w-full max-h-[90vh] object-contain"
                  onClick={(e) => e.stopPropagation()}
                />
              )}
              <button
                className="absolute right-4 top-4 rounded-full bg-ink-950/60 p-2 text-white transition-colors hover:bg-ink-950/80 focus-visible:outline-none focus-visible:ring focus-visible:ring-offset-2"
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
