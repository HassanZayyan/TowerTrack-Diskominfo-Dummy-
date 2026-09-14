import React from 'react';
import { Head, useForm, Link } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import ProviderSelection from '@/Components/Admin/ProviderSelection';
import PageHeader from '@/Components/PageHeader';
import { Button } from '@/Components/ui/button';
import { Card } from '@/Components/ui/card';
import { cn } from '@/lib/utils';
import { getStatusLabel, getTypeLabel } from '@/utils/foConstants';
import { createImageFieldTransform } from '@/utils/foFormUtils';

interface FoRoute {
  id: number;
  name: string;
  area: string;
  status: string;
  color: string;
  total_distance: number;
  total_points: number;
  description?: string;
}

interface Provider {
  id: number;
  name: string;
}

interface PageProps {
  foRoute: FoRoute;
  availableTypes: string[];
  availableStatuses: string[];
  nextSequence: number;
  availableProviders?: Provider[];
  csrfToken: string;
}

/* ------------------------------------------------------------------ *
 * Local form primitives.
 *
 * This page carried five label recipes, a decorative icon inside every
 * label, a coloured icon tile on every section head and a maroon hero
 * band stacked under AdminLayout's maroon top bar. One control recipe,
 * one label recipe and one invalid treatment replace all of it.
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

export default function PointCreate({ foRoute, availableTypes, availableStatuses, nextSequence, availableProviders = [] }: PageProps) {
  const { data, setData, post, processing, errors, transform } = useForm({
    name: '',
    latitude: '',
    longitude: '',
    area: foRoute.area,
    type: 'pole',
    status: 'active',
    side_of_road: 'unknown',
    route_name: foRoute.name,
    route_id: foRoute.id,
    sequence_number: nextSequence.toString(),
    description: '',
    isp_image: '',
    pole_image: '',
    junction_box_image: '',
    providers: [] as number[], // Array of provider IDs
  });

  // Normalize image fields before submission: convert dash or whitespace to empty string
  transform(createImageFieldTransform());

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    post(route('admin.fo-management.points.store'), {
      onSuccess: () => {
        console.log('Point created successfully');
      },
      onError: (errors) => {
        console.error('Error creating point:', errors);
      },
      preserveScroll: true
    });
  };

  // Use shared constants instead of local definitions

  return (
    <AdminLayout title={`Tambah Titik FO - ${foRoute.name}`}>
      <Head title={`Tambah Titik FO - ${foRoute.name}`} />

      <PageHeader
        title="Tambah Titik FO Baru"
        showLogo={false}
        className="mb-5"
        actions={
          <Button asChild variant="outline" className="h-11">
            <Link href={route('admin.fo-management.routes.detail', foRoute.id)}>
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Kembali ke Detail Jalur
            </Link>
          </Button>
        }
      />

      {/* Context strip — the same four facts the 200px brand hero used to hold. */}
      <Card variant="well" padding="dense" className="mb-5">
        <dl className="flex flex-wrap items-center gap-x-6 gap-y-1.5 text-sm">
          <div className="flex min-w-0 items-baseline gap-1.5">
            <dt className="text-muted-foreground">Jalur:</dt>
            <dd className="min-w-0 truncate font-medium text-foreground" title={foRoute.name}>
              {foRoute.name}
            </dd>
          </div>
          <div className="flex items-baseline gap-1.5">
            <dt className="text-muted-foreground">Area:</dt>
            <dd className="font-medium text-foreground">{foRoute.area}</dd>
          </div>
          <div className="text-muted-foreground">
            Titik ke-<span className="font-medium tabular-nums text-foreground">{nextSequence}</span>
          </div>
          <div className="text-muted-foreground">
            Total <span className="font-medium tabular-nums text-foreground">{foRoute.total_points}</span> titik existing
          </div>
        </dl>
      </Card>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-2">
          {/* Column 1 — the record itself */}
          <Section title="Informasi Dasar" description="Data utama titik fiber optik" contentClassName="space-y-5">
            <Field id="name" label="Nama Titik" required error={errors.name}>
              {(f) => (
                <input
                  type="text"
                  {...f}
                  value={data.name}
                  onChange={(e) => setData('name', e.target.value)}
                  className={fieldClass(errors.name)}
                  placeholder={`Contoh: FO-${foRoute.name}-${nextSequence}`}
                />
              )}
            </Field>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <Field id="type" label="Tipe Titik" required error={errors.type}>
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
                          {getTypeLabel(type)}
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
                          {getStatusLabel(status)}
                        </option>
                      ))}
                    </select>
                  </SelectShell>
                )}
              </Field>

              <Field id="side_of_road" label="Sisi Jalan" required error={errors.side_of_road}>
                {(f) => (
                  <SelectShell>
                    <select
                      {...f}
                      value={data.side_of_road}
                      onChange={(e) => setData('side_of_road', e.target.value)}
                      className={fieldClass(errors.side_of_road, 'appearance-none pr-9')}
                    >
                      <option value="unknown">Tidak Diketahui</option>
                      <option value="left">Kiri</option>
                      <option value="right">Kanan</option>
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
          </Section>

          {/* Column 2 — where it sits, and who owns it */}
          <div className="space-y-5">
            <Section title="Lokasi Koordinat" description="Tentukan posisi titik FO" contentClassName="space-y-5">
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

              {/* Was an info-tinted panel; it is one line of help text. */}
              <p className="text-xs text-muted-foreground">
                Gunakan format desimal untuk koordinat (contoh: -7.123456, 110.123456)
              </p>
            </Section>

            {/* ProviderSelection carries its own panel — wrapping it in a Card
                would be exactly the card-in-card this rebuild removes. */}
            <ProviderSelection
              providers={data.providers || []}
              availableProviders={availableProviders}
              onChange={(selectedProviders) => setData('providers', selectedProviders)}
              errors={errors.providers}
              colorScheme="amber"
              label="Pilih Provider"
            />
          </div>

          {/* Full width — the long text sits beside the three link fields */}
          <Section
            title="Deskripsi"
            description="Informasi tambahan (opsional)"
            className="lg:col-span-2"
            contentClassName="grid grid-cols-1 gap-5 lg:grid-cols-2"
          >
            <Field id="description" label="Deskripsi Titik" error={errors.description}>
              {(f) => (
                <textarea
                  rows={4}
                  {...f}
                  value={data.description}
                  onChange={(e) => setData('description', e.target.value)}
                  className={textareaClass(errors.description)}
                  placeholder="Contoh: Titik ini berada di dekat menara seluler, akses jalan mudah..."
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

        {/* Sticky action footer — one action zone, reachable from anywhere in
            the form. Solid surface, not a blurred panel. */}
        <div className="sticky bottom-0 z-20 -mx-3 border-t border-border bg-card px-3 py-3 sm:-mx-4 sm:px-4 md:-mx-6 md:px-6 lg:-mx-8 lg:px-8">
          <div className="flex flex-col-reverse items-stretch gap-3 sm:flex-row sm:items-center sm:justify-end">
            <Button asChild variant="outline" className="h-11 w-full sm:w-auto">
              <Link href={route('admin.fo-management.routes.detail', foRoute.id)}>
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Batal
              </Link>
            </Button>
            <Button type="submit" disabled={processing} className="h-11 w-full sm:w-auto">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              {processing ? 'Menyimpan...' : 'Simpan Titik'}
            </Button>
          </div>
        </div>
      </form>
    </AdminLayout>
  );
}
