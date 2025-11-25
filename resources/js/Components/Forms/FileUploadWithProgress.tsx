import React, { useRef } from 'react';
import InputLabel from '@/Components/InputLabel';
import InputError from '@/Components/InputError';

interface FileUploadWithProgressProps {
  id: string;
  label: string;
  files: File[];
  onFilesChange: (files: File[]) => void;
  progress?: number; // 0-100
  acceptedTypes?: string;
  maxSizeMB?: number;
  maxFiles?: number;
  error?: string;
  fieldError?: string; // untuk error dari field array (e.g., attachments.0)
  className?: string;
  colorScheme?: 'indigo' | 'blue' | 'red';
}

const colorSchemes = {
  indigo: {
    fileButton: 'file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100',
    progress: 'bg-indigo-500',
  },
  blue: {
    fileButton: 'file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100',
    progress: 'bg-blue-500',
  },
  red: {
    fileButton: 'file:bg-red-50 file:text-red-700 hover:file:bg-red-100',
    progress: 'bg-red-500',
  },
};

/**
 * Reusable File Upload with Progress Component
 * DRY: Eliminates duplication of file upload with progress bar pattern
 * 
 * @example
 * ```tsx
 * <FileUploadWithProgress
 *   id="attachments"
 *   label="Lampiran (opsional)"
 *   files={data.attachments}
 *   onFilesChange={(files) => setData('attachments', files)}
 *   progress={progress?.percentage}
 *   maxSizeMB={100}
 *   error={errors.attachments}
 *   fieldError={fieldErrors['attachments.0']}
 *   colorScheme="indigo"
 * />
 * ```
 */
export default function FileUploadWithProgress({
  id,
  label,
  files,
  onFilesChange,
  progress,
  acceptedTypes = 'image/jpeg,image/png,image/jpg,video/mp4,video/mov,video/avi,video/mkv',
  maxSizeMB = 100,
  maxFiles,
  error,
  fieldError,
  className = '',
  colorScheme = 'indigo',
}: FileUploadWithProgressProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const colors = colorSchemes[colorScheme];

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files ?? []);
    onFilesChange(selectedFiles);
  };

  const handleRemoveFile = () => {
    onFilesChange([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className={className}>
      <InputLabel htmlFor={id} value={label} />
      <input
        id={id}
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        multiple={!!maxFiles && maxFiles > 1}
        className={`mt-2 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold ${colors.fileButton}`}
        accept={acceptedTypes}
      />
      <p className="mt-1 text-xs text-gray-500">
        Format yang didukung: jpg, jpeg, png, mp4, mov, avi, mkv (maks {maxSizeMB}MB per file)
        {maxFiles && `, maksimal ${maxFiles} file`}
      </p>
      <InputError message={error} className="mt-1" />
      <InputError message={fieldError} className="mt-1" />

      {files.length > 0 && (
        <div className="mt-3 flex items-center justify-between bg-gray-50 border border-gray-200 rounded-md px-3 py-2 text-sm text-gray-600">
          <span>{files.length} file siap diunggah</span>
          <button
            type="button"
            className="text-xs text-red-600 hover:text-red-800 font-medium"
            onClick={handleRemoveFile}
          >
            Hapus
          </button>
        </div>
      )}

      {typeof progress === 'number' && progress > 0 && (
        <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
          <div
            className={`${colors.progress} h-2 rounded-full transition-all`}
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  );
}

