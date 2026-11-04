'use client';

import clsx from 'clsx';

import type { ITeamNewsPopularItem } from '@/types/team-news.types';
import { getTeamLogoFallback } from '@/components/page/home/TeamNews/utils/getTeamLogoFallback';

import s from '@/components/page/home/TeamNews/components/NewsRail/NewsRail.module.scss';
import local from './HomeV2B.module.scss';

export type PopularRailItem = ITeamNewsPopularItem & { teamLogoUrl?: string | null };

/**
 * Copy of production `PopularThisWeekCard` (NewsRail/components/PopularThisWeekCard)
 * with the team's logo leading each row: the same railLogo / railLogoFallback
 * Teams to follow uses, so the two rail cards share one row anatomy. Dropped:
 * framer-motion's exit (nothing leaves this list in the prototype).
 */
export function PopularThisWeekRail({
  items,
  onPopularItemClick,
}: {
  items: PopularRailItem[];
  onPopularItemClick: (item: PopularRailItem, position: number) => void;
}) {
  if (items.length === 0) return null;

  return (
    <section className={s.railCard} aria-label="Popular this week">
      <h3 className={s.railTitle}>Popular this week</h3>
      {items.map((item, position) => (
        <button
          key={item.uid}
          type="button"
          className={clsx(s.railStory, local.popularRow)}
          onClick={() => onPopularItemClick(item, position)}
        >
          {item.teamLogoUrl ? (
            <img className={s.railLogo} src={item.teamLogoUrl} alt="" loading="lazy" />
          ) : (
            <span className={s.railLogoFallback}>{getTeamLogoFallback(item.teamName)}</span>
          )}
          <span className={s.railInfo}>
            <span className={s.railStoryTitle}>{item.title}</span>
            <span className={s.railReason}>
              ↑ {item.upvoteCount ?? 0} · {item.teamName}
            </span>
          </span>
        </button>
      ))}
    </section>
  );
}
