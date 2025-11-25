import React, { useState, useCallback } from 'react';
import { Head, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { SITE_TYPE_OPTIONS } from '@/constants/towerOptions';

interface Owner {
  id: number;
  name: string;
  alamat: string;
}

interface Props {
  owners: Owner[];
}

interface FormData {
  site_name: string;
  site_id: string;
  site_sap: string;
  latitude: string;
  longitude: string;
  alamat_menara: string;
  tinggi_menara: string;
  tinggi_bangunan: string;
  jumlah_pengguna: string;
  jumlah_kaki: string;
  site_type: string;
  tower_type: string;
  prs: string;
  prs_id: string;
  no_ijin: string;
  jenis_ijin: string;
  tanggal_ijin: string;
  berlaku_hingga: string;
  status_ijin: string;
  owner_id: string;
  owner_name: string;
  owner_alamat: string;
}

// Move FormInput component outside to prevent re-creation
const FormInput: React.FC<{
  field: keyof FormData;
  type?: string;
  placeholder?: string;
  options?: { value: string; label: string }[];
  rows?: number;
  required?: boolean;
  value: string;
  onChange: (field: keyof FormData, value: string) => void;
  error?: string;
}> = ({ field, type = 'text', placeholder, options, rows, required = false, value, onChange, error }) => {
  const baseClass = `w-full border rounded-lg p-3 text-sm focus:ring-2 focus:ring-red-400 focus:border-transparent transition-colors ${
    error ? 'border-red-500 bg-red-50' : 'border-gray-300'
  }`;

  if (options) {
    return (
      <div>
        <select
          className={baseClass}
          value={value}
          onChange={(e) => onChange(field, e.target.value)}
        >
          <option value="">{placeholder || `Pilih ${field}`}</option>
          {options.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
      </div>
    );
  }

  if (rows) {
    return (
      <div>
        <textarea
          className={`${baseClass} resize-none`}
          rows={rows}
          value={value}
          onChange={(e) => onChange(field, e.target.value)}
          placeholder={placeholder}
        />
        {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
      </div>
    );
  }

  return (
    <div>
      <input
        type={type}
        className={baseClass}
        value={value}
        onChange={(e) => onChange(field, e.target.value)}
        placeholder={placeholder}
      />
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
};

const TowerCreatePage: React.FC<Props> = ({ owners }) => {
  const [activeTab, setActiveTab] = useState('basic');
  const [formData, setFormData] = useState<FormData>({
    site_name: '',
    site_id: '',
    site_sap: '',
    latitude: '',
    longitude: '',
    alamat_menara: '',
    tinggi_menara: '',
    tinggi_bangunan: '',
    jumlah_pengguna: '',
    jumlah_kaki: '',
    site_type: '',
    tower_type: '',
    prs: '',
    prs_id: '',
    no_ijin: '',
    jenis_ijin: '',
    tanggal_ijin: '',
    berlaku_hingga: '',
    status_ijin: '',
    owner_id: '',
    owner_name: '',
    owner_alamat: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateField = useCallback((field: keyof FormData, value: string) => {
    // Handle coordinate formatting
    if (field === 'latitude' || field === 'longitude') {
      // Remove any non-numeric characters except decimal point and minus sign
      const cleanedValue = value.replace(/[^0-9.-]/g, '');
      
      // Ensure only one decimal point
      const parts = cleanedValue.split('.');
      if (parts.length > 2) {
        value = parts[0] + '.' + parts.slice(1).join('');
      } else {
        value = cleanedValue;
      }
      
      // Limit decimal places to 8
      if (value.includes('.')) {
        const [integer, decimal] = value.split('.');
        if (decimal && decimal.length > 8) {
          value = integer + '.' + decimal.substring(0, 8);
        }
      }
    }
    
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Handle owner selection
    if (field === 'owner_id') {
      if (value === '') {
        setFormData(prev => ({ ...prev, owner_name: '', owner_alamat: '' }));
      } else {
        const selectedOwner = owners.find(owner => owner.id.toString() === value);
        if (selectedOwner) {
          setFormData(prev => ({ 
            ...prev, 
            owner_name: selectedOwner.name, 
            owner_alamat: selectedOwner.alamat 
          }));
        }
      }
    }
    
    // Clear error when user starts typing
    setErrors(prev => {
      if (prev[field]) {
        return { ...prev, [field]: '' };
      }
      return prev;
    });
  }, [owners]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Required fields
    if (!formData.alamat_menara || formData.alamat_menara.trim() === '') {
      newErrors.alamat_menara = 'Alamat menara wajib diisi';
    }

    // Enhanced coordinate validation
    if (formData.latitude) {
      const latValue = Number(formData.latitude);
      if (isNaN(latValue)) {
        newErrors.latitude = 'Latitude harus berupa angka yang valid';
      } else if (latValue < -90 || latValue > 90) {
        newErrors.latitude = 'Latitude harus antara -90 dan 90';
      } else if (formData.latitude.includes('.') && formData.latitude.split('.')[1] && formData.latitude.split('.')[1].length > 8) {
        newErrors.latitude = 'Latitude maksimal 8 digit desimal';
      }
    }
    
    if (formData.longitude) {
      const lngValue = Number(formData.longitude);
      if (isNaN(lngValue)) {
        newErrors.longitude = 'Longitude harus berupa angka yang valid';
      } else if (lngValue < -180 || lngValue > 180) {
        newErrors.longitude = 'Longitude harus antara -180 dan 180';
      } else if (formData.longitude.includes('.') && formData.longitude.split('.')[1] && formData.longitude.split('.')[1].length > 8) {
        newErrors.longitude = 'Longitude maksimal 8 digit desimal';
      }
    }

    // Validate numeric fields if provided
    if (formData.tinggi_menara && (isNaN(Number(formData.tinggi_menara)) || Number(formData.tinggi_menara) < 0)) {
      newErrors.tinggi_menara = 'Tinggi menara harus berupa angka positif';
    }
    if (formData.tinggi_bangunan && (isNaN(Number(formData.tinggi_bangunan)) || Number(formData.tinggi_bangunan) < 0)) {
      newErrors.tinggi_bangunan = 'Tinggi bangunan harus berupa angka positif';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    
    // Convert empty strings to null for numeric fields
    const submitData = {
      ...formData,
      latitude: formData.latitude ? Number(formData.latitude) : null,
      longitude: formData.longitude ? Number(formData.longitude) : null,
      tinggi_menara: formData.tinggi_menara ? Number(formData.tinggi_menara) : null,
      tinggi_bangunan: formData.tinggi_bangunan ? Number(formData.tinggi_bangunan) : null,
      jumlah_pengguna: formData.jumlah_pengguna ? Number(formData.jumlah_pengguna) : null,
      jumlah_kaki: formData.jumlah_kaki ? Number(formData.jumlah_kaki) : null,
    };

    router.post(route('admin.towers.store'), submitData, {
      onSuccess: () => {
        // Redirect will be handled by the controller
      },
      onError: (errors) => {
        setErrors(errors);
        setIsSubmitting(false);
      },
      onFinish: () => {
        setIsSubmitting(false);
      }
    });
  };



  return (
    <AdminLayout title="Tambah Tower">
      <Head title="Tambah Tower" />
      
      {/* Header Section */}
      <div className="mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">Tambah Tower Baru</h1>
            <p className="text-sm sm:text-base text-gray-600">Masukkan informasi lengkap tower telekomunikasi yang akan didaftarkan</p>
          </div>
          <button
            onClick={() => router.get(route('admin.towers.index'))}
            className="px-3 sm:px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2 text-sm sm:text-base w-full sm:w-auto justify-center sm:justify-start"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Kembali
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Tab Navigation */}
          <div className="px-4 sm:px-6 py-3 sm:py-4 bg-gradient-to-r from-red-50 to-red-100 border-b border-gray-200">
            <nav className="overflow-x-hidden">
              <div className="grid grid-cols-4 gap-1 sm:gap-2">
                {[
                  { id: 'basic', label: 'Info Dasar', icon: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
                  { id: 'location', label: 'Lokasi', icon: 'M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z' },
                  { id: 'technical', label: 'Teknis', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z' },
                  { id: 'permits', label: 'Perijinan', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex flex-col items-center justify-center px-2 sm:px-3 py-2 sm:py-3 text-xs sm:text-sm font-medium rounded-lg transition-colors ${
                      activeTab === tab.id
                        ? 'bg-red-100 text-red-700 border border-red-300'
                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <svg className="w-3 h-3 sm:w-4 sm:h-4 mb-1 sm:mb-0 sm:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tab.icon} />
                    </svg>
                    <span className="text-center leading-tight">{tab.label}</span>
                  </button>
                ))}
              </div>
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-4 sm:p-6">
            {activeTab === 'basic' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nama Site
                  </label>
                  <FormInput 
                    field="site_name" 
                    placeholder="Masukkan nama site" 
                    value={formData.site_name}
                    onChange={updateField}
                    error={errors.site_name}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Site ID</label>
                  <FormInput 
                    field="site_id" 
                    placeholder="Site ID" 
                    value={formData.site_id}
                    onChange={updateField}
                    error={errors.site_id}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Site SAP</label>
                  <FormInput 
                    field="site_sap" 
                    placeholder="Site SAP" 
                    value={formData.site_sap}
                    onChange={updateField}
                    error={errors.site_sap}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Site Type</label>
                  <FormInput 
                    field="site_type" 
                    options={SITE_TYPE_OPTIONS.map(({ value, label }) => ({ value, label }))} 
                    placeholder="Pilih site type" 
                    value={formData.site_type}
                    onChange={updateField}
                    error={errors.site_type}
                  />
                  <div className="text-xs text-gray-500 mt-1 space-y-1">
                    {SITE_TYPE_OPTIONS.map((option) => (
                      <p key={option.value}>
                        <span className="font-medium">{option.label}:</span> {option.description}
                      </p>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Owner</label>
                  <FormInput 
                    field="owner_id" 
                    options={owners.map(owner => ({ value: owner.id.toString(), label: owner.name }))} 
                    placeholder="Pilih owner" 
                    value={formData.owner_id}
                    onChange={updateField}
                    error={errors.owner_id}
                  />
                </div>
                {formData.owner_id && (
                  <div className="sm:col-span-2">
                    <div className="bg-gray-50 p-3 sm:p-4 rounded-lg">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Detail Owner</h4>
                      <p className="text-xs sm:text-sm text-gray-600"><strong>Nama:</strong> {formData.owner_name}</p>
                      <p className="text-xs sm:text-sm text-gray-600"><strong>Alamat:</strong> {formData.owner_alamat}</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'location' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Longitude <span className="text-gray-500 text-xs">(X-axis)</span>
                  </label>
                  <FormInput 
                    field="longitude" 
                    type="number" 
                    placeholder="Contoh: 110.4203" 
                    value={formData.longitude}
                    onChange={updateField}
                    error={errors.longitude}
                  />
                  <p className="text-xs text-gray-500 mt-1">Range: -180° hingga 180°, maksimal 8 digit desimal</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Latitude <span className="text-gray-500 text-xs">(Y-axis)</span>
                  </label>
                  <FormInput 
                    field="latitude" 
                    type="number" 
                    placeholder="Contoh: -7.7956" 
                    value={formData.latitude}
                    onChange={updateField}
                    error={errors.latitude}
                  />
                  <p className="text-xs text-gray-500 mt-1">Range: -90° hingga 90°, maksimal 8 digit desimal</p>
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Alamat Menara <span className="text-red-500">*</span></label>
                  <FormInput 
                    field="alamat_menara" 
                    rows={3} 
                    placeholder="Alamat lengkap lokasi menara" 
                    value={formData.alamat_menara}
                    onChange={updateField}
                    error={errors.alamat_menara}
                    required={true}
                  />
                </div>
              </div>
            )}

            {activeTab === 'technical' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tinggi Menara (m)</label>
                  <FormInput 
                    field="tinggi_menara" 
                    type="number" 
                    placeholder="Contoh: 42" 
                    value={formData.tinggi_menara}
                    onChange={updateField}
                    error={errors.tinggi_menara}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tinggi Bangunan (m)</label>
                  <FormInput 
                    field="tinggi_bangunan" 
                    type="number" 
                    placeholder="Contoh: 15" 
                    value={formData.tinggi_bangunan}
                    onChange={updateField}
                    error={errors.tinggi_bangunan}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Jumlah Pengguna</label>
                  <FormInput 
                    field="jumlah_pengguna" 
                    type="number" 
                    placeholder="Jumlah operator" 
                    value={formData.jumlah_pengguna}
                    onChange={updateField}
                    error={errors.jumlah_pengguna}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Jumlah Kaki</label>
                  <FormInput 
                    field="jumlah_kaki" 
                    type="number" 
                    placeholder="Contoh: 4" 
                    value={formData.jumlah_kaki}
                    onChange={updateField}
                    error={errors.jumlah_kaki}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tower Type</label>
                  <FormInput 
                    field="tower_type" 
                    placeholder="Contoh: Lattice, Monopole" 
                    value={formData.tower_type}
                    onChange={updateField}
                    error={errors.tower_type}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">PRS</label>
                  <FormInput 
                    field="prs" 
                    placeholder="PRS" 
                    value={formData.prs}
                    onChange={updateField}
                    error={errors.prs}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">PRS ID</label>
                  <FormInput 
                    field="prs_id" 
                    placeholder="PRS ID" 
                    value={formData.prs_id}
                    onChange={updateField}
                    error={errors.prs_id}
                  />
                </div>
              </div>
            )}

            {activeTab === 'permits' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nomor Ijin</label>
                  <FormInput 
                    field="no_ijin" 
                    placeholder="Nomor ijin" 
                    value={formData.no_ijin}
                    onChange={updateField}
                    error={errors.no_ijin}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Jenis Ijin</label>
                  <FormInput 
                    field="jenis_ijin" 
                    options={[
                      { value: 'IMB', label: 'IMB' },
                      { value: 'PBG', label: 'PBG' },
                      { value: 'Lainnya', label: 'Lainnya' }
                    ]} 
                    placeholder="Pilih jenis ijin" 
                    value={formData.jenis_ijin}
                    onChange={updateField}
                    error={errors.jenis_ijin}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tanggal Ijin</label>
                  <FormInput 
                    field="tanggal_ijin" 
                    type="date" 
                    value={formData.tanggal_ijin}
                    onChange={updateField}
                    error={errors.tanggal_ijin}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Berlaku Hingga</label>
                  <FormInput 
                    field="berlaku_hingga" 
                    type="date" 
                    value={formData.berlaku_hingga}
                    onChange={updateField}
                    error={errors.berlaku_hingga}
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status Ijin</label>
                  <FormInput 
                    field="status_ijin" 
                    options={[
                      { value: 'Aktif', label: 'Aktif' },
                      { value: 'Tidak Aktif', label: 'Tidak Aktif' },
                      { value: 'Pending', label: 'Pending' },
                      { value: 'Expired', label: 'Expired' }
                    ]} 
                    placeholder="Pilih status ijin" 
                    value={formData.status_ijin}
                    onChange={updateField}
                    error={errors.status_ijin}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="px-4 sm:px-6 py-4 bg-gray-50 border-t border-gray-200">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-3 sm:space-y-0">
              <div className="text-xs sm:text-sm text-gray-600 text-center sm:text-left">
                <span className="text-red-500">*</span> Field wajib diisi
              </div>
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                <button
                  type="button"
                  onClick={() => router.get(route('admin.towers.index'))}
                  className="w-full sm:w-auto px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full sm:w-auto px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      Menyimpan...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Simpan Tower
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </form>
    </AdminLayout>
  );
};

export default TowerCreatePage;
