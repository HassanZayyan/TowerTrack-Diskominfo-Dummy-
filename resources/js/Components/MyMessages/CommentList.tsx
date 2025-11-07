import React from 'react';
import { router } from '@inertiajs/react';
import CommentItem, { Comment } from './CommentItem';

interface PaginationLink {
  url: string | null;
  label: string;
  active: boolean;
}

interface PaginationData {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  links: PaginationLink[];
}

interface CommentListProps {
  comments: Comment[];
  onReply?: (commentId: number, authorName: string) => void;
  pagination?: PaginationData;
}

export default function CommentList({ comments, onReply, pagination }: CommentListProps) {
  const totalComments = pagination?.total ?? comments.length;
  
  if (comments.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8 text-center">
        <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Belum Ada Komentar</h3>
        <p className="text-gray-600 text-sm">Jadilah yang pertama untuk berkomentar!</p>
      </div>
    );
  }

  const handlePaginationClick = (url: string | null) => {
    if (url) {
      router.visit(url, {
        preserveScroll: true,
        only: ['comments'],
      });
    }
  };

  return (
    <div>
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow-sm">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-gray-900">
            Komentar ({totalComments})
          </h3>
        </div>

        <div className="space-y-0">
          {comments.map((comment) => (
            <CommentItem 
              key={comment.id} 
              comment={comment} 
              onReply={onReply}
            />
          ))}
        </div>
      </div>

      {/* Pagination */}
      {pagination && pagination.last_page > 1 && (
        <div className="mt-4 flex justify-center">
          <nav className="flex gap-1" aria-label="Pagination">
            {pagination.links.map((link, index) => {
              // Skip "..." labels that are not clickable
              if (!link.url && link.label.includes('...')) {
                return (
                  <span
                    key={index}
                    className="px-3 py-2 text-gray-500"
                  >
                    {link.label}
                  </span>
                );
              }

              return (
                <button
                  key={index}
                  onClick={() => handlePaginationClick(link.url)}
                  disabled={!link.url || link.active}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    link.active
                      ? 'bg-blue-600 text-white cursor-default'
                      : link.url
                      ? 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300 hover:border-gray-400'
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  }`}
                  dangerouslySetInnerHTML={{ __html: link.label }}
                  aria-label={link.active ? `Halaman ${link.label}` : `Ke halaman ${link.label}`}
                />
              );
            })}
          </nav>
        </div>
      )}
    </div>
  );
}

