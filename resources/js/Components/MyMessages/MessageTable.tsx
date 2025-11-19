import React from 'react';
import { router } from '@inertiajs/react';

interface MessageItem {
  id: string;
  type: 'Keluhan' | 'Masukan';
  created_at: string;
  towerName: string;
  category: string;
  status: string | undefined | null;
  responsesCount: number;
  commentsCount: number;
  senderName: string;
  senderEmail: string;
  isAnonymous: boolean;
}

interface MessageTableProps {
  items: MessageItem[];
  getStatusColor: (status: string | undefined | null) => { bg: string; text: string; label: string };
  formatDate: (dateString: string) => string;
  onOpen?: (item: MessageItem) => void;
  hideEmail?: boolean; // Flag to hide email for privacy
}

export default function MessageTable({ items, getStatusColor, formatDate, onOpen, hideEmail = false }: MessageTableProps) {
  return (
    <div className="hidden lg:block bg-white rounded-xl shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Waktu</th>
              <th className="px-4 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Pengirim</th>
              <th className="px-4 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Jenis</th>
              <th className="px-4 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Tower</th>
              <th className="px-4 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Kategori</th>
              <th className="px-4 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
              <th className="px-4 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Komentar</th>
              <th className="px-4 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Balasan</th>
              <th className="px-4 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Aksi</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {items.length === 0 && (
              <tr>
                <td colSpan={9} className="px-4 py-12 text-center text-gray-500">
                  <div className="flex flex-col items-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                    </div>
                    <p className="text-gray-500 font-medium">Belum ada pesan</p>
                    <p className="text-gray-400 text-sm mt-1">Anda belum mengirimkan laporan apapun</p>
                  </div>
                </td>
              </tr>
            )}
            {items.map((item) => {
              const statusConfig = getStatusColor(item.status);
              return (
                <tr key={item.id} className="hover:bg-gray-50 transition-colors duration-150">
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">
                    <div>
                      <div className="font-medium">{formatDate(item.created_at)}</div>
                      <div className="text-xs text-gray-500">{new Date(item.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</div>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-sm">
                    <div className="max-w-xs">
                      <div className="flex items-center gap-1">
                        <span className="font-medium text-gray-900 truncate">{item.senderName}</span>
                        {item.isAnonymous && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">
                            Guest
                          </span>
                        )}
                      </div>
                      {!hideEmail && <div className="text-xs text-gray-500 truncate">{item.senderEmail}</div>}
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${item.type === 'Keluhan' ? 'bg-red-50 text-red-700' : 'bg-teal-50 text-teal-700'}`}>{item.type}</span>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                    <div>{item.towerName}</div>
                    {/* alamat akan ditampilkan di modal detail; tabel ringkas tetap nama */}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">
                    <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium">
                      {item.category}
                    </span>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <span className="px-3 py-1 rounded-full text-xs font-medium" style={{
                      backgroundColor: statusConfig.bg,
                      color: statusConfig.text
                    }}>
                      {statusConfig.label}
                    </span>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">
                    <div className="flex items-center gap-1">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                      <span className="font-medium">{item.commentsCount || 0}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">
                    <div className="flex items-center gap-1">
                      <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                      </svg>
                      <span className="font-medium">{item.responsesCount || 0}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm">
                    <button
                      className="px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                      onClick={() => {
                        if (onOpen) {
                          onOpen(item);
                        } else {
                          // Fallback to public routes if onOpen not provided
                          const [type, raw] = item.id.split('-');
                          const id = Number(raw);
                          if (type === 'report') {
                            router.visit(`/my-messages/reports/${id}`);
                          } else if (type === 'feedback') {
                            router.visit(`/my-messages/feedbacks/${id}`);
                          }
                        }
                      }}
                    >
                      Lihat
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
