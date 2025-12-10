import React, { useState } from 'react';
import { Link, usePage } from '@inertiajs/react';
import { useBodyScrollLock } from '@/Hooks/useBodyScrollLock';
import ModalBackdrop from '@/Components/ModalBackdrop';
import ModalContainer from '@/Components/ModalContainer';
import { getFOStatusColor } from '@/utils/statusHelpers';

// Generic field definition interface
export interface DetailField {
  id: string;
  label: string;
  formatValue?: (value: any, fieldId: string) => string;
}

// Action button configuration
export interface DetailAction {
  id: string;
  label: string;
  icon: string;
  href?: string;
  onClick?: () => void;
  className?: string;
  style?: React.CSSProperties;
  show?: boolean;
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'default';
}

// Theme configuration
export interface DetailModalTheme {
  headerBgColor?: string;
  headerTextColor?: string;
  headerIconColor?: string;
  primaryColor?: string;
  secondaryColor?: string;
}

// Generic detail modal props
export interface DetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: Record<string, any>;
  title: string;
  subtitle?: string;
  fields: DetailField[];
  summaryFields?: Array<{ key: string; label: string; formatValue?: (value: any) => string }>;
  actions?: DetailAction[];
  theme?: DetailModalTheme;
  onViewMap?: (data: Record<string, any>) => void;
  onDownloadReport?: (data: Record<string, any>, fields: DetailField[]) => void;
  enableFeedback?: boolean;
  enableComplaint?: boolean;
  feedbackRoute?: string;
  complaintRoute?: string;
  feedbackParams?: (data: Record<string, any>) => Record<string, string>;
  complaintParams?: (data: Record<string, any>) => Record<string, string>;
  canSendFeedback?: boolean;
  canSendComplaint?: boolean;
  showDetailSelector?: boolean;
  defaultEmptyValue?: string;
}

