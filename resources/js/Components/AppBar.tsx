import React, { useState } from 'react';
import { Link } from '@inertiajs/react';

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
  
  const links: AppBarLink[] = [
    { href: '/data-tower', label: 'Data Tower', icon: 'cell_tower' },
    { href: '/complaint', label: 'Form Keluhan', icon: 'report_problem' },
  ];

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <>
      {/* Desktop & Mobile App Bar */}
      <header className="shadow-md app-bar" style={{ backgroundColor: '#B71C1C' }}>
        <div className="container mx-auto px-4 py-3">
          <div className="flex justify-between items-center">
            {/* Logo/Brand */}
            <div className="flex items-center">
              <h1 className="text-2xl font-bold" style={{ color: '#FFD700' }}>TowerTrack</h1>
              <p className="hidden md:block ml-3 text-sm text-white opacity-90">Sistem Monitoring Tower</p>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-1">
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
        <div className="md:hidden shadow-md border-t" style={{ backgroundColor: '#B71C1C', borderTopColor: '#FFD700' }}>
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
            </ul>
          </nav>
        </div>
      )}
    </>
  );
};

export default AppBar;
