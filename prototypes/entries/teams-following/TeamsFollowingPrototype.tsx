'use client';

import { useEffect, useMemo, useState } from 'react';
import clsx from 'clsx';

import { FollowButton } from '../follow-shared/FollowButton';
import { PrivacyNote } from '../follow-shared/PrivacyNote';
import { initials } from '../follow-shared/types';
import { FOLLOWED_PEOPLE, FOLLOWED_TEAMS, INITIAL_FOLLOWED_IDS, type FollowedEntity } from './mocks';
import s from './TeamsFollowing.module.scss';

type Seg = 'teams' | 'people';

/**
 * "Following" manage page — the LinkedIn "Pages you follow" pattern applied to
 * directory teams: one centered card with Teams/People tabs, search within the
 * list, and a per-row Following/Follow toggle. Unfollowed rows stay in place
 * (button flips to Follow) so a mis-tap is one tap to undo, LinkedIn-style.
 */
export default function TeamsFollowingPrototype() {
  const [mounted, setMounted] = useState(false);
  const [seg, setSeg] = useState<Seg>('teams');
  const [query, setQuery] = useState('');
  const [followed, setFollowed] = useState<Set<string>>(new Set(INITIAL_FOLLOWED_IDS));

  useEffect(() => setMounted(true), []);

  const toggle = (id: string) =>
    setFollowed((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  // Tab counts track live follow state, not the mock list length.
  const teamCount = useMemo(() => FOLLOWED_TEAMS.filter((e) => followed.has(e.id)).length, [followed]);
  const peopleCount = useMemo(() => FOLLOWED_PEOPLE.filter((e) => followed.has(e.id)).length, [followed]);

  const source = seg === 'teams' ? FOLLOWED_TEAMS : FOLLOWED_PEOPLE;
  const q = query.trim().toLowerCase();
  const rows = q
    ? source.filter((e) => e.name.toLowerCase().includes(q) || e.subtitle.toLowerCase().includes(q))
    : source;

  if (!mounted) return <div className={s.page} />;

  return (
    <div className={s.page}>
      <div className={s.card}>
        <div className={s.head}>
          <h1 className={s.title}>Following</h1>
          <p className={s.lede}>Who you follow shapes your news feed and notifications.</p>
          <div className={s.privacy}>
            <PrivacyNote compact>Only you can see who you follow.</PrivacyNote>
          </div>

          <div className={s.tabs} role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={seg === 'teams'}
              className={clsx(s.tab, { [s.tabActive]: seg === 'teams' })}
              onClick={() => setSeg('teams')}
            >
              Teams <span className={s.tabCount}>{teamCount}</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={seg === 'people'}
              className={clsx(s.tab, { [s.tabActive]: seg === 'people' })}
              onClick={() => setSeg('people')}
            >
              People <span className={s.tabCount}>{peopleCount}</span>
            </button>
          </div>
        </div>

        <div className={s.searchWrap}>
          <input
            type="search"
            className={s.search}
            placeholder={seg === 'teams' ? 'Search teams you follow' : 'Search people you follow'}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search the list"
          />
        </div>

        {rows.length > 0 ? (
          <ul className={s.list}>
            {rows.map((e) => (
              <Row key={e.id} entity={e} following={followed.has(e.id)} onToggle={() => toggle(e.id)} />
            ))}
          </ul>
        ) : (
          <div className={s.empty}>
            {q ? (
              <>No {seg === 'teams' ? 'teams' : 'people'} match “{query}”.</>
            ) : (
              <>
                You’re not following any {seg === 'teams' ? 'teams' : 'people'} yet —{' '}
                <a className={s.emptyLink} href={seg === 'teams' ? '/teams' : '/members'} target="_blank" rel="noopener noreferrer">
                  explore the directory
                </a>
                .
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function Row({ entity, following, onToggle }: { entity: FollowedEntity; following: boolean; onToggle: () => void }) {
  const isPerson = entity.kind === 'member';
  const href = isPerson ? `/members/${entity.id}` : `/teams/${entity.id}`;
  return (
    <li className={s.row}>
      {entity.image ? (
        <img className={clsx(s.logo, { [s.logoPerson]: isPerson })} src={entity.image} alt="" loading="lazy" />
      ) : (
        <div className={clsx(s.logo, s.logoFallback, { [s.logoPerson]: isPerson })} aria-hidden="true">
          {initials(entity.name)}
        </div>
      )}
      <div className={s.rowText}>
        <a className={s.rowName} href={href} target="_blank" rel="noopener noreferrer">
          {entity.name}
        </a>
        <p className={s.rowSub}>{entity.subtitle}</p>
        <p className={s.rowMeta}>
          {entity.followers.toLocaleString()} followers · Followed {entity.followedAgo}
        </p>
      </div>
      <div className={s.rowAction}>
        <FollowButton following={following} onClick={onToggle} name={entity.name} size="s" />
      </div>
    </li>
  );
}
