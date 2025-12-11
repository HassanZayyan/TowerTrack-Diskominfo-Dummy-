import React from 'react';

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

  // Handle checkbox change
  const handleProviderCheckboxChange = (providerId: number, checked: boolean) => {
    const currentProviders = providers || [];
    if (checked) {
      onChange([...currentProviders, providerId]);
    } else {
      onChange(currentProviders.filter(id => id !== providerId));
    }
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
    </>
  );
}

