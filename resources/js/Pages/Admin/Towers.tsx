import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';

interface Tower { 
  id: number; 
  site_name: string; 
  latitude?: number | string | null; 
  longitude?: number | string | null; 
  tinggi_menara?: number | null; 
  alamat_menara?: string | null; 
  site_type?: string | null; 
  status_ijin?: string | null;
  owner?: string | null;
  alamat_owner?: string | null;
  site_id?: string | null;
  site_sap?: string | null;
  tinggi_bangunan?: number | null;
  jumlah_pengguna?: number | null;
  jumlah_kaki?: number | null;
  tower_type?: string | null;
  no_ijin?: string | null;
  tanggal_ijin?: string | null;
  berlaku_hingga?: string | null;
  jenis_ijin?: string | null;
  prs?: string | null;
  prs_id?: string | null;
  id_no_urut?: number | null;
}

interface Pagination<T> { data: T[]; current_page: number; last_page: number }
interface Props { towers: Pagination<Tower> }

const TowersPage: React.FC<Props> = ({ towers }) => {
  const [editing, setEditing] = useState<Record<number, Partial<Tower>>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [itemsPerPage, setItemsPerPage] = useState(5);

  const updateField = (id: number, key: keyof Tower, value: any) => {
    setEditing(prev => ({ ...prev, [id]: { ...prev[id], [key]: value } }));
  };

  const save = (id: number) => {
    router.put(route('admin.towers.update', { tower: id }), editing[id]);
    setEditing(prev => ({ ...prev, [id]: {} }));
  };

  const resetEditing = (id: number) => {
    setEditing(prev => ({ ...prev, [id]: {} }));
  };

  const getEditValue = (tower: Tower, field: keyof Tower) => {
    return editing[tower.id]?.[field] !== undefined 
      ? editing[tower.id][field] 
      : tower[field];
  };

  const hasChanges = (id: number) => {
    return Object.keys(editing[id] || {}).length > 0;
  };

  const page = towers.current_page;
  const last = towers.last_page;

  // Filter data berdasarkan search term dan filter type
  const filteredTowers = towers.data.filter(tower => {
    const matchesSearch = searchTerm === '' || 
      tower.site_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (tower.site_id && tower.site_id.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (tower.owner && tower.owner.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesFilter = filterType === 'all' || 
      (tower.site_type && tower.site_type.toLowerCase() === filterType.toLowerCase());
    
    return matchesSearch && matchesFilter;
  });

  // Pagination untuk filtered data
  const displayedTowers = itemsPerPage === -1 
    ? filteredTowers 
    : filteredTowers.slice(0, itemsPerPage);

  const showViewAllOption = filteredTowers.length > 5;

  return (
    <AdminLayout title="Towers">
      <Head title="Towers" />
      
      {/* Header Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Kelola Data Tower</h1>
        <p className="text-gray-600">Kelola informasi lengkap tower telekomunikasi dan perbarui data sesuai kebutuhan</p>
      </div>

      {/* Statistics and Search */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-lg p-4 shadow-lg border-l-4 border-blue-500">
          <div className="flex items-center">
            <div className="bg-blue-100 p-3 rounded-full mr-4">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Total Towers</p>
              <p className="text-2xl font-bold text-blue-600">{filteredTowers.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg p-4 shadow-lg border-l-4 border-green-500">
          <div className="flex items-center">
            <div className="bg-green-100 p-3 rounded-full mr-4">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Dengan Ijin</p>
              <p className="text-2xl font-bold text-green-600">
                {filteredTowers.filter(t => t.status_ijin).length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg p-4 shadow-lg border-l-4 border-yellow-500">
          <div className="flex items-center">
            <div className="bg-yellow-100 p-3 rounded-full mr-4">
              <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Dengan Koordinat</p>
              <p className="text-2xl font-bold text-yellow-600">
                {filteredTowers.filter(t => t.latitude && t.longitude).length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg p-4 shadow-lg border-l-4 border-purple-500">
          <div className="flex items-center">
            <div className="bg-purple-100 p-3 rounded-full mr-4">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Rata-rata Tinggi</p>
              <p className="text-2xl font-bold text-purple-600">
                {filteredTowers.length > 0 
                  ? Math.round(filteredTowers.reduce((sum, t) => sum + (Number(t.tinggi_menara) || 0), 0) / filteredTowers.length)
                  : 0}m
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
          <div className="flex-1 max-w-md">
            <div className="relative">
              <input
                type="text"
                placeholder="Cari berdasarkan nama site, site ID, atau owner..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <svg className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-2.5 h-5 w-5 text-gray-400 hover:text-gray-600"
                >
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.414A1 1 0 013 6.707V4z" />
              </svg>
              Filter
            </button>
          </div>
        </div>
        
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <select
                className="border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
              >
                <option value="all">Semua Site Type</option>
                <option value="macro">Macro</option>
                <option value="micro">Micro</option>
                <option value="indoor">Indoor</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800 flex items-center">
            <svg className="w-5 h-5 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            Data Tower ({filteredTowers.length} entries)
            {(searchTerm || filterType !== 'all') && (
              <span className="ml-2 text-sm text-gray-500">
                {filteredTowers.length !== towers.data.length && `dari ${towers.data.length} total`}
              </span>
            )}
          </h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full min-w-[2400px]">
            <thead>
              <tr className="bg-yellow-50 border-b border-yellow-200">
                <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase">No Urut</th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Site Name</th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Site ID/SAP</th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Owner</th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Koordinat</th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Tinggi (m)</th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Pengguna/Kaki</th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Alamat Menara</th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Type</th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Perijinan</th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase">PRS</th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {displayedTowers.length === 0 ? (
                <tr>
                  <td colSpan={12} className="px-6 py-12 text-center text-gray-500">
                    <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    <p className="text-sm">
                      {searchTerm || filterType !== 'all' 
                        ? 'Tidak ada data tower yang sesuai dengan kriteria pencarian'
                        : 'Belum ada data tower'
                      }
                    </p>
                    {searchTerm || filterType !== 'all' ? (
                      <button 
                        onClick={() => {
                          setSearchTerm('');
                          setFilterType('all');
                        }}
                        className="text-xs text-blue-600 hover:text-blue-800 mt-2"
                      >
                        Reset pencarian
                      </button>
                    ) : (
                      <p className="text-xs text-gray-400 mt-1">Data tower akan muncul di sini</p>
                    )}
                  </td>
                </tr>
              ) : (
                displayedTowers.map((tower, index) => (
                  <tr key={tower.id} className={`hover:bg-gray-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-25'}`}>
                    
                    {/* No Urut */}
                    <td className="px-3 py-3">
                      <input
                        type="number"
                        className="w-20 border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                        value={getEditValue(tower, 'id_no_urut') || ''}
                        onChange={(e) => updateField(tower.id, 'id_no_urut', e.target.value)}
                        placeholder="No"
                      />
                    </td>

                    {/* Site Name */}
                    <td className="px-3 py-3">
                      <input
                        className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                        value={getEditValue(tower, 'site_name') || ''}
                        onChange={(e) => updateField(tower.id, 'site_name', e.target.value)}
                        placeholder="Nama Site"
                      />
                    </td>

                    {/* Site ID/SAP */}
                    <td className="px-3 py-3">
                      <div className="space-y-2">
                        <input
                          className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                          value={getEditValue(tower, 'site_id') || ''}
                          onChange={(e) => updateField(tower.id, 'site_id', e.target.value)}
                          placeholder="Site ID"
                        />
                        <input
                          className="w-full border border-gray-300 rounded-lg p-2 text-xs focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                          value={getEditValue(tower, 'site_sap') || ''}
                          onChange={(e) => updateField(tower.id, 'site_sap', e.target.value)}
                          placeholder="Site SAP"
                        />
                      </div>
                    </td>

                    {/* Owner */}
                    <td className="px-3 py-3">
                      <div className="space-y-2">
                        <input
                          className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                          value={getEditValue(tower, 'owner') || ''}
                          onChange={(e) => updateField(tower.id, 'owner', e.target.value)}
                          placeholder="Owner"
                        />
                        <textarea
                          className="w-full border border-gray-300 rounded-lg p-2 text-xs focus:ring-2 focus:ring-yellow-400 focus:border-transparent resize-none"
                          rows={2}
                          value={getEditValue(tower, 'alamat_owner') || ''}
                          onChange={(e) => updateField(tower.id, 'alamat_owner', e.target.value)}
                          placeholder="Alamat Owner"
                        />
                      </div>
                    </td>

                    {/* Koordinat */}
                    <td className="px-3 py-3">
                      <div className="space-y-2">
                        <input
                          className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                          value={getEditValue(tower, 'longitude') || ''}
                          onChange={(e) => updateField(tower.id, 'longitude', e.target.value)}
                          placeholder="Longitude"
                        />
                        <input
                          className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                          value={getEditValue(tower, 'latitude') || ''}
                          onChange={(e) => updateField(tower.id, 'latitude', e.target.value)}
                          placeholder="Latitude"
                        />
                      </div>
                    </td>

                    {/* Tinggi */}
                    <td className="px-3 py-3">
                      <div className="space-y-2">
                        <input
                          type="number"
                          className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                          value={getEditValue(tower, 'tinggi_menara') || ''}
                          onChange={(e) => updateField(tower.id, 'tinggi_menara', e.target.value)}
                          placeholder="Tinggi Menara"
                        />
                        <input
                          type="number"
                          className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                          value={getEditValue(tower, 'tinggi_bangunan') || ''}
                          onChange={(e) => updateField(tower.id, 'tinggi_bangunan', e.target.value)}
                          placeholder="Tinggi Bangunan"
                        />
                      </div>
                    </td>

                    {/* Pengguna/Kaki */}
                    <td className="px-3 py-3">
                      <div className="space-y-2">
                        <input
                          type="number"
                          className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                          value={getEditValue(tower, 'jumlah_pengguna') || ''}
                          onChange={(e) => updateField(tower.id, 'jumlah_pengguna', e.target.value)}
                          placeholder="Jumlah Pengguna"
                        />
                        <input
                          type="number"
                          className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                          value={getEditValue(tower, 'jumlah_kaki') || ''}
                          onChange={(e) => updateField(tower.id, 'jumlah_kaki', e.target.value)}
                          placeholder="Jumlah Kaki/Legs"
                        />
                      </div>
                    </td>

                    {/* Alamat Menara */}
                    <td className="px-3 py-3">
                      <textarea
                        className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-yellow-400 focus:border-transparent resize-none"
                        rows={3}
                        value={getEditValue(tower, 'alamat_menara') || ''}
                        onChange={(e) => updateField(tower.id, 'alamat_menara', e.target.value)}
                        placeholder="Alamat Menara"
                      />
                    </td>

                    {/* Type */}
                    <td className="px-3 py-3">
                      <div className="space-y-2">
                        <select
                          className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                          value={getEditValue(tower, 'site_type') || ''}
                          onChange={(e) => updateField(tower.id, 'site_type', e.target.value)}
                        >
                          <option value="">Site Type</option>
                          <option value="macro">Macro</option>
                          <option value="micro">Micro</option>
                          <option value="indoor">Indoor</option>
                          <option value="outdoor">Outdoor</option>
                        </select>
                        <input
                          className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                          value={getEditValue(tower, 'tower_type') || ''}
                          onChange={(e) => updateField(tower.id, 'tower_type', e.target.value)}
                          placeholder="Tower Type"
                        />
                      </div>
                    </td>

                    {/* Perijinan */}
                    <td className="px-3 py-3">
                      <div className="space-y-2">
                        <input
                          className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                          value={getEditValue(tower, 'no_ijin') || ''}
                          onChange={(e) => updateField(tower.id, 'no_ijin', e.target.value)}
                          placeholder="No Ijin"
                        />
                        <input
                          type="date"
                          className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                          value={getEditValue(tower, 'tanggal_ijin') || ''}
                          onChange={(e) => updateField(tower.id, 'tanggal_ijin', e.target.value)}
                          placeholder="Tanggal Ijin"
                        />
                        <input
                          type="date"
                          className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                          value={getEditValue(tower, 'berlaku_hingga') || ''}
                          onChange={(e) => updateField(tower.id, 'berlaku_hingga', e.target.value)}
                          placeholder="Berlaku Hingga"
                        />
                        <select
                          className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                          value={getEditValue(tower, 'jenis_ijin') || ''}
                          onChange={(e) => updateField(tower.id, 'jenis_ijin', e.target.value)}
                        >
                          <option value="">Jenis Ijin</option>
                          <option value="IMB">IMB</option>
                          <option value="PBG">PBG</option>
                          <option value="Lainnya">Lainnya</option>
                        </select>
                        <select
                          className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                          value={getEditValue(tower, 'status_ijin') || ''}
                          onChange={(e) => updateField(tower.id, 'status_ijin', e.target.value)}
                        >
                          <option value="">Status Ijin</option>
                          <option value="Aktif">Aktif</option>
                          <option value="Tidak Aktif">Tidak Aktif</option>
                          <option value="Pending">Pending</option>
                          <option value="Expired">Expired</option>
                        </select>
                      </div>
                    </td>

                    {/* PRS */}
                    <td className="px-3 py-3">
                      <div className="space-y-2">
                        <input
                          className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                          value={getEditValue(tower, 'prs') || ''}
                          onChange={(e) => updateField(tower.id, 'prs', e.target.value)}
                          placeholder="PRS"
                        />
                        <input
                          className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                          value={getEditValue(tower, 'prs_id') || ''}
                          onChange={(e) => updateField(tower.id, 'prs_id', e.target.value)}
                          placeholder="PRS ID"
                        />
                      </div>
                    </td>

                    {/* Aksi */}
                    <td className="px-3 py-3">
                      <div className="flex flex-col gap-2">
                        <button
                          className={`px-3 py-2 rounded-lg text-sm font-medium transition-all shadow-lg hover:shadow-xl ${
                            hasChanges(tower.id)
                              ? 'bg-gradient-to-r from-green-600 to-green-700 text-white hover:from-green-700 hover:to-green-800'
                              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          }`}
                          onClick={() => save(tower.id)}
                          disabled={!hasChanges(tower.id)}
                        >
                          <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Simpan
                        </button>
                        {hasChanges(tower.id) && (
                          <button
                            className="px-3 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                            onClick={() => resetEditing(tower.id)}
                          >
                            <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            Reset
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Data Display Controls */}
      <div className="mt-6 bg-white rounded-lg shadow-lg p-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-700 font-medium">Tampilkan:</span>
            <select
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
              value={itemsPerPage}
              onChange={(e) => setItemsPerPage(Number(e.target.value))}
            >
              <option value={5}>5 per halaman</option>
              <option value={10}>10 per halaman</option>
              <option value={25}>25 per halaman</option>
              <option value={50}>50 per halaman</option>
              <option value={100}>100 per halaman</option>
              {showViewAllOption && (
                <option value={-1}>Tampilkan Semua ({filteredTowers.length} data)</option>
              )}
            </select>
          </div>
          
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <span>
                Menampilkan <span className="font-semibold text-gray-800">{displayedTowers.length}</span> dari{' '}
                <span className="font-semibold text-gray-800">{filteredTowers.length}</span> data
                {filteredTowers.length !== towers.data.length && (
                  <span className="text-gray-500"> (disaring dari {towers.data.length} total)</span>
                )}
              </span>
            </div>
            
            {itemsPerPage !== -1 && filteredTowers.length > itemsPerPage && (
              <button
                onClick={() => setItemsPerPage(-1)}
                className="flex items-center gap-1 text-blue-600 hover:text-blue-800 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                Lihat Semua Data
              </button>
            )}
          </div>
        </div>
        
        {itemsPerPage === -1 && filteredTowers.length > 50 && (
          <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center gap-2 text-yellow-800">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.664-.833-2.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <span className="text-sm font-medium">Perhatian:</span>
            </div>
            <p className="text-sm text-yellow-700 mt-1">
              Menampilkan {filteredTowers.length} data sekaligus. Untuk performa yang lebih baik, 
              pertimbangkan untuk menggunakan filter atau batasi jumlah data per halaman.
            </p>
          </div>
        )}
      </div>

      {/* Enhanced Pagination */}
      <div className="mt-4 bg-white rounded-lg shadow-lg p-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-sm text-gray-700">
            Menampilkan halaman <span className="font-medium">{page}</span> dari{' '}
            <span className="font-medium">{last}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              disabled={page <= 1}
              className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors flex items-center gap-2"
              onClick={() => router.get(route('admin.towers.index', { page: 1 }))}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
              </svg>
              First
            </button>
            <button
              disabled={page <= 1}
              className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors flex items-center gap-2"
              onClick={() => router.get(route('admin.towers.index', { page: page - 1 }))}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Previous
            </button>
            <span className="px-4 py-2 bg-yellow-50 border border-yellow-200 rounded-lg text-sm font-medium">
              {page} / {last}
            </span>
            <button
              disabled={page >= last}
              className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors flex items-center gap-2"
              onClick={() => router.get(route('admin.towers.index', { page: page + 1 }))}
            >
              Next
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
            <button
              disabled={page >= last}
              className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors flex items-center gap-2"
              onClick={() => router.get(route('admin.towers.index', { page: last }))}
            >
              Last
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default TowersPage;


