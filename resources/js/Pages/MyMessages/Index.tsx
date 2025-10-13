import React from 'react';
import { Head, usePage, router } from '@inertiajs/react';
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
  isAnonymous = false
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
      result = result.filter(item => 
        item.towerName.toLowerCase().includes(query) ||
        item.category.toLowerCase().includes(query) ||
        item.senderName.toLowerCase().includes(query) ||
        item.senderEmail.toLowerCase().includes(query)
      );
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

  // Memoize EmailInputForm to prevent unnecessary re-renders
  const EmailInputForm = React.memo(() => {
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setEmail(e.target.value);
    };

    return (
      <div className="bg-white rounded-xl shadow-sm p-6 text-center">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Lihat Pesan Anda</h3>
        <p className="text-gray-600 mb-6">
          Masukkan email yang Anda gunakan saat mengirim keluhan atau masukan untuk melihat status dan respons.
        </p>
        
        <form onSubmit={handleEmailSubmit} className="max-w-md mx-auto">
          <div className="mb-4">
            <InputLabel htmlFor="email" value="Email" />
            <TextInput
              id="email"
              type="email"
              name="email"
              value={email}
              onChange={handleInputChange}
              className="mt-1 block w-full"
              required
              placeholder="Masukkan email Anda"
              autoComplete="email"
              autoFocus={showEmailInput}
            />
          </div>
          
          <PrimaryButton
                      type="submit"
                      className="w-full px-6 py-3 font-semibold rounded-lg transition-all duration-200 hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 justify-center text-lg"
                      style={{ backgroundColor: '#FFD700', color: '#212121' }}
                    >
            <span className="flex items-center justify-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Lihat Pesan
            </span>
          </PrimaryButton>
        </form>
      </div>
    );
  });

  // Memoize EmptyState to prevent unnecessary re-renders
  const EmptyState = React.memo(() => (
    <div className="bg-white rounded-xl shadow-sm p-6 text-center">
      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      </div>
      <p className="text-gray-500 font-medium">Belum ada pesan</p>
      <p className="text-gray-400 text-sm mt-1">
        {isAnonymous 
          ? 'Belum ada pesan publik yang tersedia saat ini' 
          : 'Anda belum mengirimkan laporan apapun'
        }
      </p>
    </div>
  ));

  return (
    <MainLayout title={isAnonymous ? "Pesan Publik" : "Pesan Saya"} currentPage="/my-messages">
      <Head title={isAnonymous ? "Pesan Publik" : "Pesan Saya"} />
      
      <div className="p-4 sm:p-6">
        <div 
          className="rounded-lg shadow mb-8 px-4 sm:px-6 py-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3" 
          style={{ backgroundColor: '#FFF8E1' }}
        >
          <div>
            <h1 className="text-xl sm:text-2xl font-bold mb-1" style={{ color: '#212121' }}>
              {isAnonymous ? 'Pesan Publik' : 'Pesan Saya'}
            </h1>
            <p className="text-sm sm:text-base" style={{ color: '#212121', opacity: 0.85 }}>
              {isAnonymous 
                ? 'Lihat semua keluhan dan masukan publik dari seluruh masyarakat'
                : 'Lihat status penanganan, balasan, atau penutupan laporan Anda'
              }
            </p>
          </div>
          <img 
            src="/images/kab-smg-logo.png" 
            alt="Kabupaten Semarang" 
            className="h-8 w-8 sm:h-10 sm:w-10 hidden xs:block" 
          />
        </div>

        {/* Show info banner for anonymous users about private message tracking */}
        {isAnonymous && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-300 rounded-lg">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="w-5 h-5 text-yellow-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">Informasi Pesan</h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <p>Halaman ini menampilkan semua pesan publik. Jika Anda ingin melihat pesan pribadi yang Anda kirim, silakan gunakan fitur tracking pesan pribadi dengan email dan nomor telepon Anda.</p>
                  <div className="mt-3">
                    <a 
                      href="/my-messages/private" 
                      className="inline-flex items-center px-3 py-2 border border-yellow-400 shadow-sm text-sm leading-4 font-medium rounded-md text-yellow-800 bg-yellow-100 hover:bg-yellow-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Lacak Pesan Pribadi
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Show content if there are items */}
        {allItems.length > 0 && (
          <>
            {/* Summary Stats */}
            <div className="mb-4 sm:mb-6">
              <MessageStats items={allItems} />
            </div>

            {/* Filters and Search */}
            <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 mb-4">
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
                      placeholder="Cari berdasarkan tower, kategori, nama, atau email..."
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

            {/* No results message */}
            {filteredItems.length === 0 && (
              <div className="bg-white rounded-xl shadow-sm p-8 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Tidak ada hasil</h3>
                <p className="text-gray-600 mb-4">
                  Tidak ada pesan yang sesuai dengan filter yang Anda pilih.
                </p>
                <button
                  onClick={() => {
                    setFilterType('all');
                    setFilterStatus('all');
                    setFilterCategory('all');
                    setSearchQuery('');
                  }}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
                  style={{ backgroundColor: '#FFD700', color: '#212121' }}
                >
                  Reset Filter
                </button>
              </div>
            )}

            {/* Desktop Table View */}
            {filteredItems.length > 0 && (
              <div>
                <MessageTable 
                  items={paginatedItems}
                  getStatusColor={getStatusColor}
                  formatDate={formatDate}
                  onOpen={openDetail}
                />
              </div>
            )}

            {/* Mobile/Tablet Card View */}
            {filteredItems.length > 0 && (
              <div className="lg:hidden space-y-3">
                {paginatedItems.map((item) => (
                  <MessageCard
                    key={item.id}
                    item={item}
                    getStatusColor={getStatusColor}
                    formatDate={formatDate}
                    onOpen={openDetail}
                  />
                ))}
              </div>
            )}

            {/* Pagination Controls */}
            {filteredItems.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm p-4 mt-4">
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
            )}
          </>
        )}

        {/* Show empty state if no items */}
        {allItems.length === 0 && (
          <div>
            <EmptyState />
          </div>
        )}

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
                {/* Sender Information */}
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Informasi Pengirim
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <div className="text-xs text-gray-600 mb-1">Nama</div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900">
                          {(detail.data as any).user?.name || (detail.data as any).reporter_name || (detail.data as any).sender_name || 'Anonymous'}
                        </span>
                        {!(detail.data as any).user_id && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-200 text-gray-700">
                            Guest
                          </span>
                        )}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-600 mb-1">Email</div>
                      <div className="font-medium text-gray-900">
                        {(detail.data as any).user?.email || (detail.data as any).email || '-'}
                      </div>
                    </div>
                    {((detail.data as any).reporter_phone || (detail.data as any).sender_phone) && (
                      <div>
                        <div className="text-xs text-gray-600 mb-1">No. Telepon</div>
                        <div className="font-medium text-gray-900">
                          {(detail.data as any).reporter_phone || (detail.data as any).sender_phone}
                        </div>
                      </div>
                    )}
                    <div>
                      <div className="text-xs text-gray-600 mb-1">Waktu Kirim</div>
                      <div className="font-medium text-gray-900">
                        {formatDate((detail.data as any).created_at)} • {new Date((detail.data as any).created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Tower Information */}
                <div>
                  <div className="text-sm text-gray-700 mb-1">Tower</div>
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
                        // Determine status label based on response position and overall status
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
                          {/* Media balasan */}
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
                        // Determine status label based on response position and overall status
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
