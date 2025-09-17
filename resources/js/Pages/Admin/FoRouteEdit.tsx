import React, { useEffect, useMemo, useState, useCallback, memo } from 'react';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { MapContainer, TileLayer, Polyline, Marker, useMapEvents } from 'react-leaflet';
import { LatLngTuple } from 'leaflet';
import L from 'leaflet';
import { LatLng, FoRouteEditPageProps, PageProps } from '@/types';

interface EditorProps {
  points: LatLng[];
  setPoints: (points: LatLng[]) => void;
  isDisabled?: boolean;
}

const Editor = memo(({ points, setPoints, isDisabled }: EditorProps) => {
  useMapEvents({
    click(e) {
      if (isDisabled) return;
      setPoints([...points, { lat: e.latlng.lat, lng: e.latlng.lng }]);
    },
  });
  return null;
});

Editor.displayName = 'MapEditor';

const LoadingSpinner = () => (
  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
);

export default function FoRouteEdit() {
  const { props } = usePage<PageProps<FoRouteEditPageProps>>();
  const { mode, route: routeData, areas } = props;

  const [points, setPoints] = useState<LatLng[]>(routeData?.path_coordinates || []);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const form = useForm({
    name: routeData?.name || '',
    area: routeData?.area || 'ungaran',
    status: routeData?.status || 'active',
    color: routeData?.color || '#3B82F6',
    description: routeData?.description || '',
    path_coordinates: points as any,
  });

  useEffect(() => {
    form.setData('path_coordinates', points as any);
  }, [points]);

  const center = useMemo((): LatLngTuple => {
    if (points.length > 0) {
      return [points[0].lat, points[0].lng];
    }
    return [-7.1368, 110.4044]; // Default center for Semarang area
  }, [points]);

  const validateForm = useCallback(() => {
    const errors: Record<string, string> = {};
    
    if (!form.data.name?.trim()) {
      errors.name = 'Nama jalur wajib diisi';
    }
    
    if (points.length < 2) {
      errors.points = 'Jalur harus memiliki minimal 2 titik';
    }
    
    if (!form.data.area) {
      errors.area = 'Area wajib dipilih';
    }
    
    if (!form.data.status) {
      errors.status = 'Status wajib dipilih';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }, [form.data, points]);

  const submit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    
    const submitOptions = {
      onSuccess: () => {
        setIsSubmitting(false);
      },
      onError: (errors: any) => {
        setIsSubmitting(false);
        setFormErrors(errors);
      },
      preserveScroll: true,
    };
    
    if (mode === 'create') {
      form.post(route('admin.fo-routes.store'), submitOptions);
    } else if (routeData?.id) {
      form.put(route('admin.fo-routes.update', routeData.id), submitOptions);
    }
  }, [form, mode, routeData?.id, validateForm]);

  const removeLast = useCallback(() => {
    if (points.length > 0 && !isSubmitting) {
      setPoints(prev => prev.slice(0, -1));
      // Clear points error if we now have enough points
      if (points.length === 2 && formErrors.points) {
        setFormErrors(prev => ({ ...prev, points: '' }));
      }
    }
  }, [points.length, isSubmitting, formErrors.points]);

  const resetPoints = useCallback(() => {
    if (isSubmitting) return;
    
    if (window.confirm('Apakah Anda yakin ingin menghapus semua titik?')) {
      setPoints([]);
      setFormErrors(prev => ({ ...prev, points: 'Jalur harus memiliki minimal 2 titik' }));
    }
  }, [isSubmitting]);

  // Clear form errors when user starts typing
  const handleFieldChange = useCallback((field: string, value: any) => {
    form.setData(field as any, value);
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: '' }));
    }
  }, [form, formErrors]);

  return (
    <AuthenticatedLayout>
      <Head title={mode === 'create' ? 'Tambah Jalur FO' : 'Edit Jalur FO'} />
      <div className="p-4 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl sm:text-2xl font-bold">
            {mode === 'create' ? 'Tambah' : 'Edit'} Jalur Fiber Optik
          </h1>
          <Link 
            href={route('admin.fo-routes.index')} 
            className="text-sm text-gray-600 hover:text-gray-800 transition-colors"
          >
            Kembali
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <form onSubmit={submit} className="bg-white rounded-lg shadow p-4 space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Nama <span className="text-red-500">*</span>
              </label>
              <input 
                id="name"
                type="text"
                value={form.data.name as string} 
                onChange={e => handleFieldChange('name', e.target.value)}
                className={`w-full rounded border-gray-300 ${
                  formErrors.name || form.errors.name 
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                    : 'focus:border-indigo-500 focus:ring-indigo-500'
                }`}
                required
                placeholder="Masukkan nama jalur FO"
                disabled={isSubmitting}
                aria-describedby={formErrors.name || form.errors.name ? 'name-error' : undefined}
              />
              {(form.errors.name || formErrors.name) && (
                <p id="name-error" className="text-xs text-red-600 mt-1" role="alert">
                  {form.errors.name || formErrors.name}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="area" className="block text-sm font-medium text-gray-700 mb-1">
                  Area <span className="text-red-500">*</span>
                </label>
                <select 
                  id="area"
                  value={form.data.area as string} 
                  onChange={e => handleFieldChange('area', e.target.value)}
                  className={`w-full rounded border-gray-300 ${
                    formErrors.area ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'focus:border-indigo-500 focus:ring-indigo-500'
                  }`}
                  required
                  disabled={isSubmitting}
                  aria-describedby={formErrors.area ? 'area-error' : undefined}
                >
                  {areas.map(area => (
                    <option key={area} value={area}>
                      {area.charAt(0).toUpperCase() + area.slice(1)}
                    </option>
                  ))}
                </select>
                {formErrors.area && (
                  <p id="area-error" className="text-xs text-red-600 mt-1" role="alert">
                    {formErrors.area}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                  Status <span className="text-red-500">*</span>
                </label>
                <select 
                  id="status"
                  value={form.data.status as string} 
                  onChange={e => handleFieldChange('status', e.target.value as 'active' | 'inactive' | 'maintenance')}
                  className={`w-full rounded border-gray-300 ${
                    formErrors.status ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'focus:border-indigo-500 focus:ring-indigo-500'
                  }`}
                  disabled={isSubmitting}
                  aria-describedby={formErrors.status ? 'status-error' : undefined}
                >
                  <option value="active">Aktif</option>
                  <option value="inactive">Non-aktif</option>
                  <option value="maintenance">Maintenance</option>
                </select>
                {formErrors.status && (
                  <p id="status-error" className="text-xs text-red-600 mt-1" role="alert">
                    {formErrors.status}
                  </p>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="color" className="block text-sm font-medium text-gray-700 mb-1">
                Warna Jalur
              </label>
              <input 
                id="color"
                type="color" 
                value={form.data.color as string} 
                onChange={e => handleFieldChange('color', e.target.value)}
                className="h-10 w-16 p-0 border rounded cursor-pointer disabled:cursor-not-allowed" 
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Deskripsi
              </label>
              <textarea 
                id="description"
                value={form.data.description as string} 
                onChange={e => handleFieldChange('description', e.target.value)}
                className="w-full rounded border-gray-300 focus:border-indigo-500 focus:ring-indigo-500" 
                rows={3}
                placeholder="Deskripsi jalur (opsional)"
                disabled={isSubmitting}
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button 
                type="submit" 
                className="px-4 py-2 rounded text-white flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-opacity" 
                style={{ backgroundColor: '#B71C1C' }} 
                disabled={isSubmitting || form.processing}
                aria-describedby="submit-button-status"
              >
                {isSubmitting && <LoadingSpinner />}
                {isSubmitting ? 'Menyimpan...' : (mode === 'create' ? 'Simpan' : 'Update')}
              </button>
              
              <button 
                type="button" 
                onClick={removeLast} 
                className="px-3 py-2 rounded bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50 transition-colors text-sm" 
                disabled={points.length === 0 || isSubmitting}
                aria-label="Hapus titik terakhir dari jalur"
              >
                Hapus Titik Terakhir
              </button>
              
              <button 
                type="button" 
                onClick={resetPoints} 
                className="px-3 py-2 rounded bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50 transition-colors text-sm" 
                disabled={points.length === 0 || isSubmitting}
                aria-label="Reset semua titik jalur"
              >
                Reset Titik
              </button>
            </div>
          </form>

          <div className="bg-white rounded-lg shadow">
            <div className="p-3 border-b text-sm text-gray-700">
              <div className="flex items-center justify-between">
                <span>Klik pada peta untuk menambah titik jalur</span>
                {isSubmitting && (
                  <span className="text-amber-600 text-xs">Mode edit dinonaktifkan saat menyimpan</span>
                )}
              </div>
            </div>
            
            <div style={{ height: 480 }} className="relative">
              <MapContainer 
                center={center} 
                zoom={13} 
                style={{ height: '100%', width: '100%' }}
                className="z-0"
              >
                <TileLayer 
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" 
                  attribution='&copy; OpenStreetMap contributors' 
                />
                <Editor points={points} setPoints={setPoints} isDisabled={isSubmitting} />
                {points.length > 0 && (
                  <>
                    <Polyline 
                      positions={points.map(p => [p.lat, p.lng]) as any} 
                      pathOptions={{ 
                        color: (form.data.color as string) || '#3B82F6', 
                        weight: 4, 
                        opacity: 0.9 
                      }} 
                    />
                    {points.map((point, idx) => (
                      <Marker 
                        key={`point-${idx}`} 
                        position={[point.lat, point.lng]} 
                        icon={L.divIcon({ 
                          className: 'custom-marker', 
                          html: `<div class="w-5 h-5 rounded-full bg-white border-2 shadow-lg" style="border-color:${form.data.color as string}; transform: translate(-50%, -50%)"></div>`,
                          iconSize: [20, 20],
                          iconAnchor: [10, 10]
                        })} 
                      />
                    ))}
                  </>
                )}
              </MapContainer>
            </div>
            
            <div className="p-3 text-xs text-gray-600 border-t">
              <div className="flex items-center justify-between">
                <span>Total titik: {points.length}</span>
                {points.length >= 2 && (
                  <span className="text-green-600 flex items-center gap-1">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Jalur valid
                  </span>
                )}
              </div>
              {(points.length < 2 || formErrors.points) && (
                <div className="text-red-600 mt-1 flex items-center gap-1" role="alert">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <span>{formErrors.points || 'Minimal 2 titik diperlukan untuk membuat jalur'}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}