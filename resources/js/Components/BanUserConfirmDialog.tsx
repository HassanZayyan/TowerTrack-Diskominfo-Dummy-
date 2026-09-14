import React from 'react';
import Modal from './Modal';
import { Button } from '@/Components/ui/button';

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
      <div className="p-6 bg-card">
        {/* Header with Icon */}
        <div className="flex items-center justify-center mb-6">
          {/* Banning is irreversible-feeling and stays red (destructive);
              unbanning restores access and reads as success. */}
          <div
            className={`rounded-full p-4 ${
              isBanning
                ? 'bg-destructive-soft text-destructive-strong'
                : 'bg-success-soft text-success-strong'
            }`}
          >
            {isBanning ? (
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
              </svg>
            ) : (
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="text-center mb-8">
          <h3
            className={`text-xl font-semibold tracking-tight mb-4 ${
              isBanning ? 'text-destructive-strong' : 'text-success-strong'
            }`}
          >
            {title}
          </h3>

          <div className="bg-muted rounded-lg p-4 mb-4">
            <div className="flex items-center justify-center mb-2">
              {/* Identity chrome, not a destructive signal: the old red gradient
                  avatar is now a flat primary fill. */}
              <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center mr-3">
                <span className="text-primary-foreground font-semibold text-sm">
                  {userName.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="text-left">
                <p className="font-medium text-foreground">{userName}</p>
                <p className="text-sm text-muted-foreground">{userEmail}</p>
              </div>
            </div>
          </div>

          <p className="text-foreground leading-relaxed">
            {message}
          </p>

          {isBanning && (
            <div className="mt-4 p-3 bg-destructive-soft border border-destructive-border rounded-lg">
              <div className="flex items-start">
                <svg className="w-5 h-5 text-destructive-strong mt-0.5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <div className="text-sm text-destructive-strong text-left">
                  <p className="font-medium">Peringatan:</p>
                  <p>User yang dibanned tidak akan dapat mengakses sistem sampai statusnya diubah kembali.</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center gap-4">
          <Button
            type="button"
            size="lg"
            variant="outline"
            onClick={onClose}
            disabled={loading}
          >
            {cancelText}
          </Button>
          <Button
            type="button"
            size="lg"
            variant={isBanning ? 'destructive' : 'success'}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? (
              <>
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Memproses...
              </>
            ) : (
              confirmText
            )}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default BanUserConfirmDialog;
