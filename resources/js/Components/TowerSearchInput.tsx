import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { filterTowers, findMatchPositions, Tower } from '@/utils/searchUtils';

// Function to highlight matched text
function highlightMatch(text: string, query: string): React.ReactNode {
  if (!query.trim()) return text;
  
  const matches = findMatchPositions(text, query);
  if (matches.length === 0) return text;
  
  const result = [] as React.ReactNode[];
  let lastIndex = 0;
  
  matches.forEach((match, index) => {
    // Add text before match
    if (match.start > lastIndex) {
      result.push(text.slice(lastIndex, match.start));
    }
    
    // Add highlighted match
    result.push(
      <mark key={`highlight-${index}`} className="bg-selected text-selected-foreground font-medium">
        {text.slice(match.start, match.end)}
      </mark>
    );
    
    lastIndex = match.end;
  });
  
  // Add remaining text
  if (lastIndex < text.length) {
    result.push(text.slice(lastIndex));
  }
  
  return result;
}

interface TowerSearchInputProps {
  towers: Tower[];
  selectedTowerId?: string;
  selectedTowerDisplay?: string;
  onTowerSelect: (tower: Tower) => void;
  onClear?: () => void;
  placeholder?: string;
  label?: string;
  required?: boolean;
  error?: boolean;
  errorMessage?: string;
  className?: string;
  // NEW: notify parent about search term changes to sync other UIs (e.g., map)
  onSearchTermChange?: (query: string) => void;
  // NEW: controlled search term from parent to persist across mode switches
  searchTerm?: string;
}

