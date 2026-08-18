'use client';

import clsx from 'clsx';
import { useSearchParams } from 'next/navigation';
import { useCallback, useMemo, useState } from 'react';

import { DetailsSectionHeader } from '@/components/common/profile/DetailsSection';
import { useIsMobile } from '@/hooks/useIsMobile';
import { useTeamNewsAnalytics, type TeamNewsAnalyticsSource } from '@/analytics/team-news.analytics';
import { NewsDetailModal } from '@/components/page/home/TeamNews/components/NewsDetailModal';
import { TEAM_NEWS_PREVIEW_LIMIT } from '@/services/team-news/constants';
import { useTeamNewsUpvoteToggle } from '@/services/team-news/hooks/useTeamNewsUpvoteToggle';
import type { ITeamNewsByTeamResponse, ITeamNewsItem } from '@/types/team-news.types';

import { TeamNewsCard } from './TeamNewsCard';
import { TeamNewsFeedLink } from './TeamNewsFeedLink';
import { TeamNewsModal } from './TeamNewsModal';

import s from './TeamNewsRail.module.scss';

interface TeamNewsRailProps {
  teamUid: string;
  teamName: string;
  initialData: ITeamNewsByTeamResponse;
}

export type TeamNewsUpvoteOverlay = Map<string, { viewerHasUpvoted: boolean; upvoteCount: number }>;

// One state for what's open over the profile, so illegal combinations can't
// exist: the archive and a rail-opened story are never both up, closing always
// drops the focus target, and "View all" after a "Show more" open is unfocused
// by construction.
//
// `detail` is the story opened FROM THE RAIL. The archive drills into stories
// itself (TeamNewsModal owns that state) rather than stacking this modal on top
// of it — two overlays would mean two close buttons and an ambiguous Escape.
type NewsModalState = { kind: 'none' } | { kind: 'archive'; focusUid: string | null } | { kind: 'detail'; uid: string };

export function mergeUpvoteOverlay(items: ITeamNewsItem[], overlay: TeamNewsUpvoteOverlay): ITeamNewsItem[] {
  if (overlay.size === 0) return items;
  return items.map((item) => (overlay.has(item.uid) ? { ...item, ...overlay.get(item.uid) } : item));
}

