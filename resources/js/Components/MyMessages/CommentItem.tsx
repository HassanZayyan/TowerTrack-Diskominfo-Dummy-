import React from 'react';

export type Comment = {
  id: number;
  message: string;
  created_at: string;
  parent_id?: number | null;
  user?: {
    id: number;
    name: string;
    email?: string;
  } | null;
  guest_name?: string | null;
  guest_email?: string | null;
  parent?: {
    id: number;
    user_id?: number | null;
    guest_name?: string | null;
    user?: {
      id: number;
      name: string;
    } | null;
  } | null;
  replies?: Comment[];
};

interface CommentItemProps {
  comment: Comment;
  onReply?: (commentId: number, authorName: string) => void;
  replyingTo?: number | null;
  depth?: number;
}

export default function CommentItem({ comment, onReply, replyingTo, depth = 0 }: CommentItemProps) {
  const isGuest = !comment.user;
  const authorName = comment.user?.name || comment.guest_name || 'Tamu';
  
  // Get parent author name for reply indicator
  const getParentAuthorName = (): string | null => {
    if (!comment.parent) return null;
    return comment.parent.user?.name || comment.parent.guest_name || 'Tamu';
  };
  
  const parentAuthorName = getParentAuthorName();
  const isReplyComment = !!comment.parent_id;
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Hari ini';
    if (diffDays === 2) return 'Kemarin';
    if (diffDays <= 7) return `${diffDays - 1} hari yang lalu`;
    
    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const maxDepth = 3; // Limit nested depth
  
  // Indentasi konstan 2rem (≈2cm) untuk semua replies
  // Solusi: Gunakan padding-left pada container replies (bukan margin-left pada item)
  // Ini memastikan indentasi tidak kumulatif meskipun komponen dipanggil rekursif
  // Logic: Jika comment ini memiliki parent_id, maka replies-nya tidak perlu indentasi lagi
  //        Jika comment ini TIDAK memiliki parent_id (top-level), maka replies-nya perlu indentasi
  
  return (
    <div className="mt-3">
      <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow duration-200">
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center shadow-sm ${
            isGuest 
              ? 'bg-gradient-to-br from-gray-400 to-gray-500' 
              : 'bg-gradient-to-br from-blue-500 to-blue-600'
          }`}>
            {isGuest ? (
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            ) : (
              <span className="text-white font-semibold text-sm">
                {authorName.charAt(0).toUpperCase()}
              </span>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Reply Indicator - Show if this is a reply */}
            {isReplyComment && parentAuthorName && (
              <div className="mb-2 flex items-center gap-2 text-xs text-gray-600">
                <svg className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                </svg>
                <span className="font-medium text-blue-600">
                  Membalas <span className="font-semibold">{parentAuthorName}</span>
                </span>
              </div>
            )}
            
            <div className="flex items-center gap-2 mb-2">
              <h4 className="font-semibold text-gray-900">{authorName}</h4>
              {isGuest && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 border border-amber-200">
                  Tamu
                </span>
              )}
              <span className="text-xs text-gray-500">
                {formatDate(comment.created_at)} • {new Date(comment.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            <div className="text-gray-900 whitespace-pre-wrap leading-relaxed bg-gray-50 rounded-lg p-3 border border-gray-100">
              {comment.message}
            </div>
            
            {/* Reply Button */}
            {onReply && depth < maxDepth && (
              <div className="mt-3">
                <button
                  type="button"
                  onClick={() => onReply(comment.id, authorName)}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded px-2 py-1"
                  aria-label={`Balas komentar dari ${authorName}`}
                >
                  Balas
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Render Replies Recursively - Flat layout dengan indentasi konstan */}
      {comment.replies && comment.replies.length > 0 && depth < maxDepth && (
        // Padding-left hanya diterapkan jika parent adalah top-level (tidak memiliki parent_id)
        // Ini memastikan indentasi konstan 2rem untuk semua replies, tidak kumulatif
        <div className="space-y-0" style={{ paddingLeft: !isReplyComment ? '2rem' : 0 }}>
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              onReply={onReply}
              replyingTo={replyingTo}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