export default function TowerSearchInput({
  towers,
  selectedTowerId,
  selectedTowerDisplay,
  onTowerSelect,
  onClear,
  placeholder = "Ketik minimal 1 karakter untuk mencari...",
  label = "Lokasi Menara",
  required = false,
  error = false,
  errorMessage,
  className = "",
  onSearchTermChange,
  searchTerm: externalSearchTerm,
}: TowerSearchInputProps) {
  const [internalSearchTerm, setInternalSearchTerm] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [activeIndex, setActiveIndex] = useState<number>(-1);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Use external searchTerm if provided (controlled), otherwise use internal state (uncontrolled)
  const searchTerm = externalSearchTerm !== undefined ? externalSearchTerm : internalSearchTerm;

  // Filter towers menggunakan utility function
  const filteredTowers = useMemo(() => {
    return filterTowers(towers, searchTerm);
  }, [searchTerm, towers]);

  // Handle input change dengan intelligent search
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Update internal state only if not controlled by parent
    if (externalSearchTerm === undefined) {
      setInternalSearchTerm(value);
    }
    // Always notify parent about changes
    onSearchTermChange?.(value);
    
    // Show dropdown segera saat ada input, bahkan 1 karakter
    if (value.length > 0) {
      setShowDropdown(true);
      // Auto-select first result if available
      setTimeout(() => {
        setActiveIndex(0);
      }, 100);
    } else {
      setShowDropdown(false);
      setActiveIndex(-1);
    }
  }, [onSearchTermChange, externalSearchTerm]);

  // Select tower function
  const selectTower = useCallback((tower: Tower) => {
    onTowerSelect(tower);
    // Clear search term in both internal state and notify parent
    if (externalSearchTerm === undefined) {
      setInternalSearchTerm('');
    }
    onSearchTermChange?.('');
    setShowDropdown(false);
    setActiveIndex(-1);
    
    // Focus kembali ke input setelah selection
    setTimeout(() => {
      inputRef.current?.focus();
    }, 0);
  }, [onTowerSelect, onSearchTermChange, externalSearchTerm]);

  // Clear selection function
  const clearSelection = useCallback(() => {
    if (onClear) {
      onClear();
    }
    // Clear search term in both internal state and notify parent
    if (externalSearchTerm === undefined) {
      setInternalSearchTerm('');
    }
    onSearchTermChange?.('');
    setShowDropdown(false);
    setActiveIndex(-1);
    
    // Focus ke input setelah clear
    setTimeout(() => {
      inputRef.current?.focus();
    }, 0);
  }, [onClear, onSearchTermChange, externalSearchTerm]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showDropdown) return;
    
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setActiveIndex(prev => 
          prev < filteredTowers.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActiveIndex(prev => 
          prev > 0 ? prev - 1 : filteredTowers.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (activeIndex >= 0 && filteredTowers[activeIndex]) {
          selectTower(filteredTowers[activeIndex]);
        }
        break;
      case 'Escape':
        setShowDropdown(false);
        setActiveIndex(-1);
        inputRef.current?.blur();
        break;
      case 'Tab':
        setShowDropdown(false);
        setActiveIndex(-1);
        break;
    }
  }, [showDropdown, activeIndex, filteredTowers, selectTower]);
  
  // Event handler untuk klik di luar dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
        setActiveIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Auto-select first item when typing
  useEffect(() => {
    if (showDropdown && filteredTowers.length > 0 && activeIndex === -1) {
      setActiveIndex(0);
    }
  }, [filteredTowers, showDropdown]);

  const hasSelection = selectedTowerId && selectedTowerDisplay;

  return (
    <div className={className}>
      {label && (
        <label className="block text-foreground font-medium mb-2">
          {label} {required && <span className="text-destructive-strong">*</span>}
        </label>
      )}
      
      <div className="relative" ref={dropdownRef}>
        <input
          ref={inputRef}
          type="text"
          placeholder={hasSelection ? "" : placeholder}
          value={hasSelection ? selectedTowerDisplay : searchTerm}
          onChange={hasSelection ? undefined : handleSearchChange}
          onFocus={() => {
            if (!hasSelection && searchTerm.trim().length > 0) {
              setShowDropdown(true);
            }
          }}
          onClick={() => {
            if (!hasSelection && searchTerm.trim().length > 0) {
              setShowDropdown(true);
            }
          }}
          onKeyDown={handleKeyDown}
          role="combobox"
          aria-expanded={showDropdown}
          aria-controls="tower-listbox"
          aria-autocomplete="list"
          readOnly={!!hasSelection}
          className={`w-full rounded-lg border ${error ? 'border-destructive-strong' : 'border-input'} focus:outline-none focus-visible:outline-none focus:ring-2 focus:border-primary p-3 pr-10 ${hasSelection ? 'bg-muted cursor-default' : ''}`}
          
        />
        
        {/* Clear/Edit button */}
        {(hasSelection || searchTerm) && (
          <button
            type="button"
            onClick={clearSelection}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-placeholder hover:text-muted-foreground transition-colors"
            title={hasSelection ? "Ubah pilihan" : "Hapus"}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
        
        {/* Dropdown */}
        {showDropdown && !hasSelection && (
          <div 
            id="tower-listbox" 
            role="listbox" 
            className="absolute z-50 w-full mt-1 bg-white shadow-lg rounded-lg max-h-60 overflow-auto border border-input"
          >
            {filteredTowers.length === 0 ? (
              <div className="p-4 text-muted-foreground text-center">
                {searchTerm.trim().length === 0 
                  ? 'Mulai mengetik nama atau alamat menara...' 
                  : (
                    <div>
                        <div className="mb-2">Tidak ditemukan menara dengan kata kunci:</div>
                        <div className="font-medium text-foreground">"{searchTerm}"</div>
                      <div className="text-xs mt-2 text-placeholder">
                        Coba gunakan kata kunci yang lebih umum atau periksa ejaan
                      </div>
                    </div>
                  )
                }
              </div>
            ) : (
              <>
                <div className="px-4 py-2 bg-muted border-b text-xs text-neutral-strong font-medium">
                  {filteredTowers.length} tower ditemukan untuk "{searchTerm}"
                </div>
                {filteredTowers.map((tower, index) => (
                  <div
                    key={tower.id}
                    role="option"
                    aria-selected={index === activeIndex}
                    onMouseEnter={() => setActiveIndex(index)}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => selectTower(tower)}
                    className={`p-4 cursor-pointer border-b last:border-b-0 transition-colors duration-150 ${
                      index === activeIndex 
                        ? 'bg-muted border-border shadow-sm' 
                        : 'hover:bg-accent hover:text-accent-foreground'
                    }`}
                  >
                    <div className="font-medium text-foreground mb-1">
                      {highlightMatch(tower.site_name, searchTerm)}
                    </div>
                    {tower.alamat_menara && (
                      <div className="text-sm text-muted-foreground">
                        {highlightMatch(tower.alamat_menara, searchTerm)}
                      </div>
                    )}
                    {index === activeIndex && (
                      <div className="text-xs text-neutral-strong mt-2 font-medium">
                        ⏎ Tekan Enter untuk memilih
                      </div>
                    )}
                  </div>
                ))}
              </>
            )}
          </div>
        )}
      </div>
      
      {error && errorMessage && (
        <p className="text-destructive-strong text-sm mt-1">{errorMessage}</p>
      )}
      
      {searchTerm && !showDropdown && !hasSelection && (
        <p className="text-muted-foreground text-sm mt-1">Klik pada field untuk melihat hasil pencarian</p>
      )}
    </div>
  );
}
