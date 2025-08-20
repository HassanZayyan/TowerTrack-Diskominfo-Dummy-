import React from 'react';
import { Head } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import ManagementTable from '@/Components/Admin/ManagementTable';

interface ReportImage { id: number; file_path: string; file_type?: string }
interface ReportResponse { 
  id: number; 
  report_id: number; 
  user_id: number; 
  message: string; 
  file_path?: string; 
  file_type?: string; 
  status: string;
  created_at: string; 
  assets?: ReportImage[];
}
interface Tower { id: number; site_name: string; alamat_menara?: string }
interface Report { 
  id: number; 
  user_id: number; 
  reporter_name?: string;
  reporter_phone: string; 
  category: string; 
  message: string; 
  status: string; 
  images?: ReportImage[]; 
  tower?: Tower; 
  user?: { name: string; email: string }; 
  created_at?: string;
  responses?: ReportResponse[];
}

interface Status {
  id: number;
  name: string;
  slug: string;
  color: string;
  icon: string;
}

interface Props { 
  reports: Report[];
  statuses?: Status[];
}

const ComplaintsPage: React.FC<Props> = ({ reports = [], statuses = [] }) => {
  return (
    <AdminLayout title="Complaints">
      <Head title="Complaints" />
      
      <ManagementTable
        items={reports}
        statuses={statuses}
        title="Keluhan"
        type="complaints"
        respondRoute="/admin/complaints/:id/respond"
        updateStatusRoute="/admin/complaints/:id"
      />
    </AdminLayout>
  );
};

export default ComplaintsPage;
