import React, { useState, useRef } from 'react';
import { Head, router, Link } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import PageHeader from '@/Components/PageHeader';
import { Button } from '@/Components/ui/button';
import { Badge } from '@/Components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/Components/ui/card';
import { cn } from '@/lib/utils';

interface Route {
  id: number;
  name: string;
  area: string;
}

interface Provider {
  id: number;
  name: string;
}

interface Props {
  templateUrl: string;
  availableRoutes: Route[];
  availableProviders: Provider[];
}

interface PreviewData {
  success: boolean;
  detected_mapping: Record<string, string>;
  missing_columns: string[];
  preview: any[][];
  errors: Array<{ row: number; errors: string[] }>;
  can_import: boolean;
  total_rows: number;
  message?: string;
}

type ImportMode = 'insert' | 'update' | 'upsert';

const MODE_OPTIONS: ReadonlyArray<{ value: ImportMode; label: string; description: string }> = [
  { value: 'insert', label: 'Insert Only', description: 'Hanya menambahkan data baru (skip duplikat)' },
  { value: 'update', label: 'Update', description: 'Update data yang sudah ada (skip data baru)' },
  { value: 'upsert', label: 'Upsert', description: 'Insert data baru atau update jika sudah ada' },
];

/** Same three states as the tower importer, stated on the page. */
const STEPS = [
  { n: 1, label: 'Pilih File' },
  { n: 2, label: 'Periksa Preview' },
  { n: 3, label: 'Jalankan Import' },
] as const;

/* Local recipes — one definition each instead of a copy per call site. */
const FIELD_LABEL = 'block text-sm font-medium text-foreground';
const SELECT_CONTROL = cn(
  'h-11 w-full rounded-md border border-input bg-card px-3 text-sm text-foreground',
  'transition-colors duration-140 ease-state',
  'focus-visible:outline-none focus-visible:ring focus-visible:ring-offset-2',
);
const TH = 'h-10 px-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground';
const TD = 'px-3 py-3 align-top text-sm text-foreground';

/** Preview rows arrive heading-keyed from Laravel Excel; values can be null. */
const cellText = (value: unknown): string => {
  if (value === null || value === undefined || value === '') return '—';
  if (typeof value === 'object') return '—';
  return String(value);
};