const DetailModal: React.FC<DetailModalProps> = ({
  isOpen,
  onClose,
  data,
  title,
  subtitle,
  fields,
  summaryFields = [],
  actions = [],
  theme = {},
  onViewMap,
  onDownloadReport,
  enableFeedback = false,
  enableComplaint = false,
  feedbackRoute = '/feedback',
  complaintRoute = '/complaint',
  feedbackParams,
  complaintParams,
  canSendFeedback = true,
  canSendComplaint = true,
  showDetailSelector = true,
  defaultEmptyValue = 'Belum Terdata'
}) => {
  const { auth } = usePage().props as any;
  const [selectedDetail, setSelectedDetail] = useState<string>('-- Pilih Detail --');
  
  // Prevent body scroll saat modal terbuka
  useBodyScrollLock(isOpen);
  
  if (!isOpen || !data) return null;

  // Default theme colors
  const defaultTheme: Required<DetailModalTheme> = {
    headerBgColor: '#B71C1C',
    headerTextColor: '#FFD700',
    headerIconColor: '#FFD700',
    primaryColor: '#B71C1C',
    secondaryColor: '#1B5E20',
    ...theme
  };

  // Default format function
  const formatDetailValue = (fieldId: string, value: any, field?: DetailField): string => {
    if (field?.formatValue) {
      return field.formatValue(value, fieldId);
    }
    
    const isNullish = value === null || value === undefined;
    const isEmptyString = typeof value === 'string' && value.trim() === '';
    
    if (isNullish || isEmptyString) {
      return defaultEmptyValue;
    }
    
    return String(value);
  };

  // Add "Semua Detail" option to fields
  const allFieldsWithOption = [
    ...fields,
    { id: 'semua_detail', label: `Semua Detail ${title}` }
  ];

  const handleDetailChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedDetail(e.target.value);
  };

  const handleDownloadReport = () => {
    if (onDownloadReport) {
      onDownloadReport(data, fields);
    } else {
      // Default download report implementation
      const reportContent = [];
      reportContent.push(`Detail ${title} - ${data.site_name || data.name || data.id}`);
      
      fields.forEach(field => {
        const value = formatDetailValue(field.id, data[field.id], field);
        reportContent.push(`${field.label}: ${value}`);
      });
      
      const blob = new Blob([reportContent.join('\n')], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const fileName = `${title.toLowerCase()}_${data.id}_${data.site_name || data.name || 'detail'}.txt`;
      link.download = fileName.replace(/\s+/g, '_');
      link.href = url;
      link.click();
    }
  };

  // Build action buttons
  const buildActionButtons = (): DetailAction[] => {
    const builtActions: DetailAction[] = [];

    // View on Map action
    if (onViewMap) {
      builtActions.push({
        id: 'view-map',
        label: 'Lihat di Peta',
        icon: 'place',
        onClick: () => {
          onClose();
          setTimeout(() => {
            onViewMap(data);
          }, 150);
        },
        variant: 'success',
        style: { backgroundColor: defaultTheme.secondaryColor }
      });
    }

    // Complaint action
    if (enableComplaint && canSendComplaint) {
      const params = complaintParams ? complaintParams(data) : {
        tower_id: String(data.id),
        tower_name: encodeURIComponent(data.site_name || data.name || '')
      };
      const queryString = new URLSearchParams(params).toString();
      
      builtActions.push({
        id: 'complaint',
        label: 'Kirim Keluhan',
        icon: 'report_problem',
        href: `${complaintRoute}?${queryString}`,
        variant: 'danger',
        style: { backgroundColor: defaultTheme.primaryColor }
      });
    }

    // Feedback action
    if (enableFeedback && canSendFeedback) {
      const params = feedbackParams ? feedbackParams(data) : {
        tower_id: String(data.id),
        tower_name: encodeURIComponent(data.site_name || data.name || '')
      };
      const queryString = new URLSearchParams(params).toString();
      
      builtActions.push({
        id: 'feedback',
        label: 'Kirim Masukan',
        icon: 'feedback',
        href: `${feedbackRoute}?${queryString}`,
        variant: 'danger',
        style: { backgroundColor: defaultTheme.primaryColor }
      });
    }

    // Custom actions
    builtActions.push(...actions);

    // Close button
    builtActions.push({
      id: 'close',
      label: 'Tutup',
      icon: 'close',
      onClick: onClose,
      variant: 'default',
      style: { backgroundColor: '#212121' }
    });

    // Download Report button
    builtActions.push({
      id: 'download',
      label: 'Download Report',
      icon: 'download',
      onClick: handleDownloadReport,
      variant: 'danger',
      style: { backgroundColor: defaultTheme.primaryColor }
    });

    return builtActions.filter(action => action.show !== false);
  };

  const actionButtons = buildActionButtons();

  // Group actions: primary actions on left, secondary on right
  const primaryActions = actionButtons.filter(a => 
    ['view-map', 'feedback', 'complaint'].includes(a.id)
  );
  const secondaryActions = actionButtons.filter(a => 
    !['view-map', 'feedback', 'complaint'].includes(a.id)
  );

  return (
    <>
      <ModalBackdrop onClick={onClose} opacity={60} blur zIndex={50}>
        <div 
          className="h-full flex items-center justify-center p-3 sm:p-4"
          onClick={(e) => e.stopPropagation()}
          style={{
            height: '100vh',
            overflow: 'hidden'
          }}
        >
          <ModalContainer maxWidth="2xl" maxHeight="90vh" className="w-full sm:max-w-xl lg:max-w-2xl">
            {/* Header */}
            <div 
              className="text-white p-4 sm:p-6 flex items-center flex-shrink-0" 
              style={{ backgroundColor: defaultTheme.headerBgColor }}
            >
              <span 
                className="material-icons-outlined mr-2" 
                style={{ color: defaultTheme.headerIconColor }}
              >
                info
              </span>
              <div className="flex-1">
                <h3 
                  className="text-base sm:text-lg font-semibold leading-tight" 
                  style={{ color: defaultTheme.headerTextColor }}
                >
                  {title} - {data.site_name || data.name || data.id}
                </h3>
                {subtitle && (
                  <p className="text-sm mt-1 opacity-90">{subtitle}</p>
                )}
              </div>
            </div>
            
            {/* Body - Hanya area ini yang bisa scroll */}
            <div 
              className="p-4 sm:p-6 overflow-y-auto flex-1 bg-white"
              style={{
                minHeight: 0,
                WebkitOverflowScrolling: 'touch',
                overscrollBehavior: 'contain'
              }}
            >
              {showDetailSelector && (
                <div className="mb-4 sm:mb-6">
                  <label className="block text-gray-700 mb-2 text-sm">Pilih Informasi yang Ingin Dilihat:</label>
                  <select 
                    value={selectedDetail}
                    onChange={handleDetailChange}
                    className="w-full p-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent focus:outline-none"
                    style={{ '--tw-ring-color': defaultTheme.primaryColor } as React.CSSProperties}
                  >
                    <option>-- Pilih Detail --</option>
                    {allFieldsWithOption.map(field => (
                      <option key={field.id} value={field.id}>{field.label}</option>
                    ))}
                  </select>
                </div>
              )}
              
              {showDetailSelector && selectedDetail !== '-- Pilih Detail --' && (
                <div className="bg-gray-50 p-3 sm:p-4 rounded-lg border mb-4 sm:mb-6">
                  <h4 className="font-medium mb-2 text-sm sm:text-base">
                    {allFieldsWithOption.find(f => f.id === selectedDetail)?.label}:
                  </h4>
                  {selectedDetail === 'semua_detail' ? (
                    <div className="space-y-2">
                      {fields.map(field => (
                        <div key={field.id} className="border-b pb-2 last:border-b-0">
                          <h5 className="text-xs sm:text-sm font-medium text-gray-600">{field.label}:</h5>
                          <p className="text-sm sm:text-base break-words">
                            {formatDetailValue(field.id, data[field.id], field)}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm sm:text-lg break-words">
                      {formatDetailValue(selectedDetail, data[selectedDetail], fields.find(f => f.id === selectedDetail))}
                    </p>
                  )}
                </div>
              )}
              
              {/* Summary Fields */}
              {summaryFields.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 sm:mt-6">
                  {summaryFields.map(({ key, label, formatValue }) => {
                    const value = formatValue 
                      ? formatValue(data[key])
                      : formatDetailValue(key, data[key]);
                    
                    return (
                      <div key={key} className="min-w-0">
                        <h4 className="font-medium text-sm text-gray-700">{label}</h4>
                        <p className="text-sm break-words">{value}</p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            
            {/* Footer with actions */}
            <div className="p-3 sm:p-4 border-t flex flex-col gap-2 flex-shrink-0 bg-white">
              <div className="flex flex-col sm:flex-row sm:justify-between gap-2 sm:gap-3">
                {/* Primary actions */}
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
                  {primaryActions.map(action => {
                    const buttonContent = (
                      <>
                        <span className="material-icons-outlined mr-1">{action.icon}</span>
                        {action.label}
                      </>
                    );

                    if (action.href) {
                      return (
                        <Link
                          key={action.id}
                          href={action.href}
                          className="text-white px-4 py-2 rounded-lg flex items-center justify-center hover:opacity-90 w-full sm:w-auto"
                          style={action.style}
                          onClick={onClose}
                        >
                          {buttonContent}
                        </Link>
                      );
                    }

                    return (
                      <button
                        key={action.id}
                        onClick={action.onClick}
                        className="text-white px-4 py-2 rounded-lg flex items-center justify-center hover:opacity-90 w-full sm:w-auto"
                        style={action.style}
                      >
                        {buttonContent}
                      </button>
                    );
                  })}
                </div>
                
                {/* Secondary actions */}
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
                  {secondaryActions.map(action => {
                    const buttonContent = (
                      <>
                        <span 
                          className="material-icons-outlined mr-1"
                          style={action.id === 'download' ? { color: defaultTheme.headerIconColor } : {}}
                        >
                          {action.icon}
                        </span>
                        {action.label}
                      </>
                    );

                    if (action.href) {
                      return (
                        <Link
                          key={action.id}
                          href={action.href}
                          className="text-white px-4 py-2 rounded-lg flex items-center justify-center hover:opacity-90 w-full sm:w-auto"
                          style={action.style}
                          onClick={action.onClick}
                        >
                          {buttonContent}
                        </Link>
                      );
                    }

                    return (
                      <button
                        key={action.id}
                        onClick={action.onClick}
                        className="text-white px-4 py-2 rounded-lg flex items-center justify-center hover:opacity-90 w-full sm:w-auto"
                        style={action.style}
                      >
                        {buttonContent}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </ModalContainer>
        </div>
      </ModalBackdrop>
    </>
  );
};

// Tower-specific configuration and wrapper
export interface TowerDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  tower: any;
  onViewMap: (tower: any) => void;
}

const TowerDetailModal: React.FC<TowerDetailModalProps> = ({ 
  isOpen, 
  onClose, 
  tower,
  onViewMap
}) => {
  const { auth } = usePage().props as any;
  
  // Show feedback/complaint buttons for guests and non-staff users
  const canSendFeedback = !auth?.user || (auth?.user && !['admin', 'operator'].includes(auth.user.role));
  const canSendComplaint = canSendFeedback; // Same logic

  // Tower-specific field definitions
  const towerFields: DetailField[] = [
    { id: 'id', label: 'ID Tower' },
    { id: 'site_name', label: 'Nama Tower' },
    { id: 'owner', label: 'Pemilik/Owner' },
    { id: 'site_id', label: 'Site ID' },
    { id: 'site_sap', label: 'Site SAP' },
    { 
      id: 'latitude', 
      label: 'Koordinat Latitude',
      formatValue: (value) => {
        if (value === null || value === undefined || value === '') return 'Belum Terdata';
        return typeof value === 'number' ? value.toFixed(6) : String(value);
      }
    },
    { 
      id: 'longitude', 
      label: 'Koordinat Longitude',
      formatValue: (value) => {
        if (value === null || value === undefined || value === '') return 'Belum Terdata';
        return typeof value === 'number' ? value.toFixed(6) : String(value);
      }
    },
    { 
      id: 'tinggi_menara', 
      label: 'Tinggi Menara (m)',
      formatValue: (value) => {
        if (value === null || value === undefined || value === '') return 'Belum Terdata';
        return `${value} meter`;
      }
    },
    { 
      id: 'tinggi_bangunan', 
      label: 'Tinggi Bangunan (m)',
      formatValue: (value) => {
        if (value === null || value === undefined || value === '') return 'Belum Terdata';
        return `${value} meter`;
      }
    },
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
    { id: 'prs_id', label: 'PRS ID' }
  ];

  // Summary fields for quick view
  const summaryFields = [
    { key: 'id', label: 'ID' },
    { key: 'site_name', label: 'Nama Tower' },
    { key: 'owner', label: 'Owner' },
    { 
      key: 'coordinates', 
      label: 'Koordinat',
      formatValue: () => {
        const lat = typeof tower.latitude === 'number' 
          ? tower.latitude.toFixed(6) 
          : tower.latitude || 'Belum Terdata';
        const lng = typeof tower.longitude === 'number' 
          ? tower.longitude.toFixed(6) 
          : tower.longitude || 'Belum Terdata';
        return `Lat: ${lat}\nLng: ${lng}`;
      }
    },
    { 
      key: 'status', 
      label: 'Status',
      formatValue: (value: any) => value || 'Belum Terdata'
    }
  ];

  // Custom download report handler
  const handleDownloadReport = (data: Record<string, any>, fields: DetailField[]) => {
    const reportContent = [];
    reportContent.push(`Detail Tower - ${data.site_name}`);
    
    fields.forEach(field => {
      let value = data[field.id] || 'N/A';
      if (field.formatValue) {
        value = field.formatValue(data[field.id], field.id);
      } else if (field.id === 'tinggi_menara' || field.id === 'tinggi_bangunan') {
        value = data[field.id] ? `${data[field.id]} meter` : 'N/A';
      }
      reportContent.push(`${field.label}: ${value}`);
    });
    
    const blob = new Blob([reportContent.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = `tower_${data.id}_${data.site_name}.txt`;
    link.href = url;
    link.click();
  };

  return (
    <DetailModal
      isOpen={isOpen}
      onClose={onClose}
      data={tower}
      title="Detail Tower"
      fields={towerFields}
      summaryFields={summaryFields}
      onViewMap={onViewMap}
      onDownloadReport={handleDownloadReport}
      enableFeedback={true}
      enableComplaint={true}
      canSendFeedback={canSendFeedback}
      canSendComplaint={canSendComplaint}
      feedbackParams={(data) => ({
        tower_id: String(data.id),
        tower_name: encodeURIComponent(data.site_name || ''),
        location_type: 'tower'
      })}
      complaintParams={(data) => ({
        tower_id: String(data.id),
        tower_name: encodeURIComponent(data.site_name || ''),
        location_type: 'tower'
      })}
    />
  );
};

// FO Point-specific configuration and wrapper
export interface FoPointDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  point: any;
  onViewMap?: (point: any) => void;
}

export const FoPointDetailModal: React.FC<FoPointDetailModalProps> = ({ 
  isOpen, 
  onClose, 
  point,
  onViewMap
}) => {
  const { auth } = usePage().props as any;
  
  // Show feedback/complaint buttons for guests and non-staff users
  const canSendFeedback = !auth?.user || (auth?.user && !['admin', 'operator'].includes(auth.user.role));
  const canSendComplaint = canSendFeedback; // Same logic

  // FO Point-specific field definitions
  const foPointFields: DetailField[] = [
    { id: 'id', label: 'ID Titik' },
    { id: 'name', label: 'Nama Titik' },
    { 
      id: 'type', 
      label: 'Tipe',
      formatValue: (value) => value ? value.charAt(0).toUpperCase() + value.slice(1) : 'Belum Terdata'
    },
    { id: 'route_name', label: 'Jalur' },
    { 
      id: 'sequence_number', 
      label: 'Urutan',
      formatValue: (value) => value ? `#${value}` : 'Belum Terdata'
    },
    { 
      id: 'description', 
      label: 'Deskripsi',
      formatValue: (value) => value || 'Tidak ada deskripsi'
    },
    { 
      id: 'area', 
      label: 'Area',
      formatValue: (value) => value ? value.charAt(0).toUpperCase() + value.slice(1) : 'Belum Terdata'
    },
    { 
      id: 'status', 
      label: 'Status',
      formatValue: (value) => {
        if (!value) return 'Belum Terdata';
        const statusConfig = getFOStatusColor(value);
        return statusConfig.label;
      }
    },
    { 
      id: 'side_of_road', 
      label: 'Posisi',
      formatValue: (value) => {
        if (!value || value === 'unknown') return 'Belum Diketahui';
        return value === 'left' ? 'Kiri' : 'Kanan';
      }
    },
    { 
      id: 'latitude', 
      label: 'Koordinat Latitude',
      formatValue: (value) => typeof value === 'number' ? value.toFixed(6) : String(value || 'Belum Terdata')
    },
    { 
      id: 'longitude', 
      label: 'Koordinat Longitude',
      formatValue: (value) => typeof value === 'number' ? value.toFixed(6) : String(value || 'Belum Terdata')
    }
  ];

  // Summary fields for quick view
  const summaryFields = [
    { key: 'name', label: 'Nama Titik' },
    { 
      key: 'description', 
      label: 'Deskripsi',
      formatValue: (value: any) => value || 'Tidak ada deskripsi'
    },
    { key: 'route_name', label: 'Jalur' },
    { 
      key: 'sequence_number', 
      label: 'Urutan',
      formatValue: (value: any) => value ? `#${value}` : 'Belum Terdata'
    },
    { 
      key: 'type', 
      label: 'Tipe',
      formatValue: (value: any) => value ? value.charAt(0).toUpperCase() + value.slice(1) : 'Belum Terdata'
    },
    { 
      key: 'side_of_road', 
      label: 'Posisi',
      formatValue: (value: any) => {
        if (!value || value === 'unknown') return 'Belum Diketahui';
        return value === 'left' ? 'Kiri' : 'Kanan';
      }
    },
    { 
      key: 'providers', 
      label: 'Provider',
      formatValue: (value: any) => {
        if (!value || !Array.isArray(value) || value.length === 0) return 'Belum Terdata';
        return value.map((p: any) => p.name).join(', ');
      }
    },
    { 
      key: 'coordinates', 
      label: 'Koordinat',
      formatValue: () => {
        const lat = typeof point.latitude === 'number' 
          ? point.latitude.toFixed(6) 
          : point.latitude || 'Belum Terdata';
        const lng = typeof point.longitude === 'number' 
          ? point.longitude.toFixed(6) 
          : point.longitude || 'Belum Terdata';
        return `Lat: ${lat}\nLng: ${lng}`;
      }
    }
  ];

  // Custom download report handler
  const handleDownloadReport = (data: Record<string, any>, fields: DetailField[]) => {
    const reportContent = [];
    reportContent.push(`Detail Titik FO - ${data.name}`);
    
    fields.forEach(field => {
      let value = data[field.id];
      if (field.formatValue) {
        value = field.formatValue(value, field.id);
      }
      if (value === null || value === undefined || value === '') {
        value = 'Belum Terdata';
      }
      reportContent.push(`${field.label}: ${value}`);
    });
    
    // Add providers if available
    if (data.providers && Array.isArray(data.providers) && data.providers.length > 0) {
      reportContent.push(`Provider: ${data.providers.map((p: any) => p.name).join(', ')}`);
    }
    
    // Add images info
    if (data.images) {
      const imageTypes = [];
      if (data.images.isp) imageTypes.push('ISP');
      if (data.images.pole) imageTypes.push('Tiang');
      if (data.images.junction_box) imageTypes.push('Junction Box');
      if (imageTypes.length > 0) {
        reportContent.push(`Gambar Tersedia: ${imageTypes.join(', ')}`);
      }
    }
    
    const blob = new Blob([reportContent.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = `fo_point_${data.id}_${data.name}.txt`;
    link.href = url;
    link.click();
  };

  return (
    <DetailModal
      isOpen={isOpen}
      onClose={onClose}
      data={point}
      title="Detail Titik FO"
      fields={foPointFields}
      summaryFields={summaryFields}
      onViewMap={onViewMap}
      onDownloadReport={handleDownloadReport}
      enableFeedback={true}
      enableComplaint={true}
      canSendFeedback={canSendFeedback}
      canSendComplaint={canSendComplaint}
      feedbackParams={(data) => ({
        fo_point_id: String(data.id),
        fo_point_name: encodeURIComponent(data.name || ''),
        location_type: 'fo_point'
      })}
      complaintParams={(data) => ({
        fo_point_id: String(data.id),
        fo_point_name: encodeURIComponent(data.name || ''),
        location_type: 'fo_point'
      })}
      theme={{
        headerBgColor: '#DC2626',
        headerTextColor: '#FFFFFF',
        headerIconColor: '#FFD700',
        primaryColor: '#DC2626',
        secondaryColor: '#1B5E20'
      }}
    />
  );
};

export default TowerDetailModal;
export { DetailModal };

