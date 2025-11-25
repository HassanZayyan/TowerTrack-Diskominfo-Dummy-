import React from 'react';

interface PageHeaderProps {
  title: string;
  description?: string;
  showLogo?: boolean;
  logoPath?: string;
  backgroundColor?: string;
  className?: string;
}

/**
 * Reusable Page Header Component
 * DRY: Eliminates duplication of page header with logo pattern
 * 
 * @example
 * ```tsx
 * <PageHeader
 *   title="Form Masukan - Sampaikan Masukan Anda"
 *   description="Silakan isi form di bawah ini untuk menyampaikan masukan atau saran"
 *   showLogo
 * />
 * ```
 */
export default function PageHeader({
  title,
  description,
  showLogo = true,
  logoPath = '/images/kab-smg-logo.png',
  backgroundColor = '#FFF8E1',
  className = '',
}: PageHeaderProps) {
  return (
    <div
      className={`rounded-lg shadow mb-8 px-4 sm:px-6 py-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${className}`}
      style={{ backgroundColor }}
    >
      <div>
        <h1 className="text-xl sm:text-2xl font-bold mb-1" style={{ color: '#212121' }}>
          {title}
        </h1>
        {description && (
          <p className="text-sm sm:text-base" style={{ color: '#212121', opacity: 0.85 }}>
            {description}
          </p>
        )}
      </div>
      {showLogo && (
        <img
          src={logoPath}
          alt="Logo"
          className="h-8 w-8 sm:h-10 sm:w-10 hidden xs:block"
        />
      )}
    </div>
  );
}

