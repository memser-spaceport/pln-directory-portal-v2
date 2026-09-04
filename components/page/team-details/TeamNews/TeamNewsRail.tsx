'use client';

import clsx from 'clsx';
import { useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { DetailsSectionHeader } from '@/components/common/profile/DetailsSection';
import { useIsMobile } from '@/hooks/useIsMobile';
import { useTeamNewsAnalytics } from '@/analytics/team-news.analytics';
import { NewsDetailModal } from '@/components/page/home/TeamNews/components/NewsDetailModal';
import { useFeedCommentCounts } from '@/services/feed/hooks/useFeedCommentCounts';
import { useTeamNewsImpressions } from '@/services/team-news/hooks/useTeamNewsImpressions';
import { useCreateTeamNewsPost } from '@/services/team-news/hooks/useCreateTeamNewsPost';
import { useCurrentUserStore } from '@/services/auth/store';
import { TEAM_NEWS_PREVIEW_LIMIT } from '@/services/team-news/constants';
import type { ITeamNewsByTeamResponse, ITeamNewsItem } from '@/types/team-news.types';
import type { TeamStatus } from '@/types/teams.types';
import { isAdminUser } from '@/utils/user/isAdminUser';

import { TeamNewsCard } from './TeamNewsCard';
import { TeamNewsFeedLink } from './TeamNewsFeedLink';
import { TeamNewsModal } from './TeamNewsModal';
import { mergeUpvoteOverlay, type TeamNewsUpvoteOverlay } from './teamNewsUpvoteOverlay';
import { useTeamNewsUpvoteOverlay } from './useTeamNewsUpvoteOverlay';
import { NewsEmptyCard, PostNewsButton, PostNewsModal, type PostNewsSubmission } from './PostNewsModal';

import s from './TeamNewsRail.module.scss';
import postStyles from './PostNewsModal/PostNewsModal.module.scss';

interface TeamNewsRailProps {
  teamUid: string;
  teamName: string;
  initialData: ITeamNewsByTeamResponse;
  /** SSR hint — may be false when the login cookie has no rbac yet. */
  canPost?: boolean;
  isCurrentUserTeamMember?: boolean;
  teamStatus?: TeamStatus | null;
  memberUid?: string;
}

export { mergeUpvoteOverlay };
export type { TeamNewsUpvoteOverlay };

type NewsModalState = { kind: 'none' } | { kind: 'archive'; focusUid: string | null } | { kind: 'detail'; uid: string };

export function TeamNewsRail({
  teamUid,
  teamName,
  initialData,
  canPost = false,
  isCurrentUserTeamMember = false,
  teamStatus = 'ACTIVE',
  memberUid,
}: TeamNewsRailProps) {
  const [modalState, setModalState] = useState<NewsModalState>({ kind: 'none' });
  const [composeOpen, setComposeOpen] = useState(false);
  const [items, setItems] = useState<ITeamNewsItem[]>(initialData.items);
  const [total, setTotal] = useState(initialData.total);
  const [postedUid, setPostedUid] = useState<string | null>(null);
  const railListRef = useRef<HTMLDivElement>(null);

  const isMobile = useIsMobile();
  const { currentUser, isHydrated } = useCurrentUserStore();
  const { onTeamNewsCardClicked, onTeamNewsViewAllClicked, onTeamNewsShowMoreClicked } = useTeamNewsAnalytics();
  const createPost = useCreateTeamNewsPost(teamUid);

  const searchParams = useSearchParams();
  const highlightSection = searchParams.get('highlight') === 'news';

  const { upvoteOverlay, handleUpvoteToggle } = useTeamNewsUpvoteOverlay();
  const { recordVisible } = useTeamNewsImpressions();

  // Login cookies omit rbac; UserInfoChecker later fills the client store (same
  // source TeamDetails uses for admin chrome). Recompute here so empty-card /
  // Post news appear without relying on a stale SSR cookie.
  const canPostNow =
    teamStatus !== 'INACTIVE' &&
    (canPost || (isHydrated && !!currentUser?.uid && (isAdminUser(currentUser) || isCurrentUserTeamMember)));

  useEffect(() => {
    setItems(initialData.items);
    setTotal(initialData.total);
  }, [initialData.items, initialData.total]);

  useEffect(() => {
    if (!postedUid) return;
    const el = railListRef.current?.querySelector<HTMLElement>(`[data-story-uid="${CSS.escape(postedUid)}"]`);
    if (!el) return;
    el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    el.classList.add(postStyles.newsPosted);
    const timer = setTimeout(() => {
      el.classList.remove(postStyles.newsPosted);
      setPostedUid(null);
    }, 1500);
    return () => clearTimeout(timer);
  }, [postedUid]);

  const previewItems = useMemo(
    () => mergeUpvoteOverlay(items.slice(0, TEAM_NEWS_PREVIEW_LIMIT), upvoteOverlay),
    [items, upvoteOverlay],
  );
  const hasMore = total > TEAM_NEWS_PREVIEW_LIMIT;
  const hasNews = total > 0;

  const previewUids = useMemo(() => previewItems.map((item) => item.uid), [previewItems]);
  useFeedCommentCounts({ uids: previewUids, enabled: true });

  const handleCardClick = useCallback(
    (item: ITeamNewsItem, position: number) => {
      onTeamNewsCardClicked(item, position, 'team-profile-rail');
    },
    [onTeamNewsCardClicked],
  );

  const handleOpenDetail = useCallback(
    (item: ITeamNewsItem, position: number, via: 'row' | 'comments') => {
      if (via === 'comments') onTeamNewsCardClicked(item, position, 'team-profile-rail', 'comments');
      setModalState({ kind: 'detail', uid: item.uid });
    },
    [onTeamNewsCardClicked],
  );

  const handleShowMore = useCallback(
    (item: ITeamNewsItem, position: number) => {
      onTeamNewsShowMoreClicked(item, position);
      setModalState({ kind: 'detail', uid: item.uid });
    },
    [onTeamNewsShowMoreClicked],
  );

  const handlePublish = useCallback(
    async (post: PostNewsSubmission) => {
      const item = await createPost.mutateAsync({
        title: post.title,
        body: post.body || undefined,
        url: post.url,
      });
      setItems((prev) => [item, ...prev]);
      setTotal((prev) => prev + 1);
      setPostedUid(item.uid);
    },
    [createPost],
  );

  const detailItem =
    modalState.kind === 'detail' ? (previewItems.find((item) => item.uid === modalState.uid) ?? null) : null;

  const openCompose = () => setComposeOpen(true);
  const posterUid = memberUid || currentUser?.uid;

  if (!hasNews && !canPostNow) {
    return null;
  }

  return (
    <>
      <aside className={s.rail}>
        <div className={s.railSpacer} aria-hidden="true" />
        <div
          className={clsx(s.newsPanel, {
            [s.highlight]: highlightSection,
          })}
        >
          <DetailsSectionHeader title={hasNews ? `${teamName} News (${total})` : `${teamName} News`}>
            {canPostNow && hasNews && posterUid && (
              <PostNewsButton teamName={teamName} memberUid={posterUid} onPost={openCompose} />
            )}
          </DetailsSectionHeader>

          {canPostNow && !hasNews && <NewsEmptyCard onPost={openCompose} />}

          {hasNews && (
            <div className={s.newsList} ref={railListRef}>
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
                  onVisible={recordVisible}
                />
              ))}
            </div>
          )}

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

      {canPostNow && (
        <PostNewsModal
          open={composeOpen}
          onClose={() => setComposeOpen(false)}
          teamUid={teamUid}
          teamName={teamName}
          existing={items}
          onPublish={handlePublish}
          isPublishing={createPost.isPending}
        />
      )}

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
        recordVisible={recordVisible}
      />

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
