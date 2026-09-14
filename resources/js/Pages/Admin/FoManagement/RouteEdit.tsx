import React, { useState, useEffect } from 'react';
import { Head, useForm, Link } from '@inertiajs/react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import AdminLayout from '@/Layouts/AdminLayout';
import PageHeader from '@/Components/PageHeader';
import { getIconByImagesAndSide } from '@/utils/foIconUtils';
import { STATUS_LABELS, getStatusLabel } from '@/utils/foConstants';
import { useCoordinateUpdate } from '@/Hooks/useCoordinateUpdate';
import { Button } from '@/Components/ui/button';
import { Card } from '@/Components/ui/card';
import { cn } from '@/lib/utils';
import { FO_ROUTE_FALLBACK } from '@/lib/map-palette';

interface FoRoute {
  id: number;
  name: string;
  area: string;
  status: string;
  color: string;
  description?: string;
  total_distance: number;
  total_points: number;
}

interface FoPoint {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  sequence_number: number;
  type: string;
  status: string;
  side_of_road?: 'left' | 'right' | 'unknown' | null;
  images?: {
    isp: string | null;
    pole: string | null;
    junction_box: string | null;
  };
}

interface MapBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

interface PageProps {
  foRoute: FoRoute;
  points?: FoPoint[];
  mapBounds?: MapBounds;
  availableAreas: string[];
  availableStatuses: string[];
  csrfToken: string;
}

/**
 * ONE control recipe, matching RouteCreate field-for-field so the create and
 * edit forms are the same screen with different verbs.
 *
 * Removed from this page:
 * - the maroon hero band (AdminLayout already owns the brand bar) and its
 *   two dot-prefixed stat lines.
 * - the "Statistik Jalur" panel AND the "Titik Terdaftar / Jarak Total" box in
 *   the Kelola-Titik panel AND the "Total Titik" box under the map. Four
 *   containers, two facts. One strip now carries both, above the form.
 * - the five PANEL wrappers: a form section does not need a tinted box around
 *   it when a rule and a heading already separate it.
 * - the duplicated "Drag marker untuk mengubah posisi titik." sentence, which
 *   was printed above and below the same map.
 */
const CONTROL_BASE =
  'block w-full rounded-md border bg-background px-3 text-sm text-foreground transition-colors duration-140 ease-state placeholder:text-placeholder focus-visible:outline-none focus-visible:ring focus-visible:ring-offset-2';
const CONTROL_H = 'h-11 sm:h-10';
const CONTROL_IDLE = 'border-input hover:border-border-strong';
const CONTROL_INVALID = 'border-destructive bg-destructive-soft';
const LABEL = 'mb-1.5 block text-sm font-medium text-foreground';

const FieldError = ({ message }: { message: string }) => (
  <p className="mt-1.5 flex items-start gap-1.5 text-sm text-destructive-strong">
    <svg className="mt-0.5 h-4 w-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
    {message}
  </p>
);

const SectionHead = ({ title, description }: { title: string; description: string }) => (
  <div className="mb-4 border-b border-border/70 pb-2">
    <h2 className="text-base font-semibold leading-tight tracking-tight text-foreground">{title}</h2>
    <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
  </div>
);

const SelectChevron = () => (
  <span className="pointer-events-none absolute inset-y-0 right-0 z-10 flex items-center pr-3">
    <svg className="h-4 w-4 text-placeholder" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  </span>
);

// Component untuk auto-fit bounds
function FitBounds({ bounds }: { bounds: MapBounds }) {
  const map = useMap();

  useEffect(() => {
    if (bounds) {
      map.fitBounds(
        [[bounds.south, bounds.west], [bounds.north, bounds.east]],
        { padding: [50, 50], maxZoom: 15 }
      );
    }
  }, [bounds, map]);

  return null;
}

