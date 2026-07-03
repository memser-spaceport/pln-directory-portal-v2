'use client';

import { formatTimeAgo } from '@/utils/formatTimeAgo';
import type { ITeamNewsItem } from '@/types/team-news.types';

import { getTeamLogoFallback } from '@/components/page/home/TeamNews/components/NewsCard/utils/getTeamLogoFallback';
import { hasExistingDiscussion } from '@/components/page/home/TeamNews/components/NewsCard/components/StartConversationButton/utils/hasExistingDiscussion';
import { ArrowRight } from '@/components/page/home/TeamNews/components/NewsCard/components/StartConversationButton/components/Icons';

import { Button } from '@/components/common/Button';

// Reuse the production news-card styling 1:1.
import s from '@/components/page/home/TeamNews/components/NewsCard/NewsCard.module.scss';
import sc from '@/components/page/home/TeamNews/components/NewsCard/components/StartConversationButton/StartConversationButton.module.scss';

import { EVENT_TYPE_DOT_CLASS, EVENT_TYPE_LABEL } from './eventMeta';

/**
 * Exact copy of the production `NewsCard` (default variant). The only change:
 * the production `StartConversationButton` is store / forum-access / analytics
 * bound, so its rendered output (same Button, same label logic, same SCSS) is
 * inlined here with the navigation stubbed out.
 */
export function CurrentNewsCard({ item }: { item: ITeamNewsItem }) {
  const handleClick = () => window.open(item.sourceUrl, '_blank', 'noopener,noreferrer');
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  };

  const existing = hasExistingDiscussion(item.discussion);
  const label = existing ? 'Join discussion' : 'Discuss';
  const a11y = existing
    ? 'Join the existing forum discussion about this article'
    : 'Start a conversation on the forum';

  return (
    <div role="link" tabIndex={0} className={s.card} onClick={handleClick} onKeyDown={handleKeyDown}>
      <div className={s.head}>
        {item.teamLogoUrl ? (
          <img className={s.logo} src={item.teamLogoUrl} alt="" loading="lazy" />
        ) : (
          <div className={s.logoFallback}>{getTeamLogoFallback(item.teamName)}</div>
        )}
        <a
          href={`/teams/${item.teamUid}`}
          target="_blank"
          rel="noopener noreferrer"
          className={s.teamName}
          onClick={(e) => e.stopPropagation()}
        >
          {item.teamName}
        </a>
      </div>
      <h3 className={s.headline}>{item.title}</h3>

      <div className={s.metaLine}>
        <div className={s.meta}>
          <span className={s.eventType}>
            <span className={`${s.eventDot} ${EVENT_TYPE_DOT_CLASS[item.eventType]}`} aria-hidden="true" />
            <span className={s.eventLabel}>{EVENT_TYPE_LABEL[item.eventType]}</span>
          </span>
          {item.sourceDomain && (
            <>
              <span className={s.sep} aria-hidden="true" />
              <span className={s.source}>{item.sourceDomain}</span>
            </>
          )}
          <span className={s.sep} aria-hidden="true" />
          <span className={s.time}>{formatTimeAgo(item.eventDate)}</span>
        </div>
        <Button
          size="xs"
          style="link"
          variant="primary"
          title={a11y}
          aria-label={a11y}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          className={sc.discussLink}
        >
          {label}
          <ArrowRight />
        </Button>
      </div>
    </div>
  );
}
