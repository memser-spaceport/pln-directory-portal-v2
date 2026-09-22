'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { clsx } from 'clsx';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Button } from '@/components/common/Button/Button';
import { Modal } from '@/components/common/Modal/Modal';
import { ArrowBackIcon } from '@/components/icons';
import { useAiAppFeedbackList } from '@/services/ai-app-feedback/hooks/useAiAppFeedbackList';
import { useAiAppFeedbackReviewAccess } from '@/services/ai-app-feedback/hooks/useAiAppFeedbackReviewAccess';
import { useUpdateAiAppFeedbackStatus } from '@/services/ai-app-feedback/hooks/useUpdateAiAppFeedbackStatus';
import type { AiAppFeedbackStatus } from '@/services/ai-app-feedback/constants';
import { useAiAppsAnalytics } from '@/analytics/ai-apps.analytics';
import { QuillContent } from '@/components/ui/QuillContent/QuillContent';
import { sanitizeAiAppFeedbackHtml } from '@/utils/html';
import { FeedbackStatusSelector } from './FeedbackStatusSelector/FeedbackStatusSelector';
import { exportAiAppFeedbackCsv } from './utils/exportAiAppFeedbackCsv';
import { getAvatarColor } from './utils/getAvatarColor';
import { splitFeedbackMedia, type FeedbackImage } from './utils/splitFeedbackMedia';
import { AnnotationCanvas } from '../components/screenshot-feedback/AnnotationCanvas';

import s from './AiAppFeedbackPage.module.scss';

const ALL_TAB = 'All apps';

function looksLikeHtml(text: string): boolean {
  return /^\s*</.test(text);
}

/**
 * The message, then its screenshots as a uniform strip.
 *
 * Screenshots arrive as `<p><img></p>` siblings inside the body, so left in
 * place they stack at whatever size each capture happens to be — one tall phone
 * screenshot makes a table row hundreds of pixels deep. They are lifted out and
 * given identical tiles instead; the full image stays one click away.
 */
