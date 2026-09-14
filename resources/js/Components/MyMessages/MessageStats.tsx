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

  const stats = [
    {
      label: 'Total Pesan',
      value: items.length,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
        </svg>
      ),
      color: 'text-muted-foreground',
      bgColor: 'bg-muted',
      borderColor: 'border-border'
    },
    {
      label: 'Menunggu',
      value: items.filter(r => r.status === 'pending').length,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      color: 'text-warning-strong',
      bgColor: 'bg-warning-soft',
      borderColor: 'border-warning-border'
    },
    {
      label: 'Diproses',
      value: items.filter(r => r.status === 'in_progress').length,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
      color: 'text-info-strong',
      bgColor: 'bg-info-soft',
      borderColor: 'border-info-border'
    },
    {
      label: 'Selesai',
      value: items.filter(r => r.status === 'closed').length,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      color: 'text-success-strong',
      bgColor: 'bg-success-soft',
      borderColor: 'border-success-border'
    }
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, index) => (
        <div
          key={index}
          className={`bg-card rounded-lg p-5 shadow-xs border ${stat.borderColor} transition-colors group`}
        >
          <div className="flex items-center justify-between mb-3">
            <div className={`p-2.5 rounded-lg ${stat.bgColor} group-hover:bg-opacity-80 transition-colors`}>
              <div className={stat.color}>
                {stat.icon}
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-foreground group-hover:text-foreground transition-colors">{stat.value}</div>
            </div>
          </div>
          <div className="text-sm font-semibold text-muted-foreground group-hover:text-foreground transition-colors">{stat.label}</div>
        </div>
      ))}
    </div>
  );
}
