/**
 * FilterPanel — the tower filter rail.
 *
 * REBUILT as ONE WRAPPING ROW.
 *
 * What was removed and why:
 *  - `bg-white rounded-lg shadow-lg border` while nested inside the <Card> in
 *    Towers.tsx: a white, shadowed card sitting on a white card. A filter rail
 *    is INSET, so it is bg-well — darker than its parent, which is what makes
 *    it read as recessed instead of as one more floating box.
 *  - the duplicate reset. `onClearAllFilters` was wired to a red text link in
 *    the header AND to a "Reset" button 177 lines below it. One handler, one
 *    control, and it lives in the action zone next to Terapkan Filter.
 *  - `text-red-600 hover:text-red-800 hover:bg-red-50` on that link: clearing a
 *    filter is not destructive — nothing is deleted — so it must not borrow the
 *    destructive tokens that "Hapus Tower" needs in order to keep meaning
 *    something.
 *  - `bg-neutral text-white hover:bg-neutral`: a hover state that changed
 *    nothing. The submit is now the Button primitive.
 *  - `focus:ring-2`: the token ring is already 3px at 40%. Eight selects were
 *    quietly overriding it back down to 2px.
 *
 * The six facets, the height range, the tower picker and the two actions are
 * now items in a single `flex flex-wrap` row, so the panel is as short as the
 * viewport width allows instead of a fixed three-column grid plus three
 * stacked sections below it.
 */

import React from 'react';
import TowerSelectionInput from '@/Components/Feedback/Map/TowerSelectionInput';
import { SITE_TYPE_OPTIONS } from '@/constants/towerOptions';
import { Button } from '@/Components/ui/button';
import { cn } from '@/lib/utils';

interface FilterPanelProps {
  filters: {
    owner: string;
    tower_type: string;
    site_type: string;
    status_ijin: string;
    has_coordinates: string;
    has_permits: string;
    height_range: {
      min: string;
      max: string;
    };
    location_search: string;
    selected_tower_id: number | null;
  };
  owners: Array<{ id: number; name: string; alamat: string }>;
  towers: Array<{
    id: number;
    site_name: string;
    latitude: number | string;
    longitude: number | string;
    alamat_menara?: string;
    tinggi_menara?: number;
    tinggi_bangunan?: number;
    jumlah_pengguna?: number;
    tower_type?: string;
    site_type?: string | null;
    owner?: string;
    status?: string;
  }>;
  onFilterChange: (key: string, value: any) => void;
  onHeightRangeChange: (type: 'min' | 'max', value: string) => void;
  onApplyFilters: () => void;
  onClearAllFilters: () => void;
  onTowerSelect?: (tower: any) => void;
  onClearTowerSelection?: () => void;
  hasActiveFilters: boolean;
}

/* ONE control recipe, not eight hand-typed approximations of one.
   44px tall so every facet clears the touch-target floor. */
const controlClasses = cn(
  'h-11 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground',
  'placeholder:text-placeholder transition-colors duration-140 ease-state',
  'hover:border-border-strong',
  'focus:outline-none focus-visible:outline-none focus:border-ring focus:ring',
);

/* Indonesian facet names run long — "Ketersediaan Koordinat" is 22 characters —
   so the label truncates with a title attribute rather than clipping. */
const FacetLabel: React.FC<{ htmlFor: string; children: string }> = ({ htmlFor, children }) => (
  <label
    htmlFor={htmlFor}
    className="mb-1.5 block truncate text-xs font-medium uppercase tracking-wide text-muted-foreground"
    title={children}
  >
    {children}
  </label>
);

const FacetSelect: React.FC<{
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
}> = ({ id, label, value, onChange, options }) => (
  <div className="min-w-[168px] flex-1 basis-[190px]">
    <FacetLabel htmlFor={id}>{label}</FacetLabel>
    <div className="relative">
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(controlClasses, 'appearance-none pr-9')}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 right-0 flex w-9 items-center justify-center text-placeholder"
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </span>
    </div>
  </div>
);

