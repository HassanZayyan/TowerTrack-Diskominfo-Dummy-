import React, { useState, useRef, useEffect } from 'react';
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

const Complaint: React.FC<ComplaintProps> = ({ towers = [] }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [filteredTowers, setFilteredTowers] = useState(towers);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [form, setForm] = useState({
    nama: '',
    email: '',
    telepon: '',
    kategori: '',
    lokasi_tower: '', // This will store site_name for display purposes
    lokasi_tower_display: '', // Display value for the selected tower
    tower_id: '', // Added to store the tower ID for the foreign key
    pesan: '',
  });
  
  const [validation, setValidation] = useState({
    nama: false,
    email: false,
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    
    // Clear validation error if typing
    if (validation[name as keyof typeof validation] !== undefined) {
      setValidation(prev => ({ ...prev, [name]: false }));
    }
  };
  
  // Effect untuk filter towers berdasarkan pencarian
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredTowers(towers);
    } else {
      const filtered = towers.filter(tower => 
        tower.site_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (tower.alamat_menara || '').toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredTowers(filtered);
    }
  }, [searchTerm, towers]);
  
  // Event handler untuk klik di luar dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

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
      email: !form.email || !/^\S+@\S+\.\S+$/.test(form.email),
      telepon: !form.telepon,
      kategori: !form.kategori,
      lokasi_tower: !form.lokasi_tower,
      pesan: !form.pesan
    };
    
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
          email: '',
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
      email: '',
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
      email: false,
      telepon: false,
      kategori: false,
      lokasi_tower: false,
      pesan: false
    });
    setErrorMessage('');
    setSuccessMessage('');
  };

  return (
    <MainLayout title="Form Keluhan" currentPage="/complaint">
      <Head title="Form Keluhan" />
      
      <div className="p-6">
        <div className="rounded-lg shadow mb-8 px-6 py-5 flex items-center justify-between" style={{ backgroundColor: '#FFF8E1' }}>
          <div>
            <h1 className="text-2xl font-bold mb-1" style={{ color: '#212121' }}>
              Guest Complain - Sampaikan Keluhan Anda
            </h1>
            <p style={{ color: '#212121', opacity: 0.85 }}>
              Silakan isi form di bawah ini untuk menyampaikan keluhan atau laporan terkait tower telekomunikasi
            </p>
          </div>
          <img src="/images/dprd-logo.png" alt="DPRD Kabupaten Semarang" className="h-10 w-10 hidden sm:block" />
        </div>
        
        <div className="bg-white rounded-lg shadow-md">
          <div className="p-6">
            <h2 className="text-2xl font-bold text-yellow-600 mb-6">Form Keluhan</h2>
            
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-gray-700 font-medium mb-2">
                    Nama Lengkap <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    name="nama"
                    value={form.nama}
                    onChange={handleChange}
                    className={`w-full rounded-lg border ${validation.nama ? 'border-red-500' : 'border-gray-300'} focus:outline-none focus-visible:outline-none focus:ring-2 focus:border-[#B71C1C]`}
                    style={{ '--tw-ring-color': '#B71C1C', outline: 'none' } as React.CSSProperties}
                    placeholder="Masukkan nama lengkap"
                  />
                  {validation.nama && (
                    <p className="text-red-500 text-sm mt-1">Nama lengkap harus diisi</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-gray-700 font-medium mb-2">
                    Email <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    className={`w-full rounded-lg border ${validation.email ? 'border-red-500' : 'border-gray-300'} focus:outline-none focus-visible:outline-none focus:ring-2 focus:border-[#B71C1C]`}
                    style={{ '--tw-ring-color': '#B71C1C', outline: 'none' } as React.CSSProperties}
                    placeholder="Masukkan email"
                  />
                  {validation.email && (
                    <p className="text-red-500 text-sm mt-1">Email valid harus diisi</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-gray-700 font-medium mb-2">
                    No. Telepon <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    name="telepon"
                    value={form.telepon}
                    onChange={handleChange}
                  className={`w-full rounded-lg border ${validation.telepon ? 'border-red-500' : 'border-gray-300'} focus:outline-none focus-visible:outline-none focus:ring-2 focus:border-[#B71C1C]`}
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
                       className={`w-full rounded-lg border ${validation.kategori ? 'border-red-500' : 'border-gray-300'} focus:outline-none focus-visible:outline-none focus:ring-2 focus:border-[#B71C1C]`}
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
                         className={`w-full rounded-lg border ${validation.kategori ? 'border-red-500' : 'border-gray-300'} focus:outline-none focus-visible:outline-none focus:ring-2 focus:border-[#B71C1C]`}
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
                    type="text"
                    placeholder="Cari dan pilih lokasi tower..."
                    value={form.lokasi_tower ? form.lokasi_tower_display : searchTerm}
                    onChange={(e) => {
                      // Only allow typing when no tower is selected
                      if (!form.lokasi_tower) {
                        setSearchTerm(e.target.value);
                        setShowDropdown(true);
                      }
                    }}
                    onClick={() => {
                      // Only show dropdown when no tower is selected
                      if (!form.lokasi_tower) {
                        setShowDropdown(true);
                      }
                    }}
                    readOnly={!!form.lokasi_tower} // Make the field read-only when a tower is selected
                    className={`w-full rounded-lg border ${validation.lokasi_tower ? 'border-red-500' : 'border-gray-300'} focus:outline-none focus-visible:outline-none focus:ring-2 focus:border-[#B71C1C] p-2 ${form.lokasi_tower ? 'bg-gray-100' : ''}`}
                    style={{ '--tw-ring-color': '#B71C1C', outline: 'none' } as React.CSSProperties}
                  />
                  
                  {/* Sengaja dikosongkan karena lokasi yang dipilih akan langsung ditampilkan di dalam input */}
                  
                  {/* Clear button - more visible when tower is selected */}
                  {(form.lokasi_tower || searchTerm) && (
                    <button
                      type="button"
                      onClick={() => {
                        setForm(prev => ({ ...prev, lokasi_tower: '', lokasi_tower_display: '', tower_id: '' }));
                        setSearchTerm('');
                      }}
                      className={`absolute right-2 top-1/2 transform -translate-y-1/2 ${form.lokasi_tower ? 'bg-gray-300 hover:bg-gray-400 w-6 h-6 flex items-center justify-center rounded-full text-gray-700' : 'text-gray-500 hover:text-gray-700'}`}
                      title="Hapus pilihan"
                    >
                      &times;
                    </button>
                  )}
                  
                  {/* Dropdown */}
                  {showDropdown && (
                    <div className="absolute z-10 w-full mt-1 bg-white shadow-lg rounded-lg max-h-60 overflow-auto border border-gray-300">
                      {filteredTowers.length === 0 ? (
                        <div className="p-3 text-gray-500">Tidak ada lokasi yang sesuai</div>
                      ) : (
                        filteredTowers.map(tower => (
                          <div
                            key={tower.id}
                            onClick={() => {
                              // Store tower_id, site_name, and full address for display
                              const fullAddress = `${tower.site_name} - ${tower.alamat_menara || 'Alamat tidak tersedia'}`;
                              setForm(prev => ({ 
                                ...prev, 
                                tower_id: String(tower.id), // Store tower ID as string
                                lokasi_tower: tower.site_name,
                                lokasi_tower_display: fullAddress
                              }));
                              setSearchTerm('');
                              setShowDropdown(false);
                              // Clear validation error
                              if (validation.lokasi_tower) {
                                setValidation(prev => ({ ...prev, lokasi_tower: false }));
                              }
                            }}
                            className="p-3 hover:bg-gray-100 cursor-pointer"
                          >
                            {tower.site_name} - {tower.alamat_menara || 'Alamat tidak tersedia'}
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
                {validation.lokasi_tower && (
                  <p className="text-red-500 text-sm mt-1">Lokasi tower harus dipilih</p>
                )}
              </div>
              
              <div className="mb-6">
                <label className="block text-gray-700 font-medium mb-2">
                  Upload Foto (opsional)
                </label>
                <div className="flex items-center">
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
                  <span className="ml-4 text-gray-600">
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
                  className={`w-full rounded-lg border ${validation.pesan ? 'border-red-500' : 'border-gray-300'} focus:outline-none focus-visible:outline-none focus:ring-2 focus:border-[#B71C1C]`}
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
              
              <div className="flex items-center justify-start gap-4">
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
