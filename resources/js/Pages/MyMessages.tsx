import React from 'react';
import { Head, usePage } from '@inertiajs/react';
import MainLayout from '@/Layouts/MainLayout';

type ReportItem = {
  id: number;
  tower_id: number;
  category: string;
  message: string;
  status: string;
  created_at: string;
  tower?: { id: number; site_name: string };
  responses?: Array<{ id: number; report_id: number; created_at: string }>;
};

export default function MyMessages({ reports = [] as ReportItem[] }) {
  const { auth } = usePage().props as any;

  return (
    <MainLayout title="Pesan Saya" currentPage="/my-messages">
      <Head title="Pesan Saya" />
      <div className="p-4 sm:p-6">
        <div className="rounded-lg shadow mb-6 px-4 sm:px-6 py-5" style={{ backgroundColor: '#FFF8E1' }}>
          <h1 className="text-xl sm:text-2xl font-bold" style={{ color: '#212121' }}>
            Pesan/Keluhan dari {auth?.user?.name}
          </h1>
          <p className="text-sm mt-1" style={{ color: '#212121', opacity: 0.85 }}>
            Lihat status penanganan, balasan, atau penutupan laporan Anda
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Waktu</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tower</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kategori</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Balasan</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {reports.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-6 text-center text-gray-500">Belum ada pesan</td>
                  </tr>
                )}
                {reports.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">{new Date(r.created_at).toLocaleString()}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{r.tower?.site_name ?? '-'}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">{r.category}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm">
                      <span className="px-2 py-1 rounded-full text-xs font-medium" style={{
                        backgroundColor:
                          r.status === 'pending' ? '#FEF3C7' :
                          r.status === 'in_progress' ? '#DBEAFE' :
                          r.status === 'responded' ? '#E0E7FF' :
                          r.status === 'resolved' ? '#D1FAE5' : '#F3F4F6',
                        color:
                          r.status === 'pending' ? '#92400E' :
                          r.status === 'in_progress' ? '#1E40AF' :
                          r.status === 'responded' ? '#3730A3' :
                          r.status === 'resolved' ? '#065F46' : '#374151'
                      }}>
                        {r.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">{r.responses?.length ?? 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}


