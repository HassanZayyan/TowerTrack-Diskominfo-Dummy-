import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import MainLayout from '@/Layouts/MainLayout';

import FileUpload from '@/Components/FileUpload';
import LocationSelectionInput from '@/Components/LocationSelectionInput';
import AlertDialog from '@/Components/AlertDialog';
import PageHeader from '@/Components/PageHeader';
import AnimatedButton from '@/Components/AnimatedButton';
import TurnstileCaptcha, { TurnstileCaptchaRef } from '@/Components/TurnstileCaptcha';

import { validatePhoneNumber } from '@/utils/validationUtils';
import { requestLocationAndValidate, requestUserLocationForReporting, hasValidTowerCoordinates, getLocationForAccountSwitching } from '@/utils/locationUtils';
import { handlePrivateSelection, restoreFormState, shouldSelectPrivate } from '@/utils/privateMessageUtils';
import { Tower, FoPoint, LocationType } from '@/types/messages';
import 'leaflet/dist/leaflet.css';

interface TowerWithCoords extends Tower {
  latitude: number | string;
  longitude: number | string;
  tinggi_menara?: number;
  tinggi_bangunan?: number;
  jumlah_pengguna?: number;
  tower_type?: string;
  site_type?: string | null;
}

interface FoPointWithCoords extends FoPoint {
  latitude: number | string;
  longitude: number | string;
}

interface FeedbackCreateProps {
  towers: TowerWithCoords[];
  foPoints?: FoPointWithCoords[];
}

