import React, { useState, useEffect } from 'react';
import { AnimatePresence } from 'motion/react';
import { Head, router, usePage } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import BanUserConfirmDialog from '@/Components/BanUserConfirmDialog';
import DeleteUserConfirmDialog from '@/Components/DeleteUserConfirmDialog';
import PageHeader from '@/Components/PageHeader';
import { useBodyScrollLock } from '@/Hooks/useBodyScrollLock';
import ModalBackdrop from '@/Components/ModalBackdrop';
import ModalContainer from '@/Components/ModalContainer';
import { Pagination } from '@/Components/Pagination';
import { Button } from '@/Components/ui/button';
import { Badge } from '@/Components/ui/badge';
import { Card } from '@/Components/ui/card';
import { cn } from '@/lib/utils';

interface User { id: number; name: string; email: string; role: 'admin' | 'operator' | 'complainant' | 'tower_owner' | 'provider_owner'; created_at?: string; banned?: boolean; deleted_at?: string | null; fo_provider_id?: number | null; provider?: { id: number; name: string } | null }

interface PaginationData {
  data: User[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  links?: { url: string | null; label: string; active: boolean }[];
}

interface Props {
  users: PaginationData;
}

/* ---------------------------------------------------------------------------
 * Presentation constants.
 *
 * Every one of these existed before as a class string re-typed at each call
 * site (five label recipes, four icon recipes, eight input recipes across the
 * admin surface). One name per recipe is the whole point: the next person
 * cannot drift it by approximating.
 * ------------------------------------------------------------------------- */

/** Column head: 40px on the inset ground, closed by the strong rule. */
const TH = 'h-10 px-3 text-left align-middle text-[11px] font-semibold uppercase tracking-wide text-muted-foreground';
/** Body cell: 12px horizontal, rows land at 44px+ from the padding. */
const TD = 'px-3 py-2.5 align-middle';
const FIELD_LABEL = 'text-sm font-medium text-foreground';
const FIELD_HINT = 'text-xs text-muted-foreground';
const INPUT =
  'h-11 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground placeholder:text-placeholder ' +
  'transition-colors duration-140 ease-state focus-visible:outline-none focus-visible:ring focus-visible:ring-offset-2 ' +
  'disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground';

/**
 * Role is a stored English enum. These are the labels the create/edit <select>
 * has always shown, reused here so the table and the form say the same word
 * instead of the table printing the raw `provider_owner` with an underscore
 * swapped for a space.
 */
const ROLE_LABEL: Record<User['role'], string> = {
  admin: 'Admin',
  operator: 'Operator',
  complainant: 'Complainant',
  tower_owner: 'Pemilik Menara',
  provider_owner: 'Provider Owner',
};

const ROLE_VARIANT: Record<User['role'], 'default' | 'info' | 'neutral'> = {
  admin: 'default',
  operator: 'info',
  complainant: 'neutral',
  tower_owner: 'neutral',
  provider_owner: 'neutral',
};

const formatJoined = (value?: string): string | null => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
};

/* Icons. 16px, stroke 2, currentColor — one definition each. */
const IconPlus = () => (
  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
  </svg>
);

const IconPencil = () => (
  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  </svg>
);

const IconBan = () => (
  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
  </svg>
);

const IconRestore = () => (
  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
);

const IconUsers = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
  </svg>
);

const IconClose = () => (
  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const IconAlert = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
  </svg>
);

