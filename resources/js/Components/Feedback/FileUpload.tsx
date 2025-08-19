import React from 'react';

interface FileUploadProps {
  files: File[];
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveFile: (index: number) => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
  errorMessage?: string;
}

export default function FileUpload({ 
  files, 
  onFileChange, 
  onRemoveFile, 
  fileInputRef, 
  errorMessage 
}: FileUploadProps) {
  return (
    <div className="mb-6">
      <label className="block text-gray-700 font-medium mb-2">
        Upload Foto & Video (opsional)
      </label>
      <div className="flex items-center flex-wrap gap-3">
        <label className="flex items-center justify-center px-4 py-2 bg-gray-200 text-gray-700 rounded-lg cursor-pointer hover:bg-gray-300">
          <span>Pilih File</span>
          <input 
            type="file" 
            accept=".jpg,.jpeg,.png,.mp4,.mov,.avi,.mkv" 
            className="hidden" 
            onChange={onFileChange}
            ref={fileInputRef}
            multiple
          />
        </label>
        <span className="text-gray-600">
          {files.length > 0 ? (
            <>
              {files.filter(f => f.type.startsWith('image/')).length} foto, {files.filter(f => f.type.startsWith('video/')).length} video dipilih
            </>
          ) : (
            'Belum ada file dipilih'
          )}
        </span>
      </div>
      <p className="text-gray-500 text-sm mt-2">
        Format yang didukung:<br />
        - Foto (JPG, PNG) maksimal 5MB per file - maksimal 3 foto.<br />
        - Video (MP4, MOV, AVI, MKV) maksimal 50MB per file - maksimal 2 video.
      </p>
      
      {errorMessage && (
        <p className="text-red-600 text-sm mt-2">{errorMessage}</p>
      )}
      
      {files.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-3">
          {files.map((file, index) => (
            <div key={index} className="relative">
              <div className="w-20 h-20 rounded overflow-hidden border border-gray-300">
                {file.type.startsWith('image/') ? (
                  <img 
                    src={URL.createObjectURL(file)} 
                    alt={`Preview ${index}`}
                    className="w-full h-full object-cover" 
                  />
                ) : file.type.startsWith('video/') ? (
                  <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                    <div className="text-center">
                      <svg className="w-6 h-6 text-gray-500 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h6m-3 3v3m-2-6h4m-2 0V7a2 2 0 114 0v1" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span className="text-xs text-gray-500">VIDEO</span>
                    </div>
                  </div>
                ) : null}
              </div>
              <div className="absolute -top-2 -right-2 flex gap-1">
                <span className="bg-blue-500 text-white text-xs px-1 py-0.5 rounded">
                  {file.type.startsWith('image/') ? 'IMG' : 'VID'}
                </span>
                <button
                  type="button"
                  onClick={() => onRemoveFile(index)}
                  className="bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                >
                  ×
                </button>
              </div>
              <div className="absolute -bottom-1 left-0 right-0 bg-black bg-opacity-75 text-white text-xs px-1 py-0.5 rounded-b truncate">
                {file.name}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
