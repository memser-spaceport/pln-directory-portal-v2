'use client';

import { useEffect, useRef } from 'react';

import type { ITeamNewsItem } from '@/types/team-news.types';
import { SearchInput } from '@/components/common/filters/SearchInput';
import { CloseIcon } from '@/components/core/UpdatesPanel/icons';

import { NewsCardView } from './NewsCardView';
import { FeedDetailBody, type FeedDetail } from '../newsfeed-v0/FeedDetailModal';
import type { FeedComment } from '../newsfeed-v0/mocks';
import detailCss from '../newsfeed-v0/FeedDetailModal.module.scss';
import s from './TeamProfile.module.scss';

interface Props {
  title: string;
  count: number;
  items: ITeamNewsItem[];
  /** When set, scroll to + flash this item on open (rail "Show more"). */
  focusUid?: string | null;
  query: string;
  onQueryChange: (value: string) => void;
  onClose: () => void;
  /** Like state lives in TeamProfilePrototype so rail + feed stay in sync. */
  viewsFor: (uid: string) => number;
  likesFor: (uid: string) => number;
  commentsFor: (uid: string) => number;
  likedNews: Set<string>;
  onToggleLike: (uid: string) => void;
  /**
   * Opens one story in the shared FeedDetailModal, over this page.
   *
   * Without it `NewsCardView` falls back to `window.open(sourceUrl)` — so the
   * one surface built for reading a team's news was the one that threw you
   * off-site. A modal over a page is the pattern every other news surface uses;
   * it only works here because this is a page and not itself a modal.
   */
  onOpenStory?: (item: ITeamNewsItem) => void;
  /** The story drilled into, if any — replaces the search band and the list. */
  story?: FeedDetail | null;
  onBack?: () => void;
  storyComments?: FeedComment[];
  onAddStoryComment?: (text: string, parentUid?: string) => void;
  isCommentLiked?: (commentUid: string) => boolean;
  onToggleCommentLike?: (commentUid: string) => void;
}

/**
 * The full-screen "All news" page — one team's complete archive, searchable.
 *
 * Mirrors the production Notifications mobile page (full-height white page,
 * sticky header, full-width rows with dividers) but lists team news instead of
 * notifications, and constrains to a centred column on wide screens.
 *
 * A page at every width, deliberately. It used to be this on mobile and a Modal
 * on desktop, which meant two implementations of one view and — worse — no way
 * to open a story from the desktop one without stacking a modal on a modal. As
 * a page it just takes the story modal on top, like the feed and the rail do.
 */
export function NewsFullPageView({
  title,
  count,
  items,
  focusUid,
  query,
  onQueryChange,
  onClose,
  viewsFor,
  likesFor,
  commentsFor,
  likedNews,
  onToggleLike,
  onOpenStory,
  story,
  onBack,
  storyComments = [],
  onAddStoryComment,
  isCommentLiked,
  onToggleCommentLike,
}: Props) {
  const listRef = useRef<HTMLDivElement>(null);

  // The page behaves like a route push — lock the body scroll behind it.
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  // Focused open (rail "Show more"): scroll that item into view and flash it.
  useEffect(() => {
    if (!focusUid) return;
    const el = listRef.current?.querySelector<HTMLElement>(`[data-news-uid="${focusUid}"]`);
    if (!el) return;
    const raf = requestAnimationFrame(() => {
      el.scrollIntoView({ block: 'center' });
      el.classList.add(s.newsHighlight);
    });
    const timer = setTimeout(() => el.classList.remove(s.newsHighlight), 1500);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(timer);
    };
    // Skipped while a story is open — the list isn't mounted to scroll.
  }, [focusUid, story]);

  /**
   * Drilled into a story: the page keeps its shell and swaps its body, matching
   * what the desktop modal does. The body draws its own Back-led header, so this
   * one steps aside rather than stacking two headers.
   */
  if (story) {
    return (
      <div className={s.newsPage}>
        <FeedDetailBody
          detail={story}
          onClose={onClose}
          onBack={onBack}
          className={detailCss.embedded}
          citationStyle="off"
          showComments
          likeCount={likesFor(story.id)}
          liked={likedNews.has(story.id)}
          onToggleLike={() => onToggleLike(story.id)}
          comments={storyComments}
          onAddComment={onAddStoryComment}
          isCommentLiked={isCommentLiked}
          onToggleCommentLike={onToggleCommentLike}
        />
      </div>
    );
  }

  return (
    <div className={s.newsPage}>
      <div className={s.newsPageHeader}>
        <div className={s.newsPageTitleRow}>
          <h2 className={s.newsPageTitle}>{title}</h2>
          {count > 0 && (
            <div className={s.newsPageBadge}>
              <span className={s.newsPageBadgeText}>{count}</span>
            </div>
          )}
        </div>
        <button type="button" className={s.newsPageClose} onClick={onClose} aria-label="Close">
          <CloseIcon />
        </button>
      </div>

      <div className={s.newsPageSearch}>
        <SearchInput value={query} onChange={onQueryChange} placeholder="Search news by keyword or type" />
      </div>

      {items.length > 0 ? (
        <div className={s.newsPageList} ref={listRef}>
          {items.map((item) => (
            <NewsCardView
              key={item.uid}
              item={item}
              hideTeam
              fullSummary
              views={viewsFor(item.uid)}
              likes={likesFor(item.uid)}
              liked={likedNews.has(item.uid)}
              comments={commentsFor(item.uid)}
              onToggleLike={() => onToggleLike(item.uid)}
              // Tap, "Show more" and the comment count are three ways of asking
              // for the same thing — this story, in full — exactly as on the rail.
              onShowMore={onOpenStory && (() => onOpenStory(item))}
              onOpenComments={onOpenStory && (() => onOpenStory(item))}
            />
          ))}
        </div>
      ) : (
        <div className={s.newsPageEmpty}>No news matches “{query}”.</div>
      )}
    </div>
  );
}
