import React from 'react';
import { Head, useForm, Link } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import PageHeader from '@/Components/PageHeader';
import { Button } from '@/Components/ui/button';
import { Card } from '@/Components/ui/card';
import { cn } from '@/lib/utils';
import { STATUS_LABELS, getStatusLabel } from '@/utils/foConstants';
import { FO_ROUTE_FALLBACK } from '@/lib/map-palette';

interface PageProps {
  availableAreas: string[];
  availableStatuses: string[];
  csrfToken: string;
}

/**
 * ONE field recipe for the whole page.
 *
 * Removed here:
 * - the maroon hero band with a 40px icon tile and a 3-dot "Langkah 1/2/3"
 *   rail. AdminLayout already renders a maroon top bar; a second brand band
 *   underneath it is the page competing with its own chrome. The step copy is
 *   preserved verbatim, folded into one 16px line.
 * - the per-label 16px icon (6 of them) and the two coloured section-head
 *   icon tiles. A text label with an asterisk says everything the tag icon,
 *   the map pin and the palette icon were saying.
 * - the tick badge floating on the colour swatch — decoration on a control
 *   that already shows its own value.
 *
 * Control height is 44px on touch, 40px from sm up.
 */
const FIELD_BASE =
  'block w-full rounded-md border bg-background px-3 text-sm text-foreground transition-colors duration-140 ease-state placeholder:text-placeholder focus-visible:outline-none focus-visible:ring focus-visible:ring-offset-2';
const FIELD_H = 'h-11 sm:h-10';
const FIELD_DEFAULT = 'border-input hover:border-border-strong';
const FIELD_INVALID = 'border-destructive bg-destructive-soft';
const LABEL = 'mb-1.5 block text-sm font-medium text-foreground';

/** Inline validation text — red here MEANS "this is wrong", so it stays red. */
const FieldError = ({ message }: { message: string }) => (
  <p className="mt-1.5 flex items-start gap-1.5 text-sm text-destructive-strong">
    <svg className="mt-0.5 h-4 w-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
    {message}
  </p>
);

/** Section head: title and subtitle are one unit (2px), 16px to the fields. */
const SectionHead = ({ title, description }: { title: string; description: string }) => (
  <div className="mb-4 border-b border-border/70 pb-2">
    <h2 className="text-base font-semibold leading-tight tracking-tight text-foreground">{title}</h2>
    <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
  </div>
);

/** The one select-chevron recipe, instead of the 12-site copy/paste. */
const SelectChevron = () => (
  <span className="pointer-events-none absolute inset-y-0 right-0 z-10 flex items-center pr-3">
    <svg className="h-4 w-4 text-placeholder" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  </span>
);

const STEPS = ['Langkah 1: Informasi Dasar', 'Langkah 2: Koordinat Jalur', 'Langkah 3: Simpan'];

const HOW_TO_ADD_POINTS = [
  'Buat jalur FO terlebih dahulu dengan mengisi form ini',
  'Setelah jalur berhasil dibuat, Anda akan diarahkan ke halaman detail jalur',
  'Di halaman detail, klik tombol "Tambah Titik" untuk menambahkan titik-titik FO',
  'Jalur akan otomatis terbentuk berdasarkan urutan titik yang ditambahkan',
];