const UsersPage: React.FC<Props> = ({ users }) => {
  const usersList = users?.data || [];
  const pagination = users ? {
    current_page: users.current_page,
    last_page: users.last_page,
    total: users.total,
  } : null;
  const [form, setForm] = useState<{ id?: number; name: string; email: string; role: 'admin' | 'operator' | 'complainant' | 'tower_owner' | 'provider_owner'; password?: string; banned?: boolean; provider_name?: string }>({ name: '', email: '', role: 'operator', banned: false, provider_name: '' });
  const { auth } = usePage().props as any;
  const [showPassword, setShowPassword] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [emailError, setEmailError] = useState<string>('');
  const [showBanDialog, setShowBanDialog] = useState(false);
  const [banDialogData, setBanDialogData] = useState<{
    userName: string;
    userEmail: string;
    isBanning: boolean;
    userId: number;
  } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteDialogData, setDeleteDialogData] = useState<{
    userId: number;
    userName: string;
    userEmail: string;
  } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Prevent body scroll saat modal terbuka
  useBodyScrollLock(showModal);

  // Validasi email saat nilai berubah
  useEffect(() => {
    if (form.email) {
      validateEmail();
    } else {
      setEmailError('');
    }
  }, [form.email]);

  // Fungsi untuk validasi email
  const validateEmail = () => {
    // Jika sedang edit, kita perlu mengecualikan email user yang sedang diedit
    const existingEmails = usersList.filter(user => !form.id || user.id !== form.id).map(user => user.email.toLowerCase());

    if (existingEmails.includes(form.email.toLowerCase())) {
      setEmailError('Email ini sudah digunakan oleh pengguna lain');
      return false;
    } else {
      setEmailError('');
      return true;
    }
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validasi email sebelum submit
    if (!validateEmail()) {
      return; // Berhenti jika email tidak valid
    }

    // Validasi banned status jika user mencoba banned diri sendiri
    if (form.banned && form.id === auth.user.id) {
      alert('Anda tidak dapat membanned akun Anda sendiri!');
      return;
    }

    // Konfirmasi jika user akan dibanned atau diunban
    if (form.id && form.banned !== usersList.find((u: User) => u.id === form.id)?.banned) {
      const isBanning = form.banned || false;
      setBanDialogData({
        userName: form.name,
        userEmail: form.email,
        isBanning: isBanning,
        userId: form.id
      });
      setShowBanDialog(true);
      return;
    }

    if (form.id) {
      // Untuk semua user, admin dapat mengubah semua field termasuk status banned
      // Namun untuk complainant, tower_owner, dan provider_owner, hanya kirim data yang relevan
      const originalUser = usersList.find(u => u.id === form.id);
      if (originalUser && (originalUser.role === 'complainant' || originalUser.role === 'tower_owner' || originalUser.role === 'provider_owner')) {
        const updateData: any = {
          role: form.role,
          banned: form.banned // Admin dapat membanned semua role
        };
        // Include provider_name for provider_owner role
        if (form.role === 'provider_owner' && form.provider_name) {
          updateData.provider_name = form.provider_name;
        }
        router.put(route('admin.users.update', { user: form.id }), updateData, {
          onSuccess: () => {
            setForm({ name: '', email: '', role: 'operator', banned: false, provider_name: '' });
            setShowPassword(false);
            setShowModal(false);
            setEmailError('');
          },
          onError: (errors: any) => {
            if (errors.email) {
              setEmailError(Array.isArray(errors.email) ? errors.email[0] : errors.email);
            }
          }
        });
      } else {
        router.put(route('admin.users.update', { user: form.id }), form, {
          onSuccess: () => {
            setForm({ name: '', email: '', role: 'operator', banned: false, provider_name: '' });
            setShowPassword(false);
            setShowModal(false);
            setEmailError('');
          },
          onError: (errors: any) => {
            if (errors.email) {
              setEmailError(Array.isArray(errors.email) ? errors.email[0] : errors.email);
            }
          }
        });
      }
    } else {
      router.post(route('admin.users.store'), form, {
        onSuccess: () => {
          setForm({ name: '', email: '', role: 'operator', banned: false, provider_name: '' });
          setShowPassword(false);
          setShowModal(false);
          setEmailError('');
        },
        onError: (errors: any) => {
          if (errors.email) {
            setEmailError(Array.isArray(errors.email) ? errors.email[0] : errors.email);
          }
        }
      });
    }
  };

  const handleDelete = (user: User) => {
    // Cek apakah user yang akan dihapus adalah admin yang sedang login
    if (user.id === auth.user.id) {
      alert('Anda tidak dapat menghapus akun Anda sendiri!');
      return;
    }

    setDeleteDialogData({
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
    });
    setShowDeleteDialog(true);
  };

  const handleDeleteConfirm = () => {
    if (!deleteDialogData) return;

    setIsDeleting(true);
    router.delete(route('admin.users.destroy', { user: deleteDialogData.userId }), {
      onSuccess: () => {
        setShowDeleteDialog(false);
        setDeleteDialogData(null);
        setIsDeleting(false);
      },
      onError: () => {
        setIsDeleting(false);
      }
    });
  };

  const handleDeleteCancel = () => {
    setShowDeleteDialog(false);
    setDeleteDialogData(null);
    setIsDeleting(false);
  };

  const handleRestore = (user: User) => {
    router.post(route('admin.users.restore', user.id), {}, {
      onSuccess: () => {
        // Success handled by flash message
      }
    });
  };

  const handleBanConfirm = () => {
    if (!banDialogData) return;

    setIsProcessing(true);

    if (banDialogData.userId) {
      // Admin dapat membanned semua role termasuk complainant, tower_owner, dan provider_owner
      const originalUser = usersList.find(u => u.id === banDialogData.userId);
      if (originalUser && (originalUser.role === 'complainant' || originalUser.role === 'tower_owner' || originalUser.role === 'provider_owner')) {
        const updateData = {
          role: originalUser.role,
          banned: banDialogData.isBanning // Gunakan status banned dari dialog konfirmasi
        };
        router.put(route('admin.users.update', { user: banDialogData.userId }), updateData, {
          onSuccess: () => {
            setForm({ name: '', email: '', role: 'operator', banned: false });
            setShowPassword(false);
            setShowModal(false);
            setEmailError('');
            setShowBanDialog(false);
            setBanDialogData(null);
            setIsProcessing(false);
          },
          onError: () => {
            setIsProcessing(false);
          }
        });
      } else {
        // Untuk role lain, gunakan data lengkap dari form dengan status banned dari dialog
        const updatedForm = { ...form, banned: banDialogData.isBanning };
        router.put(route('admin.users.update', { user: banDialogData.userId }), updatedForm, {
          onSuccess: () => {
            setForm({ name: '', email: '', role: 'operator', banned: false });
            setShowPassword(false);
            setShowModal(false);
            setEmailError('');
            setShowBanDialog(false);
            setBanDialogData(null);
            setIsProcessing(false);
          },
          onError: () => {
            setIsProcessing(false);
          }
        });
      }
    }
  };

  const handleBanCancel = () => {
    setShowBanDialog(false);
    setBanDialogData(null);
    setIsProcessing(false);
  };

  /** One handler shape for both the desktop row and the mobile row. */
  const openEdit = (u: User) => {
    if (u.role === 'complainant' || u.role === 'tower_owner' || u.role === 'provider_owner') {
      setForm({
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        banned: u.banned || false,
        provider_name: u.provider?.name || '',
        password: undefined
      });
    } else {
      setForm({
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        banned: u.banned || false,
        provider_name: ''
      });
    }
    setShowModal(true);
  };

  const openCreate = () => {
    setForm({ name: '', email: '', role: 'operator', banned: false, provider_name: '' });
    setShowPassword(false);
    setShowModal(true);
  };

  const isRestrictedRole = !!(form.id && (form.role === 'complainant' || form.role === 'tower_owner' || form.role === 'provider_owner'));
  const restrictedRoleLabel = form.role === 'complainant' ? 'complainant' : form.role === 'tower_owner' ? 'tower owner' : 'provider owner';

  /** Status cell, identical on desktop and mobile so one account reads one way. */
  const StatusBadge = ({ u }: { u: User }) =>
    u.deleted_at ? (
      <Badge variant="neutral">Nonaktif</Badge>
    ) : u.banned ? (
      <Badge variant="destructive">
        <IconBan />
        Banned
      </Badge>
    ) : (
      <Badge variant="success">Aktif</Badge>
    );

  const avatarClasses = (self: boolean) =>
    cn(
      'flex shrink-0 items-center justify-center rounded-full text-sm font-semibold',
      self ? 'bg-primary text-primary-foreground' : 'border border-border bg-well text-foreground',
    );

  return (
    <AdminLayout title="Kelola Pengguna">
      <Head title="Kelola Pengguna" />

      {/* Single action zone. The old hero band carried this button and the page
          then repeated it below; there is now exactly one "Tambah User Baru". */}
      <PageHeader
        title="Kelola Pengguna"
        description="Kelola informasi pengguna sistem dan atur hak akses sesuai kebutuhan"
        showLogo={false}
        actions={
          <Button type="button" onClick={openCreate} className="h-11">
            <IconPlus />
            Tambah User Baru
          </Button>
        }
      />

      <Card variant="flat" className="tt-enter-up overflow-hidden">
        {/* Caption bar. Two facts, one line, no icon tile, no card of its own. */}
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border-b border-border px-3 py-2.5">
          <h2 className="text-sm font-semibold tracking-tight text-foreground">Daftar Pengguna</h2>
          <p className="text-xs tabular-nums text-muted-foreground">
            Menampilkan {usersList.length} dari {pagination?.total || 0} akun terdaftar
          </p>
        </div>

        {/* Desktop table */}
        <div className="hidden overflow-x-auto md:block">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-border-strong bg-well">
                <th scope="col" className={TH}>Pengguna</th>
                <th scope="col" className={TH}>Role</th>
                <th scope="col" className={TH}>Status</th>
                <th scope="col" className={TH}>Bergabung</th>
                <th scope="col" className={cn(TH, 'text-right')}>Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/70">
              {usersList.length === 0 ? (
                <tr>
                  <td colSpan={5} className="bg-well px-3 py-10 text-center">
                    <IconUsers className="mx-auto mb-3 h-8 w-8 text-placeholder" />
                    <p className="text-sm font-medium text-foreground">Belum ada pengguna terdaftar</p>
                    <p className="mt-1 text-xs text-muted-foreground">Tambahkan pengguna pertama dengan form di atas</p>
                  </td>
                </tr>
              ) : (
                usersList.map((u) => {
                  const self = u.id === auth.user.id;
                  const joined = formatJoined(u.created_at);
                  return (
                    <tr
                      key={u.id}
                      className={cn(
                        'transition-colors duration-140 ease-state hover:bg-accent',
                        self && 'bg-primary-soft/40',
                      )}
                    >
                      <td className={TD}>
                        <div className="flex items-center gap-3">
                          <span className={cn(avatarClasses(self), 'h-9 w-9')} aria-hidden="true">
                            {u.name.charAt(0).toUpperCase()}
                          </span>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="truncate text-sm font-medium text-foreground" title={u.name}>
                                {u.name}
                              </span>
                              {self && (
                                <Badge className="px-1.5 py-0 text-[10px] uppercase tracking-wide">You</Badge>
                              )}
                            </div>
                            <div className="truncate text-xs text-muted-foreground" title={u.email}>
                              {u.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className={TD}>
                        <Badge variant={ROLE_VARIANT[u.role]}>{ROLE_LABEL[u.role]}</Badge>
                        {u.provider?.name && (
                          <div className="mt-1 max-w-[14rem] truncate text-xs text-muted-foreground" title={u.provider.name}>
                            {u.provider.name}
                          </div>
                        )}
                      </td>
                      <td className={TD}>
                        <StatusBadge u={u} />
                      </td>
                      <td className={cn(TD, 'whitespace-nowrap text-sm tabular-nums text-muted-foreground')}>
                        {joined ?? '—'}
                      </td>
                      <td className={cn(TD, 'whitespace-nowrap text-right')}>
                        <div className="flex items-center justify-end gap-2">
                          {!u.deleted_at ? (
                            <>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="h-9"
                                onClick={() => openEdit(u)}
                                title="Edit user"
                              >
                                <IconPencil />
                                Edit
                              </Button>

                              {/* Kept rendered-but-disabled for your own account:
                                  a control that vanishes teaches nothing, a
                                  disabled one with a title says why. */}
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => handleDelete(u)}
                                disabled={self}
                                className="h-9 border-destructive-border text-destructive-strong hover:bg-destructive-soft hover:text-destructive-strong"
                                title={self ? 'Tidak dapat menghapus akun sendiri' : 'Nonaktifkan user'}
                              >
                                <IconBan />
                                {self ? 'Hapus (Diri Sendiri)' : 'Nonaktifkan'}
                              </Button>
                            </>
                          ) : (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="h-9 border-success-border text-success-strong hover:bg-success-soft hover:text-success-strong"
                              onClick={() => handleRestore(u)}
                              title="Aktifkan kembali akun ini"
                            >
                              <IconRestore />
                              Aktifkan Kembali
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile list. Rows in a shared frame, not a card per user — a card
            around every row is 42 borders doing the work of one divider. */}
        {usersList.length === 0 ? (
          <div className="bg-well px-4 py-10 text-center md:hidden">
            <IconUsers className="mx-auto mb-3 h-8 w-8 text-placeholder" />
            <p className="text-sm font-medium text-foreground">Belum ada pengguna terdaftar</p>
            <p className="mt-1 text-xs text-muted-foreground">Tambahkan pengguna pertama dengan tombol di atas</p>
          </div>
        ) : (
          <ul className="divide-y divide-border/70 md:hidden">
            {usersList.map((u) => {
              const self = u.id === auth.user.id;
              const joined = formatJoined(u.created_at);
              return (
                <li key={u.id} className={cn('p-3', self && 'bg-primary-soft/40')}>
                  <div className="flex items-start gap-3">
                    <span className={cn(avatarClasses(self), 'h-9 w-9')} aria-hidden="true">
                      {u.name.charAt(0).toUpperCase()}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="truncate text-sm font-medium text-foreground" title={u.name}>
                          {u.name}
                        </span>
                        {self && (
                          <Badge className="px-1.5 py-0 text-[10px] uppercase tracking-wide">You</Badge>
                        )}
                      </div>
                      <div className="truncate text-xs text-muted-foreground" title={u.email}>
                        {u.email}
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-1.5">
                        <Badge variant={ROLE_VARIANT[u.role]}>{ROLE_LABEL[u.role]}</Badge>
                        <StatusBadge u={u} />
                        {joined && (
                          <span className="text-xs tabular-nums text-muted-foreground">Bergabung {joined}</span>
                        )}
                      </div>
                      {u.provider?.name && (
                        <div className="mt-1 truncate text-xs text-muted-foreground" title={u.provider.name}>
                          {u.provider.name}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-3 flex gap-2">
                    {!u.deleted_at ? (
                      <>
                        <Button
                          type="button"
                          variant="outline"
                          className="h-11 flex-1"
                          onClick={() => openEdit(u)}
                          title="Edit user"
                        >
                          <IconPencil />
                          Edit
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          className="h-11 flex-1 border-destructive-border text-destructive-strong hover:bg-destructive-soft hover:text-destructive-strong"
                          onClick={() => handleDelete(u)}
                          disabled={self}
                          title={self ? 'Tidak dapat menghapus akun sendiri' : 'Nonaktifkan user'}
                        >
                          <IconBan />
                          {self ? 'Hapus (Diri Sendiri)' : 'Nonaktifkan'}
                        </Button>
                      </>
                    ) : (
                      <Button
                        type="button"
                        variant="outline"
                        className="h-11 w-full border-success-border text-success-strong hover:bg-success-soft hover:text-success-strong"
                        onClick={() => handleRestore(u)}
                        title="Aktifkan kembali akun ini"
                      >
                        <IconRestore />
                        Aktifkan Kembali
                      </Button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        {/* Pagination - Shared for Desktop and Mobile */}
        {pagination && pagination.last_page > 1 && (
          <div className="border-t border-border bg-well px-3 py-2">
            <Pagination
              currentPage={pagination.current_page}
              lastPage={pagination.last_page}
              onPageChange={(page) => {
                router.get(route('admin.users.index'), { page }, { preserveState: true, preserveScroll: true });
              }}
            />
          </div>
        )}
      </Card>

      {/* Modal untuk tambah/edit user */}
      {/* AnimatePresence keeps the tree alive for the leave animation; without it React unmounts on the same paint and the dialog cuts out. */}
      <AnimatePresence>
      {showModal && (
        <ModalBackdrop onClick={() => setShowModal(false)} opacity={50} zIndex={50}>
          <ModalContainer maxWidth="4xl" maxHeight="90vh" className="my-4 border border-border overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between gap-3 border-b border-border px-4 py-3 sm:px-5">
              <div className="min-w-0">
                <h3 className="text-base font-semibold tracking-tight text-foreground">
                  {form.id ? 'Edit Data Pengguna' : 'Tambah Pengguna Baru'}
                </h3>
                {isRestrictedRole && (
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Role khusus: hanya status akun yang dapat diubah
                  </p>
                )}
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setShowModal(false)}
                className="h-11 w-11 shrink-0 text-muted-foreground hover:text-foreground"
                title="Tutup"
                aria-label="Tutup"
              >
                <IconClose />
              </Button>
            </div>
            <div
              className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-5"
              style={{
                minHeight: 0,
                maxHeight: 'calc(100vh - 12rem)',
                WebkitOverflowScrolling: 'touch',
                overscrollBehavior: 'contain'
              }}
            >
              <form onSubmit={submit} className="space-y-5">
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                  <div className="space-y-1.5">
                    <label htmlFor="user-name" className={FIELD_LABEL}>Nama Lengkap</label>
                    <input
                      id="user-name"
                      className={INPUT}
                      placeholder="Masukkan nama lengkap"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      disabled={isRestrictedRole}
                      required
                    />
                    {isRestrictedRole && (
                      <p className={FIELD_HINT}>
                        Nama user dengan role {restrictedRoleLabel} tidak dapat diubah
                      </p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="user-email" className={FIELD_LABEL}>Email</label>
                    <input
                      id="user-email"
                      className={cn(INPUT, emailError && 'border-destructive focus-visible:ring-destructive')}
                      type="email"
                      placeholder="Masukkan email"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      disabled={isRestrictedRole}
                      aria-invalid={!!emailError}
                      required
                    />
                    {isRestrictedRole && (
                      <p className={FIELD_HINT}>
                        Email user dengan role {restrictedRoleLabel} tidak dapat diubah
                      </p>
                    )}
                    {emailError && (
                      <p className="flex items-center gap-1.5 text-sm text-destructive-strong">
                        <IconAlert className="h-4 w-4 shrink-0" />
                        {emailError}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="user-role" className={FIELD_LABEL}>Role</label>
                    <select
                      id="user-role"
                      className={INPUT}
                      value={form.role}
                      onChange={(e) => {
                        const newRole = e.target.value as any;
                        // Clear provider_name if changing away from provider_owner
                        setForm({
                          ...form,
                          role: newRole,
                          provider_name: newRole === 'provider_owner' ? form.provider_name : ''
                        });
                      }}
                    >
                      <option value="operator">Operator</option>
                      <option value="admin">Admin</option>
                      <option value="complainant">Complainant</option>
                      <option value="tower_owner">Pemilik Menara</option>
                      <option value="provider_owner">Provider Owner</option>
                    </select>
                    {isRestrictedRole && (
                      <p className={FIELD_HINT}>
                        Role dapat diubah untuk user {restrictedRoleLabel}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="user-password" className={FIELD_LABEL}>
                      Password {form.id && '(kosongkan jika tidak diubah)'}
                    </label>
                    <div className="relative">
                      <input
                        id="user-password"
                        className={cn(INPUT, 'pr-12')}
                        type={showPassword ? 'text' : 'password'}
                        placeholder={form.id ? "Biarkan kosong jika tidak diubah" : "Masukkan password"}
                        value={form.password ?? ''}
                        onChange={(e) => setForm({ ...form, password: e.target.value })}
                        disabled={isRestrictedRole}
                        required={!form.id}
                      />
                      <button
                        type="button"
                        className="absolute right-0 top-0 flex h-11 w-11 items-center justify-center rounded-md text-muted-foreground transition-colors duration-140 ease-state hover:text-foreground focus-visible:outline-none focus-visible:ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        onClick={() => setShowPassword(!showPassword)}
                        disabled={isRestrictedRole}
                        title={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                        aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                      >
                        {showPassword ? (
                          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L7.05 7.05M9.878 9.878a3 3 0 105.656 5.656m0 0L12 12m0 0l3.5-3.5M12 12l-3.5 3.5" />
                          </svg>
                        ) : (
                          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        )}
                      </button>
                    </div>
                    {isRestrictedRole && (
                      <p className={FIELD_HINT}>
                        Password user dengan role {restrictedRoleLabel} tidak dapat diubah
                      </p>
                    )}
                  </div>

                  {/* Provider Name Input - Only show for provider_owner role */}
                  {form.role === 'provider_owner' && (
                    <div className="space-y-1.5 md:col-span-2">
                      <label htmlFor="user-provider" className={FIELD_LABEL}>
                        Nama Provider <span className="text-destructive-strong">*</span>
                      </label>
                      <input
                        id="user-provider"
                        className={INPUT}
                        type="text"
                        placeholder="Masukkan nama provider (contoh: Telkom Indonesia, MyRepublic, dll)"
                        value={form.provider_name || ''}
                        onChange={(e) => setForm({ ...form, provider_name: e.target.value })}
                        required
                      />
                      <p className={FIELD_HINT}>
                        {form.id
                          ? 'Ubah nama provider. Jika provider dengan nama ini sudah ada, akan digunakan provider yang ada. Jika belum ada, akan dibuat provider baru.'
                          : 'Masukkan nama provider. Sistem akan otomatis membuat provider baru jika belum ada, atau menggunakan provider yang sudah ada jika nama sudah terdaftar.'}
                      </p>
                    </div>
                  )}

                  {/* Banned status checkbox - muncul saat edit user dan tambah user baru */}
                  <div className="space-y-1.5 md:col-span-2">
                    <span className={FIELD_LABEL}>Status Akun</span>
                    <Card variant="well" padding="dense">
                      <label htmlFor="banned" className="flex min-h-[44px] cursor-pointer items-center gap-3">
                        <input
                          type="checkbox"
                          id="banned"
                          checked={form.banned || false}
                          onChange={(e) => setForm({ ...form, banned: e.target.checked })}
                          className="h-5 w-5 shrink-0 rounded border-input text-primary focus-visible:outline-none focus-visible:ring focus-visible:ring-offset-2 disabled:cursor-not-allowed"
                          disabled={form.id === auth.user.id} // Disable jika user mencoba banned dirinya sendiri
                        />
                        <span className="text-sm text-foreground">
                          <span className={cn('font-medium', form.banned ? 'text-destructive-strong' : 'text-foreground')}>
                            {form.banned ? 'Akun Dibanned' : 'Akun Aktif'}
                          </span>
                          {form.id === auth.user.id && (
                            <span className="ml-2 text-xs text-muted-foreground">(Tidak dapat membanned akun sendiri)</span>
                          )}
                        </span>
                      </label>
                      <p className={cn(FIELD_HINT, 'mt-2 border-t border-border/70 pt-2')}>
                        {form.banned
                          ? 'User tidak akan dapat login ke sistem jika dibanned'
                          : 'User dapat mengakses sistem sesuai dengan role yang diberikan'}
                        {form.id ? (
                          <span className="mt-1 block text-info-strong">
                            Admin dapat mengubah status banned untuk semua role termasuk {form.role}
                          </span>
                        ) : (
                          <span className="mt-1 block text-success-strong">
                            Tentukan status awal akun (aktif/banned) untuk user baru
                          </span>
                        )}
                      </p>
                    </Card>
                  </div>
                </div>

                <div className="flex flex-col gap-2 border-t border-border pt-4 sm:flex-row sm:justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    className="h-11 w-full sm:w-auto"
                    onClick={() => setShowModal(false)}
                  >
                    Batal
                  </Button>
                  <Button className="h-11 w-full sm:w-auto" type="submit">
                    {form.id ? 'Simpan Perubahan' : 'Tambah User'}
                  </Button>
                </div>
              </form>
            </div>
          </ModalContainer>
        </ModalBackdrop>
      )}
      </AnimatePresence>

      {/* Ban User Confirmation Dialog */}
      {banDialogData && (
        <BanUserConfirmDialog
          show={showBanDialog}
          onClose={handleBanCancel}
          onConfirm={handleBanConfirm}
          userName={banDialogData.userName}
          userEmail={banDialogData.userEmail}
          isBanning={banDialogData.isBanning}
          loading={isProcessing}
        />
      )}

      {/* Delete User Confirmation Dialog */}
      {deleteDialogData && (
        <DeleteUserConfirmDialog
          show={showDeleteDialog}
          onClose={handleDeleteCancel}
          onConfirm={handleDeleteConfirm}
          userName={deleteDialogData.userName}
          userEmail={deleteDialogData.userEmail}
          loading={isDeleting}
        />
      )}
    </AdminLayout>
  );
};

export default UsersPage;
