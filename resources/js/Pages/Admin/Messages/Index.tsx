import React, { useMemo, useState, useEffect } from 'react';
import { Head, usePage } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import ManagementTable from '@/Components/Admin/ManagementTable';
import PageHeader from '@/Components/PageHeader';
import { cn } from '@/lib/utils';
import type { Report, Feedback, StatusItem } from '@/types/messages';

type PageProps = {
  reports: Report[];
  feedbacks: Feedback[];
  statuses: StatusItem[];
  csrfToken: string;
};

type TabKey = 'complaints' | 'feedbacks';

const IconComplaint = () => (
  <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
  </svg>
);

const IconFeedback = () => (
  <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
  </svg>
);

/**
 * Copy per tab, in one place.
 *
 * The two tabs previously carried four hand-written class strings between them
 * plus a `hidden sm:inline` / `sm:hidden` pair that rendered the SAME word
 * twice. Both labels are short enough for a 360px screen, so one span each.
 */
const TAB_COPY: Record<TabKey, { label: string; title: string; subtitle: string; icon: React.ReactNode }> = {
  complaints: {
    label: 'Keluhan',
    title: 'Kelola Keluhan',
    subtitle: 'Pantau dan tanggapi keluhan dari masyarakat terkait menara telekomunikasi',
    icon: <IconComplaint />,
  },
  feedbacks: {
    label: 'Masukan',
    title: 'Kelola Masukan',
    subtitle: 'Pantau dan tanggapi masukan dari masyarakat terkait menara telekomunikasi',
    icon: <IconFeedback />,
  },
};

const TAB_ORDER: TabKey[] = ['complaints', 'feedbacks'];

const MessagesIndexPage: React.FC = () => {
  const page = usePage();
  const { reports = [], feedbacks = [], statuses = [] } = page.props as any as PageProps;

  // Determine default tab from query (?tab=feedbacks|complaints)
  const defaultTab = useMemo(() => {
    try {
      const search = typeof window !== 'undefined' ? window.location.search : '';
      const tabParam = new URLSearchParams(search).get('tab');
      return tabParam === 'feedbacks' ? 'feedbacks' : 'complaints';
    } catch {
      return 'complaints';
    }
  }, []);

  const [activeTab, setActiveTab] = useState<'complaints' | 'feedbacks'>(defaultTab as 'complaints' | 'feedbacks');

  // Keep URL in sync when tab changes (without full navigation)
  useEffect(() => {
    try {
      const url = new URL(window.location.href);
      url.searchParams.set('tab', activeTab);
      window.history.replaceState({}, '', url.toString());
    } catch {}
  }, [activeTab]);

  /* Real counts off the props already on the page — no derived percentage, no
     invented trend. They tell you which inbox has work in it before you click. */
  const counts: Record<TabKey, number> = {
    complaints: reports.length,
    feedbacks: feedbacks.length,
  };

  return (
    <AdminLayout title="Messages">
      <Head title="Messages" />

      {/* The tab strip IS the page's control zone, so it lives in the header
          rather than in a second band underneath it. */}
      <PageHeader
        title={TAB_COPY[activeTab].title}
        description={TAB_COPY[activeTab].subtitle}
        showLogo={false}
        actions={
          <div
            role="tablist"
            aria-label="Jenis pesan"
            className="inline-flex w-full items-center gap-1 rounded-lg border border-border bg-well p-1 sm:w-auto"
          >
            {TAB_ORDER.map((key) => {
              const isActive = activeTab === key;
              return (
                <button
                  key={key}
                  id={`messages-tab-${key}`}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  aria-controls={`messages-panel-${key}`}
                  onClick={() => setActiveTab(key)}
                  className={cn(
                    'inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-md px-3 text-sm font-medium',
                    'transition-colors duration-140 ease-state focus-visible:outline-none focus-visible:ring focus-visible:ring-offset-2 sm:flex-none',
                    isActive
                      ? 'bg-card text-foreground shadow-xs'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  {TAB_COPY[key].icon}
                  <span>{TAB_COPY[key].label}</span>
                  <span
                    className={cn(
                      'rounded px-1.5 text-xs tabular-nums',
                      isActive ? 'bg-primary-soft text-primary-strong' : 'bg-muted text-muted-foreground',
                    )}
                  >
                    {counts[key]}
                  </span>
                </button>
              );
            })}
          </div>
        }
      />

      <div
        id={`messages-panel-${activeTab}`}
        role="tabpanel"
        aria-labelledby={`messages-tab-${activeTab}`}
      >
        {activeTab === 'complaints' ? (
          <ManagementTable
            items={reports as any}
            statuses={statuses}
            title="Keluhan"
            type="complaints"
            respondRoute="/admin/complaints/:id/respond"
            updateStatusRoute="/admin/complaints/:id"
          />
        ) : (
          <ManagementTable
            items={feedbacks as any}
            statuses={statuses}
            title="Masukan"
            type="feedbacks"
            respondRoute="/admin/feedbacks/:id/respond"
            updateStatusRoute="/admin/feedbacks/:id/status"
          />
        )}
      </div>
    </AdminLayout>
  );
};

export default MessagesIndexPage;
