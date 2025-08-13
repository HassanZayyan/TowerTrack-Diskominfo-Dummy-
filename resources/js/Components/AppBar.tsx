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

  // Add complainant-specific link to view submitted messages
  if (user && !['admin', 'operator'].includes(user.role)) {
    links.push({ href: '/my-messages', label: 'Pesan Saya', icon: 'message' });
  }

  // Public complaint form (requires login server-side; keep visible for UX)
  links.push({ href: '/complaint', label: 'Form Keluhan', icon: 'report_problem' });

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <>
      {/* Desktop & Mobile App Bar */}
      <header className="shadow-md app-bar sticky top-0 z-30" style={{ backgroundColor: '#B71C1C' }}>
        <div className="container mx-auto px-4 py-3">
          <div className="flex justify-between items-center">
            {/* Logo/Brand */}
            <div className="flex items-center">
              <img src="/images/kab-smg-logo.png" alt="Kabupaten Semarang" className="h-8 w-8 mr-3 hidden sm:block" />
              <h1 className="text-2xl font-bold" style={{ color: '#FFD700' }}>TowerTrack</h1>
            </div>

            {/* Right side: nav links + auth */}
            <div className="hidden md:flex items-center gap-3">
              <nav className="flex items-center space-x-1">
                {links.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`
                      flex items-center px-4 py-2 rounded-lg transition-colors
                      ${currentPage === link.href ? 
                        'font-medium' : 
                        'hover:bg-white hover:bg-opacity-10'
                      }
                    `}
                    style={currentPage === link.href ? 
                      { backgroundColor: '#FFD700', color: '#212121' } : 
                      { color: 'white' }
                    }
                  >
                    <span className="material-icons-outlined mr-2 text-lg">{link.icon}</span>
                    <span>{link.label}</span>
                  </Link>
                ))}
              </nav>

              <div className="w-px h-6 bg-white/20" />

              <nav className="flex items-center space-x-1">
                {user ? (
                  <>
                    <span className="text-white/90 text-sm">{user.name}</span>
                    {['admin','operator'].includes(user.role) && (
                      <Link href={route('admin.dashboard')} className="flex items-center px-3 py-2 rounded-lg transition-colors hover:bg-white hover:bg-opacity-10" style={{ color: 'white' }}>
                        <span className="material-icons-outlined mr-2 text-lg">space_dashboard</span>
                        <span>Dashboard</span>
                      </Link>
                    )}
                    <Link href={route('logout')} method="post" as="button" className="flex items-center px-3 py-2 rounded-lg transition-colors hover:bg-white hover:bg-opacity-10" style={{ color: 'white' }}>
                      <span className="material-icons-outlined mr-2 text-lg">logout</span>
                      <span>Keluar</span>
                    </Link>
                  </>
                ) : (
                  <Link
                    href={route('login')}
                    className="flex items-center px-4 py-2 rounded-lg transition-colors hover:bg-white hover:bg-opacity-10"
                    style={{ color: 'white' }}
                  >
                    <span className="material-icons-outlined mr-2 text-lg">login</span>
                    <span>Masuk</span>
                  </Link>
                )}
              </nav>
            </div>

            {/* Mobile menu button */}
            <button 
              className="md:hidden p-2 rounded-lg hover:bg-white hover:bg-opacity-10 text-white"
              onClick={toggleMobileMenu}
            >
              <span className="material-icons-outlined">
                {mobileMenuOpen ? 'close' : 'menu'}
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Navigation Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden shadow-md border-t sticky top-[56px] z-20" style={{ backgroundColor: '#B71C1C', borderTopColor: '#FFD700' }}>
          <nav className="container mx-auto px-4 py-2">
            <ul className="space-y-1">
              {links.map((link) => (
                <li key={link.href}>
                  <Link 
                    href={link.href}
                    className={`
                      flex items-center p-3 rounded-lg transition-colors
                      ${currentPage === link.href ? 
                        'font-medium' : 
                        'hover:bg-white hover:bg-opacity-10'
                      }
                    `}
                    style={currentPage === link.href ? 
                      { backgroundColor: '#FFD700', color: '#212121' } : 
                      { color: 'white' }
                    }
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <span className="material-icons-outlined mr-3 text-lg">{link.icon}</span>
                    <span>{link.label}</span>
                  </Link>
                </li>
              ))}
              <li>
                {user ? (
                  <div className="flex items-center justify-between p-3">
                    <span className="text-white/90 text-sm">{user.name}</span>
                    <div className="flex gap-2">
                      {['admin','operator'].includes(user.role) && (
                        <Link href={route('admin.dashboard')} className="flex items-center px-3 py-2 rounded-lg transition-colors hover:bg-white hover:bg-opacity-10" style={{ color: 'white' }} onClick={() => setMobileMenuOpen(false)}>
                          <span className="material-icons-outlined mr-2 text-lg">space_dashboard</span>
                          <span>Dashboard</span>
                        </Link>
                      )}
                      <Link href={route('logout')} method="post" as="button" className="flex items-center px-3 py-2 rounded-lg transition-colors hover:bg-white hover:bg-opacity-10" style={{ color: 'white' }} onClick={() => setMobileMenuOpen(false)}>
                        <span className="material-icons-outlined mr-2 text-lg">logout</span>
                        <span>Keluar</span>
                      </Link>
                    </div>
                  </div>
                ) : (
                  <Link 
                    href={route('login')}
                    className="flex items-center p-3 rounded-lg transition-colors hover:bg-white hover:bg-opacity-10"
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
