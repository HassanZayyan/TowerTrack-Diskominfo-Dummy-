import React, { useState, useEffect } from 'react';
import { Head, useForm, Link } from '@inertiajs/react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import AdminLayout from '@/Layouts/AdminLayout';
import ProviderSelection from '@/Components/Admin/ProviderSelection';
import PageHeader from '@/Components/PageHeader';
import { Button } from '@/Components/ui/button';
import { Card } from '@/Components/ui/card';
import { cn } from '@/lib/utils';
import { getIconByImagesAndSide } from '@/utils/foIconUtils';
import { getStatusLabel, getTypeLabel } from '@/utils/foConstants';
import { createImageFieldTransform } from '@/utils/foFormUtils';
import { useCoordinateUpdate } from '@/Hooks/useCoordinateUpdate';

// Fix Leaflet default icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

/* ------------------------------------------------------------------ *
 * Local form primitives — identical register to PointCreate.
 *
 * Replaced: an icon inside every label, a decorative glyph floating in
 * every input, thirteen hand-copied error rows, three coloured icon
 * tiles and a maroon hero band that repeated AdminLayout's top bar.
 * ------------------------------------------------------------------ */

/** 44px control, hairline border, single focus-visible ring. */
const controlBase = cn(
  'block w-full rounded-md border bg-background text-sm text-foreground',
  'placeholder:text-placeholder transition-colors duration-140 ease-state',
  'focus-visible:outline-none focus-visible:ring focus-visible:ring-offset-2',
  'disabled:cursor-not-allowed disabled:opacity-60',
);

const fieldClass = (hasError?: unknown, extra?: string) =>
  cn(
    controlBase,
    'h-11 px-3',
    hasError ? 'border-destructive' : 'border-input hover:border-border-strong',
    extra,
  );

const textareaClass = (hasError?: unknown, extra?: string) =>
  cn(
    controlBase,
    'min-h-[132px] resize-none px-3 py-2.5 leading-relaxed',
    hasError ? 'border-destructive' : 'border-input hover:border-border-strong',
    extra,
  );

/** Validation is the one place red is not the brand: it stays destructive. */
function FieldError({ id, message }: { id?: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} role="alert" className="mt-1.5 flex items-start gap-1.5 text-xs font-medium text-destructive">
      <svg className="mt-px h-3.5 w-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <span>{message}</span>
    </p>
  );
}

interface FieldRenderProps {
  id: string;
  'aria-invalid': boolean;
  'aria-describedby'?: string;
}

interface FieldProps {
  id: string;
  label: string;
  required?: boolean;
  optional?: boolean;
  hint?: string;
  error?: string;
  className?: string;
  children: (props: FieldRenderProps) => React.ReactNode;
}

function Field({ id, label, required, optional, hint, error, className, children }: FieldProps) {
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;
  return (
    <div className={className}>
      <label
        htmlFor={id}
        className="mb-1.5 flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5 text-sm font-medium text-foreground"
      >
        <span>{label}</span>
        {required && (
          <span className="text-destructive" title="Wajib diisi" aria-hidden="true">
            *
          </span>
        )}
        {optional && <span className="text-xs font-normal text-muted-foreground">(Opsional)</span>}
      </label>
      {children({ id, 'aria-invalid': Boolean(error), 'aria-describedby': describedBy })}
      {hint && !error && (
        <p id={`${id}-hint`} className="mt-1.5 text-xs text-muted-foreground">
          {hint}
        </p>
      )}
      <FieldError id={`${id}-error`} message={error} />
    </div>
  );
}

/** A chevron is an affordance; it is the only icon left on a control. */
function SelectShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative">
      {children}
      <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
        <svg className="h-4 w-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </span>
    </div>
  );
}

function Section({
  title,
  description,
  className,
  contentClassName,
  children,
}: {
  title: string;
  description?: string;
  className?: string;
  contentClassName?: string;
  children: React.ReactNode;
}) {
  return (
    <Card className={className}>
      <div className="rounded-t-lg border-b border-border bg-well px-5 py-3">
        <h2 className="text-sm font-semibold tracking-tight text-foreground">{title}</h2>
        {description && <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>}
      </div>
      <div className={cn('p-5', contentClassName)}>{children}</div>
    </Card>
  );
}

interface FoPoint {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  area: string;
  type: string;
  status: string;
  side_of_road?: 'left' | 'right' | 'unknown' | null;
  route_name: string;
  sequence_number: number;
  description?: string;
  isp_image?: string | null;
  pole_image?: string | null;
  junction_box_image?: string | null;
}

