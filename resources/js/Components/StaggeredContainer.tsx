import React, { useEffect, useRef, useState } from 'react';

interface StaggeredContainerProps {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  className?: string;
  animationType?: 'fadeInUp' | 'fadeInLeft' | 'fadeInRight' | 'scaleIn' | 'slideInFromBottom' | 'bounceIn' | 'rotateIn' | 'flipIn' | 'zoomIn' | 'slideInFromTop' | 'slideInFromLeft' | 'slideInFromRight' | 'elasticIn' | 'backIn' | 'spiralIn';
  hoverEffect?: boolean;
}

const StaggeredContainer: React.FC<StaggeredContainerProps> = ({
  children,
  delay = 0,
  duration = 600,
  className = '',
  animationType = 'fadeInUp',
  hoverEffect = false
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [hasAnimated, setHasAnimated] = useState(false);
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated) {
          setTimeout(() => {
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

    if (elementRef.current) {
      observer.observe(elementRef.current);
    }

    return () => {
      if (elementRef.current) {
        observer.unobserve(elementRef.current);
      }
    };
  }, [delay, hasAnimated]);

  const getAnimationClasses = () => {
    const baseClasses = 'transition-all';
    const durationClass = `duration-${duration}`;
    
    if (!isVisible) {
      switch (animationType) {
        case 'fadeInUp':
          return `${baseClasses} ${durationClass} ease-out opacity-0 translate-y-8`;
        case 'fadeInLeft':
          return `${baseClasses} ${durationClass} ease-out opacity-0 -translate-x-8`;
        case 'fadeInRight':
          return `${baseClasses} ${durationClass} ease-out opacity-0 translate-x-8`;
        case 'scaleIn':
          return `${baseClasses} ${durationClass} ease-out opacity-0 scale-95`;
        case 'slideInFromBottom':
          return `${baseClasses} ${durationClass} ease-[cubic-bezier(0.25,0.46,0.45,0.94)] opacity-0 translate-y-16`;
        case 'slideInFromTop':
          return `${baseClasses} ${durationClass} ease-[cubic-bezier(0.25,0.46,0.45,0.94)] opacity-0 -translate-y-16`;
        case 'slideInFromLeft':
          return `${baseClasses} ${durationClass} ease-[cubic-bezier(0.25,0.46,0.45,0.94)] opacity-0 -translate-x-16`;
        case 'slideInFromRight':
          return `${baseClasses} ${durationClass} ease-[cubic-bezier(0.25,0.46,0.45,0.94)] opacity-0 translate-x-16`;
        case 'bounceIn':
          return `${baseClasses} ${durationClass} ease-[cubic-bezier(0.68,-0.55,0.265,1.55)] opacity-0 scale-50`;
        case 'rotateIn':
          return `${baseClasses} ${durationClass} ease-out opacity-0 scale-95 rotate-12`;
        case 'flipIn':
          return `${baseClasses} ${durationClass} ease-out opacity-0 scale-95 rotate-y-90`;
        case 'zoomIn':
           return `${baseClasses} ${durationClass} ease-[cubic-bezier(0.25,0.46,0.45,0.94)] opacity-0 scale-75`;
         case 'elasticIn':
           return `${baseClasses} ${durationClass} ease-[cubic-bezier(0.68,-0.55,0.265,1.55)] opacity-0 scale-50 rotate-6`;
         case 'backIn':
           return `${baseClasses} ${durationClass} ease-[cubic-bezier(0.175,0.885,0.32,1.275)] opacity-0 scale-90 -translate-y-4`;
         case 'spiralIn':
           return `${baseClasses} ${durationClass} ease-[cubic-bezier(0.25,0.46,0.45,0.94)] opacity-0 scale-75 rotate-180`;
         default:
           return `${baseClasses} ${durationClass} ease-out opacity-0 translate-y-8`;
      }
    } else {
      switch (animationType) {
         case 'rotateIn':
           return `${baseClasses} ${durationClass} ease-out opacity-100 translate-y-0 translate-x-0 scale-100 rotate-0`;
         case 'flipIn':
           return `${baseClasses} ${durationClass} ease-out opacity-100 translate-y-0 translate-x-0 scale-100 rotate-y-0`;
         case 'spiralIn':
           return `${baseClasses} ${durationClass} ease-out opacity-100 translate-y-0 translate-x-0 scale-100 rotate-0`;
         default:
           return `${baseClasses} ${durationClass} ease-out opacity-100 translate-y-0 translate-x-0 scale-100`;
       }
    }
  };

  const hoverClasses = hoverEffect ? 'hover:scale-105 hover:shadow-lg hover:-translate-y-1' : '';

  return (
    <div
      ref={elementRef}
      className={`${getAnimationClasses()} ${hoverClasses} ${className}`}
      style={{
        transitionDuration: `${duration}ms`
      }}
    >
      {children}
    </div>
  );
};

export default StaggeredContainer;