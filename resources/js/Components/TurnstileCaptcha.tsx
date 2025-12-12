import { useRef, useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { Turnstile } from '@marsidev/react-turnstile';
import InputError from './InputError';

interface TurnstileCaptchaProps {
  siteKey: string;
  onTokenChange: (token: string) => void;
  error?: string;
  className?: string;
  size?: 'normal' | 'compact';
  theme?: 'light' | 'dark' | 'auto';
  showErrorOnLoad?: boolean;
}

export interface TurnstileCaptchaRef {
  reset: () => void;
  getToken: () => string | null;
}

/**
 * Reusable Cloudflare Turnstile CAPTCHA component
 * DRY: Single source of truth for CAPTCHA implementation
 */
const TurnstileCaptcha = forwardRef<TurnstileCaptchaRef, TurnstileCaptchaProps>(
  ({ 
    siteKey, 
    onTokenChange, 
    error,
    className = '',
    size = 'normal',
    theme = 'light',
    showErrorOnLoad = true
  }, ref) => {
    const [token, setToken] = useState<string>('');
    const [isMobile, setIsMobile] = useState(false);
    const captchaRef = useRef<any>(null);

    // Detect mobile screen size for responsive sizing
    useEffect(() => {
      const checkMobile = () => {
        setIsMobile(window.innerWidth < 640);
      };
      
      checkMobile();
      window.addEventListener('resize', checkMobile);
      
      return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // Expose methods via ref
    useImperativeHandle(ref, () => ({
      reset: () => {
        if (captchaRef.current) {
          captchaRef.current.reset();
        }
        setToken('');
        onTokenChange('');
      },
      getToken: () => token || null,
    }));

    const handleSuccess = (newToken: string) => {
      setToken(newToken);
      onTokenChange(newToken);
    };

    const handleError = (error: any) => {
      console.error('❌ CAPTCHA Error:', error);
      setToken('');
      onTokenChange('');
    };

    const handleExpire = () => {
      console.log('⏰ CAPTCHA Expired');
      setToken('');
      onTokenChange('');
    };

    // Determine size based on mobile detection if not explicitly provided
    const captchaSize = size === 'normal' && isMobile ? 'compact' : size;

    if (!siteKey) {
      if (showErrorOnLoad) {
        return (
          <div className={`p-4 bg-red-50 border-2 border-red-200 rounded-lg ${className}`}>
            <p className="text-sm text-red-800 font-medium">
              ⚠️ Error: CAPTCHA tidak dapat dimuat. Site key tidak tersedia.
            </p>
            <p className="text-xs text-red-600 mt-1">
              Silakan refresh halaman atau hubungi administrator.
            </p>
          </div>
        );
      }
      return null;
    }

    return (
      <div className={`w-full overflow-hidden ${className}`}>
        <div className="w-full flex justify-center sm:justify-start">
          <div 
            className="w-full max-w-[300px] sm:max-w-none" 
            style={{ maxWidth: '100%', overflow: 'hidden' }}
          >
            <Turnstile
              ref={captchaRef}
              siteKey={siteKey}
              onSuccess={handleSuccess}
              onError={handleError}
              onExpire={handleExpire}
              options={{
                theme,
                size: captchaSize,
              }}
            />
          </div>
        </div>
        {error && (
          <InputError message={error} className="mt-2" />
        )}
      </div>
    );
  }
);

TurnstileCaptcha.displayName = 'TurnstileCaptcha';

export default TurnstileCaptcha;

