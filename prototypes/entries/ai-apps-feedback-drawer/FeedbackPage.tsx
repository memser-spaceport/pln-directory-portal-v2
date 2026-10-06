'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';

import type { AiAppFeedbackStatus } from '@/services/ai-app-feedback/constants';
import type { AiAppFeedbackRow } from '@/services/ai-app-feedback/ai-app-feedback.service';

import { ArrowBackIcon } from '@/components/icons';
import { Button } from '@/components/common/Button/Button';
import { SortDropdown, type SortOption } from '@/components/common/filters/SortDropdown';

import type {
  FeedbackPriorityFilterValue,
  FeedbackReportKindFilterValue,
  FeedbackStatusFilterValue,
} from '@/components/page/ai-apps/AiAppFeedbackPage/types';
import type { FeedbackImage } from '@/components/page/ai-apps/AiAppFeedbackPage/utils/splitFeedbackMedia';
import {
  ALL_FEEDBACK_STATUSES,
  ALL_FEEDBACK_PRIORITIES,
  ALL_FEEDBACK_REPORT_KINDS,
  FEEDBACK_STATUS_FILTER_OPTIONS,
  FEEDBACK_PRIORITY_FILTER_OPTIONS,
  FEEDBACK_REPORT_KIND_FILTER_OPTIONS,
} from '@/components/page/ai-apps/AiAppFeedbackPage/constants';
import { exportAiAppFeedbackCsv } from '@/components/page/ai-apps/AiAppFeedbackPage/utils/exportAiAppFeedbackCsv';
import { buildFeedbackCsvFilename } from '@/components/page/ai-apps/AiAppFeedbackPage/utils/buildFeedbackCsvFilename';
import { FeedbackTabs } from '@/components/page/ai-apps/AiAppFeedbackPage/components/FeedbackTabs';
import { DownloadIcon } from '@/components/page/ai-apps/AiAppFeedbackPage/components/DownloadIcon';
import { FeedbackTable } from '@/components/page/ai-apps/AiAppFeedbackPage/components/FeedbackTable';
import { FeedbackImageLightbox } from '@/components/page/ai-apps/AiAppFeedbackPage/components/FeedbackImageLightbox';

// Production page stylesheet, verbatim.
import s from '@/components/page/ai-apps/AiAppFeedbackPage/AiAppFeedbackPage.module.scss';

export type FeedbackView = 'received' | 'mine';

const ROUTE = '/prototypes/ai-apps-feedback-drawer';

/** The page lives on the prototype's own route, so the browser Back button leaves it. */
export function feedbackHref(view: FeedbackView) {
  return `${ROUTE}?feedback=${view}`;
}

const ALL_APPS = 'ALL';

const TAB_LABEL: Record<FeedbackView, string> = {
  received: 'Received',
  mine: 'Given',
};

const SUBTITLE: Record<FeedbackView, string> = {
  received: 'Feedback others gave on the apps you build. Set a status so they know what happened.',
  mine: 'Feedback and comments you gave on other apps, and whether each has been acted on.',
};

interface Props {
  view: FeedbackView;
  /** On apps the viewer created. */
  received: AiAppFeedbackRow[];
  /** Written by the viewer. */
  mine: AiAppFeedbackRow[];
  /** Stand-in for production's `canReview`; without it there is one list and no tabs. */
  canReview: boolean;
  /** The apps the viewer admins (created, or made admin of): what Received's App filter offers. */
  adminApps: { uid: string; name: string }[];
  onViewChange: (view: FeedbackView) => void;
  onStatusChange: (row: AiAppFeedbackRow, status: AiAppFeedbackStatus) => void;
}

/**
 * REFACTOR of production's two pages (develop, 5 Oct): `AiAppFeedbackPage`
 * (/pl-infra/ai-apps/feedback, "Feedback on your apps") and `MyAiAppFeedbackPage`
 * (/pl-infra/ai-apps/feedback/mine, "Your feedback") become one Feedback page
 * with a tab each — as an app author you see what others sent you and what you
 * sent others, and what happened to it, in one place (Anuj, 5 Oct). Tabs: Received and Given.
 *
 * Production's per-app tabs move into an "App:" menu beside Status / Kind /
 * Priority, so the tab row can carry the two halves of the page instead of a
 * second row of tabs under it. Everything else is production's: the table,
 * status selector (read-only on your own items), lightbox, Export CSV and the
 * page stylesheet.
 */
