import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import MainLayout from '@/Layouts/MainLayout';
import Footer from '@/Components/Footer';

interface FeedbackCreateProps {
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

function highlightText(text: string, query: string) {
  if (!query || !text) return text;
  
  const normalizedText = normalizeText(text);
  const normalizedQuery = normalizeText(query);
  const queryWords = normalizedQuery.split(/\s+/).filter(word => word.length > 0);
  
  if (queryWords.length === 0) return text;
  
  const matches: Array<{start: number, end: number, word: string}> = [];
  
  queryWords.forEach(queryWord => {
    if (queryWord.length > 0) {
      const index = normalizedText.indexOf(queryWord);
      if (index !== -1) {
        matches.push({
          start: index,
          end: index + queryWord.length,
          word: queryWord
        });
      }
    }
  });
  
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
  
  const [formData, setFormData] = useState({
    sender_phone: '',
    category: '',
    tower_id: '',
    message: '',
    assets: [] as File[]
  });
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTowerName, setSelectedTowerName] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewImages, setPreviewImages] = useState<string[]>([]);
  const [previewVideos, setPreviewVideos] = useState<string[]>([]);
  
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Smart search function
  const searchTowers = useCallback((query: string) => {
    if (!query || query.length < 1) return [];
    
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
      
      let score = 0;
      let matchType = '';
      let matchedText = '';
      let matchFound = false;

      // EXACT MATCH
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
      
      // STARTS WITH
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
      
      // WORD-LEVEL MATCHING
      else {
        let nameWordMatches = 0;
        let addressWordMatches = 0;
        
        queryWords.forEach(queryWord => {
          if (normalizedSiteName.includes(queryWord)) nameWordMatches++;
          if (normalizedAddress.includes(queryWord)) addressWordMatches++;
        });
        
        if (nameWordMatches > 0) {
          score = 6000 + (nameWordMatches / queryWords.length) * 1000;
          matchType = 'word_match_name';
          matchedText = siteName;
          matchFound = true;
        }
        else if (addressWordMatches > 0) {
          score = 5000 + (addressWordMatches / queryWords.length) * 1000;
          matchType = 'word_match_address';
          matchedText = address;
          matchFound = true;
        }
        
        // SIMILARITY MATCHING (Fuzzy)
        else {
          const nameSimilarity = getSimilarityScore(normalizedSiteName, normalizedQuery);
          const addressSimilarity = getSimilarityScore(normalizedAddress, normalizedQuery);
          
          if (nameSimilarity > 0.6) {
            score = 2000 + nameSimilarity * 1000;
            matchType = 'similarity_name';
            matchedText = siteName;
            matchFound = true;
          }
          else if (addressSimilarity > 0.6) {
            score = 1000 + addressSimilarity * 1000;
            matchType = 'similarity_address';
            matchedText = address;
            matchFound = true;
          }
        }
      }

      if (matchFound) {
        results.push({ tower, score, matchType, matchedText });
      }
    }

    return results
      .sort((a, b) => b.score - a.score)
      .slice(0, 50);
  }, [towers]);

  const filteredTowers = useMemo(() => {
    return searchTowers(searchQuery);
  }, [searchQuery, searchTowers]);

  const handleTowerSelect = (tower: any) => {
    setFormData(prev => ({ ...prev, tower_id: tower.id.toString() }));
    setSelectedTowerName(tower.site_name);
    setSearchQuery(tower.site_name);
    setShowDropdown(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter(file => {
      const isImage = file.type.startsWith('image/');
      const isVideo = file.type.startsWith('video/');
      const isValidSize = file.size <= 20 * 1024 * 1024; // 20MB
      return (isImage || isVideo) && isValidSize;
    });

    setFormData(prev => ({ ...prev, assets: [...prev.assets, ...validFiles] }));

    // Create previews
    validFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        if (file.type.startsWith('image/')) {
          setPreviewImages(prev => [...prev, result]);
        } else if (file.type.startsWith('video/')) {
          setPreviewVideos(prev => [...prev, result]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const removeFile = (index: number) => {
    const removedFile = formData.assets[index];
    const newAssets = formData.assets.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, assets: newAssets }));

    // Remove preview
    if (removedFile.type.startsWith('image/')) {
      setPreviewImages(prev => prev.filter((_, i) => i !== index));
    } else if (removedFile.type.startsWith('video/')) {
      setPreviewVideos(prev => prev.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const formDataToSend = new FormData();
    formDataToSend.append('sender_phone', formData.sender_phone);
    formDataToSend.append('category', formData.category);
    formDataToSend.append('tower_id', formData.tower_id);
    formDataToSend.append('message', formData.message);
    
    formData.assets.forEach((file, index) => {
      formDataToSend.append(`assets[${index}]`, file);
    });

    router.post('/feedback', formDataToSend, {
      onFinish: () => setIsSubmitting(false),
      onSuccess: () => {
        setFormData({
          sender_phone: '',
          category: '',
          tower_id: '',
          message: '',
          assets: []
        });
        setSelectedTowerName('');
        setSearchQuery('');
        setPreviewImages([]);
        setPreviewVideos([]);
      }
    });
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <MainLayout>
      <Head title="Kirim Masukan" />
      
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
              <div className="bg-gradient-to-r from-blue-600 to-green-600 px-8 py-6">
                <h1 className="text-2xl font-bold text-white flex items-center">
                  <svg className="w-8 h-8 mr-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  Kirim Masukan
                </h1>
                <p className="text-blue-100 mt-2">
                  Sampaikan masukan Anda mengenai menara telekomunikasi
                </p>
              </div>

              {flash?.success && (
                <div className="mx-8 mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center">
                    <svg className="w-5 h-5 text-green-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <p className="text-green-800">{flash.success}</p>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="p-8">
                <div className="space-y-6">
                  {/* Phone Number */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nomor Telepon *
                    </label>
                    <input
                      type="tel"
                      value={formData.sender_phone}
                      onChange={(e) => setFormData(prev => ({ ...prev, sender_phone: e.target.value }))}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.sender_phone ? 'border-red-300' : 'border-gray-300'}`}
                      placeholder="Contoh: 08123456789"
                      required
                    />
                    {errors.sender_phone && (
                      <p className="text-red-600 text-sm mt-1">{errors.sender_phone}</p>
                    )}
                  </div>

                  {/* Category */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Kategori Masukan *
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.category ? 'border-red-300' : 'border-gray-300'}`}
                      required
                    >
                      <option value="">Pilih Kategori</option>
                      <option value="Saran Perbaikan">Saran Perbaikan</option>
                      <option value="Usulan Fitur">Usulan Fitur</option>
                      <option value="Kritik Konstruktif">Kritik Konstruktif</option>
                      <option value="Apresiasi">Apresiasi</option>
                      <option value="Lainnya">Lainnya</option>
                    </select>
                    {errors.category && (
                      <p className="text-red-600 text-sm mt-1">{errors.category}</p>
                    )}
                  </div>

                  {/* Tower Search */}
                  <div className="relative" ref={dropdownRef}>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Lokasi Menara *
                    </label>
                    <input
                      ref={searchInputRef}
                      type="text"
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setShowDropdown(true);
                        if (!e.target.value) {
                          setFormData(prev => ({ ...prev, tower_id: '' }));
                          setSelectedTowerName('');
                        }
                      }}
                      onFocus={() => setShowDropdown(true)}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.tower_id ? 'border-red-300' : 'border-gray-300'}`}
                      placeholder="Ketik nama atau lokasi menara..."
                      required
                    />
                    
                    {showDropdown && filteredTowers.length > 0 && (
                      <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                        {filteredTowers.slice(0, 10).map((result) => (
                          <div
                            key={result.tower.id}
                            onClick={() => handleTowerSelect(result.tower)}
                            className="px-4 py-3 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                          >
                            <div className="font-medium text-gray-900">
                              {highlightText(result.tower.site_name, searchQuery)}
                            </div>
                            {result.tower.alamat_menara && (
                              <div className="text-sm text-gray-600 mt-1">
                                {highlightText(result.tower.alamat_menara, searchQuery)}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                    {errors.tower_id && (
                      <p className="text-red-600 text-sm mt-1">{errors.tower_id}</p>
                    )}
                  </div>

                  {/* Message */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Pesan Masukan *
                    </label>
                    <textarea
                      value={formData.message}
                      onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                      rows={6}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none ${errors.message ? 'border-red-300' : 'border-gray-300'}`}
                      placeholder="Tuliskan masukan Anda dengan jelas dan detail..."
                      required
                    />
                    <div className="text-sm text-gray-500 mt-1">
                      {formData.message.length}/1000 karakter
                    </div>
                    {errors.message && (
                      <p className="text-red-600 text-sm mt-1">{errors.message}</p>
                    )}
                  </div>

                  {/* File Upload */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Lampiran (Opsional)
                    </label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                      <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        accept="image/*,video/*"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                      <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                        <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      <div className="mt-4">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="text-blue-600 hover:text-blue-700 font-medium"
                        >
                          Klik untuk upload
                        </button>
                        <p className="text-gray-500 text-sm mt-1">
                          Foto atau video, maksimal 20MB per file
                        </p>
                      </div>
                    </div>

                    {/* File Previews */}
                    {(previewImages.length > 0 || previewVideos.length > 0) && (
                      <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-4">
                        {previewImages.map((preview, index) => (
                          <div key={`img-${index}`} className="relative">
                            <img src={preview} alt={`Preview ${index + 1}`} className="w-full h-24 object-cover rounded-lg" />
                            <button
                              type="button"
                              onClick={() => removeFile(index)}
                              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                        {previewVideos.map((preview, index) => (
                          <div key={`vid-${index}`} className="relative">
                            <video src={preview} className="w-full h-24 object-cover rounded-lg" />
                            <button
                              type="button"
                              onClick={() => removeFile(previewImages.length + index)}
                              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Submit Button */}
                  <div className="pt-4">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full bg-gradient-to-r from-blue-600 to-green-600 text-white py-3 px-6 rounded-lg font-medium hover:from-blue-700 hover:to-green-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                    >
                      {isSubmitting ? (
                        <div className="flex items-center justify-center">
                          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Mengirim...
                        </div>
                      ) : (
                        'Kirim Masukan'
                      )}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
      
      <Footer />
    </MainLayout>
  );
}
