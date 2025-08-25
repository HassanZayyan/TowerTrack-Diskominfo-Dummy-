import React, { useState } from 'react';
import { Link, usePage } from '@inertiajs/react';
import { useLogoutConfirmation } from '@/Hooks/useLogoutConfirmation';
import LogoutConfirmDialog from '@/Components/LogoutConfirmDialog';

interface AppBarProps {
  currentPage?: string;
}

interface AppBarLink {
  href: string;
  label: string;
  icon: string;
}

const AppBar: React.FC<AppBarProps> = ({ currentPage = '' }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { auth } = usePage().props as any;
  const user = auth?.user;

  // Use logout confirmation hook
  const { openDialog, dialogProps } = useLogoutConfirmation({
    variant: 'warning',
    title: 'Konfirmasi Logout',
    message: 'Apakah Anda yakin ingin keluar dari sistem?',
    confirmText: 'Ya, Logout',
    cancelText: 'Batal'
  });
  
  const links: AppBarLink[] = [
    { href: '/data-tower', label: 'Data Tower', icon: 'cell_tower' },
    { href: '/data-fo', label: 'Jalur FO', icon: 'timeline' },
  ];

  // Add "My Messages" link for all users (authenticated and anonymous)
  const isAdminOrOperator = user && ['admin', 'operator'].includes(user.role);
  if (!isAdminOrOperator) {
    links.push({ href: '/my-messages', label: 'Pesan Saya', icon: 'message' });
  }

  // Show complaint and feedback form links for non-admin/operator users
  // Keep them visible for logged-out users so they are encouraged to log in to submit.
  if (!isAdminOrOperator) {
    links.push({ href: '/complaint', label: 'Kirim Keluhan', icon: 'report_problem' });
    links.push({ href: '/feedback', label: 'Kirim Masukan', icon: 'lightbulb' });
  }

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  // Helper function to get role display text
  const getRoleDisplay = (role: string) => {
    switch (role) {
      case 'admin': return 'Administrator';
      case 'operator': return 'Operator';
      case 'tower_owner': return 'Tower Owner';
      default: return 'User';
    }
  };

  // Helper function to get role icon
  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return 'admin_panel_settings';
      case 'operator': return 'support_agent';
      case 'tower_owner': return 'business';
      default: return 'person';
    }
  };

  return (
    <>
      {/* Desktop & Tablet App Bar */}
      <header className="shadow-md app-bar sticky top-0 z-30" style={{ backgroundColor: '#B71C1C' }}>
        <div className="container mx-auto px-3 sm:px-4 lg:px-6 py-2 sm:py-3">
          <div className="flex justify-between items-center">
            {/* Logo/Brand */}
            <div className="flex items-center">
              <img src="/images/kab-smg-logo.png" alt="Kabupaten Semarang" className="h-8 w-8 mr-3 hidden sm:block" />
              <h1 className="text-2xl font-bold" style={{ color: '#FFD700' }}>TowerTrack</h1>
            </div>

            {/* Right side: nav links + auth - Hidden on small screens, visible on medium and up */}
            <div className="hidden sm:flex items-center gap-2 lg:gap-3">
              <nav className="flex items-center space-x-1 lg:space-x-2">
                {links.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`
                      flex items-center px-2 py-1.5 sm:px-3 sm:py-2 lg:px-4 rounded-lg transition-all duration-200 text-sm lg:text-base
                      ${currentPage === link.href ? 
                        'font-medium shadow-sm' : 
                        'hover:bg-white hover:bg-opacity-10 hover:scale-105'
                      }
                    `}
                    style={currentPage === link.href ? 
                      { backgroundColor: '#FFD700', color: '#212121' } : 
                      { color: 'white' }
                    }
                  >
                    <span className="material-icons-outlined mr-1.5 sm:mr-2 text-base lg:text-lg">{link.icon}</span>
                    <span className="hidden lg:inline">{link.label}</span>
                    <span className="lg:hidden text-xs">{link.label.length > 8 ? link.label.substring(0, 8) + '...' : link.label}</span>
                  </Link>
                ))}
              </nav>

              <div className="w-px h-5 sm:h-6 bg-white/20" />

              <nav className="flex items-center space-x-1 lg:space-x-2">
                {user ? (
                  <>
                    {/* User Role Display - More subtle and elegant */}
                    <div className="flex items-center px-2 py-1.5 rounded-lg bg-white/10 backdrop-blur-sm">
                      <span className="material-icons-outlined mr-1.5 text-sm text-white/80">
                        {getRoleIcon(user.role)}
                      </span>
                      <span className="text-xs text-white/90 font-medium hidden lg:inline">
                        {getRoleDisplay(user.role)}
                      </span>
                      <span className="text-xs text-white/90 font-medium lg:hidden">
                        {user.role === 'admin' ? 'Admin' : 
                         user.role === 'operator' ? 'Op' : 
                         user.role === 'tower_owner' ? 'Owner' : 'User'}
                      </span>
                    </div>

                    {['admin','operator','tower_owner'].includes(user.role) && (
                      <Link 
                        href={user.role === 'tower_owner' ? route('admin.towers.index') : route('admin.dashboard')} 
                        className="flex items-center px-2 py-1.5 sm:px-3 sm:py-2 lg:px-4 rounded-lg transition-all duration-200 hover:bg-white hover:bg-opacity-10 hover:scale-105 text-sm lg:text-base" 
                        style={{ color: 'white' }}
                      >
                        <span className="material-icons-outlined mr-1.5 sm:mr-2 text-base lg:text-lg">
                          {user.role === 'tower_owner' ? 'tower' : 'space_dashboard'}
                        </span>
                        <span className="hidden lg:inline">
                          {user.role === 'tower_owner' ? 'Kelola Tower' : 'Dashboard'}
                        </span>
                        <span className="lg:hidden text-xs">
                          {user.role === 'tower_owner' ? 'Tower' : 'Admin'}
                        </span>
                      </Link>
                    )}
                    <button 
                      onClick={openDialog}
                      className="flex items-center px-2 py-1.5 sm:px-3 sm:py-2 rounded-lg transition-all duration-200 hover:bg-white hover:bg-opacity-10 hover:scale-105 text-sm lg:text-base" 
                      style={{ color: 'white' }}
                    >
                      <span className="material-icons-outlined mr-1.5 sm:mr-2 text-base lg:text-lg">logout</span>
                      <span className="hidden lg:inline">Keluar</span>
                      <span className="lg:hidden text-xs">Logout</span>
                    </button>
                  </>
                ) : (
                  <Link
                    href={route('login')}
                    className="flex items-center px-2 py-1.5 sm:px-3 sm:py-2 lg:px-4 rounded-lg transition-all duration-200 hover:bg-white hover:bg-opacity-10 hover:scale-105 text-sm lg:text-base"
                    style={{ color: 'white' }}
                  >
                    <span className="material-icons-outlined mr-1.5 sm:mr-2 text-base lg:text-lg">login</span>
                    <span className="hidden lg:inline">Masuk</span>
                    <span className="lg:hidden text-xs">Login</span>
                  </Link>
                )}
              </nav>
            </div>

            {/* Mobile menu button - Visible only on small screens */}
            <button 
              className="sm:hidden p-1.5 sm:p-2 rounded-lg hover:bg-white hover:bg-opacity-10 text-white transition-colors duration-200"
              onClick={toggleMobileMenu}
              aria-label="Toggle mobile menu"
            >
              <span className="material-icons-outlined text-xl sm:text-2xl">
                {mobileMenuOpen ? 'close' : 'menu'}
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Navigation Menu - Only visible on small screens */}
      {mobileMenuOpen && (
        <div className="sm:hidden shadow-lg border-t sticky top-[52px] sm:top-[56px] z-20 animate-in slide-in-from-top-2 duration-200" style={{ backgroundColor: '#B71C1C', borderTopColor: '#FFD700' }}>
          <nav className="container mx-auto px-3 sm:px-4 py-2">
            <ul className="space-y-1">
              {links.map((link) => (
                <li key={link.href}>
                  <Link 
                    href={link.href}
                    className={`
                      flex items-center p-3 rounded-lg transition-all duration-200
                      ${currentPage === link.href ? 
                        'font-medium shadow-sm' : 
                        'hover:bg-white hover:bg-opacity-10 active:scale-95'
                      }
                    `}
                    style={currentPage === link.href ? 
                      { backgroundColor: '#FFD700', color: '#212121' } : 
                      { color: 'white' }
                    }
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <span className="material-icons-outlined mr-3 text-lg">{link.icon}</span>
                    <span className="text-base">{link.label}</span>
                  </Link>
                </li>
              ))}
              <li>
                {user ? (
                  <div className="flex flex-col space-y-2 p-3">
                    {/* User Role Display for Mobile */}
                    <div className="flex items-center px-3 py-2 rounded-lg bg-white/10">
                      <span className="material-icons-outlined mr-3 text-lg text-white/80">
                        {getRoleIcon(user.role)}
                      </span>
                      <div className="flex flex-col">
                        <span className="text-white/90 text-sm font-medium">{user.name}</span>
                        <span className="text-white/70 text-xs">{getRoleDisplay(user.role)}</span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      {['admin','operator','tower_owner'].includes(user.role) && (
                        <Link 
                          href={user.role === 'tower_owner' ? route('admin.towers.index') : route('admin.dashboard')} 
                          className="flex items-center p-3 rounded-lg transition-all duration-200 hover:bg-white hover:bg-opacity-10 active:scale-95 text-sm" 
                          style={{ color: 'white' }} 
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          <span className="material-icons-outlined mr-3 text-lg">
                            {user.role === 'tower_owner' ? 'tower' : 'space_dashboard'}
                          </span>
                          <span>
                            {user.role === 'tower_owner' ? 'Kelola Tower' : 'Dashboard Admin'}
                          </span>
                        </Link>
                      )}
                      <button 
                        onClick={() => {
                          setMobileMenuOpen(false);
                          openDialog();
                        }}
                        className="flex items-center px-3 py-2 rounded-lg transition-all duration-200 hover:bg-white hover:bg-opacity-10 active:scale-95 text-sm w-full text-left" 
                        style={{ color: 'white' }}
                      >
                        <span className="material-icons-outlined mr-3 text-lg">logout</span>
                        <span>Keluar</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <Link 
                    href={route('login')}
                    className="flex items-center p-3 rounded-lg transition-all duration-200 hover:bg-white hover:bg-opacity-10 active:scale-95 text-base"
                    style={{ color: 'white' }}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <span className="material-icons-outlined mr-3 text-lg">login</span>
                    <span>Masuk</span>
                  </Link>
                )}
              </li>
            </ul>
          </nav>
        </div>
      )}
      
      {/* Logout Confirmation Dialog */}
      <LogoutConfirmDialog {...dialogProps} />
    </>
  );
};

export default AppBar;
