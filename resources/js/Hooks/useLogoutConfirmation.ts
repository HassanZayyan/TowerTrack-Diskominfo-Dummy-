import { useState } from 'react';
import { router } from '@inertiajs/react';

interface UseLogoutConfirmationProps {
  variant?: 'default' | 'danger' | 'warning';
  title?: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
}

export const useLogoutConfirmation = ({
  variant = 'default',
  title = 'Konfirmasi Logout',
  message = 'Apakah Anda yakin ingin keluar dari sistem?',
  confirmText = 'Ya, Logout',
  cancelText = 'Batal'
}: UseLogoutConfirmationProps = {}) => {
  const [showDialog, setShowDialog] = useState(false);

  const openDialog = () => setShowDialog(true);
  const closeDialog = () => setShowDialog(false);

  const handleLogout = () => {
    closeDialog();
    router.post(route('logout'));
  };

  return {
    showDialog,
    openDialog,
    closeDialog,
    handleLogout,
    dialogProps: {
      isOpen: showDialog,
      onClose: closeDialog,
      onConfirm: handleLogout,
      title,
      message,
      confirmText,
      cancelText,
      variant
    }
  };
};
