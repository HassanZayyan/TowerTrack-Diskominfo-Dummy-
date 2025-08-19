import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';

// Fix untuk leaflet icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface TowerMapDialogProps {
  showMapDialog: boolean;
  setShowMapDialog: (show: boolean) => void;
  towersWithCoordinates: Array<{
    id: number;
    site_name: string;
    alamat_menara?: string;
    latitude?: number;
    longitude?: number;
    tinggi_menara?: number;
    tinggi_bangunan?: number;
    jumlah_pengguna?: number;
    tower_type?: string;
    site_type?: string;
  }>;
  onSelectTower: (tower: any) => void;
}

export default function TowerMapDialog({
  showMapDialog,
  setShowMapDialog,
  towersWithCoordinates,
  onSelectTower
}: TowerMapDialogProps) {
  if (!showMapDialog) return null;

  // Center map di Indonesia (koordinat tengah Indonesia)
  const defaultCenter: [number, number] = [-2.5, 118];
  const defaultZoom = 5;

  // Jika ada towers dengan koordinat, center ke area tersebut
  let mapCenter = defaultCenter;
  let mapZoom = defaultZoom;
  
  if (towersWithCoordinates.length > 0) {
    // Hitung center berdasarkan rata-rata koordinat towers
    const lats = towersWithCoordinates.map(t => Number(t.latitude));
    const lngs = towersWithCoordinates.map(t => Number(t.longitude));
    
    mapCenter = [
      lats.reduce((a, b) => a + b, 0) / lats.length,
      lngs.reduce((a, b) => a + b, 0) / lngs.length
    ];
    mapZoom = 8;
  }

  const handleMarkerClick = (tower: any) => {
    onSelectTower(tower);
    setShowMapDialog(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg w-full max-w-6xl h-5/6 flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Pilih Lokasi Tower dari Peta</h3>
            <p className="text-sm text-gray-600">{towersWithCoordinates.length} tower tersedia dengan koordinat</p>
          </div>
          <button
            onClick={() => setShowMapDialog(false)}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {/* Map Content */}
        <div className="flex-1 p-4">
          <div className="h-full rounded-lg overflow-hidden border">
            {towersWithCoordinates.length > 0 ? (
              <MapContainer
                center={mapCenter}
                zoom={mapZoom}
                style={{ height: '100%', width: '100%' }}
                className="z-10"
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                
                {towersWithCoordinates.map((tower) => (
                  <Marker
                    key={tower.id}
                    position={[Number(tower.latitude), Number(tower.longitude)]}
                    eventHandlers={{
                      click: () => handleMarkerClick(tower)
                    }}
                  >
                    <Popup>
                      <div className="p-2 min-w-64">
                        <div className="font-bold text-blue-600 mb-2">
                          🏢 {tower.site_name}
                        </div>
                        
                        {tower.alamat_menara && (
                          <div className="text-sm text-gray-600 mb-2">
                            <strong>📍 Alamat:</strong><br />
                            {tower.alamat_menara}
                          </div>
                        )}
                        
                        <div className="text-sm text-gray-600 mb-2">
                          <strong>🗺️ Koordinat:</strong><br />
                          {Number(tower.latitude).toFixed(6)}, {Number(tower.longitude).toFixed(6)}
                        </div>
                        
                        {tower.tower_type && (
                          <div className="text-sm text-gray-600 mb-2">
                            <strong>🗼 Jenis Tower:</strong> {tower.tower_type}
                          </div>
                        )}
                        
                        {tower.tinggi_menara && (
                          <div className="text-sm text-gray-600 mb-2">
                            <strong>📏 Tinggi Menara:</strong> {tower.tinggi_menara}m
                          </div>
                        )}
                        
                        {tower.jumlah_pengguna && (
                          <div className="text-sm text-gray-600 mb-3">
                            <strong>👥 Jumlah Pengguna:</strong> {tower.jumlah_pengguna}
                          </div>
                        )}
                        
                        <button
                          onClick={() => handleMarkerClick(tower)}
                          className="w-full bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium"
                        >
                          ✓ Pilih Tower Ini
                        </button>
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            ) : (
              <div className="h-full bg-gray-100 flex items-center justify-center">
                <div className="text-center text-gray-500">
                  <svg className="w-16 h-16 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6 4h6m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p>Tidak ada tower dengan koordinat yang tersedia</p>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Footer */}
        <div className="p-4 border-t bg-gray-50">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-600">
              💡 Klik pada marker di peta atau tombol "Pilih Tower Ini" untuk memilih lokasi
            </div>
            <button
              onClick={() => setShowMapDialog(false)}
              className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