export default function RouteEdit({
  foRoute,
  points = [],
  mapBounds,
  availableAreas,
  availableStatuses
}: PageProps) {
  const { data, setData, put, processing, errors } = useForm({
    name: foRoute.name,
    area: foRoute.area,
    description: foRoute.description || '',
    status: foRoute.status,
    color: foRoute.color,
  });

  // State untuk map dan drag functionality
  const [draggingPointId, setDraggingPointId] = useState<number | null>(null);
  const [updatingPointId, setUpdatingPointId] = useState<number | null>(null);
  const [updateMessage, setUpdateMessage] = useState<{ pointId: number; message: string; type: 'success' | 'error' } | null>(null);
  const [pointPositions, setPointPositions] = useState<Map<number, [number, number]>>(new Map());

  // Initialize point positions
  useEffect(() => {
    const positions = new Map<number, [number, number]>();
    points.forEach(point => {
      positions.set(point.id, [point.latitude, point.longitude]);
    });
    setPointPositions(positions);
  }, [points]);

  // Handler untuk drag marker
  const handleMarkerDragEnd = async (pointId: number, e: any) => {
    const { lat, lng } = e.target.getLatLng();
    setDraggingPointId(null);
    setUpdatingPointId(pointId);
    setUpdateMessage(null);

    // Update local state immediately for better UX
    setPointPositions(prev => {
      const newMap = new Map(prev);
      newMap.set(pointId, [lat, lng]);
      return newMap;
    });

    try {
      const routeUrl = route('admin.fo-management.points.update-coordinates', { foPoint: pointId });

      // Ensure CSRF token is set
      const csrfToken = document.head.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
      if (csrfToken) {
        window.axios.defaults.headers.common['X-CSRF-TOKEN'] = csrfToken;
      }

      const response = await window.axios.patch(routeUrl, {
        latitude: lat,
        longitude: lng,
      });

      if (response.data && response.data.success) {
        setUpdateMessage({
          pointId,
          message: 'Koordinat berhasil diperbarui. GeoJSON akan di-regenerate saat route di-load.',
          type: 'success'
        });
        setTimeout(() => setUpdateMessage(null), 5000);
      } else {
        setUpdateMessage({
          pointId,
          message: 'Gagal memperbarui koordinat. Silakan coba lagi.',
          type: 'error'
        });
        setTimeout(() => setUpdateMessage(null), 5000);
      }
    } catch (error: any) {
      console.error('Error updating coordinates:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Terjadi kesalahan saat memperbarui koordinat.';
      setUpdateMessage({
        pointId,
        message: errorMessage,
        type: 'error'
      });
      setTimeout(() => setUpdateMessage(null), 5000);
    } finally {
      setUpdatingPointId(null);
    }
  };

  // Calculate center for map (use first point or default)
  const mapCenter: [number, number] = points.length > 0
    ? [points[0].latitude, points[0].longitude]
    : [-7.1368, 110.4044]; // Default to Ungaran

  // Generate polyline coordinates from points
  const polylineCoordinates = points
    .sort((a, b) => a.sequence_number - b.sequence_number)
    .map(point => {
      const pos = pointPositions.get(point.id) || [point.latitude, point.longitude];
      return pos as [number, number];
    })
    .filter(coord => coord[0] && coord[1] && !isNaN(coord[0]) && !isNaN(coord[1]));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    put(route('admin.fo-management.routes.update', foRoute.id), {
      onSuccess: () => {
        console.log('Route updated successfully');
      },
      onError: (errors) => {
        console.error('Error updating route:', errors);
      },
      preserveScroll: true
    });
  };

  // Use shared constants instead of local definitions

  return (
    <AdminLayout title={`Edit Jalur FO: ${foRoute.name}`}>
      <Head title={`Edit Jalur FO: ${foRoute.name}`} />

      <div className="space-y-4 sm:space-y-5">
        <PageHeader
          showLogo={false}
          className="mb-0"
          title="Edit Jalur Fiber Optic"
          description={`Jalur: ${foRoute.name}`}
          actions={
            <>
              <Button asChild variant="outline">
                <Link href={route('admin.fo-management.routes.list')} title="Kembali ke daftar jalur FO">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  Kembali
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link href={route('admin.fo-management.routes.detail', foRoute.id)} title="Lihat detail jalur FO">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  Lihat Detail
                </Link>
              </Button>
            </>
          }
        />

        {/* The two real figures on this page, once. Both come from stored
            geometry, so neither is an invented denominator or a trend. */}
        <Card variant="well" padding="none">
          <dl className="grid grid-cols-2 divide-x divide-border/70">
            <div className="px-4 py-3">
              <dt className="text-sm text-muted-foreground">Total Jarak</dt>
              <dd className="mt-0.5 text-2xl font-semibold tabular-nums tracking-tight text-foreground">
                {foRoute.total_distance.toFixed(2)} <span className="text-base font-medium text-muted-foreground">km</span>
              </dd>
            </div>
            <div className="px-4 py-3">
              <dt className="text-sm text-muted-foreground">Total Titik</dt>
              <dd className="mt-0.5 text-2xl font-semibold tabular-nums tracking-tight text-foreground">
                {foRoute.total_points} <span className="text-base font-medium text-muted-foreground">titik</span>
              </dd>
            </div>
          </dl>
        </Card>

        <Card padding="none" className="overflow-hidden">
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 gap-5 p-4 sm:p-5 xl:grid-cols-2">
              {/* Basic Information */}
              <section>
                <SectionHead title="Informasi Dasar" description="Edit data utama jalur fiber optik" />

                <div className="space-y-4">
                  <div>
                    <label htmlFor="name" className={LABEL}>
                      Nama Jalur <span className="text-destructive-strong">*</span>
                    </label>
                    <input
                      type="text"
                      id="name"
                      value={data.name}
                      onChange={(e) => setData('name', e.target.value)}
                      className={cn(CONTROL_BASE, CONTROL_H, errors.name ? CONTROL_INVALID : CONTROL_IDLE)}
                      placeholder="Contoh: Jalur Utama Ungaran"
                    />
                    {errors.name && <FieldError message={errors.name} />}
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label htmlFor="area" className={LABEL}>
                        Area <span className="text-destructive-strong">*</span>
                      </label>
                      <div className="relative">
                        <select
                          id="area"
                          value={data.area}
                          onChange={(e) => setData('area', e.target.value)}
                          className={cn(
                            CONTROL_BASE,
                            CONTROL_H,
                            'appearance-none pr-10',
                            errors.area ? CONTROL_INVALID : CONTROL_IDLE,
                          )}
                          style={{
                            WebkitAppearance: 'none',
                            MozAppearance: 'none',
                            appearance: 'none',
                            backgroundImage: 'none',
                          }}
                        >
                          {availableAreas.map((area) => (
                            <option key={area} value={area}>
                              {area.charAt(0).toUpperCase() + area.slice(1)}
                            </option>
                          ))}
                        </select>
                        <SelectChevron />
                      </div>
                      {errors.area && <FieldError message={errors.area} />}
                    </div>

                    <div>
                      <label htmlFor="status" className={LABEL}>
                        Status <span className="text-destructive-strong">*</span>
                      </label>
                      <div className="relative">
                        <select
                          id="status"
                          value={data.status}
                          onChange={(e) => setData('status', e.target.value)}
                          className={cn(
                            CONTROL_BASE,
                            CONTROL_H,
                            'appearance-none pr-10',
                            errors.status ? CONTROL_INVALID : CONTROL_IDLE,
                          )}
                          style={{
                            WebkitAppearance: 'none',
                            MozAppearance: 'none',
                            appearance: 'none',
                            backgroundImage: 'none',
                          }}
                        >
                          {availableStatuses.map((status) => (
                            <option key={status} value={status}>
                              {getStatusLabel(status)}
                            </option>
                          ))}
                        </select>
                        <SelectChevron />
                      </div>
                      {errors.status && <FieldError message={errors.status} />}
                    </div>
                  </div>

                  <div>
                    <label htmlFor="color" className={LABEL}>
                      Warna Jalur
                    </label>
                    <div className="flex items-center gap-3">
                      {/* Bordered so a pale route colour is still a visible control. */}
                      <input
                        type="color"
                        id="color"
                        value={data.color}
                        onChange={(e) => setData('color', e.target.value)}
                        className="h-11 w-16 flex-shrink-0 cursor-pointer rounded-md border border-border-strong bg-background p-1 transition-colors duration-140 ease-state focus-visible:outline-none focus-visible:ring focus-visible:ring-offset-2 sm:h-10"
                      />
                      <input
                        type="text"
                        value={data.color}
                        onChange={(e) => setData('color', e.target.value)}
                        className={cn(CONTROL_BASE, CONTROL_H, CONTROL_IDLE, 'font-mono uppercase')}
                        placeholder={FO_ROUTE_FALLBACK}
                        aria-label="Warna Jalur"
                      />
                    </div>
                    {errors.color && <FieldError message={errors.color} />}
                  </div>
                </div>
              </section>

              {/* Description and Point Management */}
              <section className="space-y-5">
                <div>
                  <SectionHead title="Deskripsi Jalur" description="Informasi tambahan tentang jalur" />
                  <div>
                    <label htmlFor="description" className={LABEL}>
                      Deskripsi
                    </label>
                    <textarea
                      id="description"
                      rows={5}
                      value={data.description}
                      onChange={(e) => setData('description', e.target.value)}
                      className={cn(
                        CONTROL_BASE,
                        'resize-none py-2.5',
                        errors.description ? CONTROL_INVALID : CONTROL_IDLE,
                      )}
                      placeholder="Deskripsi tambahan untuk jalur ini..."
                    />
                    {errors.description && <FieldError message={errors.description} />}
                  </div>
                </div>

                <div>
                  <SectionHead title="Kelola Titik FO" description="Titik-titik FO membentuk jalur ini" />
                  <p className="text-sm text-muted-foreground">
                    Jalur FO akan otomatis terbentuk berdasarkan urutan titik-titik yang telah ditambahkan.
                    Anda dapat mengelola titik FO melalui halaman detail jalur.
                  </p>
                  <Button asChild variant="outline" className="mt-3 w-full sm:w-auto">
                    <Link href={route('admin.fo-management.routes.detail', foRoute.id)}>
                      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                      </svg>
                      Kelola Titik FO
                    </Link>
                  </Button>
                </div>
              </section>
            </div>

            {/* Map Section for Point Editing */}
            {points.length > 0 && (
              <div className="px-4 pb-4 sm:px-5 sm:pb-5">
                <SectionHead
                  title="Edit Posisi Titik FO"
                  description={`Drag marker untuk mengubah posisi titik. ${points.length} titik tersedia.`}
                />

                {/* Status Messages */}
                {updateMessage && (
                  <div
                    role="status"
                    className={cn(
                      'mb-3 flex items-start gap-2 rounded-md border px-3 py-2.5 text-sm font-medium',
                      updateMessage.type === 'success'
                        ? 'border-success-border bg-success-soft text-success-strong'
                        : 'border-destructive-border bg-destructive-soft text-destructive-strong'
                    )}
                  >
                    {updateMessage.type === 'success' ? (
                      <svg className="mt-0.5 h-4 w-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <svg className="mt-0.5 h-4 w-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    )}
                    <span>{updateMessage.message}</span>
                  </div>
                )}

                {/* Map Container — the subject of this section, so it is the one
                    raised surface on the page. */}
                <Card variant="primary" padding="none" className="relative overflow-hidden" style={{ height: '520px' }}>
                  {updatingPointId && (
                    <div className="absolute inset-0 z-[1000] flex items-center justify-center bg-background/80">
                      <div className="text-center">
                        <svg className="mx-auto mb-2 h-8 w-8 animate-spin text-primary" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <p className="text-sm font-medium text-muted-foreground">Memperbarui koordinat...</p>
                      </div>
                    </div>
                  )}

                  <MapContainer
                    center={mapCenter}
                    zoom={13}
                    style={{ height: '100%', width: '100%', zIndex: 1 }}
                    scrollWheelZoom={true}
                    doubleClickZoom={true}
                    dragging={true}
                    zoomControl={true}
                  >
                    <TileLayer
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                      maxZoom={19}
                    />

                    {/* Auto-fit bounds */}
                    {mapBounds && <FitBounds bounds={mapBounds} />}

                    {/* Route Polyline */}
                    {polylineCoordinates.length > 1 && (
                      <Polyline
                        positions={polylineCoordinates}
                        pathOptions={{
                          // Leaflet options cannot read CSS custom properties, so this
                          // stays a literal. The fallback is the first categorical
                          // route colour from the map ramp, not a chrome hue.
                          color: foRoute.color || '#982700',
                          weight: 4,
                          opacity: 0.7,
                        }}
                      />
                    )}

                    {/* Draggable Point Markers */}
                    {points.map((point) => {
                      const position = pointPositions.get(point.id) || [point.latitude, point.longitude];
                      const isUpdating = updatingPointId === point.id;
                      const isDragging = draggingPointId === point.id;

                      return (
                        <Marker
                          key={point.id}
                          position={position as [number, number]}
                          draggable={!isUpdating}
                          icon={getIconByImagesAndSide(
                            point.images || { isp: null, pole: null, junction_box: null },
                            point.side_of_road
                          )}
                          eventHandlers={{
                            dragstart: (e) => {
                              // Close popup before dragging to prevent interference
                              if (e.target && typeof e.target.closePopup === 'function') {
                                e.target.closePopup();
                              }
                              setDraggingPointId(point.id);
                            },
                            dragend: (e) => handleMarkerDragEnd(point.id, e),
                          }}
                          opacity={isUpdating ? 0.6 : 1}
                        >
                          <Popup closeOnClick={false} autoClose={false}>
                            <div className="min-w-[150px] text-center">
                              <p className="text-sm font-semibold text-foreground">{point.name}</p>
                              <p className="mt-1 text-xs text-muted-foreground">
                                Urutan: {point.sequence_number}
                              </p>
                              <p className="mt-1 font-mono text-xs tabular-nums text-placeholder">
                                {position[0].toFixed(6)}, {position[1].toFixed(6)}
                              </p>
                              <p className="mt-2 text-xs text-primary">
                                {isUpdating
                                  ? 'Memperbarui...'
                                  : 'Lepaskan untuk menyimpan'}
                              </p>
                            </div>
                          </Popup>
                        </Marker>
                      );
                    })}
                  </MapContainer>
                </Card>

                <p className="mt-2 text-xs text-muted-foreground">
                  Koordinat akan otomatis ter-update. GeoJSON route akan di-regenerate saat route di-load.
                </p>
              </div>
            )}

            {/* Submit Buttons */}
            <div className="border-t border-border bg-well px-4 py-3 sm:px-5">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
                <Button asChild variant="outline" size="lg" className="w-full sm:w-auto">
                  <Link href={route('admin.fo-management.routes.detail', foRoute.id)}>
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Batal
                  </Link>
                </Button>
                <Button type="submit" size="lg" disabled={processing} className="w-full sm:w-auto">
                  {processing ? (
                    <>
                      <svg className="animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <>
                      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                      </svg>
                      <span>Perbarui Jalur</span>
                    </>
                  )}
                </Button>
              </div>
            </div>
          </form>
        </Card>
      </div>
    </AdminLayout>
  );
}
