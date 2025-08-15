import React from 'react';

interface Tower {
  id: number;
  site_name: string;
  status?: string;
  owner?: string;
}

interface TowerStatsProps {
  total: number;
  towers: Tower[];
  mapMarkersCount: number;
  ownerFilter: string;
}

export default function TowerStats({ total, towers, mapMarkersCount, ownerFilter }: TowerStatsProps) {
  const activeCount = towers.filter(t => t.status === 'Aktif' || t.status === 'AKTIF').length;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
      <div className="bg-white rounded-lg shadow p-6 border-l-4" style={{ borderLeftColor: '#B71C1C' }}>
        <h3 className="text-lg font-medium" style={{ color: '#212121' }}>Total Tower</h3>
        <p className="text-5xl font-bold mt-2" style={{ color: '#B71C1C' }}>{total}</p>
      </div>
      
      <div className="bg-white rounded-lg shadow p-6 border-l-4" style={{ borderLeftColor: '#1B5E20' }}>
        <h3 className="text-lg font-medium" style={{ color: '#212121' }}>Tower Aktif</h3>
        <p className="text-5xl font-bold mt-2" style={{ color: '#1B5E20' }}>
          {activeCount}
        </p>
      </div>
      
      <div className="bg-white rounded-lg shadow p-6 border-l-4" style={{ borderLeftColor: '#2563eb' }}>
        <h3 className="text-lg font-medium" style={{ color: '#212121' }}>
          {ownerFilter === 'all' ? 'Tower di Peta' : `Tower ${ownerFilter}`}
        </h3>
        <p className="text-5xl font-bold mt-2" style={{ color: '#2563eb' }}>
          {mapMarkersCount}
        </p>
      </div>
    </div>
  );
}
