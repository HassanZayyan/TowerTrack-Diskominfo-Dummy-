import React, { ReactNode } from 'react';
import { Link, usePage } from '@inertiajs/react';
import { useLogoutConfirmation } from '@/Hooks/useLogoutConfirmation';
import LogoutConfirmDialog from '@/Components/LogoutConfirmDialog';

interface AdminLayoutProps {
  children: ReactNode;
  title?: string;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children, title = 'Admin' }) => {
  const page = usePage();
  const { auth } = page.props as any;
  const user = auth?.user;
  const currentUrl = page.url;
  const currentRoute = page.component; // Get current route component name

  // Use logout confirmation hook
  const { openDialog, dialogProps } = useLogoutConfirmation({
    variant: 'danger',
    title: 'Konfirmasi Logout Admin',
    message: 'Apakah Anda yakin ingin keluar dari sistem admin?',
    confirmText: 'Ya, Logout',
    cancelText: 'Batal'
  });

  // Function to check if current menu item is active
  const isActive = (routeName: string) => {
    // Check based on current route component name for more accurate detection
    if (routeName === '/admin/dashboard') {
      return currentRoute === 'Admin/Dashboard' || 
             currentUrl === '/admin/dashboard' || 
             currentUrl === '/admin';
    }
    if (routeName === '/admin/users') {
      return currentRoute?.startsWith('Admin/User') || currentUrl.startsWith('/admin/users');
    }
    if (routeName === '/admin/messages') {
      return currentRoute?.startsWith('Admin/Messages') || currentUrl.startsWith('/admin/messages');
    }
    if (routeName === '/admin/towers') {
      return currentRoute?.startsWith('Admin/Tower') || currentUrl.startsWith('/admin/towers');
    }
    if (routeName === '/admin/feedbacks') {
      return currentRoute?.startsWith('Admin/Feedback') || currentUrl.startsWith('/admin/feedbacks');
    }
    
    return currentUrl.startsWith(routeName);
  };

  // Function to get menu item classes
  const getMenuClasses = (routeName: string, isMobile: boolean = false) => {
    const baseClasses = isMobile 
      ? "text-xs px-3 py-2 rounded whitespace-nowrap transition-all duration-200" 
      : "text-sm px-3 py-2 rounded transition-all duration-200";
    
    if (isActive(routeName)) {
      return `${baseClasses} font-bold` + (isMobile ? " text-yellow-400" : " text-yellow-400");
    }
    
    return `${baseClasses} hover:bg-white/10` + (isMobile ? " text-white" : " text-white");
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f7f7f7' }}>
      <nav className="border-b sticky top-0 z-30" style={{ backgroundColor: '#B71C1C', borderBottomColor: '#FFD700' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4 md:gap-6">
            <Link href="/" className="text-lg font-semibold whitespace-nowrap" style={{ color: '#FFD700' }}>TowerTrack</Link>
            <div className="hidden md:flex items-center gap-2 lg:gap-4">
              {user?.role !== 'tower_owner' && (
                <Link 
                  href={route('admin.dashboard')} 
                  className={getMenuClasses('/admin/dashboard')}
                  style={{ 
                    backgroundColor: isActive('/admin/dashboard') ? '#FFD700' : 'transparent',
                    color: isActive('/admin/dashboard') ? '#B71C1C' : '#FFFFFF'
                  }}
                >
                  Dashboard
                </Link>
              )}
              {user?.role === 'admin' && (
                <Link 
                  href={route('admin.users.index')} 
                  className={getMenuClasses('/admin/users')}
                  style={{ 
                    backgroundColor: isActive('/admin/users') ? '#FFD700' : 'transparent',
                    color: isActive('/admin/users') ? '#B71C1C' : '#FFFFFF'
                  }}
                >
                  Users
                </Link>
              )}
              {user?.role !== 'tower_owner' && (
                <Link 
                  href={route('admin.messages.index')}
                  className={getMenuClasses('/admin/messages')}
                  style={{ 
                    backgroundColor: isActive('/admin/messages') ? '#FFD700' : 'transparent',
                    color: isActive('/admin/messages') ? '#B71C1C' : '#FFFFFF'
                  }}
                >
                  Messages
                </Link>
              )}
              <Link 
                href={route('admin.towers.index')} 
                className={getMenuClasses('/admin/towers')}
                style={{ 
                  backgroundColor: isActive('/admin/towers') ? '#FFD700' : 'transparent',
                  color: isActive('/admin/towers') ? '#B71C1C' : '#FFFFFF'
                }}
              >
                Towers
              </Link>
            </div>
          </div>
          <div className="flex items-center gap-2 md:gap-4">
            <span className="text-sm hidden sm:inline" style={{ color: '#FFD700' }}>{user?.name} ({user?.role})</span>
            <button 
              onClick={openDialog}
              className="text-sm px-4 py-2 rounded-lg font-medium transition-all duration-200 hover:shadow-md"
              style={{ 
                backgroundColor: '#FF6B6B', 
                color: '#FFFFFF',
                border: '2px solid transparent'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#FF5252';
                e.currentTarget.style.borderColor = '#FFD700';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#FF6B6B';
                e.currentTarget.style.borderColor = 'transparent';
              }}
            >
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Logout
              </div>
            </button>
          </div>
        </div>
        {/* Mobile admin nav */}
        <div className="md:hidden border-t" style={{ borderTopColor: '#FFD700' }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 flex gap-2 overflow-x-auto">
            {user?.role !== 'tower_owner' && (
              <Link 
                href={route('admin.dashboard')} 
                className={getMenuClasses('/admin/dashboard', true)}
                style={{ 
                  backgroundColor: isActive('/admin/dashboard') ? '#FFD700' : 'rgba(255, 255, 255, 0.1)',
                  color: isActive('/admin/dashboard') ? '#B71C1C' : '#FFFFFF'
                }}
              >
                Dashboard
              </Link>
            )}
            {user?.role === 'admin' && (
              <Link 
                href={route('admin.users.index')} 
                className={getMenuClasses('/admin/users', true)}
                style={{ 
                  backgroundColor: isActive('/admin/users') ? '#FFD700' : 'rgba(255, 255, 255, 0.1)',
                  color: isActive('/admin/users') ? '#B71C1C' : '#FFFFFF'
                }}
              >
                Users
              </Link>
            )}
            {user?.role !== 'tower_owner' && (
              <Link 
                href={route('admin.messages.index')} 
                className={getMenuClasses('/admin/messages', true)}
                style={{ 
                  backgroundColor: isActive('/admin/messages') ? '#FFD700' : 'rgba(255, 255, 255, 0.1)',
                    color: isActive('/admin/messages') ? '#B71C1C' : '#FFFFFF'
                }}
              >
                Messages
              </Link>
            )}
            <Link 
              href={route('admin.towers.index')} 
              className={getMenuClasses('/admin/towers', true)}
              style={{ 
                backgroundColor: isActive('/admin/towers') ? '#FFD700' : 'rgba(255, 255, 255, 0.1)',
                color: isActive('/admin/towers') ? '#B71C1C' : '#FFFFFF'
              }}
            >
              Towers
            </Link>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {children}
      </main>
      
      {/* Logout Confirmation Dialog */}
      <LogoutConfirmDialog {...dialogProps} />
    </div>
  );
};

export default AdminLayout;


