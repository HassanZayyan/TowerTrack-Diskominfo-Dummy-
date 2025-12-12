/**
 * Shared types for MyMessages pages
 * Used across Index.tsx, Admin pages, and related components
 */

// Base types for media items
export type MediaItem = {
  id: number;
  file_path: string;
  file_type?: string;
  file_name?: string;
  mime_type?: string;
};

// Base types for response items
export type ResponseItem = {
  id: number;
  message: string;
  created_at?: string;
  user?: { id?: number; name: string; email?: string };
  assets?: MediaItem[];
};

// Base types for tower
export type Tower = {
  id: number;
  site_name: string;
  alamat_menara?: string;
  latitude?: number | string | null;
  longitude?: number | string | null;
  tinggi_menara?: number;
  site_type?: string | null;
};

// Base types for FO Point
export type FoPoint = {
  id: number;
  name: string;
  latitude?: number | string | null;
  longitude?: number | string | null;
  area?: string;
  route_name?: string;
  type?: string;
  status?: string;
  description?: string;
  side_of_road?: 'left' | 'right' | 'unknown' | null;
  images?: {
    isp: string | null;
    pole: string | null;
    junction_box: string | null;
  };
};

// Union type for location (Tower or FoPoint)
export type Location = Tower | FoPoint;
export type LocationType = 'tower' | 'fo_point';

// Base types for user
export type User = {
  id: number;
  name: string;
  email?: string;
  role?: string;
};

// Status item type
export type StatusItem = {
  id: number;
  name: string;
  slug: string;
  color: string;
  icon: string;
};

// Report item type (for MyMessages pages)
export type ReportItem = {
  id: number;
  tower_id?: number; // Deprecated: use reportable_id instead
  reportable_type?: string; // Polymorphic type: 'App\\Models\\Tower' or 'App\\Models\\FoPoint'
  reportable_id?: number; // Polymorphic ID
  category: string;
  message: string;
  status: string;
  created_at: string;
  email?: string | null; // For anonymous users
  reporter_name?: string | null; // For anonymous users
  reporter_phone?: string | null; // For anonymous users
  user_id?: number | null;
  user?: { id: number; name: string; email: string } | null; // For authenticated users
  tower?: { id: number; site_name: string; alamat_menara?: string }; // Deprecated: use reportable instead
  reportable?: { id: number; site_name?: string; name?: string; alamat_menara?: string }; // Polymorphic relationship
  responses?: Array<{ id: number; report_id: number; created_at: string }>;
  comments_count?: number; // Count of approved top-level comments
  is_public?: boolean; // Visibility flag for filtering
};

// Extended Report type (for Admin pages and detail pages)
export type Report = ReportItem & {
  images?: MediaItem[];
  is_public?: boolean;
  comments?: Array<{
    id: number;
    message: string;
    created_at: string;
    user?: { id: number; name: string; email?: string } | null;
    guest_name?: string | null;
    guest_email?: string | null;
  }>;
};

// Feedback item type (for MyMessages pages)
export type FeedbackItem = {
  id: number;
  tower_id?: number; // Deprecated: use feedbackable_id instead
  feedbackable_type?: string; // Polymorphic type: 'App\\Models\\Tower' or 'App\\Models\\FoPoint'
  feedbackable_id?: number; // Polymorphic ID
  category: string;
  message: string;
  status: string;
  created_at: string;
  email?: string | null; // For anonymous users
  sender_name?: string | null; // For anonymous users
  sender_phone?: string | null; // For anonymous users
  user_id?: number | null;
  user?: { id: number; name: string; email: string } | null; // For authenticated users
  tower?: { id: number; site_name: string; alamat_menara?: string }; // Deprecated: use feedbackable instead
  feedbackable?: { id: number; site_name?: string; name?: string; alamat_menara?: string }; // Polymorphic relationship
  responses?: Array<{ id: number; feedback_id: number; created_at: string }>;
  comments_count?: number; // Count of approved top-level comments
  is_public?: boolean; // Visibility flag for filtering
};

// Extended Feedback type (for Admin pages and detail pages)
export type Feedback = FeedbackItem & {
  assets?: MediaItem[];
  is_public?: boolean;
  comments?: Array<{
    id: number;
    message: string;
    created_at: string;
    user?: { id: number; name: string; email?: string } | null;
    guest_name?: string | null;
    guest_email?: string | null;
  }>;
};

// Message item type (unified type for merged reports and feedbacks)
export type MessageItem = {
  id: string;
  type: 'Keluhan' | 'Masukan';
  created_at: string;
  towerName: string;
  locationType?: 'Tower' | 'Fiber Optik'; // Type of location (Tower or Fiber Optik)
  category: string;
  status: string | undefined | null;
  responsesCount: number;
  commentsCount: number;
  senderName: string; // Display name (from user.name or reporter_name/sender_name)
  senderEmail: string; // Display email (from user.email or email field)
  isAnonymous: boolean; // Whether the sender is anonymous
  isPublic?: boolean; // Visibility flag for filtering (public/private)
};

