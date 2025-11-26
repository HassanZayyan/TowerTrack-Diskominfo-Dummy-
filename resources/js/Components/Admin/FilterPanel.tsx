import React from 'react';
import TowerSelectionInput from '@/Components/Feedback/Map/TowerSelectionInput';
import { SITE_TYPE_OPTIONS } from '@/constants/towerOptions';

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
    <div className="bg-white rounded-lg shadow-lg border border-gray-200">
      <div className="p-3 sm:p-4 lg:p-6">
        {/* Header */}
        <div className="flex flex-col xs:flex-row xs:items-center justify-between gap-3 mb-4 sm:mb-6">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 flex items-center gap-2">
            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            <span>Filter Pencarian</span>
          </h3>
          <button
            onClick={onClearAllFilters}
            className="text-xs sm:text-sm text-red-600 hover:text-red-800 font-medium flex items-center justify-center xs:justify-start gap-1 px-2 py-1 rounded hover:bg-red-50 transition-colors"
          >
            <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            <span>Hapus Semua Filter</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
          {/* Owner Filter */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
              Owner
            </label>
            <select
              value={filters.owner}
              onChange={(e) => onFilterChange('owner', e.target.value)}
              className="w-full px-2 sm:px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent"
            >
              <option value="all">Semua Owner</option>
              {owners.map(owner => (
                <option key={owner.id} value={owner.name}>
                  {owner.name}
                </option>
              ))}
            </select>
          </div>

          {/* Tower Type Filter */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
              Jenis Tower
            </label>
            <select
              value={filters.tower_type}
              onChange={(e) => onFilterChange('tower_type', e.target.value)}
              className="w-full px-2 sm:px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent"
            >
              {towerTypes.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          {/* Site Type Filter */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
              Tipe Site
            </label>
            <select
              value={filters.site_type}
              onChange={(e) => onFilterChange('site_type', e.target.value)}
              className="w-full px-2 sm:px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent"
            >
              {siteTypes.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          {/* Permit Status Filter */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
              Status Izin
            </label>
            <select
              value={filters.status_ijin}
              onChange={(e) => onFilterChange('status_ijin', e.target.value)}
              className="w-full px-2 sm:px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent"
            >
              {permitStatuses.map(status => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>
          </div>

          {/* Coordinates Filter */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
              Ketersediaan Koordinat
            </label>
            <select
              value={filters.has_coordinates}
              onChange={(e) => onFilterChange('has_coordinates', e.target.value)}
              className="w-full px-2 sm:px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent"
            >
              {coordinateOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Permits Filter */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
              Ketersediaan Izin
            </label>
            <select
              value={filters.has_permits}
              onChange={(e) => onFilterChange('has_permits', e.target.value)}
              className="w-full px-2 sm:px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent"
            >
              {permitOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Height Range Filter */}
        <div className="mt-4 sm:mt-6">
          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
            Rentang Tinggi Tower (meter)
          </label>
          <div className="flex items-center gap-2 sm:gap-4">
            <div className="flex-1">
              <input
                type="number"
                placeholder="Min"
                value={filters.height_range.min}
                onChange={(e) => onHeightRangeChange('min', e.target.value)}
                className="w-full px-2 sm:px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                min="0"
              />
            </div>
            <span className="text-xs sm:text-sm text-gray-500 font-medium whitespace-nowrap">sampai</span>
            <div className="flex-1">
              <input
                type="number"
                placeholder="Max"
                value={filters.height_range.max}
                onChange={(e) => onHeightRangeChange('max', e.target.value)}
                className="w-full px-2 sm:px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                min="0"
              />
            </div>
          </div>
        </div>

        {/* Tower Selection with Map */}
        <div className="mt-4 sm:mt-6">
          <TowerSelectionInput
            towers={towers}
            selectedTowerId={filters.selected_tower_id?.toString()}
            selectedTowerDisplay={filters.location_search}
            onTowerSelect={onTowerSelect || (() => {})}
            onClear={onClearTowerSelection}
            label="Pilih Tower Spesifik (Opsional)"
            required={false}
            className=""
          />
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col xs:flex-row gap-2 sm:gap-3 mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-gray-200">
          <button
            onClick={onApplyFilters}
            className="flex-1 px-3 sm:px-4 py-2.5 sm:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 font-medium text-sm sm:text-base"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <span>Terapkan Filter</span>
          </button>
          <button
            onClick={onClearAllFilters}
            className="xs:flex-none px-3 sm:px-4 py-2.5 sm:py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center gap-2 font-medium text-sm sm:text-base"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>Reset</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default FilterPanel;