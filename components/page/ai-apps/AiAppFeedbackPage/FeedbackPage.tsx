'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';

import type { AiAppFeedbackStatus } from '@/services/ai-app-feedback/constants';
import type { AiAppFeedbackRow } from '@/services/ai-app-feedback/ai-app-feedback.service';

import { useAiAppsAnalytics } from '@/analytics/ai-apps.analytics';
import { useCurrentUserStore } from '@/services/auth/store';
import { useAiApps } from '@/services/ai-apps/hooks/useAiApps';
import { useAiAppFeedbackList } from '@/services/ai-app-feedback/hooks/useAiAppFeedbackList';
import { useMyAiAppFeedbackList } from '@/services/ai-app-feedback/hooks/useMyAiAppFeedbackList';
import { useAiAppFeedbackReviewAccess } from '@/services/ai-app-feedback/hooks/useAiAppFeedbackReviewAccess';
import { useUpdateAiAppFeedbackStatus } from '@/services/ai-app-feedback/hooks/useUpdateAiAppFeedbackStatus';

import { ArrowBackIcon } from '@/components/icons';
import { Button } from '@/components/common/Button/Button';
import { SortDropdown, type SortOption } from '@/components/common/filters/SortDropdown';

import type { FeedbackPriorityFilterValue, FeedbackReportKindFilterValue, FeedbackStatusFilterValue } from './types';
import type { FeedbackImage } from './utils/splitFeedbackMedia';

import {
  ALL_APPS,
  ALL_TAB,
  ALL_FEEDBACK_STATUSES,
  ALL_FEEDBACK_PRIORITIES,
  ALL_FEEDBACK_REPORT_KINDS,
  FEEDBACK_STATUS_FILTER_OPTIONS,
  FEEDBACK_PRIORITY_FILTER_OPTIONS,
  FEEDBACK_REPORT_KIND_FILTER_OPTIONS,
} from './constants';

import { exportAiAppFeedbackCsv } from './utils/exportAiAppFeedbackCsv';
import { buildFeedbackCsvFilename } from './utils/buildFeedbackCsvFilename';

import { FeedbackTabs } from './components/FeedbackTabs';
import { DownloadIcon } from './components/DownloadIcon';
import { FeedbackTable } from './components/FeedbackTable';
import { FeedbackImageLightbox } from './components/FeedbackImageLightbox';

import s from './AiAppFeedbackPage.module.scss';

/** Received: feedback others gave on the viewer's apps. Given ("mine"): what the viewer sent. */
export type FeedbackView = 'received' | 'mine';

export const FEEDBACK_PAGE_HREF: Record<FeedbackView, string> = {
  received: '/pl-infra/ai-apps/feedback',
  mine: '/pl-infra/ai-apps/feedback/mine',
};

const TAB_LABEL: Record<FeedbackView, string> = {
  received: 'Received',
  mine: 'Given',
};

const EMPTY_COPY: Record<FeedbackView, string> = {
  received: 'No feedback on your apps yet.',
  mine: 'You haven’t sent any feedback yet.',
};

const ALL_APPS_LABEL: Record<FeedbackView, string> = {
  received: 'All my apps',
  mine: ALL_TAB,
};

function subtitleFor(view: FeedbackView, isDirectoryAdmin: boolean) {
  if (view === 'mine') return 'Feedback and comments you gave on apps, and whether each has been acted on.';
  return isDirectoryAdmin
    ? 'Feedback on every app across the directory. Set a status so people know what happened.'
    : 'Feedback others gave on the apps you build. Set a status so they know what happened.';
}

/**
 * The Feedback page (LAB-2767, prototype ai-apps-feedback-drawer): what the
 * viewer received on the apps they build and what they gave, as two tabs of
 * one page. Each tab keeps its own route (`/pl-infra/ai-apps/feedback` is
 * Received, `/feedback/mine` is Given), so links and the access guard stay as
 * they were. Only Directory admins and app creators can review, so only they
 * see the tabs; everyone else sees the one list they have, Given.
 *
 * The per-app tabs of the two earlier pages became the App filter beside the
 * Status, Kind and Priority filters. On Received it offers every app the
 * viewer manages, quiet ones included; on Given, the apps in the rows.
 */
