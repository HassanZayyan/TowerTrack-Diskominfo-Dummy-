import React, { useState, useRef } from 'react';
import { Head, router, Link } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import HeroSection from '@/Components/HeroSection';
import SecondaryButton from '@/Components/SecondaryButton';

interface Owner {
  id: number;
  name: string;
}

interface Props {
  templateUrl: string;
  availableOwners: Owner[];
}

interface PreviewData {
  success: boolean;
  detected_mapping: Record<string, string>;
  missing_columns: string[];
  preview: any[][];
  errors: Array<{ row: number; errors: string[] }>;
  can_import: boolean;
  total_rows: number;
  message?: string;
}

const TowerImportPage: React.FC<Props> = ({ templateUrl, availableOwners }) => {
  const [file, setFile] = useState<File | null>(null);
  const [mode, setMode] = useState<'insert' | 'update' | 'upsert'>('insert');
  const [ownerId, setOwnerId] = useState<string>('');
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [previewData, setPreviewData] = useState<PreviewData | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Validate file extension - only Excel files allowed
      const fileName = selectedFile.name.toLowerCase();
      const validExtensions = ['.xlsx', '.xls'];
      const isValidFile = validExtensions.some(ext => fileName.endsWith(ext));
      
      if (!isValidFile) {
        setError('File harus berupa template Excel (.xlsx atau .xls). CSV tidak didukung.');
        e.target.value = ''; // Clear file input
        return;
      }
      
      setFile(selectedFile);
      setError(null);
      setPreviewData(null);
    }
  };

  const handlePreview = async () => {
    if (!file) {
      setError('Pilih file terlebih dahulu');
      return;
    }

    setIsPreviewing(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(route('admin.towers.import.preview'), {
        method: 'POST',
        headers: {
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
        },
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        setPreviewData(data);
      } else {
        setError(data.message || 'Gagal membaca file');
      }
    } catch (err) {
      setError('Terjadi kesalahan saat membaca file');
      console.error(err);
    } finally {
      setIsPreviewing(false);
    }
  };

  const handleImport = async () => {
    if (!file || !previewData?.can_import) {
      setError('File tidak valid atau belum di-preview');
      return;
    }

    setIsImporting(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('mode', mode);
    if (ownerId) {
      formData.append('owner_id', ownerId);
    }

    router.post(route('admin.towers.import.process'), formData, {
      forceFormData: true,
      onSuccess: () => {
        // Success handled by redirect
      },
      onError: (errors) => {
        setError(errors.file || 'Import gagal');
        setIsImporting(false);
      },
    });
  };

  const handleDownloadTemplate = () => {
    window.location.href = templateUrl;
  };

  return (
    <AdminLayout>
      <Head title="Import Tower" />
      
      <div className="mb-8">
        <HeroSection
          title="Import Data Tower"
          subtitle="Import data tower dari template Excel (.xlsx atau .xls)"
          variant="brand"
          align="left"
          actions={
            <Link
              href={route('admin.towers.index')}
              className="inline-flex items-center justify-center px-4 py-2 bg-white/20 backdrop-blur-sm text-white font-medium rounded-lg hover:bg-white/30 transition-all duration-200 shadow-sm hover:shadow-md"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Kembali ke Daftar Tower
            </Link>
          }
        />
      </div>

      <div className="py-4 sm:py-6">
          <div className="bg-white overflow-hidden shadow-xl rounded-xl border border-gray-200">
            <div className="p-4 sm:p-6 lg:p-8 space-y-6">
              {/* Template Download */}
              <div className="bg-gradient-to-r from-red-50 to-red-100 border border-red-200 rounded-xl p-4 sm:p-6">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 p-2 bg-red-200 rounded-lg">
                    <svg className="w-6 h-6 text-red-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">
                      Template Import
                    </h3>
                    <p className="text-sm text-gray-700 mb-4">
                      Download template Excel untuk memastikan format data sesuai. Template bersifat opsional, 
                      sistem akan otomatis mendeteksi kolom dari file Anda.
                    </p>
                    <button
                      onClick={handleDownloadTemplate}
                      className="inline-flex items-center px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all duration-200 shadow-sm hover:shadow-md font-medium text-sm sm:text-base"
                    >
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Download Template
                    </button>
                  </div>
                </div>
              </div>

              {/* File Upload */}
              <div className="bg-gray-50 rounded-xl p-4 sm:p-6 border border-gray-200">
                <label className="block text-sm sm:text-base font-semibold text-gray-900 mb-3">
                  Pilih File Excel
                </label>
                <div className="space-y-3">
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".xlsx,.xls"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="flex-1 sm:flex-none inline-flex items-center justify-center px-4 sm:px-6 py-3 border-2 border-dashed border-gray-300 rounded-xl text-sm sm:text-base font-medium text-gray-700 bg-white hover:border-red-400 hover:bg-red-50 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                    >
                      <svg className="w-5 h-5 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      {file ? (
                        <span className="truncate max-w-xs">{file.name}</span>
                      ) : (
                        <span>Pilih File Excel</span>
                      )}
                    </button>
                    {file && (
                      <button
                        onClick={() => {
                          setFile(null);
                          setPreviewData(null);
                          if (fileInputRef.current) {
                            fileInputRef.current.value = '';
                          }
                        }}
                        className="inline-flex items-center justify-center px-4 py-3 bg-red-50 text-red-700 rounded-xl hover:bg-red-100 transition-colors text-sm font-medium border border-red-200"
                      >
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        Hapus
                      </button>
                    )}
                  </div>
                  {file && (
                    <div className="flex items-center gap-2 text-sm text-gray-600 bg-white rounded-lg p-3 border border-gray-200">
                      <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="flex-1 truncate">{file.name}</span>
                      <span className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                    </div>
                  )}
                  <p className="text-xs sm:text-sm text-gray-500 flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Format yang didukung: .xlsx, .xls (Maksimal 10MB)
                  </p>
                </div>
              </div>

              {/* Mode Selection */}
              <div className="bg-gray-50 rounded-xl p-4 sm:p-6 border border-gray-200">
                <label className="block text-sm sm:text-base font-semibold text-gray-900 mb-4">
                  Mode Import
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <label className={`relative flex items-start p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                    mode === 'insert' 
                      ? 'border-red-500 bg-red-50 shadow-sm' 
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}>
                    <input
                      type="radio"
                      value="insert"
                      checked={mode === 'insert'}
                      onChange={(e) => setMode(e.target.value as any)}
                      className="sr-only"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                          mode === 'insert' ? 'border-red-500' : 'border-gray-300'
                        }`}>
                          {mode === 'insert' && (
                            <div className="w-2 h-2 rounded-full bg-red-500"></div>
                          )}
                        </div>
                        <span className={`font-semibold text-sm sm:text-base ${
                          mode === 'insert' ? 'text-red-700' : 'text-gray-700'
                        }`}>
                          Insert Only
                        </span>
                      </div>
                      <p className="text-xs sm:text-sm text-gray-600 ml-6">
                        Hanya menambahkan data baru (skip duplikat)
                      </p>
                    </div>
                  </label>
                  <label className={`relative flex items-start p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                    mode === 'update' 
                      ? 'border-red-500 bg-red-50 shadow-sm' 
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}>
                    <input
                      type="radio"
                      value="update"
                      checked={mode === 'update'}
                      onChange={(e) => setMode(e.target.value as any)}
                      className="sr-only"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                          mode === 'update' ? 'border-red-500' : 'border-gray-300'
                        }`}>
                          {mode === 'update' && (
                            <div className="w-2 h-2 rounded-full bg-red-500"></div>
                          )}
                        </div>
                        <span className={`font-semibold text-sm sm:text-base ${
                          mode === 'update' ? 'text-red-700' : 'text-gray-700'
                        }`}>
                          Update
                        </span>
                      </div>
                      <p className="text-xs sm:text-sm text-gray-600 ml-6">
                        Update data yang sudah ada (skip data baru)
                      </p>
                    </div>
                  </label>
                  <label className={`relative flex items-start p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                    mode === 'upsert' 
                      ? 'border-red-500 bg-red-50 shadow-sm' 
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}>
                    <input
                      type="radio"
                      value="upsert"
                      checked={mode === 'upsert'}
                      onChange={(e) => setMode(e.target.value as any)}
                      className="sr-only"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                          mode === 'upsert' ? 'border-red-500' : 'border-gray-300'
                        }`}>
                          {mode === 'upsert' && (
                            <div className="w-2 h-2 rounded-full bg-red-500"></div>
                          )}
                        </div>
                        <span className={`font-semibold text-sm sm:text-base ${
                          mode === 'upsert' ? 'text-red-700' : 'text-gray-700'
                        }`}>
                          Upsert
                        </span>
                      </div>
                      <p className="text-xs sm:text-sm text-gray-600 ml-6">
                        Insert data baru atau update jika sudah ada
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Owner Selection (for admin/operator) */}
              {availableOwners.length > 0 && (
                <div className="bg-gray-50 rounded-xl p-4 sm:p-6 border border-gray-200">
                  <label className="block text-sm sm:text-base font-semibold text-gray-900 mb-3">
                    Owner <span className="text-gray-500 font-normal">(Opsional)</span>
                  </label>
                  <select
                    value={ownerId}
                    onChange={(e) => setOwnerId(e.target.value)}
                    className="w-full border-2 border-gray-300 rounded-xl p-3 text-sm sm:text-base focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors bg-white"
                  >
                    <option value="">Pilih Owner (kosongkan jika dari Excel)</option>
                    {availableOwners.map((owner) => (
                      <option key={owner.id} value={owner.id}>
                        {owner.name}
                      </option>
                    ))}
                  </select>
                  <p className="mt-2 text-xs text-gray-500">
                    Owner default akan digunakan jika kolom Owner tidak ditemukan di Excel
                  </p>
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-4 flex items-start gap-3">
                  <svg className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-sm text-red-800 flex-1">{error}</p>
                </div>
              )}

              {/* Preview Section */}
              {previewData && (
                <div className="border-t border-gray-200 pt-6 space-y-4">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-red-100 rounded-lg">
                      <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </div>
                    <h3 className="text-lg sm:text-xl font-semibold text-gray-900">
                      Preview Data
                    </h3>
                  </div>
                  
                  {/* Detected Mapping */}
                  <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-xl p-4 sm:p-6">
                    <p className="text-sm sm:text-base font-semibold text-green-900 mb-3 flex items-center gap-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Kolom yang Terdeteksi
                    </p>
                    <div className="bg-white rounded-lg p-3 sm:p-4 border border-green-200">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs sm:text-sm">
                        {Object.entries(previewData.detected_mapping).map(([dbField, excelColumn]) => (
                          <div key={dbField} className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded-lg">
                            <span className="text-gray-600 font-medium">{dbField}:</span>
                            <span className="font-semibold text-gray-900">{excelColumn}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Missing Columns */}
                  {previewData.missing_columns.length > 0 && (
                    <div className="bg-yellow-50 border-l-4 border-yellow-500 rounded-lg p-4 sm:p-6">
                      <p className="text-sm sm:text-base font-semibold text-yellow-900 mb-3 flex items-center gap-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                        Kolom Wajib Tidak Ditemukan
                      </p>
                      <ul className="list-disc list-inside text-sm text-yellow-800 space-y-1">
                        {previewData.missing_columns.map((col) => (
                          <li key={col} className="font-medium">{col}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Errors */}
                  {previewData.errors.length > 0 && (
                    <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-4 sm:p-6">
                      <p className="text-sm sm:text-base font-semibold text-red-900 mb-3 flex items-center gap-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Error pada Preview ({previewData.errors.length} baris)
                      </p>
                      <div className="space-y-2 text-xs sm:text-sm text-red-800 max-h-48 overflow-y-auto">
                        {previewData.errors.slice(0, 10).map((err, idx) => (
                          <div key={idx} className="bg-white rounded-lg p-2 border border-red-200">
                            <span className="font-semibold">Baris {err.row}:</span> {err.errors.join(', ')}
                          </div>
                        ))}
                        {previewData.errors.length > 10 && (
                          <div className="text-red-600 font-medium pt-2">
                            ... dan {previewData.errors.length - 10} error lainnya
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Summary */}
                  <div className={`rounded-xl p-4 sm:p-6 border-2 ${
                    previewData.can_import 
                      ? 'bg-green-50 border-green-300' 
                      : 'bg-yellow-50 border-yellow-300'
                  }`}>
                    <div className="flex items-center justify-between flex-wrap gap-3">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${
                          previewData.can_import ? 'bg-green-200' : 'bg-yellow-200'
                        }`}>
                          {previewData.can_import ? (
                            <svg className="w-6 h-6 text-green-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          ) : (
                            <svg className="w-6 h-6 text-yellow-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                            </svg>
                          )}
                        </div>
                        <div>
                          <p className={`text-sm sm:text-base font-semibold ${
                            previewData.can_import ? 'text-green-900' : 'text-yellow-900'
                          }`}>
                            Total baris: <strong className="text-lg">{previewData.total_rows}</strong>
                          </p>
                          {previewData.can_import ? (
                            <p className="text-sm text-green-700 mt-1">✓ File siap diimport</p>
                          ) : (
                            <p className="text-sm text-yellow-700 mt-1">⚠ Perbaiki error terlebih dahulu</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 pt-6 border-t border-gray-200">
                <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                  {!previewData && (
                    <button
                      onClick={handlePreview}
                      disabled={!file || isPreviewing}
                      className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 bg-gray-600 text-white rounded-xl hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-md font-medium text-sm sm:text-base"
                    >
                      {isPreviewing ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Memproses...
                        </>
                      ) : (
                        <>
                          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          Preview Data
                        </>
                      )}
                    </button>
                  )}
                  {previewData?.can_import && (
                    <button
                      onClick={handleImport}
                      disabled={isImporting}
                      className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-md font-medium text-sm sm:text-base"
                    >
                      {isImporting ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Mengimport...
                        </>
                      ) : (
                        <>
                          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                          </svg>
                          Import Data
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
      </div>
    </AdminLayout>
  );
};

export default TowerImportPage;

