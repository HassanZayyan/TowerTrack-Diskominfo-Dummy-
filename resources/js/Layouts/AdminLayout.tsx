import React, { ReactNode } from 'react';
import { Link, usePage } from '@inertiajs/react';

interface AdminLayoutProps {
  children: ReactNode;
  title?: string;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children, title = 'Admin' }) => {
  const { auth } = usePage().props as any;
  const user = auth?.user;

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f7f7f7' }}>
      <nav className="border-b sticky top-0 z-30" style={{ backgroundColor: '#B71C1C', borderBottomColor: '#FFD700' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4 md:gap-6">
            <Link href="/" className="text-lg font-semibold whitespace-nowrap" style={{ color: '#FFD700' }}>TowerTrack</Link>
            <div className="hidden md:flex items-center gap-2 lg:gap-4">
              <Link href={route('admin.dashboard')} className="text-sm px-3 py-2 rounded hover:bg-white/10" style={{ color: '#FFFFFF' }}>Dashboard</Link>
              {user?.role === 'admin' && (
                <Link href={route('admin.users.index')} className="text-sm px-3 py-2 rounded hover:bg-white/10" style={{ color: '#FFFFFF' }}>Users</Link>
              )}
              <Link href={route('admin.complaints.index')} className="text-sm px-3 py-2 rounded hover:bg-white/10" style={{ color: '#FFFFFF' }}>Complaints</Link>
              <Link href={route('admin.towers.index')} className="text-sm px-3 py-2 rounded hover:bg-white/10" style={{ color: '#FFFFFF' }}>Towers</Link>
            </div>
          </div>
          <div className="flex items-center gap-2 md:gap-4">
            <span className="text-sm hidden sm:inline" style={{ color: '#FFD700' }}>{user?.name} ({user?.role})</span>
            <Link href={route('logout')} method="post" as="button" className="text-sm px-3 py-1 rounded" style={{ backgroundColor: '#212121', color: '#FFFFFF' }}>Logout</Link>
          </div>
        </div>
        {/* Mobile admin nav */}
        <div className="md:hidden border-t" style={{ borderTopColor: '#FFD700' }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 flex gap-2 overflow-x-auto">
            <Link href={route('admin.dashboard')} className="text-xs px-3 py-2 rounded bg-white/10 whitespace-nowrap" style={{ color: '#FFFFFF' }}>Dashboard</Link>
            {user?.role === 'admin' && (
              <Link href={route('admin.users.index')} className="text-xs px-3 py-2 rounded bg-white/10 whitespace-nowrap" style={{ color: '#FFFFFF' }}>Users</Link>
            )}
            <Link href={route('admin.complaints.index')} className="text-xs px-3 py-2 rounded bg-white/10 whitespace-nowrap" style={{ color: '#FFFFFF' }}>Complaints</Link>
            <Link href={route('admin.towers.index')} className="text-xs px-3 py-2 rounded bg-white/10 whitespace-nowrap" style={{ color: '#FFFFFF' }}>Towers</Link>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {children}
      </main>
    </div>
  );
};

export default AdminLayout;


