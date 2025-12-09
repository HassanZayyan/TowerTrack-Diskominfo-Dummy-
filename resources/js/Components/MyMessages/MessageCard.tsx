import React from 'react';
import { router } from '@inertiajs/react';
import { formatDateWithTime } from '@/utils/dateHelpers';

interface MessageItem {
  id: string;
  type: 'Keluhan' | 'Masukan';
  created_at: string;
  towerName: string;
  locationType?: 'Tower' | 'Fiber Optik';
  category: string;
  status: string | undefined | null;
  responsesCount: number;
  commentsCount: number;
  senderName: string;
  senderEmail: string;
  isAnonymous: boolean;
}

interface MessageCardProps {
  item: MessageItem;
  getStatusColor: (status: string | undefined | null) => { bg: string; text: string; label: string };
  formatDate: (dateString: string) => string;
  onOpen?: (item: MessageItem) => void;
  hideEmail?: boolean; // Flag to hide email for privacy
}

export default function MessageCard({ item, getStatusColor, formatDate, onOpen, hideEmail = false }: MessageCardProps) {
  const statusConfig = getStatusColor(item.status);
  
  return (
    <div className="bg-white rounded-xl shadow-sm p-3 sm:p-4 hover:shadow-md transition-shadow duration-150">
      {/* Header Section - Mobile Optimized */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-3 space-y-2 sm:space-y-0">
        <div className="flex-1 min-w-0">
          {/* Name and Labels Row */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
            <h3 className="font-semibold text-gray-900 text-sm truncate">
              {item.senderName}
            </h3>
            <div className="flex flex-wrap items-center gap-1.5">
              {item.isAnonymous && (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600 whitespace-nowrap">
                  Guest
                </span>
              )}
              <span className={`px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${item.type === 'Keluhan' ? 'bg-red-50 text-red-700' : 'bg-teal-50 text-teal-700'}`}>
                {item.type}
              </span>
            </div>
          </div>
          
          {/* Contact and Location Info */}
          <div className="space-y-1">
            {!hideEmail && <p className="text-xs text-gray-500 truncate">{item.senderEmail}</p>}
            <p className="text-xs text-gray-500 truncate">
              <span className="font-medium">Type:</span>{' '}
              <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700">
                {item.locationType || 'Tower'}
              </span>
            </p>
            <p className="text-xs text-gray-500">
              {formatDateWithTime(item.created_at)}
            </p>
          </div>
        </div>
        
        {/* Status Badge - Mobile Positioned */}
        <div className="flex justify-end sm:justify-start">
          <span className="px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap" style={{
            backgroundColor: statusConfig.bg,
            color: statusConfig.text
          }}>
            {statusConfig.label}
          </span>
        </div>
      </div>
      
      {/* Bottom Section - Mobile Optimized */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        {/* Category Badge */}
        <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium self-start">
          {item.category}
        </span>
        
        {/* Actions Section */}
        <div className="flex items-center justify-between sm:justify-end gap-3">
          <div className="flex items-center gap-3">
            <div className="flex items-center text-xs text-gray-600">
              <svg className="w-4 h-4 mr-1 flex-shrink-0 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <span className="whitespace-nowrap">{item.commentsCount || 0} komentar</span>
            </div>
            <div className="flex items-center text-xs text-gray-600">
              <svg className="w-4 h-4 mr-1 flex-shrink-0 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
              </svg>
              <span className="whitespace-nowrap">{item.responsesCount || 0} balasan</span>
            </div>
          </div>
          <button
            className="px-3 py-1.5 bg-red-600 text-white rounded hover:bg-red-700 text-xs font-medium whitespace-nowrap touch-manipulation transition-colors"
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
        </div>
      </div>
    </div>
  );
}
