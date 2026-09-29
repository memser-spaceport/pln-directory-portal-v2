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
import { SortDropdown } from '@/components/common/filters/SortDropdown';

import type { FeedbackStatusFilterValue } from './types';
import type { FeedbackImage } from './utils/splitFeedbackMedia';

import { ALL_TAB, ALL_FEEDBACK_STATUSES, FEEDBACK_STATUS_FILTER_OPTIONS } from './constants';

import { exportAiAppFeedbackCsv } from './utils/exportAiAppFeedbackCsv';
import { buildFeedbackCsvFilename } from './utils/buildFeedbackCsvFilename';

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
  const [statusFilter, setStatusFilter] = useState<FeedbackStatusFilterValue>(ALL_FEEDBACK_STATUSES);
  const [lightbox, setLightbox] = useState<FeedbackImage | null>(null);

  useEffect(() => {
    if (hasTrackedView.current) return;
    hasTrackedView.current = true;
    analytics.onFeedbackReviewViewed();
  }, [analytics]);

  const appNames = useMemo(() => Array.from(new Set(feedback.map((row) => row.appName))).sort(), [feedback]);

  const statusRows = useMemo(
    () => (statusFilter === ALL_FEEDBACK_STATUSES ? feedback : feedback.filter((row) => row.status === statusFilter)),
    [feedback, statusFilter],
  );

  const tabs = useMemo(
    () => [
      { name: ALL_TAB, count: statusRows.length },
      ...appNames.map((name) => ({ name, count: statusRows.filter((row) => row.appName === name).length })),
    ],
    [statusRows, appNames],
  );

  const visibleRows = activeTab === ALL_TAB ? statusRows : statusRows.filter((row) => row.appName === activeTab);

  const handleTabClick = (tab: string) => {
    setActiveTab(tab);
    analytics.onFeedbackTabFiltered(tab);
  };

  const handleExport = () => {
    exportAiAppFeedbackCsv(visibleRows, buildFeedbackCsvFilename(activeTab, statusFilter));
    analytics.onFeedbackExported(visibleRows.length, statusFilter);
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
              <div className={s.tabsActions}>
                <SortDropdown
                  sortByLabel="Status:"
                  options={FEEDBACK_STATUS_FILTER_OPTIONS}
                  currentSort={statusFilter}
                  onSortChange={(value) => {
                    const next = value as FeedbackStatusFilterValue;
                    if (next === statusFilter) return;
                    setStatusFilter(next);
                    analytics.onFeedbackStatusFiltered(next);
                  }}
                />
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
            </div>

            {visibleRows.length === 0 ? (
              <div className={s.state}>
                {statusFilter === ALL_FEEDBACK_STATUSES
                  ? 'No feedback for this app yet.'
                  : 'No feedback matches the selected filters.'}
              </div>
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
