import React, { useState } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import MainLayout from '@/Layouts/MainLayout';
import CommentForm from '@/Components/MyMessages/CommentForm';
import CommentList from '@/Components/MyMessages/CommentList';
import AssetGrid from '@/Components/MyMessages/AssetGrid';
import MessageResponseTimeline, { MessageResponseItem } from '@/Components/MyMessages/MessageResponseTimeline';
import MessageResponseForm from '@/Components/MyMessages/MessageResponseForm';
import MessageActionDialog from '@/Components/MyMessages/MessageActionDialog';
import LocationCard from '@/Components/MyMessages/LocationCard';
import { Comment } from '@/Components/MyMessages/CommentItem';
import { getStatusColor } from '@/utils/statusHelpers';
import { formatDateWithTime } from '@/utils/dateHelpers';
import { useCanRespond } from '@/Hooks/useCanRespond';
import { useReturnUrl } from '@/utils/navigationUtils';
import type { Report } from '@/types/messages';

type PaginationLink = {
  url: string | null;
  label: string;
  active: boolean;
};

type PaginationData = {
  data: Comment[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  links: PaginationLink[];
};

type ShowReportProps = {
  report: Report;
  statuses?: Array<{ id: number; name: string; slug: string; color: string; icon: string }>;
  comments?: PaginationData;
  commentCount?: number;
};

export default function ShowReport({ report, statuses = [], comments, commentCount }: ShowReportProps) {
  const { auth } = usePage().props as any;
  const [previewAsset, setPreviewAsset] = useState<{ file_path: string; file_type?: string } | null>(null);
  const [replyingTo, setReplyingTo] = useState<{ id: number; name: string } | null>(null);
  const [isResponseModalOpen, setResponseModalOpen] = useState(false);
  const [isCommentModalOpen, setCommentModalOpen] = useState(false);

  const handleCommentSuccess = React.useCallback(() => {
    setReplyingTo(null);
    router.reload({ only: ['report', 'comments', 'commentCount'] });
  }, [router]);

  const handleResponseSuccess = React.useCallback(() => {
    router.reload({ only: ['report'] });
  }, [router]);

  const handleReply = (commentId: number, authorName: string) => {
    setReplyingTo({ id: commentId, name: authorName });
    setCommentModalOpen(true);
  };

  const handleCancelReply = () => {
    setReplyingTo(null);
  };

  const authUser = auth?.user;
  const isAuthenticated = Boolean(authUser);

  const { canRespond, responseDescription } = useCanRespond({
    user_id: report.user_id,
    email: report.email,
    phone: report.reporter_phone,
    phoneField: 'reporter_phone',
    messageType: 'report',
  });

  const responseStatusResolver = (statusValue: string | null | undefined) => {
    return getStatusColor(statusValue ?? '');
  };

  const { returnUrl, buttonLabel } = useReturnUrl();

  const headerContent = (
    <div className="bg-primary border-b border-primary-hover w-full shadow-md relative z-10 overflow-hidden">
      <div className="mx-auto max-w-screen-2xl px-3 sm:px-4 md:px-6 lg:px-8 py-8 sm:py-10 flex flex-col md:flex-row items-center md:items-start justify-between gap-6">
        <div className="flex-1 text-center md:text-left">
          <div className="mb-4">
            <button
              onClick={() => router.visit(returnUrl)}
              className="inline-flex items-center px-5 py-2.5 bg-white text-primary font-semibold rounded-lg shadow-sm hover:bg-white/90 transform hover:-translate-y-0.5 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-white/80 focus-visible:ring-offset-primary"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              {buttonLabel}
            </button>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-3 drop-shadow-sm">
            Detail Keluhan #{report.id}
          </h1>
        </div>
        <div className="hidden md:block flex-shrink-0">
          <div className="bg-white p-3 rounded-xl shadow-sm transform hover:scale-105 transition-transform duration-300">
            <img
              src="/images/kab-smg-logo.webp"
              alt="Logo Kabupaten Semarang"
              className="h-20 w-auto object-contain drop-shadow-sm"
            />
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <MainLayout title={`Detail Keluhan #${report.id}`} currentPage="/my-messages" headerSlot={headerContent}>
      <Head title={`Detail Keluhan #${report.id}`} />

      <div className="animate-fade-in-up">

        {/* Sender Information Card */}
        <div className="bg-card rounded-lg p-5 border border-border shadow-sm mb-6">
          <div className="flex items-center gap-2 mb-4 pb-4 border-b border-border">
            <h4 className="text-lg font-bold text-foreground">Informasi Pengirim</h4>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <div className="text-sm font-medium text-muted-foreground mb-1">Nama</div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-foreground text-base">
                  {report.user?.name || report.reporter_name || 'Anonymous'}
                </span>
                {!report.user_id && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-warning-soft text-warning-strong">
                    Tamu
                  </span>
                )}
              </div>
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground mb-1">Waktu Kirim</div>
              <div className="font-semibold text-foreground text-base">
                {formatDateWithTime(report.created_at)}
              </div>
            </div>
          </div>
        </div>

        {/* Tower & Category Information */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <LocationCard
            tower={report.tower}
            reportable={report.reportable}
            reportableType={report.reportable_type}
          />
          <div className="bg-card rounded-lg p-5 border border-border shadow-sm">
            <div className="flex items-center gap-2 mb-4 pb-4 border-b border-border">
              <h5 className="text-lg font-bold text-foreground">Kategori</h5>
            </div>
            <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-semibold bg-muted text-foreground border border-border">
              {report.category ?? '-'}
            </span>
          </div>
        </div>

        {/* Message Content */}
        <div className="bg-card rounded-lg p-5 border border-border shadow-sm mb-6">
          <div className="flex items-center gap-2 mb-4 pb-4 border-b border-border">
            <h5 className="text-lg font-bold text-foreground">Isi Pesan</h5>
          </div>
          <div className="text-foreground whitespace-pre-wrap leading-relaxed text-base">
            {report.message}
          </div>
        </div>

        {/* Assets */}
        {report.images && report.images.length > 0 && (
          <div className="mb-6">
            <AssetGrid
              assets={report.images.map(img => ({ file_path: img.file_path, file_type: img.file_type }))}
              onPreview={setPreviewAsset}
            />
          </div>
        )}

        {canRespond && (
          <div className="mb-6">
            <div className="bg-card rounded-lg shadow-sm border border-border p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <h3 className="text-lg font-bold text-foreground">Balas Keluhan</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Sampaikan tindak lanjut atau ubah status penanganan keluhan ini.
                  </p>
                </div>
                <div className="w-full sm:w-auto sm:flex-shrink-0">
                  <MessageActionDialog
                    triggerLabel="Kirim Balasan"
                    triggerIcon={
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m7 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    }
                    triggerVariant="primary"
                    triggerSize="md"
                    triggerFullWidth={true}
                    triggerClassName="w-full sm:w-auto whitespace-nowrap bg-neutral hover:bg-neutral text-white rounded-lg px-4 py-2 flex items-center justify-center gap-2 font-medium transition-colors"
                    title="Kirim Balasan"
                    description={responseDescription}
                    maxWidth="3xl"
                    isOpen={isResponseModalOpen}
                    setOpen={setResponseModalOpen}
                    onClose={() => setResponseModalOpen(false)}
                  >
                    {(close) => (
                      <MessageResponseForm
                        type="report"
                        id={report.id}
                        canRespond={canRespond}
                        defaultSenderName={authUser?.name ?? ''}
                        defaultEmail={isAuthenticated ? authUser?.email ?? report.email ?? '' : ''}
                        defaultPhone={isAuthenticated ? report.reporter_phone ?? '' : ''}
                        onSuccess={() => {
                          handleResponseSuccess();
                          close();
                        }}
                        showContactFields={!isAuthenticated}
                        lockContactFields={false}
                        description={responseDescription}
                      />
                    )}
                  </MessageActionDialog>
                </div>
              </div>
            </div>
          </div>
        )}

        {report.responses && report.responses.length > 0 && (
          <div className="mb-6">
            <MessageResponseTimeline
              responses={report.responses}
              status={report.status}
              statusResolver={responseStatusResolver}
              heading="Balasan"
              onPreviewAsset={(asset) => setPreviewAsset(asset)}
            />
          </div>
        )}

        {/* Comments Section */}
        <div className="mb-6">
          <div className="bg-card rounded-lg p-6 border border-border shadow-sm">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-4 border-b border-border pb-4">
              <div>
                <h3 className="text-lg font-bold text-foreground">Komentar</h3>
                <p className="text-sm text-muted-foreground">Diskusikan perkembangan keluhan secara terbuka.</p>
              </div>
              <MessageActionDialog
                triggerLabel={replyingTo ? `Balas ${replyingTo.name}` : 'Tulis Komentar'}
                triggerIcon={
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                  </svg>
                }
                triggerVariant="primary"
                triggerFullWidth={false}
                triggerClassName="whitespace-nowrap bg-neutral hover:bg-neutral text-white rounded-lg px-4 py-2 flex items-center gap-2 font-medium transition-colors"
                title={replyingTo ? `Balas ${replyingTo.name}` : 'Tulis Komentar'}
                description={replyingTo ? 'Komentar akan dikirim sebagai balasan.' : 'Komentar Anda akan terlihat oleh publik.'}
                isOpen={isCommentModalOpen}
                setOpen={setCommentModalOpen}
                onOpen={() => setReplyingTo(null)}
                onClose={() => {
                  setCommentModalOpen(false);
                  setReplyingTo(null);
                }}
              >
                {(close) => (
                  <CommentForm
                    type="report"
                    id={report.id}
                    parentId={replyingTo?.id || null}
                    replyingTo={replyingTo?.name || null}
                    onSuccess={() => {
                      handleCommentSuccess();
                      close();
                      setCommentModalOpen(false);
                    }}
                    onCancel={handleCancelReply}
                  />
                )}
              </MessageActionDialog>
            </div>

            <CommentList
              comments={comments?.data || report.comments || []}
              onReply={handleReply}
              pagination={comments}
              commentCount={commentCount}
            />
          </div>
        </div>

        {/* Asset Preview Modal */}
        {previewAsset && (
          <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50" onClick={() => setPreviewAsset(null)}>
            <div className="max-w-4xl w-full max-h-[90vh] flex items-center justify-center p-4">
              {previewAsset.file_type === 'video' ? (
                <video
                  src={`/storage/${previewAsset.file_path}`}
                  controls
                  autoPlay
                  className="max-w-full max-h-[90vh] object-contain"
                  onClick={(e) => e.stopPropagation()}
                />
              ) : (
                <img
                  src={`/storage/${previewAsset.file_path}`}
                  alt="Lampiran gambar pada pesan ini, tampilan penuh"
                  className="max-w-full max-h-[90vh] object-contain"
                  onClick={(e) => e.stopPropagation()}
                />
              )}
              <button
                className="absolute top-4 right-4 text-white bg-black bg-opacity-50 rounded-full p-2 hover:bg-opacity-70"
                onClick={() => setPreviewAsset(null)}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}