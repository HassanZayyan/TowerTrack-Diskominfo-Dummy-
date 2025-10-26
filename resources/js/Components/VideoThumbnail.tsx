import React, { useState, useRef, useEffect } from 'react';

interface VideoThumbnailProps {
  src: string;
  fileType: 'video';
  className?: string;
  onClick?: () => void;
  showPlayButton?: boolean;
  alt?: string;
  loading?: 'lazy' | 'eager';
  onError?: (e: React.SyntheticEvent<HTMLVideoElement, Event>) => void;
}

export default function VideoThumbnail({
  src,
  fileType,
  className = "w-full h-full object-cover",
  onClick,
  showPlayButton = true,
  alt = "Video thumbnail",
  loading = "lazy",
  onError
}: VideoThumbnailProps) {
  const [thumbnailSrc, setThumbnailSrc] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (fileType === 'video' && src) {
      // Create a video element to capture thumbnail
      const video = document.createElement('video');
      video.crossOrigin = 'anonymous';
      video.preload = 'metadata';
      
      // Set video source with timestamp for thumbnail
      const videoSrc = src.includes('#t=') ? src : `${src}#t=0.1`;
      video.src = videoSrc;

      const handleLoadedMetadata = () => {
        // Seek to 1 second or 10% of duration, whichever is smaller
        const seekTime = Math.min(1, video.duration * 0.1);
        video.currentTime = seekTime;
      };

      const handleSeeked = () => {
        // Create canvas to capture frame
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (ctx && video.videoWidth > 0 && video.videoHeight > 0) {
          // Set canvas size to a reasonable size for thumbnails (minimum 200px width)
          const minWidth = 200;
          const aspectRatio = video.videoHeight / video.videoWidth;
          
          canvas.width = Math.max(minWidth, video.videoWidth);
          canvas.height = Math.max(minWidth * aspectRatio, video.videoHeight);
          
          // Enable image smoothing for better quality
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          
          // Draw video frame to canvas with proper scaling
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          
          // Convert canvas to data URL with higher quality
          const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
          setThumbnailSrc(dataUrl);
          setIsLoading(false);
        } else {
          setHasError(true);
          setIsLoading(false);
        }
        
        // Cleanup
        video.removeEventListener('loadedmetadata', handleLoadedMetadata);
        video.removeEventListener('seeked', handleSeeked);
        video.removeEventListener('error', handleError);
      };

      const handleError = () => {
        setHasError(true);
        setIsLoading(false);
        video.removeEventListener('loadedmetadata', handleLoadedMetadata);
        video.removeEventListener('seeked', handleSeeked);
        video.removeEventListener('error', handleError);
      };

      video.addEventListener('loadedmetadata', handleLoadedMetadata);
      video.addEventListener('seeked', handleSeeked);
      video.addEventListener('error', handleError);

      // Load the video
      video.load();

      return () => {
        video.removeEventListener('loadedmetadata', handleLoadedMetadata);
        video.removeEventListener('seeked', handleSeeked);
        video.removeEventListener('error', handleError);
        video.src = '';
      };
    }
  }, [src, fileType]);

  const handleClick = () => {
    if (onClick) {
      onClick();
    }
  };

  const handleVideoError = (e: React.SyntheticEvent<HTMLVideoElement, Event>) => {
    setHasError(true);
    setIsLoading(false);
    if (onError) {
      onError(e);
    }
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className={`relative bg-gradient-to-br from-gray-100 to-gray-200 animate-pulse ${className} flex items-center justify-center`}>
        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gray-300 rounded-full flex items-center justify-center">
          <svg className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </div>
      </div>
    );
  }

  // Show error state
  if (hasError || !thumbnailSrc) {
    return (
      <div className={`relative bg-gradient-to-br from-gray-100 to-gray-200 ${className} flex items-center justify-center`} onClick={handleClick}>
        <div className="text-center">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-300 rounded-full flex items-center justify-center mx-auto mb-2">
            <svg className="w-5 h-5 sm:w-6 sm:h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </div>
          <p className="text-xs text-gray-500 hidden sm:block">Video tidak dapat dimuat</p>
        </div>
        {showPlayButton && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-5">
            <div className="w-6 h-6 sm:w-8 sm:h-8 bg-white bg-opacity-85 rounded-full flex items-center justify-center shadow-md">
              <svg className="w-3 h-3 sm:w-4 sm:h-4 text-gray-700 ml-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M8 5v10l8-5-8-5z"/>
              </svg>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="relative cursor-pointer group" onClick={handleClick}>
      {/* Thumbnail Image */}
      <img
        src={thumbnailSrc}
        alt={alt}
        className={`${className} object-cover transition-all duration-200`}
        loading={loading}
        onError={() => setHasError(true)}
      />
      
      {/* Play Button Overlay */}
      {showPlayButton && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-10 group-hover:bg-opacity-20 transition-all duration-200">
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white bg-opacity-90 rounded-full flex items-center justify-center shadow-lg transition-transform duration-200 border border-gray-300">
            <svg className="w-3 h-3 sm:w-4 sm:h-4 text-gray-700 ml-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M8 5v10l8-5-8-5z"/>
            </svg>
          </div>
        </div>
      )}
      
      {/* Video Duration Badge */}
      <div className="absolute bottom-1 right-1 bg-black bg-opacity-80 text-white text-xs px-1.5 py-0.5 rounded-md flex items-center gap-1 backdrop-blur-sm">
        <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20">
          <path d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"/>
        </svg>
        <span className="font-medium">Video</span>
      </div>
    </div>
  );
}
