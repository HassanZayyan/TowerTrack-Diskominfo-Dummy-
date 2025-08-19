import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';

interface Owner {
  id: number;
  name: string;
  alamat: string;
}

interface Tower { 
  id: number; 
  site_name: string; 
  latitude?: number | string | null; 
  longitude?: number | string | null; 
  tinggi_menara?: number | null; 
  alamat_menara?: string | null; 
  site_type?: string | null; 
  status_ijin?: string | null;
  owner?: string | null;
  alamat_owner?: string | null;
  site_id?: string | null;
  site_sap?: string | null;
  tinggi_bangunan?: number | null;
  jumlah_pengguna?: number | null;
  jumlah_kaki?: number | null;
  tower_type?: string | null;
  no_ijin?: string | null;
  tanggal_ijin?: string | null;
  berlaku_hingga?: string | null;
  jenis_ijin?: string | null;
  prs?: string | null;
  prs_id?: string | null;
  id_no_urut?: number | null;
}

interface Pagination<T> { 
  data: T[]; 
  current_page: number; 
  last_page: number; 
  total?: number;
  per_page?: number;
  from?: number;
  to?: number;
}
interface Props { 
  towers: Pagination<Tower>; 
  owners: Owner[];
  statistics: {
    total: number;
    with_permits: number;
    with_coordinates: number;
    without_coordinates: number;
    average_height: number;
  };
}