export function TeamNewsRail({ teamUid, teamName, initialData }: TeamNewsRailProps) {
  const [modalState, setModalState] = useState<NewsModalState>({ kind: 'none' });
  const isMobile = useIsMobile();
  const {
    onTeamNewsCardClicked,
    onTeamNewsViewAllClicked,
    onTeamNewsShowMoreClicked,
    onTeamNewsUpvoteToggled,
    onTeamNewsUpvoteFailed,
  } = useTeamNewsAnalytics();
  const { mutate: upvoteMutate } = useTeamNewsUpvoteToggle();

  const searchParams = useSearchParams();
  const highlightSection = searchParams.get('highlight') === 'news';

  // The rail reads server-provided `initialData` and the modal has its own
  // infinite query — two data sources for the same stories. Like the homepage
  // feed (TeamNews.tsx), a single local overlay merged over both keeps the
  // viewer's vote consistent everywhere it renders. Auth check + login
  // redirect happens inside NewsCard; this handler assumes a signed-in caller.
  const [upvoteOverlay, setUpvoteOverlay] = useState<TeamNewsUpvoteOverlay>(() => new Map());

  const handleUpvoteToggle = useCallback(
    (item: ITeamNewsItem, position: number, source: TeamNewsAnalyticsSource) => {
      const wasUpvoted = Boolean(item.viewerHasUpvoted);
      const nextUpvoted = !wasUpvoted;
      const prevCount = item.upvoteCount ?? 0;
      const nextCount = wasUpvoted ? Math.max(0, prevCount - 1) : prevCount + 1;

      setUpvoteOverlay((prev) => {
        const next = new Map(prev);
        next.set(item.uid, { viewerHasUpvoted: nextUpvoted, upvoteCount: nextCount });
        return next;
      });

      upvoteMutate(
        { uid: item.uid, isUpvoted: nextUpvoted },
        {
          onError: () => {
            setUpvoteOverlay((prev) => {
              const next = new Map(prev);
              next.set(item.uid, { viewerHasUpvoted: wasUpvoted, upvoteCount: prevCount });
              return next;
            });
            // The other half of the funnel. Wiring only /home's copy of this
            // handler would have made the failure rate read 0% for every
            // team-profile surface, while the success event covers them all.
            onTeamNewsUpvoteFailed(item, position, nextUpvoted, source);
          },
          onSuccess: (status) => {
            // Reconcile with the server's authoritative count/state (e.g.
            // concurrent votes from others), when available.
            if (status) {
              setUpvoteOverlay((prev) => {
                const next = new Map(prev);
                next.set(item.uid, { viewerHasUpvoted: status.viewerHasUpvoted, upvoteCount: status.upvoteCount });
                return next;
              });
            }
            onTeamNewsUpvoteToggled(item, position, nextUpvoted, source);
          },
        },
      );
    },
    [onTeamNewsUpvoteToggled, onTeamNewsUpvoteFailed, upvoteMutate],
  );

  const total = initialData.total;
  const previewItems = useMemo(
    () => mergeUpvoteOverlay(initialData.items.slice(0, TEAM_NEWS_PREVIEW_LIMIT), upvoteOverlay),
    [initialData.items, upvoteOverlay],
  );
  const hasMore = total > TEAM_NEWS_PREVIEW_LIMIT;

  // Tapping the row and clicking its comment count are two ways of asking for
  // the same thing — this story, in full — so both open the story over the
  // profile and both report as a card click, split by `via`.
  const handleCardClick = useCallback(
    (item: ITeamNewsItem, position: number) => {
      onTeamNewsCardClicked(item, position, 'team-profile-rail');
    },
    [onTeamNewsCardClicked],
  );

  const handleOpenDetail = useCallback(
    (item: ITeamNewsItem, position: number, via: 'row' | 'comments') => {
      // The row's own click already reported through `onClick` (handleCardClick);
      // reporting again here would double-count every card tap.
      if (via === 'comments') onTeamNewsCardClicked(item, position, 'team-profile-rail', 'comments');
      setModalState({ kind: 'detail', uid: item.uid });
    },
    [onTeamNewsCardClicked],
  );

  // The third way of asking for the same story. Deliberately keeps its own event
  // (it measures the teaser's clamp, not the row) and fires no card-click.
  const handleShowMore = useCallback(
    (item: ITeamNewsItem, position: number) => {
      onTeamNewsShowMoreClicked(item, position);
      setModalState({ kind: 'detail', uid: item.uid });
    },
    [onTeamNewsShowMoreClicked],
  );

  const detailItem =
    modalState.kind === 'detail' ? (previewItems.find((item) => item.uid === modalState.uid) ?? null) : null;

  return (
    <>
      <aside className={s.rail}>
        <div className={s.railSpacer} aria-hidden="true" />
        <div
          className={clsx(s.newsPanel, {
            [s.highlight]: highlightSection,
          })}
        >
          <DetailsSectionHeader title={`${teamName} News (${total})`} />
          <div className={s.newsList}>
            {previewItems.map((item, index) => (
              <TeamNewsCard
                key={item.uid}
                item={item}
                position={index}
                variant="flat"
                analyticsSource="team-profile-rail"
                onClick={(clicked) => handleCardClick(clicked, index)}
                onUpvoteToggle={(toggled: ITeamNewsItem) => handleUpvoteToggle(toggled, index, 'team-profile-rail')}
                onShowMore={(clicked) => handleShowMore(clicked, index)}
                onOpenDetail={(clicked, via) => handleOpenDetail(clicked, index, via)}
              />
            ))}
          </div>
          {/* The panel's two exits, paired on one row: "View all news" stays
              inside this team, "All network updates" widens to the feed. When
              there's no archive to open, the remaining exit takes the row. */}
          <div className={s.newsFooter}>
            {hasMore && (
              <button
                type="button"
                className={s.viewAll}
                onClick={() => {
                  onTeamNewsViewAllClicked(teamUid, teamName, total);
                  setModalState({ kind: 'archive', focusUid: null });
                }}
              >
                View all news ({total})
              </button>
            )}
            <TeamNewsFeedLink teamUid={teamUid} teamName={teamName} source="team-profile-rail" />
          </div>
        </div>
      </aside>

      <TeamNewsModal
        isOpen={modalState.kind === 'archive'}
        focusUid={modalState.kind === 'archive' ? modalState.focusUid : null}
        onClose={() => setModalState({ kind: 'none' })}
        teamUid={teamUid}
        teamName={teamName}
        total={total}
        fullscreen={isMobile}
        upvoteOverlay={upvoteOverlay}
        onUpvoteToggle={handleUpvoteToggle}
      />

      {/* Conditional mount, no isOpen half-state: the item prop is always the
          live overlay-merged object, so the story and the card behind it can
          never disagree about a vote (same call as /home's). */}
      {detailItem && (
        <NewsDetailModal
          item={detailItem}
          onClose={() => setModalState({ kind: 'none' })}
          onUpvoteToggle={(item) =>
            handleUpvoteToggle(
              item,
              previewItems.findIndex((preview) => preview.uid === item.uid),
              'team-profile-rail',
            )
          }
          source="team-profile-rail"
        />
      )}
    </>
  );
}
