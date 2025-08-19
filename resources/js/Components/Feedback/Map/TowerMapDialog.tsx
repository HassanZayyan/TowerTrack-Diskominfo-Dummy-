import React, { useMemo } from 'react';
import LeafletMap from '@/Components/LeafletMap';

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

  // Prepare markers for LeafletMap (similar to DataTower Index)
  const markers = useMemo(() => towersWithCoordinates
    .map(t => {
      const lat = Number(t.latitude);
      const lon = Number(t.longitude);
      return { t, lat, lon };
    })
    .filter(({ t, lat, lon }) => 
      // Coordinate validation
      Number.isFinite(lat) && Number.isFinite(lon) &&
      lat !== 0 && lon !== 0 &&
      Math.abs(lat) <= 90 && Math.abs(lon) <= 180
    )
    .map(({ t, lat, lon }) => {
      let radiusMeters: number | undefined = undefined;
      
      if (typeof t.tinggi_menara === 'number' && t.tinggi_menara > 0) {
        radiusMeters = Math.min(Math.max(t.tinggi_menara * 8, 100), 3000);
      }

      if ((radiusMeters === undefined || !Number.isFinite(radiusMeters)) && t.site_type) {
        const st = t.site_type.toLowerCase();
        if (st.includes('rooftop')) radiusMeters = 250;
        else if (st.includes('sst') || st.includes('monopole')) radiusMeters = 400;
        else if (st.includes('guyed') || st.includes('lattice') || st.includes('sstl')) radiusMeters = 600;
        else radiusMeters = 500; // generic default
      }

      if (radiusMeters === undefined) {
        radiusMeters = 500;
      }

      return ({
        position: [lat, lon] as [number, number],
        title: t.site_name || 'Belum Terdata',
        description: `${t.alamat_menara || 'Belum Terdata'}${t.tinggi_menara ? `<br/>Tinggi: ${t.tinggi_menara} m` : '<br/>Tinggi: Belum Terdata'}${t.tower_type ? `<br/>Jenis: ${t.tower_type}` : ''}`,
        radiusMeters,
        towerData: t, // Pass the complete tower data
      });
    }), [towersWithCoordinates]);

  const handleMarkerClick = (towerData: any) => {
    onSelectTower(towerData);
    setShowMapDialog(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg w-full max-w-6xl h-5/6 flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Pilih Lokasi Tower dari Peta</h3>
            <p className="text-sm text-gray-600">{markers.length} tower tersedia dengan koordinat valid</p>
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
            {markers.length > 0 ? (
              <LeafletMap
                center={[-7.197, 110.426]}
                zoom={10}
                style={{ height: '100%', width: '100%' }}
                markers={markers}
                showLines={false}
                showCoverage={true}
                defaultRadiusMeters={500}
                onMarkerClick={handleMarkerClick}
              />
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
              💡 Klik pada marker di peta untuk memilih tower. Hover marker untuk melihat detail.
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
