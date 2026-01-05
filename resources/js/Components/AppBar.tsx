import React, { useState, useEffect } from 'react';
import { Link, usePage } from '@inertiajs/react';
import { useLogoutConfirmation } from '@/Hooks/useLogoutConfirmation';
import LogoutConfirmDialog from '@/Components/LogoutConfirmDialog';
import Dropdown from '@/Components/Dropdown';

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
  const page = usePage();
  const { auth } = page.props as any;
  const user = auth?.user;
  
  // Get current path - use window.location.pathname directly for immediate value
  const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';
  
  // Track path changes for Inertia navigation
  const [path, setPath] = useState(currentPath);
  useEffect(() => {
    setPath(window.location.pathname);
  }, [(page as any).component, (page as any).url]);
  
  // Check if user is in admin panel
  const isInAdminPanel = path.startsWith('/admin') || currentPath.startsWith('/admin');
  const isStaffRole = user && ['admin', 'operator', 'tower_owner', 'provider_owner'].includes(user.role);
  const showBackToWeb = isInAdminPanel && isStaffRole;

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

  // Add "Pesan Publik" link for all users (including admin/operator)
  // Dynamic label: "Pesan Saya" for authenticated users (complainant/tower_owner), "Pesan Publik" for others
  const isAdminOrOperator = user && ['admin', 'operator'].includes(user.role);
  const messageLabel = user && ['complainant', 'tower_owner'].includes(user.role) ? 'Pesan Saya' : 'Pesan Publik';
  links.push({ href: '/my-messages', label: messageLabel, icon: 'message' });

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
        <div className="container mx-auto px-3 sm:px-3 md:px-4 lg:px-6 py-2 sm:py-2.5 md:py-3">
          <div className="flex justify-between items-center gap-2">
            {/* Logo/Brand - Responsive sizing */}
            <div className="flex items-center shrink-0 min-w-0 logo-container">
              <div className="p-1.5 sm:p-2 md:p-2 lg:p-2 rounded-lg shadow-sm shrink-0 border border-white/20" style={{ backgroundColor: '#FFD700' }}>
                <img 
                  src="/images/kab-smg-logo.png" 
                  alt="Kabupaten Semarang" 
                  className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 lg:h-8 lg:w-8 object-contain"
                  style={{ minWidth: '24px', minHeight: '24px', maxWidth: '100%' }}
                />
              </div>
              {showBackToWeb ? (
                <Link 
                  href="/"
                  className="text-xl sm:text-xl md:text-2xl lg:text-2xl font-bold ml-2 sm:ml-2.5 md:ml-3 lg:ml-3 shrink-0 truncate-responsive hover:opacity-80 transition-opacity duration-200 flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 rounded border-2"
                  style={{ color: '#B71C1C', backgroundColor: '#FFD700', borderColor: '#FFD700' }}
                >
                  <span className="material-icons-outlined text-lg sm:text-xl md:text-xl lg:text-2xl">arrow_back</span>
                  <span>Kembali ke Web</span>
                </Link>
              ) : (
                <h1 className="text-xl sm:text-xl md:text-2xl lg:text-2xl font-bold ml-2 sm:ml-2.5 md:ml-3 lg:ml-3 shrink-0 truncate-responsive" style={{ color: '#FFD700' }}>
                  TowerTrack
                </h1>
              )}
            </div>

            {/* Right side: nav links + auth - Hidden on mobile/tablet, visible on desktop (lg and up) */}
            <div className="hidden lg:flex items-center gap-2 lg:gap-3 min-w-0 flex-1 justify-end">
              <nav className="flex items-center space-x-1 lg:space-x-2 max-w-[55vw] xl:max-w-[60vw] overflow-hidden min-w-0">
                {links.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`
                      flex items-center px-3 py-2 lg:px-4 rounded-lg transition-all duration-200 text-sm lg:text-base whitespace-nowrap shrink-0
                      ${currentPage === link.href ? 
                        'font-medium shadow-sm' : 
                        'hover:bg-white hover:bg-opacity-10 hover:scale-105'
                      }
                    `}
                    style={currentPage === link.href ? 
                      { backgroundColor: '#FFD700', color: '#212121' } : 
                      { backgroundColor: 'transparent', color: '#FFFFFF' }
                    }
                    title={link.label}
                  >
                    <span className="material-icons-outlined mr-2 text-base lg:text-lg shrink-0">{link.icon}</span>
                    <span className="inline-block truncate max-w-[18ch] xl:max-w-[24ch]" title={link.label}>{link.label}</span>
                  </Link>
                ))}
              </nav>

              <div className="w-px h-5 lg:h-6 bg-white/20 shrink-0" />

              <nav className="flex items-center space-x-1 lg:space-x-2 shrink-0">
                {user ? (
                  <>
                    {/* User Profile Dropdown */}
                    <div className="relative shrink-0">
                      <Dropdown>
                        <Dropdown.Trigger>
                          <button className="flex items-center px-3 py-2 rounded-lg transition-all duration-200 hover:opacity-90" style={{ backgroundColor: '#FFD700', color: '#212121' }}>
                            {user.avatar ? (
                              <img 
                                src={`/storage/${user.avatar}`} 
                                alt={user.name}
                                className="w-6 h-6 rounded-full object-cover mr-1.5 border border-white/20 shrink-0"
                                style={{ minWidth: '24px', minHeight: '24px' }}
                              />
                            ) : (
                              <span className="material-icons-outlined mr-1.5 text-sm shrink-0" style={{ color: '#212121' }}>
                                {getRoleIcon(user.role)}
                              </span>
                            )}
                            <span className="text-xs font-medium inline-block max-w-[18ch] truncate" style={{ color: '#212121' }} title={user.name}>
                              {user.name}
                            </span>
                            <svg
                              className="ml-1 h-3 w-3 shrink-0"
                              style={{ color: '#212121' }}
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                            >
                              <path
                                fillRule="evenodd"
                                d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </button>
                        </Dropdown.Trigger>
                        <Dropdown.Content align="right" contentClasses="py-1 shadow-lg bg-red-900 border border-white">
                          <div className="px-4 py-3 border-b border-white">
                            <div className="flex items-center">
                              {user.avatar ? (
                                <img 
                                  src={`/storage/${user.avatar}`} 
                                  alt={user.name}
                                  className="w-10 h-10 rounded-full object-cover mr-3 border border-gray-200"
                                />
                              ) : (
                                <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center mr-3">
                                  <span className="material-icons-outlined text-gray-500 text-lg">
                                    {getRoleIcon(user.role)}
                                  </span>
                                </div>
                              )}
                              <div>
                                <div className="text-sm font-medium text-yellow-400">{user.name}</div>
                                <div className="text-xs text-white">{getRoleDisplay(user.role)}</div>
                              </div>
                            </div>
                          </div>
                          <Dropdown.Link href={route('profile.edit')} className="text-white hover:bg-white/10 transition-colors duration-200">
                            <span className="material-icons-outlined mr-2 text-sm">person</span>
                            Profil
                          </Dropdown.Link>
                        </Dropdown.Content>
                      </Dropdown>
                    </div>

                    {user.role === 'provider_owner' && (
                      <Link 
                        href={route('admin.fo-management.routes.list')} 
                        className="flex-none inline-flex w-fit items-center px-3 py-2 lg:px-4 rounded-lg transition-all duration-200 hover:opacity-90 hover:scale-105 text-sm lg:text-base" 
                        style={{ backgroundColor: '#FFD700', color: '#212121' }}
                      >
                        <span className="material-icons-outlined mr-2 text-base lg:text-lg shrink-0">
                          timeline
                        </span>
                        <span className="inline">
                          Manajemen FO
                        </span>
                      </Link>
                    )}
                    {['admin','operator','tower_owner'].includes(user.role) && user.role !== 'provider_owner' && (
                      <Link 
                        href={user.role === 'tower_owner' ? route('admin.towers.index') : route('admin.dashboard')} 
                        className="flex-none inline-flex w-fit items-center px-3 py-2 lg:px-4 rounded-lg transition-all duration-200 hover:opacity-90 hover:scale-105 text-sm lg:text-base" 
                        style={{ backgroundColor: '#FFD700', color: '#212121' }}
                      >
                        <span className="material-icons-outlined mr-2 text-base lg:text-lg shrink-0">
                          {user.role === 'tower_owner' ? 'cell_tower' : 'space_dashboard'}
                        </span>
                        <span className="inline">
                          {user.role === 'tower_owner' ? 'Kelola Tower' : 'Dashboard'}
                        </span>
                      </Link>
                    )}
                    <button 
                      onClick={openDialog}
                      className="flex-none inline-flex w-fit items-center px-3 py-2 rounded-lg transition-all duration-200 hover:opacity-90 hover:scale-105 text-sm lg:text-base" 
                      style={{ backgroundColor: '#FFD700', color: '#212121' }}
                    >
                      <span className="material-icons-outlined mr-2 text-base lg:text-lg shrink-0">logout</span>
                      <span className="inline">Keluar</span>
                    </button>
                  </>
                ) : (
                  <Link
                    href={route('login')}
                    className="flex items-center px-3 py-2 lg:px-4 rounded-lg transition-all duration-200 hover:bg-white hover:bg-opacity-10 hover:scale-105 text-sm lg:text-base"
                    style={{ backgroundColor: 'transparent', color: '#FFFFFF' }}
                  >
                    <span className="material-icons-outlined mr-2 text-base lg:text-lg shrink-0">login</span>
                    <span className="inline">Masuk</span>
                  </Link>
                )}
              </nav>
            </div>

            {/* Mobile/Tablet menu button - Visible on mobile and tablet, hidden on desktop (lg and up) */}
            <button 
              className="lg:hidden p-1.5 rounded-lg hover:opacity-90 transition-all duration-200 shrink-0"
              style={{ backgroundColor: '#FFD700', color: '#212121' }}
              onClick={toggleMobileMenu}
              aria-label="Toggle mobile menu"
            >
              <span className="material-icons-outlined text-xl">
                {mobileMenuOpen ? 'close' : 'menu'}
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile/Tablet Navigation Menu - Visible on mobile and tablet, hidden on desktop (lg and up) */}
      {mobileMenuOpen && (
        <div className="lg:hidden shadow-lg border-t sticky top-[52px] sm:top-[56px] z-20 animate-in slide-in-from-top-2 duration-200" style={{ backgroundColor: '#B71C1C', borderTopColor: '#FFD700' }}>
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
                      { backgroundColor: 'transparent', color: '#FFFFFF' }
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
                      {user.avatar ? (
                        <img 
                          src={`/storage/${user.avatar}`} 
                          alt={user.name}
                          className="w-8 h-8 rounded-full object-cover mr-3 border border-white/20"
                        />
                      ) : (
                        <span className="material-icons-outlined mr-3 text-lg text-white/80">
                          {getRoleIcon(user.role)}
                        </span>
                      )}
                      <div className="flex flex-col">
                        <span className="text-white/90 text-sm font-medium">{user.name}</span>
                        <span className="text-white/70 text-xs">{getRoleDisplay(user.role)}</span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Link 
                        href={route('profile.edit')}
                        className="flex items-center p-3 rounded-lg transition-all duration-200 hover:opacity-90 active:scale-95 text-sm" 
                        style={{ backgroundColor: '#FFD700', color: '#212121' }} 
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <span className="material-icons-outlined mr-3 text-lg">person</span>
                        <span>Profil</span>
                      </Link>
                      {user.role === 'provider_owner' && (
                        <Link 
                          href={route('admin.fo-management.routes.list')} 
                          className="flex items-center p-3 rounded-lg transition-all duration-200 hover:opacity-90 active:scale-95 text-sm" 
                          style={{ backgroundColor: '#FFD700', color: '#212121' }} 
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          <span className="material-icons-outlined mr-3 text-lg">
                            timeline
                          </span>
                          <span>Manajemen FO</span>
                        </Link>
                      )}
                      {['admin','operator','tower_owner'].includes(user.role) && user.role !== 'provider_owner' && (
                        <Link 
                          href={user.role === 'tower_owner' ? route('admin.towers.index') : route('admin.dashboard')} 
                          className="flex items-center p-3 rounded-lg transition-all duration-200 hover:opacity-90 active:scale-95 text-sm" 
                          style={{ backgroundColor: '#FFD700', color: '#212121' }} 
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          <span className="material-icons-outlined mr-3 text-lg">
                            {user.role === 'tower_owner' ? 'cell_tower' : 'space_dashboard'}
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
                        className="flex items-center px-3 py-2 rounded-lg transition-all duration-200 hover:opacity-90 active:scale-95 text-sm w-full text-left" 
                        style={{ backgroundColor: '#FFD700', color: '#212121' }}
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
                    style={{ backgroundColor: 'transparent', color: '#FFFFFF' }}
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
