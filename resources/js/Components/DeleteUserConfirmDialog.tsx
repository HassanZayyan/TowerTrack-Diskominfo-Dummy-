import React from 'react';
import Modal from './Modal';

/**
 * Reusable confirmation dialog for deleting users
 * 
 * @example
 * ```tsx
 * const [showDeleteDialog, setShowDeleteDialog] = useState(false);
 * const [deleteDialogData, setDeleteDialogData] = useState(null);
 * 
 * const handleDeleteUser = (user) => {
 *   setDeleteDialogData({
 *     userId: user.id,
 *     userName: user.name,
 *     userEmail: user.email
 *   });
 *   setShowDeleteDialog(true);
 * };
 * 
 * <DeleteUserConfirmDialog
 *   show={showDeleteDialog}
 *   onClose={() => setShowDeleteDialog(false)}
 *   onConfirm={handleDeleteConfirm}
 *   userName={deleteDialogData?.userName || ''}
 *   userEmail={deleteDialogData?.userEmail || ''}
 *   loading={isProcessing}
 * />
 * ```
 */
interface DeleteUserConfirmDialogProps {
  show: boolean;
  onClose: () => void;
  onConfirm: () => void;
  userName: string;
  userEmail: string;
  loading?: boolean;
}

const DeleteUserConfirmDialog: React.FC<DeleteUserConfirmDialogProps> = ({
  show,
  onClose,
  onConfirm,
  userName,
  userEmail,
  loading = false
}) => {
  const title = 'Konfirmasi Nonaktifkan User';
  const confirmText = 'Ya, Nonaktifkan User';
  const cancelText = 'Batal';
  
  const message = `Apakah Anda yakin ingin menonaktifkan user "${userName}" (${userEmail})? User akan dinonaktifkan dari sistem tetapi data tetap tersimpan dan dapat diaktifkan kembali jika diperlukan.`;

  return (
    <Modal show={show} onClose={onClose} maxWidth="md" closeable={!loading}>
      <div className="flex flex-col max-h-[calc(100vh-8rem)] sm:max-h-none sm:overflow-hidden">
        {/* Scrollable Content - Only on mobile */}
        <div className="flex-1 overflow-y-auto sm:overflow-hidden sm:max-h-none px-4 py-4 sm:px-6 sm:py-5">
          {/* Header with Icon */}
          <div className="flex items-center justify-center mb-4 sm:mb-5">
            <div className="rounded-full p-3 sm:p-4 bg-red-100">
              <svg className="w-10 h-10 sm:w-12 sm:h-12 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
          </div>
          
          {/* Content */}
          <div className="text-center mb-6 sm:mb-5">
            <h3 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 text-red-800 px-2">
              {title}
            </h3>
            
            <div className="bg-gray-50 rounded-lg p-3 sm:p-4 mb-3 sm:mb-4">
              <div className="flex items-center justify-center">
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-red-500 to-red-600 flex items-center justify-center mr-3 flex-shrink-0">
                  <span className="text-white font-semibold text-sm">
                    {userName.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="text-left min-w-0 flex-1">
                  <p className="font-medium text-gray-900 text-sm sm:text-base truncate">{userName}</p>
                  <p className="text-xs sm:text-sm text-gray-600 break-all">{userEmail}</p>
                </div>
              </div>
            </div>
            
            <p className="text-sm sm:text-base text-gray-700 leading-relaxed px-2 mb-3 sm:mb-4">
              {message}
            </p>
            
            <div className="mt-3 sm:mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-start">
                <svg className="w-5 h-5 text-yellow-600 mt-0.5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="text-xs sm:text-sm text-yellow-700">
                  <p className="font-medium mb-1">Catatan:</p>
                  <p>User akan dinonaktifkan (soft delete). Data user tetap tersimpan di database untuk keperluan audit dan dapat diaktifkan kembali kapan saja melalui tombol "Aktifkan Kembali".</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Fixed Action Buttons */}
        <div className="flex-shrink-0 border-t border-gray-200 bg-gray-50 px-4 py-3 sm:px-6 sm:py-4">
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 sm:justify-center">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="w-full sm:w-auto sm:px-6 px-4 py-2.5 sm:py-3 text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm sm:text-base"
            >
              {cancelText}
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={loading}
              className="w-full sm:w-auto sm:px-6 px-4 py-2.5 sm:py-3 text-white font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed bg-red-600 hover:bg-red-700 focus:ring-red-500 text-sm sm:text-base"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Menonaktifkan...
                </div>
              ) : (
                confirmText
              )}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default DeleteUserConfirmDialog;

