import React, { useState } from 'react';
import { Link, usePage } from '@inertiajs/react';

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
  
  const links: AppBarLink[] = [
    { href: '/data-tower', label: 'Data Tower', icon: 'cell_tower' },
  ];

  // Add links only for non-staff users (regular complainants)
  const isStaff = user && ['admin', 'operator'].includes(user.role);
  if (user && !isStaff) {
    links.push({ href: '/my-messages', label: 'Pesan Saya', icon: 'message' });
  }

  // Show complaint form link when user is not staff.
  // Keep it visible for logged-out users so they are encouraged to log in to submit.
  if (!isStaff) {
    links.push({ href: '/complaint', label: 'Kirim Keluhan', icon: 'report_problem' });
    links.push({ href: '/feedback', label: 'Kirim Masukan', icon: 'lightbulb' });
  }

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <>
      {/* Desktop & Tablet App Bar */}
      <header className="shadow-md app-bar sticky top-0 z-30" style={{ backgroundColor: '#B71C1C' }}>
        <div className="container mx-auto px-3 sm:px-4 lg:px-6 py-2 sm:py-3">
          <div className="flex justify-between items-center">
            {/* Logo/Brand */}
            <div className="flex items-center">
              <img src="/images/dprd-logo.png" alt="DPRD Kabupaten Semarang" className="h-6 w-6 sm:h-8 sm:w-8 mr-2 sm:mr-3" />
              <h1 className="text-lg sm:text-xl lg:text-2xl font-bold" style={{ color: '#FFD700' }}>TowerTrack</h1>
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
                    <span className="text-white/90 text-xs sm:text-sm lg:text-base hidden sm:block">{user.name}</span>
                    {['admin','operator'].includes(user.role) && (
                      <Link href={route('admin.dashboard')} className="flex items-center px-2 py-1.5 sm:px-3 sm:py-2 rounded-lg transition-all duration-200 hover:bg-white hover:bg-opacity-10 hover:scale-105 text-sm lg:text-base" style={{ color: 'white' }}>
                        <span className="material-icons-outlined mr-1.5 sm:mr-2 text-base lg:text-lg">space_dashboard</span>
                        <span className="hidden lg:inline">Dashboard</span>
                        <span className="lg:hidden text-xs">Admin</span>
                      </Link>
                    )}
                    <Link href={route('logout')} method="post" as="button" className="flex items-center px-2 py-1.5 sm:px-3 sm:py-2 rounded-lg transition-all duration-200 hover:bg-white hover:bg-opacity-10 hover:scale-105 text-sm lg:text-base" style={{ color: 'white' }}>
                      <span className="material-icons-outlined mr-1.5 sm:mr-2 text-base lg:text-lg">logout</span>
                      <span className="hidden lg:inline">Keluar</span>
                      <span className="lg:hidden text-xs">Logout</span>
                    </Link>
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
                    <div className="flex items-center justify-between">
                      <span className="text-white/90 text-sm font-medium">{user.name}</span>
                    </div>
                    <div className="flex flex-col gap-2">
                      {['admin','operator'].includes(user.role) && (
                        <Link href={route('admin.dashboard')} className="flex items-center px-3 py-2 rounded-lg transition-all duration-200 hover:bg-white hover:bg-opacity-10 active:scale-95 text-sm" style={{ color: 'white' }} onClick={() => setMobileMenuOpen(false)}>
                          <span className="material-icons-outlined mr-3 text-lg">space_dashboard</span>
                          <span>Dashboard Admin</span>
                        </Link>
                      )}
                      <Link href={route('logout')} method="post" as="button" className="flex items-center px-3 py-2 rounded-lg transition-all duration-200 hover:bg-white hover:bg-opacity-10 active:scale-95 text-sm" style={{ color: 'white' }} onClick={() => setMobileMenuOpen(false)}>
                        <span className="material-icons-outlined mr-3 text-lg">logout</span>
                        <span>Keluar</span>
                      </Link>
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
    </>
  );
};

export default AppBar;
