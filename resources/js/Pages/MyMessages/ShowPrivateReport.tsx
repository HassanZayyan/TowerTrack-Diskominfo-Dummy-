import React, { useState } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import MainLayout from '@/Layouts/MainLayout';
import AnimatedButton from '@/Components/AnimatedButton';
import StaggeredContainer from '@/Components/StaggeredContainer';
import AssetGrid from '@/Components/MyMessages/AssetGrid';
import MessageResponseTimeline, { MessageResponseItem } from '@/Components/MyMessages/MessageResponseTimeline';
import MessageResponseForm from '@/Components/MyMessages/MessageResponseForm';
import MessageActionDialog from '@/Components/MyMessages/MessageActionDialog';
import LocationCard from '@/Components/MyMessages/LocationCard';
import { getStatusColor } from '@/utils/statusHelpers';
import { formatDateWithTime } from '@/utils/dateHelpers';
import type { Report } from '@/types/messages';

type ShowPrivateReportProps = {
  report: Report;
  statuses?: Array<{ id: number; name: string; slug: string; color: string; icon: string }>;
};

export default function ShowPrivateReport({ report, statuses = [] }: ShowPrivateReportProps) {
  const { auth } = usePage().props as any;
  const [previewAsset, setPreviewAsset] = useState<{ file_path: string; file_type?: string } | null>(null);
  const [isResponseModalOpen, setResponseModalOpen] = useState(false);

  const authUser = auth?.user;
  const isAuthenticated = Boolean(authUser);

  const handleResponseSuccess = React.useCallback(() => {
    router.reload({ only: ['report'] });
  }, [router]);
  const staffRoles = ['admin', 'operator', 'tower_owner', 'staff'];
  const normalizedRole =
    typeof authUser?.role === 'string' ? authUser.role.toLowerCase() : undefined;
  const isStaff = isAuthenticated && normalizedRole ? staffRoles.includes(normalizedRole) : false;
  const isOwner = isAuthenticated && report.user_id && Number(report.user_id) === Number(authUser.id);
  const canRespond = isStaff || isOwner;

  const responseStatusResolver = (statusValue: string | null | undefined) => {
    return getStatusColor(statusValue ?? '');
  };

  const backUrl = '/my-messages/my-posts';

  return (
    <MainLayout title={`Detail Keluhan Pribadi #${report.id}`} currentPage="/my-messages">
      <Head title={`Detail Keluhan Pribadi #${report.id}`} />
      
      <div className="p-4 sm:p-6">
        {/* Back Button */}
        <StaggeredContainer delay={0} animationType="fadeInLeft" duration={400}>
          <div className="mb-6">
            <AnimatedButton
              variant="outline"
              size="md"
              animation="scale"
              onClick={() => router.visit(backUrl)}
              icon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                </svg>
              }
              className="border-amber-500 text-amber-700 hover:bg-amber-500 hover:text-white"
            >
              Kembali ke Pesan Pribadi
            </AnimatedButton>
          </div>
        </StaggeredContainer>

        <StaggeredContainer delay={100} animationType="fadeInUp" duration={500}>
          <div className="relative rounded-xl shadow-lg mb-8 px-6 sm:px-8 py-6 overflow-hidden bg-gradient-to-br from-amber-50 via-white to-amber-50 border border-amber-100">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-gradient-to-br from-amber-500 to-amber-600 rounded-lg shadow-md">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-amber-700 to-amber-600 bg-clip-text text-transparent">
                Detail Keluhan Pribadi #{report.id}
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
            <LocationCard
              tower={report.tower}
              reportable={report.reportable}
              reportableType={report.reportable_type}
            />
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
              <div className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-xl shadow-lg border border-amber-200 p-6 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                  <div className="flex items-center gap-2 flex-1">
                    <div className="p-2 bg-gradient-to-br from-amber-500 to-amber-600 rounded-lg shadow-sm flex-shrink-0">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                      </svg>
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-lg font-bold text-gray-900">Balas Keluhan</h3>
                      <p className="text-sm text-gray-600">
                        Kirim update penanganan secara pribadi kepada pelapor keluhan ini.
                      </p>
                    </div>
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
                      triggerClassName="w-full sm:w-auto whitespace-nowrap"
                    title="Kirim Balasan"
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
                        defaultSenderName={authUser?.name ?? report.reporter_name ?? ''}
                        defaultEmail={authUser?.email ?? report.email ?? ''}
                        defaultPhone={report.reporter_phone ?? ''}
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

                <div className="rounded-lg border border-amber-100 bg-white/70 px-4 py-3 text-sm text-amber-700 shadow-sm">
                  Balasan bersifat rahasia dan hanya dapat dilihat melalui halaman pelacakan pribadi pelapor.
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
                heading="Riwayat Balasan"
                accentColorClass="from-amber-500 to-amber-600"
                onPreviewAsset={(asset) => setPreviewAsset(asset)}
              />
            </div>
          </StaggeredContainer>
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

