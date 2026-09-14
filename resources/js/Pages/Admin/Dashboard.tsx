import React from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Head, usePage, Link } from '@inertiajs/react';
import PageHeader from '@/Components/PageHeader';
import { Button } from '@/Components/ui/button';
import { Card } from '@/Components/ui/card';
import { Badge } from '@/Components/ui/badge';
import { cn } from '@/lib/utils';
import { getStatusColor } from '@/utils/statusHelpers';

type Stats = {
  totalTowers: number;
  totalReports: number;
  totalUsers: number;
  weeklyReports: number;
  reportsGrowth: number;
  pendingCount: number;
  inProgressCount: number;
  closedCount: number;
  feedbackPendingCount: number;
  feedbackInProgressCount: number;
  feedbackClosedCount: number;
};

type RecentReport = {
  id: number;
  title: string;
  status: string; // slug
  created_at: string;
  tower_name: string;
  description: string;
};

type ActivityToday = {
  newReports: number;
  respondedReports: number;
  updatedTowers: number;
};

type CategoryDatum = { category: string; count: number };

/**
 * Presentation-only mapping from a message status slug to a semantic token set.
 *
 * `getStatusColor` still owns the LABEL, but its colours are raw hex literals
 * that cannot be themed, so every visual decision is resolved to tokens here
 * instead and the dot and the chip now track the palette.
 *
 * The deliberate call: `pending` and `in_progress` are WARNING and INFO, never
 * destructive. An unanswered complaint is a queue state, not an error, and red
 * in this app now means only "destructive or wrong".
 */
type StatusTone = 'warning' | 'info' | 'success' | 'neutral';

const STATUS_TONE: Record<string, StatusTone> = {
  pending: 'warning',
  in_progress: 'info',
  closed: 'success',
  responded: 'info',
  resolved: 'success',
};

const TONE_DOT: Record<StatusTone, string> = {
  warning: 'bg-warning',
  info: 'bg-info',
  success: 'bg-success',
  neutral: 'bg-neutral',
};

const toneFor = (status: string | undefined | null): StatusTone =>
  STATUS_TONE[status ?? ''] ?? 'neutral';

/**
 * Inset header rail: 40px tall, well ground, strong bottom rule.
 *
 * This replaces the four hand-rolled `border-b px-4 py-4` bands that each held a
 * single <h3>, and it is the same recipe a table header uses, so a card header
 * and a table header stop being two different visual languages.
 */
const SectionRail: React.FC<{ title: string; meta?: React.ReactNode }> = ({ title, meta }) => (
  <div className="flex h-10 items-center justify-between gap-3 border-b border-border-strong bg-well px-4">
    <h3 className="truncate text-sm font-semibold text-foreground" title={title}>
      {title}
    </h3>
    {meta && <span className="shrink-0 text-xs text-muted-foreground">{meta}</span>}
  </div>
);

/**
 * Lightweight horizontal bar "chart" without extra deps.
 *
 * Denser than before (2.5 rhythm, 6px track instead of 3/8px) and the fill grows
 * on scaleX only — a transform, never a layout property.
 */
