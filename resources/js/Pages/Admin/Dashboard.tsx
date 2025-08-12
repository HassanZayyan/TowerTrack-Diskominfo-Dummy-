import React from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Head } from '@inertiajs/react';

const AdminDashboard: React.FC = () => {
  return (
    <AdminLayout title="Admin Dashboard">
      <Head title="Admin Dashboard" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded p-4 shadow border-l-4" style={{ backgroundColor: '#FFFFFF', borderLeftColor: '#FFD700' }}>
          <h3 className="font-semibold" style={{ color: '#212121' }}>Users</h3>
          <p className="text-sm" style={{ color: '#212121', opacity: 0.75 }}>Kelola akun admin/operator</p>
        </div>
        <div className="rounded p-4 shadow border-l-4" style={{ backgroundColor: '#FFFFFF', borderLeftColor: '#B71C1C' }}>
          <h3 className="font-semibold" style={{ color: '#212121' }}>Complaints</h3>
          <p className="text-sm" style={{ color: '#212121', opacity: 0.75 }}>Pantau & tanggapi keluhan</p>
        </div>
        <div className="rounded p-4 shadow border-l-4" style={{ backgroundColor: '#FFFFFF', borderLeftColor: '#1B5E20' }}>
          <h3 className="font-semibold" style={{ color: '#212121' }}>Towers</h3>
          <p className="text-sm" style={{ color: '#212121', opacity: 0.75 }}>Perbarui info tower</p>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;


