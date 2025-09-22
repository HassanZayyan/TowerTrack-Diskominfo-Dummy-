import React from 'react';

type HeroVariant = 'brand' | 'neutral' | 'success' | 'warning' | 'info';
type HeroAlign = 'center' | 'left';

interface HeroSectionProps {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
  variant?: HeroVariant;
  align?: HeroAlign;
  className?: string;
}

// Lightweight, purely CSS-based hero section for consistent visual hierarchy
const HeroSection: React.FC<HeroSectionProps> = ({
  title,
  subtitle,
  actions,
  variant = 'brand',
  align = 'center',
  className = ''
}) => {
  const isCenter = align === 'center';

  // Background + text color based on variant
  const variantClasses: Record<HeroVariant, { wrapper: string; title: string; subtitle: string; }> = {
    brand: {
      wrapper: 'bg-gradient-to-br from-red-600 to-red-700 text-white',
      title: 'text-white',
      subtitle: 'text-white/90'
    },
    neutral: {
      wrapper: 'bg-gradient-to-br from-gray-50 via-white to-gray-100 text-gray-900',
      title: 'text-gray-900',
      subtitle: 'text-gray-600'
    },
    success: {
      wrapper: 'bg-gradient-to-br from-green-600 to-green-700 text-white',
      title: 'text-white',
      subtitle: 'text-white/90'
    },
    warning: {
      wrapper: 'bg-gradient-to-br from-amber-500 to-amber-600 text-gray-900',
      title: 'text-gray-900',
      subtitle: 'text-gray-800'
    },
    info: {
      wrapper: 'bg-gradient-to-br from-blue-600 to-blue-700 text-white',
      title: 'text-white',
      subtitle: 'text-white/90'
    }
  };

  const current = variantClasses[variant];

  return (
    <div className={`relative overflow-hidden rounded-xl ${current.wrapper} ${className}`}>
      {/* Decorative radial spotlight (pure CSS, very cheap) */}
      <div className="pointer-events-none absolute -top-20 -left-20 h-72 w-72 rounded-full opacity-20 blur-3xl"
           style={{ background: 'radial-gradient(circle at center, rgba(255,255,255,0.9), rgba(255,255,255,0))' }} />
      <div className="pointer-events-none absolute -bottom-16 -right-16 h-72 w-72 rounded-full opacity-20 blur-3xl"
           style={{ background: 'radial-gradient(circle at center, rgba(255,255,255,0.7), rgba(255,255,255,0))' }} />

      <div className={`relative z-10 px-4 sm:px-6 lg:px-8 py-10 sm:py-14 ${isCenter ? 'text-center' : 'text-left'}`}>
        <div className="mx-auto max-w-5xl">
          <h1 className={`font-bold tracking-tight ${current.title} text-3xl sm:text-4xl lg:text-5xl`}>{title}</h1>
          {subtitle && (
            <p className={`mt-3 sm:mt-4 text-base sm:text-lg ${current.subtitle}`}>{subtitle}</p>
          )}
          {actions && (
            <div className={`mt-6 sm:mt-8 flex flex-col sm:flex-row gap-3 sm:gap-4 ${isCenter ? 'justify-center' : ''}`}>
              {actions}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HeroSection;


