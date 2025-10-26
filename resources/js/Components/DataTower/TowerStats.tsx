import React from 'react';
import StaggeredContainer from '@/Components/StaggeredContainer';

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
  totalActiveTowers: number; // Total active towers from backend
}

export default function TowerStats({ total, towers, mapMarkersCount, ownerFilter, totalActiveTowers }: TowerStatsProps) {
  // Use totalActiveTowers from backend instead of calculating from paginated towers
  const activeCount = totalActiveTowers;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
      <StaggeredContainer delay={100} animationType="fadeInUp" duration={600}>
        <div className="bg-white rounded-lg shadow p-6 border-l-4 transition-all duration-300 ease-in-out hover:shadow-xl hover:scale-105 hover:-translate-y-1 cursor-pointer" style={{ borderLeftColor: '#B71C1C' }}>
          <h3 className="text-lg font-medium transition-colors duration-300" style={{ color: '#212121' }}>Total Tower</h3>
          <p className="text-5xl font-bold mt-2 transition-all duration-300" style={{ color: '#B71C1C' }}>{total}</p>
        </div>
      </StaggeredContainer>
      
      <StaggeredContainer delay={200} animationType="fadeInUp" duration={600}>
        <div className="bg-white rounded-lg shadow p-6 border-l-4 transition-all duration-300 ease-in-out hover:shadow-xl hover:scale-105 hover:-translate-y-1 cursor-pointer" style={{ borderLeftColor: '#1B5E20' }}>
          <h3 className="text-lg font-medium transition-colors duration-300" style={{ color: '#212121' }}>Tower Aktif</h3>
          <p className="text-5xl font-bold mt-2 transition-all duration-300" style={{ color: '#1B5E20' }}>
            {activeCount}
          </p>
        </div>
      </StaggeredContainer>
      
      <StaggeredContainer delay={300} animationType="fadeInUp" duration={600}>
        <div className="bg-white rounded-lg shadow p-6 border-l-4 transition-all duration-300 ease-in-out hover:shadow-xl hover:scale-105 hover:-translate-y-1 cursor-pointer" style={{ borderLeftColor: '#2563eb' }}>
          <h3 className="text-lg font-medium transition-colors duration-300" style={{ color: '#212121' }}>
            {ownerFilter === 'all' ? 'Tower di Peta' : `Tower ${ownerFilter}`}
          </h3>
          <p className="text-5xl font-bold mt-2 transition-all duration-300" style={{ color: '#2563eb' }}>
            {mapMarkersCount}
          </p>
        </div>
      </StaggeredContainer>
    </div>
  );
}
