import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';

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

const TowerCreatePage: React.FC<Props> = ({ owners }) => {
  const [activeTab, setActiveTab] = useState('basic');
  const [isNewOwner, setIsNewOwner] = useState(false);
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

  const updateField = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Handle owner selection
    if (field === 'owner_id') {
      if (value === 'new') {
        setIsNewOwner(true);
        setFormData(prev => ({ ...prev, owner_name: '', owner_alamat: '' }));
      } else if (value === '') {
        setIsNewOwner(false);
        setFormData(prev => ({ ...prev, owner_name: '', owner_alamat: '' }));
      } else {
        setIsNewOwner(false);
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
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Required fields
    if (!formData.site_name.trim()) {
      newErrors.site_name = 'Nama site wajib diisi';
    }

    // Validate coordinates if provided
    if (formData.latitude && (isNaN(Number(formData.latitude)) || Number(formData.latitude) < -90 || Number(formData.latitude) > 90)) {
      newErrors.latitude = 'Latitude harus antara -90 dan 90';
    }
    if (formData.longitude && (isNaN(Number(formData.longitude)) || Number(formData.longitude) < -180 || Number(formData.longitude) > 180)) {
      newErrors.longitude = 'Longitude harus antara -180 dan 180';
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

  const FormInput: React.FC<{
    field: keyof FormData;
    type?: string;
    placeholder?: string;
    options?: { value: string; label: string }[];
    rows?: number;
    required?: boolean;
  }> = ({ field, type = 'text', placeholder, options, rows, required = false }) => {
    const error = errors[field];
    const value = formData[field];
    const baseClass = `w-full border rounded-lg p-3 text-sm focus:ring-2 focus:ring-red-400 focus:border-transparent transition-colors ${
      error ? 'border-red-500 bg-red-50' : 'border-gray-300'
    }`;

    if (options) {
      return (
        <div>
          <select
            className={baseClass}
            value={value}
            onChange={(e) => updateField(field, e.target.value)}
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
            onChange={(e) => updateField(field, e.target.value)}
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
          onChange={(e) => updateField(field, e.target.value)}
          placeholder={placeholder}
        />
        {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
      </div>
    );
  };

  return (
    <AdminLayout title="Tambah Tower">
      <Head title="Tambah Tower" />
      
      {/* Header Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Tambah Tower Baru</h1>
            <p className="text-gray-600">Masukkan informasi lengkap tower telekomunikasi yang akan didaftarkan</p>
          </div>
          <button
            onClick={() => router.get(route('admin.towers.index'))}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
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
          <div className="px-6 py-4 bg-gradient-to-r from-red-50 to-red-100 border-b border-gray-200">
            <nav className="flex flex-wrap gap-2 sm:flex-nowrap sm:space-x-4 sm:gap-0">
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
                  className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    activeTab === tab.id
                      ? 'bg-red-100 text-red-700 border-red-300'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tab.icon} />
                  </svg>
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'basic' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nama Site <span className="text-red-500">*</span>
                  </label>
                  <FormInput field="site_name" placeholder="Masukkan nama site" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Site ID</label>
                  <FormInput field="site_id" placeholder="Site ID" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Site SAP</label>
                  <FormInput field="site_sap" placeholder="Site SAP" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Site Type</label>
                  <FormInput field="site_type" options={[
                    { value: 'macro', label: 'Macro' },
                    { value: 'micro', label: 'Micro' },
                    { value: 'indoor', label: 'Indoor' },
                    { value: 'outdoor', label: 'Outdoor' }
                  ]} placeholder="Pilih site type" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Owner</label>
                  <FormInput field="owner_id" options={[
                    ...owners.map(owner => ({ value: owner.id.toString(), label: owner.name })),
                    { value: 'new', label: '+ Tambah Owner Baru' }
                  ]} placeholder="Pilih atau tambah owner" />
                </div>
                {isNewOwner && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Nama Owner Baru</label>
                      <FormInput field="owner_name" placeholder="Masukkan nama owner" />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Alamat Owner</label>
                      <FormInput field="owner_alamat" rows={3} placeholder="Alamat lengkap owner" />
                    </div>
                  </>
                )}
                {!isNewOwner && formData.owner_id && formData.owner_id !== 'new' && (
                  <div className="md:col-span-2">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Detail Owner</h4>
                      <p className="text-sm text-gray-600"><strong>Nama:</strong> {formData.owner_name}</p>
                      <p className="text-sm text-gray-600"><strong>Alamat:</strong> {formData.owner_alamat}</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'location' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Longitude</label>
                  <FormInput field="longitude" type="number" placeholder="Contoh: 110.4203" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Latitude</label>
                  <FormInput field="latitude" type="number" placeholder="Contoh: -7.7956" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Alamat Menara</label>
                  <FormInput field="alamat_menara" rows={3} placeholder="Alamat lengkap lokasi menara" />
                </div>
              </div>
            )}

            {activeTab === 'technical' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tinggi Menara (m)</label>
                  <FormInput field="tinggi_menara" type="number" placeholder="Contoh: 42" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tinggi Bangunan (m)</label>
                  <FormInput field="tinggi_bangunan" type="number" placeholder="Contoh: 15" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Jumlah Pengguna</label>
                  <FormInput field="jumlah_pengguna" type="number" placeholder="Jumlah operator" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Jumlah Kaki</label>
                  <FormInput field="jumlah_kaki" type="number" placeholder="Contoh: 4" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tower Type</label>
                  <FormInput field="tower_type" placeholder="Contoh: Lattice, Monopole" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">PRS</label>
                  <FormInput field="prs" placeholder="PRS" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">PRS ID</label>
                  <FormInput field="prs_id" placeholder="PRS ID" />
                </div>
              </div>
            )}

            {activeTab === 'permits' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nomor Ijin</label>
                  <FormInput field="no_ijin" placeholder="Nomor ijin" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Jenis Ijin</label>
                  <FormInput field="jenis_ijin" options={[
                    { value: 'IMB', label: 'IMB' },
                    { value: 'PBG', label: 'PBG' },
                    { value: 'Lainnya', label: 'Lainnya' }
                  ]} placeholder="Pilih jenis ijin" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tanggal Ijin</label>
                  <FormInput field="tanggal_ijin" type="date" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Berlaku Hingga</label>
                  <FormInput field="berlaku_hingga" type="date" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status Ijin</label>
                  <FormInput field="status_ijin" options={[
                    { value: 'Aktif', label: 'Aktif' },
                    { value: 'Tidak Aktif', label: 'Tidak Aktif' },
                    { value: 'Pending', label: 'Pending' },
                    { value: 'Expired', label: 'Expired' }
                  ]} placeholder="Pilih status ijin" />
                </div>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-between items-center">
            <div className="text-sm text-gray-600">
              <span className="text-red-500">*</span> Field wajib diisi
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => router.get(route('admin.towers.index'))}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
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
      </form>
    </AdminLayout>
  );
};

export default TowerCreatePage;
