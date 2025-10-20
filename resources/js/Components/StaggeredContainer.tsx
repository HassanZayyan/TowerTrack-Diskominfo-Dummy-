import React, { useEffect, useRef, useState } from 'react';

interface StaggeredContainerProps {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  className?: string;
  animationType?: 'fadeInUp' | 'fadeInLeft' | 'fadeInRight' | 'scaleIn';
  hoverEffect?: boolean;
}

// Simplified animation classes - reduced complexity for better performance
const ANIMATION_CLASSES = {
  hidden: {
    fadeInUp: 'opacity-0 translate-y-8',
    fadeInLeft: 'opacity-0 -translate-x-8',
    fadeInRight: 'opacity-0 translate-x-8',
    scaleIn: 'opacity-0 scale-95'
  },
  visible: {
    fadeInUp: 'opacity-100 translate-y-0',
    fadeInLeft: 'opacity-100 translate-x-0',
    fadeInRight: 'opacity-100 translate-x-0',
    scaleIn: 'opacity-100 scale-100'
  }
} as const;

// Optimized StaggeredContainer - simplified animations and better IntersectionObserver usage
const StaggeredContainer: React.FC<StaggeredContainerProps> = ({
  children,
  delay = 0,
  duration = 300,
  className = '',
  animationType = 'fadeInUp',
  hoverEffect = false
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [hasAnimated, setHasAnimated] = useState(false);
  const elementRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Early return if already animated
    if (hasAnimated) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated) {
          // Clear any existing timeout
          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
          }
          
          timeoutRef.current = setTimeout(() => {
            setIsVisible(true);
            setHasAnimated(true);
          }, delay);
        }
      },
      {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
      }
    );

    const element = elementRef.current;
    if (element) {
      observer.observe(element);
    }

    return () => {
      if (element) {
        observer.unobserve(element);
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      observer.disconnect();
    };
  }, [delay, hasAnimated]);

  // Simplified animation class generation
  const animationClasses = [
    'transition-all ease-out',
    isVisible ? ANIMATION_CLASSES.visible[animationType] : ANIMATION_CLASSES.hidden[animationType],
    hoverEffect && isVisible ? 'hover:scale-105 hover:shadow-lg hover:-translate-y-1' : ''
  ].filter(Boolean).join(' ');

  return (
    <div
      ref={elementRef}
      className={`${animationClasses} ${className}`}
      style={{
        transitionDuration: `${duration}ms`
      }}
    >
      {children}
    </div>
  );
};

export default StaggeredContainer;