export function FeedbackPage({ view }: { view: FeedbackView }) {
  const router = useRouter();
  const received = useAiAppFeedbackList();
  const mine = useMyAiAppFeedbackList();
  const { canReview, isDirectoryAdmin } = useAiAppFeedbackReviewAccess();
  const { apps } = useAiApps();
  const { currentUser } = useCurrentUserStore();
  const updateStatus = useUpdateAiAppFeedbackStatus();
  const analytics = useAiAppsAnalytics();
  const hasTrackedView = useRef(false);
  const [appFilter, setAppFilter] = useState(ALL_APPS);
  const [statusFilter, setStatusFilter] = useState<FeedbackStatusFilterValue>(ALL_FEEDBACK_STATUSES);
  const [reportKindFilter, setReportKindFilter] = useState<FeedbackReportKindFilterValue>(ALL_FEEDBACK_REPORT_KINDS);
  const [priorityFilter, setPriorityFilter] = useState<FeedbackPriorityFilterValue>(ALL_FEEDBACK_PRIORITIES);
  const [lightbox, setLightbox] = useState<FeedbackImage | null>(null);

  const isReceived = view === 'received';
  /* The Received route is behind the review guard, so reaching it means the viewer can review. */
  const showTabs = isReceived || canReview;
  const { feedback, isLoading, isError } = isReceived ? received : mine;

  useEffect(() => {
    if (!isReceived || hasTrackedView.current) return;
    hasTrackedView.current = true;
    analytics.onFeedbackReviewViewed();
  }, [isReceived, analytics]);

  const managedAppNames = useMemo(
    () =>
      isReceived
        ? apps
            .filter((app) => app.canManage ?? (!!currentUser?.uid && app.member?.uid === currentUser.uid))
            .map((app) => app.name)
        : [],
    [isReceived, apps, currentUser?.uid],
  );

  const appNames = useMemo(
    () => Array.from(new Set([...managedAppNames, ...feedback.map((row) => row.appName)])).sort(),
    [managedAppNames, feedback],
  );

  /* Status, Kind and Priority; the App filter applies after, so its counts follow the other three. */
  const facetRows = useMemo(
    () =>
      feedback.filter(
        (row) =>
          (statusFilter === ALL_FEEDBACK_STATUSES || row.status === statusFilter) &&
          (reportKindFilter === ALL_FEEDBACK_REPORT_KINDS || row.reportKind === reportKindFilter) &&
          (priorityFilter === ALL_FEEDBACK_PRIORITIES || row.priority === priorityFilter),
      ),
    [feedback, statusFilter, reportKindFilter, priorityFilter],
  );

  const appOptions: SortOption[] = useMemo(
    () => [
      { value: ALL_APPS, label: `${ALL_APPS_LABEL[view]} · ${facetRows.length}`, selectedLabel: ALL_APPS_LABEL[view] },
      ...appNames.map((name) => ({
        value: name,
        label: `${name} · ${facetRows.filter((row) => row.appName === name).length}`,
        selectedLabel: name,
      })),
    ],
    [view, appNames, facetRows],
  );

  const visibleRows = appFilter === ALL_APPS ? facetRows : facetRows.filter((row) => row.appName === appFilter);
  const isFiltered =
    appFilter !== ALL_APPS ||
    statusFilter !== ALL_FEEDBACK_STATUSES ||
    reportKindFilter !== ALL_FEEDBACK_REPORT_KINDS ||
    priorityFilter !== ALL_FEEDBACK_PRIORITIES;

  const tabs = (['received', 'mine'] as const).map((tab) => ({
    name: TAB_LABEL[tab],
    count: (tab === 'received' ? received : mine).feedback.length,
  }));

  const handleTabClick = (name: string) => {
    const next: FeedbackView = name === TAB_LABEL.received ? 'received' : 'mine';
    if (next !== view) router.push(FEEDBACK_PAGE_HREF[next]);
  };

  const handleAppChange = (value: string) => {
    if (value === appFilter) return;
    setAppFilter(value);
    if (isReceived) analytics.onFeedbackTabFiltered(value === ALL_APPS ? ALL_TAB : value);
  };

  const handleExport = () => {
    exportAiAppFeedbackCsv(
      visibleRows,
      buildFeedbackCsvFilename(appFilter === ALL_APPS ? ALL_TAB : appFilter, statusFilter),
    );
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

  const filteredEmptyCopy =
    appFilter !== ALL_APPS && !feedback.some((row) => row.appName === appFilter)
      ? `No feedback on ${appFilter} yet.`
      : 'No feedback matches the selected filters.';

  return (
    <div className={s.pageFrame}>
      <div className={s.content}>
        <Link href="/pl-infra/ai-apps" className={s.backLink}>
          <ArrowBackIcon width={16} height={16} />
          Back to all
        </Link>

        <div className={s.titleBlock}>
          <h1 className={s.title}>Feedback</h1>
          <p className={s.subtitle}>{subtitleFor(view, isDirectoryAdmin)}</p>
        </div>

        <div className={s.tabsRow}>
          {showTabs ? <FeedbackTabs tabs={tabs} activeTab={TAB_LABEL[view]} onTabClick={handleTabClick} /> : <span />}
          {!isLoading && !isError && feedback.length > 0 && (
            <div className={s.tabsActions}>
              <SortDropdown
                sortByLabel="App:"
                options={appOptions}
                currentSort={appFilter}
                onSortChange={handleAppChange}
              />
              <SortDropdown
                sortByLabel="Status:"
                options={FEEDBACK_STATUS_FILTER_OPTIONS}
                currentSort={statusFilter}
                onSortChange={(value) => {
                  const next = value as FeedbackStatusFilterValue;
                  if (next === statusFilter) return;
                  setStatusFilter(next);
                  if (isReceived) analytics.onFeedbackStatusFiltered(next);
                }}
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
              {isReceived && (
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
              )}
            </div>
          )}
        </div>

        {isLoading ? (
          <div className={s.state}>Loading feedback…</div>
        ) : isError ? (
          <div className={s.state}>Unable to load feedback. Please try again later.</div>
        ) : feedback.length === 0 ? (
          <div className={s.state}>{EMPTY_COPY[view]}</div>
        ) : visibleRows.length === 0 ? (
          <div className={s.state}>{isFiltered ? filteredEmptyCopy : EMPTY_COPY[view]}</div>
        ) : (
          <FeedbackTable
            rows={visibleRows}
            pendingFeedbackUid={isReceived && updateStatus.isPending ? updateStatus.variables?.feedbackUid : undefined}
            onStatusSelect={isReceived ? handleStatusSelect : undefined}
            onImageClick={setLightbox}
          />
        )}
      </div>
      <FeedbackImageLightbox image={lightbox} onClose={() => setLightbox(null)} />
    </div>
  );
}
