import React, { useState, useCallback, useEffect } from 'react';
import { Head, router, Link } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import PageHeader from '@/Components/PageHeader';
import FilterPanel from '@/Components/Admin/FilterPanel';
import { formatDateForInput as formatDateForInputHelper } from '@/utils/dateHelpers';
import { useDebounce } from '@/Hooks/useDebounce';
import { SITE_TYPE_OPTIONS } from '@/constants/towerOptions';
import { Button } from '@/Components/ui/button';
import { Card } from '@/Components/ui/card';
import { Badge } from '@/Components/ui/badge';
import { cn } from '@/lib/utils';

/**
 * TOWER REGISTER — rebuilt as a register, not a feed of cards.
 *
 * What changed, and why. Presentation only: every handler, prop, route name and
 * piece of Indonesian copy below is the one that was already there.
 *
 * 1. ONE action zone. "Tambah Tower" and "Import Excel" were rendered twice,
 *    ~130px apart (hero actions, then a toolbar), and "Tambah Tower" a third time
 *    in the empty state. They now sit once in the page header. The hero band went
 *    with them: a CRUD register does not need a 150px marketing band to carry two
 *    strings.
 * 2. ONE search control. The field is already debounced (the useEffect below) and
 *    still submits on Enter, so the separate "Cari" button was a third way to run
 *    the same query. Removed; handleSearch is unchanged and still fires on Enter.
 * 3. ONE results line. "Menampilkan N-M dari T" had a Card of its own AND a second
 *    Card at the foot of the page. It is now the table's own toolbar, stated once.
 * 4. ONE pagination block instead of two stacked Cards ("Menampilkan…" then
 *    "Halaman X dari Y").
 * 5. The per-tower Card feed became a table: 40px header row on bg-well with a
 *    border-border-strong rule, 44px body rows, divide-border/70, header sticky
 *    under the 64px app bar. The inline editor expands directly beneath the record
 *    it edits. Below lg the same records render as a dense list and share the exact
 *    same editor markup — it is defined once, not forked per breakpoint.
 * 6. The "Dengan Ijin" KPI tile is GONE. towers.status_ijin is filled by
 *    TowerSeeder with array_rand(['Aktif','Non-Aktif','Dalam Proses']), so any
 *    aggregate over it is a histogram of rand(). Permit status is still shown and
 *    edited per record — that is a field on a row, not a statistic. Its slot went
 *    to statistics.average_height, which comes from imported tinggi_menara values
 *    and was already in props but never displayed.
 */

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

/* ------------------------------------------------------------------ *
 * Shared recipes. This screen used to re-type five spellings of the
 * field label and four of the 16px muted icon. These are the only two.
 * ------------------------------------------------------------------ */

const LABEL = 'block text-sm font-medium text-foreground mb-1.5';
const TH =
  'h-10 border-b border-border-strong bg-well px-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground';
const TD = 'px-3 py-1.5 align-middle text-sm text-foreground';
/* 36px control + 4px of invisible hit area above and below = a 44px touch target
   without pushing the row past its 44px height. */
const TOUCH = "relative before:absolute before:inset-x-0 before:-inset-y-1 before:content-['']";

const ICON = {
  search: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z',
  close: 'M6 18L18 6M6 6l12 12',
  filter:
    'M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z',
  plus: 'M12 6v6m0 0v6m0-6h6m-6 0H6',
  upload:
    'M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12',
  edit:
    'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z',
  check: 'M5 13l4 4L19 7',
  reset:
    'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15',
  tower:
    'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4',
  prev: 'M15 19l-7-7 7-7',
  next: 'M9 5l7 7-7 7',
  info: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  pin: 'M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z',
  gear:
    'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z',
  doc:
    'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
} as const;

const Ico: React.FC<{ d: string; className?: string }> = ({ d, className }) => (
  <svg
    className={cn('h-4 w-4 shrink-0', className)}
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    viewBox="0 0 24 24"
    aria-hidden="true"
  >
    <path strokeLinecap="round" strokeLinejoin="round" d={d} />
  </svg>
);

/** Active-filter chip. Was nine copies of a hand-rolled <Badge variant="secondary">. */
const FilterChip: React.FC<{ label: string; onRemove: () => void }> = ({ label, onRemove }) => (
  <Badge variant="secondary" className="max-w-full gap-1 py-1 pr-1">
    <span className="min-w-0 truncate" title={label}>
      {label}
    </span>
    <button
      type="button"
      onClick={onRemove}
      aria-label={`Hapus filter ${label}`}
      className={cn(
        'rounded-sm p-0.5 transition-colors duration-140 ease-state hover:bg-foreground/10',
        'focus-visible:outline-none focus-visible:ring focus-visible:ring-offset-1',
        TOUCH,
      )}
    >
      <Ico d={ICON.close} className="h-3 w-3" />
    </button>
  </Badge>
);

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
  // Invalid state stays red: it is the "this value is wrong" signal, not brand chrome.
  const baseClass = cn(
    'w-full rounded-md border bg-background px-3 text-sm text-foreground placeholder:text-placeholder',
    'transition-colors duration-140 ease-state',
    'focus-visible:outline-none focus-visible:ring focus-visible:ring-offset-2',
    rows ? 'py-2' : 'h-9',
    error ? 'border-destructive bg-destructive-soft' : 'border-input',
    disabled && 'cursor-not-allowed bg-muted',
    className,
  );

  const message = error ? (
    <p className="mt-1 flex items-start gap-1 text-xs font-medium text-destructive-strong">
      <Ico d={ICON.info} className="mt-px h-3.5 w-3.5" />
      {error}
    </p>
  ) : null;

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
        {message}
      </div>
    );
  }

  if (rows) {
    return (
      <div>
        <textarea
          className={cn(baseClass, 'resize-none')}
          rows={rows}
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
        />
        {message}
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
      {message}
    </div>
  );
};

