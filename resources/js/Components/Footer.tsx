import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-red-800 text-white text-center py-6 mt-8" style={{ backgroundColor: '#B71C1C' }}>
      <div className="container mx-auto px-4">
        <h3 className="text-xl font-semibold mb-2 text-yellow-400" style={{ color: '#FFD700' }}>TowerTrack</h3>
        <p className="text-base opacity-90">© 2025 Sistem Monitoring Tower Telekomunikasi. All rights reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;
