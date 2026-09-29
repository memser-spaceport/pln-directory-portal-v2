'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';

import type { AiAppFeedbackStatus } from '@/services/ai-app-feedback/constants';
import type { AiAppFeedbackRow } from '@/services/ai-app-feedback/ai-app-feedback.service';

import { useAiAppsAnalytics } from '@/analytics/ai-apps.analytics';
import { useAiAppFeedbackList } from '@/services/ai-app-feedback/hooks/useAiAppFeedbackList';
import { useAiAppFeedbackReviewAccess } from '@/services/ai-app-feedback/hooks/useAiAppFeedbackReviewAccess';
import { useUpdateAiAppFeedbackStatus } from '@/services/ai-app-feedback/hooks/useUpdateAiAppFeedbackStatus';

import { ArrowBackIcon } from '@/components/icons';
import { Button } from '@/components/common/Button/Button';

import type { FeedbackImage } from './utils/splitFeedbackMedia';

import { ALL_TAB } from './constants';

import { exportAiAppFeedbackCsv } from './utils/exportAiAppFeedbackCsv';

import { FeedbackTabs } from './components/FeedbackTabs';
import { DownloadIcon } from './components/DownloadIcon';
import { FeedbackTable } from './components/FeedbackTable';
import { FeedbackImageLightbox } from './components/FeedbackImageLightbox';

import s from './AiAppFeedbackPage.module.scss';

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

  const handleStatusSelect = (row: AiAppFeedbackRow, status: AiAppFeedbackStatus) => {
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
              <FeedbackTabs tabs={tabs} activeTab={activeTab} onTabClick={handleTabClick} />
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
              <FeedbackTable
                rows={visibleRows}
                pendingFeedbackUid={updateStatus.isPending ? updateStatus.variables?.feedbackUid : undefined}
                onStatusSelect={handleStatusSelect}
                onImageClick={setLightbox}
              />
            )}
          </>
        )}
      </div>
      <FeedbackImageLightbox image={lightbox} onClose={() => setLightbox(null)} />
    </div>
  );
}