const ImportFoPointsPage: React.FC<Props> = ({
  templateUrl,
  availableRoutes,
  availableProviders
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [mode, setMode] = useState<'insert' | 'update' | 'upsert'>('insert');
  const [defaultRouteId, setDefaultRouteId] = useState<string>('');
  const [autoCreateRoutes, setAutoCreateRoutes] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [previewData, setPreviewData] = useState<PreviewData | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Validate file extension - only Excel files allowed
      const fileName = selectedFile.name.toLowerCase();
      const validExtensions = ['.xlsx', '.xls'];
      const isValidFile = validExtensions.some(ext => fileName.endsWith(ext));

      if (!isValidFile) {
        setError('File harus berupa template Excel (.xlsx atau .xls). CSV tidak didukung.');
        e.target.value = ''; // Clear file input
        return;
      }

      setFile(selectedFile);
      setError(null);
      setPreviewData(null);
    }
  };

  const handlePreview = async () => {
    if (!file) {
      setError('Pilih file terlebih dahulu');
      return;
    }

    setIsPreviewing(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(route('admin.fo-management.points.import.preview'), {
        method: 'POST',
        headers: {
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
        },
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        setPreviewData(data);
      } else {
        setError(data.message || 'Gagal membaca file');
      }
    } catch (err) {
      setError('Terjadi kesalahan saat membaca file');
      console.error(err);
    } finally {
      setIsPreviewing(false);
    }
  };

  const handleImport = async () => {
    if (!file || !previewData?.can_import) {
      setError('File tidak valid atau belum di-preview');
      return;
    }

    setIsImporting(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('mode', mode);
    if (defaultRouteId) {
      formData.append('default_route_id', defaultRouteId);
    }
    formData.append('auto_create_routes', autoCreateRoutes ? '1' : '0');

    router.post(route('admin.fo-management.points.import.process'), formData, {
      forceFormData: true,
      onSuccess: () => {
        // Success handled by redirect
      },
      onError: (errors) => {
        setError(errors.file || 'Import gagal');
        setIsImporting(false);
      },
    });
  };

  const handleDownloadTemplate = () => {
    window.location.href = templateUrl;
  };

  const currentStep = previewData ? 3 : file ? 2 : 1;
  // Laravel Excel returns heading-keyed rows; the declared `any[][]` describes
  // the shape loosely, so narrow through `unknown` for the table render.
  const previewRows = (previewData?.preview ?? []) as unknown as Array<Record<string, unknown>>;
  const previewColumns = previewRows.length > 0 ? Object.keys(previewRows[0]) : [];
  const mappedCount = previewData ? Object.keys(previewData.detected_mapping).length : 0;
  const errorRowCount = previewData?.errors.length ?? 0;

  return (
    <AdminLayout title="Import FO Points">
      <Head title="Import FO Points" />

      <PageHeader
        title="Import Data FO Points"
        description="Import data titik FO dari template Excel (.xlsx atau .xls)"
        showLogo={false}
        actions={
          <Button asChild variant="outline" className="h-11">
            <Link href={route('admin.fo-management.routes.list')}>
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Kembali ke Daftar Route
            </Link>
          </Button>
        }
      />

      <div className="space-y-5">
        {/* ---- Step state -------------------------------------------------- */}
        <Card variant="well" padding="dense">
          <ol className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-1">
            {STEPS.map((step, i) => {
              const done = currentStep > step.n;
              const active = currentStep === step.n;
              return (
                <li key={step.n} className="flex flex-1 items-center gap-2 min-w-0">
                  <span
                    aria-hidden="true"
                    className={cn(
                      'flex h-6 w-6 shrink-0 items-center justify-center rounded-md border text-xs font-semibold tabular-nums transition-colors duration-180 ease-state',
                      done && 'border-primary bg-primary text-primary-foreground',
                      active && 'border-primary bg-primary-soft text-primary-strong',
                      !done && !active && 'border-border bg-card text-muted-foreground',
                    )}
                  >
                    {done ? (
                      <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      step.n
                    )}
                  </span>
                  <span
                    className={cn(
                      'truncate text-sm',
                      active ? 'font-semibold text-foreground' : 'text-muted-foreground',
                    )}
                    title={step.label}
                  >
                    {step.label}
                  </span>
                  {i < STEPS.length - 1 && (
                    <span aria-hidden="true" className="hidden h-px flex-1 bg-border-strong sm:block" />
                  )}
                </li>
              );
            })}
          </ol>
        </Card>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3 lg:items-start">
          {/* ---- Configuration column ------------------------------------- */}
          <div className="space-y-5 lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Sumber Data</CardTitle>
                <CardDescription>Format yang didukung: .xlsx, .xls (Maksimal 10MB)</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileChange}
                  className="hidden"
                />

                {!file ? (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className={cn(
                      'flex w-full flex-col items-center justify-center gap-2 rounded-md px-4 py-6',
                      'border border-border bg-well text-foreground shadow-[inset_0_1px_0_rgb(28_25_23/0.04)]',
                      'transition-colors duration-140 ease-state hover:bg-accent hover:text-accent-foreground',
                      'focus-visible:outline-none focus-visible:ring focus-visible:ring-offset-2',
                    )}
                  >
                    <svg className="h-6 w-6 text-placeholder" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <span className="text-sm font-medium">Pilih File Excel</span>
                  </button>
                ) : (
                  <div className="flex flex-col gap-3 rounded-md border border-border bg-well p-3 shadow-[inset_0_1px_0_rgb(28_25_23/0.04)] sm:flex-row sm:items-center">
                    <svg className="h-5 w-5 shrink-0 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="min-w-0 flex-1 truncate text-sm font-medium text-foreground" title={file.name}>
                      {file.name}
                    </span>
                    <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </span>
                    <div className="flex shrink-0 gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                        className="h-11"
                      >
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Ganti File
                      </Button>
                      <Button
                        type="button"
                        variant="destructive"
                        onClick={() => {
                          setFile(null);
                          setPreviewData(null);
                          if (fileInputRef.current) {
                            fileInputRef.current.value = '';
                          }
                        }}
                        className="h-11"
                      >
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        Hapus
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Mode Import</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  {MODE_OPTIONS.map((option) => (
                    <label
                      key={option.value}
                      className={cn(
                        'flex cursor-pointer flex-col gap-1 rounded-md border p-3',
                        'transition-colors duration-140 ease-state',
                        'focus-within:ring focus-within:ring-offset-2',
                        mode === option.value
                          ? 'border-primary bg-primary-soft'
                          : 'border-border bg-card hover:border-border-strong hover:bg-accent',
                      )}
                    >
                      <span className="flex items-center gap-2">
                        <input
                          type="radio"
                          value={option.value}
                          checked={mode === option.value}
                          onChange={(e) => setMode(e.target.value as any)}
                          className="sr-only"
                        />
                        <span
                          aria-hidden="true"
                          className={cn(
                            'flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2',
                            mode === option.value ? 'border-primary' : 'border-input',
                          )}
                        >
                          {mode === option.value && <span className="h-2 w-2 rounded-full bg-primary" />}
                        </span>
                        <span
                          className={cn(
                            'text-sm font-semibold',
                            mode === option.value ? 'text-primary-strong' : 'text-foreground',
                          )}
                        >
                          {option.label}
                        </span>
                      </span>
                      <span className="ml-6 text-xs leading-snug text-muted-foreground">
                        {option.description}
                      </span>
                    </label>
                  ))}
                </div>

                {/* Default Route Selection */}
                <div className="space-y-1.5 border-t border-border/70 pt-5">
                  <label htmlFor="import-default-route" className={FIELD_LABEL}>
                    Default Route <span className="font-normal text-muted-foreground">(Opsional)</span>
                  </label>
                  <select
                    id="import-default-route"
                    value={defaultRouteId}
                    onChange={(e) => setDefaultRouteId(e.target.value)}
                    className={SELECT_CONTROL}
                  >
                    <option value="">Pilih Route (kosongkan jika dari Excel)</option>
                    {availableRoutes.map((route) => (
                      <option key={route.id} value={route.id}>
                        {route.name} ({route.area})
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-muted-foreground">
                    Route default akan digunakan jika kolom Route Name tidak ditemukan di Excel
                  </p>
                </div>

                {/* Auto Create Routes */}
                <label className="flex min-h-[44px] cursor-pointer items-center gap-3 rounded-md border border-border bg-well px-3 py-2 shadow-[inset_0_1px_0_rgb(28_25_23/0.04)] transition-colors duration-140 ease-state focus-within:ring focus-within:ring-offset-2 hover:bg-accent">
                  <input
                    type="checkbox"
                    checked={autoCreateRoutes}
                    onChange={(e) => setAutoCreateRoutes(e.target.checked)}
                    className="h-4 w-4 shrink-0 cursor-pointer rounded border-input text-primary focus-visible:outline-none focus-visible:ring focus-visible:ring-offset-2"
                  />
                  <span className="text-sm text-foreground">
                    Auto-create routes jika route belum ada di database
                  </span>
                </label>
              </CardContent>
            </Card>
          </div>

          {/* ---- Side rail ------------------------------------------------- */}
          <div className="space-y-5">
            <Card variant="well" padding="none">
              <CardHeader>
                <CardTitle>Template Import</CardTitle>
                <CardDescription>
                  Download template Excel untuk memastikan format data sesuai. Template bersifat opsional,
                  sistem akan otomatis mendeteksi kolom dari file Anda.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={handleDownloadTemplate} className="h-11 w-full">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Download Template
                </Button>
              </CardContent>
            </Card>

            {availableProviders.length > 0 && (
              <Card padding="none">
                <CardHeader>
                  <CardTitle>Provider Terdaftar</CardTitle>
                  <CardDescription>
                    {availableProviders.length} provider dikenali saat pencocokan kolom Provider.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="flex flex-wrap gap-1.5">
                    {availableProviders.map((provider) => (
                      <li key={provider.id}>
                        <Badge variant="secondary" title={provider.name}>
                          <span className="block max-w-[160px] truncate">{provider.name}</span>
                        </Badge>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {previewData && (
              <Card>
                <CardHeader>
                  <CardTitle>Ringkasan Preview</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-3xl font-semibold tracking-tight tabular-nums text-foreground">
                      {previewData.total_rows}
                    </p>
                    <p className="text-sm text-muted-foreground">Total baris</p>
                  </div>
                  <dl className="divide-y divide-border/70 border-t border-border/70 text-sm">
                    <div className="flex items-center justify-between py-2">
                      <dt className="text-muted-foreground">Kolom terdeteksi</dt>
                      <dd className="font-semibold tabular-nums text-foreground">{mappedCount}</dd>
                    </div>
                    <div className="flex items-center justify-between py-2">
                      <dt className="text-muted-foreground">Kolom wajib hilang</dt>
                      <dd
                        className={cn(
                          'font-semibold tabular-nums',
                          previewData.missing_columns.length > 0 ? 'text-warning-strong' : 'text-foreground',
                        )}
                      >
                        {previewData.missing_columns.length}
                      </dd>
                    </div>
                    <div className="flex items-center justify-between py-2">
                      <dt className="text-muted-foreground">Baris bermasalah</dt>
                      <dd
                        className={cn(
                          'font-semibold tabular-nums',
                          errorRowCount > 0 ? 'text-destructive-strong' : 'text-foreground',
                        )}
                      >
                        {errorRowCount}
                      </dd>
                    </div>
                  </dl>
                  {previewData.can_import ? (
                    <Badge variant="success">
                      <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      File siap diimport
                    </Badge>
                  ) : (
                    <Badge variant="warning">
                      <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                      Perbaiki error terlebih dahulu
                    </Badge>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* ---- Request-level error ----------------------------------------- */}
        {error && (
          <div
            role="alert"
            className="flex items-start gap-2 rounded-md border border-destructive-border bg-destructive-soft p-3"
          >
            <svg className="mt-0.5 h-4 w-4 shrink-0 text-destructive" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm text-destructive-strong">{error}</p>
          </div>
        )}

        {/* ---- Preview results --------------------------------------------- */}
        {previewData && (
          <div className="space-y-5">
            {previewData.missing_columns.length > 0 && (
              <Card className="border-warning-border">
                <CardHeader>
                  <CardTitle className="text-warning-strong">Kolom Wajib Tidak Ditemukan</CardTitle>
                  <CardDescription>
                    {previewData.missing_columns.length} kolom wajib tidak terbaca dari file.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="flex flex-wrap gap-2">
                    {previewData.missing_columns.map((col) => (
                      <li key={col}>
                        <Badge variant="warning">{col}</Badge>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Every failing row with its reason — the old version cut the list
                at 10 and finished with "dan N lainnya". */}
            {errorRowCount > 0 && (
              <Card className="border-destructive-border" padding="none">
                <CardHeader>
                  <CardTitle className="text-destructive-strong">
                    Baris Bermasalah ({errorRowCount})
                  </CardTitle>
                  <CardDescription>Nomor baris mengikuti penomoran di file Excel.</CardDescription>
                </CardHeader>
                <div className="max-h-80 overflow-auto border-t border-border">
                  <table className="w-full border-collapse text-left">
                    <thead className="sticky top-0 z-10 bg-well">
                      <tr className="border-b border-border-strong">
                        <th scope="col" className={cn(TH, 'w-24')}>Baris</th>
                        <th scope="col" className={TH}>Masalah</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/70">
                      {previewData.errors.map((err, idx) => (
                        <tr key={`${err.row}-${idx}`}>
                          <td className={cn(TD, 'font-semibold tabular-nums text-destructive-strong')}>
                            {err.row}
                          </td>
                          <td className={TD}>
                            <ul className="space-y-1">
                              {err.errors.map((reason, i) => (
                                <li key={i} className="text-destructive-strong">{reason}</li>
                              ))}
                            </ul>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}

            <Card padding="none">
              <CardHeader>
                <CardTitle>Kolom yang Terdeteksi</CardTitle>
                <CardDescription>{mappedCount} kolom dipetakan dari header file.</CardDescription>
              </CardHeader>
              <div className="overflow-x-auto border-t border-border">
                <table className="w-full border-collapse text-left">
                  <thead className="bg-well">
                    <tr className="border-b border-border-strong">
                      <th scope="col" className={TH}>Kolom Database</th>
                      <th scope="col" className={TH}>Kolom Excel</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/70">
                    {Object.entries(previewData.detected_mapping).map(([dbField, excelColumn]) => (
                      <tr key={dbField}>
                        <td className={cn(TD, 'font-medium text-muted-foreground')}>{dbField}</td>
                        <td className={cn(TD, 'font-medium')}>{excelColumn}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>

            {/* The rows themselves. This data was fetched but never rendered. */}
            {previewRows.length > 0 && previewColumns.length > 0 && (
              <Card padding="none">
                <CardHeader>
                  <CardTitle>Pratinjau Data</CardTitle>
                  <CardDescription>
                    Menampilkan {previewRows.length} baris pertama dari {previewData.total_rows} baris.
                  </CardDescription>
                </CardHeader>
                <div className="overflow-x-auto border-t border-border">
                  <table className="w-full border-collapse text-left">
                    <thead className="bg-well">
                      <tr className="border-b border-border-strong">
                        <th scope="col" className={cn(TH, 'w-16')}>#</th>
                        {previewColumns.map((col) => (
                          <th key={col} scope="col" className={cn(TH, 'whitespace-nowrap')} title={col}>
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/70">
                      {previewRows.map((row, idx) => (
                        <tr key={idx}>
                          <td className={cn(TD, 'tabular-nums text-muted-foreground')}>{idx + 2}</td>
                          {previewColumns.map((col) => {
                            const text = cellText(row[col]);
                            return (
                              <td key={col} className={TD} title={text}>
                                <span className="block max-w-[220px] truncate">{text}</span>
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}
          </div>
        )}

        {/* ---- One action zone, at the end of the flow ---------------------- */}
        <div className="flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            Langkah {currentStep} dari {STEPS.length} &middot; {STEPS[currentStep - 1].label}
          </p>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            {!previewData && (
              <Button
                size="lg"
                onClick={handlePreview}
                disabled={!file || isPreviewing}
                className="w-full sm:w-auto"
              >
                {isPreviewing ? (
                  <>
                    <svg className="animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Memproses...
                  </>
                ) : (
                  <>
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    Preview Data
                  </>
                )}
              </Button>
            )}
            {previewData?.can_import && (
              <Button
                size="lg"
                onClick={handleImport}
                disabled={isImporting}
                className="w-full sm:w-auto"
              >
                {isImporting ? (
                  <>
                    <svg className="animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Mengimport...
                  </>
                ) : (
                  <>
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    Import Data
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default ImportFoPointsPage;
