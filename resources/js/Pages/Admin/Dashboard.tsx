import React from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Head, usePage, Link } from '@inertiajs/react';

type Stats = {
  totalTowers: number;
  totalReports: number;
  totalUsers: number;
  weeklyReports: number;
  reportsGrowth: number;
  pendingCount: number;
  inProgressCount: number;
  closedCount: number;
  feedbackPendingCount: number;
  feedbackInProgressCount: number;
  feedbackClosedCount: number;
};

type RecentReport = {
  id: number;
  title: string;
  status: string; // slug
  created_at: string;
  tower_name: string;
  description: string;
};

type CategoryDatum = { category: string; count: number };
type TowerStatusDatum = { status: string; count: number };

// Lightweight horizontal bar "chart" without extra deps
const HorizontalBars: React.FC<{ title?: string; data: { label: string; value: number }[] }> = ({ data }) => {
  const maxValue = Math.max(1, ...data.map((d) => d.value));
  return (
    <div className="space-y-3">
      {data.length === 0 && (
        <div className="text-sm text-gray-500">Tidak ada data.</div>
      )}
      {data.map((d, idx) => (
        <div key={idx}>
          <div className="flex justify-between text-sm text-gray-700 mb-1">
            <span className="truncate pr-2" title={d.label}>{d.label}</span>
            <span className="text-gray-500">{d.value}</span>
          </div>
          <div className="h-3 bg-gray-100 rounded">
            <div
              className="h-3 rounded bg-blue-500"
              style={{ width: `${(d.value / maxValue) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
};

const AdminDashboard: React.FC = () => {
  const page = usePage();
  const { auth, stats: serverStats, recentReports: serverRecentReports, recentFeedbacks: serverRecentFeedbacks, activityToday } = page.props as any;
  const user = auth?.user;

  const stats: Stats = serverStats || {
    totalTowers: 0,
    totalReports: 0,
    totalUsers: 0,
    weeklyReports: 0,
    reportsGrowth: 0,
    pendingCount: 0,
    inProgressCount: 0,
    closedCount: 0,
  };

  const recentComplaints: RecentReport[] = serverRecentReports || [];
  const recentFeedbacks: RecentReport[] = serverRecentFeedbacks || [];

  const reportsByCategory: CategoryDatum[] = (page.props as any)?.reportsByCategory || [];
  const towersByStatus: TowerStatusDatum[] = (page.props as any)?.towersByStatus || [];

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
              <p className="text-3xl font-bold text-red-600">{stats.totalReports}</p>
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
              <h3 className="text-lg font-semibold text-gray-800">Total Masukan</h3>
              <p className="text-3xl font-bold text-green-600">{(stats.feedbackPendingCount + stats.feedbackInProgressCount + stats.feedbackClosedCount).toLocaleString()}</p>
              <p className="text-sm text-gray-500">Masukan dari pengguna</p>
            </div>
            <div className="bg-green-100 p-3 rounded-full">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
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
                {stats.pendingCount}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-blue-600 font-medium">In Progress</span>
              <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-semibold">
                {stats.inProgressCount}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-green-600 font-medium">Resolved</span>
              <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-semibold">
                {stats.closedCount}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-lg">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Status Masukan</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-yellow-600 font-medium">Pending</span>
              <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-semibold">
                {stats.feedbackPendingCount}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-blue-600 font-medium">In Progress</span>
              <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-semibold">
                {stats.feedbackInProgressCount}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-green-600 font-medium">Resolved</span>
              <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-semibold">
                {stats.feedbackClosedCount}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-lg">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Aktivitas Hari Ini</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Keluhan Baru</span>
              <span className="font-semibold text-blue-600">{(page.props as any)?.activityToday?.newReports ?? 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Keluhan Ditanggapi</span>
              <span className="font-semibold text-green-600">{(page.props as any)?.activityToday?.respondedReports ?? 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Tower Diperbarui</span>
              <span className="font-semibold text-purple-600">{(page.props as any)?.activityToday?.updatedTowers ?? 0}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Charts & Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
        <div className="bg-white rounded-lg p-6 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Keluhan per Kategori</h3>
            <span className="text-xs text-gray-500">Top {Math.min(6, reportsByCategory.length)}</span>
          </div>
          <HorizontalBars
            data={(reportsByCategory || [])
              .map((d: any) => ({ label: d.category || 'Lainnya', value: d.count }))
              .sort((a: any, b: any) => b.value - a.value)
              .slice(0, 6)}
          />
        </div>

        <div className="bg-white rounded-lg p-6 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Status Perizinan Menara</h3>
          </div>
          <HorizontalBars
            data={(towersByStatus || [])
              .map((d: any) => ({ label: d.status || 'Tidak diketahui', value: d.count }))
              .sort((a: any, b: any) => b.value - a.value)}
          />
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
              {recentComplaints.slice(0, 3).map((complaint) => (
                <div key={complaint.id} className="flex items-start space-x-4 p-3 hover:bg-gray-50 rounded-lg transition-colors">
                  <div className="flex-shrink-0">
                    <div className={`w-3 h-3 rounded-full ${
                      complaint.status === 'pending' ? 'bg-yellow-400' :
                      complaint.status === 'in_progress' ? 'bg-blue-400' : 'bg-green-400'
                    }`}></div>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-800">{complaint.title}</h4>
                    <p className="text-sm text-gray-600">{complaint.tower_name}</p>
                    <p className="text-xs text-gray-500">{complaint.created_at}</p>
                  </div>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    complaint.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    complaint.status === 'in_progress' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                  }`}>
                    {complaint.status === 'pending' ? 'Pending' :
                     complaint.status === 'in_progress' ? 'Progress' : 'Selesai'}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-gray-200">
              <Link href="/admin/messages?tab=complaints" className="text-blue-600 hover:text-blue-800 font-medium text-sm">Lihat Semua Keluhan →</Link>
            </div>
          </div>
        </div>

        {/* Recent Feedbacks */}
        <div className="bg-white rounded-lg shadow-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800">Masukan Terbaru</h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {recentFeedbacks.slice(0, 3).map((fb) => (
                <div key={fb.id} className="flex items-start space-x-4 p-3 hover:bg-gray-50 rounded-lg transition-colors">
                  <div className="flex-shrink-0">
                    <div className={`w-3 h-3 rounded-full ${
                      fb.status === 'pending' ? 'bg-yellow-400' :
                      fb.status === 'in_progress' ? 'bg-blue-400' : 'bg-green-400'
                    }`}></div>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-800">{fb.title}</h4>
                    <p className="text-sm text-gray-600">{fb.tower_name}</p>
                    <p className="text-xs text-gray-500">{fb.created_at}</p>
                  </div>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    fb.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    fb.status === 'in_progress' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                  }`}>
                    {fb.status === 'pending' ? 'Pending' :
                     fb.status === 'in_progress' ? 'Progress' : 'Selesai'}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-gray-200">
              <Link href="/admin/messages?tab=feedbacks" className="text-blue-600 hover:text-blue-800 font-medium text-sm">Lihat Semua Masukan →</Link>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;


