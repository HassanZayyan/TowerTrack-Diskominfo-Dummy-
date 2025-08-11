import React, { useMemo, useState } from 'react';
import { Head, router } from '@inertiajs/react';
import MainLayout from '@/Layouts/MainLayout';
import LeafletMap from '@/Components/LeafletMap';

interface Tower {
  id: number;
  site_name: string;
  latitude: number | string;
  longitude: number | string;
  alamat_menara?: string;
  tinggi_menara?: number;
  site_type?: string | null;
  owner?: string;
  status?: string;
}

interface TowerMapProps {
  towers: Tower[];
  currentPage: number;
  perPage: number;
  total: number;
}

const TowerMap: React.FC<TowerMapProps> = ({ 
  towers = [], 
  currentPage = 1, 
  perPage = 10, 
  total = 0 
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const markers = useMemo(() => towers
    .map(t => {
      const lat = Number(t.latitude);
      const lon = Number(t.longitude);
      return { t, lat, lon };
    })
    .filter(({ lat, lon }) => Number.isFinite(lat) && Number.isFinite(lon))
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
        title: t.site_name,
        description: `${t.alamat_menara ?? ''}${t.tinggi_menara ? `<br/>Tinggi: ${t.tinggi_menara} m` : ''}`,
        radiusMeters,
      });
    }), [towers]);

  const onPageChange = (page: number) => {
    router.get('/tower-map', { page }, { preserveState: true });
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    router.get('/tower-map', { search: searchTerm, page: 1 }, { preserveState: true });
  };

  return (
    <MainLayout title="Peta Tower" currentPage="/tower-map">
      <Head title="Peta Tower" />

      <div className="p-6">
        {/* Statistics Header */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-700">Total Tower</h3>
            <p className="text-5xl font-bold text-blue-500 mt-2">{total}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-700">Tower Aktif</h3>
            <p className="text-5xl font-bold text-green-500 mt-2">
              {towers.filter(t => t.status === 'Aktif' || t.status === 'AKTIF').length}
            </p>
          </div>
        </div>

        {/* Map Section */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="p-4 border-b">
            <h2 className="text-xl font-medium">Peta Lokasi Tower</h2>
          </div>
          <div className="p-0">
            <LeafletMap
              center={[-7.197, 110.426]}
              zoom={10}
              style={{ height: '500px' }}
              markers={markers}
              showLines={false}
              showCoverage={true}
              defaultRadiusMeters={500}
            />
          </div>
        </div>

        {/* Table Section */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b flex flex-col md:flex-row justify-between items-center">
            <h2 className="text-xl font-medium mb-3 md:mb-0">Data Tower</h2>
            
            <form onSubmit={handleSearch} className="w-full md:w-64">
              <div className="relative">
                <input 
                  type="text"
                  placeholder="Cari tower..."
                  className="w-full rounded-full border-gray-300 pr-10 focus:border-purple-500 focus:ring-purple-500"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <button 
                  type="submit" 
                  className="absolute right-0 top-0 rounded-r-full px-4 h-full bg-purple-600 text-white"
                >
                  <span className="material-icons text-sm">search</span>
                </button>
              </div>
            </form>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-4 py-3 border-b">Site Tower</th>
                  <th className="px-4 py-3 border-b">Koordinat</th>
                  <th className="px-4 py-3 border-b">Tinggi</th>
                  <th className="px-4 py-3 border-b">Owner</th>
                  <th className="px-4 py-3 border-b">Alamat</th>
                  <th className="px-4 py-3 border-b">Status</th>
                </tr>
              </thead>
              <tbody>
                {towers.map((tower) => (
                  <tr key={tower.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 border-b">{tower.site_name}</td>
                    <td className="px-4 py-3 border-b">
                      Lat: {typeof tower.latitude === 'number' ? tower.latitude.toFixed(4) : tower.latitude}<br/>
                      Lng: {typeof tower.longitude === 'number' ? tower.longitude.toFixed(4) : tower.longitude}
                    </td>
                    <td className="px-4 py-3 border-b">{tower.tinggi_menara}m</td>
                    <td className="px-4 py-3 border-b">{tower.owner || 'TELKOM'}</td>
                    <td className="px-4 py-3 border-b">{tower.alamat_menara || '-'}</td>
                    <td className="px-4 py-3 border-b">
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                        tower.status === 'Aktif' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {tower.status || 'Aktif'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="px-4 py-3 border-t flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Menampilkan {(currentPage - 1) * perPage + 1} - {Math.min(currentPage * perPage, total)} dari {total} data
            </p>
            <div className="flex">
              <button 
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className={`px-3 py-1 rounded-l border ${
                  currentPage === 1 
                  ? 'bg-gray-100 text-gray-400' 
                  : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                Prev
              </button>
              
              {/* Show page numbers - can be enhanced with more page numbers */}
              <button 
                className="px-3 py-1 border-t border-b bg-purple-100 text-purple-700"
              >
                {currentPage}
              </button>
              
              <button 
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage * perPage >= total}
                className={`px-3 py-1 rounded-r border ${
                  currentPage * perPage >= total 
                  ? 'bg-gray-100 text-gray-400' 
                  : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default TowerMap;
