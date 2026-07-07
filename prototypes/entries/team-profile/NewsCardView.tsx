'use client';

import type { ITeamNewsItem, TeamNewsEventType } from '@/types/team-news.types';
import { formatTimeAgo } from '@/utils/formatTimeAgo';
import { getTeamLogoFallback } from '@/components/page/home/TeamNews/utils/getTeamLogoFallback';

// Reuse the production news-card styling 1:1.
import n from '@/components/page/home/TeamNews/components/NewsCard/NewsCard.module.scss';
import s from './TeamProfile.module.scss';

/**
 * Copy-simplified from the homepage NewsCard. The production card embeds
 * `StartConversationButton`, which is store/forum-access/analytics bound, so we
 * swap it for a plain "Discuss" link and keep everything else identical.
 */

const EVENT_TYPE_LABEL: Record<TeamNewsEventType, string> = {
  FUNDING: 'Funding',
  LAUNCH: 'Launch',
  PARTNERSHIP: 'Partnership',
  ANNOUNCEMENT: 'Announcement',
  MILESTONE: 'Milestone',
  OTHER: 'Other',
};

const EVENT_TYPE_DOT_CLASS: Record<TeamNewsEventType, string> = {
  FUNDING: n.dotFunding,
  LAUNCH: n.dotLaunch,
  PARTNERSHIP: n.dotPartnership,
  ANNOUNCEMENT: n.dotAnnouncement,
  MILESTONE: n.dotMilestone,
  OTHER: n.dotOther,
};

export function NewsCardView({ item, flat, hideTeam }: { item: ITeamNewsItem; flat?: boolean; hideTeam?: boolean }) {
  const open = () => window.open(item.sourceUrl, '_blank', 'noopener,noreferrer');

  return (
    <div role="link" tabIndex={0} className={`${n.card} ${flat ? s.flatNews : s.cardOutline}`} onClick={open}>
      {/* On the team's own profile the news is all from this team, so the team
          row is redundant — hide it. The modal / full feed keeps it. */}
      {!hideTeam && (
        <div className={n.head}>
          {item.teamLogoUrl ? (
            <img className={n.logo} src={item.teamLogoUrl} alt="" loading="lazy" />
          ) : (
            <div className={n.logoFallback}>{getTeamLogoFallback(item.teamName)}</div>
          )}
          <span className={n.teamName}>{item.teamName}</span>
        </div>
      )}

      <h3 className={n.headline}>{item.title}</h3>

      <div className={n.metaLine}>
        <div className={n.meta}>
          <span className={n.eventType}>
            <span className={`${n.eventDot} ${EVENT_TYPE_DOT_CLASS[item.eventType]}`} aria-hidden="true" />
            <span className={n.eventLabel}>{EVENT_TYPE_LABEL[item.eventType]}</span>
          </span>
          {item.sourceDomain && (
            <>
              <span className={n.sep} aria-hidden="true" />
              <span className={n.source}>{item.sourceDomain}</span>
            </>
          )}
          <span className={n.sep} aria-hidden="true" />
          <span className={n.time}>{formatTimeAgo(item.eventDate)}</span>
        </div>
        <button type="button" className={s.discuss} onClick={(e) => e.stopPropagation()}>
          Discuss
          <ArrowRight />
        </button>
      </div>
    </div>
  );
}

const ArrowRight = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="11" height="10" viewBox="0 0 11 10" fill="none">
    <path
      d="M10.7455 5.06028L6.80805 8.99778C6.68476 9.12106 6.51755 9.19032 6.3432 9.19032C6.16885 9.19032 6.00164 9.12106 5.87836 8.99778C5.75508 8.8745 5.68582 8.70729 5.68582 8.53294C5.68582 8.35859 5.75508 8.19138 5.87836 8.06809L8.69531 5.25223H0.65625C0.482202 5.25223 0.315282 5.18309 0.192211 5.06002C0.0691404 4.93695 0 4.77003 0 4.59598C0 4.42193 0.0691404 4.25501 0.192211 4.13194C0.315282 4.00887 0.482202 3.93973 0.65625 3.93973H8.69531L5.87945 1.12223C5.75617 0.998948 5.68691 0.831738 5.68691 0.657388C5.68691 0.483038 5.75617 0.315829 5.87945 0.192544C6.00274 0.0692602 6.16995 1.83708e-09 6.3443 0C6.51865 0 6.68586 0.0692602 6.80914 0.192544L10.7466 4.13004C10.8078 4.19109 10.8564 4.26363 10.8894 4.34349C10.9225 4.42335 10.9395 4.50895 10.9394 4.59539C10.9393 4.68183 10.9221 4.76739 10.8888 4.84717C10.8556 4.92695 10.8069 4.99937 10.7455 5.06028Z"
      fill="currentColor"
    />
  </svg>
);