export function FeedbackPage({ view, received, mine, canReview, adminApps, onViewChange, onStatusChange }: Props) {
  const active: FeedbackView = canReview ? view : 'mine';
  const feedback = active === 'received' ? received : mine;

  const [appFilter, setAppFilter] = useState(ALL_APPS);
  const [statusFilter, setStatusFilter] = useState<FeedbackStatusFilterValue>(ALL_FEEDBACK_STATUSES);
  const [reportKindFilter, setReportKindFilter] = useState<FeedbackReportKindFilterValue>(ALL_FEEDBACK_REPORT_KINDS);
  const [priorityFilter, setPriorityFilter] = useState<FeedbackPriorityFilterValue>(ALL_FEEDBACK_PRIORITIES);
  const [lightbox, setLightbox] = useState<FeedbackImage | null>(null);

  /*
   * Drawer iteration (review 2026-10-05): on Received the App filter lists the
   * apps the viewer admins, every one of them, quiet ones included, so the menu
   * is "my apps" rather than "whichever apps happen to have rows". Each option
   * carries its count, so an app with nothing yet says so before it is picked.
   * Given keeps the earlier menu built from its rows: those are other people's
   * apps, which an admin list cannot describe.
   */
  const appNames = useMemo(
    () =>
      active === 'received'
        ? adminApps.map((a) => a.name)
        : Array.from(new Set(feedback.map((r) => r.appName))).sort(),
    [active, adminApps, feedback],
  );
  const appOptions: SortOption[] = [
    { value: ALL_APPS, label: active === 'received' ? 'All my apps' : 'All' },
    ...appNames.map((name) => {
      const count = feedback.filter((r) => r.appName === name).length;
      return { value: name, label: active === 'received' ? `${name} (${count})` : name };
    }),
  ];
  // The two lists cover different apps; a pick from the other tab means "all" here.
  const app = appNames.includes(appFilter) ? appFilter : ALL_APPS;

  const isFiltered =
    app !== ALL_APPS ||
    statusFilter !== ALL_FEEDBACK_STATUSES ||
    reportKindFilter !== ALL_FEEDBACK_REPORT_KINDS ||
    priorityFilter !== ALL_FEEDBACK_PRIORITIES;

  const visibleRows = feedback.filter(
    (r) =>
      (app === ALL_APPS || r.appName === app) &&
      (statusFilter === ALL_FEEDBACK_STATUSES || r.status === statusFilter) &&
      (reportKindFilter === ALL_FEEDBACK_REPORT_KINDS || r.reportKind === reportKindFilter) &&
      (priorityFilter === ALL_FEEDBACK_PRIORITIES || r.priority === priorityFilter),
  );

  const tabs = (['received', 'mine'] as const).map((v) => ({
    name: TAB_LABEL[v],
    count: (v === 'received' ? received : mine).length,
  }));

  const emptyCopy = active === 'received' ? 'No feedback on your apps yet.' : 'You haven’t sent any feedback yet.';

  const filters = (
    <div className={s.tabsActions}>
      {appNames.length > 1 && (
        <SortDropdown sortByLabel="App:" options={appOptions} currentSort={app} onSortChange={setAppFilter} />
      )}
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
      {active === 'received' && (
        <Button
          size="s"
          style="fill"
          variant="primary"
          onClick={() =>
            exportAiAppFeedbackCsv(
              visibleRows,
              buildFeedbackCsvFilename(app === ALL_APPS ? 'All apps' : app, statusFilter),
            )
          }
          disabled={visibleRows.length === 0}
          className={s.exportButton}
        >
          <DownloadIcon />
          Export CSV
        </Button>
      )}
    </div>
  );

  return (
    <div className={s.pageFrame}>
      <div className={s.content}>
        <Link href={ROUTE} className={s.backLink}>
          <ArrowBackIcon width={16} height={16} />
          Back to all
        </Link>

        <div className={s.titleBlock}>
          <h1 className={s.title}>Feedback</h1>
          <p className={s.subtitle}>{SUBTITLE[active]}</p>
        </div>

        <div className={s.tabsRow}>
          {canReview ? (
            <FeedbackTabs
              tabs={tabs}
              activeTab={TAB_LABEL[active]}
              onTabClick={(name) => onViewChange(name === TAB_LABEL.received ? 'received' : 'mine')}
            />
          ) : (
            <span />
          )}
          {feedback.length > 0 && filters}
        </div>

        {feedback.length === 0 ? (
          <div className={s.state}>{emptyCopy}</div>
        ) : visibleRows.length === 0 ? (
          <div className={s.state}>
            {app !== ALL_APPS && !feedback.some((r) => r.appName === app)
              ? `No feedback on ${app} yet.`
              : isFiltered
                ? 'No feedback matches the selected filters.'
                : 'No feedback for this app yet.'}
          </div>
        ) : (
          <FeedbackTable
            rows={visibleRows}
            onStatusSelect={active === 'received' ? onStatusChange : undefined}
            onImageClick={setLightbox}
          />
        )}
      </div>
      <FeedbackImageLightbox image={lightbox} onClose={() => setLightbox(null)} />
    </div>
  );
}
