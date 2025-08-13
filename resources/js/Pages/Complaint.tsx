import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { Head, router } from '@inertiajs/react';
import MainLayout from '@/Layouts/MainLayout';
import Footer from '@/Components/Footer';

interface ComplaintProps {
  towers: Array<{
    id: number;
    site_name: string;
    alamat_menara?: string;
  }>;
}

// Utility functions untuk filtering yang lebih akurat
function normalizeText(text: string): string {
  return text.toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
    .replace(/[^\w\s]/g, ' ') // Replace special chars with space
    .replace(/\s+/g, ' ') // Multiple spaces to single
    .trim();
}

function calculateLevenshteinDistance(str1: string, str2: string): number {
  const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));
  
  for (let i = 0; i <= str1.length; i += 1) matrix[0][i] = i;
  for (let j = 0; j <= str2.length; j += 1) matrix[j][0] = j;
  
  for (let j = 1; j <= str2.length; j += 1) {
    for (let i = 1; i <= str1.length; i += 1) {
      const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1, // deletion
        matrix[j - 1][i] + 1, // insertion
        matrix[j - 1][i - 1] + indicator // substitution
      );
    }
  }
  
  return matrix[str2.length][str1.length];
}

function getSimilarityScore(text: string, query: string): number {
  const maxLen = Math.max(text.length, query.length);
  if (maxLen === 0) return 1.0;
  const distance = calculateLevenshteinDistance(text, query);
  return 1.0 - distance / maxLen;
}

