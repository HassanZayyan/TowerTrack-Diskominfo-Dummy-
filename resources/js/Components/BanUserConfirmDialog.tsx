import React from 'react';
import Modal from './Modal';

/**
 * Reusable confirmation dialog for banning/unbanning users
 * 
 * @example
 * ```tsx
 * const [showBanDialog, setShowBanDialog] = useState(false);
 * const [banDialogData, setBanDialogData] = useState(null);
 * 
 * const handleBanUser = (user) => {
 *   setBanDialogData({
 *     userName: user.name,
 *     userEmail: user.email,
 *     isBanning: true,
 *     userId: user.id
 *   });
 *   setShowBanDialog(true);
 * };
 * 
 * <BanUserConfirmDialog
 *   show={showBanDialog}
 *   onClose={() => setShowBanDialog(false)}
 *   onConfirm={handleBanConfirm}
 *   userName={banDialogData?.userName || ''}
 *   userEmail={banDialogData?.userEmail || ''}
 *   isBanning={banDialogData?.isBanning || false}
 *   loading={isProcessing}
 * />
 * ```
 */
interface BanUserConfirmDialogProps {
  show: boolean;
  onClose: () => void;
  onConfirm: () => void;
  userName: string;
  userEmail: string;
  isBanning: boolean; // true for ban, false for unban
  loading?: boolean;
}

const BanUserConfirmDialog: React.FC<BanUserConfirmDialogProps> = ({
  show,
  onClose,
  onConfirm,
  userName,
  userEmail,
  isBanning,
  loading = false
}) => {
  const title = isBanning ? 'Konfirmasi Ban User' : 'Konfirmasi Unban User';
  const confirmText = isBanning ? 'Ya, Ban User' : 'Ya, Unban User';
  const cancelText = 'Batal';
  
  const message = isBanning 
    ? `Apakah Anda yakin ingin membanned user "${userName}" (${userEmail})? User yang dibanned tidak akan dapat login ke sistem.`
    : `Apakah Anda yakin ingin mengembalikan akses user "${userName}" (${userEmail})? User akan dapat login kembali ke sistem.`;

  return (
    <Modal show={show} onClose={onClose} maxWidth="md" closeable={!loading}>
      <div className="p-6">
        {/* Header with Icon */}
        <div className="flex items-center justify-center mb-6">
          <div className={`rounded-full p-4 ${isBanning ? 'bg-red-100' : 'bg-green-100'}`}>
            {isBanning ? (
              <svg className="w-12 h-12 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
              </svg>
            ) : (
              <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
          </div>
        </div>
        
        {/* Content */}
        <div className="text-center mb-8">
          <h3 className={`text-xl font-semibold mb-4 ${isBanning ? 'text-red-800' : 'text-green-800'}`}>
            {title}
          </h3>
          
          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <div className="flex items-center justify-center mb-2">
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-red-500 to-red-600 flex items-center justify-center mr-3">
                <span className="text-white font-semibold text-sm">
                  {userName.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="text-left">
                <p className="font-medium text-gray-900">{userName}</p>
                <p className="text-sm text-gray-600">{userEmail}</p>
              </div>
            </div>
          </div>
          
          <p className="text-gray-700 leading-relaxed">
            {message}
          </p>
          
          {isBanning && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start">
                <svg className="w-5 h-5 text-red-600 mt-0.5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <div className="text-sm text-red-700">
                  <p className="font-medium">Peringatan:</p>
                  <p>User yang dibanned tidak akan dapat mengakses sistem sampai statusnya diubah kembali.</p>
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Action Buttons */}
        <div className="flex justify-center space-x-4">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-6 py-3 text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`px-6 py-3 text-white font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
              isBanning 
                ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500' 
                : 'bg-green-600 hover:bg-green-700 focus:ring-green-500'
            }`}
          >
            {loading ? (
              <div className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Memproses...
              </div>
            ) : (
              confirmText
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default BanUserConfirmDialog;
