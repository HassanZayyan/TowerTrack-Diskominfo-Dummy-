import React, { ReactNode, useState, useEffect, useRef } from 'react';
import { Link, usePage } from '@inertiajs/react';
import { useLogoutConfirmation } from '@/Hooks/useLogoutConfirmation';
import LogoutConfirmDialog from '@/Components/LogoutConfirmDialog';
import { cn } from '@/lib/utils';

interface AdminLayoutProps {
  children: ReactNode;
  title?: string;
}

interface AdminNavItem {
  key: string;
  href: string;
  label: string;
  /** SVG path data. Kept as data so the five identical <Link> blocks that used
   *  to be copy-pasted here collapse into one map. */
  path: string;
  strokeWidth?: number;
  visible: (role?: string) => boolean;
}

const NAV_ITEMS: AdminNavItem[] = [
  {
    key: '/admin/dashboard',
    href: 'admin.dashboard',
    label: 'Dashboard',
    path: 'M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2zM8 5a2 2 0 012-2h4a2 2 0 012 2v6H8V5z',
    visible: (role) => role !== 'tower_owner' && role !== 'provider_owner',
  },
  {
    key: '/admin/users',
    href: 'admin.users.index',
    label: 'Pengguna',
    path: 'M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z',
    visible: (role) => role === 'admin',
  },
  {
    key: '/admin/messages',
    href: 'admin.messages.index',
    label: 'Pesan',
    path: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z',
    visible: (role) => role !== 'tower_owner' && role !== 'provider_owner',
  },
  {
    key: '/admin/towers',
    href: 'admin.towers.index',
    label: 'Menara',
    path: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4',
    visible: (role) => role !== 'provider_owner',
  },
  {
    key: '/admin/fo-management',
    href: 'admin.fo-management.routes.list',
    label: 'Fiber Optic',
    path: 'M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7',
    visible: (role) => role === 'admin' || role === 'operator' || role === 'provider_owner',
  },
];

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
      return currentRoute?.startsWith('Admin/Messages') ||
        currentRoute?.startsWith('Admin/Reports') ||
        currentRoute?.startsWith('Admin/Feedback') ||
        currentUrl.startsWith('/admin/messages') ||
        currentUrl.startsWith('/admin/complaints');
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

  const visibleNav = NAV_ITEMS.filter((item) => item.visible(user?.role));

  return (
    <div className="min-h-screen bg-canvas">
      <nav className="sticky top-0 z-30 bg-primary shadow-sm">
        <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            {/* Hamburger Button */}
            <button
              ref={buttonRef}
              onClick={toggleMenu}
              className="p-2 rounded-md text-white transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80 focus-visible:ring-offset-2 focus-visible:ring-offset-primary"
              aria-label={isMenuOpen ? 'Tutup menu' : 'Buka menu'}
              aria-expanded={isMenuOpen}
              aria-controls="admin-menu"
            >
              <div className="w-6 h-6 flex flex-col justify-center items-center">
                <span
                  className={cn(
                    'block h-0.5 w-6 bg-current transition-transform duration-200',
                    isMenuOpen && 'rotate-45 translate-y-1.5',
                  )}
                />
                <span
                  className={cn(
                    'block h-0.5 w-6 bg-current transition-opacity duration-200 mt-1',
                    isMenuOpen && 'opacity-0',
                  )}
                />
                <span
                  className={cn(
                    'block h-0.5 w-6 bg-current transition-transform duration-200 mt-1',
                    isMenuOpen && '-rotate-45 -translate-y-1.5',
                  )}
                />
              </div>
            </button>
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium text-white/85 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80 focus-visible:ring-offset-2 focus-visible:ring-offset-primary"
            >
              <span className="material-icons-outlined text-base">arrow_back</span>
              <span>Kembali ke Web</span>
            </Link>
          </div>
          <div className="flex items-center gap-2 md:gap-4">
            <span className="text-sm text-white/85 hidden sm:inline">
              {user?.name} <span className="text-white/60">({user?.role})</span>
            </span>
            {/* Was #FF6B6B with four imperative e.currentTarget.style mutations for
                hover — which meant no keyboard-focus state at all, and nothing a
                theme could reach. Declarative now. Logout is reversible, so it is
                a quiet action rather than a destructive one. */}
            <button
              onClick={openDialog}
              className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-white/85 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80 focus-visible:ring-offset-2 focus-visible:ring-offset-primary"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span className="hidden sm:inline">Keluar</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Overlay */}
      {isMenuOpen && (
        <div
          className="fixed inset-0 bg-ink-900/50 z-40"
          onClick={() => setIsMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Menu.
          Now a LIGHT surface. A saturated brand panel put the loudest colour in
          the app behind the longest-dwell reading surface, and forced the active
          item to shout even louder to be seen. */}
      <div
        ref={menuRef}
        id="admin-menu"
        className={cn(
          'fixed top-0 left-0 h-full w-80 z-50 flex flex-col bg-sidebar border-r border-sidebar-border',
          'transform transition-transform duration-200 ease-out',
          isMenuOpen ? 'translate-x-0' : '-translate-x-full',
        )}
        role="navigation"
        aria-label="Menu navigasi admin"
      >
        {/* Menu Header */}
        <div className="flex items-center justify-between p-4 border-b border-sidebar-border">
          <h2 className="text-base font-semibold tracking-tight text-foreground">Menu Admin</h2>
          <button
            onClick={() => setIsMenuOpen(false)}
            className="p-2 rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring focus-visible:ring-offset-2"
            aria-label="Tutup menu"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* User Info */}
        <div className="p-4 border-b border-sidebar-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center bg-primary-soft shrink-0">
              <span className="text-sm font-semibold text-primary-strong">
                {user?.name?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{user?.name}</p>
              <p className="text-xs text-muted-foreground">{user?.role}</p>
            </div>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 p-3 overflow-y-auto">
          <ul className="space-y-1">
            {visibleNav.map((item) => {
              const active = isActive(item.key);
              return (
                <li key={item.key}>
                  <Link
                    href={route(item.href)}
                    onClick={handleNavClick}
                    aria-current={active ? 'page' : undefined}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-colors',
                      'focus-visible:outline-none focus-visible:ring focus-visible:ring-offset-2',
                      active
                        ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
                        : 'text-sidebar-foreground hover:bg-accent hover:text-accent-foreground',
                    )}
                  >
                    <svg
                      className={cn('w-5 h-5 shrink-0', active ? 'text-sidebar-primary' : 'text-muted-foreground')}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      strokeWidth={item.strokeWidth ?? 2}
                      aria-hidden="true"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d={item.path} />
                    </svg>
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Logout Button in Sidebar */}
        <div className="p-3 border-t border-sidebar-border">
          <button
            onClick={() => {
              setIsMenuOpen(false);
              openDialog();
            }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium border border-destructive-border text-destructive-strong transition-colors hover:bg-destructive-soft focus-visible:outline-none focus-visible:ring focus-visible:ring-offset-2"
          >
            <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Keluar
          </button>
        </div>
      </div>

      <main
        className="px-3 py-4 sm:px-4 sm:py-6 md:px-6 lg:px-8 overflow-x-hidden"
        style={{ overflowY: 'visible', overflow: 'visible hidden' } as React.CSSProperties}
      >
        {children}
      </main>

      {/* Logout Confirmation Dialog */}
      <LogoutConfirmDialog {...dialogProps} />
    </div>
  );
};

export default AdminLayout;