const TowersPage: React.FC<Props> = ({ towers, owners, statistics }) => {
  const [editing, setEditing] = useState<Record<number, Partial<Tower>>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [currentPerPage] = useState(towers.per_page || 5); // Use server's per_page value or default to 5
  const [activeTab, setActiveTab] = useState<Record<number, string>>({});
  const [editingRow, setEditingRow] = useState<number | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<number, Record<string, string>>>({});

  const updateField = (id: number, key: keyof Tower, value: any) => {
    setEditing(prev => ({ ...prev, [id]: { ...prev[id], [key]: value } }));
    // Clear validation error when user starts typing
    if (validationErrors[id]?.[key]) {
      setValidationErrors(prev => ({
        ...prev,
        [id]: { ...prev[id], [key]: '' }
      }));
    }
  };

  const validateField = (field: keyof Tower, value: any): string => {
    switch (field) {
      case 'site_name':
        return !value || value.trim() === '' ? 'Nama site wajib diisi' : '';
      case 'latitude':
        if (value && (isNaN(value) || value < -90 || value > 90)) {
          return 'Latitude harus antara -90 dan 90';
        }
        return '';
      case 'longitude':
        if (value && (isNaN(value) || value < -180 || value > 180)) {
          return 'Longitude harus antara -180 dan 180';
        }
        return '';
      case 'tinggi_menara':
        if (value && (isNaN(value) || value < 0)) {
          return 'Tinggi menara harus berupa angka positif';
        }
        return '';
      default:
        return '';
    }
  };

  const validateRow = (id: number): boolean => {
    const editData = editing[id] || {};
    const tower = towers.data.find(t => t.id === id);
    if (!tower) return false;

    const errors: Record<string, string> = {};
    let hasErrors = false;

    // Validate required and important fields
    Object.keys(editData).forEach(key => {
      const error = validateField(key as keyof Tower, editData[key as keyof Tower]);
      if (error) {
        errors[key] = error;
        hasErrors = true;
      }
    });

    setValidationErrors(prev => ({ ...prev, [id]: errors }));
    return !hasErrors;
  };

  const save = (id: number) => {
    if (validateRow(id)) {
      router.put(route('admin.towers.update', { tower: id }), editing[id], {
        onSuccess: () => {
          setEditing(prev => ({ ...prev, [id]: {} }));
          setEditingRow(null);
          setValidationErrors(prev => ({ ...prev, [id]: {} }));
        },
        onError: (errors) => {
          // Handle server validation errors
          setValidationErrors(prev => ({ ...prev, [id]: errors }));
        }
      });
    }
  };

  const resetEditing = (id: number) => {
    setEditing(prev => ({ ...prev, [id]: {} }));
    setValidationErrors(prev => ({ ...prev, [id]: {} }));
    setEditingRow(null);
  };

  const startEditing = (id: number) => {
    setEditingRow(id);
    setActiveTab(prev => ({ ...prev, [id]: 'basic' }));
  };

  const getActiveTab = (id: number) => activeTab[id] || 'basic';
  
  const setTowerTab = (id: number, tab: string) => {
    setActiveTab(prev => ({ ...prev, [id]: tab }));
  };

  const getEditValue = (tower: Tower, field: keyof Tower) => {
    return editing[tower.id]?.[field] !== undefined 
      ? editing[tower.id][field] 
      : tower[field];
  };

  const getFieldError = (id: number, field: string) => {
    return validationErrors[id]?.[field] || '';
  };

  const hasChanges = (id: number) => {
    return Object.keys(editing[id] || {}).length > 0;
  };

  const isEditing = (id: number) => editingRow === id;

  const page = towers.current_page;
  const last = towers.last_page;
  const total = towers.total || statistics.total;

  // Handle pagination
  const changePage = (newPage: number) => {
    router.get(route('admin.towers.index'), { 
      page: newPage, 
      per_page: 5, // Always use 5 per page, hardcoded for consistency
      search: searchTerm || undefined,
      filter: filterType !== 'all' ? filterType : undefined
    }, { preserveState: true });
  };

  const handleSearch = () => {
    router.get(route('admin.towers.index'), { 
      page: 1, 
      per_page: currentPerPage,
      search: searchTerm || undefined,
      filter: filterType !== 'all' ? filterType : undefined
    }, { preserveState: true });
  };

  // Use towers.data directly for display since filtering is handled server-side
  const displayedTowers = towers.data;

  // Component for input with validation
  const FormInput: React.FC<{
    tower: Tower;
    field: keyof Tower;
    type?: string;
    placeholder?: string;
    disabled?: boolean;
    options?: { value: string; label: string }[];
    className?: string;
    rows?: number;
  }> = ({ tower, field, type = 'text', placeholder, disabled = false, options, className = '', rows }) => {
    const error = getFieldError(tower.id, field as string);
    const value = getEditValue(tower, field);
    const baseClass = `w-full border rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-colors ${
      error ? 'border-red-500 bg-red-50' : 'border-gray-300'
    } ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''} ${className}`;

    if (options) {
      return (
        <div>
          <select
            className={baseClass}
            value={value || ''}
            onChange={(e) => updateField(tower.id, field, e.target.value)}
            disabled={disabled || !isEditing(tower.id)}
          >
            <option value="">{placeholder || `Pilih ${field}`}</option>
            {options.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
        </div>
      );
    }

    if (rows) {
      return (
        <div>
          <textarea
            className={`${baseClass} resize-none`}
            rows={rows}
            value={value || ''}
            onChange={(e) => updateField(tower.id, field, e.target.value)}
            placeholder={placeholder}
            disabled={disabled || !isEditing(tower.id)}
          />
          {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
        </div>
      );
    }

    return (
      <div>
        <input
          type={type}
          className={baseClass}
          value={value || ''}
          onChange={(e) => updateField(tower.id, field, e.target.value)}
          placeholder={placeholder}
          disabled={disabled || !isEditing(tower.id)}
        />
        {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
      </div>
    );
  };

  return (
    <AdminLayout title="Towers">
      <Head title="Towers" />
      
      {/* Header Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Kelola Data Tower</h1>
        <p className="text-gray-600">Kelola informasi lengkap tower telekomunikasi dan perbarui data sesuai kebutuhan</p>
      </div>

      {/* Statistics and Search */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-lg p-6 shadow-lg border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-800">Total Towers</h3>
              <p className="text-3xl font-bold text-blue-600">{statistics.total}</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-full">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg p-6 shadow-lg border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-800">Dengan Ijin</h3>
              <p className="text-3xl font-bold text-green-600">{statistics.with_permits}</p>
            </div>
            <div className="bg-green-100 p-3 rounded-full">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg p-6 shadow-lg border-l-4 border-yellow-500">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-800">Dengan Koordinat</h3>
              <p className="text-3xl font-bold text-yellow-600">{statistics.with_coordinates}</p>
            </div>
            <div className="bg-yellow-100 p-3 rounded-full">
              <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg p-6 shadow-lg border-l-4 border-red-500">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-800">Tanpa Koordinat</h3>
              <p className="text-3xl font-bold text-red-600">{statistics.without_coordinates}</p>
            </div>
            <div className="bg-red-100 p-3 rounded-full">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
          <div className="flex-1 max-w-md">
            <div className="relative">
              <input
                type="text"
                placeholder="Cari berdasarkan nama site, site ID, atau owner..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
              <svg className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              {searchTerm && (
                <button
                  onClick={() => {
                    setSearchTerm('');
                    router.get(route('admin.towers.index'), { 
                      page: 1, 
                      per_page: currentPerPage 
                    }, { preserveState: true });
                  }}
                  className="absolute right-3 top-2.5 h-5 w-5 text-gray-400 hover:text-gray-600"
                >
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleSearch}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              Cari
            </button>
            <button
              onClick={() => router.get(route('admin.towers.create'))}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Tambah Tower
            </button>
          </div>
        </div>
      </div>

      {/* Main Content - Card-based Layout */}
      <div className="space-y-6">
        {displayedTowers.length === 0 ? (
          <div className="bg-white rounded-lg shadow-lg p-12 text-center">
            <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm || filterType !== 'all' 
                ? 'Tidak ada data tower yang sesuai dengan kriteria pencarian'
                : 'Belum ada data tower'
              }
            </h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || filterType !== 'all' 
                ? 'Coba ubah filter atau kata kunci pencarian'
                : 'Data tower akan muncul di sini setelah ditambahkan'
              }
            </p>
            {searchTerm || filterType !== 'all' ? (
              <button 
                onClick={() => {
                  setSearchTerm('');
                  setFilterType('all');
                  router.get(route('admin.towers.index'), { 
                    page: 1, 
                    per_page: currentPerPage 
                  }, { preserveState: true });
                }}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Reset Pencarian
              </button>
            ) : (
              <button 
                onClick={() => router.get(route('admin.towers.create'))}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Tambah Tower Pertama
              </button>
            )}
          </div>
        ) : (
          displayedTowers.map((tower) => (
            <div key={tower.id} className="bg-white rounded-lg shadow-lg overflow-hidden">
              {/* Card Header */}
              <div className="px-4 sm:px-6 py-4 bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                <div className="flex items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center space-x-3 sm:space-x-4 min-w-0 flex-1">
                    <div className="bg-blue-100 p-2 rounded-lg flex-shrink-0">
                      <svg className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-base sm:text-lg font-semibold text-gray-900 truncate">{tower.site_name}</h3>
                      <p className="text-xs sm:text-sm text-gray-600 truncate">
                        {tower.owner && `Owner: ${tower.owner}`}
                        {tower.site_id && ` • ID: ${tower.site_id}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 flex-shrink-0">
                    {isEditing(tower.id) ? (
                      <>
                        <button
                          onClick={() => save(tower.id)}
                          disabled={!hasChanges(tower.id)}
                          className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                            hasChanges(tower.id)
                              ? 'bg-green-600 text-white hover:bg-green-700'
                              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          }`}
                        >
                          <svg className="w-3 h-3 sm:w-4 sm:h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <span className="hidden sm:inline">Simpan</span>
                          <span className="sm:hidden">Save</span>
                        </button>
                        <button
                          onClick={() => resetEditing(tower.id)}
                          className="px-3 sm:px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-xs sm:text-sm"
                        >
                          <svg className="w-3 h-3 sm:w-4 sm:h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                          <span className="hidden sm:inline">Batal</span>
                          <span className="sm:hidden">×</span>
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => startEditing(tower.id)}
                        className="px-3 sm:px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-xs sm:text-sm flex items-center gap-1 sm:gap-2"
                      >
                        <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Edit
                      </button>
                    )}
                  </div>
                </div>

                {/* Tab Navigation - only show when editing */}
                {isEditing(tower.id) && (
                  <div className="mt-4 border-t pt-4">
                    <nav className="flex flex-wrap gap-2 sm:flex-nowrap sm:space-x-4 sm:gap-0">
                      {[
                        { id: 'basic', label: 'Info Dasar', icon: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
                        { id: 'location', label: 'Lokasi', icon: 'M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z' },
                        { id: 'technical', label: 'Teknis', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z' },
                        { id: 'permits', label: 'Perijinan', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' }
                      ].map((tab) => (
                        <button
                          key={tab.id}
                          onClick={() => setTowerTab(tower.id, tab.id)}
                          className={`flex items-center px-2 sm:px-3 py-2 text-xs sm:text-sm font-medium rounded-lg transition-colors ${
                            getActiveTab(tower.id) === tab.id
                              ? 'bg-blue-100 text-blue-700 border-blue-300'
                              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          <svg className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tab.icon} />
                          </svg>
                          <span className="hidden sm:inline">{tab.label}</span>
                          <span className="sm:hidden">
                            {tab.id === 'basic' && 'Info'}
                            {tab.id === 'location' && 'Lok'}
                            {tab.id === 'technical' && 'Tek'}
                            {tab.id === 'permits' && 'Ijin'}
                          </span>
                        </button>
                      ))}
                    </nav>
                  </div>
                )}
              </div>

              {/* Card Content */}
              <div className="p-4 sm:p-6">
                {isEditing(tower.id) ? (
                  // Edit Mode with Tabs
                  <div>
                    {getActiveTab(tower.id) === 'basic' && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Nama Site <span className="text-red-500">*</span>
                          </label>
                          <FormInput tower={tower} field="site_name" placeholder="Masukkan nama site" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">No Urut</label>
                          <FormInput tower={tower} field="id_no_urut" type="number" placeholder="No urut" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Site ID</label>
                          <FormInput tower={tower} field="site_id" placeholder="Site ID" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Site SAP</label>
                          <FormInput tower={tower} field="site_sap" placeholder="Site SAP" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Owner</label>
                          <FormInput tower={tower} field="owner" options={[
                            ...owners.map(owner => ({ value: owner.name, label: owner.name }))
                          ]} placeholder="Pilih owner" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Alamat Owner</label>
                          <FormInput tower={tower} field="alamat_owner" rows={3} placeholder="Alamat lengkap owner" />
                        </div>
                      </div>
                    )}

                    {getActiveTab(tower.id) === 'location' && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Longitude</label>
                          <FormInput tower={tower} field="longitude" type="number" placeholder="Contoh: 110.4203" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Latitude</label>
                          <FormInput tower={tower} field="latitude" type="number" placeholder="Contoh: -7.7956" />
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-2">Alamat Menara</label>
                          <FormInput tower={tower} field="alamat_menara" rows={3} placeholder="Alamat lengkap lokasi menara" />
                        </div>
                      </div>
                    )}

                    {getActiveTab(tower.id) === 'technical' && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Tinggi Menara (m)</label>
                          <FormInput tower={tower} field="tinggi_menara" type="number" placeholder="Contoh: 42" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Tinggi Bangunan (m)</label>
                          <FormInput tower={tower} field="tinggi_bangunan" type="number" placeholder="Contoh: 15" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Jumlah Pengguna</label>
                          <FormInput tower={tower} field="jumlah_pengguna" type="number" placeholder="Jumlah operator" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Jumlah Kaki</label>
                          <FormInput tower={tower} field="jumlah_kaki" type="number" placeholder="Contoh: 4" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Tower Type</label>
                          <FormInput tower={tower} field="tower_type" placeholder="Contoh: Lattice, Monopole" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">PRS</label>
                          <FormInput tower={tower} field="prs" placeholder="PRS" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">PRS ID</label>
                          <FormInput tower={tower} field="prs_id" placeholder="PRS ID" />
                        </div>
                      </div>
                    )}

                    {getActiveTab(tower.id) === 'permits' && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Nomor Ijin</label>
                          <FormInput tower={tower} field="no_ijin" placeholder="Nomor ijin" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Jenis Ijin</label>
                          <FormInput tower={tower} field="jenis_ijin" options={[
                            { value: 'IMB', label: 'IMB' },
                            { value: 'PBG', label: 'PBG' },
                            { value: 'Lainnya', label: 'Lainnya' }
                          ]} placeholder="Pilih jenis ijin" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Tanggal Ijin</label>
                          <FormInput tower={tower} field="tanggal_ijin" type="date" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Berlaku Hingga</label>
                          <FormInput tower={tower} field="berlaku_hingga" type="date" />
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-2">Status Ijin</label>
                          <FormInput tower={tower} field="status_ijin" options={[
                            { value: 'Aktif', label: 'Aktif' },
                            { value: 'Tidak Aktif', label: 'Tidak Aktif' },
                            { value: 'Pending', label: 'Pending' },
                            { value: 'Expired', label: 'Expired' }
                          ]} placeholder="Pilih status ijin" />
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  // View Mode
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                    <div className="bg-gray-50 p-3 sm:p-4 rounded-lg">
                      <h4 className="text-xs sm:text-sm font-medium text-gray-700 mb-2">Informasi Dasar</h4>
                      <div className="space-y-1 sm:space-y-2 text-xs sm:text-sm">
                        <p><span className="text-gray-600">ID:</span> {tower.site_id || '-'}</p>
                        <p><span className="text-gray-600">SAP:</span> {tower.site_sap || '-'}</p>
                        <p><span className="text-gray-600">Owner:</span> {tower.owner || '-'}</p>
                      </div>
                    </div>
                    <div className="bg-gray-50 p-3 sm:p-4 rounded-lg">
                      <h4 className="text-xs sm:text-sm font-medium text-gray-700 mb-2">Lokasi</h4>
                      <div className="space-y-1 sm:space-y-2 text-xs sm:text-sm">
                        <p><span className="text-gray-600">Koordinat:</span> {tower.latitude && tower.longitude ? `${tower.latitude}, ${tower.longitude}` : '-'}</p>
                        <p><span className="text-gray-600">Alamat:</span> <span className="break-words">{tower.alamat_menara || '-'}</span></p>
                      </div>
                    </div>
                    <div className="bg-gray-50 p-3 sm:p-4 rounded-lg sm:col-span-2 lg:col-span-1">
                      <h4 className="text-xs sm:text-sm font-medium text-gray-700 mb-2">Teknis</h4>
                      <div className="space-y-1 sm:space-y-2 text-xs sm:text-sm">
                        <p><span className="text-gray-600">Tinggi:</span> {tower.tinggi_menara ? `${tower.tinggi_menara}m` : '-'}</p>
                        <p><span className="text-gray-600">Type:</span> {tower.site_type || '-'}</p>
                        <p><span className="text-gray-600">Status:</span> {tower.status_ijin || '-'}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Data Display Controls */}
      <div className="mt-6 bg-white rounded-lg shadow-lg p-4">
        <div className="flex justify-end">
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <span>
                Menampilkan <span className="font-semibold text-gray-800">{towers.from || 1}</span> - <span className="font-semibold text-gray-800">{towers.to || towers.data.length}</span> dari{' '}
                <span className="font-semibold text-gray-800">{total}</span> data
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Simplified Navigation */}
      <div className="mt-4 bg-white rounded-lg shadow-lg p-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-sm text-gray-700">
            <span className="font-medium">Halaman {page} dari {last}</span>
            <span className="text-gray-500 ml-2">• {total} total tower</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              disabled={page <= 1}
              className="px-3 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors flex items-center gap-1 text-sm"
              onClick={() => changePage(page - 1)}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Sebelum
            </button>
            
            {/* Page numbers - Simplified to show sequential numbers */}
            <div className="flex items-center gap-1">
              {/* First page button if not on first few pages */}
              {page > 2 && (
                <>
                  <button
                    onClick={() => changePage(1)}
                    className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                  >
                    1
                  </button>
                  {page > 3 && <span className="text-gray-500">...</span>}
                </>
              )}
              
              {/* Show at most 5 sequential page numbers centered on current page */}
              {Array.from({ length: Math.min(5, last) }, (_, i) => {
                // Calculate start page to ensure we have at most 5 pages centered on current page
                let startPage = Math.max(1, page - 2);
                if (page > last - 2) {
                  startPage = Math.max(1, last - 4);
                }
                if (startPage + 4 > last) {
                  startPage = Math.max(1, last - 4);
                }
                const pageNum = startPage + i;
                
                // Only render if pageNum is valid
                if (pageNum > 0 && pageNum <= last) {
                  return (
                    <button
                      key={pageNum}
                      onClick={() => changePage(pageNum)}
                      className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                        pageNum === page
                          ? 'bg-blue-50 border border-blue-200 text-blue-700 font-medium'
                          : 'border border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                }
                return null;
              })}
              
              {/* Last page button if not on last few pages */}
              {page < last - 1 && (
                <>
                  {page < last - 2 && <span className="text-gray-500">...</span>}
                  <button
                    onClick={() => changePage(last)}
                    className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                  >
                    {last}
                  </button>
                </>
              )}
            </div>
            
            <button
              disabled={page >= last}
              className="px-3 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors flex items-center gap-1 text-sm"
              onClick={() => changePage(page + 1)}
            >
              Berikut
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default TowersPage;


