import React, { useState, useCallback } from 'react';
import { Head, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import HeroSection from '@/Components/HeroSection';
import FilterPanel from '@/Components/Admin/FilterPanel';

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
  owner_id?: string | null;
  owner_name?: string | null;
  owner_alamat?: string | null;
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
  allTowers: Array<{
    id: number;
    site_name: string;
    alamat_menara?: string;
    latitude: number | string;
    longitude: number | string;
    tinggi_menara?: number;
    tinggi_bangunan?: number;
    jumlah_pengguna?: number;
    tower_type?: string;
    site_type?: string | null;
    owner?: string;
    status?: string;
  }>;
}

// FormInput component moved outside to prevent re-creation
const FormInput: React.FC<{
  value: string | number | null | undefined;
  onChange: (value: string) => void;
  error?: string;
  type?: string;
  placeholder?: string;
  disabled?: boolean;
  options?: { value: string; label: string }[];
  className?: string;
  rows?: number;
}> = ({ value, onChange, error, type = 'text', placeholder, disabled = false, options, className = '', rows }) => {
  const baseClass = `w-full border rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-colors ${
    error ? 'border-red-500 bg-red-50' : 'border-gray-300'
  } ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''} ${className}`;

  if (options) {
    return (
      <div>
        <select
          className={baseClass}
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
        >
          <option value="">{placeholder || 'Pilih'}</option>
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
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
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
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
      />
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
};

// Constants for better maintainability
interface OptionType {
  value: string;
  label: string;
}

const SITE_TYPE_OPTIONS: OptionType[] = [
  { value: 'GF', label: 'GF' },
  { value: 'IBS', label: 'IBS' },
  { value: 'RT', label: 'RT' }
];

const PERMIT_TYPE_OPTIONS: OptionType[] = [
  { value: 'IMB', label: 'IMB' },
  { value: 'PBG', label: 'PBG' },
  { value: 'Lainnya', label: 'Lainnya' }
];

const PERMIT_STATUS_OPTIONS: OptionType[] = [
  { value: 'Aktif', label: 'Aktif' },
  { value: 'Tidak Aktif', label: 'Tidak Aktif' },
  { value: 'Pending', label: 'Pending' },
  { value: 'Expired', label: 'Expired' }
];

const TowersPage: React.FC<Props> = ({ towers, owners, statistics, allTowers }) => {
  const [editing, setEditing] = useState<Record<number, Partial<Tower>>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPerPage] = useState(towers.per_page || 5); // Use server's per_page value or default to 5
  const [activeTab, setActiveTab] = useState<Record<number, string>>({});
  const [editingRow, setEditingRow] = useState<number | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<number, Record<string, string>>>({});
  const [selectedOwners, setSelectedOwners] = useState<Record<number, { id: string; name: string; alamat: string }>>({});
  
  // Advanced Filter State
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    owner: 'all',
    tower_type: 'all',
    site_type: 'all',
    status_ijin: 'all',
    has_coordinates: 'all', // all, yes, no
    has_permits: 'all', // all, yes, no
    height_range: {
      min: '',
      max: ''
    },
    location_search: '', // For map-based location filtering
    selected_tower_id: null as number | null
  });

  const updateField = useCallback((id: number, key: keyof Tower, value: any) => {
    setEditing(prev => ({ ...prev, [id]: { ...prev[id], [key]: value } }));
    
    // Handle owner selection
    if (key === 'owner_id') {
      if (value === 'new') {
        // Set up for new owner creation
        setSelectedOwners(prev => ({
          ...prev,
          [id]: { id: 'new', name: '', alamat: '' }
        }));
        setEditing(prev => ({ 
          ...prev, 
          [id]: { 
            ...prev[id], 
            owner_id: 'new',
            owner_name: '',
            owner_alamat: ''
          } 
        }));
      } else if (value === '') {
        // Clear owner selection
        setSelectedOwners(prev => {
          const newState = { ...prev };
          delete newState[id];
          return newState;
        });
        setEditing(prev => ({ 
          ...prev, 
          [id]: { 
            ...prev[id], 
            owner_id: '',
            owner_name: '',
            owner_alamat: ''
          } 
        }));
      } else {
        // Select existing owner
        const selectedOwner = owners.find(owner => owner.id.toString() === value);
        if (selectedOwner) {
          setSelectedOwners(prev => ({
            ...prev,
            [id]: { id: selectedOwner.id.toString(), name: selectedOwner.name, alamat: selectedOwner.alamat }
          }));
          setEditing(prev => ({ 
            ...prev, 
            [id]: { 
              ...prev[id], 
              owner_id: selectedOwner.id.toString(),
              owner_name: selectedOwner.name,
              owner_alamat: selectedOwner.alamat
            } 
          }));
        }
      }
    }
    
    // Clear validation error when user starts typing
    if (validationErrors[id]?.[key]) {
      setValidationErrors(prev => ({
        ...prev,
        [id]: { ...prev[id], [key]: '' }
      }));
    }
  }, [validationErrors, owners]);

  const validateField = (field: keyof Tower, value: any): string => {
    switch (field) {
      case 'site_name':
        if (!value || value.trim() === '') {
          return 'Nama site wajib diisi';
        }
        return '';
      case 'alamat_menara':
        if (!value || value.trim() === '') {
          return 'Alamat menara wajib diisi';
        }
        return '';
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
      case 'site_type':
        if (value && !SITE_TYPE_OPTIONS.map(opt => opt.value).includes(value)) {
          return 'Site type harus salah satu dari: GF, IBS, atau RT';
        }
        return '';
      case 'prs_id':
        if (value && value.toString().trim() === '') {
          return 'PRS ID tidak boleh kosong jika diisi';
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

    // Validate site_name (always required)
    const siteNameError = validateField('site_name', editData.site_name || tower.site_name);
    if (siteNameError) {
      errors.site_name = siteNameError;
      hasErrors = true;
    }

    // Validate alamat_menara (only required if tower doesn't already have one)
    const currentAlamatMenara = editData.alamat_menara !== undefined ? editData.alamat_menara : tower.alamat_menara;
    const hasExistingAddress = tower.alamat_menara && tower.alamat_menara.trim() !== '';
    
    if (!hasExistingAddress && (!currentAlamatMenara || currentAlamatMenara.trim() === '')) {
      errors.alamat_menara = 'Alamat menara wajib diisi';
      hasErrors = true;
    }

    // Validate site_type if provided
    if (editData.site_type !== undefined && editData.site_type !== '') {
      const siteTypeError = validateField('site_type', editData.site_type);
      if (siteTypeError) {
        errors.site_type = siteTypeError;
        hasErrors = true;
      }
    }

    // Validate other fields
    Object.keys(editData).forEach(key => {
      if (key !== 'site_name' && key !== 'alamat_menara' && key !== 'owner_name' && key !== 'owner_alamat' && key !== 'owner_id' && key !== 'site_type') {
        const error = validateField(key as keyof Tower, editData[key as keyof Tower]);
        if (error) {
          errors[key] = error;
          hasErrors = true;
        }
      }
    });

    setValidationErrors(prev => ({ ...prev, [id]: errors }));
    return !hasErrors;
  };

  const save = (id: number) => {
    if (validateRow(id)) {
      const editData = { ...editing[id] };
      
      // Ensure owner data is properly included
      const selectedOwner = selectedOwners[id];
      if (selectedOwner) {
        if (selectedOwner.id === 'new') {
          editData.owner_id = 'new';
          editData.owner_name = editData.owner_name || '';
          editData.owner_alamat = editData.owner_alamat || '';
        } else {
          editData.owner_id = selectedOwner.id.toString();
          editData.owner_name = selectedOwner.name;
          editData.owner_alamat = selectedOwner.alamat;
        }
      }
      
      router.put(route('admin.towers.update', { tower: id }), editData, {
        onSuccess: () => {
          setEditing(prev => ({ ...prev, [id]: {} }));
          setSelectedOwners(prev => {
            const newState = { ...prev };
            delete newState[id];
            return newState;
          });
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
    setSelectedOwners(prev => {
      const newState = { ...prev };
      delete newState[id];
      return newState;
    });
    setEditingRow(null);
  };

  const startEditing = (id: number) => {
    setEditingRow(id);
    setActiveTab(prev => ({ ...prev, [id]: 'basic' }));
    
    // Initialize owner data if tower has an owner
    const tower = towers.data.find(t => t.id === id);
    if (tower && tower.owner_id) {
      const existingOwner = owners.find(owner => owner.id.toString() === tower.owner_id);
      if (existingOwner) {
        setSelectedOwners(prev => ({
          ...prev,
          [id]: { id: existingOwner.id.toString(), name: existingOwner.name, alamat: existingOwner.alamat }
        }));
      }
    }
  };

  const getActiveTab = (id: number) => activeTab[id] || 'basic';
  
  const setTowerTab = (id: number, tab: string) => {
    setActiveTab(prev => ({ ...prev, [id]: tab }));
  };

  // Helper function to format date for HTML date input (YYYY-MM-DD)
  const formatDateForInput = (dateValue: string | null | undefined): string => {
    if (!dateValue) return '';
    
    try {
      // Handle various date formats from backend
      const date = new Date(dateValue);
      if (isNaN(date.getTime())) return '';
      
      // Format to YYYY-MM-DD for HTML date input
      return date.toISOString().split('T')[0];
    } catch (error) {
      console.warn('Error formatting date:', dateValue, error);
      return '';
    }
  };

  const getEditValue = (tower: Tower, field: keyof Tower) => {
    const value = editing[tower.id]?.[field] !== undefined 
      ? editing[tower.id][field] 
      : tower[field];
    
    // Special handling for date fields
    if (field === 'tanggal_ijin' || field === 'berlaku_hingga') {
      return formatDateForInput(value as string);
    }
    
    return value;
  };

  const getFieldError = (id: number, field: string) => {
    return validationErrors[id]?.[field] || '';
  };

  // Helper function to get display value for dropdown fields
  const getDisplayValue = (value: any, options: OptionType[]) => {
    if (!value) return '';
    const option = options.find(opt => opt.value === value);
    return option ? option.label : value;
  };

  // Helper function to check if a field has a valid value
  const hasValidValue = (value: any): boolean => {
    return value !== null && value !== undefined && value !== '';
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
    const params = buildFilterParams({ page: newPage, per_page: 5 });
    router.get(route('admin.towers.index'), params, { preserveState: true });
  };

  const handleSearch = () => {
    const params = buildFilterParams({ page: 1 });
    router.get(route('admin.towers.index'), params, { preserveState: true });
  };

  // Filter helper functions
  const buildFilterParams = (overrides: any = {}) => {
    const params: any = {
      page: overrides.page || 1,
      per_page: currentPerPage,
      search: searchTerm || undefined,
      ...overrides
    };

    // Add advanced filters
    if (filters.owner !== 'all') params.owner = filters.owner;
    if (filters.tower_type !== 'all') params.tower_type = filters.tower_type;
    if (filters.site_type !== 'all') params.site_type = filters.site_type;
    if (filters.status_ijin !== 'all') params.status_ijin = filters.status_ijin;
    if (filters.has_coordinates !== 'all') params.has_coordinates = filters.has_coordinates;
    if (filters.has_permits !== 'all') params.has_permits = filters.has_permits;
    if (filters.height_range.min) params.height_min = filters.height_range.min;
    if (filters.height_range.max) params.height_max = filters.height_range.max;
    if (filters.selected_tower_id) params.tower_id = filters.selected_tower_id;

    // Remove undefined values
    Object.keys(params).forEach(key => {
      if (params[key] === undefined) delete params[key];
    });

    return params;
  };

  const updateFilter = (key: string, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const updateHeightRange = (type: 'min' | 'max', value: string) => {
    setFilters(prev => ({
      ...prev,
      height_range: {
        ...prev.height_range,
        [type]: value
      }
    }));
  };

  const clearAllFilters = () => {
    setFilters({
      owner: 'all',
      tower_type: 'all',
      site_type: 'all',
      status_ijin: 'all',
      has_coordinates: 'all',
      has_permits: 'all',
      height_range: { min: '', max: '' },
      location_search: '',
      selected_tower_id: null
    });
    setSearchTerm('');
    
    router.get(route('admin.towers.index'), { 
      page: 1, 
      per_page: currentPerPage 
    }, { preserveState: true });
  };

  const applyFilters = () => {
    const params = buildFilterParams({ page: 1 });
    router.get(route('admin.towers.index'), params, { preserveState: true });
  };

  const hasActiveFilters = () => {
    return filters.owner !== 'all' ||
           filters.tower_type !== 'all' ||
           filters.site_type !== 'all' ||
           filters.status_ijin !== 'all' ||
           filters.has_coordinates !== 'all' ||
           filters.has_permits !== 'all' ||
           filters.height_range.min !== '' ||
           filters.height_range.max !== '' ||
           filters.selected_tower_id !== null ||
           searchTerm !== '';
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.owner !== 'all') count++;
    if (filters.tower_type !== 'all') count++;
    if (filters.site_type !== 'all') count++;
    if (filters.status_ijin !== 'all') count++;
    if (filters.has_coordinates !== 'all') count++;
    if (filters.has_permits !== 'all') count++;
    if (filters.height_range.min !== '' || filters.height_range.max !== '') count++;
    if (filters.selected_tower_id !== null) count++;
    if (searchTerm !== '') count++;
    return count;
  };

  // Handle tower selection from map
  const handleTowerSelect = (tower: Tower) => {
    setFilters(prev => ({
      ...prev,
      selected_tower_id: tower.id,
      location_search: tower.site_name
    }));
  };

  const clearTowerSelection = () => {
    setFilters(prev => ({
      ...prev,
      selected_tower_id: null,
      location_search: ''
    }));
  };

  // Use towers.data directly for display since filtering is handled server-side
  const displayedTowers = towers.data;

  return (
    <AdminLayout title="Towers">
      <Head title="Towers" />
      
      {/* Hero Section */}
      <div className="mb-8">
        <HeroSection
          title="Kelola Data Tower"
          subtitle="Kelola informasi lengkap tower telekomunikasi dan perbarui data sesuai kebutuhan"
          variant="brand"
          align="left"
          actions={
            <>
              <div className="bg-white rounded-lg shadow-md p-1">
                <button
                  onClick={() => router.get(route('admin.towers.create'))}
                  className="inline-flex items-center px-4 py-2 bg-red-800 text-white rounded-lg hover:bg-red-900 transition-colors shadow-sm"
                >
                  Tambah Tower
                </button>
              </div>
            </>
          }
        />
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
      <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6 mb-6 sm:mb-8">
        <div className="space-y-4">
          {/* Search Input */}
          <div className="w-full">
            <div className="relative">
              <input
                type="text"
                placeholder="Cari nama site, site ID, atau owner..."
                className="w-full pl-10 pr-10 py-2.5 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent text-sm sm:text-base"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
              <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-gray-400 hover:text-gray-600"
                >
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex flex-col xs:flex-row gap-2 sm:gap-3">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex-1 xs:flex-none px-3 sm:px-4 py-2.5 sm:py-2 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm sm:text-base ${
                showFilters || hasActiveFilters()
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              <span>Filter</span>
              {hasActiveFilters() && (
                <span className="bg-red-500 text-white text-xs rounded-full px-2 py-0.5 ml-1">
                  {getActiveFilterCount()}
                </span>
              )}
            </button>
            <button
              onClick={handleSearch}
              className="flex-1 xs:flex-none px-3 sm:px-4 py-2.5 sm:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 text-sm sm:text-base"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <span>Cari</span>
            </button>
            <button
              onClick={() => router.get(route('admin.towers.create'))}
              className="flex-1 xs:flex-none px-3 sm:px-4 py-2.5 sm:py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2 text-sm sm:text-base"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <span className="hidden xs:inline">Tambah Tower</span>
              <span className="xs:hidden">Tambah</span>
            </button>
          </div>
        </div>
        
        {/* Filter Panel */}
        {showFilters && (
          <FilterPanel
            filters={filters}
            owners={owners}
            towers={allTowers}
            onFilterChange={updateFilter}
            onHeightRangeChange={updateHeightRange}
            onTowerSelect={handleTowerSelect}
            onClearTowerSelection={clearTowerSelection}
            onApplyFilters={applyFilters}
            onClearAllFilters={clearAllFilters}
            hasActiveFilters={hasActiveFilters()}
          />
        )}
      </div>

      {/* Results Summary and Active Filters */}
      {(searchTerm || hasActiveFilters() || displayedTowers.length > 0) && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            {/* Results Count */}
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <span>
                Menampilkan <strong>{towers.from || 0}-{towers.to || 0}</strong> dari <strong>{towers.total || 0}</strong> tower
                {(searchTerm || hasActiveFilters()) && (
                  <span className="text-blue-600 ml-1">(hasil pencarian/filter)</span>
                )}
              </span>
            </div>
            
            {/* Active Filters Tags */}
            {hasActiveFilters() && (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs text-gray-500 font-medium">Filter aktif:</span>
                
                {searchTerm && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    Pencarian: "{searchTerm}"
                    <button
                      onClick={() => {
                        setSearchTerm('');
                        handleSearch();
                      }}
                      className="ml-1 hover:bg-blue-200 rounded-full p-0.5"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </span>
                )}
                
                {filters.owner !== 'all' && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                    Owner: {filters.owner}
                    <button
                      onClick={() => {
                        updateFilter('owner', 'all');
                        applyFilters();
                      }}
                      className="ml-1 hover:bg-green-200 rounded-full p-0.5"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </span>
                )}
                
                {filters.tower_type !== 'all' && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
                    Jenis: {filters.tower_type}
                    <button
                      onClick={() => {
                        updateFilter('tower_type', 'all');
                        applyFilters();
                      }}
                      className="ml-1 hover:bg-purple-200 rounded-full p-0.5"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </span>
                )}
                
                {filters.site_type !== 'all' && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                    Site: {filters.site_type}
                    <button
                      onClick={() => {
                        updateFilter('site_type', 'all');
                        applyFilters();
                      }}
                      className="ml-1 hover:bg-yellow-200 rounded-full p-0.5"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </span>
                )}
                
                {filters.status_ijin !== 'all' && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">
                    Ijin: {filters.status_ijin}
                    <button
                      onClick={() => {
                        updateFilter('status_ijin', 'all');
                        applyFilters();
                      }}
                      className="ml-1 hover:bg-red-200 rounded-full p-0.5"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </span>
                )}
                
                {filters.has_coordinates !== 'all' && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-indigo-100 text-indigo-800 text-xs rounded-full">
                    Koordinat: {filters.has_coordinates === 'yes' ? 'Ada' : 'Tidak Ada'}
                    <button
                      onClick={() => {
                        updateFilter('has_coordinates', 'all');
                        applyFilters();
                      }}
                      className="ml-1 hover:bg-indigo-200 rounded-full p-0.5"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </span>
                )}
                
                {filters.has_permits !== 'all' && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-pink-100 text-pink-800 text-xs rounded-full">
                    Ijin: {filters.has_permits === 'yes' ? 'Ada' : 'Tidak Ada'}
                    <button
                      onClick={() => {
                        updateFilter('has_permits', 'all');
                        applyFilters();
                      }}
                      className="ml-1 hover:bg-pink-200 rounded-full p-0.5"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </span>
                )}
                
                {(filters.height_range.min || filters.height_range.max) && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full">
                    Tinggi: {filters.height_range.min || '0'}m - {filters.height_range.max || '∞'}m
                    <button
                      onClick={() => {
                        updateHeightRange('min', '');
                        updateHeightRange('max', '');
                        applyFilters();
                      }}
                      className="ml-1 hover:bg-orange-200 rounded-full p-0.5"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </span>
                )}
                
                {filters.selected_tower_id && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-teal-100 text-teal-800 text-xs rounded-full">
                    Tower: {filters.location_search}
                    <button
                      onClick={() => {
                        clearTowerSelection();
                        applyFilters();
                      }}
                      className="ml-1 hover:bg-teal-200 rounded-full p-0.5"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </span>
                )}
                
                <button
                  onClick={clearAllFilters}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full hover:bg-gray-200 transition-colors"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Reset Semua
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main Content - Card-based Layout */}
      <div className="space-y-4 sm:space-y-6">
        {displayedTowers.length === 0 ? (
          <div className="bg-white rounded-lg shadow-lg p-6 sm:p-12 text-center">
            <svg className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">
              {searchTerm || hasActiveFilters() 
                ? 'Tidak ada data tower yang sesuai dengan kriteria pencarian'
                : 'Belum ada data tower'
              }
            </h3>
            <p className="text-sm sm:text-base text-gray-600 mb-4">
              {searchTerm || hasActiveFilters() 
                ? 'Coba ubah filter atau kata kunci pencarian'
                : 'Data tower akan muncul di sini setelah ditambahkan'
              }
            </p>
            {searchTerm || hasActiveFilters() ? (
              <button 
                onClick={() => {
                  setSearchTerm('');
                  clearAllFilters();
                }}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm sm:text-base"
              >
                Reset Pencarian
              </button>
            ) : (
              <button 
                onClick={() => router.get(route('admin.towers.create'))}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm sm:text-base"
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
                    <div className="overflow-x-auto">
                      <nav className="flex space-x-2 min-w-max pb-2">
                        {[
                          { id: 'basic', label: 'Info Dasar', icon: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
                          { id: 'location', label: 'Lokasi', icon: 'M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z' },
                          { id: 'technical', label: 'Teknis', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z' },
                          { id: 'permits', label: 'Perijinan', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' }
                        ].map((tab) => (
                          <button
                            key={tab.id}
                            onClick={() => setTowerTab(tower.id, tab.id)}
                            className={`flex items-center px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${
                              getActiveTab(tower.id) === tab.id
                                ? 'bg-blue-100 text-blue-700 border border-blue-300'
                                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100 border border-transparent'
                            }`}
                          >
                            <svg className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tab.icon} />
                            </svg>
                            <span className="hidden xs:inline">{tab.label}</span>
                            <span className="xs:hidden">
                              {tab.id === 'basic' && 'Info'}
                              {tab.id === 'location' && 'Lok'}
                              {tab.id === 'technical' && 'Tek'}
                              {tab.id === 'permits' && 'Ijin'}
                            </span>
                          </button>
                        ))}
                      </nav>
                    </div>
                  </div>
                )}
              </div>

              {/* Card Content */}
              <div className="p-4 sm:p-6">
                {isEditing(tower.id) ? (
                  // Edit Mode with Tabs
                  <div>
                    {getActiveTab(tower.id) === 'basic' && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Nama Site
                          </label>
                          <FormInput 
                            value={getEditValue(tower, 'site_name')}
                            onChange={(value) => updateField(tower.id, 'site_name', value)}
                            error={getFieldError(tower.id, 'site_name')}
                            placeholder="Masukkan nama site"
                            disabled={!isEditing(tower.id)}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">No Urut</label>
                          <FormInput 
                            value={getEditValue(tower, 'id_no_urut')}
                            onChange={(value) => updateField(tower.id, 'id_no_urut', value)}
                            error={getFieldError(tower.id, 'id_no_urut')}
                            type="number"
                            placeholder="No urut"
                            disabled={!isEditing(tower.id)}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Site ID</label>
                          <FormInput 
                            value={getEditValue(tower, 'site_id')}
                            onChange={(value) => updateField(tower.id, 'site_id', value)}
                            error={getFieldError(tower.id, 'site_id')}
                            placeholder="Site ID"
                            disabled={!isEditing(tower.id)}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Site SAP</label>
                          <FormInput 
                            value={getEditValue(tower, 'site_sap')}
                            onChange={(value) => updateField(tower.id, 'site_sap', value)}
                            error={getFieldError(tower.id, 'site_sap')}
                            placeholder="Site SAP"
                            disabled={!isEditing(tower.id)}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Owner</label>
                          <FormInput 
                            value={selectedOwners[tower.id]?.id?.toString() || getEditValue(tower, 'owner_id')?.toString() || ''}
                            onChange={(value) => updateField(tower.id, 'owner_id', value)}
                            error={getFieldError(tower.id, 'owner_id')}
                            options={[
                              { value: '', label: 'Pilih Owner' },
                              ...owners.map(owner => ({ value: owner.id.toString(), label: owner.name })),
                              { value: 'new', label: '+ Tambah Owner Baru' }
                            ]}
                            placeholder="Pilih owner"
                            disabled={!isEditing(tower.id)}
                          />
                        </div>
                        {selectedOwners[tower.id]?.id === 'new' && (
                          <>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">Nama Owner Baru</label>
                              <FormInput 
                                value={getEditValue(tower, 'owner_name') || ''}
                                onChange={(value) => updateField(tower.id, 'owner_name', value)}
                                error={getFieldError(tower.id, 'owner_name')}
                                placeholder="Masukkan nama owner baru"
                                disabled={!isEditing(tower.id)}
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">Alamat Owner Baru</label>
                              <FormInput 
                                value={getEditValue(tower, 'owner_alamat') || ''}
                                onChange={(value) => updateField(tower.id, 'owner_alamat', value)}
                                error={getFieldError(tower.id, 'owner_alamat')}
                                rows={3}
                                placeholder="Alamat lengkap owner baru"
                                disabled={!isEditing(tower.id)}
                              />
                            </div>
                          </>
                        )}
                        {selectedOwners[tower.id] && selectedOwners[tower.id].id !== 'new' && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Alamat Owner</label>
                            <div className="p-3 bg-gray-50 rounded-lg text-sm text-gray-700">
                              {selectedOwners[tower.id].alamat || 'Alamat tidak tersedia'}
                            </div>
                          </div>
                        )}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Site Type <span className="text-gray-500">(Opsional)</span>
                          </label>
                          <FormInput 
                            value={getEditValue(tower, 'site_type')}
                            onChange={(value) => updateField(tower.id, 'site_type', value)}
                            error={getFieldError(tower.id, 'site_type')}
                            options={SITE_TYPE_OPTIONS}
                            placeholder="Pilih site type"
                            disabled={!isEditing(tower.id)}
                          />
                          <div className="text-xs text-gray-500 mt-1 space-y-1">
                            <p><span className="font-medium">GF:</span> Ground Floor - Menara di lantai dasar</p>
                            <p><span className="font-medium">IBS:</span> Integrated Building System - Sistem bangunan terintegrasi</p>
                            <p><span className="font-medium">RT:</span> Rooftop - Menara di atas bangunan</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {getActiveTab(tower.id) === 'location' && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Longitude</label>
                          <FormInput 
                            value={getEditValue(tower, 'longitude')}
                            onChange={(value) => updateField(tower.id, 'longitude', value)}
                            error={getFieldError(tower.id, 'longitude')}
                            type="number"
                            placeholder="Contoh: 110.4203"
                            disabled={!isEditing(tower.id)}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Latitude</label>
                          <FormInput 
                            value={getEditValue(tower, 'latitude')}
                            onChange={(value) => updateField(tower.id, 'latitude', value)}
                            error={getFieldError(tower.id, 'latitude')}
                            type="number"
                            placeholder="Contoh: -7.7956"
                            disabled={!isEditing(tower.id)}
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Alamat Menara <span className="text-red-500">*</span>
                          </label>
                          <FormInput 
                            value={getEditValue(tower, 'alamat_menara')}
                            onChange={(value) => updateField(tower.id, 'alamat_menara', value)}
                            error={getFieldError(tower.id, 'alamat_menara')}
                            rows={3}
                            placeholder="Alamat lengkap lokasi menara"
                            disabled={!isEditing(tower.id)}
                          />
                        </div>
                      </div>
                    )}

                    {getActiveTab(tower.id) === 'technical' && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Tinggi Menara (m)</label>
                          <FormInput 
                            value={getEditValue(tower, 'tinggi_menara')}
                            onChange={(value) => updateField(tower.id, 'tinggi_menara', value)}
                            error={getFieldError(tower.id, 'tinggi_menara')}
                            type="number"
                            placeholder="Contoh: 42"
                            disabled={!isEditing(tower.id)}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Tinggi Bangunan (m)</label>
                          <FormInput 
                            value={getEditValue(tower, 'tinggi_bangunan')}
                            onChange={(value) => updateField(tower.id, 'tinggi_bangunan', value)}
                            error={getFieldError(tower.id, 'tinggi_bangunan')}
                            type="number"
                            placeholder="Contoh: 15"
                            disabled={!isEditing(tower.id)}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Jumlah Pengguna</label>
                          <FormInput 
                            value={getEditValue(tower, 'jumlah_pengguna')}
                            onChange={(value) => updateField(tower.id, 'jumlah_pengguna', value)}
                            error={getFieldError(tower.id, 'jumlah_pengguna')}
                            type="number"
                            placeholder="Jumlah operator"
                            disabled={!isEditing(tower.id)}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Jumlah Kaki</label>
                          <FormInput 
                            value={getEditValue(tower, 'jumlah_kaki')}
                            onChange={(value) => updateField(tower.id, 'jumlah_kaki', value)}
                            error={getFieldError(tower.id, 'jumlah_kaki')}
                            type="number"
                            placeholder="Contoh: 4"
                            disabled={!isEditing(tower.id)}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Tower Type</label>
                          <FormInput 
                            value={getEditValue(tower, 'tower_type')}
                            onChange={(value) => updateField(tower.id, 'tower_type', value)}
                            error={getFieldError(tower.id, 'tower_type')}
                            placeholder="Contoh: Lattice, Monopole"
                            disabled={!isEditing(tower.id)}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">PRS</label>
                          <FormInput 
                            value={getEditValue(tower, 'prs')}
                            onChange={(value) => updateField(tower.id, 'prs', value)}
                            error={getFieldError(tower.id, 'prs')}
                            placeholder="PRS"
                            disabled={!isEditing(tower.id)}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">PRS ID</label>
                          <FormInput 
                            value={getEditValue(tower, 'prs_id')}
                            onChange={(value) => updateField(tower.id, 'prs_id', value)}
                            error={getFieldError(tower.id, 'prs_id')}
                            placeholder="PRS ID"
                            disabled={!isEditing(tower.id)}
                          />
                        </div>
                      </div>
                    )}

                    {getActiveTab(tower.id) === 'permits' && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Nomor Ijin</label>
                          <FormInput 
                            value={getEditValue(tower, 'no_ijin')}
                            onChange={(value) => updateField(tower.id, 'no_ijin', value)}
                            error={getFieldError(tower.id, 'no_ijin')}
                            placeholder="Nomor ijin"
                            disabled={!isEditing(tower.id)}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Jenis Ijin</label>
                          <FormInput 
                            value={getEditValue(tower, 'jenis_ijin')}
                            onChange={(value) => updateField(tower.id, 'jenis_ijin', value)}
                            error={getFieldError(tower.id, 'jenis_ijin')}
                            options={PERMIT_TYPE_OPTIONS}
                            placeholder="Pilih jenis ijin"
                            disabled={!isEditing(tower.id)}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Tanggal Ijin</label>
                          <FormInput 
                            value={getEditValue(tower, 'tanggal_ijin')}
                            onChange={(value) => updateField(tower.id, 'tanggal_ijin', value)}
                            error={getFieldError(tower.id, 'tanggal_ijin')}
                            type="date"
                            disabled={!isEditing(tower.id)}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Berlaku Hingga</label>
                          <FormInput 
                            value={getEditValue(tower, 'berlaku_hingga')}
                            onChange={(value) => updateField(tower.id, 'berlaku_hingga', value)}
                            error={getFieldError(tower.id, 'berlaku_hingga')}
                            type="date"
                            disabled={!isEditing(tower.id)}
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-2">Status Ijin</label>
                          <FormInput 
                            value={getEditValue(tower, 'status_ijin')}
                            onChange={(value) => updateField(tower.id, 'status_ijin', value)}
                            error={getFieldError(tower.id, 'status_ijin')}
                            options={PERMIT_STATUS_OPTIONS}
                            placeholder="Pilih status ijin"
                            disabled={!isEditing(tower.id)}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  // View Mode
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
                    <div className="bg-gray-50 p-3 sm:p-4 rounded-lg">
                      <h4 className="text-sm font-medium text-gray-700 mb-2 sm:mb-3">Informasi Dasar</h4>
                      <div className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
                        <p><span className="text-gray-600 font-medium">ID:</span> <span className="ml-1">{tower.site_id || '-'}</span></p>
                        <p><span className="text-gray-600 font-medium">SAP:</span> <span className="ml-1">{tower.site_sap || '-'}</span></p>
                        <p><span className="text-gray-600 font-medium">Owner:</span> <span className="ml-1 break-words">{tower.owner || '-'}</span></p>
                      </div>
                    </div>
                    <div className="bg-gray-50 p-3 sm:p-4 rounded-lg">
                      <h4 className="text-sm font-medium text-gray-700 mb-2 sm:mb-3">Lokasi</h4>
                      <div className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
                        <p><span className="text-gray-600 font-medium">Koordinat:</span> <span className="ml-1 break-all">{tower.latitude && tower.longitude ? `${tower.latitude}, ${tower.longitude}` : '-'}</span></p>
                        <p><span className="text-gray-600 font-medium">Alamat:</span> <span className="ml-1 break-words">{tower.alamat_menara || '-'}</span></p>
                      </div>
                    </div>
                    <div className="bg-gray-50 p-3 sm:p-4 rounded-lg">
                      <h4 className="text-sm font-medium text-gray-700 mb-2 sm:mb-3">Teknis</h4>
                      <div className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
                        <p><span className="text-gray-600 font-medium">Tinggi Menara:</span> <span className="ml-1">{tower.tinggi_menara ? `${tower.tinggi_menara}m` : '-'}</span></p>
                        <p><span className="text-gray-600 font-medium">Tinggi Bangunan:</span> <span className="ml-1">{tower.tinggi_bangunan ? `${tower.tinggi_bangunan}m` : '-'}</span></p>
                        <div className="flex flex-col space-y-1">
                          <span className="text-gray-600 font-medium">Tower Type:</span>
                          {hasValidValue(tower.tower_type) ? (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800 w-fit">
                              {tower.tower_type}
                            </span>
                          ) : (
                            <span className="ml-1">-</span>
                          )}
                        </div>
                        <div className="flex flex-col space-y-1">
                          <span className="text-gray-600 font-medium">Site Type:</span>
                          {hasValidValue(tower.site_type) ? (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 w-fit">
                              {getDisplayValue(tower.site_type, SITE_TYPE_OPTIONS)}
                            </span>
                          ) : (
                            <span className="ml-1">-</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="bg-gray-50 p-3 sm:p-4 rounded-lg">
                      <h4 className="text-sm font-medium text-gray-700 mb-2 sm:mb-3">Perijinan & PRS</h4>
                      <div className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
                        <div className="flex flex-col space-y-1">
                          <span className="text-gray-600 font-medium">Status Ijin:</span>
                          {hasValidValue(tower.status_ijin) ? (
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium w-fit ${
                              tower.status_ijin === 'Aktif' ? 'bg-green-100 text-green-800' :
                              tower.status_ijin === 'Tidak Aktif' ? 'bg-red-100 text-red-800' :
                              tower.status_ijin === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                              tower.status_ijin === 'Expired' ? 'bg-orange-100 text-orange-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {getDisplayValue(tower.status_ijin, PERMIT_STATUS_OPTIONS)}
                            </span>
                          ) : (
                            <span className="ml-1">-</span>
                          )}
                        </div>
                        <div className="flex flex-col space-y-1">
                          <span className="text-gray-600 font-medium">PRS:</span>
                          {hasValidValue(tower.prs) ? (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-teal-100 text-teal-800 w-fit">
                              {tower.prs}
                            </span>
                          ) : (
                            <span className="ml-1">-</span>
                          )}
                        </div>
                        <div className="flex flex-col space-y-1">
                          <span className="text-gray-600 font-medium">PRS ID:</span>
                          {hasValidValue(tower.prs_id) ? (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 w-fit">
                              {tower.prs_id}
                            </span>
                          ) : (
                            <span className="ml-1">-</span>
                          )}
                        </div>
                        <div className="flex flex-col space-y-1">
                          <span className="text-gray-600 font-medium">No Ijin:</span>
                          {hasValidValue(tower.no_ijin) ? (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 w-fit">
                              {tower.no_ijin}
                            </span>
                          ) : (
                            <span className="ml-1">-</span>
                          )}
                        </div>
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
      <div className="mt-4 sm:mt-6 bg-white rounded-lg shadow-lg p-3 sm:p-4">
        <div className="flex justify-center sm:justify-end">
          <div className="flex items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-600">
            <div className="flex items-center gap-1 sm:gap-2">
              <svg className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <span className="text-center sm:text-left">
                <span className="hidden sm:inline">Menampilkan </span><span className="font-semibold text-gray-800">{towers.from || 1}</span> - <span className="font-semibold text-gray-800">{towers.to || towers.data.length}</span> dari{' '}
                <span className="font-semibold text-gray-800">{total}</span> data
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Simplified Navigation */}
      <div className="mt-4 bg-white rounded-lg shadow-lg p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
          <div className="text-xs sm:text-sm text-gray-700 text-center sm:text-left">
            <span className="font-medium">Halaman {page} dari {last}</span>
            <span className="text-gray-500 ml-1 sm:ml-2">• {total} total tower</span>
          </div>
          <div className="flex items-center gap-1 sm:gap-2">
            <button
              disabled={page <= 1}
              className="px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors flex items-center gap-1 text-xs sm:text-sm"
              onClick={() => changePage(page - 1)}
            >
              <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span className="hidden xs:inline">Sebelum</span>
              <span className="xs:hidden">‹</span>
            </button>
            
            {/* Page numbers - Simplified to show sequential numbers */}
            <div className="flex items-center gap-0.5 sm:gap-1">
              {/* First page button if not on first few pages */}
              {page > 2 && (
                <>
                  <button
                    onClick={() => changePage(1)}
                    className="px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-xs sm:text-sm"
                  >
                    1
                  </button>
                  {page > 3 && <span className="text-gray-500 text-xs sm:text-sm">...</span>}
                </>
              )}
              
              {/* Show at most 3 sequential page numbers on mobile, 5 on desktop */}
              {Array.from({ length: Math.min(window.innerWidth < 640 ? 3 : 5, last) }, (_, i) => {
                // Calculate start page to ensure we have at most 3/5 pages centered on current page
                const maxPages = window.innerWidth < 640 ? 3 : 5;
                let startPage = Math.max(1, page - Math.floor(maxPages / 2));
                if (page > last - Math.floor(maxPages / 2)) {
                  startPage = Math.max(1, last - maxPages + 1);
                }
                if (startPage + maxPages - 1 > last) {
                  startPage = Math.max(1, last - maxPages + 1);
                }
                const pageNum = startPage + i;
                
                // Only render if pageNum is valid
                if (pageNum > 0 && pageNum <= last) {
                  return (
                    <button
                      key={pageNum}
                      onClick={() => changePage(pageNum)}
                      className={`px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm transition-colors ${
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
                  {page < last - 2 && <span className="text-gray-500 text-xs sm:text-sm">...</span>}
                  <button
                    onClick={() => changePage(last)}
                    className="px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-xs sm:text-sm"
                  >
                    {last}
                  </button>
                </>
              )}
            </div>
            
            <button
              disabled={page >= last}
              className="px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors flex items-center gap-1 text-xs sm:text-sm"
              onClick={() => changePage(page + 1)}
            >
              <span className="hidden xs:inline">Berikut</span>
              <span className="xs:hidden">›</span>
              <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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