// Fungsi untuk highlight text yang cocok - dengan fuzzy matching
function highlightMatch(text: string, query: string): React.ReactNode {
  if (!query.trim()) return text;
  
  const normalizedText = normalizeText(text);
  const normalizedQuery = normalizeText(query);
  const queryWords = normalizedQuery.split(/\s+/).filter(word => word.length > 0);
  
  let highlightedText = text;
  const matches: Array<{ start: number, end: number, word: string }> = [];
  
  // Find all matches
  queryWords.forEach(queryWord => {
    const textWords = normalizedText.split(/\s+/);
    let currentIndex = 0;
    
    for (const textWord of textWords) {
      const wordStartInOriginal = text.toLowerCase().indexOf(textWord, currentIndex);
      if (wordStartInOriginal === -1) continue;
      
      const wordEndInOriginal = wordStartInOriginal + textWord.length;
      
      // Check for exact, starts with, contains, or fuzzy match
      if (textWord === queryWord || 
          textWord.startsWith(queryWord) || 
          (queryWord.length >= 2 && textWord.includes(queryWord)) ||
          (queryWord.length >= 3 && getSimilarityScore(textWord, queryWord) > 0.7)) {
        
        matches.push({
          start: wordStartInOriginal,
          end: wordEndInOriginal,
          word: queryWord
        });
      }
      
      currentIndex = wordEndInOriginal;
    }
  });
  
  if (matches.length === 0) {
    // Fallback: highlight any substring matches
    queryWords.forEach(queryWord => {
      const escapedWord = queryWord.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`(${escapedWord})`, 'gi');
      const match = text.match(regex);
      if (match) {
        const index = text.toLowerCase().indexOf(queryWord);
        if (index !== -1) {
          matches.push({
            start: index,
            end: index + queryWord.length,
            word: queryWord
          });
        }
      }
    });
  }
  
  if (matches.length === 0) return text;
  
  // Sort matches by position and merge overlapping
  matches.sort((a, b) => a.start - b.start);
  const mergedMatches = [];
  let current = matches[0];
  
  for (let i = 1; i < matches.length; i++) {
    if (matches[i].start <= current.end) {
      current.end = Math.max(current.end, matches[i].end);
    } else {
      mergedMatches.push(current);
      current = matches[i];
    }
  }
  mergedMatches.push(current);
  
  // Build highlighted text
  const result = [];
  let lastIndex = 0;
  
  mergedMatches.forEach((match, index) => {
    // Add text before match
    if (match.start > lastIndex) {
      result.push(text.slice(lastIndex, match.start));
    }
    
    // Add highlighted match
    result.push(
      <mark key={`highlight-${index}`} className="bg-yellow-200 font-medium">
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

const Complaint: React.FC<ComplaintProps> = ({ towers = [] }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [activeIndex, setActiveIndex] = useState<number>(-1);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const [form, setForm] = useState({
    nama: '',
    telepon: '',
    kategori: '',
    lokasi_tower: '', // This will store site_name for display purposes
    lokasi_tower_display: '', // Display value for the selected tower
    tower_id: '', // Added to store the tower ID for the foreign key
    pesan: '',
  });
  
  const [validation, setValidation] = useState({
    nama: false,
    telepon: false,
    kategori: false,
    lokasi_tower: false,
    pesan: false
  });

  const [files, setFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isOtherCategory, setIsOtherCategory] = useState(false);

  // Ultra-accurate filtering function dengan fuzzy search
  const filteredTowers = useMemo(() => {
    const query = searchTerm.trim();
    if (!query || query.length === 0) return [];

    const normalizedQuery = normalizeText(query);
    const queryWords = normalizedQuery.split(/\s+/).filter(word => word.length > 0);

    const results: Array<{ 
      tower: typeof towers[0], 
      score: number, 
      matchType: string,
      matchedText: string 
    }> = [];

    for (const tower of towers) {
      const siteName = tower.site_name || '';
      const address = tower.alamat_menara || '';
      const normalizedSiteName = normalizeText(siteName);
      const normalizedAddress = normalizeText(address);
      const combinedText = `${normalizedSiteName} ${normalizedAddress}`;
      
      let score = 0;
      let matchType = '';
      let matchedText = '';
      let matchFound = false;

      // 1. EXACT MATCH (Perfect Score)
      if (normalizedSiteName === normalizedQuery) {
        score = 10000;
        matchType = 'exact_name';
        matchedText = siteName;
        matchFound = true;
      }
      else if (normalizedAddress === normalizedQuery) {
        score = 9000;
        matchType = 'exact_address';
        matchedText = address;
        matchFound = true;
      }
      
      // 2. STARTS WITH (Very High Score)
      else if (normalizedSiteName.startsWith(normalizedQuery)) {
        score = 8000 + (normalizedQuery.length / normalizedSiteName.length) * 1000;
        matchType = 'starts_with_name';
        matchedText = siteName;
        matchFound = true;
      }
      else if (normalizedAddress.startsWith(normalizedQuery)) {
        score = 7000 + (normalizedQuery.length / normalizedAddress.length) * 1000;
        matchType = 'starts_with_address';
        matchedText = address;
        matchFound = true;
      }
      
      // 3. WORD-LEVEL MATCHING
      else if (queryWords.length > 0) {
        const siteWords = normalizedSiteName.split(/\s+/);
        const addressWords = normalizedAddress.split(/\s+/);
        const allWords = [...siteWords, ...addressWords];
        
        let wordMatchScore = 0;
        let matchedWords = 0;
        
        // Check each query word against all text words
        for (const queryWord of queryWords) {
          let bestWordMatch = 0;
          let bestMatchedWord = '';
          
          for (const textWord of allWords) {
            if (textWord === queryWord) {
              bestWordMatch = 1000; // Exact word match
              bestMatchedWord = textWord;
            } else if (textWord.startsWith(queryWord)) {
              const currentScore = 800 + (queryWord.length / textWord.length) * 200;
              if (currentScore > bestWordMatch) {
                bestWordMatch = currentScore;
                bestMatchedWord = textWord;
              }
            } else if (textWord.includes(queryWord) && queryWord.length >= 2) {
              const currentScore = 600 + (queryWord.length / textWord.length) * 100;
              if (currentScore > bestWordMatch) {
                bestWordMatch = currentScore;
                bestMatchedWord = textWord;
              }
            } else if (queryWord.length >= 3) {
              // Fuzzy matching untuk typo tolerance
              const similarity = getSimilarityScore(textWord, queryWord);
              if (similarity > 0.7) {
                const currentScore = 400 * similarity;
                if (currentScore > bestWordMatch) {
                  bestWordMatch = currentScore;
                  bestMatchedWord = textWord;
                }
              }
            }
          }
          
          if (bestWordMatch > 0) {
            wordMatchScore += bestWordMatch;
            matchedWords++;
          }
        }
        
        // All words must be found for multi-word queries
        if (queryWords.length === 1 || matchedWords === queryWords.length) {
          score = wordMatchScore;
          matchType = `word_match_${matchedWords}`;
          matchedText = siteName;
          matchFound = true;
        }
      }
      
      // 4. SUBSTRING MATCHING (fallback)
      if (!matchFound && normalizedQuery.length >= 2) {
        if (normalizedSiteName.includes(normalizedQuery)) {
          score = 300 + (normalizedQuery.length / normalizedSiteName.length) * 200;
          matchType = 'substring_name';
          matchedText = siteName;
          matchFound = true;
        }
        else if (normalizedAddress.includes(normalizedQuery)) {
          score = 200 + (normalizedQuery.length / normalizedAddress.length) * 100;
          matchType = 'substring_address';
          matchedText = address;
          matchFound = true;
        }
      }
      
      // 5. FUZZY MATCHING (untuk typo)
      if (!matchFound && normalizedQuery.length >= 3) {
        const nameSimilarity = getSimilarityScore(normalizedSiteName, normalizedQuery);
        const addressSimilarity = getSimilarityScore(normalizedAddress, normalizedQuery);
        
        if (nameSimilarity > 0.6) {
          score = 150 * nameSimilarity;
          matchType = 'fuzzy_name';
          matchedText = siteName;
          matchFound = true;
        } else if (addressSimilarity > 0.6) {
          score = 100 * addressSimilarity;
          matchType = 'fuzzy_address';
          matchedText = address;
          matchFound = true;
        }
      }

      // Boost score untuk hasil yang lebih pendek (lebih relevan)
      if (matchFound) {
        const lengthPenalty = Math.max(0, 1 - (siteName.length / 50));
        score = score + (score * lengthPenalty * 0.1);
        
        results.push({ tower, score, matchType, matchedText });
      }
    }

    // Sort berdasarkan score tertinggi, lalu alphabetically
    results.sort((a, b) => {
      if (Math.abs(a.score - b.score) < 10) {
        return a.tower.site_name.localeCompare(b.tower.site_name);
      }
      return b.score - a.score;
    });
    
    // Return maksimal 15 hasil teratas
    return results.slice(0, 15).map(result => result.tower);
  }, [searchTerm, towers]);

  // Handle input change dengan intelligent search
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    
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
    
    // Clear validation error
    if (validation.lokasi_tower) {
      setValidation(prev => ({ ...prev, lokasi_tower: false }));
    }
  }, [validation.lokasi_tower]);

  // Select tower function
  const selectTower = useCallback((tower: { id: number; site_name: string; alamat_menara?: string }) => {
    const fullAddress = `${tower.site_name}${tower.alamat_menara ? ' - ' + tower.alamat_menara : ''}`;
    setForm((prev) => ({
      ...prev,
      tower_id: String(tower.id),
      lokasi_tower: tower.site_name,
      lokasi_tower_display: fullAddress,
    }));
    setSearchTerm('');
    setShowDropdown(false);
    setActiveIndex(-1);
    
    // Focus kembali ke input setelah selection
    setTimeout(() => {
      inputRef.current?.focus();
    }, 0);
    
    if (validation.lokasi_tower) {
      setValidation((prev) => ({ ...prev, lokasi_tower: false }));
    }
  }, [validation.lokasi_tower]);

  // Clear selection function
  const clearSelection = useCallback(() => {
    setForm(prev => ({ 
      ...prev, 
      lokasi_tower: '', 
      lokasi_tower_display: '', 
      tower_id: '' 
    }));
    setSearchTerm('');
    setShowDropdown(false);
    setActiveIndex(-1);
    
    // Focus ke input setelah clear
    setTimeout(() => {
      inputRef.current?.focus();
    }, 0);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    
    // Clear validation error if typing
    if (validation[name as keyof typeof validation] !== undefined) {
      setValidation(prev => ({ ...prev, [name]: false }));
    }
  };
  
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles) return;

    // Check if adding these files would exceed the limit of 3
    if (files.length + selectedFiles.length > 3) {
      setErrorMessage('Maksimal 3 foto yang dapat diunggah');
      return;
    }

    // Check each file for type and size
    const allowedTypes = ['image/jpeg', 'image/png'];
    const maxSize = 5 * 1024 * 1024; // 5MB
    const newFiles: File[] = [];

    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i];
      
      if (!allowedTypes.includes(file.type)) {
        setErrorMessage('Hanya file JPG dan PNG yang diizinkan');
        continue;
      }
      
      if (file.size > maxSize) {
        setErrorMessage('Ukuran file tidak boleh melebihi 5MB');
        continue;
      }
      
      newFiles.push(file);
    }

    // Add the valid files to the array
    setFiles(prev => [...prev, ...newFiles]);
    
    // Clear the input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    const newValidation = {
      nama: !form.nama,
      telepon: !form.telepon,
      kategori: !form.kategori,
      lokasi_tower: !form.lokasi_tower,
      pesan: !form.pesan
    } as const;
    
    setValidation(newValidation);
    
    if (Object.values(newValidation).some(Boolean)) {
      setErrorMessage('Silakan lengkapi semua field yang wajib diisi');
      return;
    }
    
    setIsSubmitting(true);
    setErrorMessage('');
    
    // Create form data to handle file uploads
    const formData = new FormData();
    Object.entries(form).forEach(([key, value]) => {
      formData.append(key, value);
    });
    
    files.forEach((file, index) => {
      formData.append(`foto[${index}]`, file);
    });
    
    // Submit using Inertia router
    router.post('/complaint', formData, {
      onSuccess: () => {
        setSuccessMessage('Keluhan Anda telah berhasil dikirimkan');
        setForm({
          nama: '',
          telepon: '',
          kategori: '',
          lokasi_tower: '',
          lokasi_tower_display: '',
          tower_id: '',
          pesan: '',
        });
        setFiles([]);
        setIsOtherCategory(false);
        setIsSubmitting(false);
      },
      onError: (errors: Record<string, string>) => {
        setErrorMessage(Object.values(errors).join(', '));
        setIsSubmitting(false);
      }
    });
  };

  const handleReset = () => {
    setForm({
      nama: '',
      telepon: '',
      kategori: '',
      lokasi_tower: '',
      lokasi_tower_display: '',
      tower_id: '',
      pesan: '',
    });
    setFiles([]);
    setIsOtherCategory(false);
    setValidation({
      nama: false,
      telepon: false,
      kategori: false,
      lokasi_tower: false,
      pesan: false
    });
    setErrorMessage('');
    setSuccessMessage('');
    setSearchTerm('');
    setShowDropdown(false);
    setActiveIndex(-1);
  };

  return (
    <MainLayout title="Form Keluhan" currentPage="/complaint">
      <Head title="Form Keluhan" />
      
      <div className="p-4 sm:p-6">
        <div className="rounded-lg shadow mb-8 px-4 sm:px-6 py-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3" style={{ backgroundColor: '#FFF8E1' }}>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold mb-1" style={{ color: '#212121' }}>
              Guest Complain - Sampaikan Keluhan Anda
            </h1>
            <p className="text-sm sm:text-base" style={{ color: '#212121', opacity: 0.85 }}>
              Silakan isi form di bawah ini untuk menyampaikan keluhan atau laporan terkait tower telekomunikasi
            </p>
          </div>
          <img src="/images/dprd-logo.png" alt="DPRD Kabupaten Semarang" className="h-8 w-8 sm:h-10 sm:w-10 hidden xs:block" />
        </div>
        
        <div className="bg-white rounded-lg shadow-md">
          <div className="p-4 sm:p-6">
            <h2 className="text-xl sm:text-2xl font-bold text-yellow-600 mb-6">Form Keluhan</h2>
            
            {successMessage && (
              <div className="bg-green-100 text-green-700 p-4 rounded-lg mb-6">
                {successMessage}
              </div>
            )}
            
            {errorMessage && (
              <div className="bg-red-100 text-red-700 p-4 rounded-lg mb-6">
                {errorMessage}
              </div>
            )}
            
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-6">
                <div>
                  <label className="block text-gray-700 font-medium mb-2">
                    Nama Lengkap <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    name="nama"
                    value={form.nama}
                    onChange={handleChange}
                    className={`w-full rounded-lg border ${validation.nama ? 'border-red-500' : 'border-gray-300'} focus:outline-none focus-visible:outline-none focus:ring-2 focus:border-[#B71C1C] p-3`}
                    style={{ '--tw-ring-color': '#B71C1C', outline: 'none' } as React.CSSProperties}
                    placeholder="Masukkan nama lengkap"
                  />
                  {validation.nama && (
                    <p className="text-red-500 text-sm mt-1">Nama lengkap harus diisi</p>
                  )}
                </div>
                
                {/* Email dihapus karena pengguna wajib login */}
                
                <div>
                  <label className="block text-gray-700 font-medium mb-2">
                    No. Telepon <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    name="telepon"
                    value={form.telepon}
                    onChange={handleChange}
                    className={`w-full rounded-lg border ${validation.telepon ? 'border-red-500' : 'border-gray-300'} focus:outline-none focus-visible:outline-none focus:ring-2 focus:border-[#B71C1C] p-3`}
                    style={{ '--tw-ring-color': '#B71C1C', outline: 'none' } as React.CSSProperties}
                    placeholder="Masukkan nomor telepon"
                  />
                  {validation.telepon && (
                    <p className="text-red-500 text-sm mt-1">Nomor telepon harus diisi</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-gray-700 font-medium mb-2">
                    Kategori Keluhan <span className="text-red-600">*</span>
                  </label>
                  {!isOtherCategory ? (
                    <select
                      name="kategori"
                      value={form.kategori}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value === "Lainnya") {
                          setIsOtherCategory(true);
                          setForm(prev => ({ ...prev, kategori: "" }));
                        } else {
                          handleChange(e);
                        }
                      }}
                      className={`w-full rounded-lg border ${validation.kategori ? 'border-red-500' : 'border-gray-300'} focus:outline-none focus-visible:outline-none focus:ring-2 focus:border-[#B71C1C] text-base sm:text-sm p-3`}
                      style={{ '--tw-ring-color': '#B71C1C', outline: 'none' } as React.CSSProperties}
                    >
                      <option value="">Pilih kategori</option>
                      <option value="Kerusakan">Kerusakan</option>
                      <option value="Gangguan Sinyal">Gangguan Sinyal</option>
                      <option value="Kebisingan">Kebisingan</option>
                      <option value="Lainnya">Lainnya</option>
                    </select>
                  ) : (
                    <div className="flex">
                      <input
                        type="text"
                        name="kategori"
                        value={form.kategori}
                        onChange={handleChange}
                        className={`w-full rounded-lg border ${validation.kategori ? 'border-red-500' : 'border-gray-300'} focus:outline-none focus-visible:outline-none focus:ring-2 focus:border-[#B71C1C] p-3`}
                        style={{ '--tw-ring-color': '#B71C1C', outline: 'none' } as React.CSSProperties}
                        placeholder="Masukkan kategori keluhan lainnya"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setIsOtherCategory(false);
                          setForm(prev => ({ ...prev, kategori: "" }));
                        }}
                        className="ml-2 px-3 py-2 rounded-lg hover:opacity-90 text-white"
                        style={{ backgroundColor: '#212121' }}
                      >
                        Batal
                      </button>
                    </div>
                  )}
                  {validation.kategori && (
                    <p className="text-red-500 text-sm mt-1">Kategori harus dipilih</p>
                  )}
                </div>
              </div>
              
              <div className="mb-6">
                <label className="block text-gray-700 font-medium mb-2">
                  Lokasi Tower <span className="text-red-600">*</span>
                </label>
                <div className="relative" ref={dropdownRef}>
                  <input
                    ref={inputRef}
                    type="text"
                    placeholder={form.lokasi_tower ? "" : "Ketik minimal 1 karakter untuk mencari..."}
                    value={form.lokasi_tower ? form.lokasi_tower_display : searchTerm}
                    onChange={form.lokasi_tower ? undefined : handleSearchChange}
                    onFocus={() => {
                      if (!form.lokasi_tower && searchTerm.trim().length > 0) {
                        setShowDropdown(true);
                      }
                    }}
                    onClick={() => {
                      if (!form.lokasi_tower && searchTerm.trim().length > 0) {
                        setShowDropdown(true);
                      }
                    }}
                    onKeyDown={handleKeyDown}
                    role="combobox"
                    aria-expanded={showDropdown}
                    aria-controls="tower-listbox"
                    aria-autocomplete="list"
                    readOnly={!!form.lokasi_tower}
                    className={`w-full rounded-lg border ${validation.lokasi_tower ? 'border-red-500' : 'border-gray-300'} focus:outline-none focus-visible:outline-none focus:ring-2 focus:border-[#B71C1C] p-3 pr-10 ${form.lokasi_tower ? 'bg-gray-50 cursor-default' : ''}`}
                    style={{ '--tw-ring-color': '#B71C1C', outline: 'none' } as React.CSSProperties}
                  />
                  
                  {/* Clear/Edit button */}
                  {(form.lokasi_tower || searchTerm) && (
                    <button
                      type="button"
                      onClick={clearSelection}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                      title={form.lokasi_tower ? "Ubah pilihan" : "Hapus"}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                  
                  {/* Dropdown */}
                  {showDropdown && !form.lokasi_tower && (
                    <div 
                      id="tower-listbox" 
                      role="listbox" 
                      className="absolute z-50 w-full mt-1 bg-white shadow-lg rounded-lg max-h-60 overflow-auto border border-gray-300"
                    >
                      {filteredTowers.length === 0 ? (
                        <div className="p-4 text-gray-500 text-center">
                          {searchTerm.trim().length === 0 
                            ? 'Mulai mengetik nama atau alamat tower...' 
                            : (
                              <div>
                                <div className="mb-2">Tidak ditemukan tower dengan kata kunci:</div>
                                <div className="font-medium text-gray-700">"{searchTerm}"</div>
                                <div className="text-xs mt-2 text-gray-400">
                                  💡 Coba gunakan kata kunci yang lebih umum atau periksa ejaan
                                </div>
                              </div>
                            )
                          }
                        </div>
                      ) : (
                        <>
                          <div className="px-4 py-2 bg-blue-50 border-b text-xs text-blue-700 font-medium">
                            ✓ {filteredTowers.length} tower ditemukan untuk "{searchTerm}"
                          </div>
                          {filteredTowers.map((tower, index) => (
                            <div
                              key={tower.id}
                              role="option"
                              aria-selected={index === activeIndex}
                              onMouseEnter={() => setActiveIndex(index)}
                              onMouseDown={(e) => e.preventDefault()}
                              onClick={() => selectTower(tower)}
                              className={`p-4 cursor-pointer border-b last:border-b-0 transition-all duration-150 ${
                                index === activeIndex 
                                  ? 'bg-blue-50 border-blue-200 shadow-sm' 
                                  : 'hover:bg-gray-50'
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
                              {index === activeIndex && (
                                <div className="text-xs text-blue-600 mt-2 font-medium">
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
                {validation.lokasi_tower && (
                  <p className="text-red-500 text-sm mt-1">Lokasi tower harus dipilih</p>
                )}
                {searchTerm && !showDropdown && !form.lokasi_tower && (
                  <p className="text-blue-600 text-sm mt-1">Klik pada field untuk melihat hasil pencarian</p>
                )}
              </div>
              
              <div className="mb-6">
                <label className="block text-gray-700 font-medium mb-2">
                  Upload Foto (opsional)
                </label>
                <div className="flex items-center flex-wrap gap-3">
                  <label className="flex items-center justify-center px-4 py-2 bg-gray-200 text-gray-700 rounded-lg cursor-pointer hover:bg-gray-300">
                    <span>Choose File</span>
                    <input 
                      type="file" 
                      accept=".jpg,.jpeg,.png" 
                      className="hidden" 
                      onChange={handleFileChange}
                      ref={fileInputRef}
                      multiple
                    />
                  </label>
                  <span className="text-gray-600">
                    {files.length > 0 ? `${files.length} file dipilih` : 'No file chosen'}
                  </span>
                </div>
                <p className="text-gray-500 text-sm mt-2">
                  Format yang didukung: JPG, PNG. Maksimal 5MB per file. Maksimal 3 foto.
                </p>
                
                {files.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-3">
                    {files.map((file, index) => (
                      <div key={index} className="relative">
                        <div className="w-20 h-20 rounded overflow-hidden border border-gray-300">
                          <img 
                            src={URL.createObjectURL(file)} 
                            alt={`Preview ${index}`}
                            className="w-full h-full object-cover" 
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => removeFile(index)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="mb-6">
                <label className="block text-gray-700 font-medium mb-2">
                  Pesan/Keluhan <span className="text-red-600">*</span>
                </label>
                <textarea
                  name="pesan"
                  value={form.pesan}
                  onChange={handleChange}
                  className={`w-full rounded-lg border ${validation.pesan ? 'border-red-500' : 'border-gray-300'} focus:outline-none focus-visible:outline-none focus:ring-2 focus:border-[#B71C1C] p-3`}
                  style={{ '--tw-ring-color': '#B71C1C', outline: 'none' } as React.CSSProperties}
                  rows={6}
                  placeholder="Jelaskan keluhan Anda secara detail..."
                  maxLength={500}
                ></textarea>
                {validation.pesan && (
                  <p className="text-red-500 text-sm mt-1">Pesan harus diisi</p>
                )}
                <p className="text-gray-500 text-sm mt-1">
                  {form.pesan.length}/500 karakter
                </p>
              </div>
              
              <div className="flex items-center justify-start gap-3 sm:gap-4 flex-wrap">
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-6 py-3 border rounded-lg hover:opacity-90 text-white"
                  style={{ backgroundColor: '#212121', borderColor: '#212121' }}
                  disabled={isSubmitting}
                >
                  Reset
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 font-medium rounded-lg hover:opacity-90 text-white"
                  style={{ backgroundColor: '#B71C1C' }}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Mengirim...' : 'Kirim Keluhan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
      
      <Footer />
    </MainLayout>
  );
};

export default Complaint;