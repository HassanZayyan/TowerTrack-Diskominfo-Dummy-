import React from 'react';
import { Link } from '@inertiajs/react';

interface SidebarProps {
  currentPage?: string;
}

interface SidebarLink {
  href: string;
  label: string;
  icon: string;
}

const Sidebar: React.FC<SidebarProps> = ({ currentPage = '' }) => {
  const links: SidebarLink[] = [
    { href: '/tower-map', label: 'Peta Tower', icon: 'map' },
    { href: '/complaint', label: 'Form Keluhan', icon: 'message-report' },
  ];

  return (
    <div className="sidebar bg-white shadow-md p-4 h-full min-h-screen">
      <div className="sidebar-header mb-6">
        <h2 className="text-2xl font-bold" style={{ color: '#B71C1C' }}>TowerTrack</h2>
        <p className="text-sm text-gray-500">Sistem Monitoring Tower</p>
      </div>

      <nav className="sidebar-nav">
        <ul className="space-y-2">
          {links.map((link) => (
            <li key={link.href}>
              <Link 
                href={link.href}
                className={`
                  flex items-center p-3 rounded-lg transition-colors
                  ${currentPage === link.href ? 
                    'bg-red-50 font-medium' : 
                    'hover:bg-gray-100 text-gray-700'
                  }
                `}
              >
                <span className="material-icons-outlined mr-3 text-lg">{link.icon}</span>
                <span>{link.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
};

export default Sidebar;
