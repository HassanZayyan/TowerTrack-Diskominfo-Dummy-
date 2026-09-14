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
  commentCount?: number;
}

export default function CommentList({ comments, onReply, pagination, commentCount }: CommentListProps) {
  const totalComments = commentCount ?? pagination?.total ?? comments.length;
  
  if (comments.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-lg border border-border p-8 text-center">
        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-placeholder" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-2">Belum Ada Komentar</h3>
        <p className="text-muted-foreground text-sm">Jadilah yang pertama untuk berkomentar!</p>
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
      <div className="bg-white rounded-xl shadow-lg border border-border p-6">
        <div className="flex items-center gap-3 mb-6">
          {/* Was `bg-warning-soft0`, which is not a Tailwind class — a
              find-replace artefact from the token migration, same family as the
              `bg-muted0` that made Modal.tsx's scrim invisible. Tailwind emitted
              nothing for it, so the white icon below sat on no background at
              all. `bg-warning` is the FILL calibrated for white on top; the
              `-soft` variants are tinted grounds for dark text.

              The glyph is `text-warning-foreground`, not white: app.css:127-130
              records --warning at 2.15:1 against white and requires the 1px
              -strong outline on any warning fill. Dark-on-amber is 8.31:1. */}
          <div className="rounded-lg border border-warning-strong bg-warning p-2 shadow-sm">
            <svg className="w-5 h-5 text-warning-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-foreground">
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
              // Skip"..." labels that are not clickable
              if (!link.url && link.label.includes('...')) {
                return (
                  <span
                    key={index}
                    className="px-3 py-2 text-muted-foreground"
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
                      ? 'bg-neutral text-white cursor-default'
                      : link.url
                      ? 'bg-white text-foreground hover:bg-accent hover:text-accent-foreground border border-input hover:border-input'
                      : 'bg-muted text-placeholder cursor-not-allowed'
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

