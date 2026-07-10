'use client';

import { useEffect } from 'react';

import type { ITeamNewsItem } from '@/types/team-news.types';
import { SearchInput } from '@/components/common/filters/SearchInput';
import { CloseIcon } from '@/components/core/UpdatesPanel/icons';

import { NewsCardView } from './NewsCardView';
import s from './TeamProfile.module.scss';

interface Props {
  title: string;
  count: number;
  items: ITeamNewsItem[];
  query: string;
  onQueryChange: (value: string) => void;
  onClose: () => void;
  /** Upvote state lives in TeamProfilePrototype so rail + feed stay in sync. */
  upvotesFor: (uid: string) => number;
  votedNews: Set<string>;
  onToggleUpvote: (uid: string) => void;
}

/**
 * Mobile-only full-screen "All news" page. Mirrors the production Notifications
 * mobile page (full-height white page, sticky header, full-width rows with
 * dividers) but lists team news instead of notifications. On desktop the same
 * "View all news" action opens a modal — see TeamProfilePrototype.
 */
export function NewsFullPageView({
  title,
  count,
  items,
  query,
  onQueryChange,
  onClose,
  upvotesFor,
  votedNews,
  onToggleUpvote,
}: Props) {
  // The page behaves like a route push — lock the body scroll behind it.
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

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
        <div className={s.newsPageList}>
          {items.map((item) => (
            <NewsCardView
              key={item.uid}
              item={item}
              hideTeam
              upvotes={upvotesFor(item.uid)}
              voted={votedNews.has(item.uid)}
              onToggleUpvote={() => onToggleUpvote(item.uid)}
            />
          ))}
        </div>
      ) : (
        <div className={s.newsPageEmpty}>No news matches “{query}”.</div>
      )}
    </div>
  );
}
