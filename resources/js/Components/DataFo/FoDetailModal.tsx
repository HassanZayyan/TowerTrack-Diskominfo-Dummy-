import React, { useEffect } from 'react';

interface FoPoint {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  type: string;
  route_name: string;
  sequence_number: number;
  description?: string;
  area: string;
  status: string;
  images: {
    isp: string | null;
    pole: string | null;
    junction_box: string | null;
  };
  has_images: boolean;
}

interface FoRoute {
  id: number;
  name: string;
  color: string;
  total_distance: number;
  total_points: number;
  description: string;
  area: string;
  status: string;
}

interface DetailData {
  success: boolean;
  type: 'point' | 'route';
  data: {
    point?: FoPoint;
    route?: FoRoute;
    points?: FoPoint[];
    related_routes?: any[];
    polyline?: any[];
    bounds?: any;
  };
}

interface FoDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  detailData: DetailData | null;
  loading: boolean;
}

export default function FoDetailModal({ 
  isOpen, 
  onClose, 
  detailData, 
  loading
}: FoDetailModalProps) {
  
  // Prevent body scroll saat modal terbuka
  useEffect(() => {
    if (isOpen) {
      // Simpan scroll position
      const scrollY = window.scrollY;
      
      // Lock body scroll
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      document.body.style.overflow = 'hidden';
      
      return () => {
        // Restore scroll position saat modal ditutup
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        document.body.style.overflow = '';
        window.scrollTo(0, scrollY);
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      {/* Modal Backdrop - Fixed, tidak boleh scroll */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-60 z-50 backdrop-blur-sm"
        onClick={onClose}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          overflow: 'hidden' // Pastikan backdrop tidak bisa scroll
        }}
      >
        {/* Modal Container - Centered dengan flex, tidak scroll */}
        <div 
          className="h-full flex items-center justify-center p-4"
          onClick={(e) => e.stopPropagation()}
          style={{
            height: '100vh', // Gunakan viewport height, bukan min-height
            overflow: 'hidden' // Pastikan container tidak scroll
          }}
        >
          <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[85vh] sm:max-h-[90vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-red-600 to-red-700 p-6 text-white flex-shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-white bg-opacity-20 rounded-lg">
                    {detailData?.type === 'point' ? (
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    ) : (
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                      </svg>
                    )}
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold">
                      Detail {detailData?.type === 'point' ? 'Titik FO' : 'Jalur FO'}
                    </h3>
                    <p className="text-red-100 text-sm mt-1">
                      {detailData?.type === 'point' ? 'Informasi lengkap titik fiber optik' : 'Informasi lengkap jalur fiber optik'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-all duration-200 group"
                >
                  <svg className="w-6 h-6 group-hover:rotate-90 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            {/* Modal Content - Hanya area ini yang bisa scroll */}
            <div 
              className="p-6 overflow-y-auto flex-1 bg-white"
              style={{
                minHeight: 0, // Penting untuk flex scrolling
                WebkitOverflowScrolling: 'touch', // Smooth scrolling di mobile
                overscrollBehavior: 'contain' // Mencegah scroll chaining ke backdrop
              }}
            >
              {loading ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <div className="relative">
                    <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200"></div>
                    <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent absolute top-0 left-0"></div>
                  </div>
                  <div className="mt-6 text-center">
                    <p className="text-lg font-medium text-gray-700">Memuat detail...</p>
                    <p className="text-sm text-gray-500 mt-1">Mohon tunggu sebentar</p>
                  </div>
                </div>
              ) : detailData ? (
                <div className="space-y-8">
                  {detailData.type === 'point' ? (
                    <PointDetails 
                      point={detailData.data.point!} 
                      relatedRoutes={detailData.data.related_routes || []}
                    />
                  ) : (
                    <RouteDetails 
                      route={detailData.data.route!}
                      points={detailData.data.points || []}
                    />
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  Tidak ada data untuk ditampilkan
                </div>
              )}
            </div>
            
            {/* Modal Footer - Pastikan background solid dan tidak tembus */}
            <div 
              className="p-4 sm:p-6 border-t border-gray-200 flex justify-end bg-white flex-shrink-0"
              style={{
                paddingBottom: `max(1rem, calc(1.5rem + env(safe-area-inset-bottom)))`
              }}
            >
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// Point Details Component
function PointDetails({ 
  point, 
  relatedRoutes
}: { 
  point: FoPoint; 
  relatedRoutes: any[];
}) {
  return (
    <div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Informasi Titik Card */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-xl p-6 border border-blue-200 shadow-sm">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-2 bg-blue-100 rounded-lg">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h4 className="text-xl font-bold text-gray-900">Informasi Titik</h4>
          </div>
          <div className="space-y-4">
            <div className="bg-white rounded-lg p-4 border border-gray-100">
              <label className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Nama Titik</label>
              <p className="text-lg font-medium text-gray-900 mt-1">{point.name}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white rounded-lg p-4 border border-gray-100">
                <label className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Tipe</label>
                <p className="text-base font-medium text-gray-900 mt-1 capitalize">{point.type}</p>
              </div>
              <div className="bg-white rounded-lg p-4 border border-gray-100">
                <label className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Urutan</label>
                <p className="text-base font-medium text-gray-900 mt-1">#{point.sequence_number}</p>
              </div>
            </div>
            <div className="bg-white rounded-lg p-4 border border-gray-100">
              <label className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Jalur</label>
              <p className="text-base font-medium text-gray-900 mt-1">{point.route_name}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white rounded-lg p-4 border border-gray-100">
                <label className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Area</label>
                <p className="text-base font-medium text-gray-900 mt-1 capitalize">{point.area}</p>
              </div>
              <div className="bg-white rounded-lg p-4 border border-gray-100">
                <label className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Status</label>
                <div className="mt-1">
                  <span className={`inline-flex items-center px-3 py-1 text-sm font-semibold rounded-full ${
                    point.status === 'active' 
                      ? 'bg-green-100 text-green-800 border border-green-200' 
                      : 'bg-red-100 text-red-800 border border-red-200'
                  }`}>
                    <div className={`w-2 h-2 rounded-full mr-2 ${
                      point.status === 'active' ? 'bg-green-500' : 'bg-red-500'
                    }`}></div>
                    {point.status === 'active' ? 'Aktif' : 'Tidak Aktif'}
                  </span>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg p-4 border border-gray-100">
              <label className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Koordinat</label>
              <div className="flex items-center space-x-2 mt-1">
                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <p className="text-base font-mono text-gray-900">{point.latitude}, {point.longitude}</p>
              </div>
            </div>
            <div className="bg-white rounded-lg p-4 border border-gray-100">
              <label className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Deskripsi</label>
              <p className="text-base text-gray-700 mt-1 leading-relaxed">
                {point.description || (
                  <span className="italic text-gray-500">Tidak ada deskripsi tersedia</span>
                )}
              </p>
            </div>
          </div>
        </div>
        
        {/* Gambar Card */}
        <div className="bg-gradient-to-br from-orange-50 to-amber-100 rounded-xl p-6 border border-orange-200 shadow-sm">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-2 bg-orange-100 rounded-lg">
              <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h4 className="text-xl font-bold text-gray-900">Dokumentasi Gambar</h4>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {['isp', 'pole', 'junction_box'].map((imageType) => {
              const imageUrl = point.images[imageType as keyof typeof point.images];
              const labels = { isp: 'ISP', pole: 'Tiang', junction_box: 'Junction Box' };
              const colors = { isp: 'red', pole: 'green', junction_box: 'blue' };
              const hasValidUrl = imageUrl && imageUrl !== '-' && imageUrl.trim() !== '';
              const color = colors[imageType as keyof typeof colors];
              
              return (
                <div key={imageType} className="bg-white rounded-lg p-4 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                  <div className="text-center">
                    <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full mb-3 ${
                      color === 'red' ? 'bg-red-100' :
                      color === 'green' ? 'bg-green-100' : 'bg-blue-100'
                    }`}>
                      {imageType === 'isp' && (
                        <svg className={`w-6 h-6 ${
                          color === 'red' ? 'text-red-600' : ''
                        }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                      )}
                      {imageType === 'pole' && (
                        <svg className={`w-6 h-6 ${
                          color === 'green' ? 'text-green-600' : ''
                        }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                      )}
                      {imageType === 'junction_box' && (
                        <svg className={`w-6 h-6 ${
                          color === 'blue' ? 'text-blue-600' : ''
                        }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                      )}
                    </div>
                    <label className="block text-sm font-bold text-gray-700 mb-3">
                      {labels[imageType as keyof typeof labels]}
                    </label>
                    {hasValidUrl ? (
                      <button
                        onClick={() => window.open(imageUrl, '_blank', 'noopener,noreferrer')}
                        className={`w-full inline-flex items-center justify-center px-4 py-2 text-sm font-semibold text-white rounded-lg transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                          color === 'red' ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500' :
                          color === 'green' ? 'bg-green-600 hover:bg-green-700 focus:ring-green-500' :
                          'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
                        }`}
                        title={`Lihat gambar ${labels[imageType as keyof typeof labels]}`}
                      >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        Lihat Gambar
                      </button>
                    ) : (
                      <div className="w-full inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-gray-500 bg-gray-100 rounded-lg cursor-not-allowed border-2 border-dashed border-gray-300">
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728" />
                        </svg>
                        Tidak Tersedia
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      
      {/* Jalur Terkait */}
      {relatedRoutes && relatedRoutes.length > 0 && (
        <div className="bg-gradient-to-br from-green-50 to-emerald-100 rounded-xl p-6 border border-green-200 shadow-sm">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-2 bg-green-100 rounded-lg">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
            </div>
            <div>
              <h4 className="text-xl font-bold text-gray-900">Jalur Terkait</h4>
              <p className="text-sm text-green-700 mt-1">{relatedRoutes.length} jalur yang terhubung</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {relatedRoutes.map((route: any) => (
              <div key={route.id} className="bg-white rounded-lg p-4 border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200 hover:scale-[1.02]">
                <div className="flex items-center space-x-3 mb-3">
                  <div 
                    className="w-4 h-4 rounded-full border-2 border-white shadow-sm" 
                    style={{ backgroundColor: route.color }}
                  ></div>
                  <span className="font-bold text-gray-900 text-lg">{route.name}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-1 text-gray-600">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className="font-medium">{route.total_points} titik</span>
                  </div>
                  <div className="flex items-center space-x-1 text-gray-600">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                    <span className="font-medium">{Number(route.total_distance || 0).toFixed(2)} km</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Route Details Component
function RouteDetails({ 
  route, 
  points
}: { 
  route: FoRoute; 
  points: FoPoint[];
}) {
  return (
    <div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Informasi Jalur Card */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-xl p-6 border border-blue-200 shadow-sm">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-2 bg-blue-100 rounded-lg">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
            </div>
            <h4 className="text-xl font-bold text-gray-900">Informasi Jalur</h4>
          </div>
          <div className="space-y-4">
            <div className="bg-white rounded-lg p-4 border border-gray-100">
              <label className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Nama Jalur</label>
              <p className="text-lg font-medium text-gray-900 mt-1">{route.name}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white rounded-lg p-4 border border-gray-100">
                <label className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Area</label>
                <p className="text-base font-medium text-gray-900 mt-1 capitalize">{route.area}</p>
              </div>
              <div className="bg-white rounded-lg p-4 border border-gray-100">
                <label className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Status</label>
                <div className="mt-1">
                  <span className={`inline-flex items-center px-3 py-1 text-sm font-semibold rounded-full ${
                    route.status === 'active' 
                      ? 'bg-green-100 text-green-800 border border-green-200' 
                      : 'bg-red-100 text-red-800 border border-red-200'
                  }`}>
                    <div className={`w-2 h-2 rounded-full mr-2 ${
                      route.status === 'active' ? 'bg-green-500' : 'bg-red-500'
                    }`}></div>
                    {route.status === 'active' ? 'Aktif' : 'Tidak Aktif'}
                  </span>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white rounded-lg p-4 border border-gray-100">
                <label className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Total Titik</label>
                <div className="flex items-center space-x-2 mt-1">
                  <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <p className="text-base font-medium text-gray-900">{route.total_points} titik</p>
                </div>
              </div>
              <div className="bg-white rounded-lg p-4 border border-gray-100">
                <label className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Total Jarak</label>
                <div className="flex items-center space-x-2 mt-1">
                  <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                  <p className="text-base font-medium text-gray-900">{Number(route.total_distance || 0).toFixed(2)} km</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg p-4 border border-gray-100">
              <label className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Warna Jalur</label>
              <div className="flex items-center space-x-3 mt-1">
                <div className="w-6 h-6 rounded-lg border-2 border-white shadow-sm" style={{ backgroundColor: route.color }}></div>
                <span className="text-base font-mono text-gray-900">{route.color}</span>
              </div>
            </div>
            <div className="bg-white rounded-lg p-4 border border-gray-100">
              <label className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Deskripsi</label>
              <p className="text-base text-gray-700 mt-1 leading-relaxed">
                {route.description || (
                  <span className="italic text-gray-500">Tidak ada deskripsi tersedia</span>
                )}
              </p>
            </div>
          </div>
        </div>
        
        {/* Titik-titik dalam Jalur Card */}
        <div className="bg-gradient-to-br from-green-50 to-emerald-100 rounded-xl p-6 border border-green-200 shadow-sm">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-2 bg-green-100 rounded-lg">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div>
              <h4 className="text-xl font-bold text-gray-900">Titik-titik dalam Jalur</h4>
              <p className="text-sm text-green-700 mt-1">{points.length} titik terdaftar</p>
            </div>
          </div>
          <div className="max-h-80 overflow-y-auto space-y-3 pr-2">
            {points.map((point: any, index: number) => (
              <div key={point.id} className="bg-white rounded-lg p-4 border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200 hover:scale-[1.01]">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center justify-center w-8 h-8 bg-green-100 text-green-600 rounded-full text-sm font-bold">
                  {point.sequence_number}
                </div>
                    <div>
                      <h5 className="font-bold text-gray-900 text-lg">{point.name}</h5>
                      <p className="text-sm text-gray-600 capitalize">{point.type}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                      #{point.sequence_number}
                    </span>
                  </div>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-600 mb-3">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span className="font-mono">{point.latitude}, {point.longitude}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {point.images?.isp && (
                    <span className="inline-flex items-center text-xs bg-red-100 text-red-800 px-3 py-1 rounded-full font-medium border border-red-200">
                      <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      ISP
                    </span>
                  )}
                  {point.images?.pole && (
                    <span className="inline-flex items-center text-xs bg-green-100 text-green-800 px-3 py-1 rounded-full font-medium border border-green-200">
                      <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      Tiang
                    </span>
                  )}
                  {point.images?.junction_box && (
                    <span className="inline-flex items-center text-xs bg-blue-100 text-blue-800 px-3 py-1 rounded-full font-medium border border-blue-200">
                      <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                      Junction Box
                    </span>
                  )}
                  {!point.images?.isp && !point.images?.pole && !point.images?.junction_box && (
                    <span className="text-xs text-gray-400 italic">Tidak ada gambar tersedia</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}