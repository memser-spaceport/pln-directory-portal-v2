'use client';

import { useEffect, useMemo, useState } from 'react';
import clsx from 'clsx';

import { BackButton } from '@/components/ui/BackButton';

import { FeedCard } from './FeedCard';
import { SubscribeBanner } from './SubscribeBanner';
import { FEED, PRESETS, type FeedItem } from './mocks';
import s from './HomeNews.module.scss';

type PresetKey = 'none' | 'few' | 'many';

const byNewest = (a: FeedItem, b: FeedItem) => new Date(b.time).getTime() - new Date(a.time).getTime();

export default function HomeNewsPrototype() {
  const [mounted, setMounted] = useState(false);
  const [followed, setFollowed] = useState<Set<string>>(new Set());

  useEffect(() => setMounted(true), []);

  const toggle = (id: string) =>
    setFollowed((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const applyPreset = (key: PresetKey) => setFollowed(new Set(PRESETS[key]));

  // Which preset (if any) the current set matches — for the active highlight.
  const activePreset = useMemo<PresetKey | 'custom'>(() => {
    const ids = [...followed].sort().join(',');
    for (const key of ['none', 'few', 'many'] as PresetKey[]) {
      if ([...PRESETS[key]].sort().join(',') === ids) return key;
    }
    return 'custom';
  }, [followed]);

  const { followedItems, networkItems } = useMemo(() => {
    const sorted = [...FEED].sort(byNewest);
    return {
      followedItems: sorted.filter((i) => followed.has(i.source.id)),
      networkItems: sorted.filter((i) => !followed.has(i.source.id)),
    };
  }, [followed]);

  const personalized = followed.size > 0;

  if (!mounted) return <div className={s.page} />;

  return (
    <div className={s.page}>
      <div className={s.demoBar}>
        <span className={s.demoLabel}>Following</span>
        <div className={s.segmented} role="group" aria-label="Following scenario">
          {(
            [
              ['none', 'None'],
              ['few', 'A few'],
              ['many', 'Many'],
            ] as [PresetKey, string][]
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              aria-pressed={activePreset === key}
              className={clsx(s.segment, { [s.segmentActive]: activePreset === key })}
              onClick={() => applyPreset(key)}
            >
              {label}
            </button>
          ))}
          {activePreset === 'custom' && <span className={s.customTag}>custom</span>}
        </div>
        <a className={s.profileLink} href="/prototypes/member-profile">
          ← Follow from a profile
        </a>
      </div>

      <main className={s.feed}>
        <header className={s.feedHead}>
          <h1 className={s.feedTitle}>Your feed</h1>
          {personalized ? (
            <p className={s.feedStatus}>
              <span className={s.statusDot} aria-hidden="true" />
              Personalized — {followed.size} {followed.size === 1 ? 'follow' : 'follows'} surface first
            </p>
          ) : (
            <p className={s.feedStatusMuted}>Showing the latest across the network</p>
          )}
        </header>

        {/* Empty state: the activation hero. */}
        {!personalized && <SubscribeBanner followed={followed} onToggle={toggle} />}

        {/* Personalized zone: followed-first, with the subtle marker. */}
        {personalized && followedItems.length > 0 && (
          <section className={s.zone}>
            <div className={s.zoneHead}>
              <h2 className={s.zoneTitle}>From people &amp; teams you follow</h2>
              <span className={s.zoneCount}>{followedItems.length}</span>
            </div>
            <div className={s.list}>
              {followedItems.map((item) => (
                <FeedCard key={item.id} item={item} followed />
              ))}
            </div>
          </section>
        )}

        {personalized && <SubscribeBanner followed={followed} onToggle={toggle} compact />}

        {/* The rest of the network. */}
        <section className={s.zone}>
          {personalized && (
            <div className={s.zoneHead}>
              <h2 className={clsx(s.zoneTitle, s.zoneTitleMuted)}>More from the network</h2>
            </div>
          )}
          <div className={s.list}>
            {(personalized ? networkItems : [...FEED].sort(byNewest)).map((item) => (
              <FeedCard key={item.id} item={item} followed={false} />
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
