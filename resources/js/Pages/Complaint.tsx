import React, { useState, useRef } from 'react';
import { Head, router } from '@inertiajs/react';
import MainLayout from '@/Layouts/MainLayout';

interface ComplaintProps {
  towers: Array<{
    id: number;
    site_name: string;
    alamat_menara?: string;
  }>;
}

const Complaint: React.FC<ComplaintProps> = ({ towers = [] }) => {
  const [form, setForm] = useState({
    nama: '',
    email: '',
    telepon: '',
    kategori: '',
    lokasi_tower: '',
    pesan: '',
  });
  
  const [validation, setValidation] = useState({
    nama: false,
    email: false,
    kategori: false,
    pesan: false
  });

  const [files, setFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    
    // Clear validation error if typing
    if (validation[name as keyof typeof validation] !== undefined) {
      setValidation(prev => ({ ...prev, [name]: false }));
    }
  };

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
      kategori: !form.kategori,
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
          pesan: '',
        });
        setFiles([]);
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
      pesan: '',
    });
    setFiles([]);
    setValidation({
      nama: false,
      email: false,
      kategori: false,
      pesan: false
    });
    setErrorMessage('');
    setSuccessMessage('');
  };

  return (
    <MainLayout title="Form Keluhan" currentPage="/complaint">
      <Head title="Form Keluhan" />
      
      <div className="p-6">
        <div className="bg-yellow-100 rounded-lg shadow-md mb-8">
          <div className="p-6">
            <h1 className="text-2xl font-bold text-yellow-800 mb-2">
              Guest Complain - Sampaikan Keluhan Anda
            </h1>
            <p className="text-yellow-700">
              Silakan isi form di bawah ini untuk menyampaikan keluhan atau laporan terkait tower telekomunikasi
            </p>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md">
          <div className="p-6">
            <h2 className="text-xl font-medium text-yellow-600 mb-6">Form Keluhan</h2>
            
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
                    className={`w-full rounded-lg border ${validation.nama ? 'border-red-500' : 'border-gray-300'} focus:border-purple-500 focus:ring-purple-500`}
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
                    className={`w-full rounded-lg border ${validation.email ? 'border-red-500' : 'border-gray-300'} focus:border-purple-500 focus:ring-purple-500`}
                    placeholder="Masukkan email"
                  />
                  {validation.email && (
                    <p className="text-red-500 text-sm mt-1">Email valid harus diisi</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-gray-700 font-medium mb-2">
                    No. Telepon
                  </label>
                  <input
                    type="text"
                    name="telepon"
                    value={form.telepon}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-gray-300 focus:border-purple-500 focus:ring-purple-500"
                    placeholder="Masukkan nomor telepon"
                  />
                </div>
                
                <div>
                  <label className="block text-gray-700 font-medium mb-2">
                    Kategori Keluhan <span className="text-red-600">*</span>
                  </label>
                  <select
                    name="kategori"
                    value={form.kategori}
                    onChange={handleChange}
                    className={`w-full rounded-lg border ${validation.kategori ? 'border-red-500' : 'border-gray-300'} focus:border-purple-500 focus:ring-purple-500`}
                  >
                    <option value="">Pilih kategori</option>
                    <option value="Kerusakan">Kerusakan</option>
                    <option value="Gangguan Sinyal">Gangguan Sinyal</option>
                    <option value="Kebisingan">Kebisingan</option>
                    <option value="Lainnya">Lainnya</option>
                  </select>
                  {validation.kategori && (
                    <p className="text-red-500 text-sm mt-1">Kategori harus dipilih</p>
                  )}
                </div>
              </div>
              
              <div className="mb-6">
                <label className="block text-gray-700 font-medium mb-2">
                  Lokasi Tower
                </label>
                <select
                  name="lokasi_tower"
                  value={form.lokasi_tower}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-gray-300 focus:border-purple-500 focus:ring-purple-500"
                >
                  <option value="">Pilih lokasi tower (opsional)</option>
                  {towers.map(tower => (
                    <option key={tower.id} value={tower.site_name}>
                      {tower.site_name} - {tower.alamat_menara || 'Alamat tidak tersedia'}
                    </option>
                  ))}
                </select>
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
                  className={`w-full rounded-lg border ${validation.pesan ? 'border-red-500' : 'border-gray-300'} focus:border-purple-500 focus:ring-purple-500`}
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
                  className="px-6 py-3 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  disabled={isSubmitting}
                >
                  Reset
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 bg-yellow-400 text-yellow-900 font-medium rounded-lg hover:bg-yellow-500"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Mengirim...' : 'Kirim Keluhan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Complaint;
