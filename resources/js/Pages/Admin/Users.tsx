import React, { useState, useEffect } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import BanUserConfirmDialog from '@/Components/BanUserConfirmDialog';

interface User { id: number; name: string; email: string; role: 'admin' | 'operator' | 'complainant' | 'tower_owner'; created_at?: string; banned?: boolean }

interface Props { users: User[] }

const UsersPage: React.FC<Props> = ({ users = [] }) => {
  const [form, setForm] = useState<{ id?: number; name: string; email: string; role: 'admin' | 'operator' | 'complainant' | 'tower_owner'; password?: string; banned?: boolean }>({ name: '', email: '', role: 'operator', banned: false });
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
    const existingEmails = users.filter(user => !form.id || user.id !== form.id).map(user => user.email.toLowerCase());
    
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
    if (form.id && form.banned !== users.find(u => u.id === form.id)?.banned) {
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
      // Namun untuk complainant dan tower_owner, hanya kirim data yang relevan
      const originalUser = users.find(u => u.id === form.id);
      if (originalUser && (originalUser.role === 'complainant' || originalUser.role === 'tower_owner')) {
        const updateData = {
          role: form.role,
          banned: form.banned // Admin dapat membanned semua role
        };
        router.put(route('admin.users.update', { user: form.id }), updateData, {
          onSuccess: () => {
            setForm({ name: '', email: '', role: 'operator', banned: false });
            setShowPassword(false);
            setShowModal(false);
            setEmailError('');
          }
        });
      } else {
        router.put(route('admin.users.update', { user: form.id }), form, {
          onSuccess: () => {
            setForm({ name: '', email: '', role: 'operator', banned: false });
            setShowPassword(false);
            setShowModal(false);
            setEmailError('');
          }
        });
      }
    } else {
      router.post(route('admin.users.store'), form, {
        onSuccess: () => {
          setForm({ name: '', email: '', role: 'operator', banned: false });
          setShowPassword(false);
          setShowModal(false);
          setEmailError('');
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
    
    const confirmed = window.confirm(`Apakah Anda yakin ingin menghapus user "${user.name}"?`);
    if (confirmed) {
      router.delete(route('admin.users.destroy', { user: user.id }));
    }
  };

  const handleBanConfirm = () => {
    if (!banDialogData) return;
    
    setIsProcessing(true);
    
    if (banDialogData.userId) {
      // Admin dapat membanned semua role termasuk complainant dan tower_owner
      const originalUser = users.find(u => u.id === banDialogData.userId);
      if (originalUser && (originalUser.role === 'complainant' || originalUser.role === 'tower_owner')) {
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

  return (
    <AdminLayout title="Kelola Pengguna">
      <Head title="Kelola Pengguna" />
      
      {/* Header Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Kelola Pengguna</h1>
        <p className="text-gray-600">Kelola informasi pengguna sistem dan atur hak akses sesuai kebutuhan</p>
      </div>

      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="px-4 sm:px-6 py-4 bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200 flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-3 sm:space-y-0">
          <h3 className="text-lg font-semibold text-gray-800 flex items-center">
            <svg className="w-5 h-5 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
            </svg>
            Daftar Pengguna ({users.length})
          </h3>
          <button 
            onClick={() => {
              setForm({ name: '', email: '', role: 'operator' });
              setShowPassword(false);
              setShowModal(true);
            }}
            className="w-full sm:w-auto px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg hover:from-red-700 hover:to-red-800 transition-all shadow-md hover:shadow-lg font-medium flex items-center justify-center text-sm"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Tambah User
          </button>
        </div>
        
        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-yellow-50 border-b border-yellow-200">
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  <div className="flex items-center">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Nama
                  </div>
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  <div className="flex items-center">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 3.26a2 2 0 001.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    Email
                  </div>
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  <div className="flex items-center">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                    Role
                  </div>
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  <div className="flex items-center">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
                    </svg>
                    Aksi
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {users.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                    <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                    </svg>
                    <p className="text-sm">Belum ada pengguna terdaftar</p>
                    <p className="text-xs text-gray-400 mt-1">Tambahkan pengguna pertama dengan form di atas</p>
                  </td>
                </tr>
              ) : (
                users.map((u, index) => (
                  <tr key={u.id} className={`hover:bg-gray-50 transition-colors ${
                    u.id === auth.user.id 
                      ? 'bg-blue-50 border-l-4 border-blue-500' 
                      : index % 2 === 0 ? 'bg-white' : 'bg-gray-25'
                  }`}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                            u.id === auth.user.id 
                              ? 'bg-gradient-to-r from-blue-500 to-blue-600' 
                              : 'bg-gradient-to-r from-red-500 to-red-600'
                          }`}>
                            <span className="text-white font-semibold text-sm">
                              {u.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="flex items-center space-x-2">
                            <div className="text-sm font-medium text-gray-900">{u.name}</div>
                            {u.id === auth.user.id && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
                                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                                Anda
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{u.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col space-y-2">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                          u.role === 'admin' 
                            ? 'bg-red-100 text-red-800 border border-red-200' 
                            : 'bg-blue-100 text-blue-800 border border-blue-200'
                        }`}>
                          {u.role === 'admin' ? (
                            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                            </svg>
                          ) : (
                            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                          )}
                          {u.role}
                        </span>
                        
                        {/* Status banned indicator */}
                        {u.banned && (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200">
                            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                            </svg>
                            Banned
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button 
                          className="inline-flex items-center px-3 py-2 border border-yellow-300 rounded-lg text-yellow-700 bg-yellow-50 hover:bg-yellow-100 transition-colors text-xs font-medium"
                          onClick={() => {
                            // Untuk complainant users atau tower_owner, preserve original name dan email
                            if (u.role === 'complainant' || u.role === 'tower_owner') {
                              setForm({ 
                                id: u.id, 
                                name: u.name, 
                                email: u.email, 
                                role: u.role, 
                                banned: u.banned || false,
                                password: undefined // Reset password field
                              });
                            } else {
                              setForm({ 
                                id: u.id, 
                                name: u.name, 
                                email: u.email, 
                                role: u.role, 
                                banned: u.banned || false 
                              });
                            }
                            setShowModal(true);
                          }}
                        >
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          Edit
                        </button>
                        <button 
                          className={`inline-flex items-center px-3 py-2 border rounded-lg text-xs font-medium transition-colors ${
                            u.id === auth.user.id
                              ? 'border-gray-300 text-gray-400 bg-gray-100 cursor-not-allowed'
                              : 'border-red-300 text-red-700 bg-red-50 hover:bg-red-100'
                          }`}
                          onClick={() => handleDelete(u)}
                          disabled={u.id === auth.user.id}
                          title={u.id === auth.user.id ? 'Tidak dapat menghapus akun sendiri' : 'Hapus user'}
                        >
                          <svg className={`w-4 h-4 mr-1 ${u.id === auth.user.id ? 'text-gray-400' : 'text-red-700'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          {u.id === auth.user.id ? 'Hapus (Diri Sendiri)' : 'Hapus'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden">
          {users.length === 0 ? (
            <div className="px-4 py-12 text-center text-gray-500">
              <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
              </svg>
              <p className="text-sm">Belum ada pengguna terdaftar</p>
              <p className="text-xs text-gray-400 mt-1">Tambahkan pengguna pertama dengan tombol di atas</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {users.map((u, index) => (
                <div key={u.id} className={`p-4 ${
                  u.id === auth.user.id 
                    ? 'bg-blue-50 border-l-4 border-blue-500' 
                    : index % 2 === 0 ? 'bg-white' : 'bg-gray-25'
                }`}>
                  {/* User Header */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                          u.id === auth.user.id 
                            ? 'bg-gradient-to-r from-blue-500 to-blue-600' 
                            : 'bg-gradient-to-r from-red-500 to-red-600'
                        }`}>
                          <span className="text-white font-semibold text-sm">
                            {u.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      </div>
                      <div className="ml-3">
                        <div className="flex items-center space-x-2">
                          <div className="text-sm font-medium text-gray-900">{u.name}</div>
                          {u.id === auth.user.id && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
                              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                              </svg>
                              Anda
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* User Details */}
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center text-sm text-gray-600">
                      <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 3.26a2 2 0 001.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      <span className="break-all">{u.email}</span>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                        u.role === 'admin' 
                          ? 'bg-red-100 text-red-800 border border-red-200' 
                          : 'bg-blue-100 text-blue-800 border border-blue-200'
                      }`}>
                        {u.role === 'admin' ? (
                          <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                          </svg>
                        ) : (
                          <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        )}
                        {u.role}
                      </span>
                      
                      {/* Status banned indicator */}
                      {u.banned && (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200">
                          <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                          </svg>
                          Banned
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col space-y-2">
                    <button 
                      className="w-full inline-flex items-center justify-center px-3 py-2 border border-yellow-300 rounded-lg text-yellow-700 bg-yellow-50 hover:bg-yellow-100 transition-colors text-sm font-medium"
                      onClick={() => {
                        // Untuk complainant users atau tower_owner, preserve original name dan email
                        if (u.role === 'complainant' || u.role === 'tower_owner') {
                          setForm({ 
                            id: u.id, 
                            name: u.name, 
                            email: u.email, 
                            role: u.role, 
                            banned: u.banned || false,
                            password: undefined // Reset password field
                          });
                        } else {
                          setForm({ 
                            id: u.id, 
                            name: u.name, 
                            email: u.email, 
                            role: u.role, 
                            banned: u.banned || false 
                          });
                        }
                        setShowModal(true);
                      }}
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Edit User
                    </button>
                    <button 
                      className={`w-full inline-flex items-center justify-center px-3 py-2 border rounded-lg text-sm font-medium transition-colors ${
                        u.id === auth.user.id
                          ? 'border-gray-300 text-gray-400 bg-gray-100 cursor-not-allowed'
                          : 'border-red-300 text-red-700 bg-red-50 hover:bg-red-100'
                      }`}
                      onClick={() => handleDelete(u)}
                      disabled={u.id === auth.user.id}
                      title={u.id === auth.user.id ? 'Tidak dapat menghapus akun sendiri' : 'Hapus user'}
                    >
                      <svg className={`w-4 h-4 mr-2 ${u.id === auth.user.id ? 'text-gray-400' : 'text-red-700'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      {u.id === auth.user.id ? 'Hapus (Diri Sendiri)' : 'Hapus User'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal untuk tambah/edit user */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl overflow-hidden">
            <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                <svg className="w-5 h-5 mr-2 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {form.id ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  )}
                </svg>
                <div>
                  {form.id ? 'Edit User' : 'Tambah User Baru'}
                  {form.id && (form.role === 'complainant' || form.role === 'tower_owner') && (
                    <p className="text-xs text-gray-500 font-normal mt-1">
                      Hanya role dan status akun yang dapat diubah
                    </p>
                  )}
                </div>
              </h3>
              <button 
                onClick={() => setShowModal(false)}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6">
              <form onSubmit={submit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Nama Lengkap</label>
                    <input 
                      className={`w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all ${
                        form.id && (form.role === 'complainant' || form.role === 'tower_owner') ? 'bg-gray-100 cursor-not-allowed' : ''
                      }`}
                      placeholder="Masukkan nama lengkap" 
                      value={form.name} 
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      disabled={!!(form.id && (form.role === 'complainant' || form.role === 'tower_owner'))}
                      required 
                    />
                    {form.id && (form.role === 'complainant' || form.role === 'tower_owner') && (
                      <p className="text-xs text-gray-500 mt-1">
                        Nama user dengan role {form.role === 'complainant' ? 'complainant' : 'tower owner'} tidak dapat diubah
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Email</label>
                    <input 
                      className={`w-full border ${emailError ? 'border-red-500' : 'border-gray-300'} rounded-lg p-3 focus:ring-2 ${emailError ? 'focus:ring-red-400' : 'focus:ring-yellow-400'} focus:border-transparent transition-all ${
                        form.id && (form.role === 'complainant' || form.role === 'tower_owner') ? 'bg-gray-100 cursor-not-allowed' : ''
                      }`} 
                      type="email"
                      placeholder="Masukkan email" 
                      value={form.email} 
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      disabled={!!(form.id && (form.role === 'complainant' || form.role === 'tower_owner'))}
                      required 
                    />
                    {form.id && (form.role === 'complainant' || form.role === 'tower_owner') && (
                      <p className="text-xs text-gray-500 mt-1">
                        Email user dengan role {form.role === 'complainant' ? 'complainant' : 'tower owner'} tidak dapat diubah
                      </p>
                    )}
                    {emailError && (
                      <div className="mt-1 text-sm text-red-600 flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        {emailError}
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Role</label>
                    <select 
                      className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all" 
                      value={form.role} 
                      onChange={(e) => setForm({ ...form, role: e.target.value as any })}
                    >
                      <option value="operator">Operator</option>
                      <option value="admin">Admin</option>
                      <option value="complainant">Complainant</option>
                      <option value="tower_owner">Tower Owner</option>
                    </select>
                    {form.id && (form.role === 'complainant' || form.role === 'tower_owner') && (
                      <p className="text-xs text-gray-500 mt-1">
                        Role dapat diubah untuk user {form.role === 'complainant' ? 'complainant' : 'tower owner'}
                      </p>
                    )}
                  </div>
                  
                  {/* Banned status checkbox - muncul saat edit user dan tambah user baru */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Status Akun</label>
                    <div className="flex items-center mt-3">
                      <input
                        type="checkbox"
                        id="banned"
                        checked={form.banned || false}
                        onChange={(e) => setForm({ ...form, banned: e.target.checked })}
                        className="h-5 w-5 text-red-600 rounded border-gray-300 focus:ring-red-500"
                        disabled={form.id === auth.user.id} // Disable jika user mencoba banned dirinya sendiri
                      />
                      <label htmlFor="banned" className="ml-2 block text-sm text-gray-900">
                        <span className={`font-medium ${form.banned ? 'text-red-600' : 'text-gray-700'}`}>
                          {form.banned ? 'Akun Dibanned' : 'Akun Aktif'}
                        </span>
                        {form.id === auth.user.id && (
                          <span className="ml-2 text-xs text-gray-500">(Tidak dapat membanned akun sendiri)</span>
                        )}
                      </label>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {form.banned 
                        ? 'User tidak akan dapat login ke sistem jika dibanned' 
                        : 'User dapat mengakses sistem sesuai dengan role yang diberikan'}
                      {form.id ? (
                        <span className="block mt-1 text-blue-600">
                          Admin dapat mengubah status banned untuk semua role termasuk {form.role}
                        </span>
                      ) : (
                        <span className="block mt-1 text-green-600">
                          Tentukan status awal akun (aktif/banned) untuk user baru
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      Password {form.id && '(kosongkan jika tidak diubah)'}
                    </label>
                    <div className="relative">
                      <input 
                        className={`w-full border border-gray-300 rounded-lg p-3 pr-12 focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all ${
                          form.id && (form.role === 'complainant' || form.role === 'tower_owner') ? 'bg-gray-100 cursor-not-allowed' : ''
                        }`} 
                        type={showPassword ? 'text' : 'password'}
                        placeholder={form.id ? "Biarkan kosong jika tidak diubah" : "Masukkan password"} 
                        value={form.password ?? ''} 
                        onChange={(e) => setForm({ ...form, password: e.target.value })}
                        disabled={!!(form.id && (form.role === 'complainant' || form.role === 'tower_owner'))}
                        required={!form.id}
                      />
                      {form.id && (form.role === 'complainant' || form.role === 'tower_owner') && (
                        <p className="text-xs text-gray-500 mt-1">
                          Password user dengan role {form.role === 'complainant' ? 'complainant' : 'tower owner'} tidak dapat diubah
                        </p>
                      )}
                      <button
                        type="button"
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                        onClick={() => setShowPassword(!showPassword)}
                        disabled={!!(form.id && (form.role === 'complainant' || form.role === 'tower_owner'))}
                      >
                        {showPassword ? (
                          <svg className="w-5 h-5 text-gray-400 hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L7.05 7.05M9.878 9.878a3 3 0 105.656 5.656m0 0L12 12m0 0l3.5-3.5M12 12l-3.5 3.5" />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5 text-gray-400 hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
                <div className="flex justify-end pt-4 space-x-3">
                  <button 
                    type="button"
                    className="px-6 py-3 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                    onClick={() => setShowModal(false)}
                  >
                    Batal
                  </button>
                  <button 
                    className="px-8 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg hover:from-red-700 hover:to-red-800 transition-all shadow-lg hover:shadow-xl font-medium" 
                    type="submit"
                  >
                    {form.id ? 'Update User' : 'Tambah User'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

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
    </AdminLayout>
  );
};

export default UsersPage;


