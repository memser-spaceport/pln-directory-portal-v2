'use client';

import clsx from 'clsx';

import { formatTimeAgo } from '@/utils/formatTimeAgo';
import type { ITeamNewsItem } from '@/types/team-news.types';

import { Badge } from '@/components/common/Badge';
import { getTeamLogoFallback } from '@/components/page/home/TeamNews/utils/getTeamLogoFallback';
import { getEventTypeConfig } from '@/components/page/home/TeamNews/utils/getEventTypeConfig';

// Reuse the production news-card styling 1:1.
import s from '@/components/page/home/TeamNews/components/NewsCard/NewsCard.module.scss';
import local from './NewsfeedDiscovery.module.scss';

interface DiscoveryNewsCardProps {
  item: ITeamNewsItem;
  /** Published since `newsLastSeenAt` *and* the tags aren't suppressed. */
  showNewTag: boolean;
}

/**
 * Copy-simplify of the production `NewsCard`. The real one reads the auth store
 * and the router (for the signed-out follow/upvote redirects) and renders the
 * multi-source popover; none of that bears on the signal being tested, so this
 * keeps the head / headline / summary / meta structure and drops the rest. All
 * sizing and colour come from the production module — the only addition is the
 * "New" tag.
 */
export function DiscoveryNewsCard({ item, showNewTag }: DiscoveryNewsCardProps) {
  const { label: eventTypeLabel, dotClassName: eventTypeDotClassName } = getEventTypeConfig(item.eventType);

  return (
    <div className={s.card}>
      <div className={s.head}>
        {item.teamLogoUrl ? (
          <img className={s.logo} src={item.teamLogoUrl} alt="" loading="lazy" />
        ) : (
          <div className={s.logoFallback}>{getTeamLogoFallback(item.teamName)}</div>
        )}
        <span className={s.teamName}>{item.teamName}</span>

        {/* Right-aligned so every tag in the list lands on the same edge — a
            scan column. Team names vary in length, so tagging next to the name
            would put the mark at a different x on every card, which is exactly
            what makes a list hard to skim. It's a `Badge` (variant="brand"),
            sized down locally; a "chip" here is not a new component. */}
        {showNewTag && (
          <Badge variant="brand" className={local.newTag}>
            New
          </Badge>
        )}
      </div>

      <h3 className={s.headline}>{item.title}</h3>
      {item.summary && <p className={s.summary}>{item.summary}</p>}

      <div className={s.metaLine}>
        <div className={s.meta}>
          <span className={s.eventType}>
            <span className={clsx(s.eventDot, eventTypeDotClassName)} aria-hidden="true" />
            <span className={s.eventLabel}>{eventTypeLabel}</span>
          </span>
          {item.sourceDomain && (
            <>
              <span className={s.sep} aria-hidden="true" />
              <span className={s.time}>{item.sourceDomain}</span>
            </>
          )}
          <span className={s.sep} aria-hidden="true" />
          <span className={s.time}>{formatTimeAgo(item.eventDate)}</span>
        </div>
      </div>
    </div>
  );
}
