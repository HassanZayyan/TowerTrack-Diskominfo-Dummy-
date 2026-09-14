import React, { useState, useCallback } from 'react';
import { Head, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import PageHeader from '@/Components/PageHeader';
import { Button } from '@/Components/ui/button';
import { Badge } from '@/Components/ui/badge';
import { Card } from '@/Components/ui/card';
import { cn } from '@/lib/utils';
import { SITE_TYPE_OPTIONS } from '@/constants/towerOptions';

interface Owner {
  id: number;
  name: string;
  alamat: string;
}

interface Props {
  owners: Owner[];
}

interface FormData {
  site_name: string;
  site_id: string;
  site_sap: string;
  latitude: string;
  longitude: string;
  alamat_menara: string;
  tinggi_menara: string;
  tinggi_bangunan: string;
  jumlah_pengguna: string;
  jumlah_kaki: string;
  site_type: string;
  tower_type: string;
  prs: string;
  prs_id: string;
  no_ijin: string;
  jenis_ijin: string;
  tanggal_ijin: string;
  berlaku_hingga: string;
  status_ijin: string;
  owner_id: string;
  owner_name: string;
  owner_alamat: string;
}

/* ---------------------------------------------------------------------------
   One label recipe, one control recipe. The previous version repeated
   `block text-sm font-medium text-foreground mb-2` twenty times in this file
   alone, which is both a token violation and the reason nothing on the form
   could be restyled in one place.
   ------------------------------------------------------------------------- */
const FIELD_LABEL = 'block text-sm font-medium text-foreground';

const fieldId = (field: keyof FormData) => `tower-${field}`;

/** Which tab owns which field — drives the per-tab error counters. */
const TAB_FIELDS: Record<string, Array<keyof FormData>> = {
  basic: ['site_name', 'site_id', 'site_sap', 'site_type', 'owner_id'],
  location: ['longitude', 'latitude', 'alamat_menara'],
  technical: ['tinggi_menara', 'tinggi_bangunan', 'jumlah_pengguna', 'jumlah_kaki', 'tower_type', 'prs', 'prs_id'],
  permits: ['no_ijin', 'jenis_ijin', 'tanggal_ijin', 'berlaku_hingga', 'status_ijin'],
};

const TABS: ReadonlyArray<{ id: string; label: string }> = [
  { id: 'basic', label: 'Info Dasar' },
  { id: 'location', label: 'Lokasi' },
  { id: 'technical', label: 'Teknis' },
  { id: 'permits', label: 'Perijinan' },
];

/** Label + control + optional hint. Replaces 20 hand-typed label divs. */
const Field: React.FC<{
  label: string;
  htmlFor: string;
  required?: boolean;
  hint?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}> = ({ label, htmlFor, required = false, hint, className, children }) => (
  <div className={cn('space-y-1.5', className)}>
    <label htmlFor={htmlFor} className={FIELD_LABEL}>
      {label}
      {required && (
        <span className="ml-1 font-semibold text-destructive" title="Wajib diisi" aria-hidden="true">
          *
        </span>
      )}
    </label>
    {children}
    {hint && <p className="text-xs leading-snug text-muted-foreground">{hint}</p>}
  </div>
);

// Move FormInput component outside to prevent re-creation
const FormInput: React.FC<{
  field: keyof FormData;
  type?: string;
  placeholder?: string;
  options?: { value: string; label: string }[];
  rows?: number;
  required?: boolean;
  value: string;
  onChange: (field: keyof FormData, value: string) => void;
  error?: string;
}> = ({ field, type = 'text', placeholder, options, rows, required = false, value, onChange, error }) => {
  // Validation stays on destructive tokens, and is never signalled by colour
  // alone: the message below carries an icon and words.
  const baseClass = cn(
    'w-full rounded-md border bg-card px-3 text-sm text-foreground placeholder:text-placeholder',
    'transition-colors duration-140 ease-state',
    'focus-visible:outline-none focus-visible:ring focus-visible:ring-offset-2',
    error ? 'border-destructive bg-destructive-soft' : 'border-input',
  );

  const message = error ? (
    <p id={`${fieldId(field)}-error`} className="mt-1.5 flex items-start gap-1.5 text-xs text-destructive-strong">
      <svg className="mt-px h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <span>{error}</span>
    </p>
  ) : null;

  const a11y = {
    id: fieldId(field),
    required,
    'aria-invalid': error ? true : undefined,
    'aria-describedby': error ? `${fieldId(field)}-error` : undefined,
  } as const;

  if (options) {
    return (
      <div>
        <select
          {...a11y}
          className={cn(baseClass, 'h-11')}
          value={value}
          onChange={(e) => onChange(field, e.target.value)}
        >
          <option value="">{placeholder || `Pilih ${field}`}</option>
          {options.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        {message}
      </div>
    );
  }

  if (rows) {
    return (
      <div>
        <textarea
          {...a11y}
          className={cn(baseClass, 'resize-none py-2.5')}
          rows={rows}
          value={value}
          onChange={(e) => onChange(field, e.target.value)}
          placeholder={placeholder}
        />
        {message}
      </div>
    );
  }

  return (
    <div>
      <input
        {...a11y}
        type={type}
        className={cn(baseClass, 'h-11')}
        value={value}
        onChange={(e) => onChange(field, e.target.value)}
        placeholder={placeholder}
      />
      {message}
    </div>
  );
};

const TowerCreatePage: React.FC<Props> = ({ owners }) => {
  const [activeTab, setActiveTab] = useState('basic');
  const [formData, setFormData] = useState<FormData>({
    site_name: '',
    site_id: '',
    site_sap: '',
    latitude: '',
    longitude: '',
    alamat_menara: '',
    tinggi_menara: '',
    tinggi_bangunan: '',
    jumlah_pengguna: '',
    jumlah_kaki: '',
    site_type: '',
    tower_type: '',
    prs: '',
    prs_id: '',
    no_ijin: '',
    jenis_ijin: '',
    tanggal_ijin: '',
    berlaku_hingga: '',
    status_ijin: '',
    owner_id: '',
    owner_name: '',
    owner_alamat: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateField = useCallback((field: keyof FormData, value: string) => {
    // Handle coordinate formatting
    if (field === 'latitude' || field === 'longitude') {
      // Remove any non-numeric characters except decimal point and minus sign
      const cleanedValue = value.replace(/[^0-9.-]/g, '');

      // Ensure only one decimal point
      const parts = cleanedValue.split('.');
      if (parts.length > 2) {
        value = parts[0] + '.' + parts.slice(1).join('');
      } else {
        value = cleanedValue;
      }

      // Limit decimal places to 8
      if (value.includes('.')) {
        const [integer, decimal] = value.split('.');
        if (decimal && decimal.length > 8) {
          value = integer + '.' + decimal.substring(0, 8);
        }
      }
    }

    setFormData(prev => ({ ...prev, [field]: value }));

    // Handle owner selection
    if (field === 'owner_id') {
      if (value === '') {
        setFormData(prev => ({ ...prev, owner_name: '', owner_alamat: '' }));
      } else {
        const selectedOwner = owners.find(owner => owner.id.toString() === value);
        if (selectedOwner) {
          setFormData(prev => ({
            ...prev,
            owner_name: selectedOwner.name,
            owner_alamat: selectedOwner.alamat
          }));
        }
      }
    }

    // Clear error when user starts typing
    setErrors(prev => {
      if (prev[field]) {
        return { ...prev, [field]: '' };
      }
      return prev;
    });
  }, [owners]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Required fields
    if (!formData.alamat_menara || formData.alamat_menara.trim() === '') {
      newErrors.alamat_menara = 'Alamat menara wajib diisi';
    }

    // Enhanced coordinate validation
    if (formData.latitude) {
      const latValue = Number(formData.latitude);
      if (isNaN(latValue)) {
        newErrors.latitude = 'Latitude harus berupa angka yang valid';
      } else if (latValue < -90 || latValue > 90) {
        newErrors.latitude = 'Latitude harus antara -90 dan 90';
      } else if (formData.latitude.includes('.') && formData.latitude.split('.')[1] && formData.latitude.split('.')[1].length > 8) {
        newErrors.latitude = 'Latitude maksimal 8 digit desimal';
      }
    }

    if (formData.longitude) {
      const lngValue = Number(formData.longitude);
      if (isNaN(lngValue)) {
        newErrors.longitude = 'Longitude harus berupa angka yang valid';
      } else if (lngValue < -180 || lngValue > 180) {
        newErrors.longitude = 'Longitude harus antara -180 dan 180';
      } else if (formData.longitude.includes('.') && formData.longitude.split('.')[1] && formData.longitude.split('.')[1].length > 8) {
        newErrors.longitude = 'Longitude maksimal 8 digit desimal';
      }
    }

    // Validate numeric fields if provided
    if (formData.tinggi_menara && (isNaN(Number(formData.tinggi_menara)) || Number(formData.tinggi_menara) < 0)) {
      newErrors.tinggi_menara = 'Tinggi menara harus berupa angka positif';
    }
    if (formData.tinggi_bangunan && (isNaN(Number(formData.tinggi_bangunan)) || Number(formData.tinggi_bangunan) < 0)) {
      newErrors.tinggi_bangunan = 'Tinggi bangunan harus berupa angka positif';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    // Convert empty strings to null for numeric fields
    const submitData = {
      ...formData,
      latitude: formData.latitude ? Number(formData.latitude) : null,
      longitude: formData.longitude ? Number(formData.longitude) : null,
      tinggi_menara: formData.tinggi_menara ? Number(formData.tinggi_menara) : null,
      tinggi_bangunan: formData.tinggi_bangunan ? Number(formData.tinggi_bangunan) : null,
      jumlah_pengguna: formData.jumlah_pengguna ? Number(formData.jumlah_pengguna) : null,
      jumlah_kaki: formData.jumlah_kaki ? Number(formData.jumlah_kaki) : null,
    };

    router.post(route('admin.towers.store'), submitData, {
      onSuccess: () => {
        // Redirect will be handled by the controller
      },
      onError: (errors) => {
        setErrors(errors);
        setIsSubmitting(false);
      },
      onFinish: () => {
        setIsSubmitting(false);
      }
    });
  };

  // Errors are cleared to '' rather than deleted, so count truthy values only.
  const errorCountFor = (tabId: string) =>
    (TAB_FIELDS[tabId] ?? []).filter((f) => Boolean(errors[f])).length;
  const totalErrorCount = TABS.reduce((sum, tab) => sum + errorCountFor(tab.id), 0);

  return (
    <AdminLayout title="Tambah Menara">
      <Head title="Tambah Menara" />

      <PageHeader
        title="Tambah Menara Baru"
        description="Masukkan informasi lengkap menara telekomunikasi yang akan didaftarkan"
        showLogo={false}
        actions={
          <Button
            type="button"
            variant="outline"
            onClick={() => router.get(route('admin.towers.index'))}
            className="h-11"
          >
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Kembali
          </Button>
        }
      />

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Validation summary: on a four-tab form an inline message alone can sit
            on a tab the user is not looking at. */}
        {totalErrorCount > 0 && (
          <div
            role="alert"
            className="flex flex-col gap-2 rounded-md border border-destructive-border bg-destructive-soft p-3 sm:flex-row sm:items-center sm:justify-between"
          >
            <p className="flex items-start gap-2 text-sm text-destructive-strong">
              <svg className="mt-0.5 h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>
                <span className="font-semibold tabular-nums">{totalErrorCount}</span> kolom belum valid.
                Periksa tab yang ditandai.
              </span>
            </p>
            <div className="flex flex-wrap gap-1.5">
              {TABS.filter((tab) => errorCountFor(tab.id) > 0).map((tab) => (
                <Badge key={tab.id} variant="destructive">
                  {tab.label} ({errorCountFor(tab.id)})
                </Badge>
              ))}
            </div>
          </div>
        )}

        <Card padding="none">
          {/* Tab bar. A rule with an active underline, not a coloured band of
              pill cards — the panel below is the content, the bar is a switch. */}
          <div className="overflow-x-auto border-b border-border-strong bg-well">
            <nav className="flex min-w-max" aria-label="Bagian formulir menara">
              {TABS.map((tab) => {
                const isActive = activeTab === tab.id;
                const count = errorCountFor(tab.id);
                return (
                  <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    aria-controls={`tower-panel-${tab.id}`}
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      'relative inline-flex h-11 items-center gap-2 whitespace-nowrap px-4 text-sm font-medium',
                      'transition-colors duration-140 ease-state',
                      'focus-visible:outline-none focus-visible:ring focus-visible:ring-inset',
                      isActive
                        ? 'bg-card text-foreground'
                        : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                    )}
                    title={tab.label}
                  >
                    <span>{tab.label}</span>
                    {count > 0 && (
                      <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-md border border-destructive-border bg-destructive-soft px-1 text-xs font-semibold tabular-nums text-destructive-strong">
                        {count}
                      </span>
                    )}
                    {isActive && (
                      <span
                        aria-hidden="true"
                        className="absolute inset-x-0 bottom-0 h-0.5 origin-left bg-primary animate-bar-grow"
                      />
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="p-5">
            {activeTab === 'basic' && (
              <div
                id="tower-panel-basic"
                role="tabpanel"
                className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3"
              >
                <Field label="Nama Site" htmlFor={fieldId('site_name')}>
                  <FormInput
                    field="site_name"
                    placeholder="Masukkan nama site"
                    value={formData.site_name}
                    onChange={updateField}
                    error={errors.site_name}
                  />
                </Field>

                <Field label="Site ID" htmlFor={fieldId('site_id')}>
                  <FormInput
                    field="site_id"
                    placeholder="Site ID"
                    value={formData.site_id}
                    onChange={updateField}
                    error={errors.site_id}
                  />
                </Field>

                <Field label="Site SAP" htmlFor={fieldId('site_sap')}>
                  <FormInput
                    field="site_sap"
                    placeholder="Site SAP"
                    value={formData.site_sap}
                    onChange={updateField}
                    error={errors.site_sap}
                  />
                </Field>

                <Field label="Site Type" htmlFor={fieldId('site_type')}>
                  <FormInput
                    field="site_type"
                    options={SITE_TYPE_OPTIONS.map(({ value, label }) => ({ value, label }))}
                    placeholder="Pilih site type"
                    value={formData.site_type}
                    onChange={updateField}
                    error={errors.site_type}
                  />
                </Field>

                <Field label="Owner" htmlFor={fieldId('owner_id')}>
                  <FormInput
                    field="owner_id"
                    options={owners.map(owner => ({ value: owner.id.toString(), label: owner.name }))}
                    placeholder="Pilih owner"
                    value={formData.owner_id}
                    onChange={updateField}
                    error={errors.owner_id}
                  />
                </Field>

                {formData.owner_id && (
                  <Card variant="well" padding="dense" className="sm:col-span-2 lg:col-span-1">
                    <h4 className="text-sm font-semibold text-foreground">Detail Owner</h4>
                    <dl className="mt-2 space-y-1 text-sm">
                      <div className="flex gap-2">
                        <dt className="shrink-0 font-medium text-muted-foreground">Nama:</dt>
                        <dd className="min-w-0 truncate text-foreground" title={formData.owner_name}>
                          {formData.owner_name}
                        </dd>
                      </div>
                      <div className="flex gap-2">
                        <dt className="shrink-0 font-medium text-muted-foreground">Alamat:</dt>
                        <dd className="min-w-0 text-foreground">{formData.owner_alamat}</dd>
                      </div>
                    </dl>
                  </Card>
                )}

                {/* Reference for the Site Type list — one compact table instead
                    of four loose lines of grey text under the select. */}
                <Card variant="well" padding="dense" className="sm:col-span-2 lg:col-span-3">
                  <h4 className="text-sm font-semibold text-foreground">Keterangan Site Type</h4>
                  <dl className="mt-2 divide-y divide-border/70 text-xs">
                    {SITE_TYPE_OPTIONS.map((option) => (
                      <div key={option.value} className="flex flex-col gap-0.5 py-1.5 sm:flex-row sm:gap-3">
                        <dt className="w-full shrink-0 font-semibold text-foreground sm:w-40">
                          {option.label}
                        </dt>
                        <dd className="text-muted-foreground">{option.description}</dd>
                      </div>
                    ))}
                  </dl>
                </Card>
              </div>
            )}

            {activeTab === 'location' && (
              <div
                id="tower-panel-location"
                role="tabpanel"
                className="grid grid-cols-1 gap-5 sm:grid-cols-2"
              >
                <Field
                  label="Longitude (X-axis)"
                  htmlFor={fieldId('longitude')}
                  hint="Range: -180° hingga 180°, maksimal 8 digit desimal"
                >
                  <FormInput
                    field="longitude"
                    type="number"
                    placeholder="Contoh: 110.4203"
                    value={formData.longitude}
                    onChange={updateField}
                    error={errors.longitude}
                  />
                </Field>

                <Field
                  label="Latitude (Y-axis)"
                  htmlFor={fieldId('latitude')}
                  hint="Range: -90° hingga 90°, maksimal 8 digit desimal"
                >
                  <FormInput
                    field="latitude"
                    type="number"
                    placeholder="Contoh: -7.7956"
                    value={formData.latitude}
                    onChange={updateField}
                    error={errors.latitude}
                  />
                </Field>

                <Field
                  label="Alamat Menara"
                  htmlFor={fieldId('alamat_menara')}
                  required
                  className="sm:col-span-2"
                >
                  <FormInput
                    field="alamat_menara"
                    rows={3}
                    placeholder="Alamat lengkap lokasi menara"
                    value={formData.alamat_menara}
                    onChange={updateField}
                    error={errors.alamat_menara}
                    required={true}
                  />
                </Field>
              </div>
            )}

            {activeTab === 'technical' && (
              <div
                id="tower-panel-technical"
                role="tabpanel"
                className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3"
              >
                <Field label="Tinggi Menara (m)" htmlFor={fieldId('tinggi_menara')}>
                  <FormInput
                    field="tinggi_menara"
                    type="number"
                    placeholder="Contoh: 42"
                    value={formData.tinggi_menara}
                    onChange={updateField}
                    error={errors.tinggi_menara}
                  />
                </Field>

                <Field label="Tinggi Bangunan (m)" htmlFor={fieldId('tinggi_bangunan')}>
                  <FormInput
                    field="tinggi_bangunan"
                    type="number"
                    placeholder="Contoh: 15"
                    value={formData.tinggi_bangunan}
                    onChange={updateField}
                    error={errors.tinggi_bangunan}
                  />
                </Field>

                <Field label="Jumlah Pengguna" htmlFor={fieldId('jumlah_pengguna')}>
                  <FormInput
                    field="jumlah_pengguna"
                    type="number"
                    placeholder="Jumlah operator"
                    value={formData.jumlah_pengguna}
                    onChange={updateField}
                    error={errors.jumlah_pengguna}
                  />
                </Field>

                <Field label="Jumlah Kaki" htmlFor={fieldId('jumlah_kaki')}>
                  <FormInput
                    field="jumlah_kaki"
                    type="number"
                    placeholder="Contoh: 4"
                    value={formData.jumlah_kaki}
                    onChange={updateField}
                    error={errors.jumlah_kaki}
                  />
                </Field>

                <Field label="Jenis Menara" htmlFor={fieldId('tower_type')}>
                  <FormInput
                    field="tower_type"
                    placeholder="Contoh: Lattice, Monopole"
                    value={formData.tower_type}
                    onChange={updateField}
                    error={errors.tower_type}
                  />
                </Field>

                <Field label="PRS" htmlFor={fieldId('prs')}>
                  <FormInput
                    field="prs"
                    placeholder="PRS"
                    value={formData.prs}
                    onChange={updateField}
                    error={errors.prs}
                  />
                </Field>

                <Field label="PRS ID" htmlFor={fieldId('prs_id')}>
                  <FormInput
                    field="prs_id"
                    placeholder="PRS ID"
                    value={formData.prs_id}
                    onChange={updateField}
                    error={errors.prs_id}
                  />
                </Field>
              </div>
            )}

            {activeTab === 'permits' && (
              <div
                id="tower-panel-permits"
                role="tabpanel"
                className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3"
              >
                <Field label="Nomor Ijin" htmlFor={fieldId('no_ijin')}>
                  <FormInput
                    field="no_ijin"
                    placeholder="Nomor ijin"
                    value={formData.no_ijin}
                    onChange={updateField}
                    error={errors.no_ijin}
                  />
                </Field>

                <Field label="Jenis Ijin" htmlFor={fieldId('jenis_ijin')}>
                  <FormInput
                    field="jenis_ijin"
                    options={[
                      { value: 'IMB', label: 'IMB' },
                      { value: 'PBG', label: 'PBG' },
                      { value: 'Lainnya', label: 'Lainnya' }
                    ]}
                    placeholder="Pilih jenis ijin"
                    value={formData.jenis_ijin}
                    onChange={updateField}
                    error={errors.jenis_ijin}
                  />
                </Field>

                {/* status_ijin is a field on the record being edited — that is
                    the one place it belongs. It is never aggregated into a KPI,
                    because the seeded values are random. */}
                <Field label="Status Ijin" htmlFor={fieldId('status_ijin')}>
                  <FormInput
                    field="status_ijin"
                    options={[
                      { value: 'Aktif', label: 'Aktif' },
                      { value: 'Tidak Aktif', label: 'Tidak Aktif' },
                      { value: 'Pending', label: 'Pending' },
                      { value: 'Expired', label: 'Expired' }
                    ]}
                    placeholder="Pilih status ijin"
                    value={formData.status_ijin}
                    onChange={updateField}
                    error={errors.status_ijin}
                  />
                </Field>

                <Field label="Tanggal Ijin" htmlFor={fieldId('tanggal_ijin')}>
                  <FormInput
                    field="tanggal_ijin"
                    type="date"
                    value={formData.tanggal_ijin}
                    onChange={updateField}
                    error={errors.tanggal_ijin}
                  />
                </Field>

                <Field label="Berlaku Hingga" htmlFor={fieldId('berlaku_hingga')}>
                  <FormInput
                    field="berlaku_hingga"
                    type="date"
                    value={formData.berlaku_hingga}
                    onChange={updateField}
                    error={errors.berlaku_hingga}
                  />
                </Field>
              </div>
            )}
          </div>
        </Card>

        {/* Submit Buttons */}
        <div className="flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Pastikan semua data sudah benar sebelum menyimpan</span>
          </p>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Button
              type="button"
              variant="outline"
              size="lg"
              onClick={() => router.get(route('admin.towers.index'))}
              className="w-full sm:w-auto"
            >
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Batal
            </Button>
            <Button type="submit" size="lg" disabled={isSubmitting} className="w-full sm:w-auto">
              {isSubmitting ? (
                <svg className="animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              )}
              {isSubmitting ? 'Menyimpan...' : 'Simpan Menara'}
            </Button>
          </div>
        </div>
      </form>
    </AdminLayout>
  );
};

export default TowerCreatePage;
