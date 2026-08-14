'use client';

import clsx from 'clsx';
import { useEffect, useMemo, useState } from 'react';

import { QUICK_ACTIONS } from '../newsfeed-v0/quickActions';
// Reuse the sibling Newsfeed prototype's switch chrome so prototype-only
// controls look the same across the category.
import sw from '../newsfeed-v0/NewsfeedV0.module.scss';

import { PrototypeNavBar } from '../nav-shared/PrototypeNavBar';
import { PrototypeMobileNav } from '../nav-shared/PrototypeMobileNav';
import { DiscoveryNewsCard } from './DiscoveryNewsCard';
import { buildStories } from './mocks';
import { countNew, isNew, shouldShowTags, TAG_SUPPRESSION_RATIO } from './newSignal';

import s from './NewsfeedDiscovery.module.scss';

/**
 * How long ago the viewer last opened the feed. These are the four states worth
 * judging, not four features — every one is the same `newsLastSeenAt` timestamp
 * at a different value.
 */
const LAST_SEEN_PRESETS = [
  { id: 'none', label: 'Nothing new', hoursAgo: 0, note: 'Last visit just now — no dot, no tags.' },
  {
    id: 'few',
    label: 'A few new',
    hoursAgo: 24,
    note: 'Last visit yesterday. The new items are a minority, so the tags point at them.',
  },
  {
    id: 'flood',
    label: 'Everything new',
    hoursAgo: 24 * 30,
    note: 'First visit, or back after a month. The dot still shows; the tags suppress themselves rather than carpet the page.',
  },
] as const;

type PresetId = (typeof LAST_SEEN_PRESETS)[number]['id'];

export default function NewsfeedDiscoveryPrototype() {
  // Prototype pages server-render. Every date here is relative to *now*, so the
  // clock is read once after mount — stamping it during SSR would hand
  // hydration a different value and mismatch every timestamp on the page.
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => setNow(Date.now()), []);

  const [preset, setPreset] = useState<PresetId>('few');
  /** Set when the viewer clicks News: the visit that clears the signal. */
  const [visitedAt, setVisitedAt] = useState<number | null>(null);

  const stories = useMemo(() => (now === null ? [] : buildStories(now)), [now]);

  if (now === null) {
    return <div className={s.page} />;
  }

  const activePreset = LAST_SEEN_PRESETS.find((p) => p.id === preset) ?? LAST_SEEN_PRESETS[1];
  // One primitive, read by both signals. A visit always wins over the preset —
  // that's the whole clearing rule.
  const newsLastSeenAt = visitedAt ?? now - activePreset.hoursAgo * 60 * 60 * 1000;

  const newCount = countNew(stories, newsLastSeenAt);
  const tagsVisible = shouldShowTags(newCount, stories.length);

  const selectPreset = (id: PresetId) => {
    setPreset(id);
    // Changing the scenario un-does the visit; otherwise the cleared state
    // would swallow every preset picked after it.
    setVisitedAt(null);
  };

  const visit = () => setVisitedAt(Date.now());

  return (
    <div className={s.page}>
      {/* `active` on both bars: this page is the feed, so it is Home. No href —
          the visit is handled here, which is what clears the dot. */}
      <PrototypeNavBar hasUnreadNews={newCount > 0} onNewsClick={visit} active />

      <div className={s.container}>
        <div className={s.controls}>
          <span className={s.controlsTitle}>Prototype controls</span>
          <div className={sw.switchBar}>
            <span className={sw.switchLabel}>Last visit</span>
            <div className={sw.switch}>
              {LAST_SEEN_PRESETS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  className={clsx(sw.switchBtn, preset === p.id && !visitedAt && sw.switchBtnActive)}
                  onClick={() => selectPreset(p.id)}
                >
                  {p.label}
                </button>
              ))}
            </div>
            <span className={sw.switchNote}>
              {visitedAt ? 'Visited — the dot and the tags cleared together.' : activePreset.note}
            </span>
          </div>
          <p className={clsx(s.controlsNote, s.controlsNoteMuted)}>
            Click <strong>Home</strong> in the navbar to clear the signal. {newCount} of {stories.length} items are
            newer than your last visit
            {newCount === 0
              ? ', so there is nothing to tag.'
              : `; tags show only at or below ${Math.round(TAG_SUPPRESSION_RATIO * 100)}% of the list, so they are
                 currently ${tagsVisible ? 'shown' : 'suppressed'}.`}
          </p>
        </div>

        {/* Quick Actions, demoted to a strip so the feed leads the page. */}
        <div className={s.qaStrip}>
          <span className={s.qaLabel}>Quick actions</span>
          {QUICK_ACTIONS.map((action) => (
            <a key={action.href} href={action.href} className={s.qaChip} onClick={(e) => e.preventDefault()}>
              {action.icon}
              {action.short}
            </a>
          ))}
        </div>

        <div>
          <div className={s.feedHead}>
            <h1 className={s.feedTitle}>Network news</h1>
            <span className={s.feedMeta}>Following first</span>
          </div>
        </div>

        <div className={s.feedList}>
          {stories.map((item) => (
            <DiscoveryNewsCard key={item.uid} item={item} showNewTag={tagsVisible && isNew(item, newsLastSeenAt)} />
          ))}
        </div>
      </div>

      <PrototypeMobileNav hasUnreadNews={newCount > 0} onNewsClick={visit} active />
    </div>
  );
}
