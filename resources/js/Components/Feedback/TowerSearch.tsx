import React from 'react';

interface Tower {
  id: number;
  site_name: string;
  alamat_menara?: string;
  latitude?: number;
  longitude?: number;
  tinggi_menara?: number;
  tower_type?: string;
  site_type?: string;
}

interface TowerSearchProps {
  searchTerm: string;
  onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  showDropdown: boolean;
  filteredTowers: Tower[];
  activeIndex: number;
  onSelectTower: (tower: Tower) => void;
  inputRef: React.RefObject<HTMLInputElement>;
  dropdownRef: React.RefObject<HTMLDivElement>;
  selectedTowerDisplay: string;
  onClearSelection: () => void;
  validation?: boolean;
  onShowMap: () => void;
}

// Fungsi untuk highlight text yang cocok
function highlightMatch(text: string, query: string): React.ReactNode {
  if (!query.trim()) return text;
  
  const normalizeText = (str: string) => str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const normalizedText = normalizeText(text);
  const normalizedQuery = normalizeText(query);
  
  const index = normalizedText.indexOf(normalizedQuery);
  if (index === -1) return text;
  
  const beforeMatch = text.slice(0, index);
  const match = text.slice(index, index + query.length);
  const afterMatch = text.slice(index + query.length);
  
  return (
    <>
      {beforeMatch}
      <mark className="bg-yellow-200 font-medium">{match}</mark>
      {afterMatch}
    </>
  );
}

export default function TowerSearch({
  searchTerm,
  onSearchChange,
  onKeyDown,
  showDropdown,
  filteredTowers,
  activeIndex,
  onSelectTower,
  inputRef,
  dropdownRef,
  selectedTowerDisplay,
  onClearSelection,
  validation,
  onShowMap
}: TowerSearchProps) {
  return (
    <div className="mb-6">
      <label className="block text-gray-700 font-medium mb-2">
        Lokasi Tower <span className="text-red-500">*</span>
      </label>
      
      <div className="relative" ref={dropdownRef}>
        {!selectedTowerDisplay ? (
          <>
            <input 
              ref={inputRef}
              type="text"
              value={searchTerm}
              onChange={onSearchChange}
              onKeyDown={onKeyDown}
              onFocus={() => searchTerm.length > 0}
              placeholder="Ketik nama tower atau alamat untuk mencari..."
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-colors ${
                validation ? 'border-red-500 bg-red-50' : 'border-gray-300'
              }`}
              autoComplete="off"
            />
            
            <button
              type="button"
              onClick={onShowMap}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              title="Pilih dari peta"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-1.447-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
            </button>
            
            {showDropdown && filteredTowers.length > 0 && (
              <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                {filteredTowers.map((tower, index) => (
                  <button
                    key={tower.id}
                    type="button"
                    onClick={() => onSelectTower(tower)}
                    className={`w-full text-left px-4 py-3 hover:bg-gray-100 border-b border-gray-100 last:border-b-0 transition-colors ${
                      index === activeIndex ? 'bg-blue-50 border-blue-200' : ''
                    }`}
                  >
                    <div className="font-medium text-gray-900 mb-1">
                      🏢 {highlightMatch(tower.site_name, searchTerm)}
                    </div>
                    {tower.alamat_menara && (
                      <div className="text-sm text-gray-600">
                        📍 {highlightMatch(tower.alamat_menara, searchTerm)}
                      </div>
                    )}
                    {tower.tower_type && (
                      <div className="text-xs text-gray-500 mt-1">
                        🗼 {tower.tower_type}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex-1">
              <div className="font-medium text-green-800">✓ Tower dipilih:</div>
              <div className="text-green-700 text-sm">{selectedTowerDisplay}</div>
            </div>
            <button
              type="button"
              onClick={onClearSelection}
              className="text-green-600 hover:text-green-800 p-1"
              title="Ganti pilihan"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
        
        {validation && (
          <p className="text-red-600 text-sm mt-1">Lokasi tower harus dipilih</p>
        )}
        
        {searchTerm && !showDropdown && !selectedTowerDisplay && (
          <p className="text-blue-600 text-sm mt-1">Klik pada field untuk melihat hasil pencarian</p>
        )}
      </div>
    </div>
  );
}
