'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { Modal } from '@/components/common/Modal/Modal';
import { SearchInput } from '@/components/common/filters/SearchInput/SearchInput';
import { CloseIcon } from '@/components/core/UpdatesPanel/icons';
import { useDebounce } from '@/hooks/useDebounce';
import { useTeamNewsAnalytics, type TeamNewsAnalyticsSource } from '@/analytics/team-news.analytics';
import { NewsDetailBody, NEWS_DETAIL_TITLE_ID } from '@/components/page/home/TeamNews/components/NewsDetailModal';
import { useTeamNewsByTeamInfinite } from '@/services/team-news/hooks/useTeamNewsByTeam';
import type { ITeamNewsItem } from '@/types/team-news.types';

import { TeamNewsCard } from './TeamNewsCard';
import { TeamNewsFeedLink } from './TeamNewsFeedLink';
import { mergeUpvoteOverlay, type TeamNewsUpvoteOverlay } from './TeamNewsRail';
import { useNewsReveal } from './useNewsReveal';
import s from './TeamNewsRail.module.scss';

interface TeamNewsModalProps {
  isOpen: boolean;
  /** Rail "Show more": scroll to + flash this item once per open. Null opens at the top. */
  focusUid: string | null;
  onClose: () => void;
  teamUid: string;
  teamName: string;
  total: number;
  fullscreen?: boolean;
  /** Owned by TeamNewsRail so votes stay in sync between the rail and this view. */
  upvoteOverlay?: TeamNewsUpvoteOverlay;
  onUpvoteToggle?: (item: ITeamNewsItem, position: number, source: TeamNewsAnalyticsSource) => void;
}

