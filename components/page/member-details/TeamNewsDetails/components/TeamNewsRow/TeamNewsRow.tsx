import type { KeyboardEvent } from 'react';

import { CommentIcon, ThumbsUpOutlinedIcon } from '@/components/icons';
import { useFeedCommentCount } from '@/services/feed/hooks/useFeedCommentCounts';
import { formatTimeAgo } from '@/utils/formatTimeAgo';
import type { ITeamNewsItem } from '@/types/team-news.types';

import s from './TeamNewsRow.module.scss';

interface TeamNewsRowProps {
  item: ITeamNewsItem;
  onOpen: (item: ITeamNewsItem) => void;
}

export function TeamNewsRow({ item, onOpen }: TeamNewsRowProps) {
  // '' for empty, unparseable AND future dates — by design, so "in 3 weeks ago"
  // can never render. Future eventDates are real (upcoming-event stories), so
  // the element is omitted rather than rendered empty: an empty span leaves a
  // gap sighted readers see and a dangling fragment screen readers announce.
  const timeAgo = formatTimeAgo(item.eventDate);

  // The jest useQuery mock ignores `select`, so this returns an object rather
  // than a number in tests — absent is a real wire state here too (groupBy drops
  // zero-count uids), so guard on the type rather than on falsiness.
  const rawCommentCount = useFeedCommentCount(item.uid);
  const commentCount = typeof rawCommentCount === 'number' ? rawCommentCount : 0;

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      // Space on a div scrolls the page by default.
      event.preventDefault();
      onOpen(item);
    }
  };

  return (
    <div
      // role="button" as an ATTRIBUTE, not a <button> element: NewsDetailModal's
      // restoreFocusToRow queries [role="button"][data-story-uid="…"], and an
      // attribute selector does not match a <button>'s implicit role. Building
      // this as a semantic button breaks focus restore silently.
      role="button"
      aria-haspopup="dialog"
      tabIndex={0}
      data-story-uid={item.uid}
      className={s.row}
      onClick={() => onOpen(item)}
      onKeyDown={handleKeyDown}
    >
      {/* Clamped in CSS, not JS, so the full title stays in the accessible name. */}
      <span className={s.title}>{item.title}</span>
      <span className={s.meta}>
        {timeAgo && <span className={s.time}>{timeAgo}</span>}
        {/* Read-only: voting belongs in the story, which is one click away.
            aria-hidden on the icons, with the count labelled in words, so the
            row's accessible name reads "… 4 likes, 0 comments" rather than
            two bare numbers. */}
        <span className={s.engagement}>
          <span className={s.stat}>
            <ThumbsUpOutlinedIcon aria-hidden="true" />
            <span aria-hidden="true">{item.upvoteCount ?? 0}</span>
            <span className={s.srOnly}>{`${item.upvoteCount ?? 0} likes`}</span>
          </span>
          <span className={s.stat}>
            <CommentIcon aria-hidden="true" />
            <span aria-hidden="true">{commentCount}</span>
            <span className={s.srOnly}>{`${commentCount} comments`}</span>
          </span>
        </span>
      </span>
    </div>
  );
}
