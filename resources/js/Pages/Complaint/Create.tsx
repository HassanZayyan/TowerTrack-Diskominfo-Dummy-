import React, { useState, useEffect, useCallback } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import MainLayout from '@/Layouts/MainLayout';

import TowerSelectionInput from '@/Components/Feedback/Map/TowerSelectionInput';
import FileUpload from '@/Components/FileUpload';
import AlertDialog from '@/Components/AlertDialog';
import { Tower as BaseTower } from '@/utils/searchUtils';
import { requestLocationAndValidate, requestUserLocationForReporting, hasValidTowerCoordinates } from '@/utils/locationUtils';

interface Tower extends BaseTower {
  latitude: number | string;
  longitude: number | string;
  tinggi_menara?: number;
  tinggi_bangunan?: number;
  jumlah_pengguna?: number;
  tower_type?: string;
  site_type?: string | null;
}

interface ComplaintCreateProps {
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
  is_public: false,
  reporter_latitude: '',
  reporter_longitude: '',
  reporter_accuracy: '',
};

const INITIAL_VALIDATION_STATE = {
  nama: false,
  telepon: false,
  kategori: false,
  lokasi_tower: false,
  pesan: false,
  email: false
};

export default function ComplaintCreate({ towers = [] }: ComplaintCreateProps) {
  const { auth } = usePage().props as any;
  const isStaff = !!(auth?.user && ['admin', 'operator'].includes(auth.user.role));
  const isComplainant = !!(auth?.user && auth.user.role === 'complainant');
  const isTowerOwner = !!(auth?.user && auth.user.role === 'tower_owner');
  const isAuthenticatedUser = isComplainant || isTowerOwner;
  
  const [form, setForm] = useState({
    ...INITIAL_FORM_STATE,
    nama: isAuthenticatedUser ? (auth?.user?.name || '') : INITIAL_FORM_STATE.nama,
    email: isAuthenticatedUser ? (auth?.user?.email || '') : INITIAL_FORM_STATE.email
  });
  const [validation, setValidation] = useState(INITIAL_VALIDATION_STATE);
  const [files, setFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isOtherCategory, setIsOtherCategory] = useState(false);
  
  // Redirect staff users immediately
  useEffect(() => {
    if (isStaff) {
      router.visit('/admin');
    }
  }, [isStaff]);
  
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

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const newValue = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
    setForm(prev => ({ ...prev, [name]: newValue }));
    
    // Clear validation error if typing
    if (validation[name as keyof typeof validation] !== undefined) {
      setValidation(prev => ({ ...prev, [name]: false }));
    }
  }, [validation]);

  const handleTowerSelect = useCallback((tower: Tower) => {
    const fullAddress = `${tower.site_name}${tower.alamat_menara ? ' - ' + tower.alamat_menara : ''}`;
    setForm((prev) => ({
      ...prev,
      tower_id: String(tower.id),
      lokasi_tower: tower.site_name,
      lokasi_tower_display: fullAddress,
    }));
    
    if (validation.lokasi_tower) {
      setValidation((prev) => ({ ...prev, lokasi_tower: false }));
    }
  }, [validation.lokasi_tower]);

  const handleTowerClear = useCallback(() => {
    setForm(prev => ({ 
      ...prev, 
      lokasi_tower: '', 
      lokasi_tower_display: '', 
      tower_id: '' 
    }));
  }, []);

  const handleFileError = useCallback((message: string) => {
    showErrorDialog('Error Upload File', message);
  }, [showErrorDialog]);

  const validateForm = useCallback(() => {
    const newValidation = {
      nama: isAuthenticatedUser ? false : !form.nama.trim(), // Skip name validation for authenticated users
      telepon: !form.telepon.trim(),
      kategori: !form.kategori.trim(),
      lokasi_tower: !form.lokasi_tower.trim(),
      pesan: !form.pesan.trim(),
      email: isAuthenticatedUser ? false : (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) // Email is now required for anonymous users
    };
    
    setValidation(newValidation);
    return !Object.values(newValidation).some(Boolean);
  }, [form, isAuthenticatedUser]);

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

  const resetForm = useCallback(() => {
    setForm({
      ...INITIAL_FORM_STATE,
      nama: isAuthenticatedUser ? (auth?.user?.name || '') : INITIAL_FORM_STATE.nama,
      email: isAuthenticatedUser ? (auth?.user?.email || '') : INITIAL_FORM_STATE.email
    });
    setFiles([]);
    setIsOtherCategory(false);
    setValidation(INITIAL_VALIDATION_STATE);
    setShowDialog(false);
  }, [isAuthenticatedUser, auth?.user?.name, auth?.user?.email]);

  const handleDialogClose = useCallback(() => {
    setShowDialog(false);
    // If it was a success dialog, reset the form
    if (dialogType === 'success') {
      resetForm();
    }
  }, [dialogType, resetForm]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!validateForm()) {
      showErrorDialog('Form Tidak Lengkap', 'Silakan lengkapi semua field yang wajib diisi dengan benar');
      return;
    }
    
    // Find selected tower to get coordinates
    const selectedTower = towers.find(tower => tower.id.toString() === form.tower_id);
    if (!selectedTower) {
      showErrorDialog('Data Tower Tidak Tersedia', 'Tower yang dipilih tidak ditemukan');
      return;
    }
    
    // Check if tower has valid coordinates
    const towerHasCoordinates = hasValidTowerCoordinates(selectedTower);
    
    setIsSubmitting(true);
    
    try {
      let locationValidation;
      let userLocationCaptured = false;
      let userLocationResult: Awaited<ReturnType<typeof requestUserLocationForReporting>> | undefined;
      
      // Always request user location for documentation and validation
      userLocationResult = await requestUserLocationForReporting();
      
      if (!userLocationResult.success) {
        let locationTitle = 'Lokasi Diperlukan';
        let locationMessage = userLocationResult.message;
        
        if (userLocationResult.message.includes('Izin lokasi ditolak')) {
          locationTitle = 'Izin Lokasi Diperlukan';
          locationMessage = 'Untuk mengirim keluhan, Anda perlu mengizinkan akses lokasi. Silakan aktifkan izin lokasi di browser dan coba lagi.';
        } else if (userLocationResult.message.includes('Waktu permintaan lokasi habis')) {
          locationTitle = 'Timeout Lokasi';
          locationMessage = 'Gagal mendapatkan lokasi dalam waktu yang ditentukan. Pastikan GPS aktif dan sinyal baik, lalu coba lagi.';
        } else if (userLocationResult.message.includes('tidak tersedia')) {
          locationTitle = 'Lokasi Tidak Tersedia';
          locationMessage = 'Informasi lokasi tidak dapat diperoleh. Pastikan GPS aktif dan coba lagi.';
        }
        
        showWarningDialog(locationTitle, locationMessage);
        setIsSubmitting(false);
        return;
      }
      
      // Store user location for documentation
      if (userLocationResult.coordinates) {
        const updatedForm = {
          ...form,
          reporter_latitude: userLocationResult.coordinates.latitude.toString(),
          reporter_longitude: userLocationResult.coordinates.longitude.toString(),
          reporter_accuracy: userLocationResult.accuracy?.toString() || ''
        };
        setForm(updatedForm);
      }
      
      userLocationCaptured = true;
      
      if (towerHasCoordinates) {
        // Additional validation against tower coordinates for distance check
        locationValidation = await requestLocationAndValidate({
          latitude: Number(selectedTower.latitude),
          longitude: Number(selectedTower.longitude)
        }, 1); // 1 km maximum distance
        
        if (!locationValidation.success) {
          // Provide more informative location error messages
          let locationTitle = 'Validasi Lokasi Gagal';
          let locationMessage = locationValidation.message;
          
          if (locationValidation.message.includes('terlalu jauh')) {
            locationTitle = 'Jarak Terlalu Jauh';
            locationMessage = `${locationValidation.message} Silakan mendekati tower atau hubungi admin jika Anda yakin berada di lokasi yang benar.`;
          } else {
            locationMessage = 'Gagal memvalidasi jarak ke tower. Silakan coba lagi.';
          }
          
          showWarningDialog(locationTitle, locationMessage);
          setIsSubmitting(false);
          return;
        }
      } else {
        // Tower has no coordinates, just log for documentation
        locationValidation = { success: true, message: 'Lokasi berhasil diperoleh untuk dokumentasi' };
      }
      
      // Create form data to handle file uploads
      const formData = new FormData();
      
      // Use the updated form data if coordinates were captured
      const formDataToUse = userLocationCaptured && userLocationResult?.coordinates ? {
        ...form,
        reporter_latitude: userLocationResult.coordinates.latitude.toString(),
        reporter_longitude: userLocationResult.coordinates.longitude.toString(),
        reporter_accuracy: userLocationResult.accuracy?.toString() || ''
      } : form;
      
      // Append form fields with trimmed values, excluding email for authenticated users
      Object.entries(formDataToUse).forEach(([key, value]) => {
        // Skip email field for authenticated users to avoid 'prohibited' validation error
        if (key === 'email' && isAuthenticatedUser) {
          return;
        }
        // For guests, email is now required
        if (key === 'email' && !isAuthenticatedUser) {
          const trimmed = (value as string).trim();
          formData.append('email', trimmed);
          return;
        }
        // Handle boolean values
        if (typeof value === 'boolean') {
          formData.append(key, value ? '1' : '0');
          return;
        }
        formData.append(key, typeof value === 'string' ? value.trim() : value);
      });
      
      // For authenticated users, use their authenticated name
      if (isAuthenticatedUser) {
        formData.set('nama', auth?.user?.name || '');
        // Don't set email field for authenticated users - backend will use user's email automatically
      }
      
      // Append files
      files.forEach((file, index) => {
        formData.append(`foto[${index}]`, file);
      });
      
      // Submit using Inertia router
      router.post('/complaint', formData, {
        onSuccess: () => {
          showSuccessDialog('Berhasil Dikirim', 'Keluhan Anda telah berhasil dikirimkan');
          // Don't reset form immediately, let user see the success message
        },
        onError: (errors: Record<string, string>) => {
          console.error('Form submission errors:', errors);
          
          // Handle specific validation errors with user-friendly messages
          let errorTitle = 'Gagal Mengirim';
          let errorMessage = '';
          
          if (errors.email && errors.email.includes('prohibited')) {
            errorTitle = 'Error Sistem';
            errorMessage = 'Terjadi kesalahan sistem. Silakan refresh halaman dan coba lagi.';
          } else if (errors.telepon) {
            errorTitle = 'Format Telepon Salah';
            errorMessage = 'Nomor telepon tidak valid. Pastikan menggunakan format yang benar (contoh: 08123456789).';
          } else if (errors.tower_id) {
            errorTitle = 'Tower Tidak Valid';
            errorMessage = 'Tower yang dipilih tidak valid. Silakan pilih tower yang tersedia.';
          } else if (errors.pesan) {
            errorTitle = 'Pesan Tidak Valid';
            errorMessage = 'Pesan terlalu panjang atau mengandung karakter yang tidak diizinkan.';
          } else if (errors['foto.0'] || errors['assets.0']) {
            errorTitle = 'File Tidak Valid';
            errorMessage = 'File yang diupload tidak valid. Pastikan file berformat JPG, PNG, atau MP4 dan ukuran maksimal 100MB.';
          } else {
            // Generic error message for other cases
            errorMessage = Object.values(errors).join('. ');
            if (errorMessage.length > 200) {
              errorMessage = 'Terjadi kesalahan validasi. Silakan periksa kembali data yang diisi.';
            }
          }
          
          showErrorDialog(errorTitle, errorMessage);
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

  // Don't render if user is staff (will be redirected)
  if (isStaff) return null;

  return (
    <MainLayout title="Form Keluhan" currentPage="/complaint">
      <Head title="Form Keluhan" />
      
      <div className="p-4 sm:p-6">
        <div 
          className="rounded-lg shadow mb-8 px-4 sm:px-6 py-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3" 
          style={{ backgroundColor: '#FFF8E1' }}
        >
          <div>
            <h1 className="text-xl sm:text-2xl font-bold mb-1" style={{ color: '#212121' }}>
              {isAuthenticatedUser ? 'Form Keluhan - Sampaikan Keluhan Anda' : 'Guest Complain - Sampaikan Keluhan Anda'}
            </h1>
            <p className="text-sm sm:text-base" style={{ color: '#212121', opacity: 0.85 }}>
              {isAuthenticatedUser 
                ? 'Silakan isi form di bawah ini untuk menyampaikan keluhan atau laporan terkait tower telekomunikasi'
                : 'Silakan isi form di bawah ini untuk menyampaikan keluhan atau laporan terkait tower telekomunikasi'
              }
            </p>
          </div>
          <img 
            src="/images/kab-smg-logo.png" 
            alt="Kabupaten Semarang" 
            className="h-8 w-8 sm:h-10 sm:w-10 hidden xs:block" 
          />
        </div>
        
        <div className="bg-white rounded-lg shadow-md">
          <div className="p-4 sm:p-6">
            <h2 className="text-xl sm:text-2xl font-bold text-yellow-600 mb-6">Form Keluhan</h2>
            
            {isAuthenticatedUser && (
              <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-yellow-800 text-sm">
                  <strong>Info:</strong> Nama dan email Anda akan otomatis digunakan dari akun yang terdaftar, tidak perlu mengisi field tersebut.
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
                    value={isAuthenticatedUser ? (auth?.user?.name || '') : form.nama}
                    onChange={handleChange}
                    className={`w-full rounded-lg border ${validation.nama ? 'border-red-500' : 'border-gray-300'} focus:outline-none focus:ring-2 focus:ring-red-800 focus:border-red-800 p-3 ${isAuthenticatedUser ? 'bg-gray-100' : ''}`}
                    placeholder="Masukkan nama lengkap"
                    maxLength={100}
                    readOnly={isAuthenticatedUser}
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
                
                {!isAuthenticatedUser && (
                  <div>
                    <label className="block text-gray-700 font-medium mb-2">
                      Email <span className="text-red-600">*</span>
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
                      <p className="text-red-500 text-sm mt-1">Email harus diisi dengan format yang valid</p>
                    )}
                  </div>
                )}
                
                <div className="md:col-span-2">
                  <label className="block text-gray-700 font-medium mb-3">
                    Visibilitas Laporan <span className="text-red-600">*</span>
                  </label>
                  <div className="flex flex-col sm:flex-row gap-4">
                    <label className="flex items-start sm:items-center p-4 border-2 rounded-lg cursor-pointer transition-all hover:bg-gray-50" style={{ borderColor: !form.is_public ? '#DC2626' : '#D1D5DB' }}>
                      <input
                        type="radio"
                        id="is_public_private"
                        name="is_public"
                        checked={!form.is_public}
                        onChange={() => setForm(prev => ({ ...prev, is_public: false }))}
                        className="mt-1 sm:mt-0"
                        style={{ accentColor: '#DC2626' }}
                      />
                      <div className="ml-3 flex-1">
                        <div className="font-medium text-gray-900">Tertutup (Private)</div>
                        <div className="text-sm text-gray-600 mt-1">
                          Hanya Anda dan admin yang dapat melihat keluhan ini. Gunakan email Anda untuk melacak status.
                        </div>
                      </div>
                    </label>
                    
                    <label className="flex items-start sm:items-center p-4 border-2 rounded-lg cursor-pointer transition-all hover:bg-gray-50" style={{ borderColor: form.is_public ? '#DC2626' : '#D1D5DB' }}>
                      <input
                        type="radio"
                        id="is_public_public"
                        name="is_public"
                        checked={form.is_public}
                        onChange={() => setForm(prev => ({ ...prev, is_public: true }))}
                        className="mt-1 sm:mt-0"
                        style={{ accentColor: '#DC2626' }}
                      />
                      <div className="ml-3 flex-1">
                        <div className="font-medium text-gray-900">Terbuka (Public)</div>
                        <div className="text-sm text-gray-600 mt-1">
                          Keluhan dapat dilihat oleh pengguna lain. Membantu transparansi dan berbagi informasi.
                        </div>
                      </div>
                    </label>
                  </div>
                </div>
                
                <div>
                  <label className="block text-gray-700 font-medium mb-2">
                    Kategori Keluhan <span className="text-red-600">*</span>
                  </label>
                  {!isOtherCategory ? (
                    <select
                      name="kategori"
                      value={form.kategori}
                      onChange={handleCategoryChange}
                      className={`w-full rounded-lg border ${validation.kategori ? 'border-red-500' : 'border-gray-300'} focus:outline-none focus:ring-2 focus:ring-red-800 focus:border-red-800 text-base sm:text-sm p-3`}
                    >
                      <option value="">Pilih kategori</option>
                      <option value="Kerusakan">Kerusakan</option>
                      <option value="Gangguan Sinyal">Gangguan Sinyal</option>
                      <option value="Kebisingan">Kebisingan</option>
                      <option value="Lainnya">Lainnya</option>
                    </select>
                  ) : (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        name="kategori"
                        value={form.kategori}
                        onChange={handleChange}
                        className={`flex-1 rounded-lg border ${validation.kategori ? 'border-red-500' : 'border-gray-300'} focus:outline-none focus:ring-2 focus:ring-red-800 focus:border-red-800 p-3`}
                        placeholder="Masukkan kategori keluhan lainnya"
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
                onTowerSelect={handleTowerSelect}
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
                  Pesan/Keluhan <span className="text-red-600">*</span>
                </label>
                <textarea
                  name="pesan"
                  value={form.pesan}
                  onChange={handleChange}
                  className={`w-full rounded-lg border ${validation.pesan ? 'border-red-500' : 'border-gray-300'} focus:outline-none focus:ring-2 focus:ring-red-800 focus:border-red-800 p-3 resize-vertical`}
                  rows={6}
                  placeholder="Jelaskan keluhan Anda secara detail..."
                  maxLength={1000}
                  minLength={10}
                />
                {validation.pesan && (
                  <p className="text-red-500 text-sm mt-1">Pesan harus diisi</p>
                )}
                <p className="text-gray-500 text-sm mt-1">
                  {form.pesan.length}/1000 karakter
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
                  {isSubmitting ? 'Mengirim...' : 'Kirim Keluhan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
      

      
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