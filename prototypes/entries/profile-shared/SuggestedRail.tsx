'use client';

import { useState } from 'react';
import clsx from 'clsx';

import { FollowButton } from '@/components/ui/FollowButton';
import { getDefaultAvatar } from '@/hooks/useDefaultAvatar';
import teams from '@/components/common/LogosGrid/teams.json';

// The rail's card chrome on the profile pages, and production's Teams to follow rows.
import book from '@/components/page/member-details/BookWithOther/BookWithOther.module.scss';
import rail from '@/components/page/home/TeamNews/components/NewsRail/NewsRail.module.scss';
import s from './SuggestedRail.module.scss';

export interface SuggestedItem {
  uid: string;
  name: string;
  image: string;
  subtitle: string;
}

/* Fictional people, as everywhere in the member-profile mocks: a made-up job at a real team would read as a fact. */
export const SUGGESTED_MEMBERS: SuggestedItem[] = [
  { name: 'Daniel Osei', subtitle: 'Head of Infrastructure · Fathom Networks' },
  { name: 'Lena Hartmann', subtitle: 'Co-founder & CTO · Proofline' },
  { name: 'Tomás Ribeiro', subtitle: 'Research Engineer, Verifiable Compute · Arclight Labs' },
].map((m) => ({ ...m, uid: m.name, image: getDefaultAvatar(m.name) }));

/* Real teams with their real one-liners, so the rows carry production's copy lengths. */
export const SUGGESTED_TEAMS: SuggestedItem[] = ['Storacha', 'Akave', 'Lit Protocol'].flatMap((name) =>
  teams
    .filter((t) => t.name === name)
    .map((t) => ({ uid: t.uid, name: t.name, image: t.logo, subtitle: t.shortDescription.trim() })),
);

/**
 * "You might be interested in": a rail card of other members on a member's
 * profile and other teams on a team's.
 *
 * Rows are a copy of production's `TeamsToFollowCard` (same classes, compact
 * FollowButton, one-way follow, name opens in a new tab) inside the rail card
 * the profile pages already use. Deviations: three lines of description become
 * two, because the team page's rail is capped to the viewport and this card
 * shares it with the news list; member rows are round and have no Follow,
 * because this page's default has no Follow for a person.
 */
export function SuggestedRail({
  kind,
  items,
  className,
}: {
  kind: 'member' | 'team';
  items: SuggestedItem[];
  className?: string;
}) {
  const [followed, setFollowed] = useState<Set<string>>(new Set());
  if (items.length === 0) return null;

  const href = kind === 'team' ? '/prototypes/team-profile' : '/prototypes/member-profile';

  return (
    <section className={clsx(book.root, className)} aria-label="You might be interested in">
      <h2 className={clsx(book.header, s.title)}>You might be interested in</h2>
      <div className={s.list}>
        {items.map((item) => {
          const isFollowing = followed.has(item.uid);
          return (
            <div key={item.uid} className={rail.railRow}>
              <img
                className={clsx(rail.railLogo, kind === 'member' && s.round)}
                src={item.image}
                alt=""
                loading="lazy"
              />
              <span className={rail.railInfo}>
                <span className={rail.railNameRow}>
                  <a href={href} target="_blank" rel="noopener noreferrer" className={rail.railName}>
                    {item.name}
                  </a>
                  {kind === 'team' && (
                    <FollowButton
                      following={isFollowing}
                      onClick={(e) => {
                        e.stopPropagation();
                        setFollowed((prev) => new Set(prev).add(item.uid));
                      }}
                      name={item.name}
                      size="compact"
                      disabled={isFollowing}
                    />
                  )}
                </span>
                <span className={clsx(rail.railReason, s.twoLines)}>{item.subtitle}</span>
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
