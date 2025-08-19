import React, { useState } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import MainLayout from '@/Layouts/MainLayout';
import Footer from '@/Components/Footer';
import FileUpload from '@/Components/FileUpload';
import TowerSelectionInput from '@/Components/Feedback/Map/TowerSelectionInput';

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
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isOtherCategory, setIsOtherCategory] = useState(false);



  // Handle tower selection (both from search and map)
  const handleTowerSelection = (tower: any) => {
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

  // Handle clear tower selection
  const handleTowerClear = () => {
    setForm(prev => ({ 
      ...prev, 
      lokasi_tower: '', 
      lokasi_tower_display: '', 
      tower_id: '' 
    }));
  };



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
    
    // Map form field names to controller expected names
    formData.append('sender_phone', form.telepon);
    formData.append('category', form.kategori);
    formData.append('tower_id', form.tower_id);
    formData.append('message', form.pesan);
    formData.append('sender_name', form.nama); // Tambahkan nama pengirim dari form

    
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
              
              <TowerSelectionInput
                towers={towers as any}
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
                onError={setErrorMessage}
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


      
      <Footer />
    </MainLayout>
  );
}
