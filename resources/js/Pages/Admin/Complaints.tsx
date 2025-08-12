import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';

interface ReportImage { id: number; image_path: string }
interface Tower { id: number; site_name: string }
interface Report { id: number; reporter_name: string; reporter_email: string; reporter_phone: string; category: string; message: string; status: string; images?: ReportImage[]; tower?: Tower }

interface Props { reports: Report[] }

const ComplaintsPage: React.FC<Props> = ({ reports = [] }) => {
  const [replyText, setReplyText] = useState<Record<number, string>>({});

  return (
    <AdminLayout title="Complaints">
      <Head title="Complaints" />
      <div className="rounded shadow overflow-x-auto" style={{ backgroundColor: '#FFFFFF' }}>
        <table className="w-full text-left min-w-[900px]">
          <thead>
            <tr style={{ backgroundColor: '#FFF8E1' }}>
              <th className="px-4 py-3 border-b">Pelapor</th>
              <th className="px-4 py-3 border-b">Kontak</th>
              <th className="px-4 py-3 border-b">Tower</th>
              <th className="px-4 py-3 border-b">Kategori</th>
              <th className="px-4 py-3 border-b">Pesan</th>
              <th className="px-4 py-3 border-b">Status</th>
              <th className="px-4 py-3 border-b">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {reports.map(r => (
              <tr key={r.id} className="align-top">
                <td className="px-4 py-3 border-b">{r.reporter_name}</td>
                <td className="px-4 py-3 border-b text-sm">
                  <div>{r.reporter_email}</div>
                  <div>{r.reporter_phone}</div>
                </td>
                <td className="px-4 py-3 border-b">{r.tower?.site_name ?? '-'}</td>
                <td className="px-4 py-3 border-b">{r.category}</td>
                <td className="px-4 py-3 border-b max-w-md">
                  <div className="whitespace-pre-wrap text-sm">{r.message}</div>
                  {r.images && r.images.length > 0 && (
                    <div className="flex gap-2 mt-2 flex-wrap">
                      {r.images.map(img => (
                        <img key={img.id} src={`/storage/${img.image_path}`} className="w-16 h-16 object-cover rounded border" />
                      ))}
                    </div>
                  )}
                </td>
                <td className="px-4 py-3 border-b">
                  <select className="border rounded p-1 text-sm" value={r.status} onChange={(e) => router.put(route('admin.complaints.updateStatus', { report: r.id }), { status: e.target.value })}>
                    <option value="pending">pending</option>
                    <option value="in_progress">in_progress</option>
                    <option value="responded">responded</option>
                    <option value="closed">closed</option>
                  </select>
                </td>
                <td className="px-4 py-3 border-b w-80">
                  <div className="flex gap-2">
                    <input className="border rounded p-2 text-sm w-full" placeholder="Balas pesan..." value={replyText[r.id] ?? ''} onChange={(e) => setReplyText({ ...replyText, [r.id]: e.target.value })} />
                    <button className="px-3 py-2 text-sm rounded" style={{ backgroundColor: '#212121', color: '#FFFFFF' }} onClick={() => {
                      const msg = replyText[r.id];
                      if (!msg) return;
                      router.post(route('admin.complaints.respond', { report: r.id }), { message: msg });
                      setReplyText({ ...replyText, [r.id]: '' });
                    }}>Kirim</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  );
};

export default ComplaintsPage;


