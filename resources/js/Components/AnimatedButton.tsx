import React, { useMemo } from 'react';
import { ButtonHTMLAttributes } from 'react';

// Type definitions for button variants and sizes
type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'glass';
type ButtonSize = 'sm' | 'md' | 'lg' | 'xl';
type ButtonAnimation = 'bounce' | 'pulse' | 'scale' | 'slide' | 'glow';

// Comprehensive interface for AnimatedButton props
interface AnimatedButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'size'> {
  readonly variant?: ButtonVariant;
  readonly size?: ButtonSize;
  readonly animation?: ButtonAnimation;
  readonly loading?: boolean;
  readonly icon?: React.ReactNode;
  readonly iconPosition?: 'left' | 'right';
  readonly fullWidth?: boolean;
  readonly children: React.ReactNode;
}

// Type-safe variant classes
interface VariantClasses {
  readonly base: string;
  readonly hover: string;
  readonly active: string;
  readonly focus: string;
}

// Type-safe size classes
interface SizeClasses {
  readonly padding: string;
  readonly text: string;
  readonly icon: string;
}

// Type-safe animation classes
interface AnimationClasses {
  readonly base: string;
  readonly hover: string;
}

const AnimatedButton: React.FC<AnimatedButtonProps> = React.memo<AnimatedButtonProps>((
  {
    variant = 'primary',
    size = 'md',
    animation = 'scale',
    loading = false,
    icon,
    iconPosition = 'left',
    fullWidth = false,
    disabled,
    className = '',
    children,
    ...props
  }
): JSX.Element => {
  // Memoized variant classes for performance
  const variantClasses: Record<ButtonVariant, VariantClasses> = useMemo(() => ({
    primary: {
      base: 'bg-gradient-to-r from-red-600 to-red-700 text-white border border-red-600 shadow-lg',
      hover: 'hover:from-red-700 hover:to-red-800 hover:border-red-700 hover:shadow-xl',
      active: 'active:from-red-800 active:to-red-900',
      focus: 'focus:ring-4 focus:ring-red-500/30 focus:outline-none'
    } as const,
    secondary: {
      base: 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800 border border-gray-300 shadow-md',
      hover: 'hover:from-gray-200 hover:to-gray-300 hover:border-gray-400 hover:shadow-lg',
      active: 'active:from-gray-300 active:to-gray-400',
      focus: 'focus:ring-4 focus:ring-gray-500/30 focus:outline-none'
    } as const,
    outline: {
      base: 'bg-transparent text-red-600 border-2 border-red-600',
      hover: 'hover:bg-red-600 hover:text-white hover:shadow-lg',
      active: 'active:bg-red-700 active:border-red-700',
      focus: 'focus:ring-4 focus:ring-red-500/30 focus:outline-none'
    } as const,
    ghost: {
      base: 'bg-transparent text-red-600 border border-transparent',
      hover: 'hover:bg-red-50 hover:border-red-200',
      active: 'active:bg-red-100',
      focus: 'focus:ring-4 focus:ring-red-500/20 focus:outline-none'
    } as const,
    glass: {
      base: 'bg-white/10 text-white border border-white/30 backdrop-blur-sm shadow-lg',
      hover: 'hover:bg-white/20 hover:border-white/40 hover:shadow-xl',
      active: 'active:bg-white/30',
      focus: 'focus:ring-4 focus:ring-white/30 focus:outline-none'
    } as const
  }), []);

  // Memoized size classes for performance
  const sizeClasses: Record<ButtonSize, SizeClasses> = useMemo(() => ({
    sm: {
      padding: 'px-3 py-1.5',
      text: 'text-sm font-medium',
      icon: 'w-4 h-4'
    } as const,
    md: {
      padding: 'px-4 py-2.5',
      text: 'text-sm font-semibold',
      icon: 'w-5 h-5'
    } as const,
    lg: {
      padding: 'px-6 py-3',
      text: 'text-base font-semibold',
      icon: 'w-5 h-5'
    } as const,
    xl: {
      padding: 'px-8 py-4',
      text: 'text-lg font-bold',
      icon: 'w-6 h-6'
    } as const
  }), []);

  // Memoized animation classes for performance
  const animationClasses: Record<ButtonAnimation, AnimationClasses> = useMemo(() => ({
    bounce: {
      base: 'transition-all duration-200 ease-in-out',
      hover: 'hover:animate-bounce'
    } as const,
    pulse: {
      base: 'transition-all duration-300 ease-in-out',
      hover: 'hover:animate-pulse'
    } as const,
    scale: {
      base: 'transition-all duration-200 ease-in-out transform',
      hover: 'hover:scale-105 hover:-translate-y-0.5'
    } as const,
    slide: {
      base: 'transition-all duration-300 ease-in-out transform',
      hover: 'hover:translate-x-1'
    } as const,
    glow: {
      base: 'transition-all duration-300 ease-in-out',
      hover: 'hover:shadow-2xl hover:shadow-red-500/25'
    } as const
  }), []);

  // Memoized current classes
  const currentVariant: VariantClasses = useMemo(() => variantClasses[variant], [variantClasses, variant]);
  const currentSize: SizeClasses = useMemo(() => sizeClasses[size], [sizeClasses, size]);
  const currentAnimation: AnimationClasses = useMemo(() => animationClasses[animation], [animationClasses, animation]);

  // Memoized button classes
  const buttonClasses: string = useMemo(() => {
    const baseClasses = 'inline-flex items-center justify-center rounded-lg font-medium transition-all duration-200 ease-in-out transform';
    const widthClass = fullWidth ? 'w-full' : '';
    const disabledClasses = (disabled || loading) ? 'opacity-50 cursor-not-allowed pointer-events-none' : 'cursor-pointer';
    
    return [
      baseClasses,
      currentVariant.base,
      currentVariant.hover,
      currentVariant.active,
      currentVariant.focus,
      currentSize.padding,
      currentSize.text,
      currentAnimation.base,
      currentAnimation.hover,
      widthClass,
      disabledClasses,
      className
    ].filter(Boolean).join(' ');
  }, [currentVariant, currentSize, currentAnimation, fullWidth, disabled, loading, className]);

  // Memoized loading spinner
  const loadingSpinner: JSX.Element = useMemo(() => (
    <svg 
      className={`animate-spin ${currentSize.icon}`} 
      fill="none" 
      viewBox="0 0 24 24"
    >
      <circle 
        className="opacity-25" 
        cx="12" 
        cy="12" 
        r="10" 
        stroke="currentColor" 
        strokeWidth="4"
      />
      <path 
        className="opacity-75" 
        fill="currentColor" 
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  ), [currentSize.icon]);

  // Memoized icon element
  const iconElement: JSX.Element | null = useMemo(() => {
    if (loading) return loadingSpinner;
    if (!icon) return null;
    
    return (
      <span className={`${currentSize.icon} ${iconPosition === 'right' ? 'ml-2' : 'mr-2'}`}>
        {icon}
      </span>
    );
  }, [loading, icon, loadingSpinner, currentSize.icon, iconPosition]);

  return (
    <button
      className={buttonClasses}
      disabled={disabled || loading}
      {...props}
    >
      {iconPosition === 'left' && iconElement}
      <span className={loading ? 'opacity-0' : 'opacity-100 transition-opacity duration-200'}>
        {children}
      </span>
      {iconPosition === 'right' && iconElement}
      
      {/* Loading overlay */}
      {loading && (
        <span className="absolute inset-0 flex items-center justify-center">
          {loadingSpinner}
        </span>
      )}
    </button>
  );
});

// Set display name for better debugging
AnimatedButton.displayName = 'AnimatedButton';

// Export with proper TypeScript annotations
export default AnimatedButton;
export type { AnimatedButtonProps, ButtonVariant, ButtonSize, ButtonAnimation };