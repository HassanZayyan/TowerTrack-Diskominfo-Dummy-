import React from 'react';
import { router } from '@inertiajs/react';

interface TowerFiltersProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  coordFilter: 'all' | 'with' | 'without';
  setCoordFilter: (filter: 'all' | 'with' | 'without') => void;
  ownerFilter: string;
  setOwnerFilter: (filter: string) => void;
  uniqueOwners: string[];
  onSearch: (e: React.FormEvent) => void;
  buildFilterParams: (overrides?: any) => any;
}

export default function TowerFilters({
  searchTerm,
  setSearchTerm,
  coordFilter,
  setCoordFilter,
  ownerFilter,
  setOwnerFilter,
  uniqueOwners,
  onSearch,
  buildFilterParams
}: TowerFiltersProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 justify-end md:justify-self-end w-full md:w-auto">
      <form onSubmit={onSearch} className="w-full">
        <div className="flex items-stretch rounded-md overflow-hidden border border-input focus-within:border-ring focus-within:ring focus-within:ring-offset-0">
          <input 
            type="text"
            placeholder="Cari menara"
            className="w-full px-4 py-2 outline-none border-0 focus:ring-0"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button 
            type="submit" 
            className="bg-primary text-primary-foreground px-3 sm:px-4 flex items-center justify-center shrink-0 transition-colors hover:bg-primary-hover"
            aria-label="Cari"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
              <path fillRule="evenodd" d="M10.5 3.75a6.75 6.75 0 104.243 12.01l4.249 4.248a.75.75 0 101.06-1.06l-4.248-4.25A6.75 6.75 0 0010.5 3.75zm-5.25 6.75a5.25 5.25 0 1110.5 0 5.25 5.25 0 01-10.5 0z" clipRule="evenodd" />
            </svg>
            <span className="hidden sm:inline ml-2">Cari</span>
          </button>
        </div>
      </form>

      <div className="w-full">
        <select
          value={coordFilter}
          onChange={(e) => {
            const v = e.target.value as 'all' | 'with' | 'without';
            setCoordFilter(v);
            
            const params = buildFilterParams({ coord: v, page: 1 });
            router.get('/data-tower', params, { preserveState: true, preserveScroll: true, replace: true });
          }}
          className="w-full rounded-md border-input bg-background shadow-xs focus:border-ring focus:ring focus:ring-offset-0 text-base sm:text-sm"
        >
          <option value="all">Semua</option>
          <option value="with">Ada koordinat</option>
          <option value="without">Tanpa koordinat</option>
        </select>
      </div>

      <div className="w-full">
        <select
          value={ownerFilter}
          onChange={(e) => {
            const v = e.target.value;
            setOwnerFilter(v);
            
            const params = buildFilterParams({ owner: v, page: 1 });
            router.get('/data-tower', params, { preserveState: true, preserveScroll: true, replace: true });
          }}
          className="w-full rounded-md border-input bg-background shadow-xs focus:border-ring focus:ring focus:ring-offset-0 text-base sm:text-sm"
          title="Filter berdasarkan pemilik menara"
        >
          <option value="all">Semua Pemilik</option>
          {uniqueOwners.map(owner => (
            <option key={owner} value={owner}>{owner}</option>
          ))}
        </select>
      </div>
      </div>
    </div>
  );
}
