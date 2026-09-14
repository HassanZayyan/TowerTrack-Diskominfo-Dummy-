import React from 'react';
import AssetGrid from '@/Components/MyMessages/AssetGrid';
import { formatDateTime as formatDateTimeHelper } from '@/utils/dateHelpers';

export type MessageResponseAsset = {
  file_path: string;
  file_type?: string;
};

export type MessageResponseItem = {
  id: number;
  message?: string | null;
  created_at: string;
  sender_type?: 'staff' | 'reporter' | 'guest';
  sender_name?: string | null;
  sender_email?: string | null;
  sender_phone?: string | null;
  user?: { id: number; name: string } | null;
  assets?: MessageResponseAsset[];
};

type StatusStyle = {
  label: string;
  bg: string;
  text: string;
};

interface MessageResponseTimelineProps {
  responses?: MessageResponseItem[] | null;
  status?: string | null;
  statusResolver?: (status: string | null | undefined) => StatusStyle;
  heading?: string | null;
  /** @deprecated Ignored. The timeline is token-driven now. */
  accentColorClass?: string;
  orientation?: 'vertical' | 'horizontal';
  onPreviewAsset?: (asset: MessageResponseAsset) => void;
}

const defaultStatusResolver = (): StatusStyle => ({
  label: 'Sedang Diproses',
  bg: '#E5E7EB',
  text: '#1F2937',
});

const senderTypeLabel: Record<string, string> = {
  staff: 'Admin',
  reporter: 'Pelapor',
  guest: 'Tamu',
};

