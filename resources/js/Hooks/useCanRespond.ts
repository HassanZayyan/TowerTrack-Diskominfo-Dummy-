import { useMemo } from 'react';
import { usePage } from '@inertiajs/react';

interface UseCanRespondOptions {
  user_id: number | null | undefined;
  email?: string | null;
  phone?: string | null;
  phoneField?: string; // 'reporter_phone' or 'sender_phone'
  messageType?: 'report' | 'feedback'; // Untuk responseDescription
}

export function useCanRespond({ 
  user_id, 
  email, 
  phone, 
  phoneField = 'reporter_phone',
  messageType = 'report'
}: UseCanRespondOptions) {
  const { auth } = usePage().props as any;
  const authUser = auth?.user;
  const isAuthenticated = Boolean(authUser);
  const normalizedRole =
    typeof authUser?.role === 'string' ? authUser.role.toLowerCase() : undefined;
  
  return useMemo(() => {
    const isAdmin = isAuthenticated && normalizedRole === 'admin';
    const isOperator = isAuthenticated && normalizedRole === 'operator';
    const isAdminOrOperator = isAdmin || isOperator;
    const isOwner = Boolean(
      isAuthenticated && user_id && authUser?.id && Number(user_id) === Number(authUser.id)
    );
    const hasReporter = Boolean(user_id);
    
    // Admin/operator cannot respond from public pages - they must use admin pages for official responses
    // This hook is used in public pages (ShowReport, ShowFeedback), so admin/operator should not be able to respond
    if (isAdminOrOperator) {
      return {
        canRespond: false,
        responseDescription: undefined,
        isAdmin,
        isOperator,
        isOwner,
        hasReporter,
      };
    }
    
    // Determine who can respond (only for non-admin/operator users)
    let canRespond = false;
    
    if (hasReporter) {
      // For authenticated reports/feedbacks: only reporter (owner) can respond
      canRespond = isOwner;
    } else {
      // For anonymous reports/feedbacks: only guest can respond
      const canGuestRespond = !isAuthenticated && (!!email || !!phone);
      canRespond = canGuestRespond;
    }

    const responseDescription = !isAuthenticated && !hasReporter
      ? `Masukkan email dan nomor telepon yang digunakan saat mengirim ${messageType === 'report' ? 'laporan' : 'masukan'} untuk memverifikasi bahwa Anda adalah pengirim asli.`
      : undefined;

    return {
      canRespond,
      responseDescription,
      isAdmin,
      isOperator,
      isOwner,
      hasReporter,
    };
  }, [isAuthenticated, normalizedRole, user_id, authUser?.id, email, phone, phoneField, messageType]);
}

