'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { FeedbackItem, FeedbackStatus, FeedbackType } from '@/services/plaa/feedback/feedback.types';
import {
  useChangeStatus,
  useCreateFeedback,
  useFeedbackList,
  useFeedbackMe,
  useFeedbackRoadmap,
  useFeedbackTriage,
  useRetryLinear,
  useVote,
} from '@/services/plaa/feedback/useFeedback';
import { usePlaaFeedbackAnalytics } from '@/analytics/plaa-feedback.analytics';
import FeedbackForm, { FeedbackFormValues } from './feedback-form';
import IdeasList from './ideas-list';
import RoadmapBoard from './roadmap-board';
import TriageList from './triage-list';
import { EmptyState, ErrorState, LoadingRows } from './feedback-bits';
import FeedbackStyles from './feedback-styles';
import { groupByMonth } from './feedback.utils';

type Tab = 'ideas' | 'roadmap' | 'completed' | 'mine' | 'triage';

const TAB_LABELS: Record<Tab, string> = {
  ideas: 'Ideas',
  roadmap: 'Roadmap',
  completed: 'Completed',
  mine: 'My submissions',
  triage: 'Triage',
};

const PUBLIC_TABS: Tab[] = ['ideas', 'roadmap', 'completed', 'mine'];

/**
 * Feedback Board (§6).
 *
 * Tab, sort and filter live in the query string so a view is shareable; nothing
 * personal goes in the URL — `mine` is a boolean, never a member uid.
 */
