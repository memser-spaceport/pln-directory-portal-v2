'use client';

import { useCallback, useMemo, useState } from 'react';

import { DetailsSectionHeader } from '@/components/common/profile/DetailsSection';
import { useIsMobile } from '@/hooks/useIsMobile';
import { useTeamNewsAnalytics, type TeamNewsAnalyticsSource } from '@/analytics/team-news.analytics';
import { TEAM_NEWS_PREVIEW_LIMIT } from '@/services/team-news/constants';
import { useTeamNewsUpvoteToggle } from '@/services/team-news/hooks/useTeamNewsUpvoteToggle';
import type { ITeamNewsByTeamResponse, ITeamNewsItem } from '@/types/team-news.types';

import { TeamNewsCard } from './TeamNewsCard';
import { TeamNewsModal } from './TeamNewsModal';
import s from './TeamNewsRail.module.scss';

interface TeamNewsRailProps {
  teamUid: string;
  teamName: string;
  initialData: ITeamNewsByTeamResponse;
}

export type TeamNewsUpvoteOverlay = Map<string, { viewerHasUpvoted: boolean; upvoteCount: number }>;

export function mergeUpvoteOverlay(items: ITeamNewsItem[], overlay: TeamNewsUpvoteOverlay): ITeamNewsItem[] {
  if (overlay.size === 0) return items;
  return items.map((item) => (overlay.has(item.uid) ? { ...item, ...overlay.get(item.uid) } : item));
}

export function TeamNewsRail({ teamUid, teamName, initialData }: TeamNewsRailProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const isMobile = useIsMobile();
  const { onTeamNewsCardClicked, onTeamNewsViewAllClicked, onTeamNewsUpvoteToggled } = useTeamNewsAnalytics();
  const { mutate: upvoteMutate } = useTeamNewsUpvoteToggle();

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
    [onTeamNewsUpvoteToggled, upvoteMutate],
  );

  const total = initialData.total;
  const previewItems = useMemo(
    () => mergeUpvoteOverlay(initialData.items.slice(0, TEAM_NEWS_PREVIEW_LIMIT), upvoteOverlay),
    [initialData.items, upvoteOverlay],
  );
  const hasMore = total > TEAM_NEWS_PREVIEW_LIMIT;

  const handleCardClick = useCallback(
    (item: ITeamNewsItem, position: number) => {
      onTeamNewsCardClicked(item, position, 'team-profile-rail');
    },
    [onTeamNewsCardClicked],
  );

  return (
    <>
      <aside className={s.rail}>
        <div className={s.railSpacer} aria-hidden="true" />
        <div className={s.newsPanel}>
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
                onUpvoteToggle={(toggled) => handleUpvoteToggle(toggled, index, 'team-profile-rail')}
              />
            ))}
          </div>
          {hasMore && (
            <button
              type="button"
              className={s.viewAll}
              onClick={() => {
                onTeamNewsViewAllClicked(teamUid, teamName, total);
                setModalOpen(true);
              }}
            >
              View all news ({total})
            </button>
          )}
        </div>
      </aside>

      <TeamNewsModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        teamUid={teamUid}
        teamName={teamName}
        total={total}
        fullscreen={isMobile}
        upvoteOverlay={upvoteOverlay}
        onUpvoteToggle={handleUpvoteToggle}
      />
    </>
  );
}
