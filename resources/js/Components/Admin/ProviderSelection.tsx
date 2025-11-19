import React, { useState } from 'react';
import { router, useForm } from '@inertiajs/react';

interface Provider {
  id: number;
  name: string;
}

interface ProviderSelectionProps {
  providers: number[];
  availableProviders: Provider[];
  onChange: (providers: number[]) => void;
  errors?: string | string[];
  colorScheme?: 'purple' | 'red';
  label?: string;
  useBackdropBlur?: boolean;
}

export default function ProviderSelection({
  providers = [],
  availableProviders = [],
  onChange,
  errors,
  colorScheme = 'purple',
  label = 'Pilih Provider',
  useBackdropBlur = false,
}: ProviderSelectionProps) {
  const [showProviderDialog, setShowProviderDialog] = useState(false);
  
  // Use Inertia.js useForm for proper CSRF handling and form management
  const { 
    data: providerForm, 
    setData: setProviderForm, 
    post: postProvider, 
    processing: isCreatingProvider, 
    errors: providerFormErrors, 
    reset: resetProviderForm,
    clearErrors: clearProviderErrors
  } = useForm({
    name: '',
    description: '',
  });

  // Handle checkbox change
  const handleProviderCheckboxChange = (providerId: number, checked: boolean) => {
    const currentProviders = providers || [];
    if (checked) {
      onChange([...currentProviders, providerId]);
    } else {
      onChange(currentProviders.filter(id => id !== providerId));
    }
  };

  // Handle quick create provider using Inertia.js standard
  const handleCreateProvider = () => {
    if (!providerForm.name.trim()) {
      return;
    }

    postProvider(route('admin.fo-management.providers.quick-create'), {
      preserveState: true,
      preserveScroll: true,
      onSuccess: (page: any) => {
        // Backend returns Inertia response with newProvider in flash data
        const newProvider = page?.props?.flash?.newProvider;
        
        if (newProvider) {
          // Add new provider to selection immediately
          const currentProviders = providers || [];
          onChange([...currentProviders, newProvider.id]);
        }
        
        // Reload available providers to get updated list using router.get
        router.get(window.location.pathname, {}, {
          only: ['availableProviders'],
          preserveState: true,
          preserveScroll: true,
          onSuccess: () => {
            setShowProviderDialog(false);
            resetProviderForm();
          },
        });
      },
      onError: (errors) => {
        // Errors are automatically handled by Inertia.js and available in providerFormErrors
        console.error('Error creating provider:', errors);
      },
    });
  };

  const colorClasses = {
    purple: {
      bg: 'from-purple-50 to-purple-100',
      border: 'border-purple-200',
      iconBg: 'from-purple-500 to-purple-600',
      title: 'text-purple-900',
      subtitle: 'text-purple-700',
      labelIcon: 'text-purple-600',
      checkbox: 'text-purple-600 focus:ring-purple-500',
      button: 'text-purple-600 border-purple-300 hover:bg-purple-50 hover:border-purple-400',
      dialogButton: 'from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700',
      focusRing: 'focus:ring-purple-100',
    },
    red: {
      bg: 'from-red-50 to-red-100',
      border: 'border-red-200',
      iconBg: 'from-red-500 to-red-600',
      title: 'text-red-900',
      subtitle: 'text-red-700',
      labelIcon: 'text-red-500',
      checkbox: 'text-red-600 focus:ring-red-500',
      button: 'text-red-600 border-red-300 hover:bg-red-50 hover:border-red-400',
      dialogButton: 'from-red-500 to-red-600 hover:from-red-600 hover:to-red-700',
      focusRing: 'focus:ring-red-100',
    },
  };

  const colors = colorClasses[colorScheme];

  return (
    <>
      <div className={`bg-gradient-to-r ${colors.bg} border ${colors.border} rounded-2xl p-4 sm:p-6`}>
        <div className="flex items-center gap-3 mb-4 sm:mb-6">
          <div className={`w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br ${colors.iconBg} rounded-xl flex items-center justify-center flex-shrink-0`}>
            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <div className="min-w-0 flex-1">
            <h3 className={`text-lg sm:text-xl font-bold ${colors.title}`}>Provider</h3>
            <p className={`text-xs sm:text-sm ${colors.subtitle}`}>
              (Opsional - bisa pilih lebih dari satu atau tidak memilih sama sekali)
            </p>
          </div>
        </div>
        
        <div>
          <label className={`flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3`}>
            <svg className={`w-4 h-4 ${colors.labelIcon}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            {label}
            <span className="text-gray-500 text-xs">(Opsional)</span>
          </label>
          
          {/* Checkbox List Container */}
          <div className={`border-2 rounded-xl p-4 space-y-2 max-h-64 overflow-y-auto ${
            errors 
              ? 'border-red-300 bg-red-50/50' 
              : useBackdropBlur
                ? 'border-gray-200 bg-white/50 backdrop-blur-sm'
                : 'border-gray-200 bg-white'
          }`}>
            {/* Regular Providers */}
            {availableProviders && availableProviders.length > 0 ? (
              availableProviders.map((provider) => (
                <label 
                  key={provider.id}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={providers.includes(provider.id)}
                    onChange={(e) => handleProviderCheckboxChange(provider.id, e.target.checked)}
                    className={`w-5 h-5 ${colors.checkbox} border-gray-300 rounded focus:ring-2`}
                  />
                  <span className="text-sm text-gray-700 flex-1">{provider.name}</span>
                </label>
              ))
            ) : (
              <p className="text-sm text-gray-500 italic text-center py-2">Tidak ada provider tersedia</p>
            )}

            {/* Button: Tambah Provider Baru */}
            <div className="pt-3 border-t border-gray-200 mt-3">
              <button
                type="button"
                onClick={() => {
                  setShowProviderDialog(true);
                  clearProviderErrors();
                }}
                className={`w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold ${colors.button} border-2 rounded-lg transition-all`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Tambah Provider Baru (Lainnya)
              </button>
            </div>
          </div>

          {/* Helper text */}
          <p className="text-xs text-gray-500 mt-2">
            💡 Kosongkan semua checkbox jika tidak ada provider untuk titik ini
          </p>

          {errors && (
            <div className="flex items-center gap-2 mt-2 text-sm text-red-600">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {typeof errors === 'string' ? errors : errors[0]}
            </div>
          )}
        </div>
      </div>

      {/* Quick Create Provider Dialog */}
      {showProviderDialog && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" 
          onClick={() => {
            if (!isCreatingProvider) {
              setShowProviderDialog(false);
              resetProviderForm();
            }
          }}
        >
          <div 
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6" 
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">Tambah Provider Baru</h3>
              <button
                onClick={() => {
                  if (!isCreatingProvider) {
                    setShowProviderDialog(false);
                    resetProviderForm();
                  }
                }}
                disabled={isCreatingProvider}
                className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label htmlFor="new_provider_name" className="block text-sm font-semibold text-gray-700 mb-2">
                  Nama Provider <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="new_provider_name"
                  value={providerForm.name}
                  onChange={(e) => {
                    setProviderForm('name', e.target.value);
                    clearProviderErrors('name');
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !isCreatingProvider && providerForm.name.trim()) {
                      handleCreateProvider();
                    }
                  }}
                  className={`w-full px-4 py-2 rounded-xl border-2 ${
                    providerFormErrors.name ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-purple-500'
                  } ${colors.focusRing} focus:ring-4 focus:outline-none transition-all`}
                  placeholder="Contoh: Telkomsel, XL, dll"
                  autoFocus
                  disabled={isCreatingProvider}
                />
                {providerFormErrors.name && (
                  <p className="text-xs text-red-600 mt-1">
                    {typeof providerFormErrors.name === 'string' ? providerFormErrors.name : providerFormErrors.name[0]}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="new_provider_description" className="block text-sm font-semibold text-gray-700 mb-2">
                  Deskripsi <span className="text-gray-500 text-xs">(Opsional)</span>
                </label>
                <textarea
                  id="new_provider_description"
                  value={providerForm.description}
                  onChange={(e) => setProviderForm('description', e.target.value)}
                  rows={3}
                  className={`w-full px-4 py-2 rounded-xl border-2 ${
                    providerFormErrors.description ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-purple-500'
                  } ${colors.focusRing} focus:ring-4 focus:outline-none resize-none transition-all`}
                  placeholder="Deskripsi singkat tentang provider..."
                  disabled={isCreatingProvider}
                />
                {providerFormErrors.description && (
                  <p className="text-xs text-red-600 mt-1">
                    {typeof providerFormErrors.description === 'string' ? providerFormErrors.description : providerFormErrors.description[0]}
                  </p>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    if (!isCreatingProvider) {
                      setShowProviderDialog(false);
                      resetProviderForm();
                    }
                  }}
                  disabled={isCreatingProvider}
                  className="flex-1 px-4 py-2 border-2 border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleCreateProvider}
                  disabled={isCreatingProvider || !providerForm.name.trim()}
                  className={`flex-1 px-4 py-2 bg-gradient-to-r ${colors.dialogButton} text-white font-semibold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2`}
                >
                  {isCreatingProvider ? (
                    <>
                      <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Menambahkan...
                    </>
                  ) : (
                    'Tambahkan'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

