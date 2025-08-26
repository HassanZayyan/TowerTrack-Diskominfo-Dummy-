import React, { useState, useCallback } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import MainLayout from '@/Layouts/MainLayout';
import Footer from '@/Components/Footer';
import FileUpload from '@/Components/FileUpload';
import TowerSelectionInput from '@/Components/Feedback/Map/TowerSelectionInput';
import AlertDialog from '@/Components/AlertDialog';

import { validatePhoneNumber } from '@/utils/validationUtils';
import { requestLocationAndValidate } from '@/utils/locationUtils';
import 'leaflet/dist/leaflet.css';

interface Tower {
  id: number;
  site_name: string;
  alamat_menara?: string;
  latitude: number | string;
  longitude: number | string;
  tinggi_menara?: number;
  tinggi_bangunan?: number;
  jumlah_pengguna?: number;
  tower_type?: string;
  site_type?: string | null;
}

interface FeedbackCreateProps {
  towers: Tower[];
}

const INITIAL_FORM_STATE = {
  nama: '',
  telepon: '',
  kategori: '',
  lokasi_tower: '',
  lokasi_tower_display: '',
  tower_id: '',
  pesan: '',
  email: '',
};

const INITIAL_VALIDATION_STATE = {
  nama: false,
  telepon: false,
  kategori: false,
  lokasi_tower: false,
  pesan: false,
  email: false
};

const FEEDBACK_CATEGORIES = [
  'Saran Perbaikan',
  'Usulan Fitur',
  'Kritik Konstruktif',
  'Apresiasi',
  'Lainnya'
] as const;

const MAX_MESSAGE_LENGTH = 1000;
const MAX_DISTANCE_KM = 1;

