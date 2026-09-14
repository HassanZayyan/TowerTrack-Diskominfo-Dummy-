import React from 'react';
import Modal from './Modal';
import { Button } from '@/Components/ui/button';
import { UserX } from 'lucide-react';

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
      <div className="flex flex-col max-h-[calc(100vh-8rem)] sm:max-h-none sm:overflow-hidden bg-card">
        {/* Scrollable Content - Only on mobile */}
        <div className="flex-1 overflow-y-auto sm:overflow-hidden sm:max-h-none px-4 py-4 sm:px-6 sm:py-5">
          {/* Header with Icon — deactivating a user is destructive, so this
              stays on the destructive tokens rather than moving to brand. */}
          <div className="flex items-center justify-center mb-4 sm:mb-5">
            <div className="rounded-full p-3 sm:p-4 bg-destructive-soft text-destructive-strong">
              <svg className="w-10 h-10 sm:w-12 sm:h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
          </div>

          {/* Content */}
          <div className="text-center mb-6 sm:mb-5">
            <h3 className="text-lg sm:text-xl font-semibold tracking-tight mb-3 sm:mb-4 text-destructive-strong px-2">
              {title}
            </h3>

            <div className="bg-muted rounded-lg p-3 sm:p-4 mb-3 sm:mb-4">
              <div className="flex items-center justify-center">
                {/* Identity chrome, not a destructive signal: the old red
                    gradient avatar is now a flat primary fill. */}
                <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center mr-3 flex-shrink-0">
                  <span className="text-primary-foreground font-semibold text-sm">
                    {userName.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="text-left min-w-0 flex-1">
                  <p className="font-medium text-foreground text-sm sm:text-base truncate">{userName}</p>
                  <p className="text-xs sm:text-sm text-muted-foreground break-all">{userEmail}</p>
                </div>
              </div>
            </div>

            <p className="text-sm sm:text-base text-foreground leading-relaxed px-2 mb-3 sm:mb-4">
              {message}
            </p>

            <div className="mt-3 sm:mt-4 p-3 bg-warning-soft border border-warning-border rounded-lg">
              <div className="flex items-start">
                <svg className="w-5 h-5 text-warning-strong mt-0.5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="text-xs sm:text-sm text-warning-strong text-left">
                  <p className="font-medium mb-1">Catatan:</p>
                  <p>User akan dinonaktifkan (soft delete). Data user tetap tersimpan di database untuk keperluan audit dan dapat diaktifkan kembali kapan saja melalui tombol "Aktifkan Kembali".</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Fixed Action Buttons */}
        <div className="flex-shrink-0 border-t border-border bg-muted px-4 py-3 sm:px-6 sm:py-4">
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 sm:justify-center">
            <Button
              type="button"
              size="lg"
              variant="outline"
              onClick={onClose}
              disabled={loading}
              className="w-full sm:w-auto"
            >
              {cancelText}
            </Button>
            <Button
              type="button"
              size="lg"
              variant="destructive"
              onClick={onConfirm}
              disabled={loading}
              className="w-full sm:w-auto"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Menonaktifkan...
                </>
              ) : (
                <>
                  {/* app.css:118-120 makes this mandatory, not decorative:
                      the brand IS red here, so hue alone cannot separate "ours"
                      from "this is irreversible". Colour is the second channel;
                      the icon and the verb are the first. The idle state used
                      to render bare text, so the rule held only while the
                      button was busy. */}
                  <UserX aria-hidden="true" />
                  {confirmText}
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default DeleteUserConfirmDialog;
