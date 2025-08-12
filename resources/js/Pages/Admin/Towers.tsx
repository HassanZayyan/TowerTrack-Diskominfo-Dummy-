import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';

interface Tower { id: number; site_name: string; latitude?: number | string | null; longitude?: number | string | null; tinggi_menara?: number | null; alamat_menara?: string | null; site_type?: string | null; status_ijin?: string | null }
interface Pagination<T> { data: T[]; current_page: number; last_page: number }
interface Props { towers: Pagination<Tower> }

const TowersPage: React.FC<Props> = ({ towers }) => {
  const [editing, setEditing] = useState<Record<number, Partial<Tower>>>({});

  const updateField = (id: number, key: keyof Tower, value: any) => {
    setEditing(prev => ({ ...prev, [id]: { ...prev[id], [key]: value } }));
  };

  const save = (id: number) => {
    router.put(route('admin.towers.update', { tower: id }), editing[id]);
    setEditing(prev => ({ ...prev, [id]: {} }));
  };

  const page = towers.current_page;
  const last = towers.last_page;

  return (
    <AdminLayout title="Towers">
      <Head title="Towers" />
      <div className="rounded shadow overflow-x-auto" style={{ backgroundColor: '#FFFFFF' }}>
        <table className="w-full text-left min-w-[1000px]">
          <thead>
            <tr style={{ backgroundColor: '#FFF8E1' }}>
              <th className="px-4 py-3 border-b">Site Name</th>
              <th className="px-4 py-3 border-b">Lat</th>
              <th className="px-4 py-3 border-b">Lng</th>
              <th className="px-4 py-3 border-b">Tinggi</th>
              <th className="px-4 py-3 border-b">Alamat</th>
              <th className="px-4 py-3 border-b">Site Type</th>
              <th className="px-4 py-3 border-b">Status Ijin</th>
              <th className="px-4 py-3 border-b">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {towers.data.map(t => (
              <tr key={t.id}>
                <td className="px-4 py-3 border-b">
                  <input className="border rounded p-1 w-56" defaultValue={t.site_name} onChange={(e) => updateField(t.id, 'site_name', e.target.value)} />
                </td>
                <td className="px-4 py-3 border-b"><input className="border rounded p-1 w-28" defaultValue={String(t.latitude ?? '')} onChange={(e) => updateField(t.id, 'latitude', e.target.value)} /></td>
                <td className="px-4 py-3 border-b"><input className="border rounded p-1 w-28" defaultValue={String(t.longitude ?? '')} onChange={(e) => updateField(t.id, 'longitude', e.target.value)} /></td>
                <td className="px-4 py-3 border-b"><input className="border rounded p-1 w-24" defaultValue={String(t.tinggi_menara ?? '')} onChange={(e) => updateField(t.id, 'tinggi_menara', e.target.value)} /></td>
                <td className="px-4 py-3 border-b"><input className="border rounded p-1 w-80" defaultValue={t.alamat_menara ?? ''} onChange={(e) => updateField(t.id, 'alamat_menara', e.target.value)} /></td>
                <td className="px-4 py-3 border-b"><input className="border rounded p-1 w-40" defaultValue={t.site_type ?? ''} onChange={(e) => updateField(t.id, 'site_type', e.target.value)} /></td>
                <td className="px-4 py-3 border-b"><input className="border rounded p-1 w-40" defaultValue={t.status_ijin ?? ''} onChange={(e) => updateField(t.id, 'status_ijin', e.target.value)} /></td>
                <td className="px-4 py-3 border-b"><button className="px-3 py-1 rounded" style={{ backgroundColor: '#212121', color: '#FFFFFF' }} onClick={() => save(t.id)}>Simpan</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Simple pager */}
      <div className="mt-3 flex gap-2">
        <button disabled={page <= 1} className="px-3 py-1 border rounded disabled:opacity-50" onClick={() => router.get(route('admin.towers.index', { page: page - 1 }))}>Prev</button>
        <span className="text-sm" style={{ color: '#212121' }}>Page {page} / {last}</span>
        <button disabled={page >= last} className="px-3 py-1 border rounded disabled:opacity-50" onClick={() => router.get(route('admin.towers.index', { page: page + 1 }))}>Next</button>
      </div>
    </AdminLayout>
  );
};

export default TowersPage;


