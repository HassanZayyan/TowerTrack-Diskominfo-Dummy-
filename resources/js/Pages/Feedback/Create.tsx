import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import MainLayout from '@/Layouts/MainLayout';
import Footer from '@/Components/Footer';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix untuk leaflet icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface FeedbackCreateProps {
  towers: Array<{
    id: number;
    site_name: string;
    alamat_menara?: string;
    latitude?: number;
    longitude?: number;
    tinggi_menara?: number;
    tinggi_bangunan?: number;
    jumlah_pengguna?: number;
    tower_type?: string;
    site_type?: string;
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

export default function FeedbackCreate({ towers }: FeedbackCreateProps) {
  const { errors, flash } = usePage().props as any;
  
  const [searchTerm, setSearchTerm] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [activeIndex, setActiveIndex] = useState<number>(-1);
  const [showMapDialog, setShowMapDialog] = useState(false);
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

  // Filter towers yang memiliki koordinat untuk ditampilkan di map
  const towersWithCoordinates = useMemo(() => {
    return towers.filter(tower => 
      tower.latitude && 
      tower.longitude && 
      !isNaN(Number(tower.latitude)) && 
      !isNaN(Number(tower.longitude))
    );
  }, [towers]);

  // Komponen MapDialog
  const MapDialog = () => {
    if (!showMapDialog) return null;

    // Center map di Indonesia (koordinat tengah Indonesia)
    const defaultCenter: [number, number] = [-2.5, 118];
    const defaultZoom = 5;

    // Jika ada towers dengan koordinat, center ke area tersebut
    let mapCenter = defaultCenter;
    let mapZoom = defaultZoom;
    
    if (towersWithCoordinates.length > 0) {
      // Hitung center berdasarkan rata-rata koordinat towers
      const lats = towersWithCoordinates.map(t => Number(t.latitude));
      const lngs = towersWithCoordinates.map(t => Number(t.longitude));
      
      mapCenter = [
        lats.reduce((a, b) => a + b, 0) / lats.length,
        lngs.reduce((a, b) => a + b, 0) / lngs.length
      ];
      mapZoom = 8;
    }

    const handleMarkerClick = (tower: any) => {
      const fullAddress = `${tower.site_name}${tower.alamat_menara ? ' - ' + tower.alamat_menara : ''}`;
      setForm(prev => ({
        ...prev,
        tower_id: String(tower.id),
        lokasi_tower: tower.site_name,
        lokasi_tower_display: fullAddress,
      }));
      setShowMapDialog(false);
      if (validation.lokasi_tower) {
        setValidation(prev => ({ ...prev, lokasi_tower: false }));
      }
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg w-full max-w-6xl h-5/6 flex flex-col">
          {/* Header */}
          <div className="flex justify-between items-center p-4 border-b">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Pilih Lokasi Tower dari Peta</h3>
              <p className="text-sm text-gray-600">{towersWithCoordinates.length} tower tersedia dengan koordinat</p>
            </div>
            <button
              onClick={() => setShowMapDialog(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          {/* Map Content */}
          <div className="flex-1 p-4">
            <div className="h-full rounded-lg overflow-hidden border">
              {towersWithCoordinates.length > 0 ? (
                <MapContainer
                  center={mapCenter}
                  zoom={mapZoom}
                  style={{ height: '100%', width: '100%' }}
                  className="z-10"
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  
                  {towersWithCoordinates.map((tower) => (
                    <Marker
                      key={tower.id}
                      position={[Number(tower.latitude), Number(tower.longitude)]}
                      eventHandlers={{
                        click: () => handleMarkerClick(tower)
                      }}
                    >
                      <Popup>
                        <div className="p-2 min-w-64">
                          <div className="font-bold text-blue-600 mb-2">
                            🏢 {tower.site_name}
                          </div>
                          
                          {tower.alamat_menara && (
                            <div className="text-sm text-gray-600 mb-2">
                              <strong>📍 Alamat:</strong><br />
                              {tower.alamat_menara}
                            </div>
                          )}
                          
                          <div className="text-sm text-gray-600 mb-2">
                            <strong>🗺️ Koordinat:</strong><br />
                            {Number(tower.latitude).toFixed(6)}, {Number(tower.longitude).toFixed(6)}
                          </div>
                          
                          {tower.tower_type && (
                            <div className="text-sm text-gray-600 mb-2">
                              <strong>🗼 Jenis Tower:</strong> {tower.tower_type}
                            </div>
                          )}
                          
                          {tower.tinggi_menara && (
                            <div className="text-sm text-gray-600 mb-2">
                              <strong>📏 Tinggi Menara:</strong> {tower.tinggi_menara}m
                            </div>
                          )}
                          
                          {tower.jumlah_pengguna && (
                            <div className="text-sm text-gray-600 mb-3">
                              <strong>👥 Jumlah Pengguna:</strong> {tower.jumlah_pengguna}
                            </div>
                          )}
                          
                          <button
                            onClick={() => handleMarkerClick(tower)}
                            className="w-full bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium"
                          >
                            ✓ Pilih Tower Ini
                          </button>
                        </div>
                      </Popup>
                    </Marker>
                  ))}
                </MapContainer>
              ) : (
                <div className="h-full bg-gray-100 flex items-center justify-center">
                  <div className="text-center text-gray-500">
                    <svg className="w-16 h-16 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6 4h6m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p>Tidak ada tower dengan koordinat yang tersedia</p>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Footer */}
          <div className="p-4 border-t bg-gray-50">
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-600">
                💡 Klik pada marker di peta atau tombol "Pilih Tower Ini" untuk memilih lokasi
              </div>
              <button
                onClick={() => setShowMapDialog(false)}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

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
    
    // Validasi khusus untuk nomor telepon
    if (name === 'telepon') {
      // Hanya izinkan angka, tanda +, dan tanda - di awal
      const cleanedValue = value.replace(/[^0-9+\-]/g, '');
      setForm(prev => ({ ...prev, [name]: cleanedValue }));
    } else {
      setForm(prev => ({ ...prev, [name]: value }));
    }
    
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

    // Count current files by type
    const currentImages = files.filter(file => file.type.startsWith('image/')).length;
    const currentVideos = files.filter(file => file.type.startsWith('video/')).length;
    
    // Check each file for type and size
    const allowedImageTypes = ['image/jpeg', 'image/png'];
    const allowedVideoTypes = ['video/mp4', 'video/quicktime', 'video/avi', 'video/x-msvideo', 'video/x-matroska'];
    const maxImageSize = 5 * 1024 * 1024; // 5MB
    const maxVideoSize = 50 * 1024 * 1024; // 50MB
    const newFiles: File[] = [];
    let newImageCount = 0;
    let newVideoCount = 0;

    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i];
      const isImage = file.type.startsWith('image/');
      const isVideo = file.type.startsWith('video/');
      
      if (isImage) {
        if (currentImages + newImageCount >= 3) {
          setErrorMessage('Maksimal 3 foto yang dapat diunggah');
          continue;
        }
        
        if (!allowedImageTypes.includes(file.type)) {
          setErrorMessage('Hanya file JPG dan PNG yang diizinkan untuk foto');
          continue;
        }
        
        if (file.size > maxImageSize) {
          setErrorMessage('Ukuran foto tidak boleh melebihi 5MB');
          continue;
        if (currentImages + newImageCount >= 3) {
          setErrorMessage('Maksimal 3 foto yang dapat diunggah');
          continue;
        }
        
        if (!allowedImageTypes.includes(file.type)) {
          setErrorMessage('Hanya file JPG dan PNG yang diizinkan untuk foto');
          continue;
        }
        
        if (file.size > maxImageSize) {
          setErrorMessage('Ukuran foto tidak boleh melebihi 5MB');
          continue;
        }
        
        newImageCount++;
      } else if (isVideo) {
        if (currentVideos + newVideoCount >= 2) {
          setErrorMessage('Maksimal 2 video yang dapat diunggah');
          continue;
        }
        
        if (!allowedVideoTypes.includes(file.type)) {
          setErrorMessage('Hanya file MP4, MOV, AVI, dan MKV yang diizinkan untuk video');
          continue;
        }
        
        if (file.size > maxVideoSize) {
          setErrorMessage('Ukuran video tidak boleh melebihi 50MB');
          continue;
        }
        
        newVideoCount++;
      } else {
        setErrorMessage('Hanya file foto (JPG, PNG) dan video (MP4, MOV, AVI, MKV) yang diizinkan');
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
    
    // Validasi format nomor telepon
    if (form.telepon) {
      const phoneRegex = /^[\+]?[0-9\-]{8,15}$/;
      if (!phoneRegex.test(form.telepon)) {
        setErrorMessage('Format nomor telepon tidak valid. Gunakan 8-15 digit angka');
        return;
      }
    }
    
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
    
    // Separate images and videos
    const images = files.filter(file => file.type.startsWith('image/'));
    const videos = files.filter(file => file.type.startsWith('video/'));
    
    // Append images with 'foto' field
    images.forEach((file, index) => {
      formData.append(`foto[${index}]`, file);
    });
    
    // Append videos with 'video' field
    videos.forEach((file, index) => {
      formData.append(`video[${index}]`, file);
    });
    
    // Submit using Inertia router
    router.post('/feedback', formData, {
      onSuccess: () => {
        setSuccessMessage('Masukan Anda telah berhasil dikirimkan');
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
    <MainLayout title="Form Masukan" currentPage="/feedback">
      <Head title="Form Masukan" />
      
      <div className="p-4 sm:p-6">
        <div className="rounded-lg shadow mb-8 px-4 sm:px-6 py-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3" style={{ backgroundColor: '#FFF8E1' }}>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold mb-1" style={{ color: '#212121' }}>
              Guest Feedback - Sampaikan Masukan Anda
            </h1>
            <p className="text-sm sm:text-base" style={{ color: '#212121', opacity: 0.85 }}>
              Silakan isi form di bawah ini untuk menyampaikan masukan atau saran terkait tower telekomunikasi
            </p>
          </div>
          <img src="/images/dprd-logo.png" alt="DPRD Kabupaten Semarang" className="h-8 w-8 sm:h-10 sm:w-10 hidden xs:block" />
        </div>
        
        <div className="bg-white rounded-lg shadow-md">
          <div className="p-4 sm:p-6">
            <h2 className="text-xl sm:text-2xl font-bold text-yellow-600 mb-6">Form Masukan</h2>
            
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
                
                <div>
                  <label className="block text-gray-700 font-medium mb-2">
                    No. Telepon <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="tel"
                    name="telepon"
                    value={form.telepon}
                    onChange={handleChange}
                    onInput={(e) => {
                      // Hanya izinkan angka, tanda +, dan tanda -
                      const target = e.target as HTMLInputElement;
                      target.value = target.value.replace(/[^0-9+\-]/g, '');
                    }}
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
                    Kategori Masukan <span className="text-red-600">*</span>
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
                      className={`w-full rounded-lg border ${validation.kategori ? 'border-red-500' : 'border-gray-300'} focus:outline-none focus-visible:outline-none focus:ring-2 focus:border-[#B71C1C] p-3`}
                      style={{ '--tw-ring-color': '#B71C1C', outline: 'none' } as React.CSSProperties}
                    >
                      <option value="">Pilih kategori</option>
                      <option value="Saran Perbaikan">Saran Perbaikan</option>
                      <option value="Usulan Fitur">Usulan Fitur</option>
                      <option value="Kritik Konstruktif">Kritik Konstruktif</option>
                      <option value="Apresiasi">Apresiasi</option>
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
                        placeholder="Masukkan kategori masukan lainnya"
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
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-gray-700 font-medium">
                    Lokasi Tower <span className="text-red-600">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowMapDialog(true)}
                    className="flex items-center gap-2 px-3 py-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Pilih dari Peta
                  </button>
                </div>
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
                  Upload Foto & Video (opsional)
                </label>
                <div className="flex items-center flex-wrap gap-3">
                  <label className="flex items-center justify-center px-4 py-2 bg-gray-200 text-gray-700 rounded-lg cursor-pointer hover:bg-gray-300">
                    <span>Pilih File</span>
                    <input 
                      type="file" 
                      accept=".jpg,.jpeg,.png,.mp4,.mov,.avi,.mkv" 
                      className="hidden" 
                      onChange={handleFileChange}
                      ref={fileInputRef}
                      multiple
                    />
                  </label>
                  <span className="text-gray-600">
                    {files.length > 0 ? (
                      <>
                        {files.filter(f => f.type.startsWith('image/')).length} foto, {files.filter(f => f.type.startsWith('video/')).length} video dipilih
                      </>
                    ) : (
                      'Belum ada file dipilih'
                    )}
                  </span>
                </div>
                <p className="text-gray-500 text-sm mt-2">
                  Format yang didukung:<br />
                  - Foto (JPG, PNG) maksimal 5MB per file - maksimal 3 foto.<br />
                  - Video (MP4, MOV, AVI, MKV) maksimal 50MB per file - maksimal 2 video.
                </p>
                
                {files.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-3">
                    {files.map((file, index) => (
                      <div key={index} className="relative">
                        <div className="w-20 h-20 rounded overflow-hidden border border-gray-300">
                          {file.type.startsWith('image/') ? (
                            <img 
                              src={URL.createObjectURL(file)} 
                              alt={`Preview ${index}`}
                              className="w-full h-full object-cover" 
                            />
                          ) : file.type.startsWith('video/') ? (
                            <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                              <div className="text-center">
                                <svg className="w-6 h-6 text-gray-500 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h6m-3 3v3m-2-6h4m-2 0V7a2 2 0 114 0v1" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                <span className="text-xs text-gray-500">VIDEO</span>
                              </div>
                            </div>
                          ) : null}
                        </div>
                        <div className="absolute -top-2 -right-2 flex gap-1">
                          <span className="bg-blue-500 text-white text-xs px-1 py-0.5 rounded">
                            {file.type.startsWith('image/') ? 'IMG' : 'VID'}
                          </span>
                          <button
                            type="button"
                            onClick={() => removeFile(index)}
                            className="bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                          >
                            ×
                          </button>
                        </div>
                        <div className="absolute -bottom-1 left-0 right-0 bg-black bg-opacity-75 text-white text-xs px-1 py-0.5 rounded-b truncate">
                          {file.name}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="mb-6">
                <label className="block text-gray-700 font-medium mb-2">
                  Pesan/Masukan <span className="text-red-600">*</span>
                </label>
                <textarea
                  name="pesan"
                  value={form.pesan}
                  onChange={handleChange}
                  className={`w-full rounded-lg border ${validation.pesan ? 'border-red-500' : 'border-gray-300'} focus:outline-none focus-visible:outline-none focus:ring-2 focus:border-[#B71C1C] p-3`}
                  style={{ '--tw-ring-color': '#B71C1C', outline: 'none' } as React.CSSProperties}
                  rows={6}
                  placeholder="Jelaskan masukan Anda secara detail..."
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
                  {isSubmitting ? 'Mengirim...' : 'Kirim Masukan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Map Dialog */}
      <MapDialog />
      
      <Footer />
    </MainLayout>
  );
}
