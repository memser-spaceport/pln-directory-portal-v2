'use client';

import clsx from 'clsx';

import { FollowButton } from '../follow-shared/FollowButton';
import { initials } from '../follow-shared/types';
import { SUGGESTIONS } from './mocks';
import s from './SubscribeBanner.module.scss';

interface Props {
  followed: Set<string>;
  onToggle: (id: string) => void;
  /** Compact = the slim "follow more" strip shown once a feed is personalized. */
  compact?: boolean;
}

/**
 * The activation surface. When the feed isn't personalized yet this is the hero
 * that explains the payoff and offers one-tap follows; once you're following a
 * few sources it shrinks to a quiet "follow more" strip.
 */
export function SubscribeBanner({ followed, onToggle, compact }: Props) {
  return (
    <section className={clsx(s.banner, { [s.compact]: compact })} aria-label="Follow suggestions">
      {!compact && (
        <div className={s.intro}>
          <h2 className={s.title}>See what matters to you, first</h2>
          <p className={s.body}>
            Follow teams and people to pull their news, forum posts, and events to the top of your feed — and get
            notified when they ship, post, or show up at an event.
          </p>
        </div>
      )}

      {compact && <span className={s.compactLabel}>Follow more to tune your feed</span>}

      <ul className={clsx(s.suggestions, { [s.suggestionsCompact]: compact })}>
        {SUGGESTIONS.map((sug) => {
          const isFollowing = followed.has(sug.id);
          const isTeam = sug.type === 'team';
          return (
            <li key={sug.id} className={s.chip}>
              {sug.image ? (
                <img className={clsx(s.chipAvatar, { [s.chipAvatarTeam]: isTeam })} src={sug.image} alt="" loading="lazy" />
              ) : (
                <div className={clsx(s.chipAvatar, s.chipFallback, { [s.chipAvatarTeam]: isTeam })} aria-hidden="true">
                  {initials(sug.name)}
                </div>
              )}
              <div className={s.chipText}>
                <span className={s.chipName}>{sug.name}</span>
                <span className={s.chipSub}>{sug.subtitle}</span>
              </div>
              <FollowButton
                following={isFollowing}
                onClick={() => onToggle(sug.id)}
                name={sug.name}
                size="xs"
              />
            </li>
          );
        })}
      </ul>
    </section>
  );
}