// Constants for better maintainability
interface OptionType {
  value: string;
  label: string;
}

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

const EDIT_TABS = [
  { id: 'basic', label: 'Info Dasar', icon: ICON.info },
  { id: 'location', label: 'Lokasi', icon: ICON.pin },
  { id: 'technical', label: 'Teknis', icon: ICON.gear },
  { id: 'permits', label: 'Perijinan', icon: ICON.doc },
];

/* Permit status is genuinely semantic per record: "Tidak Aktif" and "Expired"
   stay red because they mean the permit does not cover this tower right now. */
const permitVariant = (status?: string | null) =>
  status === 'Aktif' ? 'success'
  : status === 'Tidak Aktif' ? 'destructive'
  : status === 'Pending' ? 'warning'
  : status === 'Expired' ? 'destructive'
  : 'secondary';

const TowersPage: React.FC<Props> = ({ towers, owners, statistics, allTowers }) => {
  const [editing, setEditing] = useState<Record<number, Partial<Tower>>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [currentPerPage] = useState(towers.per_page || 5); // Use server's per_page value or default to 5
  const [activeTab, setActiveTab] = useState<Record<number, string>>({});
  const [editingRow, setEditingRow] = useState<number | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<number, Record<string, string>>>({});
  const [selectedOwners, setSelectedOwners] = useState<Record<number, { id: string; name: string; alamat: string }>>({});

  // Debounce search term
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

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
      if (value === '') {
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
        editData.owner_id = selectedOwner.id.toString();
        editData.owner_name = selectedOwner.name;
        editData.owner_alamat = selectedOwner.alamat;
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
    return formatDateForInputHelper(dateValue);
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
    router.get(route('admin.towers.index'), params, { preserveState: true, preserveScroll: true });
  };

  const handleSearch = () => {
    const params = buildFilterParams({ page: 1 });
    setAppliedSearch(searchTerm);
    router.get(route('admin.towers.index'), params, { preserveState: true, preserveScroll: true, replace: true });
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

  // Debounced realtime search similar to FO RoutesList
  useEffect(() => {
    if (debouncedSearchTerm === appliedSearch) return;

    const params = buildFilterParams({ page: 1 });
    setAppliedSearch(debouncedSearchTerm);
    router.get(route('admin.towers.index'), params, { preserveState: true, preserveScroll: true, replace: true });
  }, [debouncedSearchTerm, appliedSearch]);

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
    setAppliedSearch('');

    router.get(route('admin.towers.index'), {
      page: 1,
      per_page: currentPerPage
    }, { preserveState: true, preserveScroll: true, replace: true });
  };

  const applyFilters = () => {
    const params = buildFilterParams({ page: 1 });
    router.get(route('admin.towers.index'), params, { preserveState: true, preserveScroll: true, replace: true });
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

  const isFiltered = Boolean(searchTerm) || hasActiveFilters();
  const share = (n: number) => (statistics.total > 0 ? Math.round((n / statistics.total) * 100) : 0);
  const averageHeight = Number(statistics.average_height ?? 0);

  /* Only real, imported fields get a figure here. statistics.with_permits is
     derived from status_ijin, which the seeder fills with array_rand() — it is a
     per-record field further down, never a headline number. */
  const statTiles = [
    {
      label: 'Total Menara',
      value: statistics.total.toLocaleString('id-ID'),
      unit: '',
      hint: 'seluruh data terdaftar',
      hintClass: 'text-muted-foreground',
    },
    {
      label: 'Dengan Koordinat',
      value: statistics.with_coordinates.toLocaleString('id-ID'),
      unit: '',
      hint: `${share(statistics.with_coordinates)}% dapat dipetakan`,
      hintClass: 'text-muted-foreground',
    },
    {
      label: 'Tanpa Koordinat',
      value: statistics.without_coordinates.toLocaleString('id-ID'),
      unit: '',
      hint: `${share(statistics.without_coordinates)}% perlu dilengkapi`,
      hintClass: 'text-warning-strong',
    },
    {
      label: 'Rata-rata Tinggi',
      value: averageHeight > 0 ? averageHeight.toFixed(1) : '-',
      unit: averageHeight > 0 ? 'm' : '',
      hint: 'dari data tinggi menara',
      hintClass: 'text-muted-foreground',
    },
  ];

  /* ---------------------------------------------------------------- *
   * The inline editor. ONE definition, rendered inside the expanded
   * table row on desktop and inside the list item below lg — the old
   * layout would have needed two copies of 300 lines of form.
   * ---------------------------------------------------------------- */
  const renderEditor = (tower: Tower) => (
    <div className="animate-rise-in">
      {/* Tab rail */}
      <div className="flex gap-1 overflow-x-auto border-b border-border/70 bg-well px-3 py-2">
        {EDIT_TABS.map((tab) => {
          const active = getActiveTab(tower.id) === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setTowerTab(tower.id, tab.id)}
              aria-pressed={active}
              className={cn(
                'inline-flex h-9 shrink-0 items-center gap-1.5 rounded-md border px-3 text-xs font-medium',
                'transition-colors duration-140 ease-state',
                'focus-visible:outline-none focus-visible:ring focus-visible:ring-offset-2',
                TOUCH,
                active
                  ? 'border-primary-border bg-primary-soft text-primary-strong'
                  : 'border-transparent text-muted-foreground hover:bg-accent hover:text-accent-foreground',
              )}
            >
              <Ico d={tab.icon} className="h-3.5 w-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Panel */}
      <div className="bg-card px-3 py-4 sm:px-5">
        {getActiveTab(tower.id) === 'basic' && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <div>
              <label className={LABEL}>
                Nama Site
              </label>
              <FormInput
                value={getEditValue(tower, 'site_name')}
                onChange={(value) => updateField(tower.id, 'site_name', value)}
                error={getFieldError(tower.id, 'site_name')}
                placeholder="Masukkan nama site"
              />
            </div>
            <div>
              <label className={LABEL}>No Urut</label>
              <FormInput
                value={getEditValue(tower, 'id_no_urut')}
                onChange={(value) => updateField(tower.id, 'id_no_urut', value)}
                error={getFieldError(tower.id, 'id_no_urut')}
                type="number"
                placeholder="No urut"
              />
            </div>
            <div>
              <label className={LABEL}>Site ID</label>
              <FormInput
                value={getEditValue(tower, 'site_id')}
                onChange={(value) => updateField(tower.id, 'site_id', value)}
                error={getFieldError(tower.id, 'site_id')}
                placeholder="Site ID"
              />
            </div>
            <div>
              <label className={LABEL}>Site SAP</label>
              <FormInput
                value={getEditValue(tower, 'site_sap')}
                onChange={(value) => updateField(tower.id, 'site_sap', value)}
                error={getFieldError(tower.id, 'site_sap')}
                placeholder="Site SAP"
              />
            </div>
            <div>
              <label className={LABEL}>Owner</label>
              <FormInput
                value={selectedOwners[tower.id]?.id?.toString() || getEditValue(tower, 'owner_id')?.toString() || ''}
                onChange={(value) => updateField(tower.id, 'owner_id', value)}
                error={getFieldError(tower.id, 'owner_id')}
                options={owners.map(owner => ({ value: owner.id.toString(), label: owner.name }))}
                placeholder="Pilih owner"
              />
            </div>
            {selectedOwners[tower.id] && (
              <div>
                <label className={LABEL}>Alamat Owner</label>
                <div className="rounded-md border border-border bg-well px-3 py-2 text-sm text-foreground">
                  {selectedOwners[tower.id].alamat || 'Alamat tidak tersedia'}
                </div>
              </div>
            )}
            <div>
              <label className={LABEL}>
                Site Type <span className="font-normal text-muted-foreground">(Opsional)</span>
              </label>
              <FormInput
                value={getEditValue(tower, 'site_type')}
                onChange={(value) => updateField(tower.id, 'site_type', value)}
                error={getFieldError(tower.id, 'site_type')}
                options={SITE_TYPE_OPTIONS}
                placeholder="Pilih site type"
              />
              <dl className="mt-2 space-y-0.5 text-xs text-muted-foreground">
                <div className="flex gap-1.5">
                  <dt className="font-medium text-foreground">GF:</dt>
                  <dd>Ground Floor - Menara di lantai dasar</dd>
                </div>
                <div className="flex gap-1.5">
                  <dt className="font-medium text-foreground">IBS:</dt>
                  <dd>Integrated Building System - Sistem bangunan terintegrasi</dd>
                </div>
                <div className="flex gap-1.5">
                  <dt className="font-medium text-foreground">RT:</dt>
                  <dd>Rooftop - Menara di atas bangunan</dd>
                </div>
              </dl>
            </div>
          </div>
        )}

        {getActiveTab(tower.id) === 'location' && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={LABEL}>Longitude</label>
              <FormInput
                value={getEditValue(tower, 'longitude')}
                onChange={(value) => updateField(tower.id, 'longitude', value)}
                error={getFieldError(tower.id, 'longitude')}
                type="number"
                placeholder="Contoh: 110.4203"
              />
            </div>
            <div>
              <label className={LABEL}>Latitude</label>
              <FormInput
                value={getEditValue(tower, 'latitude')}
                onChange={(value) => updateField(tower.id, 'latitude', value)}
                error={getFieldError(tower.id, 'latitude')}
                type="number"
                placeholder="Contoh: -7.7956"
              />
            </div>
            <div className="sm:col-span-2">
              <label className={LABEL}>
                Alamat Menara <span className="text-destructive-strong">*</span>
              </label>
              <FormInput
                value={getEditValue(tower, 'alamat_menara')}
                onChange={(value) => updateField(tower.id, 'alamat_menara', value)}
                error={getFieldError(tower.id, 'alamat_menara')}
                rows={3}
                placeholder="Alamat lengkap lokasi menara"
              />
            </div>
          </div>
        )}

        {getActiveTab(tower.id) === 'technical' && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div>
              <label className={LABEL}>Tinggi Menara (m)</label>
              <FormInput
                value={getEditValue(tower, 'tinggi_menara')}
                onChange={(value) => updateField(tower.id, 'tinggi_menara', value)}
                error={getFieldError(tower.id, 'tinggi_menara')}
                type="number"
                placeholder="Contoh: 42"
              />
            </div>
            <div>
              <label className={LABEL}>Tinggi Bangunan (m)</label>
              <FormInput
                value={getEditValue(tower, 'tinggi_bangunan')}
                onChange={(value) => updateField(tower.id, 'tinggi_bangunan', value)}
                error={getFieldError(tower.id, 'tinggi_bangunan')}
                type="number"
                placeholder="Contoh: 15"
              />
            </div>
            <div>
              <label className={LABEL}>Jumlah Pengguna</label>
              <FormInput
                value={getEditValue(tower, 'jumlah_pengguna')}
                onChange={(value) => updateField(tower.id, 'jumlah_pengguna', value)}
                error={getFieldError(tower.id, 'jumlah_pengguna')}
                type="number"
                placeholder="Jumlah operator"
              />
            </div>
            <div>
              <label className={LABEL}>Jumlah Kaki</label>
              <FormInput
                value={getEditValue(tower, 'jumlah_kaki')}
                onChange={(value) => updateField(tower.id, 'jumlah_kaki', value)}
                error={getFieldError(tower.id, 'jumlah_kaki')}
                type="number"
                placeholder="Contoh: 4"
              />
            </div>
            <div>
              <label className={LABEL}>Jenis Menara</label>
              <FormInput
                value={getEditValue(tower, 'tower_type')}
                onChange={(value) => updateField(tower.id, 'tower_type', value)}
                error={getFieldError(tower.id, 'tower_type')}
                placeholder="Contoh: Lattice, Monopole"
              />
            </div>
            <div>
              <label className={LABEL}>PRS</label>
              <FormInput
                value={getEditValue(tower, 'prs')}
                onChange={(value) => updateField(tower.id, 'prs', value)}
                error={getFieldError(tower.id, 'prs')}
                placeholder="PRS"
              />
            </div>
            <div>
              <label className={LABEL}>PRS ID</label>
              <FormInput
                value={getEditValue(tower, 'prs_id')}
                onChange={(value) => updateField(tower.id, 'prs_id', value)}
                error={getFieldError(tower.id, 'prs_id')}
                placeholder="PRS ID"
              />
            </div>
          </div>
        )}

        {getActiveTab(tower.id) === 'permits' && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <div>
              <label className={LABEL}>Nomor Ijin</label>
              <FormInput
                value={getEditValue(tower, 'no_ijin')}
                onChange={(value) => updateField(tower.id, 'no_ijin', value)}
                error={getFieldError(tower.id, 'no_ijin')}
                placeholder="Nomor ijin"
              />
            </div>
            <div>
              <label className={LABEL}>Jenis Ijin</label>
              <FormInput
                value={getEditValue(tower, 'jenis_ijin')}
                onChange={(value) => updateField(tower.id, 'jenis_ijin', value)}
                error={getFieldError(tower.id, 'jenis_ijin')}
                options={PERMIT_TYPE_OPTIONS}
                placeholder="Pilih jenis ijin"
              />
            </div>
            <div>
              <label className={LABEL}>Status Ijin</label>
              <FormInput
                value={getEditValue(tower, 'status_ijin')}
                onChange={(value) => updateField(tower.id, 'status_ijin', value)}
                error={getFieldError(tower.id, 'status_ijin')}
                options={PERMIT_STATUS_OPTIONS}
                placeholder="Pilih status ijin"
              />
            </div>
            <div>
              <label className={LABEL}>Tanggal Ijin</label>
              <FormInput
                value={getEditValue(tower, 'tanggal_ijin')}
                onChange={(value) => updateField(tower.id, 'tanggal_ijin', value)}
                error={getFieldError(tower.id, 'tanggal_ijin')}
                type="date"
              />
            </div>
            <div>
              <label className={LABEL}>Berlaku Hingga</label>
              <FormInput
                value={getEditValue(tower, 'berlaku_hingga')}
                onChange={(value) => updateField(tower.id, 'berlaku_hingga', value)}
                error={getFieldError(tower.id, 'berlaku_hingga')}
                type="date"
              />
            </div>
          </div>
        )}
      </div>

      {/* Commit bar. "Batal" sits on the record row; "Simpan" sits here. Once each. */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border/70 bg-well px-3 py-2 sm:px-5">
        <p className="text-xs text-muted-foreground">
          {hasChanges(tower.id)
            ? 'Ada perubahan yang belum disimpan.'
            : 'Ubah salah satu kolom untuk mengaktifkan Simpan.'}
        </p>
        <Button
          onClick={() => save(tower.id)}
          disabled={!hasChanges(tower.id)}
          variant="success"
          className="h-11 min-w-[112px] sm:h-10"
        >
          <Ico d={ICON.check} />
          Simpan
        </Button>
      </div>
    </div>
  );

  /* Page-number buttons. Same windowing maths as before, same 3-on-mobile /
     5-on-desktop behaviour; only the chrome changed. */
  const renderPageButtons = () => {
    const maxPages = typeof window !== 'undefined' && window.innerWidth < 640 ? 3 : 5;

    return Array.from({ length: Math.min(maxPages, last) }, (_, i) => {
      let startPage = Math.max(1, page - Math.floor(maxPages / 2));
      if (page > last - Math.floor(maxPages / 2)) {
        startPage = Math.max(1, last - maxPages + 1);
      }
      if (startPage + maxPages - 1 > last) {
        startPage = Math.max(1, last - maxPages + 1);
      }
      const pageNum = startPage + i;

      if (pageNum > 0 && pageNum <= last) {
        return (
          <button
            key={pageNum}
            type="button"
            onClick={() => changePage(pageNum)}
            aria-current={pageNum === page ? 'page' : undefined}
            className={cn(
              'h-9 min-w-[36px] rounded-md border px-2 text-sm tabular-nums',
              'transition-colors duration-140 ease-state',
              'focus-visible:outline-none focus-visible:ring focus-visible:ring-offset-2',
              TOUCH,
              pageNum === page
                ? 'border-primary-border bg-primary-soft font-medium text-primary-strong'
                : 'border-input bg-background text-foreground hover:bg-accent hover:text-accent-foreground',
            )}
          >
            {pageNum}
          </button>
        );
      }
      return null;
    });
  };

  const pagerStepClass = cn(
    'inline-flex h-9 items-center gap-1 rounded-md border border-input bg-background px-2.5 text-sm text-foreground',
    'transition-colors duration-140 ease-state hover:bg-accent hover:text-accent-foreground',
    'disabled:cursor-not-allowed disabled:opacity-50',
    'focus-visible:outline-none focus-visible:ring focus-visible:ring-offset-2',
    TOUCH,
  );

  const pagerEdgeClass = cn(
    'h-9 min-w-[36px] rounded-md border border-input bg-background px-2 text-sm tabular-nums text-foreground',
    'transition-colors duration-140 ease-state hover:bg-accent hover:text-accent-foreground',
    'focus-visible:outline-none focus-visible:ring focus-visible:ring-offset-2',
    TOUCH,
  );

  return (
    <AdminLayout title="Menara">
      <Head title="Menara" />

      {/* One action zone for the whole screen. */}
      <PageHeader
        title="Kelola Data Menara"
        description="Kelola informasi lengkap menara telekomunikasi dan perbarui data sesuai kebutuhan"
        showLogo={false}
        className="mb-5"
        actions={
          <>
            <Button onClick={() => router.get(route('admin.towers.create'))} className="h-11 flex-1 sm:h-10 sm:flex-none">
              <Ico d={ICON.plus} />
              Tambah Tower
            </Button>
            <Button asChild variant="outline" className="h-11 flex-1 sm:h-10 sm:flex-none">
              <Link href={route('admin.towers.import')}>
                <Ico d={ICON.upload} />
                Import Excel
              </Link>
            </Button>
          </>
        }
      />

      {/* Register figures. Hairline-separated, no icon tiles, no invented deltas. */}
      <div className="mb-5 grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-border bg-border/70 lg:grid-cols-4">
        {statTiles.map((tile) => (
          <div key={tile.label} className="bg-card px-4 py-3">
            <p className="truncate text-sm text-muted-foreground" title={tile.label}>
              {tile.label}
            </p>
            <p className="mt-0.5 text-2xl font-semibold tabular-nums tracking-tight text-foreground">
              {tile.value}
              {tile.unit && (
                <span className="ml-1 text-sm font-normal text-muted-foreground">{tile.unit}</span>
              )}
            </p>
            <p className={cn('mt-0.5 truncate text-xs', tile.hintClass)}>{tile.hint}</p>
          </div>
        ))}
      </div>

      {/* Toolbar: one wrapping row on the inset ground, not a grid of equal columns. */}
      <Card variant="well" padding="dense" className="mb-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[220px] flex-1">
            <Ico
              d={ICON.search}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-placeholder"
            />
            <input
              type="text"
              placeholder="Cari nama site, site ID, atau owner..."
              aria-label="Cari nama site, site ID, atau owner"
              className={cn(
                'h-10 w-full rounded-md border border-input bg-background pl-9 pr-10 text-sm',
                'text-foreground placeholder:text-placeholder transition-colors duration-140 ease-state',
                'focus-visible:outline-none focus-visible:ring focus-visible:ring-offset-2',
              )}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => {
                  setSearchTerm('');
                }}
                aria-label="Hapus kata kunci pencarian"
                className={cn(
                  'absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md',
                  'text-placeholder transition-colors duration-140 ease-state hover:bg-accent hover:text-foreground',
                  'focus-visible:outline-none focus-visible:ring focus-visible:ring-offset-1',
                  TOUCH,
                )}
              >
                <Ico d={ICON.close} />
              </button>
            )}
          </div>

          <Button
            onClick={() => setShowFilters(!showFilters)}
            variant={showFilters || hasActiveFilters() ? 'default' : 'outline'}
            aria-expanded={showFilters}
            className="h-11 sm:h-10"
          >
            <Ico d={ICON.filter} />
            <span>Filter</span>
            {hasActiveFilters() && (
              <span className="rounded-full bg-white/25 px-1.5 text-xs tabular-nums">
                {getActiveFilterCount()}
              </span>
            )}
          </Button>
        </div>
      </Card>

      {/* Filter Panel — on the page, not nested inside another card. */}
      {showFilters && (
        <div className="mb-3">
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
        </div>
      )}

      {/* Active filters: one row of chips, one reset. */}
      {hasActiveFilters() && (
        <div className="mb-3 flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-medium text-muted-foreground">Filter aktif:</span>

          {searchTerm && (
            <FilterChip
              label={`Pencarian: "${searchTerm}"`}
              onRemove={() => {
                setSearchTerm('');
              }}
            />
          )}

          {filters.owner !== 'all' && (
            <FilterChip
              label={`Owner: ${filters.owner}`}
              onRemove={() => {
                updateFilter('owner', 'all');
                applyFilters();
              }}
            />
          )}

          {filters.tower_type !== 'all' && (
            <FilterChip
              label={`Jenis: ${filters.tower_type}`}
              onRemove={() => {
                updateFilter('tower_type', 'all');
                applyFilters();
              }}
            />
          )}

          {filters.site_type !== 'all' && (
            <FilterChip
              label={`Site: ${filters.site_type}`}
              onRemove={() => {
                updateFilter('site_type', 'all');
                applyFilters();
              }}
            />
          )}

          {filters.status_ijin !== 'all' && (
            <FilterChip
              label={`Ijin: ${filters.status_ijin}`}
              onRemove={() => {
                updateFilter('status_ijin', 'all');
                applyFilters();
              }}
            />
          )}

          {filters.has_coordinates !== 'all' && (
            <FilterChip
              label={`Koordinat: ${filters.has_coordinates === 'yes' ? 'Ada' : 'Tidak Ada'}`}
              onRemove={() => {
                updateFilter('has_coordinates', 'all');
                applyFilters();
              }}
            />
          )}

          {filters.has_permits !== 'all' && (
            <FilterChip
              label={`Ijin: ${filters.has_permits === 'yes' ? 'Ada' : 'Tidak Ada'}`}
              onRemove={() => {
                updateFilter('has_permits', 'all');
                applyFilters();
              }}
            />
          )}

          {(filters.height_range.min || filters.height_range.max) && (
            <FilterChip
              label={`Tinggi: ${filters.height_range.min || '0'}m - ${filters.height_range.max || '∞'}m`}
              onRemove={() => {
                updateHeightRange('min', '');
                updateHeightRange('max', '');
                applyFilters();
              }}
            />
          )}

          {filters.selected_tower_id && (
            <FilterChip
              label={`Tower: ${filters.location_search}`}
              onRemove={() => {
                clearTowerSelection();
                applyFilters();
              }}
            />
          )}

          <Button onClick={clearAllFilters} variant="ghost" size="sm" className={cn('h-8', TOUCH)}>
            <Ico d={ICON.reset} className="h-3.5 w-3.5" />
            Reset Semua
          </Button>
        </div>
      )}

      {/* ------------------------------ Register ------------------------------ */}
      <Card padding="none" className="overflow-hidden">
        {/* Table toolbar — the one place the result count is stated. */}
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border-b border-border px-4 py-3">
          <div className="min-w-0">
            <h2 className="text-sm font-semibold tracking-tight text-foreground">Daftar Menara</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Menampilkan{' '}
              <span className="font-medium tabular-nums text-foreground">
                {towers.from || 0}-{towers.to || 0}
              </span>{' '}
              dari <span className="font-medium tabular-nums text-foreground">{towers.total || 0}</span> tower
              {isFiltered && <span className="text-primary-strong"> (hasil pencarian/filter)</span>}
            </p>
          </div>
          {editingRow !== null && (
            <Badge variant="warning" className="shrink-0">
              <Ico d={ICON.edit} className="h-3 w-3" />
              Sedang diedit
            </Badge>
          )}
        </div>

        {displayedTowers.length === 0 ? (
          <div className="p-3">
            <Card variant="well" padding="spacious" className="text-center">
              <Ico d={ICON.tower} className="mx-auto h-8 w-8 text-placeholder" />
              <h3 className="mt-3 text-base font-semibold tracking-tight text-foreground">
                {searchTerm || hasActiveFilters()
                  ? 'Tidak ada data menara yang sesuai dengan kriteria pencarian'
                  : 'Belum ada data menara'
                }
              </h3>
              <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
                {searchTerm || hasActiveFilters()
                  ? 'Coba ubah filter atau kata kunci pencarian'
                  : 'Data tower akan muncul di sini setelah ditambahkan'
                }
              </p>
              <div className="mt-4 flex justify-center">
                {searchTerm || hasActiveFilters() ? (
                  <Button
                    onClick={() => {
                      setSearchTerm('');
                      clearAllFilters();
                    }}
                    variant="outline"
                    className="h-11"
                  >
                    <Ico d={ICON.reset} />
                    Reset Pencarian
                  </Button>
                ) : (
                  <Button onClick={() => router.get(route('admin.towers.create'))} className="h-11">
                    <Ico d={ICON.plus} />
                    Tambah Tower Pertama
                  </Button>
                )}
              </div>
            </Card>
          </div>
        ) : (
          <>
            {/* Desktop: a real table. table-fixed + truncate, so the register never
                scrolls sideways and the sticky header can track page scroll under
                the 64px app bar. Long Indonesian values truncate with a title. */}
            <div className="hidden lg:block">
              <table className="w-full table-fixed border-collapse">
                <thead className="sticky top-16 z-10">
                  <tr className="border-b border-border-strong bg-well">
                    <th scope="col" className={cn(TH, 'w-[24%]')}>Site</th>
                    <th scope="col" className={cn(TH, 'w-[15%]')}>Owner</th>
                    <th scope="col" className={cn(TH, 'w-[21%]')}>Lokasi</th>
                    <th scope="col" className={cn(TH, 'w-[10%] text-right')}>Tinggi</th>
                    <th scope="col" className={cn(TH, 'w-[11%]')}>Tipe</th>
                    <th scope="col" className={cn(TH, 'w-[12%]')}>Status Ijin</th>
                    <th scope="col" className={cn(TH, 'w-[7%] text-right')}>Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/70">
                  {displayedTowers.map((tower) => (
                    <React.Fragment key={tower.id}>
                      <tr
                        className={cn(
                          'h-11 transition-colors duration-140 ease-state',
                          isEditing(tower.id) ? 'bg-primary-soft/40' : 'hover:bg-accent/60',
                        )}
                      >
                        <td className={TD}>
                          <div className="truncate font-medium leading-tight" title={tower.site_name}>
                            {tower.site_name}
                          </div>
                          <div className="truncate text-xs leading-tight text-muted-foreground">
                            {tower.site_id ? `ID ${tower.site_id}` : 'Tanpa Site ID'}
                            {tower.site_sap ? ` • SAP ${tower.site_sap}` : ''}
                          </div>
                        </td>

                        <td className={TD}>
                          <span className="block truncate" title={tower.owner || undefined}>
                            {tower.owner || <span className="text-placeholder">-</span>}
                          </span>
                        </td>

                        <td className={TD}>
                          <div className="truncate leading-tight" title={tower.alamat_menara || undefined}>
                            {tower.alamat_menara || <span className="text-placeholder">-</span>}
                          </div>
                          <div className="truncate text-xs leading-tight tabular-nums text-muted-foreground">
                            {tower.latitude && tower.longitude
                              ? `${tower.latitude}, ${tower.longitude}`
                              : <span className="text-warning-strong">Tanpa koordinat</span>}
                          </div>
                        </td>

                        <td className={cn(TD, 'text-right tabular-nums')}>
                          <div className="leading-tight">
                            {tower.tinggi_menara
                              ? `${tower.tinggi_menara} m`
                              : <span className="text-placeholder">-</span>}
                          </div>
                          {tower.tinggi_bangunan ? (
                            <div className="truncate text-xs leading-tight text-muted-foreground">
                              Bangunan {tower.tinggi_bangunan} m
                            </div>
                          ) : null}
                        </td>

                        <td className={TD}>
                          {hasValidValue(tower.site_type) ? (
                            <Badge className="max-w-full">
                              <span className="min-w-0 truncate" title={getDisplayValue(tower.site_type, SITE_TYPE_OPTIONS)}>
                                {tower.site_type}
                              </span>
                            </Badge>
                          ) : (
                            <span className="text-placeholder">-</span>
                          )}
                          <div
                            className="truncate text-xs leading-tight text-muted-foreground"
                            title={tower.tower_type || undefined}
                          >
                            {tower.tower_type || ''}
                          </div>
                        </td>

                        <td className={TD}>
                          {hasValidValue(tower.status_ijin) ? (
                            <Badge variant={permitVariant(tower.status_ijin)} className="max-w-full">
                              <span
                                className="min-w-0 truncate"
                                title={getDisplayValue(tower.status_ijin, PERMIT_STATUS_OPTIONS)}
                              >
                                {getDisplayValue(tower.status_ijin, PERMIT_STATUS_OPTIONS)}
                              </span>
                            </Badge>
                          ) : (
                            <span className="text-placeholder">-</span>
                          )}
                          <div
                            className="truncate text-xs leading-tight text-muted-foreground"
                            title={tower.no_ijin || undefined}
                          >
                            {tower.no_ijin || ''}
                          </div>
                        </td>

                        <td className={cn(TD, 'text-right')}>
                          {isEditing(tower.id) ? (
                            <Button
                              onClick={() => resetEditing(tower.id)}
                              variant="outline"
                              size="sm"
                              className={cn('h-9', TOUCH)}
                            >
                              <Ico d={ICON.close} />
                              Batal
                            </Button>
                          ) : (
                            <Button
                              onClick={() => startEditing(tower.id)}
                              variant="outline"
                              size="sm"
                              className={cn('h-9', TOUCH)}
                              aria-label={`Edit ${tower.site_name}`}
                            >
                              <Ico d={ICON.edit} />
                              Edit
                            </Button>
                          )}
                        </td>
                      </tr>

                      {isEditing(tower.id) && (
                        <tr>
                          <td colSpan={7} className="border-t border-border-strong p-0">
                            {renderEditor(tower)}
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Below lg: the same register as a dense list, sharing one editor. */}
            <ul className="divide-y divide-border/70 lg:hidden">
              {displayedTowers.map((tower) => (
                <li key={tower.id} className={cn(isEditing(tower.id) && 'bg-primary-soft/30')}>
                  <div className="flex items-start gap-3 p-3">
                    <div className="min-w-0 flex-1">
                      <p
                        className="truncate text-sm font-medium leading-tight text-foreground"
                        title={tower.site_name}
                      >
                        {tower.site_name}
                      </p>
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">
                        {tower.site_id ? `ID ${tower.site_id}` : 'Tanpa Site ID'}
                        {tower.owner ? ` • ${tower.owner}` : ''}
                      </p>
                      <p
                        className="mt-0.5 truncate text-xs text-muted-foreground"
                        title={tower.alamat_menara || undefined}
                      >
                        {tower.alamat_menara || '-'}
                      </p>
                      <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                        {hasValidValue(tower.site_type) && <Badge>{tower.site_type}</Badge>}
                        {hasValidValue(tower.tower_type) && (
                          <Badge variant="neutral" className="max-w-[140px]">
                            <span className="min-w-0 truncate" title={tower.tower_type || undefined}>
                              {tower.tower_type}
                            </span>
                          </Badge>
                        )}
                        {hasValidValue(tower.status_ijin) && (
                          <Badge variant={permitVariant(tower.status_ijin)}>
                            {getDisplayValue(tower.status_ijin, PERMIT_STATUS_OPTIONS)}
                          </Badge>
                        )}
                        {tower.tinggi_menara ? (
                          <span className="text-xs tabular-nums text-muted-foreground">
                            {tower.tinggi_menara} m
                          </span>
                        ) : null}
                        {!(tower.latitude && tower.longitude) && (
                          <span className="text-xs text-warning-strong">Tanpa koordinat</span>
                        )}
                      </div>
                    </div>

                    <div className="shrink-0">
                      {isEditing(tower.id) ? (
                        <Button onClick={() => resetEditing(tower.id)} variant="outline" className="h-11">
                          <Ico d={ICON.close} />
                          Batal
                        </Button>
                      ) : (
                        <Button
                          onClick={() => startEditing(tower.id)}
                          variant="outline"
                          className="h-11"
                          aria-label={`Edit ${tower.site_name}`}
                        >
                          <Ico d={ICON.edit} />
                          Edit
                        </Button>
                      )}
                    </div>
                  </div>

                  {isEditing(tower.id) && (
                    <div className="border-t border-border-strong">{renderEditor(tower)}</div>
                  )}
                </li>
              ))}
            </ul>
          </>
        )}

        {/* One pagination block: position in the set, then the pager. */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border bg-well px-3 py-2">
          <p className="text-xs text-muted-foreground">
            <span className="font-medium tabular-nums text-foreground">Halaman {page} dari {last}</span>
            <span className="ml-2 tabular-nums">{total} total tower</span>
          </p>

          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => changePage(page - 1)}
              className={pagerStepClass}
            >
              <Ico d={ICON.prev} />
              <span className="hidden xs:inline">Sebelum</span>
            </button>

            {page > 2 && (
              <>
                <button type="button" onClick={() => changePage(1)} className={pagerEdgeClass}>
                  1
                </button>
                {page > 3 && <span className="px-0.5 text-xs text-muted-foreground">...</span>}
              </>
            )}

            {renderPageButtons()}

            {page < last - 1 && (
              <>
                {page < last - 2 && <span className="px-0.5 text-xs text-muted-foreground">...</span>}
                <button type="button" onClick={() => changePage(last)} className={pagerEdgeClass}>
                  {last}
                </button>
              </>
            )}

            <button
              type="button"
              disabled={page >= last}
              onClick={() => changePage(page + 1)}
              className={pagerStepClass}
            >
              <span className="hidden xs:inline">Berikut</span>
              <Ico d={ICON.next} />
            </button>
          </div>
        </div>
      </Card>
    </AdminLayout>
  );
};

export default TowersPage;
