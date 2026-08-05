'use client';

import clsx from 'clsx';

import type { ITeamNewsItem } from '@/types/team-news.types';

import v0 from '../newsfeed-v0/NewsfeedV0.module.scss';
import local from './NewsfeedCurated.module.scss';

import { MobileScrollRow } from './MobileScrollRow';
import { UPVOTES } from '../newsfeed-v0/mocks';

interface PopularScrollerProps {
  items: ITeamNewsItem[];
}

/**
 * "Popular this week" for sub-desktop widths.
 *
 * Same problem the follow module had: below 960px the rail stacks under the
 * whole feed, so this landed after six cards and the Show All button. Same fix,
 * same scroller — the rail rows' markup (`railStoryTitle` + `railReason`) moved
 * into the scroller's card shell, so the two surfaces read as one module at
 * either width rather than two different treatments of the same three stories.
 */
export function PopularScroller({ items }: PopularScrollerProps) {
  const open = (url: string) => window.open(url, '_blank', 'noopener,noreferrer');

  return (
    <MobileScrollRow title="Popular this week">
      {items.map((item) => (
        <button
          key={item.uid}
          type="button"
          className={clsx(local.followScrollCard, v0.railStory, local.popularScrollCard)}
          onClick={() => open(item.sourceUrl)}
        >
          <span className={v0.railStoryTitle}>{item.title}</span>
          <span className={v0.railReason}>
            ↑ {UPVOTES[item.uid] ?? 0} · {item.teamName}
          </span>
        </button>
      ))}
    </MobileScrollRow>
  );
}