export default function FeedbackPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const analytics = usePlaaFeedbackAnalytics();

  const { data: me } = useFeedbackMe();
  const isAdmin = me?.is_admin ?? false;

  const tabParam = (searchParams.get('tab') ?? 'ideas') as Tab;
  const tab: Tab = (isAdmin ? [...PUBLIC_TABS, 'triage'] : PUBLIC_TABS).includes(tabParam) ? tabParam : 'ideas';
  const sort = (searchParams.get('sort') ?? 'top') as 'top' | 'new';
  const typeFilter = (searchParams.get('type') ?? '') as FeedbackType | '';
  const statusFilter = (searchParams.get('status') ?? 'open') as 'open' | 'all';

  const [formOpen, setFormOpen] = useState(false);

  const setParam = useCallback(
    (updates: Record<string, string | undefined>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(updates)) {
        if (value) params.set(key, value);
        else params.delete(key);
      }
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  useEffect(() => {
    analytics.onBoardViewed(tab);
    // Only a tab change is a new view.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  const listParams = useMemo(
    () => ({
      sort,
      ...(typeFilter ? { type: typeFilter } : {}),
      ...(tab === 'mine' ? { mine: true } : {}),
      ...(tab === 'completed'
        ? { status: 'completed' as const }
        : statusFilter === 'open'
          ? { status: 'open' as const }
          : {}),
    }),
    [sort, typeFilter, tab, statusFilter],
  );

  const listQuery = useFeedbackList(listParams);
  const roadmapQuery = useFeedbackRoadmap();
  const triageQuery = useFeedbackTriage(isAdmin && tab === 'triage');

  const vote = useVote();
  const create = useCreateFeedback();
  const changeStatus = useChangeStatus();
  const retryLinear = useRetryLinear();

  const handleVote = (item: FeedbackItem) => {
    analytics[item.has_voted ? 'onUnvoted' : 'onVoted'](item.type, item.status);
    vote.mutate({ id: item.id, voted: item.has_voted });
  };

  const handleMove = (id: string, toStatus: FeedbackStatus, note?: string, duplicateOfId?: string) => {
    const from = findStatus(id);
    changeStatus.mutate({ id, toStatus, note, duplicateOfId });
    analytics.onStatusChanged(from, toStatus, Boolean(note));
  };

  function findStatus(id: string): string {
    const all = [...(listQuery.data?.items ?? []), ...Object.values(roadmapQuery.data ?? {}).flat()];
    return all.find((item) => item.id === id)?.status ?? 'unknown';
  }

  const handleSubmit = (values: FeedbackFormValues) => {
    create.mutate(values, {
      onSuccess: (item) => {
        analytics.onSubmitted(values.type, values.screenshots.length, Boolean(values.link_url), Boolean(values.importance));
        setFormOpen(false);
        // §6: bugs are private, so the member goes to My submissions rather than
        // an item page they'd be the only one able to open.
        if (values.type === 'bug') setParam({ tab: 'mine' });
        else router.push(`/alignment-asset/feedback/${item.id}`);
      },
    });
  };

  const openForm = (entry: 'header' | 'empty_state') => {
    analytics.onFormOpened(entry);
    setFormOpen(true);
  };

  const giveFeedbackButton = (
    <button type="button" className="fb-btn fb-btn--primary" onClick={() => openForm('empty_state')}>
      Give feedback
    </button>
  );

  return (
    <div className="fb-page">
      <header className="fb-page__head">
        <div>
          <h1 className="fb-page__title">Feedback</h1>
          <p className="fb-page__intro">
            Suggest features, report bugs, and follow what the PLAA team is building.
          </p>
        </div>
        <button type="button" className="fb-btn fb-btn--primary fb-page__cta" onClick={() => openForm('header')}>
          Give feedback
        </button>
      </header>

      <nav className="fb-tabs" role="tablist" aria-label="Feedback views">
        {(isAdmin ? [...PUBLIC_TABS, 'triage' as Tab] : PUBLIC_TABS).map((name) => (
          <button
            key={name}
            type="button"
            role="tab"
            aria-selected={tab === name}
            className={`fb-tabs__tab ${tab === name ? 'fb-tabs__tab--active' : ''}`}
            id={`fb-tab-${name}`}
            aria-controls="fb-tabpanel"
            onClick={() => setParam({ tab: name === 'ideas' ? undefined : name })}
            data-testid={`fb-tab-${name}`}
          >
            {TAB_LABELS[name]}
          </button>
        ))}
      </nav>

      {(tab === 'ideas' || tab === 'mine') && (
        <div className="fb-filters">
          <label className="fb-filters__field">
            <span className="fb-sr-only">Filter by type</span>
            <select
              className="fb-select"
              value={typeFilter}
              onChange={(event) => setParam({ type: event.target.value || undefined })}
              data-testid="fb-filter-type"
            >
              <option value="">All types</option>
              <option value="feature">New feature</option>
              <option value="improvement">Improvement</option>
            </select>
          </label>

          <label className="fb-filters__field">
            <span className="fb-sr-only">Filter by status</span>
            <select
              className="fb-select"
              value={statusFilter}
              onChange={(event) => setParam({ status: event.target.value === 'open' ? undefined : 'all' })}
              data-testid="fb-filter-status"
            >
              <option value="open">Open</option>
              <option value="all">All</option>
            </select>
          </label>

          <label className="fb-filters__field">
            <span className="fb-sr-only">Sort</span>
            <select
              className="fb-select"
              value={sort}
              onChange={(event) => setParam({ sort: event.target.value === 'top' ? undefined : 'new' })}
              data-testid="fb-filter-sort"
            >
              <option value="top">Top</option>
              <option value="new">New</option>
            </select>
          </label>
        </div>
      )}

      <div className="fb-panel" role="tabpanel" id="fb-tabpanel" aria-labelledby={`fb-tab-${tab}`} tabIndex={-1}>
        {tab === 'roadmap' ? (
          roadmapQuery.isLoading ? (
            <LoadingRows />
          ) : roadmapQuery.isError ? (
            <ErrorState onRetry={() => roadmapQuery.refetch()} />
          ) : (
            <RoadmapBoard
              roadmap={roadmapQuery.data ?? { under_review: [], todo: [], in_progress: [], completed: [] }}
              isAdmin={isAdmin}
              onVote={handleVote}
              onMove={handleMove}
            />
          )
        ) : tab === 'triage' ? (
          triageQuery.isLoading ? (
            <LoadingRows />
          ) : triageQuery.isError ? (
            <ErrorState onRetry={() => triageQuery.refetch()} />
          ) : (
            <TriageList
              items={triageQuery.data?.items ?? []}
              onMove={handleMove}
              onRetryLinear={(id) => retryLinear.mutate(id)}
              retryingId={retryLinear.isPending ? (retryLinear.variables as string) : undefined}
            />
          )
        ) : listQuery.isLoading ? (
          <LoadingRows />
        ) : listQuery.isError ? (
          <ErrorState onRetry={() => listQuery.refetch()} />
        ) : tab === 'completed' ? (
          <CompletedView items={listQuery.data?.items ?? []} onVote={handleVote} />
        ) : (
          <IdeasList
            items={listQuery.data?.items ?? []}
            onVote={handleVote}
            showPrivateMarker={tab === 'mine'}
            emptyMessage={
              tab === 'mine' ? "You haven't submitted anything yet." : 'No ideas yet. Be the first to suggest one.'
            }
            emptyAction={giveFeedbackButton}
          />
        )}
      </div>

      {formOpen && (
        <FeedbackForm
          onClose={() => setFormOpen(false)}
          onSubmit={handleSubmit}
          isSubmitting={create.isPending}
          submitError={create.error}
          sourcePath={pathname}
        />
      )}

      <FeedbackStyles />
    </div>
  );
}

/** Completed tab (F-6): every completed item, grouped by month. */
function CompletedView({ items, onVote }: { items: FeedbackItem[]; onVote: (item: FeedbackItem) => void }) {
  const groups = groupByMonth(items);
  if (!groups.length) {
    return <EmptyState message="Nothing shipped from the board yet." />;
  }
  return (
    <div className="fb-completed">
      {groups.map(([month, monthItems]) => (
        <section key={month} className="fb-completed__group">
          <h2 className="fb-completed__month">{month}</h2>
          <IdeasList items={monthItems} onVote={onVote} emptyMessage="" />
        </section>
      ))}
    </div>
  );
}
