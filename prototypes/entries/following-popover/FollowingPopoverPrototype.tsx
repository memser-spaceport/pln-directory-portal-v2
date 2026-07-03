'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import clsx from 'clsx';

import { FollowButton } from '../follow-shared/FollowButton';
import { initials } from '../follow-shared/types';
import {
  FOLLOWERS,
  FOLLOWER_COUNT,
  FOLLOWERS_IN_NETWORK,
  FOLLOWING_PEOPLE,
  FOLLOWING_TEAMS,
  INITIAL_FOLLOWED,
  type FollowEntity,
} from './mocks';
import s from './FollowingPopover.module.scss';

type Tab = 'following' | 'followers';
type Seg = 'people' | 'teams';

export default function FollowingPopoverPrototype() {
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(true); // open by default so the surface is visible
  const [tab, setTab] = useState<Tab>('following');
  const [seg, setSeg] = useState<Seg>('people');
  const [followed, setFollowed] = useState<Set<string>>(new Set(INITIAL_FOLLOWED));
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const toggle = (id: string) =>
    setFollowed((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const followingList = seg === 'people' ? FOLLOWING_PEOPLE : FOLLOWING_TEAMS;
  const followingCount = useMemo(
    () => [...FOLLOWING_PEOPLE, ...FOLLOWING_TEAMS].filter((e) => followed.has(e.id)).length,
    [followed],
  );

  if (!mounted) return <div className={s.page} />;

  return (
    <div className={s.page}>
      {/* Mock top bar — the profile avatar opens the popover. */}
      <div className={s.topbar}>
        <span className={s.brand}>Protocol Labs Directory</span>
        <div className={s.avatarWrap} ref={wrapRef}>
          <button
            type="button"
            className={s.avatarBtn}
            onClick={() => setOpen((o) => !o)}
            aria-haspopup="dialog"
            aria-expanded={open}
            aria-label="Open profile menu"
          >
            <img src="https://i.pravatar.cc/96?img=5" alt="" className={s.avatarImg} />
          </button>

          {open && (
            <div className={s.popover} role="dialog" aria-label="Profile">
              {/* Identity header */}
              <div className={s.identity}>
                <img src="https://i.pravatar.cc/96?img=5" alt="" className={s.identityImg} />
                <div className={s.identityText}>
                  <span className={s.identityName}>Alex Rivera</span>
                  <span className={s.identityRole}>Investor · Network Capital</span>
                </div>
              </div>

              {/* Tabs */}
              <div className={s.tabs} role="tablist">
                <button
                  type="button"
                  role="tab"
                  aria-selected={tab === 'following'}
                  className={clsx(s.tab, { [s.tabActive]: tab === 'following' })}
                  onClick={() => setTab('following')}
                >
                  Following <span className={s.tabCount}>{followingCount}</span>
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={tab === 'followers'}
                  className={clsx(s.tab, { [s.tabActive]: tab === 'followers' })}
                  onClick={() => setTab('followers')}
                >
                  Followers <span className={s.tabCount}>{FOLLOWER_COUNT.toLocaleString()}</span>
                </button>
              </div>

              {tab === 'following' ? (
                <>
                  {/* People / Teams sub-filter — they behave differently. */}
                  <div className={s.segmented}>
                    <button
                      type="button"
                      className={clsx(s.segment, { [s.segmentActive]: seg === 'people' })}
                      onClick={() => setSeg('people')}
                    >
                      People <span>{FOLLOWING_PEOPLE.length}</span>
                    </button>
                    <button
                      type="button"
                      className={clsx(s.segment, { [s.segmentActive]: seg === 'teams' })}
                      onClick={() => setSeg('teams')}
                    >
                      Teams <span>{FOLLOWING_TEAMS.length}</span>
                    </button>
                  </div>

                  <ul className={s.list}>
                    {followingList.map((e) => (
                      <Row key={e.id} entity={e} following={followed.has(e.id)} onToggle={() => toggle(e.id)} />
                    ))}
                  </ul>
                </>
              ) : (
                <>
                  <p className={s.proof}>
                    <strong>{FOLLOWERS_IN_NETWORK}</strong> of your followers are in your teams.
                  </p>
                  <ul className={s.list}>
                    {FOLLOWERS.map((e) => (
                      <Row
                        key={e.id}
                        entity={e}
                        following={followed.has(e.id)}
                        onToggle={() => toggle(e.id)}
                        followBack
                      />
                    ))}
                  </ul>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      <p className={s.hint}>Click the avatar (top-right) to reopen the profile menu.</p>
    </div>
  );
}

function Row({
  entity,
  following,
  onToggle,
  followBack,
}: {
  entity: FollowEntity;
  following: boolean;
  onToggle: () => void;
  followBack?: boolean;
}) {
  const isTeam = entity.kind === 'team';
  return (
    <li className={s.row}>
      {entity.image ? (
        <img className={clsx(s.rowAvatar, { [s.rowAvatarTeam]: isTeam })} src={entity.image} alt="" loading="lazy" />
      ) : (
        <div className={clsx(s.rowAvatar, s.rowAvatarFallback, { [s.rowAvatarTeam]: isTeam })} aria-hidden="true">
          {initials(entity.name)}
        </div>
      )}
      <div className={s.rowText}>
        <span className={s.rowName}>{entity.name}</span>
        <span className={s.rowSub}>{entity.subtitle}</span>
      </div>
      {/* On the followers tab, an un-followed person shows "Follow back". */}
      {followBack && !following ? (
        <FollowButton following={false} onClick={onToggle} name={entity.name} size="xs" />
      ) : (
        <FollowButton following={following} onClick={onToggle} name={entity.name} size="xs" tertiary />
      )}
    </li>
  );
}