export default function MessageResponseTimeline({
  responses = [],
  status,
  statusResolver = defaultStatusResolver,
  heading = 'Balasan',
  orientation = 'vertical',
  onPreviewAsset,
}: MessageResponseTimelineProps) {
  if (!responses || responses.length === 0) {
    return null;
  }

  const statusConfig = statusResolver(status);

  // Timeline marks. The latest entry is the brand; earlier ones recede to a
  // neutral, so recency is carried by weight rather than by a second hue.
  const getTimelineDotClass = (isLast: boolean): string =>
    isLast ? 'bg-primary' : 'bg-border-strong';

  const renderDisplayName = (response: MessageResponseItem) => {
    if (response.user?.name) {
      return response.user.name;
    }

    if (response.sender_name) {
      return response.sender_name;
    }

    if (response.sender_type && senderTypeLabel[response.sender_type]) {
      return senderTypeLabel[response.sender_type];
    }

    return 'Pengirim';
  };

  const renderSenderBadge = (response: MessageResponseItem) => {
    const type = response.sender_type;
    if (!type) {
      return null;
    }

    const label = senderTypeLabel[type] ?? type;

    const badgeColors: Record<string, { bg: string; text: string }> = {
      staff: { bg: '#FED7AA', text: '#9A3412' },
      reporter: { bg: '#FEF9C3', text: '#854D0E' },
      guest: { bg: '#FEF3C7', text: '#92400E' },
    };

    const color = badgeColors[type] ?? { bg: '#E5E7EB', text: '#1F2937' };

    return (
      <span
        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border"
        style={{
          backgroundColor: color.bg,
          borderColor: color.bg,
          color: color.text,
        }}
      >
        {label}
      </span>
    );
  };

  const formatDateTime = (value: string) => {
    return formatDateTimeHelper(value);
  };

  const renderVerticalTimeline = () => (
    <div className="bg-white rounded-xl p-5 border border-border shadow-sm">
      {heading !== null && (
        <div className="flex items-center gap-2 mb-4">
          <div className="rounded-md bg-primary p-2 text-primary-foreground">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          {heading && <h5 className="text-sm font-bold text-foreground">{heading}</h5>}
        </div>
      )}

      <div className="relative space-y-4">
        {/* The spine. A flat hairline rather than a three-stop gradient — the
            gradient was invisible at 2px wide anyway. */}
        <div className="absolute left-4 top-6 bottom-6 w-0.5 bg-border" aria-hidden="true"></div>

        {responses.map((response, index) => {
          const isLast = index === responses.length - 1;

          return (
            <div key={response.id} className="relative pl-12">
              <div
                className={`absolute left-2.5 top-3 w-3 h-3 rounded-full ${getTimelineDotClass(isLast)} z-10 ring-4 ring-card`}
              ></div>

              <div className={`${'bg-card'} rounded-lg p-4 border ${'border-border'} shadow-sm`}>
                <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                  <div className="flex items-start gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <div className="text-sm font-semibold text-foreground">{renderDisplayName(response)}</div>
                        {renderSenderBadge(response)}
                      </div>
                      <div className="text-xs text-muted-foreground">{formatDateTime(response.created_at)}</div>
                    </div>
                  </div>

                  {isLast && statusConfig && (
                    <span
                      className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border"
                      style={{
                        backgroundColor: statusConfig.bg,
                        borderColor: statusConfig.bg,
                        color: statusConfig.text,
                      }}
                    >
                      {statusConfig.label}
                    </span>
                  )}
                </div>

                {response.message && (
                  <div className={`text-foreground leading-relaxed bg-white/60 backdrop-blur-sm rounded-lg p-3 border ${'border-border'} whitespace-pre-wrap`}>
                    {response.message}
                  </div>
                )}

                {response.assets && response.assets.length > 0 && (
                  <div className="mt-4">
                    <AssetGrid
                      assets={response.assets.map(
                        (asset): { file_path: string; file_type?: string } => ({
                          file_path: asset.file_path,
                          file_type: asset.file_type ?? 'image',
                        })
                      )}
                      onPreview={
                        onPreviewAsset
                          ? (asset) =>
                              onPreviewAsset({
                                file_path: asset.file_path,
                                file_type: asset.file_type ?? 'image',
                              })
                          : undefined
                      }
                    />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderHorizontalTimeline = () => (
    <div className="bg-white rounded-xl p-5 border border-border shadow-sm">
      {heading !== null && (
        <div className="flex items-center gap-2 mb-4">
          <div className="rounded-md bg-primary p-2 text-primary-foreground">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          {heading && <h5 className="text-sm font-bold text-foreground">{heading}</h5>}
        </div>
      )}

      <div className="overflow-x-auto pb-2">
        <div className="flex gap-4 min-w-max">
          {responses.map((response, index) => {
            const isLast = index === responses.length - 1;

            return (
              <div
                key={response.id}
                className={`min-w-[260px] max-w-xs flex-shrink-0 ${'bg-card'} rounded-lg border ${'border-border'} shadow-sm p-4`}
              >
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-start gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <div className="text-sm font-semibold text-foreground">{renderDisplayName(response)}</div>
                        {renderSenderBadge(response)}
                      </div>
                      <div className="text-xs text-muted-foreground">{formatDateTime(response.created_at)}</div>
                    </div>
                  </div>
                  {isLast && statusConfig && (
                    <span
                      className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold border"
                      style={{
                        backgroundColor: statusConfig.bg,
                        borderColor: statusConfig.bg,
                        color: statusConfig.text,
                      }}
                    >
                      {statusConfig.label}
                    </span>
                  )}
                </div>

                {response.message && (
                  <div className={`text-sm text-foreground bg-white/70 rounded-lg border ${'border-border'} p-3 whitespace-pre-wrap leading-relaxed mb-3`}>
                    {response.message}
                  </div>
                )}

                {response.assets && response.assets.length > 0 && (
                  <AssetGrid
                    assets={response.assets.map(
                      (asset): { file_path: string; file_type?: string } => ({
                        file_path: asset.file_path,
                        file_type: asset.file_type ?? 'image',
                      })
                    )}
                    onPreview={
                      onPreviewAsset
                        ? (asset) =>
                            onPreviewAsset({
                              file_path: asset.file_path,
                              file_type: asset.file_type ?? 'image',
                            })
                        : undefined
                    }
                    className="!grid-cols-1"
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  return orientation === 'horizontal' ? renderHorizontalTimeline() : renderVerticalTimeline();
}


