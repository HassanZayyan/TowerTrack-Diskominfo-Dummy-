import React from 'react';
import { Head, useForm, Link } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';

interface PageProps {
  availableAreas: string[];
  availableStatuses: string[];
}

export default function RouteCreate({ availableAreas, availableStatuses }: PageProps) {
  const { data, setData, post, processing, errors } = useForm({
    name: '',
    area: 'ungaran',
    description: '',
    status: 'active',
    color: '#3B82F6',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    post(route('admin.fo-management.routes.store'));
  };

  const statusLabels: { [key: string]: string } = {
    active: 'Aktif',
    inactive: 'Non-aktif',
    maintenance: 'Maintenance'
  };

  return (
    <AdminLayout title="Tambah Jalur FO">
      <Head title="Tambah Jalur FO" />
      
      <div className="space-y-6">

        {/* Enhanced Header */}
        <div className="bg-gradient-to-r from-red-600 to-red-700 rounded-2xl shadow-2xl mb-8 overflow-hidden">
          <div className="px-8 py-8 text-white relative">
            <div className="absolute inset-0 bg-black opacity-10"></div>
            <div className="relative z-10">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-4 bg-white bg-opacity-20 rounded-xl backdrop-blur-sm">
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-3xl font-bold mb-2">Tambah Jalur FO Baru</h1>
                  <p className="text-red-100 text-lg">
                    Buat jalur fiber optic baru dengan menentukan koordinat dan informasi jalur
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-6 text-sm text-red-100">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                  <span>Langkah 1: Informasi Dasar</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                  <span>Langkah 2: Koordinat Jalur</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                  <span>Langkah 3: Simpan</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Form Container */}
        <div className="bg-white shadow-2xl rounded-2xl border border-gray-100 overflow-hidden">
          <form onSubmit={handleSubmit} className="space-y-8 p-8">
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
              {/* Basic Information */}
              <div className="space-y-6">
                <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-xl p-6 border border-green-100">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-green-600 rounded-lg">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">Informasi Dasar</h3>
                  </div>
                  <p className="text-gray-600 text-sm">Masukkan informasi dasar untuk jalur fiber optic</p>
                </div>
                
                <div className="space-y-6">
                  <div>
                    <label htmlFor="name" className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                      <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                      </svg>
                      Nama Jalur <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        id="name"
                        value={data.name}
                        onChange={(e) => setData('name', e.target.value)}
                        className={`block w-full px-4 py-3 rounded-xl border-2 transition-all duration-200 focus:outline-none ${
                          errors.name 
                            ? 'border-red-300 focus:border-green-500 focus:ring-4 focus:ring-green-100 bg-red-50' 
                            : 'border-gray-200 focus:border-green-500 focus:ring-4 focus:ring-green-100 hover:border-gray-300'
                        }`}
                        placeholder="Contoh: Jalur Utama Ungaran - Semarang"
                      />
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                    </div>
                    {errors.name && (
                      <div className="mt-2 flex items-center gap-2 text-sm text-green-600">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {errors.name}
                      </div>
                    )}
                  </div>

                  <div>
                    <label htmlFor="area" className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                      <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      </svg>
                      Area <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <select
                        id="area"
                        value={data.area}
                        onChange={(e) => setData('area', e.target.value)}
                        className={`block w-full px-4 py-3 rounded-xl border-2 transition-all duration-200 focus:outline-none appearance-none bg-white ${
                          errors.area 
                            ? 'border-red-300 focus:border-green-500 focus:ring-4 focus:ring-green-100 bg-red-50' 
                            : 'border-gray-200 focus:border-green-500 focus:ring-4 focus:ring-green-100 hover:border-gray-300'
                        }`}
                      >
                        <option value="">Pilih Area</option>
                        {availableAreas.map((area) => (
                          <option key={area} value={area}>
                            {area.charAt(0).toUpperCase() + area.slice(1)}
                          </option>
                        ))}
                      </select>
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                    {errors.area && (
                      <div className="mt-2 flex items-center gap-2 text-sm text-green-600">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {errors.area}
                      </div>
                    )}
                  </div>

                  <div>
                    <label htmlFor="status" className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                      <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Status <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <select
                        id="status"
                        value={data.status}
                        onChange={(e) => setData('status', e.target.value)}
                        className={`block w-full px-4 py-3 rounded-xl border-2 transition-all duration-200 focus:outline-none appearance-none bg-white ${
                          errors.status 
                            ? 'border-red-300 focus:border-green-500 focus:ring-4 focus:ring-green-100 bg-red-50' 
                            : 'border-gray-200 focus:border-green-500 focus:ring-4 focus:ring-green-100 hover:border-gray-300'
                        }`}
                      >
                        <option value="">Pilih Status</option>
                        {availableStatuses.map((status) => (
                          <option key={status} value={status}>
                            {statusLabels[status] || status}
                          </option>
                        ))}
                      </select>
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                    {errors.status && (
                      <div className="mt-2 flex items-center gap-2 text-sm text-green-600">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {errors.status}
                      </div>
                    )}
                  </div>

                  <div>
                    <label htmlFor="color" className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                      <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM7 3H5a2 2 0 00-2 2v12a4 4 0 004 4h2a2 2 0 002-2V5a2 2 0 00-2-2z" />
                      </svg>
                      Warna Jalur
                    </label>
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <input
                          type="color"
                          id="color"
                          value={data.color}
                          onChange={(e) => setData('color', e.target.value)}
                          className="h-12 w-20 rounded-xl border-2 border-gray-200 cursor-pointer hover:border-red-300 transition-colors"
                        />
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-600 rounded-full flex items-center justify-center">
                          <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      </div>
                      <div className="flex-1">
                        <input
                          type="text"
                          value={data.color}
                          onChange={(e) => setData('color', e.target.value)}
                          className="block w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-green-500 focus:ring-4 focus:ring-green-100 focus:outline-none transition-all duration-200 hover:border-gray-300"
                          placeholder="#3B82F6"
                        />
                      </div>
                    </div>
                    {errors.color && (
                      <div className="mt-2 flex items-center gap-2 text-sm text-green-600">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {errors.color}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-6">
                <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 rounded-xl p-6 border border-yellow-100">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-yellow-600 rounded-lg">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">Deskripsi Jalur</h3>
                  </div>
                  <p className="text-gray-600 text-sm">Tambahkan deskripsi detail untuk jalur fiber optic</p>
                </div>
                
                <div>
                  <label htmlFor="description" className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                    <svg className="w-4 h-4 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Deskripsi Jalur
                  </label>
                  <div className="relative">
                    <textarea
                      id="description"
                      rows={6}
                      value={data.description}
                      onChange={(e) => setData('description', e.target.value)}
                      className={`block w-full px-4 py-3 rounded-xl border-2 transition-all duration-200 focus:outline-none resize-none ${
                        errors.description 
                          ? 'border-red-300 focus:border-green-500 focus:ring-4 focus:ring-green-100 bg-red-50' 
                          : 'border-gray-200 focus:border-yellow-500 focus:ring-4 focus:ring-yellow-100 hover:border-gray-300'
                      }`}
                      placeholder="Masukkan deskripsi detail jalur fiber optic, termasuk informasi teknis, lokasi penting, atau catatan khusus..."
                    />
                    <div className="absolute bottom-3 right-3 text-xs text-gray-400">
                      {data.description.length}/500
                    </div>
                  </div>
                  {errors.description && (
                    <div className="mt-2 flex items-center gap-2 text-sm text-green-600">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {errors.description}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Point Management Info */}
            <div className="xl:col-span-2 space-y-6">
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-blue-600 rounded-lg">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Manajemen Titik FO</h3>
                    <p className="text-gray-600 text-sm">Tambahkan titik-titik FO setelah jalur dibuat</p>
                  </div>
                </div>
                <div className="bg-white/50 rounded-lg p-4 mb-4">
                  <h4 className="font-semibold text-gray-800 mb-2">📍 Cara Menambahkan Titik FO:</h4>
                  <ol className="space-y-2 text-sm text-gray-700">
                    <li className="flex items-start gap-2">
                      <span className="font-semibold text-blue-600">1.</span>
                      <span>Buat jalur FO terlebih dahulu dengan mengisi form ini</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="font-semibold text-blue-600">2.</span>
                      <span>Setelah jalur berhasil dibuat, Anda akan diarahkan ke halaman detail jalur</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="font-semibold text-blue-600">3.</span>
                      <span>Di halaman detail, klik tombol "Tambah Titik" untuk menambahkan titik-titik FO</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="font-semibold text-blue-600">4.</span>
                      <span>Jalur akan otomatis terbentuk berdasarkan urutan titik yang ditambahkan</span>
                    </li>
                  </ol>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <svg className="w-4 h-4 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Minimal 2 titik diperlukan untuk membentuk jalur FO</span>
                </div>
              </div>
            </div>

            {/* Submit Buttons */}
            <div className="bg-white border-t border-gray-200 px-8 py-6 mt-8">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Pastikan semua data sudah benar sebelum menyimpan</span>
                </div>
                <div className="flex items-center gap-3">
                  <Link
                    href={route('admin.fo-management.routes.list')}
                    className="px-6 py-3 border-2 border-gray-300 rounded-xl text-sm font-semibold text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-4 focus:ring-gray-100 transition-all duration-200"
                  >
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      Batal
                    </div>
                  </Link>
                  <button
                    type="submit"
                    disabled={processing}
                    className="px-8 py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 disabled:from-gray-400 disabled:to-gray-500 text-white font-bold rounded-xl shadow-lg hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-red-200 transition-all duration-200 transform hover:scale-105 disabled:transform-none disabled:cursor-not-allowed"
                  >
                    <div className="flex items-center gap-2">
                      {processing ? (
                        <>
                          <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Menyimpan...
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Simpan Jalur
                        </>
                      )}
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
    </AdminLayout>
  );
}
