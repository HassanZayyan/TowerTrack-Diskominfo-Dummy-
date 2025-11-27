import React, { useState } from 'react';
import FOStatusBadge from '@/Components/DataFo/FOStatusBadge';
import { getTypeBadgeConfig } from '@/utils/foConstants';

interface FoPoint {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  area: string;
  description?: string;
  type: string;
  status: string;
  side_of_road?: 'left' | 'right' | 'unknown' | null;
  properties?: any;
}

interface FoRoute {
  id: number;
  name: string;
  area: string;
  description?: string;
  coordinates?: Array<[number, number]>; // Optional - loaded on-demand
  status: string;
  color: string;
  total_distance?: number;
  total_points?: number;
  routing_service?: string | null;
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
  const getTypeBadge = (type: string) => {
    const config = getTypeBadgeConfig(type);
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
        <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden relative overscroll-contain">
          <div className="overflow-x-auto">
            <table className="w-full divide-y divide-gray-200 table-fixed">
              <thead className="bg-gray-50 sticky top-0 z-20 shadow-sm">
                <tr>
                  <th className="px-2 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-2/5">Nama</th>
                  <th className="hidden md:table-cell px-2 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">Tipe</th>
                  <th className="px-2 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">Sisi</th>
                  <th className="hidden md:table-cell px-2 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[120px] w-[120px]">Status</th>
                  <th className="px-2 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[80px] w-[80px]">Aksi</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200 relative z-10">
                {currentPoints.length > 0 ? currentPoints.map((point) => (
                  <tr key={point.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-2 sm:px-4 py-3 max-w-0">
                      <div className="min-w-0">
                        <div className="text-xs sm:text-sm font-medium truncate" style={{ color: '#212121' }} title={point.name}>{point.name}</div>
                        <div className="text-xs text-gray-500 mt-1 truncate" title={point.description}>{point.description}</div>
                        <div className="text-xs text-gray-400 mt-1 truncate">
                          {point.latitude.toFixed(4)}, {point.longitude.toFixed(4)}
                        </div>
                      </div>
                    </td>
                    <td className="hidden md:table-cell px-2 sm:px-4 py-3">
                      <div className="flex justify-center sm:justify-start">
                        {getTypeBadge(point.type)}
                      </div>
                    </td>
                    <td className="px-2 sm:px-4 py-3">
                      <div className="flex justify-center sm:justify-start">
                        {(() => {
                          const side = point.side_of_road || 'unknown';
                          if (side === 'left') {
                            return (
                              <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                                <span className="mr-1">⬅️</span> Kiri
                              </span>
                            );
                          } else if (side === 'right') {
                            return (
                              <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                                <span className="mr-1">➡️</span> Kanan
                              </span>
                            );
                          } else {
                            return (
                              <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-600">
                                <span className="mr-1">❓</span> -
                              </span>
                            );
                          }
                        })()}
                      </div>
                    </td>
                    <td className="hidden md:table-cell px-2 sm:px-4 py-3">
                      <div className="flex justify-center sm:justify-start">
                        <FOStatusBadge status={point.status} className="flex-shrink-0" />
                      </div>
                    </td>
                    <td className="px-2 sm:px-4 py-3">
                      <div className="flex justify-center sm:justify-start">
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            onPointClick?.(point);
                          }}
                          className="text-white px-2 sm:px-3 py-1 rounded text-xs font-medium hover:opacity-90 transition-opacity touch-manipulation whitespace-nowrap flex-shrink-0"
                          style={{ backgroundColor: '#B71C1C' }}
                        >
                          Detail
                        </button>
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                      Tidak ada titik FO ditemukan
                    </td>
                  </tr>
                )}
                {/* Fill remaining space if needed */}
                {currentPoints.length < pointsPerPage && Array.from({ length: pointsPerPage - currentPoints.length }).map((_, index) => (
                  <tr key={`empty-${index}`} className="h-16">
                    <td colSpan={5} className="px-4 py-4">&nbsp;</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
        <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden relative overscroll-contain">
          <table className="w-full divide-y divide-gray-200 table-fixed">
              <thead className="bg-gray-50 sticky top-0 z-20 shadow-sm">
                <tr>
                  <th className="px-2 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-2/5 sm:w-2/5">Nama</th>
                  <th className="px-1 sm:px-4 py-3 text-center sm:text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/5 sm:w-1/5">Titik</th>
                  <th className="px-1 sm:px-4 py-3 text-center sm:text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[120px] w-[120px]">Status</th>
                  <th className="px-1 sm:px-4 py-3 text-center sm:text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[80px] w-[80px]">Aksi</th>
                </tr>
              </thead>
            <tbody className="bg-white divide-y divide-gray-200 relative z-10">
              {currentRoutes.length > 0 ? currentRoutes.map((route) => (
                <tr key={route.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-2 sm:px-4 py-3">
                    <div className="min-w-0">
                      <div className="text-xs sm:text-sm font-medium truncate" style={{ color: '#212121' }} title={route.name}>{route.name}</div>
                      <div className="text-xs text-gray-500 mt-1 truncate" title={route.description}>{route.description}</div>
                      <div className="flex items-center mt-1">
                        <div 
                          className="w-1.5 h-1.5 sm:w-3 sm:h-3 rounded-full mr-1 sm:mr-2 flex-shrink-0" 
                          style={{ backgroundColor: route.color }}
                        ></div>
                        <span className="text-xs text-gray-400 truncate">Warna jalur</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-1 sm:px-4 py-3">
                    <div className="text-center sm:text-left">
                      <span className="text-xs sm:text-sm text-gray-900 font-medium">{route.total_points || 0}</span>
                      <div className="text-xs text-gray-500">titik</div>
                    </div>
                  </td>
                  <td className="px-1 sm:px-4 py-3">
                    <div className="flex justify-center sm:justify-start">
                      <FOStatusBadge status={route.status} className="flex-shrink-0" />
                    </div>
                  </td>
                  <td className="px-1 sm:px-4 py-3">
                    <div className="flex justify-center sm:justify-start">
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          onRouteClick?.(route);
                        }}
                        className="text-white px-2 sm:px-3 py-1 rounded text-xs font-medium hover:opacity-90 transition-opacity touch-manipulation whitespace-nowrap flex-shrink-0"
                        style={{ backgroundColor: '#B71C1C' }}
                      >
                        Detail
                      </button>
                    </div>
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
                  <td colSpan={5} className="px-4 py-4">&nbsp;</td>
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
        <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden relative overscroll-contain">
          <div className="overflow-x-auto">
            <table className="w-full divide-y divide-gray-200 table-fixed">
              <thead className="bg-gray-50 sticky top-0 z-20 shadow-sm">
                <tr>
                  <th className="px-2 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-2/5">Nama</th>
                  <th className="hidden md:table-cell px-2 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">Tipe</th>
                  <th className="px-2 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">Sisi</th>
                  <th className="hidden md:table-cell px-2 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[120px] w-[120px]">Status</th>
                  <th className="px-2 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[80px] w-[80px]">Aksi</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200 relative z-10">
                {currentPoints.length > 0 ? currentPoints.map((point) => (
                  <tr key={point.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-2 sm:px-4 py-3 max-w-0">
                      <div className="min-w-0">
                        <div className="text-xs sm:text-sm font-medium truncate" style={{ color: '#212121' }} title={point.name}>{point.name}</div>
                        <div className="text-xs text-gray-500 mt-1 truncate" title={point.description}>{point.description}</div>
                        <div className="text-xs text-gray-400 mt-1 truncate">
                          {point.latitude.toFixed(4)}, {point.longitude.toFixed(4)}
                        </div>
                      </div>
                    </td>
                    <td className="hidden md:table-cell px-2 sm:px-4 py-3">
                      <div className="flex justify-center sm:justify-start">
                        {getTypeBadge(point.type)}
                      </div>
                    </td>
                    <td className="px-2 sm:px-4 py-3">
                      <div className="flex justify-center sm:justify-start">
                        {(() => {
                          const side = point.side_of_road || 'unknown';
                          if (side === 'left') {
                            return (
                              <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                                <span className="mr-1">⬅️</span> Kiri
                              </span>
                            );
                          } else if (side === 'right') {
                            return (
                              <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                                <span className="mr-1">➡️</span> Kanan
                              </span>
                            );
                          } else {
                            return (
                              <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-600">
                                <span className="mr-1">❓</span> -
                              </span>
                            );
                          }
                        })()}
                      </div>
                    </td>
                    <td className="hidden md:table-cell px-2 sm:px-4 py-3">
                      <div className="flex justify-center sm:justify-start">
                        <FOStatusBadge status={point.status} className="flex-shrink-0" />
                      </div>
                    </td>
                    <td className="px-2 sm:px-4 py-3">
                      <div className="flex justify-center sm:justify-start">
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            onPointClick?.(point);
                          }}
                          className="text-white px-2 sm:px-3 py-1 rounded text-xs font-medium hover:opacity-90 transition-opacity touch-manipulation whitespace-nowrap flex-shrink-0"
                          style={{ backgroundColor: '#B71C1C' }}
                        >
                          Detail
                        </button>
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                      Tidak ada titik FO ditemukan
                    </td>
                  </tr>
                )}
                {/* Fill remaining space if needed */}
                {currentPoints.length < pointsPerPage && Array.from({ length: pointsPerPage - currentPoints.length }).map((_, index) => (
                  <tr key={`empty-${index}`} className="h-16">
                    <td colSpan={5} className="px-4 py-4">&nbsp;</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
        <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden relative overscroll-contain">
          <table className="w-full divide-y divide-gray-200 table-fixed">
              <thead className="bg-gray-50 sticky top-0 z-20 shadow-sm">
                <tr>
                  <th className="px-2 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-2/5 sm:w-2/5">Nama</th>
                  <th className="px-1 sm:px-4 py-3 text-center sm:text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/5 sm:w-1/5">Titik</th>
                  <th className="px-1 sm:px-4 py-3 text-center sm:text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[120px] w-[120px]">Status</th>
                  <th className="px-1 sm:px-4 py-3 text-center sm:text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[80px] w-[80px]">Aksi</th>
                </tr>
              </thead>
            <tbody className="bg-white divide-y divide-gray-200 relative z-10">
              {currentRoutes.length > 0 ? currentRoutes.map((route) => (
                <tr key={route.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-2 sm:px-4 py-3">
                    <div className="min-w-0">
                      <div className="text-xs sm:text-sm font-medium truncate" style={{ color: '#212121' }} title={route.name}>{route.name}</div>
                      <div className="text-xs text-gray-500 mt-1 truncate" title={route.description}>{route.description}</div>
                      <div className="flex items-center mt-1">
                        <div 
                          className="w-1.5 h-1.5 sm:w-3 sm:h-3 rounded-full mr-1 sm:mr-2 flex-shrink-0" 
                          style={{ backgroundColor: route.color }}
                        ></div>
                        <span className="text-xs text-gray-400 truncate">Warna jalur</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-1 sm:px-4 py-3">
                    <div className="text-center sm:text-left">
                      <span className="text-xs sm:text-sm text-gray-900 font-medium">{route.total_points || 0}</span>
                      <div className="text-xs text-gray-500">titik</div>
                    </div>
                  </td>
                  <td className="px-1 sm:px-4 py-3">
                    <div className="flex justify-center sm:justify-start">
                      <FOStatusBadge status={route.status} className="flex-shrink-0" />
                    </div>
                  </td>
                  <td className="px-1 sm:px-4 py-3">
                    <div className="flex justify-center sm:justify-start">
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          onRouteClick?.(route);
                        }}
                        className="text-white px-2 sm:px-3 py-1 rounded text-xs font-medium hover:opacity-90 transition-opacity touch-manipulation whitespace-nowrap flex-shrink-0"
                        style={{ backgroundColor: '#B71C1C' }}
                      >
                        Detail
                      </button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                    Tidak ada jalur FO ditemukan
                  </td>
                </tr>
              )}
              {/* Fill Pleasant space if needed */}
              {currentRoutes.length < routesPerPage && Array.from({ length: routesPerPage - currentRoutes.length }).map((_, index) => (
                <tr key={`empty-${index}`} className="h-16">
                  <td colSpan={5} className="px-4 py-4">&nbsp;</td>
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