import React from 'react';

interface MessageItem {
  id: string;
  type: 'Keluhan' | 'Masukan';
  created_at: string;
  towerName: string;
  category: string;
  status: string | undefined | null;
  responsesCount: number;
  senderName: string;
  senderEmail: string;
  isAnonymous: boolean;
}

interface MessageCardProps {
  item: MessageItem;
  getStatusColor: (status: string | undefined | null) => { bg: string; text: string; label: string };
  formatDate: (dateString: string) => string;
  onOpen?: (item: MessageItem) => void;
}

export default function MessageCard({ item, getStatusColor, formatDate, onOpen }: MessageCardProps) {
  const statusConfig = getStatusColor(item.status);
  
  return (
    <div className="bg-white rounded-xl shadow-sm p-4 hover:shadow-md transition-shadow duration-150">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="font-semibold text-gray-900 text-sm">
              {item.senderName}
            </h3>
            {item.isAnonymous && (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">
                Guest
              </span>
            )}
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${item.type === 'Keluhan' ? 'bg-red-50 text-red-700' : 'bg-blue-50 text-blue-700'}`}>
              {item.type}
            </span>
          </div>
          <p className="text-xs text-gray-500 mb-1">{item.senderEmail}</p>
          <p className="text-xs text-gray-500 mb-1">
            <span className="font-medium">Tower:</span> {item.towerName ?? 'Tower tidak diketahui'}
          </p>
          <p className="text-xs text-gray-500">
            {formatDate(item.created_at)} • {new Date(item.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
        <span className="px-2 py-1 rounded-full text-xs font-medium ml-2" style={{
          backgroundColor: statusConfig.bg,
          color: statusConfig.text
        }}>
          {statusConfig.label}
        </span>
      </div>
      
      <div className="flex items-center justify-between">
        <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium">
          {item.category}
        </span>
        <div className="flex items-center gap-2">
          <div className="flex items-center text-xs text-gray-600">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            {item.responsesCount} balasan
          </div>
          <button
            className="px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-xs"
            onClick={() => onOpen && onOpen(item)}
          >
            Lihat
          </button>
        </div>
      </div>
    </div>
  );
}