const FilterPanel: React.FC<FilterPanelProps> = ({
  filters,
  owners,
  towers,
  onFilterChange,
  onHeightRangeChange,
  onApplyFilters,
  onClearAllFilters,
  onTowerSelect,
  onClearTowerSelection,
  hasActiveFilters
}) => {
  const ownerOptions = [
    { value: 'all', label: 'Semua Owner' },
    ...owners.map(owner => ({ value: owner.name, label: owner.name })),
  ];

  const towerTypes = [
    { value: 'all', label: 'Semua Jenis' },
    { value: 'Monopole', label: 'Monopole' },
    { value: 'Lattice', label: 'Lattice' },
    { value: 'Guyed', label: 'Guyed' },
    { value: 'Rooftop', label: 'Rooftop' },
    { value: 'SST', label: 'SST' },
    { value: 'SSTL', label: 'SSTL' }
  ];

  // Use SITE_TYPE_OPTIONS from constants for consistency
  const siteTypes = [
    { value: 'all', label: 'Semua Tipe Site' },
    ...SITE_TYPE_OPTIONS.map(option => ({
      value: option.value,
      label: option.label
    }))
  ];

  const permitStatuses = [
    { value: 'all', label: 'Semua Status' },
    { value: 'Aktif', label: 'Aktif' },
    { value: 'Tidak Aktif', label: 'Tidak Aktif' },
    { value: 'Pending', label: 'Pending' },
    { value: 'Expired', label: 'Expired' }
  ];

  const coordinateOptions = [
    { value: 'all', label: 'Semua' },
    { value: 'yes', label: 'Ada Koordinat' },
    { value: 'no', label: 'Tanpa Koordinat' }
  ];

  const permitOptions = [
    { value: 'all', label: 'Semua' },
    { value: 'yes', label: 'Ada Izin' },
    { value: 'no', label: 'Tanpa Izin' }
  ];

  return (
    <div className="rounded-lg border border-border bg-well shadow-[inset_0_1px_0_rgb(28_25_23/0.04)]">
      {/* Rail header: a 40px line, not a six-unit band. The right-hand side is
          the only thing it adds — whether anything is narrowing the list. */}
      <div className="flex h-10 items-center justify-between gap-3 border-b border-border/70 px-4">
        <h3 className="flex min-w-0 items-center gap-2 text-sm font-semibold tracking-tight text-foreground">
          <svg className="h-4 w-4 flex-shrink-0 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          <span className="truncate">Filter Pencarian</span>
        </h3>
        <span
          className={cn(
            'flex-shrink-0 text-xs font-medium',
            hasActiveFilters ? 'text-primary-strong' : 'text-muted-foreground',
          )}
        >
          {hasActiveFilters ? 'Filter aktif' : 'Tanpa filter'}
        </span>
      </div>

      {/* ONE wrapping row. Facets, range, picker and actions are all items in it. */}
      <div className="flex flex-wrap items-end gap-x-3 gap-y-3 p-4">
        <FacetSelect
          id="filter-owner"
          label="Owner"
          value={filters.owner}
          onChange={(value) => onFilterChange('owner', value)}
          options={ownerOptions}
        />
        <FacetSelect
          id="filter-tower-type"
          label="Jenis Menara"
          value={filters.tower_type}
          onChange={(value) => onFilterChange('tower_type', value)}
          options={towerTypes}
        />
        <FacetSelect
          id="filter-site-type"
          label="Tipe Site"
          value={filters.site_type}
          onChange={(value) => onFilterChange('site_type', value)}
          options={siteTypes}
        />
        <FacetSelect
          id="filter-status-ijin"
          label="Status Izin"
          value={filters.status_ijin}
          onChange={(value) => onFilterChange('status_ijin', value)}
          options={permitStatuses}
        />
        <FacetSelect
          id="filter-has-coordinates"
          label="Ketersediaan Koordinat"
          value={filters.has_coordinates}
          onChange={(value) => onFilterChange('has_coordinates', value)}
          options={coordinateOptions}
        />
        <FacetSelect
          id="filter-has-permits"
          label="Ketersediaan Izin"
          value={filters.has_permits}
          onChange={(value) => onFilterChange('has_permits', value)}
          options={permitOptions}
        />

        {/* Height range is two inputs but one facet, so it is one item in the row. */}
        <div className="min-w-[220px] flex-1 basis-[260px]">
          <FacetLabel htmlFor="filter-height-min">Rentang Tinggi Menara (meter)</FacetLabel>
          <div className="flex items-center gap-2">
            <input
              id="filter-height-min"
              type="number"
              placeholder="Min"
              value={filters.height_range.min}
              onChange={(e) => onHeightRangeChange('min', e.target.value)}
              className={cn(controlClasses, 'tabular-nums')}
              min="0"
              aria-label="Tinggi minimum (meter)"
            />
            <span className="flex-shrink-0 text-xs font-medium text-muted-foreground">sampai</span>
            <input
              id="filter-height-max"
              type="number"
              placeholder="Max"
              value={filters.height_range.max}
              onChange={(e) => onHeightRangeChange('max', e.target.value)}
              className={cn(controlClasses, 'tabular-nums')}
              min="0"
              aria-label="Tinggi maksimum (meter)"
            />
          </div>
        </div>

        {/* The map picker owns a dialog, so it takes the full row width. */}
        <div className="w-full basis-full">
          <TowerSelectionInput
            towers={towers}
            selectedTowerId={filters.selected_tower_id?.toString()}
            selectedTowerDisplay={filters.location_search}
            onTowerSelect={onTowerSelect || (() => {})}
            onClear={onClearTowerSelection}
            label="Pilih Menara Spesifik (Opsional)"
            required={false}
            className=""
          />
        </div>

        {/* The single action zone. Reset appears here and nowhere else. */}
        <div className="flex w-full basis-full flex-wrap items-center justify-end gap-2 border-t border-border/70 pt-3">
          <Button
            type="button"
            variant="outline"
            onClick={onClearAllFilters}
            className="h-11 flex-1 xs:flex-none"
          >
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>Reset</span>
          </Button>
          <Button
            type="button"
            onClick={onApplyFilters}
            className="h-11 flex-1 xs:flex-none"
          >
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <span>Terapkan Filter</span>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default FilterPanel;
