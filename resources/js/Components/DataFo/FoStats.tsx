import React from 'react';

interface FoPoint {
  id: number;
  name: string;
  type: string;
  status: string;
  area: string;
}

interface FoRoute {
  id: number;
  name: string;
  status: string;
  area: string;
}

interface FoStatsProps {
  filteredPoints: FoPoint[];
  filteredRoutes: FoRoute[];
  selectedArea: string;
}

export default function FoStats({ filteredPoints, filteredRoutes, selectedArea }: FoStatsProps) {
  const activePoints = filteredPoints.filter(point => point.status === 'active').length;
  const activeRoutes = filteredRoutes.filter(route => route.status === 'active').length;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
      <div className="bg-white rounded-lg shadow p-6 border-l-4" style={{ borderLeftColor: '#B71C1C' }}>
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-red-100 rounded-md flex items-center justify-center">
              <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
          </div>
          <div className="ml-4">
            <h3 className="text-lg font-medium" style={{ color: '#212121' }}>Total Titik FO</h3>
            <p className="text-3xl font-bold mt-1" style={{ color: '#B71C1C' }}>{filteredPoints.length}</p>
          </div>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow p-6 border-l-4" style={{ borderLeftColor: '#1B5E20' }}>
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-green-100 rounded-md flex items-center justify-center">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V7.618a1 1 0 01.553-.894L9 4l6 3 6-3 6 3v8.764a1 1 0 01-.553.894L21 20l-6-3-6 3z" />
              </svg>
            </div>
          </div>
          <div className="ml-4">
            <h3 className="text-lg font-medium" style={{ color: '#212121' }}>Total Jalur FO</h3>
            <p className="text-3xl font-bold mt-1" style={{ color: '#1B5E20' }}>{filteredRoutes.length}</p>
          </div>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow p-6 border-l-4" style={{ borderLeftColor: '#2563eb' }}>
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-blue-100 rounded-md flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
          </div>
          <div className="ml-4">
            <h3 className="text-lg font-medium" style={{ color: '#212121' }}>Area Aktif</h3>
            <p className="text-3xl font-bold mt-1" style={{ color: '#2563eb' }}>
              {selectedArea === 'ungaran' ? 'Ungaran' : 'Ambarawa'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}