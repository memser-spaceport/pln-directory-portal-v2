'use client';

import clsx from 'clsx';
import isEmpty from 'lodash/isEmpty';
import { useMemo, useState } from 'react';

import { useTeamNewsAnalytics } from '@/analytics/team-news.analytics';
import type { ITeamNewsGroup, ITeamNewsItem, TeamNewsEventType } from '@/types/team-news.types';

import { Button } from '@/components/common/Button';

import { ALL_TAB, ALL_CAT, CATEGORIES } from './constants';

import { dedupeByUid } from './utils/dedupeByUid';

import { NewsCard } from './components/NewsCard';
import { NewsBase } from './components/NewsBase';
import { TeamNewsTabs } from './components/TeamNewsTabs';

import s from './TeamNews.module.scss';

interface TeamNewsProps {
  groups: ITeamNewsGroup[];
  pageSize?: number;
}

const ALL_TAB = 'All';
const ALL_CAT = 'all';

const CATEGORIES: Array<{ id: TeamNewsEventType | typeof ALL_CAT; label: string }> = [
  { id: ALL_CAT, label: 'All categories' },
  { id: 'FUNDING', label: 'Funding' },
  { id: 'LAUNCH', label: 'Launch' },
  { id: 'PARTNERSHIP', label: 'Partnership' },
  { id: 'MILESTONE', label: 'Milestone' },
  { id: 'ANNOUNCEMENT', label: 'Announcement' },
];

const dedupeByUid = (items: ITeamNewsItem[]): ITeamNewsItem[] => {
  const seen = new Set<string>();
  const out: ITeamNewsItem[] = [];
  for (const item of items) {
    if (seen.has(item.uid)) continue;
    seen.add(item.uid);
    out.push(item);
  }
  return out;
};

// FNV-1a 32-bit string hash → numeric seed.
const hashStringToSeed = (input: string): number => {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
};

// Mulberry32 PRNG: same seed always yields the same sequence.
const mulberry32 = (seed: number): (() => number) => {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

// Deterministic Fisher-Yates so the "All" tab feels mixed across focus areas
// instead of being dominated by whichever focus area sits first in the
// backend's grouped order — but stays identical on refresh as long as the
// underlying list of news hasn't changed.
const shuffleAllTabItems = (items: ITeamNewsItem[]): ITeamNewsItem[] => {
  if (items.length < 2) return items;
  let latestCreatedAt = '';
  for (const item of items) {
    if (item.createdAt > latestCreatedAt) latestCreatedAt = item.createdAt;
  }
  // Mix in the count so adding/removing items also reshuffles, not just new
  // ingest runs.
  const seed = hashStringToSeed(`${latestCreatedAt}|${items.length}`);
  const rand = mulberry32(seed);
  const out = items.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    const tmp = out[i];
    out[i] = out[j];
    out[j] = tmp;
  }
  return out;
};

export const TeamNews = ({ groups, pageSize = 6 }: TeamNewsProps) => {
  const [activeTab, setActiveTab] = useState<string>(ALL_TAB);
  const [activeCategory, setActiveCategory] = useState<TeamNewsEventType | typeof ALL_CAT>(ALL_CAT);
  const [expanded, setExpanded] = useState(false);
  const analytics = useTeamNewsAnalytics();

  const allItems = useMemo(() => shuffleAllTabItems(dedupeByUid(groups.flatMap((g) => g.items))), [groups]);

  const itemsForActiveTab = useMemo(() => {
    if (activeTab === ALL_TAB) return allItems;
    const group = groups.find((g) => g.focusArea.title === activeTab);
    return group?.items ?? [];
  }, [activeTab, allItems, groups]);

  const categoriesWithCounts = useMemo(() => {
    return CATEGORIES.map((c) => ({
      ...c,
      count: c.id === ALL_CAT ? itemsForActiveTab.length : itemsForActiveTab.filter((i) => i.eventType === c.id).length,
    }));
  }, [itemsForActiveTab]);

  const filteredItems = useMemo(() => {
    if (activeCategory === ALL_CAT) return itemsForActiveTab;
    return itemsForActiveTab.filter((i) => i.eventType === activeCategory);
  }, [activeCategory, itemsForActiveTab]);

  const visibleItems = expanded ? filteredItems : filteredItems.slice(0, pageSize);
  const newCount = allItems.length;

  const handleTab = (id: string) => {
    const nextItems = id === ALL_TAB ? allItems : (groups.find((g) => g.focusArea.title === id)?.items ?? []);
    analytics.onTeamNewsTabClicked(id, nextItems.length);
    setActiveTab(id);
    setActiveCategory(ALL_CAT);
    setExpanded(false);
  };

  const handleCategory = (id: TeamNewsEventType | typeof ALL_CAT) => {
    const nextCount =
      id === ALL_CAT ? itemsForActiveTab.length : itemsForActiveTab.filter((i) => i.eventType === id).length;
    analytics.onTeamNewsCategoryClicked(String(id), nextCount, activeTab);
    setActiveCategory(id);
    setExpanded(false);
  };

  const handleToggleAll = () => {
    analytics.onTeamNewsLoadMoreClicked(visibleItems.length, filteredItems.length, activeTab, String(activeCategory));
    setExpanded((v) => !v);
  };

  const handleCardClick = (item: ITeamNewsItem) => {
    const position = visibleItems.findIndex((v) => v.uid === item.uid);
    analytics.onTeamNewsCardClicked(item, position >= 0 ? position : 0);
  };

  if (isEmpty(allItems)) {
    return (
      <NewsBase>
        <div className={s.empty}>No network news in the last 14 days yet. Check back soon.</div>
      </NewsBase>
    );
  }

  return (
    <NewsBase headerDetails={newCount > 0 && <span className={s.unreadBadge}>{newCount} new</span>}>
      <TeamNewsTabs groups={groups} allItems={allItems} activeTab={activeTab} onTabChange={handleTab} />

      <div className={s.catRow}>
        {categoriesWithCounts.map((c) => {
          const isActive = activeCategory === c.id;
          const isDisabled = c.count === 0 && c.id !== ALL_CAT;
          return (
            <button
              key={c.id}
              type="button"
              className={clsx(s.cat, { [s.catActive]: isActive })}
              onClick={() => handleCategory(c.id)}
              disabled={isDisabled}
            >
              {c.label}
              {c.count > 0 && c.id !== ALL_CAT && <span>{c.count}</span>}
            </button>
          );
        })}
      </div>

      {filteredItems.length === 0 ? (
        <div className={s.empty}>No network news in this filter.</div>
      ) : (
        <>
          <div className={s.grid}>
            {visibleItems.map((item) => (
              <NewsCard key={item.uid} item={item} onClick={handleCardClick} />
            ))}
          </div>
          {filteredItems.length > pageSize && (
            <div className={s.showAll}>
              <Button style="border" variant="secondary" type="button" onClick={handleToggleAll}>
                {expanded ? 'Show Less' : 'Show All'}
              </Button>
            </div>
          )}
        </>
      )}
    </NewsBase>
  );
};
