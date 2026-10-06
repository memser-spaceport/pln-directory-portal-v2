'use client';

import Link from 'next/link';
import { useState } from 'react';

import type { AiAppFeedbackStatus } from '@/services/ai-app-feedback/constants';
import type { AiAppFeedbackRow } from '@/services/ai-app-feedback/ai-app-feedback.service';

import { ArrowBackIcon } from '@/components/icons';
import { Button } from '@/components/common/Button/Button';

import { decodeFilterValues } from '@/services/filters/decodeFilterValues';
import type { FeedbackImage } from '@/components/page/ai-apps/AiAppFeedbackPage/utils/splitFeedbackMedia';
import { exportAiAppFeedbackCsv } from '@/components/page/ai-apps/AiAppFeedbackPage/utils/exportAiAppFeedbackCsv';
import { buildFeedbackCsvFilename } from '@/components/page/ai-apps/AiAppFeedbackPage/utils/buildFeedbackCsvFilename';
import { FeedbackTabs } from '@/components/page/ai-apps/AiAppFeedbackPage/components/FeedbackTabs';
import { DownloadIcon } from '@/components/page/ai-apps/AiAppFeedbackPage/components/DownloadIcon';
import { FeedbackTable } from '@/components/page/ai-apps/AiAppFeedbackPage/components/FeedbackTable';
import { FeedbackImageLightbox } from '@/components/page/ai-apps/AiAppFeedbackPage/components/FeedbackImageLightbox';

// Production page stylesheet, verbatim.
import s from '@/components/page/ai-apps/AiAppFeedbackPage/AiAppFeedbackPage.module.scss';
// The grid's content column, so with the rail on the left the page sits where the grid does.
import page from '@/components/page/ai-apps/AiAppsPage/AiAppsPage.module.scss';
import proto from './AiAppsPrototype.module.scss';
import { FEEDBACK_PARAM, clearFeedbackParams, useMockFeedbackFilterStore } from './mockFeedbackFilterStore';

export type FeedbackView = 'received' | 'mine';

const ROUTE = '/prototypes/ai-apps-feedback-drawer';

/** The page lives on the prototype's own route, so the browser Back button leaves it. */
export function feedbackHref(view: FeedbackView) {
  return `${ROUTE}?feedback=${view}`;
}

/**
 * The App facet's options. Received: the apps the viewer admins, every one of
 * them, quiet ones included, so the list is "my apps" rather than "whichever
 * apps happen to have rows". Given: the apps in the viewer's own rows (other
 * people's apps, which an admin list cannot describe).
 */
export function feedbackAppNames(view: FeedbackView, adminApps: { name: string }[], rows: AiAppFeedbackRow[]) {
  return view === 'received' ? adminApps.map((a) => a.name) : Array.from(new Set(rows.map((r) => r.appName))).sort();
}

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
 * Production's per-app tabs, and the Status / Kind / Priority menus, became the
 * left filter rail (`FeedbackFilterView`, 2026-10-06) with search, Type, App
 * and From, so the tab row carries the two halves of the page and Export CSV
 * only. Everything else is production's: the table,
 * status selector (read-only on your own items), lightbox, Export CSV and the
 * page stylesheet.
 */
export function FeedbackPage({ view, received, mine, canReview, onViewChange, onStatusChange }: Props) {
  const active: FeedbackView = canReview ? view : 'mine';
  const feedback = active === 'received' ? received : mine;

  const [lightbox, setLightbox] = useState<FeedbackImage | null>(null);
  const { params } = useMockFeedbackFilterStore();

  /*
   * 2026-10-06: the filters live in the left rail (FeedbackFilterView), like
   * every other list in the product; they were SortDropdowns in this tab row.
   * Each facet is multi-select (`|`-joined); an empty facet means all.
   */
  const pick = (key: string) => decodeFilterValues(params.get(key));
  const search = (params.get(FEEDBACK_PARAM.SEARCH) ?? '').trim().toLowerCase();
  const types = pick(FEEDBACK_PARAM.TYPE);
  const apps = pick(FEEDBACK_PARAM.APP);
  const statuses = pick(FEEDBACK_PARAM.STATUS);
  const kinds = pick(FEEDBACK_PARAM.KIND);
  const priorities = pick(FEEDBACK_PARAM.PRIORITY);
  const people = active === 'received' ? pick(FEEDBACK_PARAM.FROM) : [];
  const has = (list: string[], v: string | null | undefined) => list.length === 0 || (!!v && list.includes(v));

  const isFiltered = [search, types, apps, statuses, kinds, priorities, people].some((f) => f.length > 0);

  const visibleRows = feedback.filter(
    (r) =>
      (!search || r.text.toLowerCase().includes(search)) &&
      has(types, r.kind === 'COMMENT' ? 'COMMENT' : 'FEEDBACK') &&
      has(apps, r.appName) &&
      has(statuses, r.status) &&
      has(kinds, r.reportKind) &&
      has(priorities, r.priority) &&
      has(people, r.member?.name),
  );

  const tabs = (['received', 'mine'] as const).map((v) => ({
    name: TAB_LABEL[v],
    count: (v === 'received' ? received : mine).length,
  }));

  const emptyCopy = active === 'received' ? 'No feedback on your apps yet.' : 'You haven’t sent any feedback yet.';
  const onlyApp = apps.length === 1 ? apps[0] : null;

  // The tab row keeps the page action only.
  const actions = active === 'received' && feedback.length > 0 && (
    <div className={s.tabsActions}>
      <Button
        size="s"
        style="fill"
        variant="primary"
        onClick={() => exportAiAppFeedbackCsv(visibleRows, buildFeedbackCsvFilename(onlyApp ?? 'All apps', 'ALL'))}
        disabled={visibleRows.length === 0}
        className={s.exportButton}
      >
        <DownloadIcon />
        Export CSV
      </Button>
    </div>
  );

  return (
    <>
      <div className={`${page.content} ${proto.column}`}>
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
              onTabClick={(name) => {
                // App and From list different things on each tab; the rest carry over.
                clearFeedbackParams([FEEDBACK_PARAM.APP, FEEDBACK_PARAM.FROM]);
                onViewChange(name === TAB_LABEL.received ? 'received' : 'mine');
              }}
            />
          ) : (
            <span />
          )}
          {actions}
        </div>

        {feedback.length === 0 ? (
          <div className={s.state}>{emptyCopy}</div>
        ) : visibleRows.length === 0 ? (
          <div className={s.state}>
            {onlyApp && !feedback.some((r) => r.appName === onlyApp)
              ? `No feedback on ${onlyApp} yet.`
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
    </>
  );
}
