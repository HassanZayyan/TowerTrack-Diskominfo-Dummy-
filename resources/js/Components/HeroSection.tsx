import React from 'react';

// Type definitions - simplified and more focused
type HeroVariant = 'brand' | 'neutral' | 'success' | 'warning' | 'info';
type HeroAlign = 'center' | 'left';

interface HeroSectionProps {
  readonly title: React.ReactNode;
  readonly subtitle?: React.ReactNode;
  readonly actions?: React.ReactNode;
  readonly variant?: HeroVariant;
  readonly align?: HeroAlign;
  readonly className?: string;
  readonly backgroundImage?: string;
  readonly fullScreen?: boolean;
}

// Variant classes defined outside component - no need for useMemo on static data
const VARIANT_CLASSES = {
  brand: {
    // Simplified gradient for better performance
    wrapper: 'bg-gradient-to-br from-red-600 to-red-800 text-white relative overflow-hidden',
    title: 'text-white hero-title-shadow',
    subtitle: 'text-red-100/90 hero-subtitle-shadow'
  },
  neutral: {
    wrapper: 'bg-gradient-to-br from-gray-50 to-gray-100 text-gray-900',
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
} as const;

// Optimized hero section - removed excessive useMemo, inline styles, and style injection
const HeroSection: React.FC<HeroSectionProps> = React.memo<HeroSectionProps>((
  {
    title,
    subtitle,
    actions,
    variant = 'brand',
    align = 'center',
    className = '',
    backgroundImage,
    fullScreen = false
  }
): JSX.Element => {
  const isCenter = align === 'center';
  const current = VARIANT_CLASSES[variant];

  // Container classes - simplified without excessive memoization
  const containerClasses = [
    'relative overflow-hidden',
    current.wrapper,
    fullScreen ? 'min-h-screen flex items-center justify-center' : 'rounded-xl',
    className
  ].filter(Boolean).join(' ');

  // Content classes - simplified
  const contentClasses = [
    'relative z-10 px-4 sm:px-6 lg:px-8',
    fullScreen ? 'w-full' : 'py-10 sm:py-14',
    isCenter ? 'text-center' : 'text-left'
  ].join(' ');

  // Background styles - only create if backgroundImage exists
  const backgroundStyles: React.CSSProperties | undefined = backgroundImage ? {
    backgroundImage: `url(${backgroundImage})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
    // Scroll instead of fixed for better performance
    backgroundAttachment: 'scroll'
  } : undefined;

  return (
    <div 
      className={containerClasses}
      style={backgroundStyles}
    >
      {/* Background overlay for better text readability */}
      {backgroundImage && (
        <div className="absolute inset-0 bg-black bg-opacity-40" />
      )}

      <div className={`${contentClasses} animate-fade-in-up`}>
        {/* Content container */}
        <div className="mx-auto max-w-5xl relative">
          <h1 
            className={`
              relative z-10 font-bold tracking-tight leading-tight
              ${current.title}
              text-4xl sm:text-5xl lg:text-6xl xl:text-7xl
              animate-fade-in-up
            `}
          >
            {title}
          </h1>
          
          {subtitle && (
            <p 
              className={`
                relative z-10 mt-4 sm:mt-6 leading-relaxed max-w-4xl
                text-lg sm:text-xl lg:text-2xl
                ${current.subtitle}
                ${isCenter ? 'mx-auto' : ''}
                animate-fade-in-up-delay-1
              `}
            >
              {subtitle}
            </p>
          )}
          
          {actions && (
            <div 
              className={`
                relative z-10 mt-6 sm:mt-8 
                flex flex-col sm:flex-row gap-3 sm:gap-4
                ${isCenter ? 'justify-center' : ''}
                animate-fade-in-up-delay-3
              `}
            >
              {actions}
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

// Set display name for better debugging experience
HeroSection.displayName = 'HeroSection';

// Export with proper TypeScript annotations
export default HeroSection;
export type { HeroSectionProps, HeroVariant, HeroAlign };