export default function RouteCreate({ availableAreas, availableStatuses }: PageProps) {
  const { data, setData, post, processing, errors } = useForm({
    name: '',
    area: 'ungaran',
    description: '',
    status: 'active',
    color: FO_ROUTE_FALLBACK,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    post(route('admin.fo-management.routes.store'));
  };

  // Use shared constants instead of local definitions

  return (
    <AdminLayout title="Tambah Jalur FO">
      <Head title="Tambah Jalur FO" />

      <div className="space-y-4 sm:space-y-5">
        <PageHeader
          showLogo={false}
          className="mb-0"
          title="Tambah Jalur FO Baru"
          description="Buat jalur fiber optic baru dengan menentukan koordinat dan informasi jalur"
          actions={
            <Button asChild variant="outline">
              <Link href={route('admin.fo-management.routes.list')} title="Kembali ke daftar jalur FO">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Kembali
              </Link>
            </Button>
          }
        />

        {/* Was three stacked rows of dots inside the brand band; now one line. */}
        <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
          {STEPS.map((step, i) => (
            <li key={step} className="flex items-center gap-2">
              {i > 0 && <span aria-hidden="true" className="text-border-strong">/</span>}
              <span>{step}</span>
            </li>
          ))}
        </ol>

        <Card padding="none" className="overflow-hidden">
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 gap-5 p-4 sm:p-5 lg:grid-cols-2">
              {/* Basic information */}
              <section>
                <SectionHead
                  title="Informasi Dasar"
                  description="Masukkan informasi dasar untuk jalur fiber optic"
                />

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
                      className={cn(FIELD_BASE, FIELD_H, errors.name ? FIELD_INVALID : FIELD_DEFAULT)}
                      placeholder="Contoh: Jalur Utama Ungaran - Semarang"
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
                            FIELD_BASE,
                            FIELD_H,
                            'appearance-none pr-10',
                            errors.area ? FIELD_INVALID : FIELD_DEFAULT,
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
                            FIELD_BASE,
                            FIELD_H,
                            'appearance-none pr-10',
                            errors.status ? FIELD_INVALID : FIELD_DEFAULT,
                          )}
                          style={{
                            WebkitAppearance: 'none',
                            MozAppearance: 'none',
                            appearance: 'none',
                            backgroundImage: 'none',
                          }}
                        >
                          <option value="">Pilih Status</option>
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
                      {/* Operator-chosen hue. The swatch carries an explicit
                          border-border-strong so a near-white pick is still a
                          visible control and not a hole in the form. */}
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
                        className={cn(FIELD_BASE, FIELD_H, FIELD_DEFAULT, 'font-mono uppercase')}
                        placeholder={FO_ROUTE_FALLBACK}
                        aria-label="Warna Jalur"
                      />
                    </div>
                    {errors.color && <FieldError message={errors.color} />}
                  </div>
                </div>
              </section>

              {/* Description */}
              <section>
                <SectionHead
                  title="Deskripsi Jalur"
                  description="Tambahkan deskripsi detail untuk jalur fiber optic"
                />

                <div>
                  <label htmlFor="description" className={LABEL}>
                    Deskripsi Jalur
                  </label>
                  <div className="relative">
                    <textarea
                      id="description"
                      rows={8}
                      value={data.description}
                      onChange={(e) => setData('description', e.target.value)}
                      className={cn(
                        FIELD_BASE,
                        'resize-none py-2.5 pb-7',
                        errors.description ? FIELD_INVALID : FIELD_DEFAULT,
                      )}
                      placeholder="Masukkan deskripsi detail jalur fiber optic, termasuk informasi teknis, lokasi penting, atau catatan khusus..."
                    />
                    <span className="pointer-events-none absolute bottom-2 right-3 text-xs tabular-nums text-placeholder">
                      {data.description.length}/500
                    </span>
                  </div>
                  {errors.description && <FieldError message={errors.description} />}
                </div>
              </section>
            </div>

            {/* Workflow guidance. Was a tinted panel inside a tinted panel inside
                a card; now one inset well, which is what an aside actually is. */}
            <div className="px-4 pb-4 sm:px-5 sm:pb-5">
              <Card variant="well" padding="default">
                <div className="flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
                  <h2 className="text-base font-semibold leading-tight tracking-tight text-foreground">
                    Manajemen Titik FO
                  </h2>
                  <p className="text-sm text-muted-foreground">Tambahkan titik-titik FO setelah jalur dibuat</p>
                </div>

                <h3 className="mt-4 text-sm font-medium text-foreground">Cara Menambahkan Titik FO:</h3>
                <ol className="mt-2 space-y-1.5 text-sm text-foreground">
                  {HOW_TO_ADD_POINTS.map((step, i) => (
                    <li key={step} className="flex items-start gap-2">
                      <span className="w-4 flex-shrink-0 font-semibold tabular-nums text-muted-foreground">
                        {i + 1}.
                      </span>
                      <span className="min-w-0">{step}</span>
                    </li>
                  ))}
                </ol>

                <p className="mt-3 flex items-start gap-2 border-t border-border/70 pt-3 text-sm text-muted-foreground">
                  <svg className="mt-0.5 h-4 w-4 flex-shrink-0 text-warning-strong" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Minimal 2 titik diperlukan untuk membentuk jalur FO</span>
                </p>
              </Card>
            </div>

            {/* Submit bar. Inset ground so it reads as the base of the card. */}
            <div className="flex flex-col gap-3 border-t border-border bg-well px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
              <p className="text-sm text-muted-foreground">Pastikan semua data sudah benar sebelum menyimpan</p>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <Button asChild variant="outline" size="lg" className="w-full sm:w-auto">
                  <Link href={route('admin.fo-management.routes.list')}>
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
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Menyimpan...
                    </>
                  ) : (
                    <>
                      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Simpan Jalur
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
