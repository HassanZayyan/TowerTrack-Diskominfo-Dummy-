import React, { useState } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import MainLayout from '@/Layouts/MainLayout';
import AnimatedButton from '@/Components/AnimatedButton';
import StaggeredContainer from '@/Components/StaggeredContainer';
import CommentForm from '@/Components/MyMessages/CommentForm';
import CommentList from '@/Components/MyMessages/CommentList';
import AssetGrid from '@/Components/MyMessages/AssetGrid';
import MessageResponseTimeline, { MessageResponseItem } from '@/Components/MyMessages/MessageResponseTimeline';
import MessageResponseForm from '@/Components/MyMessages/MessageResponseForm';
import MessageActionDialog from '@/Components/MyMessages/MessageActionDialog';
import { Comment } from '@/Components/MyMessages/CommentItem';
import { getStatusColor } from '@/utils/statusHelpers';
import { formatDateWithTime } from '@/utils/dateHelpers';

type Report = {
  id: number;
  tower_id: number;
  category: string;
  message: string;
  status: string;
  created_at: string;
  email?: string | null;
  reporter_name?: string | null;
  reporter_phone?: string | null;
  user_id?: number | null;
  user?: { id: number; name: string; email: string; role?: string } | null;
  tower?: { id: number; site_name: string; alamat_menara?: string };
  images?: Array<{ id: number; file_path: string; file_type?: string }>;
  responses?: MessageResponseItem[];
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
};

