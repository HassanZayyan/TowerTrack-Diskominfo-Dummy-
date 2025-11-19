/**
 * Shared types for MyMessages pages
 * Used across Index.tsx, PrivateTracking.tsx, and related components
 */

export type ReportItem = {
  id: number;
  tower_id: number;
  category: string;
  message: string;
  status: string;
  created_at: string;
  email?: string | null; // For anonymous users
  reporter_name?: string | null; // For anonymous users
  reporter_phone?: string | null; // For anonymous users
  user_id?: number | null;
  user?: { id: number; name: string; email: string } | null; // For authenticated users
  tower?: { id: number; site_name: string; alamat_menara?: string };
  responses?: Array<{ id: number; report_id: number; created_at: string }>;
  comments_count?: number; // Count of approved top-level comments
};

export type FeedbackItem = {
  id: number;
  tower_id: number;
  category: string;
  message: string;
  status: string;
  created_at: string;
  email?: string | null; // For anonymous users
  sender_name?: string | null; // For anonymous users
  sender_phone?: string | null; // For anonymous users
  user_id?: number | null;
  user?: { id: number; name: string; email: string } | null; // For authenticated users
  tower?: { id: number; site_name: string; alamat_menara?: string };
  responses?: Array<{ id: number; feedback_id: number; created_at: string }>;
  comments_count?: number; // Count of approved top-level comments
};

export type MessageItem = {
  id: string;
  type: 'Keluhan' | 'Masukan';
  created_at: string;
  towerName: string;
  category: string;
  status: string | undefined | null;
  responsesCount: number;
  commentsCount: number;
  senderName: string; // Display name (from user.name or reporter_name/sender_name)
  senderEmail: string; // Display email (from user.email or email field)
  isAnonymous: boolean; // Whether the sender is anonymous
};

