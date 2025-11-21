import React from 'react';

interface MediaLightboxProps {
  isOpen: boolean;
  onClose: () => void;
  src: string;
  type: 'image' | 'video';
  alt?: string;
}

/**
 * Reusable Media Lightbox Component
 * Displays images or videos in fullscreen modal overlay
 */
export default function MediaLightbox({
  isOpen,
  onClose,
  src,
  type,
  alt = 'Full size preview',
}: MediaLightboxProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black bg-opacity-90 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="relative max-w-5xl max-h-[90vh] w-full h-full flex items-center justify-center">
        {type === 'image' ? (
          <img
            src={src}
            alt={alt}
            className="max-w-full max-h-full w-auto h-auto object-contain"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '90vw', maxHeight: '90vh' }}
          />
        ) : (
          <div className="relative">
            <video
              src={src}
              className="max-w-full max-h-full object-contain rounded-lg"
              controls
              autoPlay
              onClick={(e) => e.stopPropagation()}
              style={{ maxHeight: '80vh' }}
            />
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-70 text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
              Video
            </div>
          </div>
        )}
        <button
          className="absolute top-2 right-2 bg-black bg-opacity-50 text-white rounded-full p-2 hover:bg-opacity-70 transition-opacity"
          onClick={onClose}
          aria-label="Close lightbox"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}

