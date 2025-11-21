/**
 * Response Mapper Utilities
 * 
 * Provides generic mapping functions for converting API responses to MessageResponseItem format.
 */

import type { MessageResponseItem } from '@/Components/MyMessages/MessageResponseTimeline';

/**
 * Generic response interface for both ReportResponse and FeedbackResponse
 */
interface GenericResponse {
  id: number;
  report_id?: number;
  feedback_id?: number;
  user_id: number | null;
  message: string | null;
  created_at: string;
  user?: {
    id: number;
    name: string;
    email?: string;
  } | null;
  assets?: Array<{
    id: number;
    file_path: string;
    file_type: string;
    mime_type?: string;
  }>;
  sender_type?: 'staff' | 'reporter' | 'guest';
  sender_name?: string | null;
  sender_email?: string | null;
  sender_phone?: string | null;
}

/**
 * Map generic responses (ReportResponse or FeedbackResponse) to MessageResponseItem format
 * 
 * @param responses Array of responses to map
 * @returns Array of MessageResponseItem
 */
export function mapResponses(responses?: GenericResponse[]): MessageResponseItem[] {
  if (!responses || responses.length === 0) {
    return [];
  }

  return responses.map((response) => ({
    id: response.id,
    message: response.message ?? '',
    created_at: response.created_at,
    sender_type: response.sender_type ?? (response.user_id ? 'staff' : 'reporter'),
    sender_name: response.sender_name ?? response.user?.name ?? null,
    sender_email: response.sender_email ?? null,
    sender_phone: response.sender_phone ?? null,
    user: response.user ? { id: response.user.id, name: response.user.name } : null,
    assets:
      response.assets?.map((asset) => ({
        file_path: asset.file_path,
        file_type: asset.file_type,
      })) ?? [],
  }));
}

/**
 * Map ReportResponse array to MessageResponseItem format
 * 
 * @param responses Array of ReportResponse
 * @returns Array of MessageResponseItem
 */
export function mapReportResponses(responses?: GenericResponse[]): MessageResponseItem[] {
  return mapResponses(responses);
}

/**
 * Map FeedbackResponse array to MessageResponseItem format
 * 
 * @param responses Array of FeedbackResponse
 * @returns Array of MessageResponseItem
 */
export function mapFeedbackResponses(responses?: GenericResponse[]): MessageResponseItem[] {
  return mapResponses(responses);
}

