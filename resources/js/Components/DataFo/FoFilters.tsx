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
  selectedSide?: string;
  onSideChange?: (side: string) => void;
}

export default function FoFilters({
  selectedArea,
  onAreaChange,
  searchTerm = '',
  onSearchChange,
  selectedType = 'all',
  onTypeChange,
  selectedStatus = 'all',
  onStatusChange,
  selectedSide = 'all',
  onSideChange
}: FoFiltersProps) {
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Search functionality can be implemented here if needed
  };

  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {/* Area Selector */}
        <div className="w-full">
          <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Pilih Area</label>
          <div className="flex gap-2">
            {['ungaran'].map((area) => (
              <button
                key={area}
                onClick={() => onAreaChange(area)}
                aria-pressed={selectedArea === area}
                className={`h-9 flex-1 rounded-md px-3 text-sm font-medium transition-colors duration-140 focus-visible:outline-none focus-visible:ring focus-visible:ring-offset-2 ${
                  selectedArea === area
                    ? 'bg-primary text-primary-foreground hover:bg-primary-hover'
                    : 'border border-input bg-background text-foreground hover:bg-accent'
                }`}
                
              >
                Ungaran
              </button>
            ))}
          </div>
        </div>

        {/* Search Filter */}
        {onSearchChange && (
          <div className="w-full">
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Pencarian</label>
            <form onSubmit={handleSearch} className="w-full">
              <div className="flex items-stretch rounded-lg overflow-hidden border border-input focus-within:border-ring focus-within:ring">
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
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Tipe Titik</label>
            <select
              value={selectedType}
              onChange={(e) => onTypeChange(e.target.value)}
              className="w-full rounded-lg border-input shadow-sm focus:border-ring focus:ring text-sm"
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
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Status</label>
            <select
              value={selectedStatus}
              onChange={(e) => onStatusChange(e.target.value)}
              className="w-full rounded-lg border-input shadow-sm focus:border-ring focus:ring text-sm"
            >
              <option value="all">Semua Status</option>
              <option value="active">Aktif</option>
              <option value="inactive">Non-aktif</option>
              <option value="maintenance">Maintenance</option>
            </select>
          </div>
        )}

        {/* Side of Road Filter */}
        {onSideChange && (
          <div className="w-full">
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Sisi Jalan</label>
            <select
              value={selectedSide}
              onChange={(e) => onSideChange(e.target.value)}
              className="w-full rounded-lg border-input shadow-sm focus:border-ring focus:ring text-sm"
            >
              <option value="all">Semua Sisi</option>
              <option value="left">Kiri</option>
              <option value="right">Kanan</option>
              <option value="unknown">Belum Diketahui</option>
            </select>
          </div>
        )}
      </div>
    </div>
  );
}