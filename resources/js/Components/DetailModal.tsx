import React, { useState } from 'react';
import { Link, usePage } from '@inertiajs/react';
import { AnimatePresence } from 'motion/react';
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
  imageGallery?: Array<{
    id: string;
    label: string;
    url: string | null;
    color?: string;
  }>;
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
  defaultEmptyValue = 'Belum Terdata',
  imageGallery = []
}) => {
  const { auth } = usePage().props as any;
  const [selectedDetail, setSelectedDetail] = useState<string>('-- Pilih Detail --');
  
  // Prevent body scroll saat modal terbuka
  useBodyScrollLock(isOpen);
  
  // Only `data` short-circuits the render now. `isOpen` has moved into the
  // AnimatePresence below, because a component that returns null the instant it
  // closes gives AnimatePresence nothing to animate out — the modal would still
  // vanish between two paints, which is the bug being fixed.
  //
  // Safe because the call sites keep the selected record when they close: on
  // /data-tower the handler is `onClose={() => setDetailModalOpen(false)}` and
  // `selectedTower` is left alone, so `data` is still there to render during
  // the leave. It also has to stay a guard rather than move into the JSX,
  // because buildActionButtons() dereferences `data.id` at render time.
  if (!data) return null;

  // Default theme colors
  const defaultTheme: Required<DetailModalTheme> = {
    headerBgColor: 'hsl(var(--primary))',
    headerTextColor: 'hsl(var(--primary-foreground))',
    headerIconColor: 'hsl(var(--primary-foreground))',
    primaryColor: 'hsl(var(--primary))',
    secondaryColor: 'hsl(var(--success))',
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
      style: { backgroundColor: 'hsl(var(--foreground))' }
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
    <AnimatePresence>
      {isOpen && (
      <ModalBackdrop key="detail-modal" onClick={onClose} opacity={60} blur zIndex={50}>
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
                  <label className="block text-foreground mb-2 text-sm">Pilih Informasi yang Ingin Dilihat:</label>
                  <select 
                    value={selectedDetail}
                    onChange={handleDetailChange}
                    className="w-full p-2 text-sm border border-input rounded-lg focus:ring-2 focus:border-transparent focus:outline-none"
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
                <div className="bg-muted p-3 sm:p-4 rounded-lg border mb-4 sm:mb-6">
                  <h4 className="font-medium mb-2 text-sm sm:text-base">
                    {allFieldsWithOption.find(f => f.id === selectedDetail)?.label}:
                  </h4>
                  {selectedDetail === 'semua_detail' ? (
                    <div className="space-y-2">
                      {fields.map(field => (
                        <div key={field.id} className="border-b pb-2 last:border-b-0">
                          <h5 className="text-xs sm:text-sm font-medium text-muted-foreground">{field.label}:</h5>
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
                        <h4 className="font-medium text-sm text-foreground">{label}</h4>
                        <p className="text-sm break-words">{value}</p>
                      </div>
                    );
                  })}
                </div>
              )}
              
              {/* Image Gallery Section */}
              {imageGallery.length > 0 && imageGallery.some(img => img.url && img.url.trim() !== '') && (
                <div className="mt-6 sm:mt-8">
                  <div className="flex items-center mb-4">
                    <div className="mr-3 p-2 bg-muted rounded-lg">
                      <svg className="w-5 h-5 text-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <h4 className="text-lg font-bold text-foreground">Dokumentasi Gambar</h4>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {imageGallery.map((image) => {
                      const hasValidUrl = image.url && image.url !== '-' && image.url.trim() !== '';
                      // `image.color` is ignored on purpose.
                      //
                      // It painted one photo tile red and the next green for
                      // what is only "which kind of photograph this is". On a
                      // palette where red means irreversible and green means
                      // healthy, that told the reader something untrue about
                      // documentation. Every tile is neutral now and the label
                      // underneath does the identifying, which is what it was
                      // already there for.
                      const bgColorClass = 'bg-muted';
                      const textColorClass = 'text-muted-foreground';
                      const buttonBgClass =
                        'bg-primary text-primary-foreground hover:bg-primary-hover focus-visible:ring';
                      
                      return (
                        <div key={image.id} className="bg-card rounded-lg p-4 border border-border shadow-sm hover:shadow-md transition-shadow">
                          <div className="text-center">
                            <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full mb-3 ${bgColorClass}`}>
                              {image.id === 'isp' && (
                                <svg className={`w-6 h-6 ${textColorClass}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                              )}
                              {image.id === 'pole' && (
                                <svg className={`w-6 h-6 ${textColorClass}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                              )}
                              {image.id === 'junction_box' && (
                                <svg className={`w-6 h-6 ${textColorClass}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                </svg>
                              )}
                              {!['isp', 'pole', 'junction_box'].includes(image.id) && (
                                <svg className={`w-6 h-6 ${textColorClass}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                              )}
                            </div>
                            <label className="block text-sm font-bold text-foreground mb-3">
                              {image.label}
                            </label>
                            {hasValidUrl ? (
                              <button
                                onClick={() => window.open(image.url!, '_blank', 'noopener,noreferrer')}
                                className={`w-full inline-flex items-center justify-center px-4 py-2 text-sm font-semibold text-white rounded-lg transition-colors duration-200 transform  focus:outline-none focus:ring-2 focus:ring-offset-2 ${buttonBgClass}`}
                                title={`Lihat gambar ${image.label}`}
                              >
                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                                Lihat Gambar
                              </button>
                            ) : (
                              <div className="w-full inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-muted-foreground bg-muted rounded-lg cursor-not-allowed border-2 border-dashed border-input">
                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728" />
                                </svg>
                                Tidak Tersedia
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
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
      )}
    </AnimatePresence>
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
    { id: 'id', label: 'ID Menara' },
    { id: 'site_name', label: 'Nama Menara' },
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
    { id: 'alamat_menara', label: 'Alamat Menara' },
    { id: 'tower_type', label: 'Jenis Menara' },
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
    { key: 'site_name', label: 'Nama Menara' },
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
    reportContent.push(`Detail Menara - ${data.site_name}`);
    
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
      title="Detail Menara"
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

  // Prepare image gallery data
  const imageGallery = [
    {
      id: 'isp',
      label: 'ISP',
      url: point?.images?.isp || null,
      color: 'red'
    },
    {
      id: 'pole',
      label: 'Tiang',
      url: point?.images?.pole || null,
      color: 'green'
    },
    {
      id: 'junction_box',
      label: 'Junction Box',
      url: point?.images?.junction_box || null,
      color: 'blue'
    }
  ];

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
      imageGallery={imageGallery}
      // No theme override. It used to force #DC2626 — --destructive, the
      // colour this palette reserves for irreversible actions — onto the header
      // and the primary buttons of a read-only detail view, plus #1B5E20, a
      // green belonging to no ramp here. The component's own defaults are the
      // brand and success tokens, which is what every other dialog wears.
    />
  );
};

export default TowerDetailModal;
export { DetailModal };

