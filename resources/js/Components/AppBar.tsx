import React, { useState, useEffect } from 'react';
import { Link, usePage } from '@inertiajs/react';
import { useLogoutConfirmation } from '@/Hooks/useLogoutConfirmation';
import LogoutConfirmDialog from '@/Components/LogoutConfirmDialog';
import Dropdown from '@/Components/Dropdown';
import { cn } from '@/lib/utils';

interface AppBarProps {
  currentPage?: string;
}

interface AppBarLink {
  href: string;
  label: string;
  icon: string;
}

/* ---------------------------------------------------------------------------
   Action hierarchy on the bar.

   The previous version painted the SAME gold chip (#FFD700 on #212121) on the
   active nav link, the profile trigger, the dashboard link, the logout button
   and the mobile menu toggle — nine times in the desktop bar alone. When "you
   are here", "click me" and "log out" all look identical there is no hierarchy
   left to read.

   Now there is exactly one loud element per bar: `cta`, the solid white pill
   that takes you into the workspace. Everything else is a translucent white
   wash, which reads as chrome rather than as an invitation.

   Focus states are new. The entire public shell previously contained zero
   `focus:` rules, so keyboard users had no visible position at all.
--------------------------------------------------------------------------- */
const onBrand = {
  base:
    'inline-flex items-center rounded-lg text-sm transition-colors ' +
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80 ' +
    'focus-visible:ring-offset-2 focus-visible:ring-offset-primary',
  quiet: 'text-white/85 hover:bg-white/10 hover:text-white',
  active: 'bg-white/15 text-white font-medium',
  cta: 'bg-white text-primary font-medium hover:bg-white/90',
};

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
    // `/` is a real page now, not a redirect into /data-tower, so it needs a way
    // back. Without this the landing was reachable only by typing the URL: the
    // brand was a plain <h1>, and the sole href="/" on the bar was the
    // admin-only "Kembali ke Web".
    { href: '/', label: 'Beranda', icon: 'home' },
    { href: '/data-tower', label: 'Data Menara', icon: 'cell_tower' },
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
      case 'tower_owner': return 'Pemilik Menara';
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

  // The one workspace entry point, resolved per role. Rendered as the single
  // `cta` on the bar so it is unambiguous which action is primary.
  const workspaceLink = !user
    ? null
    : user.role === 'provider_owner'
      ? { href: route('admin.fo-management.routes.list'), icon: 'timeline', label: 'Manajemen FO' }
      : ['admin', 'operator', 'tower_owner'].includes(user.role)
        ? {
            href: user.role === 'tower_owner' ? route('admin.towers.index') : route('admin.dashboard'),
            icon: user.role === 'tower_owner' ? 'cell_tower' : 'space_dashboard',
            label: user.role === 'tower_owner' ? 'Kelola Menara' : 'Dashboard',
          }
        : null;

  return (
    <>
      {/* Desktop & Tablet App Bar */}
      <header className="app-bar sticky top-0 z-30 bg-primary shadow-sm">
        <div className="container mx-auto px-3 sm:px-3 md:px-4 lg:px-6 py-2 sm:py-2.5 md:py-3">
          <div className="flex justify-between items-center gap-2">
            {/* Logo/Brand - Responsive sizing.

                The wordmark used to be a bare <h1>: not clickable, and a second
                top-level heading on every page that already had one of its own.
                It is a link to the landing page now, which is both the
                convention every reader already expects from a site header and
                the fix for the duplicate heading. */}
            <div className="flex items-center shrink-0 min-w-0 logo-container">
              <div className="p-1.5 sm:p-2 rounded-lg shrink-0 bg-white">
                <img
                  src="/images/kab-smg-logo.webp"
                  alt="Kabupaten Semarang"
                  className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 object-contain"
                  style={{ minWidth: '24px', minHeight: '24px', maxWidth: '100%' }}
                />
              </div>
              {showBackToWeb ? (
                <Link
                  href="/"
                  className={cn(onBrand.base, onBrand.quiet, 'ml-2 sm:ml-3 gap-2 px-3 py-1.5 shrink-0')}
                >
                  <span className="material-icons-outlined text-lg">arrow_back</span>
                  <span className="font-medium">Kembali ke Web</span>
                </Link>
              ) : (
                <Link
                  href="/"
                  aria-label="TowerTrack, beranda"
                  className={cn(
                    onBrand.base,
                    'ml-2 sm:ml-3 shrink-0 px-1 text-xl md:text-2xl font-bold tracking-tight text-white',
                    'truncate-responsive hover:text-white/90',
                  )}
                >
                  TowerTrack
                </Link>
              )}
            </div>

            {/* Right side: nav links + auth - Hidden on mobile/tablet, visible on desktop (lg and up) */}
            <div className="hidden lg:flex items-center gap-2 lg:gap-3 min-w-0 flex-1 justify-end">
              <nav className="flex items-center gap-1 max-w-[55vw] xl:max-w-[60vw] overflow-hidden min-w-0">
                {links.map((link) => {
                  const isActive = currentPage === link.href;
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      aria-current={isActive ? 'page' : undefined}
                      className={cn(
                        onBrand.base,
                        isActive ? onBrand.active : onBrand.quiet,
                        'px-3 py-2 lg:px-4 whitespace-nowrap shrink-0',
                      )}
                      title={link.label}
                    >
                      <span className="material-icons-outlined mr-2 text-base lg:text-lg shrink-0">{link.icon}</span>
                      <span className="inline-block truncate max-w-[18ch] xl:max-w-[24ch]">{link.label}</span>
                    </Link>
                  );
                })}
              </nav>

              <div className="w-px h-6 bg-white/20 shrink-0" />

              <nav className="flex items-center gap-2 shrink-0">
                {user ? (
                  <>
                    {/* User Profile Dropdown */}
                    <div className="relative shrink-0">
                      <Dropdown>
                        <Dropdown.Trigger>
                          <button className={cn(onBrand.base, 'bg-white/10 text-white hover:bg-white/20 px-3 py-2')}>
                            {user.avatar ? (
                              <img
                                src={`/storage/${user.avatar}`}
                                alt=""
                                className="w-6 h-6 rounded-full object-cover mr-2 shrink-0"
                                style={{ minWidth: '24px', minHeight: '24px' }}
                              />
                            ) : (
                              <span className="material-icons-outlined mr-2 text-base shrink-0">
                                {getRoleIcon(user.role)}
                              </span>
                            )}
                            <span className="text-sm font-medium inline-block max-w-[18ch] truncate" title={user.name}>
                              {user.name}
                            </span>
                            <svg
                              className="ml-1.5 h-3.5 w-3.5 shrink-0 text-white/70"
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                              aria-hidden="true"
                            >
                              <path
                                fillRule="evenodd"
                                d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </button>
                        </Dropdown.Trigger>
                        <Dropdown.Content align="right" contentClasses="py-1 bg-popover border border-border shadow-md">
                          <div className="px-4 py-3 border-b border-border">
                            <div className="flex items-center">
                              {user.avatar ? (
                                <img
                                  src={`/storage/${user.avatar}`}
                                  alt=""
                                  className="w-10 h-10 rounded-full object-cover mr-3 border border-border"
                                />
                              ) : (
                                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center mr-3">
                                  <span className="material-icons-outlined text-muted-foreground text-lg">
                                    {getRoleIcon(user.role)}
                                  </span>
                                </div>
                              )}
                              <div className="min-w-0">
                                <div className="text-sm font-medium text-popover-foreground truncate">{user.name}</div>
                                <div className="text-xs text-muted-foreground">{getRoleDisplay(user.role)}</div>
                              </div>
                            </div>
                          </div>
                          <Dropdown.Link href={route('profile.edit')} className="text-popover-foreground hover:bg-accent transition-colors">
                            <span className="material-icons-outlined mr-2 text-sm align-middle">person</span>
                            Profil
                          </Dropdown.Link>
                        </Dropdown.Content>
                      </Dropdown>
                    </div>

                    {workspaceLink && (
                      <Link
                        href={workspaceLink.href}
                        className={cn(onBrand.base, onBrand.cta, 'px-3 py-2 lg:px-4 shrink-0')}
                      >
                        <span className="material-icons-outlined mr-2 text-base lg:text-lg shrink-0">
                          {workspaceLink.icon}
                        </span>
                        <span>{workspaceLink.label}</span>
                      </Link>
                    )}

                    <button
                      onClick={openDialog}
                      className={cn(onBrand.base, onBrand.quiet, 'px-3 py-2 shrink-0')}
                    >
                      <span className="material-icons-outlined mr-2 text-base lg:text-lg shrink-0">logout</span>
                      <span>Keluar</span>
                    </button>
                  </>
                ) : (
                  <Link href={route('login')} className={cn(onBrand.base, onBrand.cta, 'px-4 py-2')}>
                    <span className="material-icons-outlined mr-2 text-base lg:text-lg shrink-0">login</span>
                    <span>Masuk</span>
                  </Link>
                )}
              </nav>
            </div>

            {/* Mobile/Tablet menu button - Visible on mobile and tablet, hidden on desktop (lg and up) */}
            <button
              className={cn(onBrand.base, onBrand.quiet, 'lg:hidden p-2 shrink-0')}
              onClick={toggleMobileMenu}
              aria-label="Buka menu navigasi"
              aria-expanded={mobileMenuOpen}
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
        <div className="lg:hidden sticky top-[52px] sm:top-[56px] z-20 bg-primary border-t border-white/15 shadow-md">
          <nav className="container mx-auto px-3 sm:px-4 py-2">
            <ul className="space-y-1">
              {links.map((link) => {
                const isActive = currentPage === link.href;
                return (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      aria-current={isActive ? 'page' : undefined}
                      className={cn(
                        onBrand.base,
                        isActive ? onBrand.active : onBrand.quiet,
                        'w-full p-3 text-base',
                      )}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <span className="material-icons-outlined mr-3 text-lg">{link.icon}</span>
                      <span>{link.label}</span>
                    </Link>
                  </li>
                );
              })}
              <li>
                {user ? (
                  <div className="flex flex-col gap-2 p-3">
                    {/* User Role Display for Mobile */}
                    <div className="flex items-center px-3 py-2 rounded-lg bg-white/10">
                      {user.avatar ? (
                        <img
                          src={`/storage/${user.avatar}`}
                          alt=""
                          className="w-8 h-8 rounded-full object-cover mr-3"
                        />
                      ) : (
                        <span className="material-icons-outlined mr-3 text-lg text-white/80">
                          {getRoleIcon(user.role)}
                        </span>
                      )}
                      <div className="flex flex-col min-w-0">
                        <span className="text-white text-sm font-medium truncate">{user.name}</span>
                        <span className="text-white/70 text-xs">{getRoleDisplay(user.role)}</span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      {workspaceLink && (
                        <Link
                          href={workspaceLink.href}
                          className={cn(onBrand.base, onBrand.cta, 'w-full p-3')}
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          <span className="material-icons-outlined mr-3 text-lg">{workspaceLink.icon}</span>
                          <span>{workspaceLink.label}</span>
                        </Link>
                      )}
                      <Link
                        href={route('profile.edit')}
                        className={cn(onBrand.base, onBrand.quiet, 'w-full p-3')}
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <span className="material-icons-outlined mr-3 text-lg">person</span>
                        <span>Profil</span>
                      </Link>
                      <button
                        onClick={() => {
                          setMobileMenuOpen(false);
                          openDialog();
                        }}
                        className={cn(onBrand.base, onBrand.quiet, 'w-full p-3 text-left')}
                      >
                        <span className="material-icons-outlined mr-3 text-lg">logout</span>
                        <span>Keluar</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <Link
                    href={route('login')}
                    className={cn(onBrand.base, onBrand.cta, 'w-full p-3 text-base')}
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
