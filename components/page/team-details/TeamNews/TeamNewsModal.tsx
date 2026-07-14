'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { Modal } from '@/components/common/Modal/Modal';
import { SearchInput } from '@/components/common/filters/SearchInput/SearchInput';
import { CloseIcon } from '@/components/core/UpdatesPanel/icons';
import { useDebounce } from '@/hooks/useDebounce';
import { useTeamNewsAnalytics, type TeamNewsAnalyticsSource } from '@/analytics/team-news.analytics';
import { useTeamNewsByTeamInfinite } from '@/services/team-news/hooks/useTeamNewsByTeam';
import type { ITeamNewsItem } from '@/types/team-news.types';

import { TeamNewsCard } from './TeamNewsCard';
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

  const handleClose = useCallback(() => {
    onClose();
    setSearchQuery('');
  }, [onClose]);

  const handleCardClick = useCallback(
    (item: ITeamNewsItem, position: number) => {
      onTeamNewsCardClicked(item, position, 'team-profile-modal');
    },
    [onTeamNewsCardClicked],
  );

  useEffect(() => {
    if (!isOpen) {
      setSearchQuery('');
      revealConsumedRef.current = false;
    }
  }, [isOpen]);

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

  if (fullscreen) {
    if (!isOpen) return null;

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
      </div>
    );
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} className={s.newsModal}>
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