const INITIAL_FORM_STATE = {
  nama: '',
  telepon: '',
  kategori: '',
  lokasi_tower: '',
  lokasi_tower_display: '',
  feedbackable_type: '' as '' | 'App\\Models\\Tower' | 'App\\Models\\FoPoint',
  feedbackable_id: '',
  pesan: '',
  email: '',
  is_public: true,
  reporter_latitude: '',
  reporter_longitude: '',
  reporter_accuracy: '',
  location_type_filter: 'tower' as 'tower' | 'fo_point', // Filter untuk memilih tower atau FO point
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

export default function FeedbackCreate({ towers = [], foPoints = [] }: FeedbackCreateProps) {
  const { errors, auth, turnstileSiteKey } = usePage().props as any;
  const isComplainant = !!(auth?.user && auth.user.role === 'complainant');
  const isTowerOwner = !!(auth?.user && auth.user.role === 'tower_owner');
  const isProviderOwner = !!(auth?.user && auth.user.role === 'provider_owner');
  const isAuthenticatedUser = isComplainant || isTowerOwner || isProviderOwner;
  
  const [form, setForm] = useState({
    ...INITIAL_FORM_STATE,
    nama: isAuthenticatedUser ? (auth?.user?.name || '') : INITIAL_FORM_STATE.nama,
    email: isAuthenticatedUser ? (auth?.user?.email || '') : INITIAL_FORM_STATE.email
  });


  const [validation, setValidation] = useState(INITIAL_VALIDATION_STATE);
  const [files, setFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isOtherCategory, setIsOtherCategory] = useState(false);
  const [isAutoFilled, setIsAutoFilled] = useState(false);
  const [autoFilledLocationType, setAutoFilledLocationType] = useState<'tower' | 'fo_point' | null>(null);
  
  // CAPTCHA states
  const [captchaToken, setCaptchaToken] = useState<string>('');
  const captchaRef = useRef<TurnstileCaptchaRef>(null);

  // Restore form state after login/register
  useEffect(() => {
    if (isAuthenticatedUser) {
      const restoredState = restoreFormState();
      const shouldSelectPrivateFlag = shouldSelectPrivate();
      
      if (restoredState && restoredState.type === 'feedback') {
        // Restore form data
        setForm(prev => ({
          ...prev,
          ...restoredState.form,
          // Ensure private is selected if it was selected before or flag is set
          is_public: shouldSelectPrivateFlag ? false : (restoredState.form.is_public ?? false),
        }));
        
        // Restore files if any (Note: File objects can't be serialized, so this might need adjustment)
        if (restoredState.files && restoredState.files.length > 0) {
          // Files can't be restored from JSON, but we can show a message
          console.log('Form state restored. Please re-upload files if needed.');
        }
      } else if (shouldSelectPrivateFlag) {
        // If no restored state but private flag is set, just set private
        setForm(prev => ({ ...prev, is_public: false }));
      }
    }
  }, [isAuthenticatedUser]);
  
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


  const showWarningDialog = useCallback((title: string, message: string) => {
    setDialogType('warning');
    setDialogTitle(title);
    setDialogMessage(message);
    setShowDialog(true);
  }, []);

  // Handle location selection (both from search and map)
  const handleLocationSelect = useCallback((location: Tower | FoPoint, type: LocationType) => {
    let displayName = '';
    let feedbackableType: 'App\\Models\\Tower' | 'App\\Models\\FoPoint';
    
    if (type === 'tower') {
      const tower = location as TowerWithCoords;
      displayName = `${tower.site_name}${tower.alamat_menara ? ' - ' + tower.alamat_menara : ''}`;
      feedbackableType = 'App\\Models\\Tower';
    } else {
      const foPoint = location as FoPointWithCoords;
      displayName = `${foPoint.name}${foPoint.area ? ' - ' + foPoint.area : ''}${foPoint.route_name ? ' (' + foPoint.route_name + ')' : ''}`;
      feedbackableType = 'App\\Models\\FoPoint';
    }
    
    setForm(prev => ({
      ...prev,
      feedbackable_type: feedbackableType,
      feedbackable_id: String(location.id),
      lokasi_tower: type === 'tower' ? (location as Tower).site_name : (location as FoPoint).name,
      lokasi_tower_display: displayName,
    }));
    
    if (validation.lokasi_tower) {
      setValidation(prev => ({ ...prev, lokasi_tower: false }));
    }
  }, [validation]);

  // Handle clear location selection
  const handleLocationClear = useCallback(() => {
    setForm(prev => ({ 
      ...prev, 
      lokasi_tower: '', 
      lokasi_tower_display: '', 
      feedbackable_type: '' as '' | 'App\\Models\\Tower' | 'App\\Models\\FoPoint',
      feedbackable_id: '' 
    }));
  }, []);

  // Auto-fill tower or FO point data from URL parameters
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const towerId = urlParams.get('tower_id');
    const towerName = urlParams.get('tower_name');
    const foPointId = urlParams.get('fo_point_id');
    const foPointName = urlParams.get('fo_point_name');
    const locationType = urlParams.get('location_type');
    
    // Handle tower auto-fill
    // Check for tower: either with location_type='tower' or without location_type (backward compatibility)
    if (towerId && towerName && (locationType === 'tower' || !locationType)) {
      // Find the tower in the towers array to get complete data
      const selectedTower = towers.find(tower => tower.id.toString() === towerId);
      
      if (selectedTower) {
        // Use the handleLocationSelect function to properly set the form data
        handleLocationSelect(selectedTower, 'tower');
        setForm(prev => ({ ...prev, location_type_filter: 'tower' }));
        setIsAutoFilled(true);
        setAutoFilledLocationType('tower');
      } else {
        // If tower not found in array, still set basic info from URL params
        const decodedTowerName = decodeURIComponent(towerName);
        setForm(prev => ({
          ...prev,
          feedbackable_type: 'App\\Models\\Tower' as const,
          feedbackable_id: towerId,
          lokasi_tower: decodedTowerName,
          lokasi_tower_display: decodedTowerName,
          location_type_filter: 'tower',
        }));
        setIsAutoFilled(true);
        setAutoFilledLocationType('tower');
      }
    }
    
    // Handle FO point auto-fill
    if (foPointId && foPointName && locationType === 'fo_point') {
      // Find the FO point in the foPoints array to get complete data
      const selectedFoPoint = foPoints.find(point => point.id.toString() === foPointId);
      
      if (selectedFoPoint) {
        // Use the handleLocationSelect function to properly set the form data
        handleLocationSelect(selectedFoPoint, 'fo_point');
        setForm(prev => ({ ...prev, location_type_filter: 'fo_point' }));
        setIsAutoFilled(true);
        setAutoFilledLocationType('fo_point');
      } else {
        // If FO point not found in array, still set basic info from URL params
        const decodedFoPointName = decodeURIComponent(foPointName);
        setForm(prev => ({
          ...prev,
          feedbackable_type: 'App\\Models\\FoPoint' as const,
          feedbackable_id: foPointId,
          lokasi_tower: decodedFoPointName,
          lokasi_tower_display: decodedFoPointName,
          location_type_filter: 'fo_point',
        }));
        setIsAutoFilled(true);
        setAutoFilledLocationType('fo_point');
      }
    }
  }, [towers, foPoints, handleLocationSelect]); // Include dependencies

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
  }, []);

  const handleFileError = useCallback((message: string) => {
    showErrorDialog('Error Upload File', message);
  }, [showErrorDialog]);

  const createFormData = useCallback((updatedForm?: any): FormData => {
    const formData = new FormData();
    const formToUse = updatedForm || form;
    
    // Map form field names to controller expected names
    formData.append('sender_name', isAuthenticatedUser ? (auth?.user?.name || '') : formToUse.nama.trim());
    formData.append('sender_phone', formToUse.telepon.trim());
    formData.append('category', formToUse.kategori.trim());
    formData.append('feedbackable_type', formToUse.feedbackable_type);
    formData.append('feedbackable_id', formToUse.feedbackable_id);
    formData.append('message', formToUse.pesan.trim());
    
    // Append visibility (is_public)
    formData.append('is_public', formToUse.is_public ? '1' : '0');
    
    // Append coordinates if available
    if (formToUse.reporter_latitude && formToUse.reporter_longitude) {
      formData.append('reporter_latitude', formToUse.reporter_latitude);
      formData.append('reporter_longitude', formToUse.reporter_longitude);
      if (formToUse.reporter_accuracy) {
        formData.append('reporter_accuracy', formToUse.reporter_accuracy);
      }
    }
    
    // For anonymous users, email is now required
    if (!isAuthenticatedUser) {
      const trimmedEmail = formToUse.email.trim();
      formData.append('email', trimmedEmail);
    }
    // For authenticated users, don't send email field - backend will use user's email automatically
    
    // Append CAPTCHA token only for guest users
    if (!isAuthenticatedUser && captchaToken) {
      formData.append('cf-turnstile-response', captchaToken);
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
  }, [form, files, isAuthenticatedUser, auth?.user?.name, auth?.user?.email, captchaToken]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!validateForm()) {
      showErrorDialog('Form Tidak Lengkap', 'Silakan lengkapi semua field yang wajib diisi dengan benar');
      return;
    }

    // Validate private message access for guest users
    if (!form.is_public && !isAuthenticatedUser) {
      showErrorDialog(
        'Login Diperlukan', 
        'Pesan private hanya tersedia untuk pengguna yang sudah login. Silakan daftar atau login terlebih dahulu.'
      );
      // Redirect to register
      handlePrivateSelection(
        false,
        window.location.pathname,
        {
          form: form,
          files: files,
          type: 'feedback'
        }
      );
      return;
    }

    // Validate CAPTCHA for guest users
    if (!isAuthenticatedUser && !captchaToken) {
      showErrorDialog('Verifikasi Diperlukan', 'Mohon selesaikan verifikasi CAPTCHA terlebih dahulu.');
      return;
    }
    
    // Validate phone number format
    const phoneValidation = validatePhoneNumber(form.telepon);
    if (!phoneValidation.valid) {
      showErrorDialog('Format Telepon Salah', phoneValidation.message);
      return;
    }
    
    // Find selected location (tower or FO point) to get coordinates
    let selectedLocation: TowerWithCoords | FoPointWithCoords | undefined;
    let locationHasCoordinates = false;
    
    if (form.feedbackable_type === 'App\\Models\\Tower') {
      selectedLocation = towers.find(tower => tower.id.toString() === form.feedbackable_id);
      if (!selectedLocation) {
        showErrorDialog('Data Tower Tidak Tersedia', 'Tower yang dipilih tidak ditemukan');
        return;
      }
      locationHasCoordinates = hasValidTowerCoordinates(selectedLocation as TowerWithCoords);
    } else if (form.feedbackable_type === 'App\\Models\\FoPoint') {
      selectedLocation = foPoints.find(point => point.id.toString() === form.feedbackable_id);
      if (!selectedLocation) {
        showErrorDialog('Data FO Point Tidak Tersedia', 'FO Point yang dipilih tidak ditemukan');
        return;
      }
      const lat = Number(selectedLocation.latitude);
      const lon = Number(selectedLocation.longitude);
      locationHasCoordinates = (
        Number.isFinite(lat) && Number.isFinite(lon) &&
        lat !== 0 && lon !== 0 &&
        Math.abs(lat) <= 90 && Math.abs(lon) <= 180
      );
    } else {
      showErrorDialog('Lokasi Tidak Valid', 'Silakan pilih lokasi (Tower atau FO Point)');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      let locationValidation;
      let userLocationCaptured = false;
      let userLocationResult: Awaited<ReturnType<typeof getLocationForAccountSwitching>> | undefined;
      
      // Always request user location for documentation and validation
      // Use advanced account-switching optimized location capture with location validation
      userLocationResult = await getLocationForAccountSwitching(
        auth?.user?.id, 
        locationHasCoordinates ? {
          latitude: Number(selectedLocation.latitude),
          longitude: Number(selectedLocation.longitude)
        } : undefined,
        5 // Use more attempts for better accuracy
      );
      
      if (!userLocationResult.success) {
        let locationTitle = 'Lokasi Diperlukan';
        let locationMessage = userLocationResult.message;
        
        if (userLocationResult.message.includes('Izin lokasi ditolak')) {
          locationTitle = 'Izin Lokasi Diperlukan';
          locationMessage = 'Untuk mengirim masukan, Anda perlu mengizinkan akses lokasi. Silakan aktifkan izin lokasi di browser dan coba lagi.';
        } else if (userLocationResult.message.includes('Waktu permintaan lokasi habis')) {
          locationTitle = 'Timeout Lokasi';
          locationMessage = 'Gagal mendapatkan lokasi dalam waktu yang ditentukan. Pastikan GPS aktif dan sinyal baik, lalu coba lagi.';
        } else if (userLocationResult.message.includes('tidak tersedia')) {
          locationTitle = 'Lokasi Tidak Tersedia';
          locationMessage = 'Informasi lokasi tidak dapat diperoleh. Pastikan GPS aktif dan coba lagi.';
        } else if (userLocationResult.message.includes('beberapa percobaan')) {
          locationTitle = 'Lokasi Tidak Stabil';
          locationMessage = 'GPS tidak dapat memberikan lokasi yang stabil. Coba pindah ke area terbuka atau gunakan WiFi untuk meningkatkan akurasi.';
        } else if (userLocationResult.message.includes('restart WiFi')) {
          locationTitle = 'Perlu Refresh Lokasi';
          locationMessage = 'Koordinat GPS tidak akurat. Coba restart WiFi atau pindah ke area terbuka untuk mendapatkan lokasi yang lebih tepat.';
        } else if (userLocationResult.message.includes('Semua strategi')) {
          locationTitle = 'GPS Tidak Responsif';
          locationMessage = 'GPS tidak dapat memberikan lokasi yang akurat. Pastikan GPS aktif, tidak dalam mode hemat daya, dan coba restart aplikasi.';
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
      
      // Show detailed location feedback based on validation results
      if (userLocationResult.validation && userLocationResult.validation.issues.length > 0) {
        const issues = userLocationResult.validation.issues;
        const recommendations = userLocationResult.validation.recommendations;
        
        if (userLocationResult.validation.confidence === 'low') {
          showWarningDialog(
            'Masalah Lokasi GPS Ditemukan', 
            `${issues.join('. ')}. ${recommendations.join('. ')}`
          );
        } else if (userLocationResult.validation.confidence === 'medium') {
          showWarningDialog(
            'Akurasi Lokasi Sedang', 
            `${issues.join('. ')}. ${recommendations.join('. ')}`
          );
        }
      }
      
      if (locationHasCoordinates) {
        // Additional validation against location coordinates for distance check
        locationValidation = await requestLocationAndValidate({
          latitude: Number(selectedLocation.latitude),
          longitude: Number(selectedLocation.longitude)
        }, MAX_DISTANCE_KM);
        
        if (!locationValidation.success) {
          // Provide more informative location error messages
          let locationTitle = 'Validasi Lokasi Gagal';
          let locationMessage = locationValidation.message;
          
          if (locationValidation.message.includes('terlalu jauh')) {
            locationTitle = 'Jarak Terlalu Jauh';
            const locationType = form.feedbackable_type === 'App\\Models\\Tower' ? 'tower' : 'FO Point';
            locationMessage = `${locationValidation.message} Silakan mendekati ${locationType} atau hubungi admin jika Anda yakin berada di lokasi yang benar.`;
          } else {
            locationMessage = 'Gagal memvalidasi jarak ke lokasi. Silakan coba lagi.';
          }
          
          showWarningDialog(locationTitle, locationMessage);
          setIsSubmitting(false);
          return;
        }
      } else {
        // Location has no coordinates, just log for documentation
        locationValidation = { success: true, message: 'Lokasi berhasil diperoleh untuk dokumentasi' };
      }
      
      // Create and submit form data
      const updatedFormData = userLocationCaptured && userLocationResult?.coordinates ? {
        ...form,
        reporter_latitude: userLocationResult.coordinates.latitude.toString(),
        reporter_longitude: userLocationResult.coordinates.longitude.toString(),
        reporter_accuracy: userLocationResult.accuracy?.toString() || ''
      } : form;
      const formData = createFormData(updatedFormData);
      
      // Submit using Inertia router
      router.post('/feedback', formData, {
        onSuccess: () => {
          // Backend akan redirect ke halaman success (untuk authenticated) atau verifikasi (untuk guest)
          // Reset CAPTCHA after success
          if (captchaRef.current) {
            captchaRef.current.reset();
            setCaptchaToken('');
          }
        },
        onError: (errors: Record<string, string>) => {
          console.error('Form submission errors:', errors);
          
          // Reset CAPTCHA if there's an error
          if (captchaRef.current) {
            captchaRef.current.reset();
            setCaptchaToken('');
          }
          
          // Handle specific validation errors with user-friendly messages
          let errorTitle = 'Gagal Mengirim';
          let errorMessage = '';
          
          if (errors.captcha) {
            errorTitle = 'Verifikasi Gagal';
            errorMessage = errors.captcha;
          } else if (errors.email && errors.email.includes('prohibited')) {
            errorTitle = 'Error Sistem';
            errorMessage = 'Terjadi kesalahan sistem. Silakan refresh halaman dan coba lagi.';
          } else if (errors.sender_phone || errors.telepon) {
            errorTitle = 'Format Telepon Salah';
            errorMessage = 'Nomor telepon tidak valid. Pastikan menggunakan format yang benar (contoh: 08123456789).';
          } else if (errors.feedbackable_id || errors.feedbackable_type) {
            errorTitle = 'Lokasi Tidak Valid';
            errorMessage = 'Lokasi yang dipilih tidak valid. Silakan pilih lokasi (Tower atau FO Point) yang tersedia.';
          } else if (errors.message || errors.pesan) {
            errorTitle = 'Pesan Tidak Valid';
            errorMessage = 'Pesan terlalu panjang atau mengandung karakter yang tidak diizinkan.';
          } else if (errors['assets.0'] || errors['foto.0']) {
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

  return (
    <MainLayout title="Form Masukan" currentPage="/feedback">
      <Head title="Form Masukan" />
      
      <div className="p-4 sm:p-6">
        <PageHeader
          title={isAuthenticatedUser ? 'Form Masukan - Sampaikan Masukan Anda' : 'Guest Feedback - Sampaikan Masukan Anda'}
          description="Silakan isi form di bawah ini untuk menyampaikan masukan atau saran terkait tower telekomunikasi"
          showLogo
        />
        
        <div className="bg-white rounded-lg shadow-md">
          <div className="p-4 sm:p-6">
            <h2 className="text-xl sm:text-2xl font-bold text-yellow-600 mb-6">Form Masukan</h2>
            
            {isAuthenticatedUser && (
              <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-yellow-800 text-sm">
                  <strong>Info:</strong> Nama dan email Anda akan otomatis digunakan dari akun yang terdaftar, tidak perlu mengisi field tersebut.
                </p>
              </div>
            )}
            
            {isAutoFilled && (
              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center">
                  <span className="material-icons-outlined text-green-600 mr-2">check_circle</span>
                  <p className="text-green-800 text-sm">
                    <strong>{autoFilledLocationType === 'fo_point' ? 'Fiber Optik Dipilih Otomatis:' : 'Tower Dipilih Otomatis:'}</strong> Data lokasi {autoFilledLocationType === 'fo_point' ? 'fiber optik' : 'tower'} <strong>{form.lokasi_tower_display || form.lokasi_tower}</strong> telah diisi otomatis berdasarkan pilihan Anda sebelumnya.
                  </p>
                </div>
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
                    Tipe Masukan <span className="text-red-600">*</span>
                  </label>
                  <div className="flex flex-col sm:flex-row gap-4 mb-6">
                    <label className="flex items-start sm:items-center p-4 border-2 rounded-lg cursor-pointer transition-all hover:bg-gray-50" style={{ borderColor: form.location_type_filter === 'tower' ? '#DC2626' : '#D1D5DB' }}>
                      <input
                        type="radio"
                        id="location_type_tower"
                        name="location_type_filter"
                        checked={form.location_type_filter === 'tower'}
                        onChange={() => {
                          // Clear selection if current selection doesn't match new filter
                          if (form.feedbackable_type === 'App\\Models\\FoPoint') {
                            handleLocationClear();
                          }
                          setForm(prev => ({ ...prev, location_type_filter: 'tower' }));
                        }}
                        className="mt-1 sm:mt-0"
                        style={{ accentColor: '#DC2626' }}
                      />
                      <div className="ml-3 flex-1">
                        <div className="font-medium text-gray-900">Tower</div>
                        <div className="text-sm text-gray-600 mt-1">
                          Pilih lokasi tower untuk masukan
                        </div>
                      </div>
                    </label>
                    
                    <label className="flex items-start sm:items-center p-4 border-2 rounded-lg cursor-pointer transition-all hover:bg-gray-50" style={{ borderColor: form.location_type_filter === 'fo_point' ? '#DC2626' : '#D1D5DB' }}>
                      <input
                        type="radio"
                        id="location_type_fo"
                        name="location_type_filter"
                        checked={form.location_type_filter === 'fo_point'}
                        onChange={() => {
                          // Clear selection if current selection doesn't match new filter
                          if (form.feedbackable_type === 'App\\Models\\Tower') {
                            handleLocationClear();
                          }
                          setForm(prev => ({ ...prev, location_type_filter: 'fo_point' }));
                        }}
                        className="mt-1 sm:mt-0"
                        style={{ accentColor: '#DC2626' }}
                      />
                      <div className="ml-3 flex-1">
                        <div className="font-medium text-gray-900">Fiber Optik</div>
                        <div className="text-sm text-gray-600 mt-1">
                          Pilih lokasi FO Point untuk masukan
                        </div>
                      </div>
                    </label>
                  </div>
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-gray-700 font-medium mb-3">
                    Visibilitas Masukan <span className="text-red-600">*</span>
                  </label>
                  <div className="flex flex-col sm:flex-row gap-4">
                    <label className="flex items-start sm:items-center p-4 border-2 rounded-lg cursor-pointer transition-all hover:bg-gray-50" style={{ borderColor: form.is_public ? '#DC2626' : '#D1D5DB' }}>
                      <input
                        type="radio"
                        name="is_public"
                        checked={form.is_public}
                        onChange={() => setForm(prev => ({ ...prev, is_public: true }))}
                        className="mt-1 sm:mt-0"
                        style={{ accentColor: '#DC2626' }}
                      />
                      <div className="ml-3 flex-1">
                        <div className="font-medium text-gray-900">Terbuka (Public)</div>
                        <div className="text-sm text-gray-600 mt-1">
                          Masukan dapat dilihat oleh pengguna lain. Membantu transparansi dan berbagi informasi.
                        </div>
                      </div>
                    </label>
                    
                    <label className="flex items-start sm:items-center p-4 border-2 rounded-lg cursor-pointer transition-all hover:bg-gray-50" style={{ borderColor: !form.is_public ? '#DC2626' : '#D1D5DB' }}>
                      <input
                        type="radio"
                        name="is_public"
                        checked={!form.is_public}
                        onChange={() => {
                          const allowed = handlePrivateSelection(
                            isAuthenticatedUser,
                            window.location.pathname,
                            {
                              form: { ...form, is_public: false },
                              files: files,
                              type: 'feedback'
                            }
                          );
                          if (allowed) {
                            setForm(prev => ({ ...prev, is_public: false }));
                          }
                        }}
                        className="mt-1 sm:mt-0"
                        style={{ accentColor: '#DC2626' }}
                      />
                      <div className="ml-3 flex-1">
                        <div className="font-medium text-gray-900">Tertutup (Private)</div>
                        <div className="text-sm text-gray-600 mt-1">
                          {isAuthenticatedUser 
                            ? 'Hanya Anda dan admin yang dapat melihat masukan ini.'
                            : 'Pesan private hanya tersedia untuk pengguna yang sudah login. Silakan daftar atau login terlebih dahulu.'}
                        </div>
                      </div>
                    </label>
                  </div>
                </div>
                
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
              
              <LocationSelectionInput
                towers={form.location_type_filter === 'tower' ? towers : []}
                foPoints={form.location_type_filter === 'fo_point' ? foPoints : []}
                selectedLocationId={form.feedbackable_id}
                selectedLocationDisplay={form.lokasi_tower_display}
                selectedLocationType={form.feedbackable_type === 'App\\Models\\Tower' ? 'tower' : form.feedbackable_type === 'App\\Models\\FoPoint' ? 'fo_point' : undefined}
                onLocationSelect={handleLocationSelect}
                onClear={handleLocationClear}
                label={form.location_type_filter === 'tower' ? "Lokasi Tower" : "Lokasi FO Point"}
                required={true}
                error={validation.lokasi_tower}
                errorMessage="Lokasi harus dipilih"
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
                  placeholder="Jelaskan masukan Anda secara detail..."
                  maxLength={MAX_MESSAGE_LENGTH}
                />
                {validation.pesan && (
                  <p className="text-red-500 text-sm mt-1">
                    Pesan harus diisi
                  </p>
                )}
                <p className="text-gray-500 text-sm mt-1">
                  {form.pesan.length}/{MAX_MESSAGE_LENGTH} karakter
                </p>
              </div>
              
              {/* CAPTCHA widget - only for guest users */}
              {!isAuthenticatedUser && (
                <div className="mb-6">
                  <TurnstileCaptcha
                    ref={captchaRef}
                    siteKey={turnstileSiteKey || ''}
                    onTokenChange={setCaptchaToken}
                    error={(errors as any)?.captcha || (errors as any)?.['cf-turnstile-response']}
                    size="normal"
                    theme="light"
                  />
                </div>
              )}

              <div className="flex items-center justify-start gap-3 sm:gap-4 flex-wrap">
                <AnimatedButton
                  type="button"
                  variant="secondary"
                  size="md"
                  animation="scale"
                  onClick={resetForm}
                  disabled={isSubmitting}
                >
                  Reset
                </AnimatedButton>
                <AnimatedButton
                  type="submit"
                  variant="primary"
                  size="md"
                  animation="scale"
                  loading={isSubmitting}
                  disabled={isSubmitting || (!isAuthenticatedUser && !captchaToken)}
                  icon={
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  }
                >
                  {isSubmitting ? 'Mengirim...' : 'Kirim Masukan'}
                </AnimatedButton>
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