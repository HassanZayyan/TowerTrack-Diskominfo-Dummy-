import React from 'react';
import VideoThumbnail from '@/Components/VideoThumbnail';

type Asset = {
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
          className="rounded overflow-hidden border border-gray-200 bg-white shadow-sm hover:shadow-md transition-all duration-200"
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
            <div className="relative w-full aspect-video bg-gray-100">
              <img 
                src={`/storage/${a.file_path}`} 
                className="w-full h-full object-contain cursor-pointer transition-transform duration-200 hover:scale-105" 
                alt={`Image attachment ${i + 1}`}
                loading="lazy"
                onClick={() => handleClick(a)}
                onError={(e) => {
                  e.currentTarget.src = '/images/placeholder-image.png';
                }}
              />
              <div className="absolute top-2 right-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
                🖼️ Image
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}