interface AvailableRoute {
  id: number;
  name: string;
  area: string;
}

interface Provider {
  id: number;
  name: string;
}

interface PageProps {
  foPoint: FoPoint;
  availableAreas: string[];
  availableTypes: string[];
  availableStatuses: string[];
  availableRoutes: AvailableRoute[];
  availableProviders?: Provider[];
  currentProviders?: Provider[];
  fromRouteDetail?: boolean;
  parentRouteId?: number | null;
  csrfToken: string;
}

/** Side-of-road choices. The glyph carries the meaning; the fill only marks what is chosen. */
const SIDE_OPTIONS: { value: 'left' | 'right' | 'unknown'; glyph: string; label: string }[] = [
  { value: 'left', glyph: 'L', label: 'Kiri' },
  { value: 'right', glyph: 'R', label: 'Kanan' },
  { value: 'unknown', glyph: '?', label: 'Belum Diketahui' },
];

export default function PointEdit({
  foPoint,
  availableAreas,
  availableTypes,
  availableStatuses,
  availableRoutes,
  availableProviders = [],
  currentProviders = [],
  fromRouteDetail,
  parentRouteId
}: PageProps) {
  // Normalize providers to ensure they are always numbers
  // DRY: Handles both object format {id: number, name: string} and direct number format
  const normalizeProviders = (providers: Provider[]): number[] => {
    if (!providers || providers.length === 0) {
      return [];
    }

    return providers
      .map(p => {
        // Handle both object format {id, name} and direct number format
        if (typeof p === 'object' && p !== null && 'id' in p) {
          const id = p.id;
          return typeof id === 'number' ? id : Number(id);
        }
        // If it's already a number (shouldn't happen with Provider[] type, but defensive)
        if (typeof p === 'number') {
          return p;
        }
        return null;
      })
      .filter((id): id is number => id !== null && !isNaN(id) && id > 0);
  };

  const { data, setData, put, processing, errors, transform } = useForm({
    name: foPoint.name,
    latitude: foPoint.latitude.toString(),
    longitude: foPoint.longitude.toString(),
    area: foPoint.area,
    type: foPoint.type,
    status: foPoint.status,
    side_of_road: foPoint.side_of_road || 'unknown',
    route_name: foPoint.route_name,
    sequence_number: foPoint.sequence_number.toString(),
    description: foPoint.description || '',
    isp_image: foPoint.isp_image || '',
    pole_image: foPoint.pole_image || '',
    junction_box_image: foPoint.junction_box_image || '',
    providers: normalizeProviders(currentProviders), // DRY: Normalize to ensure number[] type
    from_route: fromRouteDetail ? 'detail' : null,
  });

  // Map state
  const [mapCenter, setMapCenter] = useState<[number, number]>([
    foPoint.latitude,
    foPoint.longitude
  ]);
  const [isDragging, setIsDragging] = useState(false);

  // Use custom hook for coordinate updates
  const { isUpdating: isUpdatingCoordinates, message: coordinateUpdateMessage, messageType, updateCoordinates } = useCoordinateUpdate({
    routeUrl: route('admin.fo-management.points.update-coordinates', { foPoint: foPoint.id }),
  });

  // Normalize image fields before submission: convert dash or whitespace to empty string
  transform(createImageFieldTransform());

  // Handler untuk drag marker
  const handleMarkerDragEnd = async (e: any) => {
    const { lat, lng } = e.target.getLatLng();
    setIsDragging(false);

    // Update form data
    setData('latitude', lat.toString());
    setData('longitude', lng.toString());
    setMapCenter([lat, lng]);

    // Use custom hook to update coordinates
    await updateCoordinates(lat, lng);
  };

  // Sync map center dengan input manual
  useEffect(() => {
    const lat = parseFloat(data.latitude);
    const lng = parseFloat(data.longitude);
    if (!isNaN(lat) && !isNaN(lng) && !isDragging) {
      setMapCenter([lat, lng]);
    }
  }, [data.latitude, data.longitude, isDragging]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    try {
      put(route('admin.fo-management.points.update', { foPoint: foPoint.id }), {
        onSuccess: () => {
          // Redirect akan ditangani oleh backend controller
          // Tidak perlu melakukan redirect manual di sini
        },
        onError: (errors) => {
          console.error('Error updating point:', errors);
        },
        preserveScroll: false, // Allow redirect to work properly
      });
    } catch (error) {
      console.error('Unexpected error:', error);
    }
  };

  // Use shared constants instead of local definitions

  return (
    <AdminLayout title={`Edit Titik FO: ${foPoint.name}`}>
      <Head title={`Edit Titik FO: ${foPoint.name}`} />

      <PageHeader
        title="Edit Titik Fiber Optic"
        description={`Edit informasi titik: ${foPoint.name}`}
        showLogo={false}
        className="mb-5"
        actions={
          <Button asChild variant="outline" className="h-11">
            <Link
              href={route('admin.fo-management.routes.detail', parentRouteId || 15)}
              title="Kembali ke detail jalur"
            >
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Kembali
            </Link>
          </Button>
        }
      />

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-1 items-start gap-5 xl:grid-cols-2">
          {/* Column 1 — the record */}
          <div className="space-y-5">
            <Section
              title="Informasi Dasar"
              description="Perbarui informasi dasar titik fiber optic seperti nama, area, dan status"
              contentClassName="space-y-5"
            >
              <Field id="name" label="Nama Titik" required error={errors.name}>
                {(f) => (
                  <input
                    type="text"
                    {...f}
                    value={data.name}
                    onChange={(e) => setData('name', e.target.value)}
                    className={fieldClass(errors.name)}
                    placeholder="Contoh: Menara FO-001"
                  />
                )}
              </Field>

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <Field id="area" label="Area" required error={errors.area}>
                  {(f) => (
                    <SelectShell>
                      <select
                        {...f}
                        value={data.area}
                        onChange={(e) => setData('area', e.target.value)}
                        className={fieldClass(errors.area, 'appearance-none pr-9')}
                      >
                        {availableAreas.map((area) => (
                          <option key={area} value={area}>
                            {area.charAt(0).toUpperCase() + area.slice(1)}
                          </option>
                        ))}
                      </select>
                    </SelectShell>
                  )}
                </Field>

                <Field id="type" label="Tipe" required error={errors.type}>
                  {(f) => (
                    <SelectShell>
                      <select
                        {...f}
                        value={data.type}
                        onChange={(e) => setData('type', e.target.value)}
                        className={fieldClass(errors.type, 'appearance-none pr-9')}
                      >
                        {availableTypes.map((type) => (
                          <option key={type} value={type}>
                            {getTypeLabel(type, true)}
                          </option>
                        ))}
                      </select>
                    </SelectShell>
                  )}
                </Field>

                <Field id="status" label="Status" required error={errors.status}>
                  {(f) => (
                    <SelectShell>
                      <select
                        {...f}
                        value={data.status}
                        onChange={(e) => setData('status', e.target.value)}
                        className={fieldClass(errors.status, 'appearance-none pr-9')}
                      >
                        {availableStatuses.map((status) => (
                          <option key={status} value={status}>
                            {getStatusLabel(status, true)}
                          </option>
                        ))}
                      </select>
                    </SelectShell>
                  )}
                </Field>

                <Field id="sequence_number" label="Nomor Urut" required error={errors.sequence_number}>
                  {(f) => (
                    <input
                      type="number"
                      min="1"
                      {...f}
                      value={data.sequence_number}
                      onChange={(e) => setData('sequence_number', e.target.value)}
                      className={fieldClass(errors.sequence_number, 'tabular-nums')}
                      placeholder="1"
                    />
                  )}
                </Field>
              </div>

              {/* Side of Road Picker — a segmented control, not three 96px tiles. */}
              <div>
                <span id="side_of_road-label" className="mb-1.5 block text-sm font-medium text-foreground">
                  Sisi Jalan
                </span>
                <div
                  role="radiogroup"
                  aria-labelledby="side_of_road-label"
                  className="grid grid-cols-3 gap-2"
                >
                  {SIDE_OPTIONS.map((option) => {
                    const selected = data.side_of_road === option.value;
                    return (
                      <button
                        key={option.value}
                        type="button"
                        role="radio"
                        aria-checked={selected}
                        title={option.label}
                        onClick={() => setData('side_of_road', option.value)}
                        className={cn(
                          'flex h-11 items-center justify-center gap-2 rounded-md border px-2 text-sm font-medium',
                          'transition-colors duration-140 ease-state',
                          'focus-visible:outline-none focus-visible:ring focus-visible:ring-offset-2',
                          selected
                            ? 'border-primary-border bg-primary-soft text-primary-strong'
                            : 'border-input bg-background text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                        )}
                      >
                        <span
                          aria-hidden="true"
                          className={cn(
                            'flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border text-xs font-semibold',
                            selected
                              ? 'border-primary bg-primary text-primary-foreground'
                              : 'border-border-strong bg-well text-muted-foreground',
                          )}
                        >
                          {option.glyph}
                        </span>
                        <span className="min-w-0 truncate">{option.label}</span>
                      </button>
                    );
                  })}
                </div>
                <FieldError message={errors.side_of_road} />
              </div>
            </Section>

            {/* Provider Selection - DRY: Using reusable component */}
            <ProviderSelection
              providers={data.providers || []}
              availableProviders={availableProviders}
              onChange={(selectedProviders) => setData('providers', selectedProviders)}
              errors={errors.providers}
              colorScheme="red"
              label="Provider"
              useBackdropBlur={true}
            />
          </div>

          {/* Column 2 — the map is the subject of this screen */}
          <Section
            title="Lokasi & Jalur"
            description="Tentukan koordinat lokasi dan jalur yang akan dilalui titik ini. Drag marker di map untuk mengubah posisi."
            contentClassName="space-y-5"
          >
            <div>
              <span className="mb-1.5 flex flex-wrap items-baseline gap-x-1.5 text-sm font-medium text-foreground">
                <span>Posisi Titik (Drag marker untuk mengubah posisi)</span>
                <span className="text-destructive" title="Wajib diisi" aria-hidden="true">*</span>
              </span>

              {/* Status Message */}
              {coordinateUpdateMessage && (
                <div
                  role={messageType === 'success' ? 'status' : 'alert'}
                  className={cn(
                    'mb-2 flex items-start gap-2 rounded-md border px-3 py-2 text-sm font-medium',
                    messageType === 'success'
                      ? 'border-success-border bg-success-soft text-success-strong'
                      : 'border-destructive-border bg-destructive-soft text-destructive-strong',
                  )}
                >
                  {messageType === 'success' ? (
                    <svg className="mt-0.5 h-4 w-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  ) : (
                    <svg className="mt-0.5 h-4 w-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  )}
                  <span>{coordinateUpdateMessage}</span>
                </div>
              )}

              {/* Map Container */}
              <div className="relative overflow-hidden rounded-md border border-border" style={{ height: '340px' }}>
                {isUpdatingCoordinates && (
                  <div className="absolute inset-0 z-[1000] flex items-center justify-center bg-background/80">
                    <div className="flex flex-col items-center gap-3">
                      <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
                      <p className="text-sm font-medium text-muted-foreground">Memperbarui koordinat...</p>
                    </div>
                  </div>
                )}

                <MapContainer
                  center={mapCenter}
                  zoom={15}
                  style={{ height: '100%', width: '100%', zIndex: 1 }}
                  scrollWheelZoom={true}
                  doubleClickZoom={true}
                  dragging={true}
                  zoomControl={true}
                  key={`map-${foPoint.id}-${mapCenter[0]}-${mapCenter[1]}`}
                >
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    maxZoom={19}
                  />

                  {/* Draggable Marker */}
                  <Marker
                    key={`marker-${foPoint.id}-${data.side_of_road}-${data.isp_image}-${data.pole_image}-${data.junction_box_image}`}
                    position={mapCenter}
                    draggable={true}
                    icon={getIconByImagesAndSide(
                      {
                        isp: data.isp_image || null,
                        pole: data.pole_image || null,
                        junction_box: data.junction_box_image || null,
                      },
                      data.side_of_road || 'unknown'
                    )}
                    eventHandlers={{
                      dragstart: (e) => {
                        // Close popup before dragging to prevent interference
                        if (e.target && typeof e.target.closePopup === 'function') {
                          e.target.closePopup();
                        }
                        setIsDragging(true);
                      },
                      dragend: handleMarkerDragEnd,
                    }}
                  >
                    <Popup closeOnClick={false} autoClose={false}>
                      <div className="text-center">
                        <p className="text-sm font-semibold">{foPoint.name}</p>
                        <p className="mt-1 text-xs tabular-nums text-muted-foreground">
                          {mapCenter[0].toFixed(6)}, {mapCenter[1].toFixed(6)}
                        </p>
                        <p className="mt-2 text-xs text-primary">
                          {isUpdatingCoordinates
                            ? 'Memperbarui...'
                            : 'Lepaskan untuk menyimpan posisi'}
                        </p>
                      </div>
                    </Popup>
                  </Marker>
                </MapContainer>
              </div>

              <p className="mt-1.5 text-xs text-muted-foreground">
                Drag marker di map untuk mengubah posisi. Koordinat akan otomatis ter-update. GeoJSON akan di-regenerate saat route di-load.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <Field id="latitude" label="Latitude" required error={errors.latitude}>
                {(f) => (
                  <input
                    type="number"
                    step="any"
                    {...f}
                    value={data.latitude}
                    onChange={(e) => setData('latitude', e.target.value)}
                    className={fieldClass(errors.latitude, 'tabular-nums')}
                    placeholder="-7.123456"
                  />
                )}
              </Field>

              <Field id="longitude" label="Longitude" required error={errors.longitude}>
                {(f) => (
                  <input
                    type="number"
                    step="any"
                    {...f}
                    value={data.longitude}
                    onChange={(e) => setData('longitude', e.target.value)}
                    className={fieldClass(errors.longitude, 'tabular-nums')}
                    placeholder="110.123456"
                  />
                )}
              </Field>
            </div>

            <Field id="route_name" label="Nama Jalur" required error={errors.route_name}>
              {(f) => (
                <SelectShell>
                  <select
                    {...f}
                    value={data.route_name}
                    onChange={(e) => setData('route_name', e.target.value)}
                    className={fieldClass(errors.route_name, 'appearance-none pr-9')}
                  >
                    <option value="">Pilih Jalur...</option>
                    {availableRoutes.map((route) => (
                      <option key={route.id} value={route.name}>
                        {route.name} ({route.area})
                      </option>
                    ))}
                  </select>
                </SelectShell>
              )}
            </Field>
          </Section>

          {/* Full width — the long text sits beside the three link fields */}
          <Section
            title="Deskripsi Tambahan"
            description="Tambahkan informasi detail atau catatan khusus untuk titik ini"
            className="xl:col-span-2"
            contentClassName="grid grid-cols-1 gap-5 lg:grid-cols-2"
          >
            <Field id="description" label="Deskripsi" error={errors.description}>
              {(f) => (
                <textarea
                  rows={4}
                  {...f}
                  value={data.description}
                  onChange={(e) => setData('description', e.target.value)}
                  className={textareaClass(errors.description)}
                  placeholder="Contoh: Titik ini berada di dekat menara seluler, akses jalan mudah, perlu koordinasi dengan pihak ketiga..."
                />
              )}
            </Field>

            <div className="space-y-5">
              <Field id="isp_image" label="Link Foto ISP (Google Drive)" optional error={errors.isp_image}>
                {(f) => (
                  <input
                    type="url"
                    {...f}
                    value={data.isp_image}
                    onChange={(e) => setData('isp_image', e.target.value)}
                    className={fieldClass(errors.isp_image)}
                    placeholder="https://drive.google.com/..."
                  />
                )}
              </Field>

              <Field id="pole_image" label="Link Foto Tiang (Google Drive)" optional error={errors.pole_image}>
                {(f) => (
                  <input
                    type="url"
                    {...f}
                    value={data.pole_image}
                    onChange={(e) => setData('pole_image', e.target.value)}
                    className={fieldClass(errors.pole_image)}
                    placeholder="https://drive.google.com/..."
                  />
                )}
              </Field>

              <Field id="junction_box_image" label="Link Foto Joint Box (Google Drive)" optional error={errors.junction_box_image}>
                {(f) => (
                  <input
                    type="url"
                    {...f}
                    value={data.junction_box_image}
                    onChange={(e) => setData('junction_box_image', e.target.value)}
                    className={fieldClass(errors.junction_box_image)}
                    placeholder="https://drive.google.com/..."
                  />
                )}
              </Field>
            </div>
          </Section>
        </div>

        {/* Sticky action footer — replaces a 140px "Konfirmasi Perubahan" panel
            whose payload was one sentence and one button.
            "Perbarui Titik" saves — it is a primary action, not a destructive one. */}
        <div className="sticky bottom-0 z-20 -mx-3 border-t border-border bg-card px-3 py-3 sm:-mx-4 sm:px-4 md:-mx-6 md:px-6 lg:-mx-8 lg:px-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-muted-foreground">Pastikan semua data sudah benar sebelum menyimpan</p>
            <Button type="submit" disabled={processing} className="h-11 w-full sm:w-auto">
              {processing ? (
                <>
                  <svg className="animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Memperbarui...
                </>
              ) : (
                <>
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  Perbarui Titik
                </>
              )}
            </Button>
          </div>
        </div>
      </form>
    </AdminLayout>
  );
}