function FeedbackBody({ text, onImageClick }: { text: string; onImageClick: (image: FeedbackImage) => void }) {
  if (!looksLikeHtml(text)) {
    return <div className={s.messageText}>{text}</div>;
  }

  const { textHtml, images } = splitFeedbackMedia(sanitizeAiAppFeedbackHtml(text));

  return (
    <div className={s.messageBlock}>
      {/* Image-only feedback is a supported submission, and an empty ql-editor
          block for it would add padding under nothing. */}
      {textHtml.trim() && <QuillContent html={textHtml} className={s.richMessage} />}
      {images.length > 0 && (
        <ul className={s.shotStrip}>
          {images.map((image, index) => (
            <li key={`${image.src}-${index}`}>
              <button
                type="button"
                className={clsx(s.shotTile, image.hasVisibleAnnotations && s.shotTileAnnotated)}
                title={image.hasVisibleAnnotations ? 'View annotations' : undefined}
                onClick={() => onImageClick(image)}
              >
                <img src={image.src} alt={image.alt || `Screenshot ${index + 1}`} />
                {image.hasVisibleAnnotations && <span className={s.shotBadge}>View annotations</span>}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

const DownloadIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M8 1.5V10.5M8 10.5L4.5 7M8 10.5L11.5 7M2.5 13.5H13.5"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export function AiAppFeedbackPage() {
  const { feedback, isLoading, isError } = useAiAppFeedbackList();
  const { isDirectoryAdmin } = useAiAppFeedbackReviewAccess();
  const updateStatus = useUpdateAiAppFeedbackStatus();
  const analytics = useAiAppsAnalytics();
  const hasTrackedView = useRef(false);
  const [activeTab, setActiveTab] = useState(ALL_TAB);
  const [lightbox, setLightbox] = useState<FeedbackImage | null>(null);

  useEffect(() => {
    if (hasTrackedView.current) return;
    hasTrackedView.current = true;
    analytics.onFeedbackReviewViewed();
  }, [analytics]);

  const appNames = useMemo(() => Array.from(new Set(feedback.map((row) => row.appName))).sort(), [feedback]);

  const tabs = useMemo(
    () => [
      { name: ALL_TAB, count: feedback.length },
      ...appNames.map((name) => ({ name, count: feedback.filter((row) => row.appName === name).length })),
    ],
    [feedback, appNames],
  );

  const visibleRows = activeTab === ALL_TAB ? feedback : feedback.filter((row) => row.appName === activeTab);

  const handleTabClick = (tab: string) => {
    setActiveTab(tab);
    analytics.onFeedbackTabFiltered(tab);
  };

  const handleExport = () => {
    const slug = activeTab.toLowerCase().replace(/\s+/g, '-');
    exportAiAppFeedbackCsv(visibleRows, `ai-app-feedback-${slug}.csv`);
    analytics.onFeedbackExported(visibleRows.length);
  };

  const handleStatusSelect = (row: (typeof visibleRows)[number], status: AiAppFeedbackStatus) => {
    if (status === row.status) return;
    const from = row.status;
    updateStatus.mutate(
      { appUid: row.appUid, feedbackUid: row.uid, status },
      {
        onSuccess: () => analytics.onFeedbackStatusChanged({ appUid: row.appUid, from, to: status }),
      },
    );
  };

  return (
    <div className={s.pageFrame}>
      <div className={s.content}>
        <Link href="/pl-infra/ai-apps" className={s.backLink}>
          <ArrowBackIcon width={16} height={16} />
          Back to all
        </Link>

        <div className={s.titleBlock}>
          <h1 className={s.title}>{isDirectoryAdmin ? 'All app feedback' : 'Feedback on your apps'}</h1>
          <p className={s.subtitle}>
            {isDirectoryAdmin
              ? 'Every app across the directory.'
              : 'Only the apps you build — not every app on the page.'}
          </p>
        </div>

        {isLoading ? (
          <div className={s.state}>Loading feedback…</div>
        ) : isError ? (
          <div className={s.state}>Unable to load feedback. Please try again later.</div>
        ) : feedback.length === 0 ? (
          <div className={s.state}>No feedback has been submitted yet.</div>
        ) : (
          <>
            <div className={s.tabsRow}>
              <div className={s.tabs}>
                {tabs.map((tab) => (
                  <button
                    key={tab.name}
                    type="button"
                    className={clsx(s.tab, { [s.tabActive]: tab.name === activeTab })}
                    onClick={() => handleTabClick(tab.name)}
                  >
                    {tab.name}
                    <span className={s.tabCount}>{tab.count}</span>
                    {tab.name === activeTab && (
                      <motion.span
                        layoutId="aiAppFeedbackActiveTab"
                        className={s.activeIndicator}
                        transition={{ type: 'spring', stiffness: 500, damping: 40 }}
                      />
                    )}
                  </button>
                ))}
              </div>
              <Button
                size="s"
                style="fill"
                variant="primary"
                onClick={handleExport}
                disabled={visibleRows.length === 0}
                className={s.exportButton}
              >
                <DownloadIcon />
                Export CSV
              </Button>
            </div>

            {visibleRows.length === 0 ? (
              <div className={s.state}>No feedback for this app yet.</div>
            ) : (
              <div className={s.tableWrapper}>
                <table className={s.table}>
                  <thead>
                    <tr>
                      <th className={s.appCol}>App</th>
                      <th>Feedback</th>
                      <th className={s.fromCol}>From</th>
                      <th className={s.statusCol}>Status</th>
                      <th className={s.dateCol}>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleRows.map((row) => {
                      const submitterName = row.member?.name ?? 'Unknown member';
                      return (
                        <tr key={row.uid}>
                          <td className={s.appNameCell} title={row.appName}>
                            {row.appName}
                          </td>
                          <td title={looksLikeHtml(row.text) ? undefined : row.text}>
                            <FeedbackBody text={row.text} onImageClick={setLightbox} />
                          </td>
                          <td>
                            <div className={s.submitter}>
                              <span className={s.avatar} style={{ background: getAvatarColor(submitterName) }}>
                                {submitterName.charAt(0).toUpperCase()}
                              </span>
                              <span className={s.submitterName} title={submitterName}>
                                {submitterName}
                              </span>
                            </div>
                          </td>
                          <td>
                            <FeedbackStatusSelector
                              status={row.status}
                              isPending={updateStatus.isPending && updateStatus.variables?.feedbackUid === row.uid}
                              onStatusSelect={(status) => handleStatusSelect(row, status)}
                            />
                          </td>
                          <td className={s.dateCell}>
                            {new Date(row.createdAt).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
      <Modal
        isOpen={Boolean(lightbox)}
        onClose={() => setLightbox(null)}
        lockScroll
        overlayClassname={s.lightboxOverlay}
        className={s.lightboxContent}
        ariaLabelledBy="ai-app-feedback-lightbox-title"
      >
        <h2 id="ai-app-feedback-lightbox-title" className={s.visuallyHidden}>
          Full size image
        </h2>
        {lightbox?.annotations ? (
          <AnnotationCanvas
            className={s.lightboxCanvas}
            imageSrc={lightbox.src}
            annotations={lightbox.annotations}
            readOnly
          />
        ) : (
          lightbox && <img src={lightbox.src} alt={lightbox.alt} />
        )}
      </Modal>
    </div>
  );
}
