import React, { useRef } from 'react';

interface FileUploadProps {
  files: File[];
  onFilesChange: (files: File[]) => void;
  maxFiles?: number;
  maxSizeBytes?: number;
  acceptedTypes?: string[];
  acceptedExtensions?: string[];
  label?: string;
  required?: boolean;
  className?: string;
  onError?: (message: string) => void;
}

export default function FileUpload({
  files,
  onFilesChange,
  maxFiles = 3,
  maxSizeBytes = 50 * 1024 * 1024, // 50MB
  acceptedTypes = ['image/jpeg', 'image/png', 'video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/x-matroska'],
  acceptedExtensions = ['.jpg', '.jpeg', '.png', '.mp4', '.mov', '.avi', '.mkv'],
  label = "Upload Foto/Video (opsional)",
  required = false,
  className = "",
  onError
}: FileUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles) return;

    // Check if adding these files would exceed the limit
    if (files.length + selectedFiles.length > maxFiles) {
      const errorMsg = `Maksimal ${maxFiles} file yang dapat diunggah`;
      if (onError) onError(errorMsg);
      return;
    }

    const newFiles: File[] = [];

    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i];
      
      // Check file type and extension
      const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
      const isValidType = acceptedTypes.includes(file.type);
      const isValidExtension = acceptedExtensions.some(ext => ext.toLowerCase() === fileExtension);
      
      if (!isValidType && !isValidExtension) {
        const extensions = acceptedExtensions.join(', ').toUpperCase();
        const errorMsg = `Hanya file ${extensions} yang diizinkan`;
        if (onError) onError(errorMsg);
        continue;
      }
      
      if (file.size > maxSizeBytes) {
        const sizeMB = Math.round(maxSizeBytes / (1024 * 1024));
        const errorMsg = `Ukuran file tidak boleh melebihi ${sizeMB}MB`;
        if (onError) onError(errorMsg);
        continue;
      }
      
      newFiles.push(file);
    }

    // Add the valid files to the array
    onFilesChange([...files, ...newFiles]);
    
    // Clear the input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeFile = (index: number) => {
    onFilesChange(files.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (file: File) => {
    // Check if it's an image
    const isImage = file.type.startsWith('image/') || ['.jpg', '.jpeg', '.png'].some(ext => file.name.toLowerCase().endsWith(ext));
    // Check if it's a video
    const isVideo = file.type.startsWith('video/') || ['.mp4', '.mov', '.avi', '.mkv'].some(ext => file.name.toLowerCase().endsWith(ext));
    
    if (isImage) {
      return (
        <img 
          src={URL.createObjectURL(file)} 
          alt={`Preview`}
          className="w-full h-full object-cover" 
        />
      );
    } else if (isVideo) {
      return (
        <div className="relative w-full h-full bg-black">
          <video 
            className="w-full h-full object-cover"
            preload="metadata"
            muted
          >
            <source src={`${URL.createObjectURL(file)}#t=0.1`} type={file.type} />
          </video>
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30">
            <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
            </svg>
          </div>
        </div>
      );
    } else {
      return (
        <div className="w-full h-full bg-gray-100 flex items-center justify-center">
          <svg className="w-8 h-8 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
          </svg>
        </div>
      );
    }
  };

  return (
    <div className={className}>
      {label && (
        <label className="block text-gray-700 font-medium mb-2">
          {label} {required && <span className="text-red-600">*</span>}
        </label>
      )}
      
      <div className="flex items-center flex-wrap gap-3">
        <label className="flex items-center justify-center px-4 py-2 bg-gray-200 text-gray-700 rounded-lg cursor-pointer hover:bg-gray-300 transition-colors">
          <span>Pilih File</span>
          <input 
            type="file" 
            accept={acceptedExtensions.join(',')} 
            className="hidden" 
            onChange={handleFileChange}
            ref={fileInputRef}
            multiple
          />
        </label>
        <span className="text-gray-600">
          {files.length > 0 ? `${files.length} file dipilih` : 'Belum ada file dipilih'}
        </span>
      </div>
      
      <p className="text-gray-500 text-sm mt-2">
        Format yang didukung: {acceptedExtensions.join(', ').toUpperCase()}. 
        Maksimal {Math.round(maxSizeBytes / (1024 * 1024))}MB per file. 
        Maksimal {maxFiles} file.
      </p>
      
      {files.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-3">
          {files.map((file, index) => (
            <div key={index} className="relative group">
              <div className="w-20 h-20 rounded overflow-hidden border border-gray-300">
                {getFileIcon(file)}
              </div>
              
              <div className="absolute -top-2 -right-2 flex gap-1">
                <span className="bg-blue-500 text-white text-xs px-1 py-0.5 rounded shadow">
                  {file.type.startsWith('image/') ? 'IMG' : 'VID'}
                </span>
                <button
                  type="button"
                  onClick={() => removeFile(index)}
                  className="bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600 transition-colors shadow"
                  title="Hapus file"
                >
                  ×
                </button>
              </div>
              
              {/* File info tooltip on hover */}
              <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-75 text-white text-xs p-1 rounded-b opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <div className="truncate">{file.name}</div>
                <div className="text-gray-300">{formatFileSize(file.size)}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
