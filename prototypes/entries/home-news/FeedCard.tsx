'use client';

import clsx from 'clsx';
import { formatTimeAgo } from '@/utils/formatTimeAgo';

import { initials } from '../follow-shared/types';
import type { FeedItem } from './mocks';
import s from './FeedCard.module.scss';

const VERB: Record<FeedItem['kind'], string> = {
  news: 'shared an update',
  forum: 'posted in the forum',
  event: 'has an event',
};

export function FeedCard({ item, followed }: { item: FeedItem; followed: boolean }) {
  const { source, kind } = item;
  const isTeam = source.type === 'team';

  const verb =
    kind === 'forum' && item.forum
      ? `posted in ${item.forum.category}`
      : kind === 'event' && item.event
        ? item.event.role === 'speaking'
          ? 'is speaking at an event'
          : 'is attending an event'
        : kind === 'news'
          ? isTeam
            ? 'announced'
            : 'shared news'
          : VERB[kind];

  return (
    <article className={clsx(s.card, { [s.cardFollowed]: followed })}>
      <div className={s.head}>
        {source.image ? (
          <img className={clsx(s.avatar, { [s.avatarTeam]: isTeam })} src={source.image} alt="" loading="lazy" />
        ) : (
          <div className={clsx(s.avatar, s.avatarFallback, { [s.avatarTeam]: isTeam })} aria-hidden="true">
            {initials(source.name)}
          </div>
        )}

        <div className={s.headText}>
          <div className={s.byline}>
            <span className={s.sourceName}>{source.name}</span>
            <span className={s.verb}>{verb}</span>
          </div>
          <time className={s.time}>{formatTimeAgo(item.time)}</time>
        </div>

        {followed && (
          <span className={s.followingPill}>
            <CheckGlyph />
            Following
          </span>
        )}
      </div>

      <h3 className={s.title}>{item.title}</h3>

      <div className={s.foot}>
        <span className={clsx(s.kindTag, s[`kind_${kind}`])}>
          <span className={s.kindDot} aria-hidden="true" />
          {kind === 'news' ? item.newsLabel ?? 'News' : kind === 'forum' ? 'Forum' : 'Event'}
        </span>

        {kind === 'forum' && item.forum && (
          <span className={s.meta}>
            {item.forum.replies} replies · {item.forum.likes} likes
          </span>
        )}
        {kind === 'event' && item.event && (
          <span className={s.meta}>
            {item.event.date} · {item.event.location}
          </span>
        )}
        {kind === 'news' && item.sourceDomain && <span className={s.meta}>{item.sourceDomain}</span>}

        <span className={s.action}>
          {kind === 'forum' ? 'Join discussion' : kind === 'event' ? 'View event' : 'Discuss'}
          <ArrowGlyph />
        </span>
      </div>
    </article>
  );
}

const CheckGlyph = () => (
  <svg width="11" height="11" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M13 4.5 6.5 11 3 7.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const ArrowGlyph = () => (
  <svg width="11" height="10" viewBox="0 0 11 10" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M6.34 0l3.94 3.94a.66.66 0 0 1 0 .93L6.34 8.81a.66.66 0 0 1-.93-.93l2.82-2.82H.66a.66.66 0 0 1 0-1.31h7.57L5.41.93A.66.66 0 0 1 6.34 0Z"
      fill="currentColor"
    />
  </svg>
);
