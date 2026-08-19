'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { Modal } from '@/components/common/Modal/Modal';
import { SearchInput } from '@/components/common/filters/SearchInput/SearchInput';
import { CloseIcon } from '@/components/core/UpdatesPanel/icons';
import { useDebounce } from '@/hooks/useDebounce';
import {
  useTeamNewsAnalytics,
  type TeamNewsAnalyticsSource,
  type TeamNewsFeedLinkSource,
} from '@/analytics/team-news.analytics';
import { NewsDetailBody, NEWS_DETAIL_TITLE_ID } from '@/components/page/home/TeamNews/components/NewsDetailModal';
import { useFeedCommentCounts } from '@/services/feed/hooks/useFeedCommentCounts';
import { useTeamNewsByTeamInfinite } from '@/services/team-news/hooks/useTeamNewsByTeam';
import type { ITeamNewsItem } from '@/types/team-news.types';

import { TeamNewsCard } from './TeamNewsCard';
import { TeamNewsFeedLink } from './TeamNewsFeedLink';
import { mergeUpvoteOverlay, type TeamNewsUpvoteOverlay } from './teamNewsUpvoteOverlay';
import { useNewsReveal } from './useNewsReveal';
import s from './TeamNewsRail.module.scss';

interface TeamNewsModalProps {
  isOpen: boolean;
  /** Rail "Show more": scroll to + flash this item once per open. Null opens at the top. */
  focusUid: string | null;
  onClose: () => void;
  teamUid: string;
  teamName: string;
  /**
   * The archive's size, for the header.
   *
   * Optional because the surfaces that open this from a listing card don't know
   * it — the "N new posts" chip counts a 30-day window, not the whole archive,
   * and passing that here would put "(3)" over 47 rows. Omit it and the modal
   * latches the figure from its own first unfiltered fetch instead.
   *
   * The team profile still passes it: the rail already has the number, and
   * handing it over means the header is right on the first paint rather than
   * after a round trip.
   */
  total?: number;
  fullscreen?: boolean;
  /**
   * Which surface this modal was opened from, for analytics. Defaults to the
   * team profile because that is where it started; the teams grid and the job
   * board pass their own so the events don't all claim to be profile traffic.
   *
   * Narrower than TeamNewsAnalyticsSource on purpose — only surfaces that carry
   * the "All network updates" exit can open this box, and the footer link's own
   * prop is typed the same way. 'home' here would be a lie no reviewer would
   * catch.
   */
  source?: TeamNewsFeedLinkSource;
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
  source = 'team-profile-modal',
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
    total: fetchedTotal,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useTeamNewsByTeamInfinite({
    teamUid,
    q: effectiveQuery,
    enabled: isOpen,
  });

  // The archive's size, captured ONCE from the first unfiltered fetch of this
  // open (reset on close).
  //
  // The hook's `total` is page 1's total for the CURRENT query, so reading it
  // live would make the header count down as the reader types. The title names
  // the whole archive, so it has to hold still while the list narrows — a number
  // shrinking as you search is the search reporting itself twice, and the second
  // report lands in the one line that is supposed to say where you are.
  //
  // First-wins rather than last-unfiltered-wins, because `effectiveQuery` lags
  // `searchQuery` by the debounce: on CLEARING a search it returns to '' while
  // the hook is still serving the filtered page, and a plain assignment would
  // latch that narrowed total. The archive's size doesn't change while a reader
  // is looking at it, so the first answer is the right one to keep.
  //
  // Adjusted during render rather than in an effect — React's own alternative
  // when state is derived from fetched data. React re-runs this component before
  // anything commits, so there is no second render to cascade from.
  //
  // Callers that already know the total (the team profile) pass it and never
  // reach this.
  const [latchedTotal, setLatchedTotal] = useState<number | null>(null);
  if (latchedTotal === null && effectiveQuery === '' && fetchedTotal > 0) {
    setLatchedTotal(fetchedTotal);
  }
  const displayTotal = total ?? latchedTotal ?? 0;

  const items = useMemo(
    () => (upvoteOverlay ? mergeUpvoteOverlay(fetchedItems, upvoteOverlay) : fetchedItems),
    [fetchedItems, upvoteOverlay],
  );

  // Counts for whatever the archive has loaded. The list grows a page at a time
  // and the shared entry is filled incrementally, so each page costs one request
  // for its own uids — the rail's three, already asked for, are not re-fetched.
  const listedUids = useMemo(() => items.map((item) => item.uid), [items]);
  useFeedCommentCounts({ uids: listedUids, enabled: isOpen });

  const story = storyUid ? (items.find((item) => item.uid === storyUid) ?? null) : null;

  const handleClose = useCallback(() => {
    onClose();
    setSearchQuery('');
    setStoryUid(null);
  }, [onClose]);

  const handleCardClick = useCallback(
    (item: ITeamNewsItem, position: number) => {
      onTeamNewsCardClicked(item, position, source);
    },
    [onTeamNewsCardClicked, source],
  );

  const handleOpenDetail = useCallback(
    (item: ITeamNewsItem, position: number, via: 'row' | 'comments') => {
      // The row's own click already reported through `onClick`; only the comment
      // count is this handler's to record.
      if (via === 'comments') onTeamNewsCardClicked(item, position, source, 'comments');
      setStoryUid(item.uid);
    },
    [onTeamNewsCardClicked, source],
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
      setLatchedTotal(null);
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
          onTeamNewsLoadMoreClicked(items.length, displayTotal, source, {
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
    displayTotal,
    source,
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
            analyticsSource={source}
            onClick={(clicked) => handleCardClick(clicked, index)}
            onUpvoteToggle={onUpvoteToggle ? (toggled) => onUpvoteToggle(toggled, index, source) : undefined}
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
          source,
        )
      }
      source={source}
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
            {displayTotal > 0 && (
              <div className={s.newsPageBadge}>
                <span className={s.newsPageBadgeText}>{displayTotal}</span>
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
          <TeamNewsFeedLink teamUid={teamUid} teamName={teamName} source={source} variant="solo" />
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
              {teamName} News ({displayTotal})
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
            <TeamNewsFeedLink teamUid={teamUid} teamName={teamName} source={source} variant="solo" />
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