const HorizontalBars: React.FC<{ data: { label: string; value: number }[] }> = ({ data }) => {
  const maxValue = Math.max(1, ...data.map((d) => d.value));

  if (data.length === 0) {
    return <p className="text-sm text-muted-foreground">Tidak ada data.</p>;
  }

  return (
    <div className="space-y-2.5">
      {data.map((d, idx) => (
        <div key={idx}>
          <div className="mb-1 flex items-baseline justify-between gap-3 text-sm">
            <span className="truncate text-foreground" title={d.label}>
              {d.label}
            </span>
            <span className="shrink-0 tabular-nums text-muted-foreground">{d.value}</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-well">
            {/* width is data, not colour, so it stays an inline style */}
            <div
              className="h-1.5 origin-left rounded-full bg-primary animate-bar-grow"
              style={{ width: `${(d.value / maxValue) * 100}%`, animationDelay: `${idx * 40}ms` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
};

/**
 * One KPI tile.
 *
 * Figure and label share a baseline instead of stacking label / figure / hint
 * beside an icon tile, so four tiles now occupy the height three used to. The
 * third line is a real secondary figure, not a restatement of the label.
 */
const StatTile: React.FC<{
  label: string;
  value: string;
  meta?: string;
  index: number;
}> = ({ label, value, meta, index }) => (
  <Card
    padding="dense"
    className="tt-enter-up"
    style={{ '--tt-delay': `${index * 40}ms` } as React.CSSProperties}
  >
    <div className="flex items-baseline gap-2">
      <span className="text-2xl font-semibold tabular-nums tracking-tight text-foreground">{value}</span>
      <span className="min-w-0 truncate text-sm text-muted-foreground" title={label}>
        {label}
      </span>
    </div>
    {meta && (
      <p className="mt-0.5 truncate text-xs text-muted-foreground" title={meta}>
        {meta}
      </p>
    )}
  </Card>
);

/** A definition row: dot + label on the left, count chip on the right. */
const StatusRow: React.FC<{ label: string; value: number; tone: StatusTone }> = ({ label, value, tone }) => (
  <div className="flex items-center justify-between gap-3 px-4 py-2.5">
    <dt className="flex min-w-0 items-center gap-2 text-sm text-foreground">
      <span className={cn('h-2 w-2 shrink-0 rounded-full', TONE_DOT[tone])} aria-hidden="true" />
      <span className="truncate" title={label}>
        {label}
      </span>
    </dt>
    <dd className="shrink-0">
      <Badge variant={tone} className="tabular-nums">
        {value}
      </Badge>
    </dd>
  </div>
);

/** Total row closing a breakdown — same rhythm, inset ground, no chip: it is a sum. */
const TotalRow: React.FC<{ value: number }> = ({ value }) => (
  <div className="flex items-center justify-between gap-3 bg-well px-4 py-2.5">
    <dt className="text-sm font-medium text-muted-foreground">Total</dt>
    <dd className="text-sm font-semibold tabular-nums text-foreground">{value.toLocaleString('id-ID')}</dd>
  </div>
);

/** One entry in a "terbaru" list. It is not interactive, so it carries no hover state. */
const RecentRow: React.FC<{ item: RecentReport; secondary: string }> = ({ item, secondary }) => {
  const statusConfig = getStatusColor(item.status);
  const tone = toneFor(item.status);

  return (
    <li className="flex items-start gap-3 px-4 py-3">
      <span className={cn('mt-1.5 h-2 w-2 shrink-0 rounded-full', TONE_DOT[tone])} aria-hidden="true" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground" title={item.title}>
          {item.title}
        </p>
        <p className="truncate text-sm text-muted-foreground" title={secondary}>
          {secondary}
        </p>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1">
        <Badge variant={tone} className="whitespace-nowrap">
          {statusConfig.label}
        </Badge>
        <span className="text-xs tabular-nums text-muted-foreground">{item.created_at}</span>
      </div>
    </li>
  );
};

const AdminDashboard: React.FC = () => {
  const page = usePage();
  const {
    auth,
    stats: serverStats,
    recentReports: serverRecentReports,
    recentFeedbacks: serverRecentFeedbacks,
    activityToday: serverActivityToday,
  } = page.props as any;
  const user = auth?.user;

  const stats: Stats = serverStats || {
    totalTowers: 0,
    totalReports: 0,
    totalUsers: 0,
    weeklyReports: 0,
    reportsGrowth: 0,
    pendingCount: 0,
    inProgressCount: 0,
    closedCount: 0,
    feedbackPendingCount: 0,
    feedbackInProgressCount: 0,
    feedbackClosedCount: 0,
  };

  const recentComplaints: RecentReport[] = serverRecentReports || [];
  const recentFeedbacks: RecentReport[] = serverRecentFeedbacks || [];

  const reportsByCategory: CategoryDatum[] = (page.props as any)?.reportsByCategory || [];

  /*
   * REMOVED: the "Status Perizinan Menara" bar chart (`towersByStatus`).
   *
   * `towers.status_ijin` is written by TowerSeeder with array_rand() over
   * ['Aktif','Non-Aktif','Dalam Proses'], so that chart was a histogram of
   * rand(). Permit status is still a real field on a tower record and is still
   * edited there; it is simply not a dashboard statistic. The controller still
   * sends `towersByStatus` — the prop is deliberately left unread here.
   */

  const activityToday: ActivityToday = {
    newReports: serverActivityToday?.newReports ?? 0,
    respondedReports: serverActivityToday?.respondedReports ?? 0,
    updatedTowers: serverActivityToday?.updatedTowers ?? 0,
  };

  const activityItems = [
    { label: 'Keluhan Baru', value: activityToday.newReports },
    { label: 'Keluhan Ditanggapi', value: activityToday.respondedReports },
    { label: 'Menara Diperbarui', value: activityToday.updatedTowers },
  ];

  // 0 / 0 / 0 laid out as three figures is an empty state pretending to be data.
  // When nothing happened today, the strip says so once, in one line.
  const hasActivityToday = activityItems.some((a) => a.value > 0);

  const totalFeedbacks =
    stats.feedbackPendingCount + stats.feedbackInProgressCount + stats.feedbackClosedCount;

  const categoryData = (reportsByCategory || [])
    .map((d: CategoryDatum) => ({ label: d.category || 'Lainnya', value: d.count }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);

  return (
    <AdminLayout title="Admin Dashboard">
      <Head title="Admin Dashboard" />

      <div className="space-y-4 sm:space-y-5">
        {/*
          Was a full HeroSection band: roughly 150px of maroon holding two
          strings, stacked directly under AdminLayout's own maroon top bar. A
          page header is type plus a hairline rule, and its actions row is the
          page's single action zone.
        */}
        <PageHeader
          className="mb-0"
          showLogo={false}
          title="Dashboard Admin"
          description={`Kelola data menara dan jalur fiber optik, serta pantau aktivitas. Halo, ${user?.name || 'Admin'}.`}
          actions={
            <Button variant="outline" size="sm" className="h-11 sm:h-9" asChild>
              <Link href="/admin/towers">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                  />
                </svg>
                Kelola Tower
              </Link>
            </Button>
          }
        />

        {/*
          KPI row. Real figures only: row counts and message-status counts.
          Nothing derived from `status_ijin` appears here — see the note above.
        */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <StatTile
            index={0}
            label="Total Menara"
            value={stats.totalTowers.toLocaleString('id-ID')}
            meta="Menara telekomunikasi terdaftar"
          />
          <StatTile
            index={1}
            label="Total Keluhan"
            value={stats.totalReports.toLocaleString('id-ID')}
            meta={`${stats.weeklyReports.toLocaleString('id-ID')} masuk dalam 7 hari terakhir`}
          />
          <StatTile
            index={2}
            label="Total Masukan"
            value={totalFeedbacks.toLocaleString('id-ID')}
            meta={`${stats.feedbackPendingCount.toLocaleString('id-ID')} masukan belum ditangani`}
          />
          <StatTile
            index={3}
            label="Total Pengguna"
            value={stats.totalUsers.toLocaleString('id-ID')}
            meta={`${stats.pendingCount.toLocaleString('id-ID')} keluhan menunggu tanggapan`}
          />
        </div>

        {/* Aktivitas Hari Ini — one strip, and honest when the day is empty. */}
        <Card
          variant="well"
          padding="none"
          className="flex flex-col gap-1 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
        >
          <h2 className="shrink-0 text-sm font-semibold text-foreground">Aktivitas Hari Ini</h2>
          {hasActivityToday ? (
            <dl className="flex flex-wrap items-baseline gap-x-5 gap-y-1">
              {activityItems.map((item) => (
                <div key={item.label} className="flex items-baseline gap-1.5">
                  <dt className="text-sm text-muted-foreground">{item.label}</dt>
                  <dd className="text-sm font-semibold tabular-nums text-foreground">{item.value}</dd>
                </div>
              ))}
            </dl>
          ) : (
            <p className="text-sm text-muted-foreground">Belum ada aktivitas tercatat hari ini.</p>
          )}
        </Card>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          {/*
            Two breakdowns that were two tall cards are now one card with two
            rails. Each row is a definition pair closed by a real total, so the
            block reads as a table of counts rather than as decoration.
          */}
          <Card padding="none" className="overflow-hidden">
            <div className="grid grid-cols-1 divide-y divide-border/70 sm:grid-cols-2 sm:divide-x sm:divide-y-0">
              <section>
                <SectionRail title="Status Keluhan" />
                <dl className="divide-y divide-border/70">
                  <StatusRow label="Pending" value={stats.pendingCount} tone="warning" />
                  <StatusRow label="In Progress" value={stats.inProgressCount} tone="info" />
                  <StatusRow label="Selesai" value={stats.closedCount} tone="success" />
                  <TotalRow value={stats.pendingCount + stats.inProgressCount + stats.closedCount} />
                </dl>
              </section>
              <section>
                <SectionRail title="Status Masukan" />
                <dl className="divide-y divide-border/70">
                  <StatusRow label="Pending" value={stats.feedbackPendingCount} tone="warning" />
                  <StatusRow label="In Progress" value={stats.feedbackInProgressCount} tone="info" />
                  <StatusRow label="Selesai" value={stats.feedbackClosedCount} tone="success" />
                  <TotalRow value={totalFeedbacks} />
                </dl>
              </section>
            </div>
          </Card>

          <Card padding="none" className="overflow-hidden">
            <SectionRail title="Keluhan per Kategori" meta={`Top ${Math.min(6, reportsByCategory.length)}`} />
            <div className="p-4">
              <HorizontalBars data={categoryData} />
            </div>
          </Card>
        </div>

        {/* Recent activity */}
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <Card padding="none" className="overflow-hidden">
            <SectionRail title="Keluhan Terbaru" />
            {recentComplaints.length > 0 ? (
              <ul className="divide-y divide-border/70">
                {recentComplaints.slice(0, 5).map((complaint) => (
                  <RecentRow key={complaint.id} item={complaint} secondary={complaint.tower_name} />
                ))}
              </ul>
            ) : (
              <p className="px-4 py-6 text-center text-sm text-muted-foreground">Belum ada keluhan masuk.</p>
            )}
            <div className="border-t border-border px-4 py-3">
              <Link
                href="/admin/messages?tab=complaints"
                className="inline-flex min-h-[44px] items-center rounded-sm text-sm font-medium text-primary hover:text-primary-hover hover:underline focus-visible:outline-none focus-visible:ring focus-visible:ring-offset-2 sm:min-h-0"
              >
                Lihat Semua Keluhan →
              </Link>
            </div>
          </Card>

          <Card padding="none" className="overflow-hidden">
            <SectionRail title="Masukan Terbaru" />
            {recentFeedbacks.length > 0 ? (
              <ul className="divide-y divide-border/70">
                {recentFeedbacks.slice(0, 5).map((fb) => (
                  <RecentRow key={fb.id} item={fb} secondary={fb.description || fb.tower_name} />
                ))}
              </ul>
            ) : (
              <p className="px-4 py-6 text-center text-sm text-muted-foreground">Belum ada masukan masuk.</p>
            )}
            <div className="border-t border-border px-4 py-3">
              <Link
                href="/admin/messages?tab=feedbacks"
                className="inline-flex min-h-[44px] items-center rounded-sm text-sm font-medium text-primary hover:text-primary-hover hover:underline focus-visible:outline-none focus-visible:ring focus-visible:ring-offset-2 sm:min-h-0"
              >
                Lihat Semua Masukan →
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
