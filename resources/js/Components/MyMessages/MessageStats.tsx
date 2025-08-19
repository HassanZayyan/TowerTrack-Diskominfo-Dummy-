import React from 'react';

interface MessageItem {
  id: string;
  type: 'Keluhan' | 'Masukan';
  created_at: string;
  towerName: string;
  category: string;
  status: string | undefined | null;
  responsesCount: number;
}

interface MessageStatsProps {
  items: MessageItem[];
}

export default function MessageStats({ items }: MessageStatsProps) {
  if (items.length === 0) return null;

  return (
    <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
      <div className="bg-white rounded-lg p-3 text-center shadow-sm">
        <div className="text-2xl font-bold text-blue-600">{items.length}</div>
        <div className="text-xs text-gray-600">Total Laporan</div>
      </div>
      <div className="bg-white rounded-lg p-3 text-center shadow-sm">
        <div className="text-2xl font-bold text-yellow-600">
          {items.filter(r => r.status === 'pending').length}
        </div>
        <div className="text-xs text-gray-600">Menunggu</div>
      </div>
      <div className="bg-white rounded-lg p-3 text-center shadow-sm">
        <div className="text-2xl font-bold text-blue-600">
          {items.filter(r => r.status === 'in_progress').length}
        </div>
        <div className="text-xs text-gray-600">Diproses</div>
      </div>
      <div className="bg-white rounded-lg p-3 text-center shadow-sm">
        <div className="text-2xl font-bold text-green-600">
          {items.filter(r => r.status === 'resolved').length}
        </div>
        <div className="text-xs text-gray-600">Selesai</div>
      </div>
    </div>
  );
}
