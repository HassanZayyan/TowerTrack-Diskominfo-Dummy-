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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="bg-purple-500 text-white p-4 rounded-t-lg flex items-center">
          <span className="material-icons mr-2">info</span>
          <h3 className="text-xl font-semibold">Detail Tower - {tower.site_name}</h3>
        </div>
        
        {/* Body */}
        <div className="p-6 overflow-auto flex-1">
          <div className="mb-6">
            <label className="block text-gray-700 mb-2">Pilih Informasi yang Ingin Dilihat:</label>
            <select 
              value={selectedDetail}
              onChange={handleDetailChange}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option>-- Pilih Detail --</option>
              {availableFields.map(field => (
                <option key={field.id} value={field.id}>{field.label}</option>
              ))}
            </select>
          </div>
          
          {selectedDetail !== '-- Pilih Detail --' && (
            <div className="bg-gray-50 p-4 rounded-lg border">
              <h4 className="font-medium mb-2">{availableFields.find(f => f.id === selectedDetail)?.label}:</h4>
              {selectedDetail === 'semua_detail' ? (
                <div className="space-y-2">
                  {availableFields.filter(f => f.id !== 'semua_detail').map(field => (
                    <div key={field.id} className="border-b pb-2 last:border-b-0">
                      <h5 className="text-sm font-medium text-gray-600">{field.label}:</h5>
                      <p className="text-base">
                        {field.id === 'tinggi_menara' || field.id === 'tinggi_bangunan'
                          ? tower[field.id] ? `${tower[field.id]} meter` : 'N/A'
                          : tower[field.id] || 'N/A'}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-lg">
                  {selectedDetail === 'tinggi_menara' || selectedDetail === 'tinggi_bangunan'
                    ? tower[selectedDetail] ? `${tower[selectedDetail]} meter` : 'N/A'
                    : tower[selectedDetail] || 'N/A'}
                </p>
              )}
            </div>
          )}
          
          <div className="grid grid-cols-2 gap-4 mt-6">
            <div>
              <h4 className="font-medium">ID:</h4>
              <p>{tower.id}</p>
            </div>
            <div>
              <h4 className="font-medium">Nama Tower:</h4>
              <p>{tower.site_name}</p>
            </div>
            <div>
              <h4 className="font-medium">Koordinat:</h4>
              <p>
                Lat: {typeof tower.latitude === 'number' ? tower.latitude.toFixed(4) : tower.latitude}<br/>
                Lng: {typeof tower.longitude === 'number' ? tower.longitude.toFixed(4) : tower.longitude}
              </p>
            </div>
            <div>
              <h4 className="font-medium">Status:</h4>
              <p>
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                  tower.status === 'Aktif' || tower.status === 'AKTIF' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'
                }`}>
                  {tower.status || 'Aktif'}
                </span>
              </p>
            </div>
          </div>
        </div>
        
        {/* Footer with actions */}
        <div className="p-4 border-t flex justify-between">
          <div>
            <button 
              onClick={() => onViewMap(tower)} 
              className="bg-blue-500 text-white px-4 py-2 rounded-lg flex items-center mr-2"
            >
              <span className="material-icons mr-1">place</span>
              Lihat di Peta
            </button>
          </div>
          <div>
            <button 
              onClick={handleDownloadReport}
              className="bg-green-500 text-white px-4 py-2 rounded-lg flex items-center mr-2"
            >
              <span className="material-icons mr-1">download</span>
              Download Report
            </button>
            <button 
              onClick={onClose} 
              className="bg-gray-500 text-white px-4 py-2 rounded-lg flex items-center"
            >
              <span className="material-icons mr-1">close</span>
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TowerDetailModal;
