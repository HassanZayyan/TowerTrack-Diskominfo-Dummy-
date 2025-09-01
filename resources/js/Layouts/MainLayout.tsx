import React, { ReactNode } from 'react';
import { Head } from '@inertiajs/react';
import AppBar from '@/Components/AppBar';
import Footer from '@/Components/Footer';

interface MainLayoutProps {
  children: ReactNode;
  title?: string;
  currentPage?: string;
}

const MainLayout: React.FC<MainLayoutProps> = ({ 
  children, 
  title = 'TowerTrack',
  currentPage = '' 
}) => {
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <Head title={title} />
      
      {/* App Bar */}
      <AppBar currentPage={currentPage} />
      
      {/* Main Content */}
      <div className="mx-auto max-w-screen-2xl px-4 sm:px-6 lg:px-8 flex-1 w-full">
        <main className="py-6">{children}</main>
      </div>
      
      {/* Footer - Full Width */}
       <Footer />
    </div>
  );
}

export default MainLayout;
