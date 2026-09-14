import React, { useState } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import MainLayout from '@/Layouts/MainLayout';
import AssetGrid from '@/Components/MyMessages/AssetGrid';
import MessageResponseTimeline, { MessageResponseItem } from '@/Components/MyMessages/MessageResponseTimeline';
import MessageResponseForm from '@/Components/MyMessages/MessageResponseForm';
import MessageActionDialog from '@/Components/MyMessages/MessageActionDialog';
import LocationCard from '@/Components/MyMessages/LocationCard';
import { getStatusColor } from '@/utils/statusHelpers';
import { formatDateWithTime } from '@/utils/dateHelpers';
import type { Feedback } from '@/types/messages';

type ShowPrivateFeedbackProps = {
  feedback: Feedback;
  statuses?: Array<{ id: number; name: string; slug: string; color: string; icon: string }>;
};

export default function ShowPrivateFeedback({ feedback, statuses = [] }: ShowPrivateFeedbackProps) {
  const { auth } = usePage().props as any;
  const [previewAsset, setPreviewAsset] = useState<{ file_path: string; file_type?: string } | null>(null);
  const [isResponseModalOpen, setResponseModalOpen] = useState(false);

  const authUser = auth?.user;
  const isAuthenticated = Boolean(authUser);

  const handleResponseSuccess = React.useCallback(() => {
    router.reload({ only: ['feedback'] });
  }, [router]);
  const staffRoles = ['admin', 'operator', 'tower_owner', 'staff'];
  const normalizedRole =
    typeof authUser?.role === 'string' ? authUser.role.toLowerCase() : undefined;
  const isStaff = isAuthenticated && normalizedRole ? staffRoles.includes(normalizedRole) : false;
  const isOwner = isAuthenticated && feedback.user_id && Number(feedback.user_id) === Number(authUser.id);
  const canRespond = isStaff || isOwner;

  const responseStatusResolver = (statusValue: string | null | undefined) => {
    return getStatusColor(statusValue ?? '');
  };

  const backUrl = '/my-messages/my-posts';

  const headerContent = (
    <div className="bg-primary border-b border-primary-hover w-full shadow-md relative z-10 overflow-hidden">
      <div className="mx-auto max-w-screen-2xl px-3 sm:px-4 md:px-6 lg:px-8 py-8 sm:py-10 flex flex-col md:flex-row items-center md:items-start justify-between gap-6">
        <div className="flex-1 text-center md:text-left">
          <div className="mb-4">
            <button
              onClick={() => router.visit(backUrl)}
              className="inline-flex items-center px-5 py-2.5 bg-white text-primary font-semibold rounded-lg shadow-sm hover:bg-white/90 transform hover:-translate-y-0.5 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-white/80 focus-visible:ring-offset-primary"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Kembali ke Pesan Pribadi
            </button>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-3 drop-shadow-sm">
            Detail Masukan Pribadi #{feedback.id}
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
    <MainLayout title={`Detail Masukan Pribadi #${feedback.id}`} currentPage="/my-messages" headerSlot={headerContent}>
      <Head title={`Detail Masukan Pribadi #${feedback.id}`} />

      <div className="animate-fade-in-up">

        {/* Sender Information Card */}
        <div className="bg-card rounded-lg p-5 border border-border shadow-sm mb-6">
          <div className="flex items-center gap-3 mb-4 pb-4 border-b border-border">
            <h4 className="text-base font-bold text-foreground">Informasi Pengirim</h4>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="text-sm font-medium text-muted-foreground mb-1">Nama</div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-foreground text-base">
                  {feedback.user?.name || feedback.sender_name || 'Anonymous'}
                </span>
                {!feedback.user_id && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-warning-soft text-warning-strong border border-warning-border">
                    Tamu
                  </span>
                )}
              </div>
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground mb-1">Waktu Kirim</div>
              <div className="font-semibold text-foreground text-base">
                {formatDateWithTime(feedback.created_at)}
              </div>
            </div>
          </div>
        </div>

        {/* Tower & Category Information */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <LocationCard
            tower={feedback.tower}
            feedbackable={feedback.feedbackable}
            feedbackableType={feedback.feedbackable_type}
          />
          <div className="bg-card rounded-lg p-5 border border-border shadow-sm">
            <div className="flex items-center gap-2 mb-4 pb-4 border-b border-border">
              <h5 className="text-sm font-bold text-foreground">Kategori</h5>
            </div>
            <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-semibold bg-muted text-foreground border border-border">
              {feedback.category ?? '-'}
            </span>
          </div>
        </div>

        {/* Message Content */}
        <div className="bg-card rounded-lg p-5 border border-border shadow-sm mb-6">
          <div className="flex items-center gap-2 mb-4 pb-4 border-b border-border">
            <h5 className="text-sm font-bold text-foreground">Isi Pesan</h5>
          </div>
          <div className="text-foreground whitespace-pre-wrap leading-relaxed text-base">
            {feedback.message}
          </div>
        </div>

        {/* Assets */}
        {feedback.assets && feedback.assets.length > 0 && (
          <div className="mb-6">
            <AssetGrid
              assets={feedback.assets.map(asset => ({ file_path: asset.file_path, file_type: asset.file_type }))}
              onPreview={setPreviewAsset}
            />
          </div>
        )}

        {canRespond && (
          <div className="mb-6">
            <div className="bg-card rounded-lg shadow-sm border border-border p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <h3 className="text-lg font-bold text-foreground">Balas Masukan</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Kirim pembaruan status atau klarifikasi kepada pengirim masukan pribadi ini.
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
                    maxWidth="3xl"
                    isOpen={isResponseModalOpen}
                    setOpen={setResponseModalOpen}
                    onClose={() => setResponseModalOpen(false)}
                  >
                    {(close) => (
                      <MessageResponseForm
                        type="feedback"
                        id={feedback.id}
                        canRespond={canRespond}
                        defaultSenderName={authUser?.name ?? feedback.sender_name ?? ''}
                        defaultEmail={authUser?.email ?? feedback.email ?? ''}
                        defaultPhone={feedback.sender_phone ?? ''}
                        onSuccess={() => {
                          handleResponseSuccess();
                          close();
                        }}
                        showContactFields={false}
                        lockContactFields={true}
                      />
                    )}
                  </MessageActionDialog>
                </div>
              </div>
            </div>
          </div>
        )}

        {feedback.responses && feedback.responses.length > 0 && (
          <div className="mb-6">
            <MessageResponseTimeline
              responses={feedback.responses}
              status={feedback.status}
              statusResolver={responseStatusResolver}
              heading="Riwayat Balasan"
              onPreviewAsset={(asset) => setPreviewAsset(asset)}
            />
          </div>
        )}

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
