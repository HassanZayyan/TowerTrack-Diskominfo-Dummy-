import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';

interface User { id: number; name: string; email: string; role: 'admin' | 'operator'; created_at?: string }

interface Props { users: User[] }

const UsersPage: React.FC<Props> = ({ users = [] }) => {
  const [form, setForm] = useState<{ id?: number; name: string; email: string; role: 'admin' | 'operator'; password?: string }>({ name: '', email: '', role: 'operator' });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (form.id) {
      router.put(route('admin.users.update', { user: form.id }), form);
    } else {
      router.post(route('admin.users.store'), form);
    }
    setForm({ name: '', email: '', role: 'operator' });
  };

  return (
    <AdminLayout title="User Management">
      <Head title="User Management" />
      <div className="rounded shadow p-4 mb-6" style={{ backgroundColor: '#FFFFFF', borderTop: '4px solid #FFD700' }}>
        <h2 className="font-semibold mb-3" style={{ color: '#212121' }}>Tambah / Ubah User</h2>
        <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <input className="border rounded p-2" placeholder="Nama" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <input className="border rounded p-2" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <select className="border rounded p-2" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as any })}>
            <option value="operator">Operator</option>
            <option value="admin">Admin</option>
          </select>
          <input className="border rounded p-2" type="password" placeholder="Password (opsional saat edit)" value={form.password ?? ''} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          <button className="rounded p-2" type="submit" style={{ backgroundColor: '#212121', color: '#FFFFFF' }}>{form.id ? 'Update' : 'Tambah'}</button>
        </form>
      </div>

      <div className="rounded shadow" style={{ backgroundColor: '#FFFFFF' }}>
        <table className="w-full text-left">
          <thead>
            <tr style={{ backgroundColor: '#FFF8E1' }}>
              <th className="px-4 py-3 border-b">Nama</th>
              <th className="px-4 py-3 border-b">Email</th>
              <th className="px-4 py-3 border-b">Role</th>
              <th className="px-4 py-3 border-b">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 border-b">{u.name}</td>
                <td className="px-4 py-3 border-b">{u.email}</td>
                <td className="px-4 py-3 border-b">{u.role}</td>
                <td className="px-4 py-3 border-b flex gap-2">
                  <button className="px-3 py-1 text-sm rounded" style={{ backgroundColor: '#FFD700', color: '#212121' }} onClick={() => setForm({ id: u.id, name: u.name, email: u.email, role: u.role })}>Edit</button>
                  <button className="px-3 py-1 text-sm rounded" style={{ backgroundColor: '#B71C1C', color: '#FFFFFF' }} onClick={() => router.delete(route('admin.users.destroy', { user: u.id }))}>Hapus</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  );
};

export default UsersPage;


