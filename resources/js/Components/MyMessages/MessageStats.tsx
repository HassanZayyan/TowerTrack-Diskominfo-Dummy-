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
      gradient: 'from-red-500 to-red-600',
      bgGradient: 'from-red-50 to-red-100'
    },
    {
      label: 'Menunggu',
      value: items.filter(r => r.status === 'pending').length,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      gradient: 'from-amber-500 to-amber-600',
      bgGradient: 'from-amber-50 to-amber-100'
    },
    {
      label: 'Diproses',
      value: items.filter(r => r.status === 'in_progress').length,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
      gradient: 'from-sky-500 to-sky-600',
      bgGradient: 'from-sky-50 to-sky-100'
    },
    {
      label: 'Selesai',
      value: items.filter(r => r.status === 'resolved' || r.status === 'closed').length,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      gradient: 'from-green-500 to-green-600',
      bgGradient: 'from-green-50 to-green-100'
    }
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, index) => (
        <div 
          key={index} 
          className={`relative bg-gradient-to-br ${stat.bgGradient} rounded-xl p-5 shadow-md border border-gray-100 overflow-hidden transform transition-all duration-300 hover:scale-105 hover:shadow-xl`}
        >
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-3">
              <div className={`p-2.5 bg-gradient-to-br ${stat.gradient} rounded-lg shadow-sm`}>
                <div className="text-white">
                  {stat.icon}
                </div>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-gray-900">{stat.value}</div>
              </div>
            </div>
            <div className="text-sm font-semibold text-gray-700">{stat.label}</div>
          </div>
          
          {/* Decorative element */}
          <div className="absolute -bottom-2 -right-2 w-20 h-20 bg-white/30 rounded-full blur-xl"></div>
        </div>
      ))}
    </div>
  );
}