export function TeamNewsModal({
  isOpen,
  focusUid,
  onClose,
  teamUid,
  teamName,
  total,
  fullscreen = false,
  upvoteOverlay,
  onUpvoteToggle,
}: TeamNewsModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  // The story this box has drilled into, if any. DRILLS, never stacks: clicking
  // a row swaps this same box to the story with Back on the left and Close still
  // on the right. A story modal opened on top would give the reader two close
  // buttons and an Escape key that means two things.
  const [storyUid, setStoryUid] = useState<string | null>(null);
  // Row to scroll back to and flash when Back returns to the list. A ref, not
  // state: the reveal has to wait for the list to remount, so it can't happen in
  // the click handler — and a state write from the effect that consumes it would
  // cascade a render for a value nothing renders (same call as revealConsumedRef).
  const backRevealUidRef = useRef<string | null>(null);
  // While the drilled story's share popover is open the Modal's own
  // Escape/backdrop closers are detached, so one gesture never dismisses both.
  const [shareOpen, setShareOpen] = useState(false);
  const debouncedQuery = useDebounce(searchQuery, 300);
  const effectiveQuery = searchQuery === '' ? '' : debouncedQuery;
  const sentinelRef = useRef<HTMLDivElement>(null);
  // The scrolling element: .modalBody on desktop, the .newsPage overlay on
  // mobile (.newsPageList doesn't scroll). Only one branch renders, so a single
  // ref serves both. Both are the cards' offsetParent — required by the
  // reveal's offsetTop math.
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  // Reveal at most once per open, attempted or not — items identity churns on
  // every upvote-overlay merge and page append, and a late page must not yank
  // the list to a uid the first attempt missed.
  const revealConsumedRef = useRef(false);
  const reveal = useNewsReveal();
  const { onTeamNewsCardClicked, onTeamNewsLoadMoreClicked } = useTeamNewsAnalytics();

  const {
    items: fetchedItems,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useTeamNewsByTeamInfinite({
    teamUid,
    q: effectiveQuery,
    enabled: isOpen,
  });

  const items = useMemo(
    () => (upvoteOverlay ? mergeUpvoteOverlay(fetchedItems, upvoteOverlay) : fetchedItems),
    [fetchedItems, upvoteOverlay],
  );

  const story = storyUid ? (items.find((item) => item.uid === storyUid) ?? null) : null;

  const handleClose = useCallback(() => {
    onClose();
    setSearchQuery('');
    setStoryUid(null);
  }, [onClose]);

  const handleCardClick = useCallback(
    (item: ITeamNewsItem, position: number) => {
      onTeamNewsCardClicked(item, position, 'team-profile-modal');
    },
    [onTeamNewsCardClicked],
  );

  const handleOpenDetail = useCallback(
    (item: ITeamNewsItem, position: number, via: 'row' | 'comments') => {
      // The row's own click already reported through `onClick`; only the comment
      // count is this handler's to record.
      if (via === 'comments') onTeamNewsCardClicked(item, position, 'team-profile-modal', 'comments');
      setStoryUid(item.uid);
    },
    [onTeamNewsCardClicked],
  );

  // Back leaves the search query alone: the filtered list is where the reader
  // was, so that's where Back returns them.
  const handleBack = useCallback(() => {
    backRevealUidRef.current = storyUid;
    setStoryUid(null);
  }, [storyUid]);

  useEffect(() => {
    if (!isOpen) {
      setSearchQuery('');
      setStoryUid(null);
      revealConsumedRef.current = false;
    }
  }, [isOpen]);

  // Returning from a story: put the reader back on the row they opened, flashed
  // the same way "Show more" used to flash its target. Runs once per return —
  // clearing the uid is what makes it a one-shot.
  useEffect(() => {
    const uid = backRevealUidRef.current;
    if (!uid || story) return;
    backRevealUidRef.current = null;
    const container = scrollContainerRef.current;
    const el = container?.querySelector<HTMLElement>(`[data-story-uid="${CSS.escape(uid)}"]`);
    // Not found (filtered out by a search typed before Back, or paged away):
    // land on the list at the top, no highlight, no error.
    if (container && el) reveal(el, container);
  }, [story, reveal]);

  const hasFirstPage = !isLoading && items.length > 0;

  useEffect(() => {
    if (!isOpen || !focusUid || revealConsumedRef.current) return;
    if (searchQuery !== '') {
      // Once the user touches search the "Show more" intent is stale — and
      // keepPreviousData keeps isLoading false over the *previous* query's
      // items, so a reveal here would flash a card in a list about to be
      // wholesale replaced. Abandon it for this open.
      revealConsumedRef.current = true;
      return;
    }
    if (!hasFirstPage) return;
    revealConsumedRef.current = true;
    const container = scrollContainerRef.current;
    const el = container?.querySelector<HTMLElement>(`[data-story-uid="${CSS.escape(focusUid)}"]`);
    // Not found (item deleted or reordered off page 1): open at the top,
    // no highlight, no error.
    if (container && el) reveal(el, container);
  }, [isOpen, focusUid, hasFirstPage, searchQuery, reveal]);

  useEffect(() => {
    if (!isOpen || !fullscreen) return;

    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [fullscreen, isOpen]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !isOpen) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasNextPage && !isFetchingNextPage) {
          onTeamNewsLoadMoreClicked(items.length, total, 'team-profile-modal', {
            teamUid,
            searchQuery: effectiveQuery,
          });
          fetchNextPage();
        }
      },
      { root: sentinel.parentElement, rootMargin: '120px' },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [
    effectiveQuery,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isOpen,
    items.length,
    onTeamNewsLoadMoreClicked,
    teamUid,
    total,
  ]);

  const feedContent = isLoading ? (
    <div className={s.modalLoading}>Loading news…</div>
  ) : items.length > 0 ? (
    <>
      <div className={fullscreen ? s.newsPageList : s.modalGrid}>
        {items.map((item, index) => (
          <TeamNewsCard
            key={item.uid}
            item={item}
            position={index}
            variant="outline"
            fullSummary
            analyticsSource="team-profile-modal"
            onClick={(clicked) => handleCardClick(clicked, index)}
            onUpvoteToggle={
              onUpvoteToggle ? (toggled) => onUpvoteToggle(toggled, index, 'team-profile-modal') : undefined
            }
            onOpenDetail={(clicked, via) => handleOpenDetail(clicked, index, via)}
          />
        ))}
      </div>
      <div ref={sentinelRef} className={s.modalSentinel} aria-hidden="true" />
      {isFetchingNextPage && <div className={s.modalLoading}>Loading more…</div>}
    </>
  ) : (
    <div className={fullscreen ? s.newsPageEmpty : s.modalEmpty}>
      {debouncedQuery ? `No news matches “${effectiveQuery}”.` : 'No news found.'}
    </div>
  );

  // The drilled story, wearing this box's chrome: Back leads its header, Close
  // stays where it was. Rendered by both shells from one definition so a story
  // reads identically on desktop and on the full-page mobile view.
  const storyContent = story && (
    <NewsDetailBody
      item={story}
      onClose={handleClose}
      onBack={handleBack}
      onUpvoteToggle={(item) =>
        onUpvoteToggle?.(
          item,
          items.findIndex((listItem) => listItem.uid === item.uid),
          'team-profile-modal',
        )
      }
      source="team-profile-modal"
      onShareOpenChange={setShareOpen}
    />
  );

  if (fullscreen) {
    if (!isOpen) return null;

    // The page keeps its shell and swaps its body — the story draws its own
    // Back-led header, so this one steps aside rather than stacking two.
    if (storyContent) return <div className={s.newsPage}>{storyContent}</div>;

    return (
      <div className={s.newsPage} ref={scrollContainerRef}>
        <div className={s.newsPageHeader}>
          <div className={s.newsPageTitleRow}>
            <h2 className={s.newsPageTitle}>{teamName} News</h2>
            {total > 0 && (
              <div className={s.newsPageBadge}>
                <span className={s.newsPageBadgeText}>{total}</span>
              </div>
            )}
          </div>
          <button type="button" className={s.newsPageClose} onClick={handleClose} aria-label="Close">
            <CloseIcon />
          </button>
        </div>

        <div className={s.newsPageSearch}>
          <SearchInput value={searchQuery} onChange={setSearchQuery} placeholder="Search news by keyword or type" />
        </div>

        {feedContent}

        <div className={s.modalFooter}>
          <TeamNewsFeedLink teamUid={teamUid} teamName={teamName} source="team-profile-modal" variant="solo" />
        </div>
      </div>
    );
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      className={s.newsModal}
      ariaLabelledBy={story ? NEWS_DETAIL_TITLE_ID : undefined}
      closeOnEscape={!shareOpen}
      closeOnBackdropClick={!shareOpen}
    >
      {storyContent ?? (
        <>
          <div className={s.modalHeader}>
            <span className={s.modalTitle}>
              {teamName} News ({total})
            </span>
            <button type="button" className={s.modalClose} onClick={handleClose} aria-label="Close">
              <ModalCloseIcon />
            </button>
          </div>
          <div className={s.modalSearchWrap}>
            <SearchInput value={searchQuery} onChange={setSearchQuery} placeholder="Search news by keyword or type" />
          </div>
          <div className={s.modalBody} ref={scrollContainerRef}>
            {feedContent}
          </div>
          {/* The way out of the archive that isn't Close: this box answers "what
              has this team been doing" but closes off "and what else happened",
              so the feed stays one click away. */}
          <div className={s.modalFooter}>
            <TeamNewsFeedLink teamUid={teamUid} teamName={teamName} source="team-profile-modal" variant="solo" />
          </div>
        </>
      )}
    </Modal>
  );
}

const ModalCloseIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M15 5L5 15M5 5l10 10"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);
