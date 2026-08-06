'use client';

import type { ITeamNewsPopularItem } from '@/types/team-news.types';

import { MobileScrollRow } from './MobileScrollRow';
import s from './FeedScrollers.module.scss';

interface PopularScrollerProps {
  items: ITeamNewsPopularItem[];
  onPopularItemClick: (item: ITeamNewsPopularItem, position: number) => void;
}

/**
 * "Popular this week" for sub-desktop widths.
 *
 * Same problem the follow module had: below 1200px the rail stacks under the
 * whole feed, so this landed after six cards and the Show All button. Same fix,
 * same scroller shell — and the same click handler as the rail card, so a tap
 * still reveals the story in the feed rather than opening its source link.
 */
export function PopularScroller({ items, onPopularItemClick }: PopularScrollerProps) {
  if (items.length === 0) return null;

  return (
    <MobileScrollRow title="Popular this week">
      {items.map((item, position) => (
        <button
          key={item.uid}
          type="button"
          className={`${s.card} ${s.storyCard}`}
          onClick={() => onPopularItemClick(item, position)}
        >
          <span className={s.storyTitle}>{item.title}</span>
          <span className={s.cardReason}>
            ↑ {item.upvoteCount ?? 0} · {item.teamName}
          </span>
        </button>
      ))}
    </MobileScrollRow>
  );
}
