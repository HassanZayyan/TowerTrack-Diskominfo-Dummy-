import React, { useMemo } from 'react';
import AnimatedButton from './AnimatedButton';

// Strict type definitions for better type safety
type HeroVariant = 'brand' | 'neutral' | 'success' | 'warning' | 'info';
type HeroAlign = 'center' | 'left';

// Comprehensive interface with proper TypeScript annotations
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

// Type definition for variant classes to ensure type safety
interface VariantClasses {
  readonly wrapper: string;
  readonly title: string;
  readonly subtitle: string;
}

// Lightweight, purely CSS-based hero section with TypeScript best practices
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
  // Memoized boolean for performance optimization
  const isCenter: boolean = useMemo(() => align === 'center', [align]);

  // Memoized variant classes for better performance and type safety
  const variantClasses: Record<HeroVariant, VariantClasses> = useMemo(() => ({
    brand: {
      wrapper: 'bg-gradient-to-br from-red-700 via-red-600 to-red-800 text-white relative overflow-hidden',
      title: 'text-white',
      subtitle: 'text-red-100/90'
    } as const,
    neutral: {
      wrapper: 'bg-gradient-to-br from-gray-50  via-white to-gray-100 text-gray-900',
      title: 'text-gray-900',
      subtitle: 'text-gray-600'
    } as const,
    success: {
      wrapper: 'bg-gradient-to-br from-green-600 to-green-700 text-white',
      title: 'text-white',
      subtitle: 'text-white/90'
    } as const,
    warning: {
      wrapper: 'bg-gradient-to-br from-amber-500 to-amber-600 text-gray-900',
      title: 'text-gray-900',
      subtitle: 'text-gray-800'
    } as const,
    info: {
      wrapper: 'bg-gradient-to-br from-blue-600 to-blue-700 text-white',
      title: 'text-white',
      subtitle: 'text-white/90'
    } as const
  }), []);

  // Memoized current variant for type safety
  const current: VariantClasses = useMemo(() => variantClasses[variant], [variantClasses, variant]);

  // Memoized container classes for performance optimization
  const containerClasses: string = useMemo(() => {
    const baseClasses = 'relative overflow-hidden';
    const variantWrapper = current.wrapper;
    const screenClasses = fullScreen 
      ? 'min-h-screen flex items-center justify-center'
      : 'rounded-xl';
    
    return `${baseClasses} ${variantWrapper} ${className} ${screenClasses}`.trim();
  }, [current.wrapper, className, fullScreen]);

  // Memoized content classes for performance optimization
  const contentClasses: string = useMemo(() => {
    const baseClasses = 'relative z-10 px-4 sm:px-6 lg:px-8';
    const alignmentClasses = isCenter ? 'text-center' : 'text-left';
    const paddingClasses = fullScreen ? 'w-full' : 'py-10 sm:py-14';
    
    return `${baseClasses} ${paddingClasses} ${alignmentClasses}`.trim();
  }, [isCenter, fullScreen]);

  // Memoized background styles for performance optimization
  const backgroundStyles: React.CSSProperties = useMemo(() => {
    if (!backgroundImage) return {};
    
    return {
      backgroundImage: `url(${backgroundImage})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
      backgroundAttachment: fullScreen ? 'fixed' : 'scroll'
    } as const;
  }, [backgroundImage, fullScreen]);

  return (
    <div 
      className={containerClasses}
      style={backgroundStyles}
    >
      {/* Background overlay for better text readability when using background image */}
      {backgroundImage && (
        <div className="absolute inset-0 bg-black bg-opacity-40" />
      )}
      

      


      <div className={`${contentClasses} animate-fade-in-up`}>
        {/* Content container with enhanced visual separation */}
        <div className="mx-auto max-w-5xl relative">

          <h1 
            className={`relative z-10 font-bold tracking-tight ${current.title} text-4xl sm:text-5xl lg:text-6xl xl:text-7xl animate-fade-in-up leading-tight`}
            style={{ 
              animation: 'fadeInUp 1s ease-out',
              textShadow: '0 4px 8px rgba(0,0,0,0.4), 0 2px 4px rgba(59, 130, 246, 0.2)',
              fontFamily: 'system-ui, -apple-system, sans-serif',
              letterSpacing: '-0.02em'
            }}
          >
            {title}
          </h1>
          
          {subtitle && (
            <p 
              className={`relative z-10 mt-4 sm:mt-6 text-lg sm:text-xl lg:text-2xl ${current.subtitle} animate-fade-in-up leading-relaxed max-w-4xl ${isCenter ? 'mx-auto' : ''}`}
              style={{ 
                animation: 'fadeInUp 1s ease-out 0.3s both',
                textShadow: '0 2px 4px rgba(0,0,0,0.3), 0 1px 2px rgba(99, 102, 241, 0.2)',
                fontWeight: '400',
                letterSpacing: '0.01em'
              }}
            >
              {subtitle}
            </p>
          )}
          
          {actions && (
            <div 
              className={`relative z-10 mt-6 sm:mt-8 flex flex-col sm:flex-row gap-3 sm:gap-4 ${isCenter ? 'justify-center' : ''} animate-fade-in-up`}
              style={{ animation: 'fadeInUp 1s ease-out 0.6s both' }}
            >
              <div className="relative group">
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                  {actions}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Custom CSS animations using style tag */}
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes fadeInUp {
            from {
              opacity: 0;
              transform: translateY(40px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          
          .animate-fade-in-up {
            animation: fadeInUp 1.2s ease-out;
          }
        `
      }} />
    </div>
  );
});

// Set display name for better debugging experience
HeroSection.displayName = 'HeroSection';

// Export with proper TypeScript annotations
export default HeroSection;
export type { HeroSectionProps, HeroVariant, HeroAlign };




