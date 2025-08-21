import React from 'react';

interface FoPoint {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  area: string;
  description?: string;
  type: string;
  status: string;
  properties?: any;
}

interface FoRoute {
  id: number;
  name: string;
  area: string;
  description?: string;
  coordinates: Array<[number, number]>;
  status: string;
  color: string;
  total_distance?: number;
  properties?: any;
}

interface FoTableProps {
  filteredPoints: FoPoint[];
  filteredRoutes: FoRoute[];
  viewMode?: 'grid' | 'table';
  onPointClick?: (point: FoPoint) => void;
  onRouteClick?: (route: FoRoute) => void;
}

export default function FoTable({ 
  filteredPoints, 
  filteredRoutes, 
  viewMode = 'table',
  onPointClick,
  onRouteClick 
}: FoTableProps) {
  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { bg: 'bg-green-100', text: 'text-green-800', label: 'Aktif' },
      inactive: { bg: 'bg-red-100', text: 'text-red-800', label: 'Non-aktif' },
      maintenance: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Maintenance' }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.active;
    
    return (
      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
  };

  const getTypeBadge = (type: string) => {
    const typeConfig = {
      hub: { bg: 'bg-purple-100', text: 'text-purple-800', label: 'Hub' },
      junction: { bg: 'bg-green-100', text: 'text-green-800', label: 'Junction' },
      pole: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Pole' },
      endpoint: { bg: 'bg-red-100', text: 'text-red-800', label: 'Endpoint' }
    };
    
    const config = typeConfig[type as keyof typeof typeConfig] || typeConfig.hub;
    
    return (
      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
      {/* FO Points Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-lg font-medium" style={{ color: '#212121' }}>Titik-titik FO</h3>
          <p className="text-sm text-gray-600 mt-1">{filteredPoints.length} titik ditemukan</p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nama</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipe</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredPoints.length > 0 ? filteredPoints.map((point) => (
                <tr key={point.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-4">
                    <div>
                      <div className="text-sm font-medium" style={{ color: '#212121' }}>{point.name}</div>
                      <div className="text-xs text-gray-500 mt-1">{point.description}</div>
                      <div className="text-xs text-gray-400 mt-1">
                        {point.latitude.toFixed(6)}, {point.longitude.toFixed(6)}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    {getTypeBadge(point.type)}
                  </td>
                  <td className="px-4 py-4">
                    {getStatusBadge(point.status)}
                  </td>
                  <td className="px-4 py-4">
                    <button
                      onClick={() => onPointClick?.(point)}
                      className="text-white px-3 py-1 rounded text-xs font-medium hover:opacity-90 transition-opacity"
                      style={{ backgroundColor: '#B71C1C' }}
                    >
                      Detail
                    </button>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                    Tidak ada titik FO ditemukan
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* FO Routes Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-lg font-medium" style={{ color: '#212121' }}>Jalur-jalur FO</h3>
          <p className="text-sm text-gray-600 mt-1">{filteredRoutes.length} jalur ditemukan</p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nama</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Titik</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredRoutes.length > 0 ? filteredRoutes.map((route) => (
                <tr key={route.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-4">
                    <div>
                      <div className="text-sm font-medium" style={{ color: '#212121' }}>{route.name}</div>
                      <div className="text-xs text-gray-500 mt-1">{route.description}</div>
                      <div className="flex items-center mt-1">
                        <div 
                          className="w-3 h-3 rounded-full mr-2" 
                          style={{ backgroundColor: route.color }}
                        ></div>
                        <span className="text-xs text-gray-400">Warna jalur</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <span className="text-sm text-gray-900">{route.coordinates.length}</span>
                    <div className="text-xs text-gray-500">koordinat</div>
                  </td>
                  <td className="px-4 py-4">
                    {getStatusBadge(route.status)}
                  </td>
                  <td className="px-4 py-4">
                    <button
                      onClick={() => onRouteClick?.(route)}
                      className="text-white px-3 py-1 rounded text-xs font-medium hover:opacity-90 transition-opacity"
                      style={{ backgroundColor: '#B71C1C' }}
                    >
                      Detail
                    </button>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                    Tidak ada jalur FO ditemukan
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}