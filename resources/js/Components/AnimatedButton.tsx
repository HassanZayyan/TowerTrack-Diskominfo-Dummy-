import React from 'react';
import { ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

// Type definitions
type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'glass' | 'onBrandSolid' | 'destructive';
type ButtonSize = 'sm' | 'md' | 'lg' | 'xl';
type ButtonAnimation = 'bounce' | 'pulse' | 'scale' | 'slide' | 'glow';

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

/**
 * Every variant was a red gradient with a heavy shadow. `outline` and `ghost`
 * were red too, which meant a tertiary action carried the same alarm weight as
 * a primary one — and once red means "destructive", a red ghost button on a
 * cancel control actively misleads.
 *
 * Flat fills now, one hairline border, and the shadow only where elevation is
 * real. `destructive` is new: there was no way to express it before, so pages
 * hand-rolled their own red buttons.
 */
const VARIANT_CLASSES = {
  primary: 'bg-primary text-primary-foreground hover:bg-primary-hover active:bg-primary-active',
  secondary: 'bg-secondary text-secondary-foreground border border-border hover:bg-accent',
  outline: 'bg-background text-foreground border border-input hover:bg-accent hover:text-accent-foreground',
  ghost: 'bg-transparent text-foreground border border-transparent hover:bg-accent hover:text-accent-foreground',
  // Both of these are for use ON a brand-coloured ground (hero band, app bar),
  // never on the page canvas. `onBrandSolid` is the primary action there —
  // white-on-dark is the only pairing with real separation from a red scrim.
  glass: 'bg-white/10 text-white border border-white/40 backdrop-blur-sm hover:bg-white/20',
  onBrandSolid: 'bg-white text-primary border border-transparent hover:bg-white/90',
  destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive-strong',
} as const;

// Static size classes
const SIZE_CLASSES = {
  sm: {
    padding: 'px-3 py-1.5',
    text: 'text-sm font-medium',
    icon: 'w-4 h-4'
  },
  md: {
    padding: 'px-4 py-2.5',
    text: 'text-sm font-medium',
    icon: 'w-5 h-5'
  },
  lg: {
    padding: 'px-5 py-3',
    text: 'text-base font-medium',
    icon: 'w-5 h-5'
  },
  xl: {
    padding: 'px-6 py-3.5',
    text: 'text-base font-semibold',
    icon: 'w-6 h-6'
  }
} as const;

/**
 * The `animation` prop is kept so the twelve existing call sites still compile,
 * but the dated treatments behind it are gone: hover:animate-bounce,
 * hover:animate-pulse, hover:scale-105 with a lift, and a red glow shadow.
 *
 * Modern UI signals hover with a background shift, which this component already
 * does through its variant. `slide` survives because a directional nudge on an
 * icon button still communicates something; the rest resolve to a plain colour
 * transition. Removing the prop entirely would be the next cleanup, once the
 * call sites are touched for other reasons.
 */
const ANIMATION_CLASSES = {
  bounce: '',
  pulse: '',
  scale: '',
  slide: 'hover:translate-x-0.5',
  glow: '',
} as const;

// Optimized AnimatedButton - removed excessive useMemo
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
  const currentSize = SIZE_CLASSES[size];

  const buttonClasses = cn(
    'relative inline-flex items-center justify-center rounded-md transition-colors',
    'focus-visible:outline-none focus-visible:ring focus-visible:ring-offset-2',
    VARIANT_CLASSES[variant],
    currentSize.padding,
    currentSize.text,
    ANIMATION_CLASSES[animation],
    fullWidth && 'w-full',
    (disabled || loading) && 'opacity-50 cursor-not-allowed pointer-events-none',
    className,
  );

  // Loading spinner - simplified JSX
  const loadingSpinner = (
    <svg
      className={cn('animate-spin', currentSize.icon)}
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
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
  );

  // Icon rendering - hide icon when loading (spinner shown as overlay instead)
  const iconElement = !loading && icon ? (
    <span className={cn(currentSize.icon, iconPosition === 'right' ? 'ml-2' : 'mr-2')}>
      {icon}
    </span>
  ) : null;

  return (
    <button
      className={buttonClasses}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {iconPosition === 'left' && iconElement}
      <span className={loading ? 'opacity-0' : 'opacity-100'}>
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
