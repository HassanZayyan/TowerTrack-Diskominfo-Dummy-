import React, { useState, useEffect, useCallback } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import MainLayout from '@/Layouts/MainLayout';
import Footer from '@/Components/Footer';
import TowerSelectionInput from '@/Components/Feedback/Map/TowerSelectionInput';
import FileUpload from '@/Components/FileUpload';
import AlertDialog from '@/Components/AlertDialog';
import { Tower as BaseTower } from '@/utils/searchUtils';
import { requestLocationAndValidate } from '@/utils/locationUtils';

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
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    
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
      email: isAuthenticatedUser ? false : (form.email ? !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email) : false) // Skip email validation for authenticated users
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
      }, 1); // 1 km maximum distance
      
      if (!locationValidation.success) {
        showWarningDialog('Jarak Terlalu Jauh', locationValidation.message);
        setIsSubmitting(false);
        return;
      }
      
      // Create form data to handle file uploads
      const formData = new FormData();
      
      // Append form fields with trimmed values, excluding email for authenticated users
      Object.entries(form).forEach(([key, value]) => {
        // Skip email field for authenticated users
        if (key === 'email' && isAuthenticatedUser) {
          return;
        }
        formData.append(key, typeof value === 'string' ? value.trim() : value);
      });
      
      // For authenticated users, use their authenticated name and email
      if (isAuthenticatedUser) {
        formData.set('nama', auth?.user?.name || '');
        if (auth?.user?.email) {
          formData.set('email', auth.user.email);
        }
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