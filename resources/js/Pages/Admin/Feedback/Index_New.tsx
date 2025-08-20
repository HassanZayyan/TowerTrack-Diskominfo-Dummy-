import React from 'react';
import { Head } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import ManagementTable from '@/Components/Admin/ManagementTable';

interface FeedbackAsset { 
  id: number; 
  feedback_id: number; 
  file_path: string; 
  file_type: string; 
  file_name?: string;
}

interface FeedbackResponse { 
  id: number; 
  feedback_id: number; 
  user_id: number; 
  message: string; 
  created_at: string; 
  user?: { id: number; name: string };
  assets?: FeedbackAsset[];
}

interface Tower { 
  id: number; 
  site_name: string; 
  alamat_menara?: string; 
}

interface User {
  id: number;
  name: string;
  email: string;
}

interface Feedback { 
  id: number; 
  user_id: number; 
  tower_id: number;
  sender_phone: string;
  category: string; 
  message: string; 
  status: string; 
  created_at?: string;
  tower?: Tower; 
  user?: User; 
  assets?: FeedbackAsset[]; 
  responses?: FeedbackResponse[];
}

interface Status {
  id: number;
  name: string;
  slug: string;
  color: string;
  icon: string;
}

interface Props { 
  feedbacks: Feedback[];
  statuses?: Status[];
}

const FeedbackIndexPage: React.FC<Props> = ({ feedbacks = [], statuses = [] }) => {
  return (
    <AdminLayout title="Feedback Management">
      <Head title="Feedback Management" />
      
      <ManagementTable
        items={feedbacks}
        statuses={statuses}
        title="Masukan"
        type="feedbacks"
        respondRoute="/admin/feedbacks/:id/respond"
        updateStatusRoute="/admin/feedbacks/:id/status"
      />
    </AdminLayout>
  );
};

export default FeedbackIndexPage;
