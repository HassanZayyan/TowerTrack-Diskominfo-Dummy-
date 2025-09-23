import React, { useMemo, useState, useEffect } from 'react';
import { Head, usePage } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import ManagementTable from '@/Components/Admin/ManagementTable';
import HeroSection from '@/Components/HeroSection';

interface MediaItem {
  id: number;
  file_path: string;
  file_type?: string;
  file_name?: string;
}

interface ResponseItem {
  id: number;
  message: string;
  created_at?: string;
  user?: { id?: number; name: string };
  assets?: MediaItem[];
}

interface Tower {
  id: number;
  site_name: string;
  alamat_menara?: string;
}

interface User {
  id?: number;
  name: string;
  email?: string;
}

interface ReportItem {
  id: number;
  user_id: number;
  reporter_name?: string;
  reporter_phone?: string;
  category?: string;
  message: string;
  status: string;
  created_at?: string;
  tower?: Tower;
  user?: User;
  responses?: ResponseItem[];
  images?: MediaItem[];
}

interface FeedbackItem {
  id: number;
  user_id: number;
  sender_name?: string;
  sender_phone?: string;
  category?: string;
  message: string;
  status: string;
  created_at?: string;
  tower?: Tower;
  user?: User;
  assets?: MediaItem[];
  responses?: ResponseItem[];
}

interface StatusItem {
  id: number;
  name: string;
  slug: string;
  color: string;
  icon: string;
}

type PageProps = {
  reports: ReportItem[];
  feedbacks: FeedbackItem[];
  statuses: StatusItem[];
};

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

  return (
    <AdminLayout title="Messages">
      <Head title="Messages" />

      {/* Hero Section */}
      <div className="mb-8">
        <HeroSection
          title="Kelola Pesan"
          subtitle="Kelola keluhan dan masukan dari pengguna sistem dengan respon yang tepat dan cepat"
          variant="neutral"
          align="left"
          actions={
            <>
              <div className="inline-flex rounded-lg bg-white p-1 border border-gray-200 shadow-sm">
                <button
                  className={`px-4 py-2 text-sm rounded-md transition-colors ${activeTab === 'complaints' ? 'bg-red-600 text-white' : 'text-gray-700 hover:bg-gray-50'}`}
                  onClick={() => setActiveTab('complaints')}
                >
                  <svg className="w-4 h-4 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  Keluhan
                </button>
                <button
                  className={`px-4 py-2 text-sm rounded-md transition-colors ${activeTab === 'feedbacks' ? 'bg-red-600 text-white' : 'text-gray-700 hover:bg-gray-50'}`}
                  onClick={() => setActiveTab('feedbacks')}
                >
                  <svg className="w-4 h-4 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                  </svg>
                  Masukan
                </button>
              </div>
            </>
          }
        />
      </div>

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
    </AdminLayout>
  );
};

export default MessagesIndexPage;


