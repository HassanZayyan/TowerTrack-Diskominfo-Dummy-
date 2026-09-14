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
    <div className="bg-white rounded-xl shadow-sm border border-border p-4 hover:shadow-lg transition-colors duration-200 group">
      {/* Header: User & Status */}
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${item.type === 'Keluhan' ? 'bg-destructive-soft text-destructive-strong' : 'bg-muted text-neutral-strong'
            }`}>
            {item.senderName.charAt(0).toUpperCase()}
          </div>
          <div>
            <h3 className="font-semibold text-foreground leading-tight">{item.senderName}</h3>
            <p className="text-xs text-muted-foreground mt-0.5">{formatDateWithTime(item.created_at)}</p>
          </div>
        </div>

        {/* Status Badge */}
        <span className="px-2.5 py-1 rounded-full text-xs font-semibold" style={{
          backgroundColor: statusConfig.bg,
          color: statusConfig.text
        }}>
          {statusConfig.label}
        </span>
      </div>

      {/* Content Meta Tags */}
      <div className="flex flex-wrap gap-2 mb-4">
        <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${item.type === 'Keluhan' ? 'bg-destructive-soft text-destructive-strong' : 'bg-muted text-neutral-strong'
          }`}>
          {item.type}
        </span>
        <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-muted text-muted-foreground">
          <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          {item.locationType || 'Tower'}
        </span>
        <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-muted text-neutral-strong">
          {item.category}
        </span>
      </div>

      {!hideEmail && (
        <div className="mb-3">
          <p className="text-xs text-placeholder flex items-center">
            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            {item.senderEmail}
          </p>
        </div>
      )}

      {/* Footer: Stats & Action */}
      <div className="flex items-center justify-between pt-3 border-t border-border">
        <div className="flex items-center gap-4 text-muted-foreground text-xs">
          <div className="flex items-center hover:text-foreground transition-colors">
            <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <span className="font-medium">{item.commentsCount || 0}</span>
          </div>
          <div className="flex items-center hover:text-neutral-strong transition-colors">
            <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
            </svg>
            <span className="font-medium">{item.responsesCount || 0}</span>
          </div>
        </div>

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
          className="text-xs font-semibold text-foreground hover:text-destructive-strong flex items-center transition-colors"
        >
          Lihat Detail
          <svg className="w-3 h-3 ml-1 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
}
