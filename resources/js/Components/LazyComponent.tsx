import React, { Suspense, ComponentType, LazyExoticComponent } from 'react';

interface LazyComponentProps {
  fallback?: React.ReactNode;
  children?: React.ReactNode;
}

/**
 * DRY Wrapper for lazy-loaded components with Suspense
 * Provides consistent loading states across the application
 */
export function LazyComponent({
  fallback,
  children,
}: LazyComponentProps) {
  const defaultFallback = (
    <div className="flex items-center justify-center p-8">
      <div className="animate-pulse text-gray-500">Loading...</div>
    </div>
  );

  return (
    <Suspense fallback={fallback || defaultFallback}>
      {children}
    </Suspense>
  );
}

/**
 * Create a lazy-loaded component with automatic Suspense wrapper
 * 
 * @param importFn Function that imports the component
 * @param fallback Optional fallback component
 * @returns Lazy component with Suspense
 */
export function createLazyComponent<P extends Record<string, any>>(
  importFn: () => Promise<{ default: ComponentType<P> }>,
  fallback?: React.ReactNode
): ComponentType<P> {
  const LazyLoadedComponent = React.lazy(importFn);

  const WrappedComponent = (props: P) => {
    const defaultFallback = (
      <div className="flex items-center justify-center p-8">
        <div className="animate-pulse text-gray-500">Loading...</div>
      </div>
    );

    return (
      <Suspense fallback={fallback || defaultFallback}>
        <LazyLoadedComponent {...(props as any)} />
      </Suspense>
    );
  };

  // Set display name if possible
  try {
    if (LazyLoadedComponent && 'displayName' in LazyLoadedComponent) {
      WrappedComponent.displayName = `Lazy(${(LazyLoadedComponent as any).displayName || 'Component'})`;
    }
  } catch {
    // Ignore if displayName is not available
  }

  return WrappedComponent as ComponentType<P>;
}

/**
 * Higher-order component for lazy loading with custom fallback
 */
export function withLazyLoading<P extends Record<string, any>>(
  Component: LazyExoticComponent<ComponentType<P>>,
  fallback?: React.ReactNode
): ComponentType<P> {
  const WrappedComponent = (props: P) => {
    const defaultFallback = (
      <div className="flex items-center justify-center p-8">
        <div className="animate-pulse text-gray-500">Loading...</div>
      </div>
    );

    return (
      <Suspense fallback={fallback || defaultFallback}>
        <Component {...(props as any)} />
      </Suspense>
    );
  };

  return WrappedComponent as ComponentType<P>;
}

