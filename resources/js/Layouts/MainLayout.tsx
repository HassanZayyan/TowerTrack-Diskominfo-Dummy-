import React, { ReactNode } from 'react';
import { Head } from '@inertiajs/react';
import AppBar from '@/Components/AppBar';

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
    <div className="min-h-screen bg-gray-100">
      <Head title={title} />
      
      {/* App Bar */}
      <AppBar currentPage={currentPage} />
      
      {/* Main Content */}
      <div className="container mx-auto">
        <main>{children}</main>
      </div>
    </div>
  );
};

export default MainLayout;
