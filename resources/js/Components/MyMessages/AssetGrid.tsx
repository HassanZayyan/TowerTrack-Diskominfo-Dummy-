import React from 'react';
import VideoThumbnail from '@/Components/VideoThumbnail';

export type Asset = {
  file_path: string;
  file_type?: string;
};

type AssetGridProps = {
  assets?: Array<Asset>;
  onPreview?: (asset: Asset) => void;
  className?: string;
};

export default function AssetGrid({ assets, onPreview, className = '' }: AssetGridProps) {
  if (!assets || assets.length === 0) return null;

  const handleClick = (asset: Asset) => {
    if (onPreview) {
      onPreview(asset);
    }
  };

  return (
    <div className={`grid grid-cols-2 sm:grid-cols-3 gap-3 mt-3 ${className}`}>
      {assets.map((a, i) => (
        <div 
          key={i} 
          className="rounded overflow-hidden border border-border bg-white shadow-sm hover:shadow-md transition-colors duration-200"
        >
          {a.file_type === 'video' ? (
            <VideoThumbnail
              src={`/storage/${a.file_path}`}
              fileType="video"
              className="w-full aspect-video"
              onClick={() => handleClick(a)}
              showPlayButton={true}
              alt={`Video attachment ${i + 1}`}
              loading="lazy"
            />
          ) : (
            <div className="relative w-full aspect-video bg-muted">
              <img 
                src={`/storage/${a.file_path}`} 
                className="w-full h-full object-contain cursor-pointer transition-transform duration-200 " 
                alt={`Image attachment ${i + 1}`}
                loading="lazy"
                onClick={() => handleClick(a)}
                onError={(e) => {
                  // Was: src = '/images/placeholder-image.png' — a file that
                  // has never existed in public/images/. Pointing a failed
                  // image at a second missing image re-fires onError, and the
                  // browser retries until it gives up, logging a 404 each time.
                  // Hide the broken image and let the muted panel behind it
                  // stand in as the placeholder instead.
                  e.currentTarget.style.visibility = 'hidden';
                }}
              />
              <div className="absolute top-2 right-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
                Image
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}





