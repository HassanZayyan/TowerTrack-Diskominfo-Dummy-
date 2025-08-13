import React, { useState } from 'react';

interface TowerDetailProps {
  isOpen: boolean;
  onClose: () => void;
  tower: any;
  onViewMap: (tower: any) => void;
}

const TowerDetailModal: React.FC<TowerDetailProps> = ({ 
  isOpen, 
  onClose, 
  tower,
  onViewMap
}) => {
  const [selectedDetail, setSelectedDetail] = useState<string>('-- Pilih Detail --');
  
  if (!isOpen || !tower) return null;
  
  // Available tower information fields based on database columns
  const availableFields = [
    { id: 'id', label: 'ID Tower' },
    { id: 'site_name', label: 'Nama Tower' },
    { id: 'owner', label: 'Pemilik/Owner' },
    { id: 'site_id', label: 'Site ID' },
    { id: 'site_sap', label: 'Site SAP' },
    { id: 'latitude', label: 'Koordinat Latitude' },
    { id: 'longitude', label: 'Koordinat Longitude' },
    { id: 'tinggi_menara', label: 'Tinggi Menara (m)' },
    { id: 'tinggi_bangunan', label: 'Tinggi Bangunan (m)' },
    { id: 'jumlah_pengguna', label: 'Jumlah Pengguna' },
    { id: 'jumlah_kaki', label: 'Jumlah Kaki/Legs' },
    { id: 'alamat_menara', label: 'Alamat Tower' },
    { id: 'tower_type', label: 'Tower Type' },
    { id: 'site_type', label: 'Tipe Site' },
    { id: 'no_ijin', label: 'Nomor Ijin' },
    { id: 'tanggal_ijin', label: 'Tanggal Ijin' },
    { id: 'berlaku_hingga', label: 'Berlaku Hingga' },
    { id: 'jenis_ijin', label: 'Jenis Ijin (IMB/PBG)' },
    { id: 'status', label: 'Status Ijin' },
    { id: 'prs', label: 'PRS' },
    { id: 'semua_detail', label: 'Semua Detail Tower' }
  ];
  
  const handleDetailChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedDetail(e.target.value);
  };
  
  const handleDownloadReport = () => {
    // Generate report content with all available fields
    const reportContent = [];
    reportContent.push(`Detail Tower - ${tower.site_name}`);
    
    // Add all fields from availableFields except 'semua_detail'
    availableFields
      .filter(field => field.id !== 'semua_detail')
      .forEach(field => {
        let value = tower[field.id] || 'N/A';
        if (field.id === 'tinggi_menara' || field.id === 'tinggi_bangunan') {
          value = tower[field.id] ? `${tower[field.id]} meter` : 'N/A';
        }
        reportContent.push(`${field.label}: ${value}`);
      });
    
    // Create blob and download
    const blob = new Blob([reportContent.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = `tower_${tower.id}_${tower.site_name}.txt`;
    link.href = url;
    link.click();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3 sm:p-4" role="dialog" aria-modal="true">
      <div className="bg-white rounded-xl shadow-lg w-full sm:max-w-xl lg:max-w-2xl max-h-[85vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="text-white p-4 flex items-center" style={{ backgroundColor: '#B71C1C' }}>
          <span className="material-icons-outlined mr-2" style={{ color: '#FFD700' }}>info</span>
          <h3 className="text-base sm:text-lg font-semibold leading-tight" style={{ color: '#FFD700' }}>Detail Tower - {tower.site_name}</h3>
        </div>
        
        {/* Body */}
        <div className="p-4 sm:p-6 overflow-auto flex-1">
          <div className="mb-4 sm:mb-6">
            <label className="block text-gray-700 mb-2 text-sm">Pilih Informasi yang Ingin Dilihat:</label>
            <select 
              value={selectedDetail}
              onChange={handleDetailChange}
              className="w-full p-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent focus:outline-none"
              style={{ '--tw-ring-color': '#B71C1C' } as React.CSSProperties}
            >
              <option>-- Pilih Detail --</option>
              {availableFields.map(field => (
                <option key={field.id} value={field.id}>{field.label}</option>
              ))}
            </select>
          </div>
          
          {selectedDetail !== '-- Pilih Detail --' && (
            <div className="bg-gray-50 p-3 sm:p-4 rounded-lg border">
              <h4 className="font-medium mb-2 text-sm sm:text-base">{availableFields.find(f => f.id === selectedDetail)?.label}:</h4>
              {selectedDetail === 'semua_detail' ? (
                <div className="space-y-2">
                  {availableFields.filter(f => f.id !== 'semua_detail').map(field => (
                    <div key={field.id} className="border-b pb-2 last:border-b-0">
                      <h5 className="text-xs sm:text-sm font-medium text-gray-600">{field.label}:</h5>
                      <p className="text-sm sm:text-base break-words">
                        {field.id === 'tinggi_menara' || field.id === 'tinggi_bangunan'
                          ? tower[field.id] ? `${tower[field.id]} meter` : 'Belum Terdata'
                          : tower[field.id] || 'Belum Terdata'}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm sm:text-lg break-words">
                  {selectedDetail === 'tinggi_menara' || selectedDetail === 'tinggi_bangunan'
                    ? tower[selectedDetail] ? `${tower[selectedDetail]} meter` : 'Belum Terdata'
                    : tower[selectedDetail] || 'Belum Terdata'}
                </p>
              )}
            </div>
          )}
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 sm:mt-6">
            <div className="min-w-0">
              <h4 className="font-medium text-sm text-gray-700">ID</h4>
              <p className="text-sm break-words">{tower.id}</p>
            </div>
            <div className="min-w-0">
              <h4 className="font-medium text-sm text-gray-700">Nama Tower</h4>
              <p className="text-sm break-words">{tower.site_name || 'Belum Terdata'}</p>
            </div>
            <div className="min-w-0">
              <h4 className="font-medium text-sm text-gray-700">Owner</h4>
              <p className="text-sm break-words">{tower.owner || 'Belum Terdata'}</p>
            </div>
            <div className="min-w-0">
              <h4 className="font-medium text-sm text-gray-700">Koordinat</h4>
              <p className="text-sm">
                Lat: {typeof tower.latitude === 'number' ? tower.latitude.toFixed(6) : tower.latitude || 'Belum Terdata'}<br/>
                Lng: {typeof tower.longitude === 'number' ? tower.longitude.toFixed(6) : tower.longitude || 'Belum Terdata'}
              </p>
            </div>
            <div className="min-w-0">
              <h4 className="font-medium text-sm text-gray-700">Status</h4>
              <span 
                className="inline-block px-3 py-1 rounded-full text-xs font-medium text-white"
                style={{ 
                  backgroundColor: tower.status === 'Aktif' || tower.status === 'AKTIF' 
                    ? '#1B5E20' 
                    : !tower.status 
                      ? '#6B7280' 
                      : '#212121'
                }}
              >
                {tower.status || 'Belum Terdata'}
              </span>
            </div>
          </div>
        </div>
        
        {/* Footer with actions */}
        <div className="p-3 sm:p-4 border-t flex flex-col sm:flex-row sm:justify-between gap-2 sm:gap-3">
          <button 
            onClick={() => onViewMap(tower)} 
            className="text-white px-4 py-2 rounded-lg flex items-center justify-center hover:opacity-90 w-full sm:w-auto"
            style={{ backgroundColor: '#1B5E20' }}
          >
            <span className="material-icons-outlined mr-1">place</span>
            Lihat di Peta
          </button>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
            <button 
              onClick={onClose} 
              className="text-white px-4 py-2 rounded-lg flex items-center justify-center hover:opacity-90 w-full sm:w-auto"
              style={{ backgroundColor: '#212121' }}
            >
              <span className="material-icons-outlined mr-1">close</span>
              Tutup
            </button>
            <button 
              onClick={handleDownloadReport}
              className="text-white px-4 py-2 rounded-lg flex items-center justify-center hover:opacity-90 w-full sm:w-auto"
              style={{ backgroundColor: '#B71C1C' }}
            >
              <span className="material-icons-outlined mr-1" style={{ color: '#FFD700' }}>download</span>
              Download Report
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TowerDetailModal;
