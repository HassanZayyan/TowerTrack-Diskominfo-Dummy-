import React, { ReactNode, useState, useEffect, useRef } from 'react';
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
  
  // Hamburger menu state
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Use logout confirmation hook
  const { openDialog, dialogProps } = useLogoutConfirmation({
    variant: 'danger',
    title: 'Konfirmasi Logout Admin',
    message: 'Apakah Anda yakin ingin keluar dari sistem admin?',
    confirmText: 'Ya, Logout',
    cancelText: 'Batal'
  });

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isMenuOpen && 
          menuRef.current && 
          buttonRef.current &&
          !menuRef.current.contains(event.target as Node) &&
          !buttonRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMenuOpen]);

  // Close menu on escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isMenuOpen) {
        setIsMenuOpen(false);
        buttonRef.current?.focus();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isMenuOpen]);

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMenuOpen]);

  // Toggle menu function
  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  // Close menu when navigating
  const handleNavClick = () => {
    setIsMenuOpen(false);
  };

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
    if (routeName === '/admin/fo-management') {
      return currentRoute?.startsWith('Admin/FoManagement') || 
             currentRoute?.startsWith('Admin/FoRoute') || 
             currentUrl.startsWith('/admin/fo-management') ||
             currentUrl.startsWith('/admin/fo-routes');
    }
    
    return currentUrl.startsWith(routeName);
  };



  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f7f7f7' }}>
      <nav className="border-b sticky top-0 z-30" style={{ backgroundColor: '#B71C1C', borderBottomColor: '#FFD700' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Hamburger Button */}
            <button
              ref={buttonRef}
              onClick={toggleMenu}
              className="p-2 rounded-md transition-colors duration-200 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-offset-2 focus:ring-offset-red-800"
              aria-label={isMenuOpen ? 'Tutup menu' : 'Buka menu'}
              aria-expanded={isMenuOpen}
              aria-controls="admin-menu"
            >
              <div className="w-6 h-6 flex flex-col justify-center items-center">
                <span 
                  className={`block h-0.5 w-6 bg-yellow-400 transform transition-all duration-300 ease-in-out ${
                    isMenuOpen ? 'rotate-45 translate-y-1.5' : ''
                  }`}
                />
                <span 
                  className={`block h-0.5 w-6 bg-yellow-400 transform transition-all duration-300 ease-in-out mt-1 ${
                    isMenuOpen ? 'opacity-0' : ''
                  }`}
                />
                <span 
                  className={`block h-0.5 w-6 bg-yellow-400 transform transition-all duration-300 ease-in-out mt-1 ${
                    isMenuOpen ? '-rotate-45 -translate-y-1.5' : ''
                  }`}
                />
              </div>
            </button>
            <Link href="/" className="text-lg font-semibold whitespace-nowrap" style={{ color: '#FFD700' }}>TowerTrack</Link>
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
      </nav>

      {/* Overlay */}
      {isMenuOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity duration-300"
          onClick={() => setIsMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Menu */}
      <div
        ref={menuRef}
        id="admin-menu"
        className={`fixed top-0 left-0 h-full w-80 z-50 transform transition-transform duration-300 ease-in-out ${
          isMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{ backgroundColor: '#B71C1C' }}
        role="navigation"
        aria-label="Menu navigasi admin"
      >
        {/* Menu Header */}
        <div className="flex items-center justify-between p-4 border-b" style={{ borderBottomColor: '#FFD700' }}>
          <h2 className="text-lg font-semibold" style={{ color: '#FFD700' }}>Menu Admin</h2>
          <button
            onClick={() => setIsMenuOpen(false)}
            className="p-2 rounded-md transition-colors duration-200 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-yellow-400"
            aria-label="Tutup menu"
          >
            <svg className="w-5 h-5" style={{ color: '#FFD700' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* User Info */}
        <div className="p-4 border-b" style={{ borderBottomColor: '#FFD700' }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: '#FFD700' }}>
              <span className="text-sm font-semibold" style={{ color: '#B71C1C' }}>
                {user?.name?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <p className="text-sm font-medium" style={{ color: '#FFD700' }}>{user?.name}</p>
              <p className="text-xs" style={{ color: '#FFFFFF' }}>({user?.role})</p>
            </div>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            {user?.role !== 'tower_owner' && (
              <li>
                <Link 
                  href={route('admin.dashboard')} 
                  onClick={handleNavClick}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                    isActive('/admin/dashboard') 
                      ? 'font-semibold shadow-md' 
                      : 'hover:bg-white/10'
                  }`}
                  style={{ 
                    backgroundColor: isActive('/admin/dashboard') ? '#FFD700' : 'transparent',
                    color: isActive('/admin/dashboard') ? '#B71C1C' : '#FFFFFF'
                  }}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v6H8V5z" />
                  </svg>
                  Dashboard
                </Link>
              </li>
            )}
            {user?.role === 'admin' && (
              <li>
                <Link 
                  href={route('admin.users.index')} 
                  onClick={handleNavClick}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                    isActive('/admin/users') 
                      ? 'font-semibold shadow-md' 
                      : 'hover:bg-white/10'
                  }`}
                  style={{ 
                    backgroundColor: isActive('/admin/users') ? '#FFD700' : 'transparent',
                    color: isActive('/admin/users') ? '#B71C1C' : '#FFFFFF'
                  }}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                  </svg>
                  Users
                </Link>
              </li>
            )}
            {user?.role !== 'tower_owner' && (
              <li>
                <Link 
                  href={route('admin.messages.index')}
                  onClick={handleNavClick}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                    isActive('/admin/messages') 
                      ? 'font-semibold shadow-md' 
                      : 'hover:bg-white/10'
                  }`}
                  style={{ 
                    backgroundColor: isActive('/admin/messages') ? '#FFD700' : 'transparent',
                    color: isActive('/admin/messages') ? '#B71C1C' : '#FFFFFF'
                  }}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  Messages
                </Link>
              </li>
            )}
            <li>
              <Link 
                href={route('admin.towers.index')} 
                onClick={handleNavClick}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                  isActive('/admin/towers') 
                    ? 'font-semibold shadow-md' 
                    : 'hover:bg-white/10'
                }`}
                style={{ 
                  backgroundColor: isActive('/admin/towers') ? '#FFD700' : 'transparent',
                  color: isActive('/admin/towers') ? '#B71C1C' : '#FFFFFF'
                }}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                Towers
              </Link>
            </li>
            {(user?.role === 'admin' || user?.role === 'operator') && (
              <li>
                <Link 
                  href={route('admin.fo-management.routes.list')} 
                  onClick={handleNavClick}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                    isActive('/admin/fo-management') 
                      ? 'font-semibold shadow-md' 
                      : 'hover:bg-white/10'
                  }`}
                  style={{ 
                    backgroundColor: isActive('/admin/fo-management') ? '#FFD700' : 'transparent',
                    color: isActive('/admin/fo-management') ? '#B71C1C' : '#FFFFFF'
                  }}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                  </svg>
                  Fiber Optic
                </Link>
              </li>
            )}
          </ul>
        </nav>

        {/* Logout Button in Sidebar */}
        <div className="p-4 border-t" style={{ borderTopColor: '#FFD700' }}>
          <button 
            onClick={() => {
              setIsMenuOpen(false);
              openDialog();
            }}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all duration-200 hover:shadow-md"
            style={{ 
              backgroundColor: '#FF6B6B', 
              color: '#FFFFFF'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#FF5252';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#FF6B6B';
            }}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Logout
          </button>
        </div>
      </div>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {children}
      </main>
      
      {/* Logout Confirmation Dialog */}
      <LogoutConfirmDialog {...dialogProps} />
    </div>
  );
};

export default AdminLayout;


