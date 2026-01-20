import React, { ReactNode } from 'react';
import { Head } from '@inertiajs/react';
import AppBar from '@/Components/AppBar';
import Footer from '@/Components/Footer';

interface MainLayoutProps {
  children: ReactNode;
  title?: string;
  currentPage?: string;
  headerSlot?: ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({
  children,
  title = 'TowerTrack',
  currentPage = '',
  headerSlot
}) => {
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <Head title={title} />

      {/* App Bar */}
      <AppBar currentPage={currentPage} />

      {/* Optional Full Width Header Slot */}
      {headerSlot}

      {/* Main Content */}
      <div className="mx-auto max-w-screen-2xl px-3 sm:px-4 md:px-6 lg:px-8 flex-1 w-full">
        <main className="py-4 sm:py-6">{children}</main>
      </div>

      {/* Footer - Full Width */}
      <Footer />
    </div>
  );
}

export default MainLayout;
