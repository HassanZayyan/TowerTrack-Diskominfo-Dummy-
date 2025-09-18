import React from 'react';

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

  if (!isOpen) return null;

  return (
    <>
      {/* Modal Backdrop */}
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          {/* Modal Header */}
          <div className="p-6 border-b border-gray-200 flex items-center justify-between">
            <h3 className="text-xl font-semibold text-gray-900">
              Detail {detailData?.type === 'point' ? 'Titik FO' : 'Jalur FO'}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          {/* Modal Content */}
          <div className="p-6">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
                <span className="ml-2 text-gray-600">Memuat detail...</span>
              </div>
            ) : detailData ? (
              <div className="space-y-6">
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
          
          {/* Modal Footer */}
          <div className="p-6 border-t border-gray-200 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
            >
              Tutup
            </button>
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h4 className="text-lg font-medium text-gray-900">Informasi Titik</h4>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium text-gray-500">Nama</label>
              <p className="text-gray-900">{point.name}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Tipe</label>
              <p className="text-gray-900 capitalize">{point.type}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Jalur</label>
              <p className="text-gray-900">{point.route_name}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Urutan</label>
              <p className="text-gray-900">{point.sequence_number}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Area</label>
              <p className="text-gray-900 capitalize">{point.area}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Status</label>
              <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                point.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {point.status === 'active' ? 'Aktif' : 'Tidak Aktif'}
              </span>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Koordinat</label>
              <p className="text-gray-900">{point.latitude}, {point.longitude}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Deskripsi</label>
              <p className="text-gray-900">{point.description || 'Tidak ada deskripsi'}</p>
            </div>
          </div>
        </div>
        
        <div className="space-y-4">
          <h4 className="text-lg font-medium text-gray-900">Gambar</h4>
          <div className="space-y-3">
            {['isp', 'pole', 'junction_box'].map((imageType) => {
              const imageUrl = point.images[imageType as keyof typeof point.images];
              const labels = { isp: 'ISP', pole: 'Tiang', junction_box: 'Junction Box' };
              
              return (
                <div key={imageType}>
                  <label className="text-sm font-medium text-gray-500">{labels[imageType as keyof typeof labels]}</label>
                  {imageUrl ? (
                    <div className="mt-1">
                      <img 
                        src={imageUrl} 
                        alt={labels[imageType as keyof typeof labels]}
                        className="w-full h-32 object-cover rounded-lg border"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjEyOCIgdmlld0JveD0iMCAwIDIwMCAxMjgiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMTI4IiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik04NyA0OEw5MyA1NEw4NyA2MEw4MSA1NEw4NyA0OFoiIGZpbGw9IiM5Q0EzQUYiLz4KPHA+CjwvcGF0aD4KPC9zdmc+';
                        }}
                      />
                    </div>
                  ) : (
                    <p className="text-gray-400 text-sm mt-1">Tidak ada gambar</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
      
      {relatedRoutes && relatedRoutes.length > 0 && (
        <div className="mt-6">
          <h4 className="text-lg font-medium text-gray-900 mb-3">Jalur Terkait</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {relatedRoutes.map((route: any) => (
              <div key={route.id} className="p-3 border rounded-lg">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: route.color }}></div>
                  <span className="font-medium">{route.name}</span>
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  {route.total_points} titik • {Number(route.total_distance || 0).toFixed(2)} km
                </p>
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h4 className="text-lg font-medium text-gray-900">Informasi Jalur</h4>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium text-gray-500">Nama</label>
              <p className="text-gray-900">{route.name}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Area</label>
              <p className="text-gray-900 capitalize">{route.area}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Status</label>
              <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                route.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {route.status === 'active' ? 'Aktif' : 'Tidak Aktif'}
              </span>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Total Titik</label>
              <p className="text-gray-900">{route.total_points}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Total Jarak</label>
              <p className="text-gray-900">{Number(route.total_distance || 0).toFixed(2)} km</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Warna Jalur</label>
              <div className="flex items-center space-x-2 mt-1">
                <div className="w-4 h-4 rounded" style={{ backgroundColor: route.color }}></div>
                <span className="text-gray-900">{route.color}</span>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Deskripsi</label>
              <p className="text-gray-900">{route.description || 'Tidak ada deskripsi'}</p>
            </div>
          </div>
        </div>
        
        <div className="space-y-4">
          <h4 className="text-lg font-medium text-gray-900">Titik-titik dalam Jalur</h4>
          <div className="max-h-64 overflow-y-auto space-y-2">
            {points.map((point: any) => (
              <div key={point.id} className="p-3 border rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{point.name}</span>
                  <span className="text-sm text-gray-500">#{point.sequence_number}</span>
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  {point.type} • {point.latitude}, {point.longitude}
                </p>
                <div className="flex items-center space-x-2 mt-2">
                  {point.images?.isp && <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">ISP</span>}
                  {point.images?.pole && <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Tiang</span>}
                  {point.images?.junction_box && <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded">JB</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}