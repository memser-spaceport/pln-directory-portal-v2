'use client';

import type { ITeamNewsItem } from '@/types/team-news.types';
import { useTeamNewsAnalytics } from '@/analytics/team-news.analytics';

import s from '../../NewsRail.module.scss';

interface PopularThisWeekCardProps {
  items: ITeamNewsItem[];
}

// Read-only — tapping a story just opens its source link, per ticket scope
// (no upvote action from the rail). Hidden entirely when `items` is empty;
// `getPopularThisWeek` is what decides that emptiness (7-day window, >=2
// upvotes on the top story), this component just renders whatever it's given.
export function PopularThisWeekCard({ items }: PopularThisWeekCardProps) {
  const analytics = useTeamNewsAnalytics();

  if (items.length === 0) return null;

  const openStory = (item: ITeamNewsItem, position: number) => {
    analytics.onTeamNewsPopularStoryClicked(item, position);
    window.open(item.sourceUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <section className={s.railCard} aria-label="Popular this week">
      <h3 className={s.railTitle}>Popular this week</h3>
      {items.map((item, position) => (
        <button key={item.uid} type="button" className={s.railStory} onClick={() => openStory(item, position)}>
          <span className={s.railStoryTitle}>{item.title}</span>
          <span className={s.railReason}>
            ↑ {item.upvoteCount ?? 0} · {item.teamName}
          </span>
        </button>
      ))}
    </section>
  );
}