export default function FeedbackCreate({ towers }: FeedbackCreateProps) {
  const { errors, flash, auth } = usePage().props as any;
  const isComplainant = !!(auth?.user && auth.user.role === 'complainant');
  
  const [form, setForm] = useState({
    ...INITIAL_FORM_STATE,
    nama: isComplainant ? (auth?.user?.name || '') : INITIAL_FORM_STATE.nama
  });
  const [validation, setValidation] = useState(INITIAL_VALIDATION_STATE);
  const [files, setFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isOtherCategory, setIsOtherCategory] = useState(false);
  
  // Dialog states
  const [showDialog, setShowDialog] = useState(false);
  const [dialogType, setDialogType] = useState<'success' | 'error' | 'warning'>('error');
  const [dialogTitle, setDialogTitle] = useState('');
  const [dialogMessage, setDialogMessage] = useState('');

  // Memoized dialog handlers
  const showErrorDialog = useCallback((title: string, message: string) => {
    setDialogType('error');
    setDialogTitle(title);
    setDialogMessage(message);
    setShowDialog(true);
  }, []);

  const showSuccessDialog = useCallback((title: string, message: string) => {
    setDialogType('success');
    setDialogTitle(title);
    setDialogMessage(message);
    setShowDialog(true);
  }, []);

  const showWarningDialog = useCallback((title: string, message: string) => {
    setDialogType('warning');
    setDialogTitle(title);
    setDialogMessage(message);
    setShowDialog(true);
  }, []);

  // Handle tower selection (both from search and map)
  const handleTowerSelection = useCallback((tower: Tower) => {
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
  }, [validation.lokasi_tower]);

  // Handle clear tower selection
  const handleTowerClear = useCallback(() => {
    setForm(prev => ({ 
      ...prev, 
      lokasi_tower: '', 
      lokasi_tower_display: '', 
      tower_id: '' 
    }));
  }, []);

  const sanitizePhoneNumber = useCallback((value: string): string => {
    // Only allow numbers, + and - at the beginning
    return value.replace(/[^0-9+\-]/g, '').slice(0, 15);
  }, []);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    let processedValue = value;
    
    // Special validation for phone number
    if (name === 'telepon') {
      processedValue = sanitizePhoneNumber(value);
    }
    
    // Limit message length
    if (name === 'pesan' && value.length > MAX_MESSAGE_LENGTH) {
      return;
    }
    
    setForm(prev => ({ ...prev, [name]: processedValue }));
    
    // Clear validation error if typing
    if (validation[name as keyof typeof validation] !== undefined) {
      setValidation(prev => ({ ...prev, [name]: false }));
    }
  }, [validation, sanitizePhoneNumber]);

  const handleCategoryChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (value === "Lainnya") {
      setIsOtherCategory(true);
      setForm(prev => ({ ...prev, kategori: "" }));
    } else {
      handleChange(e);
    }
  }, [handleChange]);

  const handleCancelOtherCategory = useCallback(() => {
    setIsOtherCategory(false);
    setForm(prev => ({ ...prev, kategori: "" }));
  }, []);

  const validateForm = useCallback(() => {
    const newValidation = {
      nama: isComplainant ? false : !form.nama.trim(), // Skip name validation for complainant users
      telepon: !form.telepon.trim(),
      kategori: !form.kategori.trim(),
      lokasi_tower: !form.lokasi_tower.trim(),
      pesan: !form.pesan.trim() || form.pesan.trim().length < 10,
      email: isComplainant ? false : (form.email ? !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim()) : false) // Skip email validation for complainant users
    };
    
    setValidation(newValidation);
    return !Object.values(newValidation).some(Boolean);
  }, [form, isComplainant]);

  const resetForm = useCallback(() => {
    setForm({
      ...INITIAL_FORM_STATE,
      nama: isComplainant ? (auth?.user?.name || '') : INITIAL_FORM_STATE.nama
    });
    setFiles([]);
    setIsOtherCategory(false);
    setValidation(INITIAL_VALIDATION_STATE);
    setShowDialog(false);
  }, [isComplainant, auth?.user?.name]);

  const handleDialogClose = useCallback(() => {
    setShowDialog(false);
    // If it was a success dialog, reset the form
    if (dialogType === 'success') {
      resetForm();
    }
  }, [dialogType, resetForm]);

  const handleFileError = useCallback((message: string) => {
    showErrorDialog('Error Upload File', message);
  }, [showErrorDialog]);

  const createFormData = useCallback((): FormData => {
    const formData = new FormData();
    
    // Map form field names to controller expected names
    formData.append('sender_name', isComplainant ? (auth?.user?.name || '') : form.nama.trim());
    formData.append('sender_phone', form.telepon.trim());
    formData.append('category', form.kategori.trim());
    formData.append('tower_id', form.tower_id);
    formData.append('message', form.pesan.trim());
    
    // Only append email if provided and user is not complainant
    if (!isComplainant && form.email.trim()) {
      formData.append('email', form.email.trim());
    }
    
    // Separate images and videos for better organization
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
    
    return formData;
  }, [form, files, isComplainant, auth?.user?.name]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!validateForm()) {
      showErrorDialog('Form Tidak Lengkap', 'Silakan lengkapi semua field yang wajib diisi dengan benar');
      return;
    }
    
    // Validate phone number format
    const phoneValidation = validatePhoneNumber(form.telepon);
    if (!phoneValidation.valid) {
      showErrorDialog('Format Telepon Salah', phoneValidation.message);
      return;
    }
    
    // Find selected tower to get coordinates
    const selectedTower = towers.find(tower => tower.id.toString() === form.tower_id);
    if (!selectedTower || !selectedTower.latitude || !selectedTower.longitude) {
      showErrorDialog('Data Tower Tidak Tersedia', 'Data koordinat tower tidak tersedia');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Validate location distance
      const locationValidation = await requestLocationAndValidate({
        latitude: Number(selectedTower.latitude),
        longitude: Number(selectedTower.longitude)
      }, MAX_DISTANCE_KM);
      
      if (!locationValidation.success) {
        showWarningDialog('Jarak Terlalu Jauh', locationValidation.message);
        setIsSubmitting(false);
        return;
      }
      
      // Create and submit form data
      const formData = createFormData();
      
      // Submit using Inertia router
      router.post('/feedback', formData, {
        onSuccess: () => {
          showSuccessDialog('Berhasil Dikirim', 'Masukan Anda telah berhasil dikirimkan');
          // Don't reset form immediately, let user see the success message
        },
        onError: (errors: Record<string, string>) => {
          const errorMessage = Object.values(errors).join(', ');
          showErrorDialog('Gagal Mengirim', errorMessage);
        },
        onFinish: () => {
          setIsSubmitting(false);
        }
      });
    } catch (error) {
      console.error('Location validation error:', error);
      showErrorDialog('Error Validasi Lokasi', 'Terjadi kesalahan saat memvalidasi lokasi');
      setIsSubmitting(false);
    }
  };

  return (
    <MainLayout title="Form Masukan" currentPage="/feedback">
      <Head title="Form Masukan" />
      
      <div className="p-4 sm:p-6">
        <div 
          className="rounded-lg shadow mb-8 px-4 sm:px-6 py-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3" 
          style={{ backgroundColor: '#FFF8E1' }}
        >
          <div>
            <h1 className="text-xl sm:text-2xl font-bold mb-1" style={{ color: '#212121' }}>
              {isComplainant ? 'Form Masukan - Sampaikan Masukan Anda' : 'Guest Feedback - Sampaikan Masukan Anda'}
            </h1>
            <p className="text-sm sm:text-base" style={{ color: '#212121', opacity: 0.85 }}>
              {isComplainant 
                ? 'Silakan isi form di bawah ini untuk menyampaikan masukan atau saran terkait tower telekomunikasi'
                : 'Silakan isi form di bawah ini untuk menyampaikan masukan atau saran terkait tower telekomunikasi'
              }
            </p>
          </div>
          <img 
            src="/images/dprd-logo.png" 
            alt="DPRD Kabupaten Semarang" 
            className="h-8 w-8 sm:h-10 sm:w-10 hidden xs:block" 
          />
        </div>
        
        <div className="bg-white rounded-lg shadow-md">
          <div className="p-4 sm:p-6">
            <h2 className="text-xl sm:text-2xl font-bold text-yellow-600 mb-6">Form Masukan</h2>
            
            {isComplainant && (
              <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-blue-800 text-sm">
                  <strong>Info:</strong> Email Anda akan otomatis digunakan dari akun yang terdaftar, tidak perlu mengisi field email.
                </p>
              </div>
            )}
            
            <form onSubmit={handleSubmit} noValidate>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-6">
                <div>
                  <label className="block text-gray-700 font-medium mb-2">
                    Nama Lengkap <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    name="nama"
                    value={isComplainant ? (auth?.user?.name || '') : form.nama}
                    onChange={handleChange}
                    className={`w-full rounded-lg border ${validation.nama ? 'border-red-500' : 'border-gray-300'} focus:outline-none focus:ring-2 focus:ring-red-800 focus:border-red-800 p-3 ${isComplainant ? 'bg-gray-100' : ''}`}
                    placeholder="Masukkan nama lengkap"
                    maxLength={100}
                    readOnly={isComplainant}
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
                    className={`w-full rounded-lg border ${validation.telepon ? 'border-red-500' : 'border-gray-300'} focus:outline-none focus:ring-2 focus:ring-red-800 focus:border-red-800 p-3`}
                    placeholder="Masukkan nomor telepon"
                    maxLength={15}
                  />
                  {validation.telepon && (
                    <p className="text-red-500 text-sm mt-1">Nomor telepon harus diisi</p>
                  )}
                </div>
                
                {!isComplainant && (
                  <div>
                    <label className="block text-gray-700 font-medium mb-2">
                      Email <span className="text-gray-500">(Opsional)</span>
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={form.email}
                      onChange={handleChange}
                      className={`w-full rounded-lg border ${validation.email ? 'border-red-500' : 'border-gray-300'} focus:outline-none focus:ring-2 focus:ring-red-800 focus:border-red-800 p-3`}
                      placeholder="Masukkan email (untuk melacak status)"
                      maxLength={100}
                    />
                    {validation.email && (
                      <p className="text-red-500 text-sm mt-1">Format email tidak valid</p>
                    )}
                  </div>
                )}
                
                <div>
                  <label className="block text-gray-700 font-medium mb-2">
                    Kategori Masukan <span className="text-red-600">*</span>
                  </label>
                  {!isOtherCategory ? (
                    <select
                      name="kategori"
                      value={form.kategori}
                      onChange={handleCategoryChange}
                      className={`w-full rounded-lg border ${validation.kategori ? 'border-red-500' : 'border-gray-300'} focus:outline-none focus:ring-2 focus:ring-red-800 focus:border-red-800 text-base sm:text-sm p-3`}
                    >
                      <option value="">Pilih kategori</option>
                      {FEEDBACK_CATEGORIES.map(category => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        name="kategori"
                        value={form.kategori}
                        onChange={handleChange}
                        className={`flex-1 rounded-lg border ${validation.kategori ? 'border-red-500' : 'border-gray-300'} focus:outline-none focus:ring-2 focus:ring-red-800 focus:border-red-800 p-3`}
                        placeholder="Masukkan kategori masukan lainnya"
                        maxLength={50}
                      />
                      <button
                        type="button"
                        onClick={handleCancelOtherCategory}
                        className="px-3 py-2 rounded-lg hover:opacity-90 text-white bg-gray-600"
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
              
              <TowerSelectionInput
                towers={towers}
                selectedTowerId={form.tower_id}
                selectedTowerDisplay={form.lokasi_tower_display}
                onTowerSelect={handleTowerSelection}
                onClear={handleTowerClear}
                label="Lokasi Tower"
                required={true}
                error={validation.lokasi_tower}
                errorMessage="Lokasi tower harus dipilih"
                className="mb-6"
              />
              
              <FileUpload
                files={files}
                onFilesChange={setFiles}
                onError={handleFileError}
                className="mb-6"
              />
              
              <div className="mb-6">
                <label className="block text-gray-700 font-medium mb-2">
                  Pesan/Masukan <span className="text-red-600">*</span>
                </label>
                <textarea
                  name="pesan"
                  value={form.pesan}
                  onChange={handleChange}
                  className={`w-full rounded-lg border ${validation.pesan ? 'border-red-500' : 'border-gray-300'} focus:outline-none focus:ring-2 focus:ring-red-800 focus:border-red-800 p-3 resize-vertical`}
                  rows={6}
                  placeholder="Jelaskan masukan Anda secara detail... (minimal 10 karakter)"
                  maxLength={MAX_MESSAGE_LENGTH}
                  minLength={10}
                />
                {validation.pesan && (
                  <p className="text-red-500 text-sm mt-1">
                    Pesan harus diisi dengan minimal 10 karakter
                  </p>
                )}
                <p className="text-gray-500 text-sm mt-1">
                  {form.pesan.length}/{MAX_MESSAGE_LENGTH} karakter
                </p>
              </div>
              
              <div className="flex items-center justify-start gap-3 sm:gap-4 flex-wrap">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-6 py-3 border border-gray-400 rounded-lg hover:bg-gray-100 text-gray-700 transition-colors"
                  disabled={isSubmitting}
                >
                  Reset
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 font-medium rounded-lg hover:opacity-90 text-white bg-red-800 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Mengirim...' : 'Kirim Masukan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
      
      <Footer />
      
      <AlertDialog
        show={showDialog}
        onClose={handleDialogClose}
        type={dialogType}
        title={dialogTitle}
        message={dialogMessage}
      />
    </MainLayout>
  );
}