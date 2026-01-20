import React from 'react';
import { router } from '@inertiajs/react';
import { formatDateTimeSeparate } from '@/utils/dateHelpers';
import type { MessageItem } from '@/types/messages';

interface MessageTableProps {
  items: MessageItem[];
  getStatusColor: (status: string | undefined | null) => { bg: string; text: string; label: string };
  formatDate: (dateString: string) => string;
  onOpen?: (item: MessageItem) => void;
  hideEmail?: boolean; // Flag to hide email for privacy
}

export default function MessageTable({ items, getStatusColor, formatDate, onOpen, hideEmail = false }: MessageTableProps) {
  return (
    <div className="hidden lg:block bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Pengirim</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Info Pesan</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Kategori & Lokasi</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Interaksi</th>
              <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Aksi</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {items.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                  <div className="flex flex-col items-center">
                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                      <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                    </div>
                    <p className="text-gray-900 font-medium">Belum ada pesan</p>
                    <p className="text-gray-500 text-sm">Reset filter Anda untuk melihat lebih banyak.</p>
                  </div>
                </td>
              </tr>
            )}
            {items.map((item) => {
              const statusConfig = getStatusColor(item.status);
              return (
                <tr key={item.id} className="hover:bg-gray-50 transition-colors duration-150 group">
                  {/* Sender & Time */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className={`flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center text-sm font-bold ${item.type === 'Keluhan' ? 'bg-red-50 text-red-600' : 'bg-teal-50 text-teal-600'
                        }`}>
                        {item.senderName.charAt(0).toUpperCase()}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900 flex items-center gap-2">
                          {item.senderName}
                          {item.isAnonymous && <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-gray-100 text-gray-600">Guest</span>}
                        </div>
                        <div className="text-xs text-gray-500 mt-0.5">{formatDate(item.created_at)} &bull; {formatDateTimeSeparate(item.created_at).time}</div>
                        {!hideEmail && <div className="text-xs text-gray-400 mt-0.5">{item.senderEmail}</div>}
                      </div>
                    </div>
                  </td>

                  {/* Type */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${item.type === 'Keluhan' ? 'bg-red-50 text-red-700' : 'bg-teal-50 text-teal-700'
                      }`}>
                      {item.type}
                    </span>
                  </td>

                  {/* Category & Location */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col gap-1 items-start">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700">
                        {item.category}
                      </span>
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium text-gray-500">
                        <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        {item.locationType || 'Tower'}
                      </span>
                    </div>
                  </td>

                  {/* Status */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full" style={{
                      backgroundColor: statusConfig.bg,
                      color: statusConfig.text
                    }}>
                      {statusConfig.label}
                    </span>
                  </td>

                  {/* Stats */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1" title="Komentar">
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                        <span className="font-medium">{item.commentsCount || 0}</span>
                      </div>
                      <div className="flex items-center gap-1" title="Balasan">
                        <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                        </svg>
                        <span className="font-medium">{item.responsesCount || 0}</span>
                      </div>
                    </div>
                  </td>

                  {/* Action */}
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => {
                        if (onOpen) {
                          onOpen(item);
                        } else {
                          const [type, raw] = item.id.split('-');
                          const id = Number(raw);
                          if (type === 'report') {
                            router.visit(`/my-messages/reports/${id}`);
                          } else if (type === 'feedback') {
                            router.visit(`/my-messages/feedbacks/${id}`);
                          }
                        }
                      }}
                      className="text-gray-400 hover:text-red-600 transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
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