export default function ShowReport({ report, statuses = [], comments }: ShowReportProps) {
  const { auth } = usePage().props as any;
  const [previewAsset, setPreviewAsset] = useState<{ file_path: string; file_type?: string } | null>(null);
  const [replyingTo, setReplyingTo] = useState<{ id: number; name: string } | null>(null);
  const [isResponseModalOpen, setResponseModalOpen] = useState(false);
  const [isCommentModalOpen, setCommentModalOpen] = useState(false);



  const handleCommentSuccess = React.useCallback(() => {
    setReplyingTo(null);
    router.reload({ only: ['report'] });
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
  const normalizedRole =
    typeof authUser?.role === 'string' ? authUser.role.toLowerCase() : undefined;
  const isAdmin = isAuthenticated && normalizedRole === 'admin';
  const isOwner = Boolean(
    isAuthenticated && report.user_id && authUser?.id && Number(report.user_id) === Number(authUser.id)
  );
  const hasReporter = Boolean(report.user_id);
  
  // Determine who can respond
  let canRespond = false;
  
  if (hasReporter) {
    // For authenticated reports: only admin and reporter can respond
    canRespond = isAdmin || isOwner;
  } else {
    // For anonymous reports: staff and guest can respond
    const staffRoles = ['admin', 'operator', 'tower_owner', 'staff'];
    const isStaff = isAuthenticated && normalizedRole ? staffRoles.includes(normalizedRole) : false;
    const canGuestRespond = !isAuthenticated && (!!report.email || !!report.reporter_phone);
    canRespond = isStaff || canGuestRespond;
  }

  const responseDescription = !isAuthenticated && !hasReporter
    ? 'Masukkan email dan nomor telepon yang digunakan saat mengirim laporan untuk memverifikasi bahwa Anda adalah pengirim asli.'
    : undefined;

  const responseStatusResolver = (statusValue: string | null | undefined) => {
    return getStatusColor(statusValue ?? '');
  };

  return (
    <MainLayout title={`Detail Keluhan #${report.id}`} currentPage="/my-messages">
      <Head title={`Detail Keluhan #${report.id}`} />
      
      <div className="p-4 sm:p-6">
        {/* Back Button */}
        <StaggeredContainer delay={0} animationType="fadeInLeft" duration={400}>
          <div className="mb-6">
            <AnimatedButton
              variant="outline"
              size="md"
              animation="scale"
              onClick={() => router.visit('/my-messages')}
              icon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                </svg>
              }
              className="border-red-500 text-red-700 hover:bg-red-500 hover:text-white"
            >
              Kembali ke Pesan Publik
            </AnimatedButton>
          </div>
        </StaggeredContainer>

        <StaggeredContainer delay={100} animationType="fadeInUp" duration={500}>
          <div className="relative rounded-xl shadow-lg mb-8 px-6 sm:px-8 py-6 overflow-hidden bg-gradient-to-br from-red-50 via-white to-red-50 border border-red-100">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-gradient-to-br from-red-600 to-red-700 rounded-lg shadow-md">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-red-700 to-red-600 bg-clip-text text-transparent">
                Detail Keluhan #{report.id}
              </h1>
            </div>
          </div>
        </StaggeredContainer>

        {/* Sender Information Card */}
        <StaggeredContainer delay={150} animationType="fadeInUp" duration={400}>
          <div className="bg-gradient-to-br from-teal-50 to-cyan-50 rounded-xl p-5 border border-teal-200 shadow-sm mb-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 bg-gradient-to-br from-teal-500 to-teal-600 rounded-lg shadow-md">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h4 className="text-base font-bold text-gray-900">Informasi Pengirim</h4>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-white/60 backdrop-blur-sm rounded-lg p-3">
                <div className="text-xs font-medium text-teal-700 mb-1.5">Nama</div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-gray-900">
                    {report.user?.name || report.reporter_name || 'Anonymous'}
                  </span>
                  {!report.user_id && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 border border-amber-200">
                      Tamu
                    </span>
                  )}
                </div>
              </div>
              <div className="bg-white/60 backdrop-blur-sm rounded-lg p-3">
                <div className="text-xs font-medium text-teal-700 mb-1.5">Waktu Kirim</div>
                <div className="font-semibold text-gray-900">
                  {formatDateWithTime(report.created_at)}
                </div>
              </div>
            </div>
          </div>
        </StaggeredContainer>

        {/* Tower & Category Information */}
        <StaggeredContainer delay={200} animationType="fadeInUp" duration={400}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <div className="p-2 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow-sm">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <h5 className="text-sm font-bold text-gray-900">Lokasi Tower</h5>
              </div>
              <div className="font-semibold text-gray-900 text-base mb-1">{report.tower?.site_name ?? '-'}</div>
              {report.tower?.alamat_menara && (
                <div className="text-sm text-gray-600 flex items-start gap-1">
                  <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {report.tower.alamat_menara}
                </div>
              )}
            </div>
            <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <div className="p-2 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg shadow-sm">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                </div>
                <h5 className="text-sm font-bold text-gray-900">Kategori</h5>
              </div>
              <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-semibold bg-orange-100 text-orange-800 border border-orange-200">
                {report.category ?? '-'}
              </span>
            </div>
          </div>
        </StaggeredContainer>

        {/* Message Content */}
        <StaggeredContainer delay={250} animationType="fadeInUp" duration={400}>
          <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm mb-6">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-2 bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-sm">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
              </div>
              <h5 className="text-sm font-bold text-gray-900">Isi Pesan</h5>
            </div>
            <div className="text-gray-900 whitespace-pre-wrap leading-relaxed bg-gray-50 rounded-lg p-4 border border-gray-100">
              {report.message}
            </div>
          </div>
        </StaggeredContainer>

        {/* Assets */}
        {report.images && report.images.length > 0 && (
          <StaggeredContainer delay={300} animationType="fadeInUp" duration={400}>
            <div className="mb-6">
              <AssetGrid 
                assets={report.images.map(img => ({ file_path: img.file_path, file_type: img.file_type }))}
                onPreview={setPreviewAsset}
              />
            </div>
          </StaggeredContainer>
        )}

        {canRespond && (
          <StaggeredContainer delay={340} animationType="fadeInUp" duration={400}>
            <div className="mb-6">
              <div className="bg-gradient-to-br from-indigo-50 to-white rounded-xl shadow-lg border border-indigo-200 p-6 space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg shadow-sm">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">Balas Keluhan</h3>
                      <p className="text-sm text-gray-600">
                        Sampaikan tindak lanjut atau ubah status penanganan keluhan ini.
                      </p>
                    </div>
                  </div>
                  <MessageActionDialog
                    triggerLabel="Kirim Balasan"
                    triggerIcon={
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m7 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    }
                    triggerVariant="primary"
                    triggerSize="md"
                    triggerFullWidth={false}
                    triggerClassName="whitespace-nowrap"
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

                <div className="rounded-lg border border-indigo-100 bg-white/70 px-4 py-3 text-sm text-indigo-700 shadow-sm">
                  Informasikan perkembangan penanganan keluhan agar pelapor dapat memantau prosesnya.
                </div>
              </div>
            </div>
          </StaggeredContainer>
        )}

        {report.responses && report.responses.length > 0 && (
          <StaggeredContainer delay={360} animationType="fadeInUp" duration={400}>
            <div className="mb-6">
              <MessageResponseTimeline
                responses={report.responses}
                status={report.status}
                statusResolver={responseStatusResolver}
                heading="Balasan"
                onPreviewAsset={(asset) => setPreviewAsset(asset)}
              />
            </div>
          </StaggeredContainer>
        )}

        {/* Comments Section */}
        <StaggeredContainer delay={400} animationType="fadeInUp" duration={400}>
          <div className="mb-6">
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-sm">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">Tulis Komentar</h3>
                    <p className="text-sm text-gray-600">Diskusikan perkembangan keluhan secara terbuka.</p>
                  </div>
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
                  triggerClassName="whitespace-nowrap"
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
            </div>
          </div>
        </StaggeredContainer>

        <StaggeredContainer delay={450} animationType="fadeInUp" duration={400}>
          <div className="mb-6">
            <CommentList 
              comments={comments?.data || report.comments || []} 
              onReply={handleReply}
              pagination={comments}
            />
          </div>
        </StaggeredContainer>

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