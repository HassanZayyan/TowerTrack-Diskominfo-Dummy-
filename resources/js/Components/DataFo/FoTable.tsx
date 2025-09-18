import React, { useState } from 'react';

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
  activeTab?: 'points' | 'routes' | 'overview';
  onPointClick?: (point: FoPoint) => void;
  onRouteClick?: (route: FoRoute) => void;
}

export default function FoTable({ 
  filteredPoints, 
  filteredRoutes, 
  viewMode = 'table',
  activeTab = 'overview',
  onPointClick,
  onRouteClick 
}: FoTableProps) {
  // Pagination state for points
  const [currentPointsPage, setCurrentPointsPage] = useState(1);
  const [pointsPerPage] = useState(10);
  
  // Pagination state for routes
  const [currentRoutesPage, setCurrentRoutesPage] = useState(1);
  const [routesPerPage] = useState(10);
  
  // Calculate pagination for points
  const indexOfLastPoint = currentPointsPage * pointsPerPage;
  const indexOfFirstPoint = indexOfLastPoint - pointsPerPage;
  const currentPoints = filteredPoints.slice(indexOfFirstPoint, indexOfLastPoint);
  const totalPointsPages = Math.ceil(filteredPoints.length / pointsPerPage);
  
  // Calculate pagination for routes
  const indexOfLastRoute = currentRoutesPage * routesPerPage;
  const indexOfFirstRoute = indexOfLastRoute - routesPerPage;
  const currentRoutes = filteredRoutes.slice(indexOfFirstRoute, indexOfLastRoute);
  const totalRoutesPages = Math.ceil(filteredRoutes.length / routesPerPage);
  
  // Pagination component
  const Pagination = ({ 
    currentPage, 
    totalPages, 
    onPageChange, 
    itemType 
  }: { 
    currentPage: number; 
    totalPages: number; 
    onPageChange: (page: number) => void;
    itemType: string;
  }) => {
    const getVisiblePages = () => {
      const delta = 2;
      const range = [];
      const rangeWithDots = [];
      
      for (let i = Math.max(2, currentPage - delta); i <= Math.min(totalPages - 1, currentPage + delta); i++) {
        range.push(i);
      }
      
      if (currentPage - delta > 2) {
        rangeWithDots.push(1, '...');
      } else {
        rangeWithDots.push(1);
      }
      
      rangeWithDots.push(...range);
      
      if (currentPage + delta < totalPages - 1) {
        rangeWithDots.push('...', totalPages);
      } else {
        rangeWithDots.push(totalPages);
      }
      
      return rangeWithDots;
    };
    
    if (totalPages <= 1) return null;
    
    return (
      <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
        <div className="flex-1 flex justify-between sm:hidden">
          <button
            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <button
            onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
        <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-gray-700">
              Menampilkan{' '}
              <span className="font-medium">{Math.min((currentPage - 1) * (itemType === 'points' ? pointsPerPage : routesPerPage) + 1, itemType === 'points' ? filteredPoints.length : filteredRoutes.length)}</span>
              {' '}sampai{' '}
              <span className="font-medium">{Math.min(currentPage * (itemType === 'points' ? pointsPerPage : routesPerPage), itemType === 'points' ? filteredPoints.length : filteredRoutes.length)}</span>
              {' '}dari{' '}
              <span className="font-medium">{itemType === 'points' ? filteredPoints.length : filteredRoutes.length}</span>
              {' '}{itemType === 'points' ? 'titik' : 'jalur'}
            </p>
          </div>
          <div>
            <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
              <button
                onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="sr-only">Previous</span>
                <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </button>
              {getVisiblePages().map((page, index) => (
                <button
                  key={index}
                  onClick={() => typeof page === 'number' ? onPageChange(page) : undefined}
                  disabled={typeof page !== 'number'}
                  className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                    page === currentPage
                      ? 'z-10 bg-red-50 border-red-500 text-red-600'
                      : typeof page === 'number'
                      ? 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                      : 'bg-white border-gray-300 text-gray-300 cursor-default'
                  }`}
                >
                  {page}
                </button>
              ))}
              <button
                onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="sr-only">Next</span>
                <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              </button>
            </nav>
          </div>
        </div>
      </div>
    );
  };
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

  // Render based on active tab
  if (activeTab === 'points') {
    return (
      <div className="bg-white rounded-lg shadow overflow-hidden flex flex-col h-[600px]">
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-lg font-medium" style={{ color: '#212121' }}>Titik-titik FO</h3>
          <p className="text-sm text-gray-600 mt-1">{filteredPoints.length} titik ditemukan</p>
        </div>
        <div className="overflow-x-auto flex-1 min-h-0">
          <table className="min-w-full divide-y divide-gray-200 h-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nama</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipe</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {currentPoints.length > 0 ? currentPoints.map((point) => (
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
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onPointClick?.(point);
                      }}
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
              {/* Fill remaining space if needed */}
              {currentPoints.length < pointsPerPage && Array.from({ length: pointsPerPage - currentPoints.length }).map((_, index) => (
                <tr key={`empty-${index}`} className="h-16">
                  <td colSpan={4} className="px-4 py-4">&nbsp;</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pagination 
          currentPage={currentPointsPage}
          totalPages={totalPointsPages}
          onPageChange={setCurrentPointsPage}
          itemType="points"
        />
      </div>
    );
  }

  if (activeTab === 'routes') {
    return (
      <div className="bg-white rounded-lg shadow overflow-hidden flex flex-col h-[600px]">
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-lg font-medium" style={{ color: '#212121' }}>Jalur-jalur FO</h3>
          <p className="text-sm text-gray-600 mt-1">{filteredRoutes.length} jalur ditemukan</p>
        </div>
        <div className="overflow-x-auto flex-1 min-h-0">
          <table className="min-w-full divide-y divide-gray-200 h-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nama</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Titik</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {currentRoutes.length > 0 ? currentRoutes.map((route) => (
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
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onRouteClick?.(route);
                      }}
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
              {/* Fill remaining space if needed */}
              {currentRoutes.length < routesPerPage && Array.from({ length: routesPerPage - currentRoutes.length }).map((_, index) => (
                <tr key={`empty-${index}`} className="h-16">
                  <td colSpan={4} className="px-4 py-4">&nbsp;</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pagination 
          currentPage={currentRoutesPage}
          totalPages={totalRoutesPages}
          onPageChange={setCurrentRoutesPage}
          itemType="routes"
        />
      </div>
    );
  }

  // Default overview mode - show both tables
  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
      {/* FO Points Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden flex flex-col h-[600px]">
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-lg font-medium" style={{ color: '#212121' }}>Titik-titik FO</h3>
          <p className="text-sm text-gray-600 mt-1">{filteredPoints.length} titik ditemukan</p>
        </div>
        <div className="overflow-x-auto flex-1 min-h-0">
          <table className="min-w-full divide-y divide-gray-200 h-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nama</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipe</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {currentPoints.length > 0 ? currentPoints.map((point) => (
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
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onPointClick?.(point);
                      }}
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
              {/* Fill remaining space if needed */}
              {currentPoints.length < pointsPerPage && Array.from({ length: pointsPerPage - currentPoints.length }).map((_, index) => (
                <tr key={`empty-${index}`} className="h-16">
                  <td colSpan={4} className="px-4 py-4">&nbsp;</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pagination 
          currentPage={currentPointsPage}
          totalPages={totalPointsPages}
          onPageChange={setCurrentPointsPage}
          itemType="points"
        />
      </div>

      {/* FO Routes Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden flex flex-col h-[600px]">
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-lg font-medium" style={{ color: '#212121' }}>Jalur-jalur FO</h3>
          <p className="text-sm text-gray-600 mt-1">{filteredRoutes.length} jalur ditemukan</p>
        </div>
        <div className="overflow-x-auto flex-1 min-h-0">
          <table className="min-w-full divide-y divide-gray-200 h-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nama</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Titik</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {currentRoutes.length > 0 ? currentRoutes.map((route) => (
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
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onRouteClick?.(route);
                      }}
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
              {/* Fill remaining space if needed */}
              {currentRoutes.length < routesPerPage && Array.from({ length: routesPerPage - currentRoutes.length }).map((_, index) => (
                <tr key={`empty-${index}`} className="h-16">
                  <td colSpan={4} className="px-4 py-4">&nbsp;</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pagination 
          currentPage={currentRoutesPage}
          totalPages={totalRoutesPages}
          onPageChange={setCurrentRoutesPage}
          itemType="routes"
        />
      </div>
    </div>
  );
}