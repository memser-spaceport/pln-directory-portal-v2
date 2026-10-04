'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';

import { useMyAiAppFeedbackList } from '@/services/ai-app-feedback/hooks/useMyAiAppFeedbackList';

import { ArrowBackIcon } from '@/components/icons';
import { SortDropdown } from '@/components/common/filters/SortDropdown';

import type { FeedbackPriorityFilterValue, FeedbackReportKindFilterValue, FeedbackStatusFilterValue } from './types';
import type { FeedbackImage } from './utils/splitFeedbackMedia';

import {
  ALL_TAB,
  ALL_FEEDBACK_STATUSES,
  ALL_FEEDBACK_PRIORITIES,
  ALL_FEEDBACK_REPORT_KINDS,
  FEEDBACK_STATUS_FILTER_OPTIONS,
  FEEDBACK_PRIORITY_FILTER_OPTIONS,
  FEEDBACK_REPORT_KIND_FILTER_OPTIONS,
} from './constants';

import { FeedbackTabs } from './components/FeedbackTabs';
import { FeedbackTable } from './components/FeedbackTable';
import { FeedbackImageLightbox } from './components/FeedbackImageLightbox';

import s from './AiAppFeedbackPage.module.scss';

export function MyAiAppFeedbackPage() {
  const { feedback, isLoading, isError } = useMyAiAppFeedbackList();
  const [activeTab, setActiveTab] = useState(ALL_TAB);
  const [statusFilter, setStatusFilter] = useState<FeedbackStatusFilterValue>(ALL_FEEDBACK_STATUSES);
  const [reportKindFilter, setReportKindFilter] = useState<FeedbackReportKindFilterValue>(ALL_FEEDBACK_REPORT_KINDS);
  const [priorityFilter, setPriorityFilter] = useState<FeedbackPriorityFilterValue>(ALL_FEEDBACK_PRIORITIES);
  const [lightbox, setLightbox] = useState<FeedbackImage | null>(null);

  const appNames = useMemo(() => Array.from(new Set(feedback.map((row) => row.appName))).sort(), [feedback]);

  const isFiltered =
    statusFilter !== ALL_FEEDBACK_STATUSES ||
    reportKindFilter !== ALL_FEEDBACK_REPORT_KINDS ||
    priorityFilter !== ALL_FEEDBACK_PRIORITIES;

  const filteredRows = useMemo(
    () =>
      feedback.filter(
        (row) =>
          (statusFilter === ALL_FEEDBACK_STATUSES || row.status === statusFilter) &&
          (reportKindFilter === ALL_FEEDBACK_REPORT_KINDS || row.reportKind === reportKindFilter) &&
          (priorityFilter === ALL_FEEDBACK_PRIORITIES || row.priority === priorityFilter),
      ),
    [feedback, statusFilter, reportKindFilter, priorityFilter],
  );

  const tabs = useMemo(
    () => [
      { name: ALL_TAB, count: filteredRows.length },
      ...appNames.map((name) => ({ name, count: filteredRows.filter((row) => row.appName === name).length })),
    ],
    [filteredRows, appNames],
  );

  const visibleRows = activeTab === ALL_TAB ? filteredRows : filteredRows.filter((row) => row.appName === activeTab);

  return (
    <div className={s.pageFrame}>
      <div className={s.content}>
        <Link href="/pl-infra/ai-apps" className={s.backLink}>
          <ArrowBackIcon width={16} height={16} />
          Back to all
        </Link>

        <div className={s.titleBlock}>
          <h1 className={s.title}>Your feedback</h1>
          <p className={s.subtitle}>The feedback and comments you sent, and whether each has been acted on.</p>
        </div>

        {isLoading ? (
          <div className={s.state}>Loading feedback…</div>
        ) : isError ? (
          <div className={s.state}>Unable to load feedback. Please try again later.</div>
        ) : feedback.length === 0 ? (
          <div className={s.state}>You haven’t sent any feedback yet.</div>
        ) : (
          <>
            <div className={s.tabsRow}>
              <FeedbackTabs tabs={tabs} activeTab={activeTab} onTabClick={setActiveTab} />
              <div className={s.tabsActions}>
                <SortDropdown
                  sortByLabel="Status:"
                  options={FEEDBACK_STATUS_FILTER_OPTIONS}
                  currentSort={statusFilter}
                  onSortChange={(value) => setStatusFilter(value as FeedbackStatusFilterValue)}
                />
                <SortDropdown
                  sortByLabel="Kind:"
                  options={FEEDBACK_REPORT_KIND_FILTER_OPTIONS}
                  currentSort={reportKindFilter}
                  onSortChange={(value) => setReportKindFilter(value as FeedbackReportKindFilterValue)}
                />
                <SortDropdown
                  sortByLabel="Priority:"
                  options={FEEDBACK_PRIORITY_FILTER_OPTIONS}
                  currentSort={priorityFilter}
                  onSortChange={(value) => setPriorityFilter(value as FeedbackPriorityFilterValue)}
                />
              </div>
            </div>

            {visibleRows.length === 0 ? (
              <div className={s.state}>
                {isFiltered ? 'No feedback matches the selected filters.' : 'No feedback for this app yet.'}
              </div>
            ) : (
              <FeedbackTable rows={visibleRows} onImageClick={setLightbox} />
            )}
          </>
        )}
      </div>
      <FeedbackImageLightbox image={lightbox} onClose={() => setLightbox(null)} />
    </div>
  );
}
