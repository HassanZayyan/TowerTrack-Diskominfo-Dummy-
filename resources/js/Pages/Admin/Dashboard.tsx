import React from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Head } from '@inertiajs/react';

const AdminDashboard: React.FC = () => {
  // Sample data - in real app, this would come from props or API
  const stats = {
    totalTowers: 1250,
    totalComplaints: 89,
    pendingComplaints: 23,
    resolvedComplaints: 66,
    totalUsers: 45,
    activeUsers: 38
  };

  const recentComplaints = [
    { id: 1, title: 'Tower tidak berfungsi', location: 'Jl. Sudirman No. 45', status: 'pending', date: '2025-08-12' },
    { id: 2, title: 'Sinyal lemah di area perumahan', location: 'Perumahan Griya Asri', status: 'in-progress', date: '2025-08-11' },
    { id: 3, title: 'Tower mengganggu pemandangan', location: 'Jl. Merdeka Raya', status: 'resolved', date: '2025-08-10' },
    { id: 4, title: 'Kerusakan peralatan tower', location: 'Jl. Diponegoro 123', status: 'pending', date: '2025-08-09' },
    { id: 5, title: 'Gangguan jaringan', location: 'Kampung Melayu', status: 'resolved', date: '2025-08-08' },
  ];

  const recentTowerUpdates = [
    { id: 1, name: 'Tower Sudirman-01', action: 'Status updated', date: '2025-08-12 14:30' },
    { id: 2, name: 'Tower Gatot Subroto-03', action: 'Location verified', date: '2025-08-12 10:15' },
    { id: 3, name: 'Tower Thamrin-02', action: 'New tower added', date: '2025-08-11 16:45' },
    { id: 4, name: 'Tower Kuningan-05', action: 'Information updated', date: '2025-08-11 09:20' },
  ];

  return (
    <AdminLayout title="Admin Dashboard">
      <Head title="Admin Dashboard" />
      
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Selamat Datang di Dashboard Admin</h1>
        <p className="text-gray-600">Kelola sistem tagging tower dan pantau aktivitas secara real-time</p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        <div className="col-span-2 bg-white rounded-lg p-6 shadow-lg border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-800">Total Towers</h3>
              <p className="text-3xl font-bold text-blue-600">{stats.totalTowers.toLocaleString()}</p>
              <p className="text-sm text-gray-500">Menara telekomunikasi terdaftar</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-full">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
          </div>
        </div>

        <div className="col-span-2 bg-white rounded-lg p-6 shadow-lg border-l-4 border-red-500">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-800">Total Keluhan</h3>
              <p className="text-3xl font-bold text-red-600">{stats.totalComplaints}</p>
              <p className="text-sm text-gray-500">Keluhan yang masuk</p>
            </div>
            <div className="bg-red-100 p-3 rounded-full">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="col-span-2 bg-white rounded-lg p-6 shadow-lg border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-800">Pengguna Aktif</h3>
              <p className="text-3xl font-bold text-green-600">{stats.activeUsers}</p>
              <p className="text-sm text-gray-500">dari {stats.totalUsers} total pengguna</p>
            </div>
            <div className="bg-green-100 p-3 rounded-full">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Complaint Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-lg p-6 shadow-lg">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Status Keluhan</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-yellow-600 font-medium">Pending</span>
              <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-semibold">
                {stats.pendingComplaints}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-blue-600 font-medium">In Progress</span>
              <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-semibold">
                {stats.totalComplaints - stats.pendingComplaints - stats.resolvedComplaints}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-green-600 font-medium">Resolved</span>
              <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-semibold">
                {stats.resolvedComplaints}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-lg">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Tingkat Penyelesaian</h3>
          <div className="text-center">
            <div className="text-4xl font-bold text-green-600 mb-2">
              {Math.round((stats.resolvedComplaints / stats.totalComplaints) * 100)}%
            </div>
            <p className="text-gray-600">Keluhan terselesaikan</p>
            <div className="mt-4 bg-gray-200 rounded-full h-3">
              <div 
                className="bg-green-500 h-3 rounded-full transition-all duration-300"
                style={{ width: `${(stats.resolvedComplaints / stats.totalComplaints) * 100}%` }}
              ></div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-lg">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Aktivitas Hari Ini</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Keluhan Baru</span>
              <span className="font-semibold text-blue-600">5</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Keluhan Ditanggapi</span>
              <span className="font-semibold text-green-600">8</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Tower Diperbarui</span>
              <span className="font-semibold text-purple-600">12</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Complaints */}
        <div className="bg-white rounded-lg shadow-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800">Keluhan Terbaru</h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {recentComplaints.map((complaint) => (
                <div key={complaint.id} className="flex items-start space-x-4 p-3 hover:bg-gray-50 rounded-lg transition-colors">
                  <div className="flex-shrink-0">
                    <div className={`w-3 h-3 rounded-full ${
                      complaint.status === 'pending' ? 'bg-yellow-400' :
                      complaint.status === 'in-progress' ? 'bg-blue-400' : 'bg-green-400'
                    }`}></div>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-800">{complaint.title}</h4>
                    <p className="text-sm text-gray-600">{complaint.location}</p>
                    <p className="text-xs text-gray-500">{complaint.date}</p>
                  </div>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    complaint.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    complaint.status === 'in-progress' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                  }`}>
                    {complaint.status === 'pending' ? 'Pending' :
                     complaint.status === 'in-progress' ? 'Progress' : 'Selesai'}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-gray-200">
              <button className="text-blue-600 hover:text-blue-800 font-medium text-sm">
                Lihat Semua Keluhan →
              </button>
            </div>
          </div>
        </div>

        {/* Recent Tower Updates */}
        <div className="bg-white rounded-lg shadow-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800">Aktivitas Tower Terbaru</h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {recentTowerUpdates.map((update) => (
                <div key={update.id} className="flex items-start space-x-4 p-3 hover:bg-gray-50 rounded-lg transition-colors">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </div>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-800">{update.name}</h4>
                    <p className="text-sm text-gray-600">{update.action}</p>
                    <p className="text-xs text-gray-500">{update.date}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-gray-200">
              <button className="text-blue-600 hover:text-blue-800 font-medium text-sm">
                Lihat Semua Aktivitas →
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-8 bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Aksi Cepat</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <button className="bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-lg transition-colors flex items-center space-x-3">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <span>Tambah Tower</span>
          </button>
          <button className="bg-green-600 hover:bg-green-700 text-white p-4 rounded-lg transition-colors flex items-center space-x-3">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Verifikasi Data</span>
          </button>
          <button className="bg-purple-600 hover:bg-purple-700 text-white p-4 rounded-lg transition-colors flex items-center space-x-3">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <span>Lihat Laporan</span>
          </button>
          <button className="bg-orange-600 hover:bg-orange-700 text-white p-4 rounded-lg transition-colors flex items-center space-x-3">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
            </svg>
            <span>Kelola Pengguna</span>
          </button>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;


