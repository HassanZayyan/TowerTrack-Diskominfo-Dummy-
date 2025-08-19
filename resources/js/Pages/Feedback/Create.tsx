import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import MainLayout from '@/Layouts/MainLayout';
import Footer from '@/Components/Footer';
import FileUpload from '@/Components/Feedback/FileUpload';
import TowerSearch from '@/Components/Feedback/TowerSearch';
import TowerMapDialog from '@/Components/Feedback/Map/TowerMapDialog';
import { useTowerFilter, useTowersWithCoordinates } from '@/Hooks/useTowerFilter';
import { validatePhoneNumber } from '@/utils/validationUtils';
import 'leaflet/dist/leaflet.css';

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

// Moved utility functions to @/utils/stringUtils.ts

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

  // Use our custom hooks for filtering towers
  const filteredTowers = useTowerFilter(towers, searchTerm);
  const towersWithCoordinates = useTowersWithCoordinates(towers) as typeof towers;

  // Handle tower selection from map
  const handleTowerMapSelection = (tower: any) => {
    const fullAddress = `${tower.site_name}${tower.alamat_menara ? ' - ' + tower.alamat_menara : ''}`;
    setForm(prev => ({
      ...prev,
      tower_id: String(tower.id),
      lokasi_tower: tower.site_name,
      lokasi_tower_display: fullAddress,
    }));
    
    if (validation.lokasi_tower) {
      setValidation(prev => ({ ...prev, lokasi_tower: false }));
    }
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
    
    setValidation(newValidation);
    
    if (Object.values(newValidation).some(Boolean)) {
      setErrorMessage('Silakan lengkapi semua field yang wajib diisi');
      return;
    }
    
    // Validasi format nomor telepon
    const phoneValidation = validatePhoneNumber(form.telepon);
    if (!phoneValidation.valid) {
      setErrorMessage(phoneValidation.message);
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
              
              <TowerSearch
                searchTerm={searchTerm}
                onSearchChange={handleSearchChange}
                onKeyDown={handleKeyDown}
                showDropdown={showDropdown}
                filteredTowers={filteredTowers}
                activeIndex={activeIndex}
                onSelectTower={selectTower}
                inputRef={inputRef}
                dropdownRef={dropdownRef}
                selectedTowerDisplay={form.lokasi_tower_display}
                onClearSelection={clearSelection}
                validation={validation.lokasi_tower}
                onShowMap={() => setShowMapDialog(true)}
              />
              
              <FileUpload
                files={files}
                onFileChange={handleFileChange}
                onRemoveFile={removeFile}
                fileInputRef={fileInputRef}
                errorMessage={errorMessage}
              />
              
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
      <TowerMapDialog 
        showMapDialog={showMapDialog}
        setShowMapDialog={setShowMapDialog}
        towersWithCoordinates={towersWithCoordinates}
        onSelectTower={handleTowerMapSelection}
      />
      
      <Footer />
    </MainLayout>
  );
}
