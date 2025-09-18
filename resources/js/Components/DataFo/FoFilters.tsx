import React from 'react';
import { router } from '@inertiajs/react';

interface FoFiltersProps {
  selectedArea: string;
  onAreaChange: (area: string) => void;
  searchTerm?: string;
  onSearchChange?: (term: string) => void;
  selectedType?: string;
  onTypeChange?: (type: string) => void;
  selectedStatus?: string;
  onStatusChange?: (status: string) => void;
}

export default function FoFilters({
  selectedArea,
  onAreaChange,
  searchTerm = '',
  onSearchChange,
  selectedType = 'all',
  onTypeChange,
  selectedStatus = 'all',
  onStatusChange
}: FoFiltersProps) {
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Search functionality can be implemented here if needed
  };

  return (
    <div className="bg-white rounded-lg shadow p-4 mb-6">
      <h3 className="text-lg font-medium mb-4" style={{ color: '#212121' }}>Filter Data Fiber Optic</h3>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Area Selector */}
        <div className="w-full">
          <label className="block text-sm font-medium text-gray-700 mb-2">Pilih Area</label>
          <div className="flex gap-2">
            {['ungaran'].map((area) => (
              <button
                key={area}
                onClick={() => onAreaChange(area)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors flex-1 ${
                  selectedArea === area
                    ? 'text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                style={selectedArea === area ? { backgroundColor: '#B71C1C' } : {}}
              >
                Ungaran
              </button>
            ))}
          </div>
        </div>

        {/* Search Filter */}
        {onSearchChange && (
          <div className="w-full">
            <label className="block text-sm font-medium text-gray-700 mb-2">Pencarian</label>
            <form onSubmit={handleSearch} className="w-full">
              <div className="flex items-stretch rounded-lg overflow-hidden border border-gray-300 focus-within:ring-2 focus-within:ring-[#B71C1C]">
                <input 
                  type="text"
                  placeholder="Cari titik atau jalur FO"
                  className="w-full px-3 py-2 outline-none border-0 focus:ring-0 text-sm"
                  value={searchTerm}
                  onChange={(e) => onSearchChange(e.target.value)}
                />
                <button 
                  type="submit" 
                  className="text-white px-3 flex items-center justify-center shrink-0" 
                  style={{ backgroundColor: '#B71C1C' }}
                  aria-label="Cari"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
                    <path fillRule="evenodd" d="M10.5 3.75a6.75 6.75 0 104.243 12.01l4.249 4.248a.75.75 0 101.06-1.06l-4.248-4.25A6.75 6.75 0 0010.5 3.75zm-5.25 6.75a5.25 5.25 0 1110.5 0 5.25 5.25 0 01-10.5 0z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Type Filter */}
        {onTypeChange && (
          <div className="w-full">
            <label className="block text-sm font-medium text-gray-700 mb-2">Tipe Titik</label>
            <select
              value={selectedType}
              onChange={(e) => onTypeChange(e.target.value)}
              className="w-full rounded-lg border-gray-300 shadow-sm focus:border-[#B71C1C] focus:ring-[#B71C1C] text-sm"
            >
              <option value="all">Semua Tipe</option>
              <option value="pole_isp_junction">Pole + ISP + Junction Box</option>
              <option value="pole_isp">Pole + ISP</option>
              <option value="pole_junction">Pole + Junction Box</option>
              <option value="isp_junction">ISP + Junction Box</option>
              <option value="pole_only">Pole</option>
              <option value="isp_only">ISP</option>
              <option value="junction_only">Junction Box</option>
            </select>
          </div>
        )}

        {/* Status Filter */}
        {onStatusChange && (
          <div className="w-full">
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select
              value={selectedStatus}
              onChange={(e) => onStatusChange(e.target.value)}
              className="w-full rounded-lg border-gray-300 shadow-sm focus:border-[#B71C1C] focus:ring-[#B71C1C] text-sm"
            >
              <option value="all">Semua Status</option>
              <option value="active">Aktif</option>
              <option value="inactive">Non-aktif</option>
              <option value="maintenance">Maintenance</option>
            </select>
          </div>
        )}
      </div>
    </div>
  );
}