'use client';

import clsx from 'clsx';
import isEmpty from 'lodash/isEmpty';
import { useEffect, useMemo, useState } from 'react';

import { Button } from '@/components/common/Button';

import {
  ACTIVE_DISCUSSIONS_CAT,
  ACTIVE_DISCUSSIONS_CATEGORY,
  ALL_TAB,
  ALL_CAT,
  CATEGORIES,
  type TeamNewsCategoryId,
} from '@/components/page/home/TeamNews/constants';
import { hasExistingDiscussion } from '@/components/page/home/TeamNews/utils/hasExistingDiscussion';
import { dedupeByUid } from '@/components/page/home/TeamNews/utils/dedupeByUid';
import { sortAllTabItemsByEventDate } from '@/components/page/home/TeamNews/utils/sortAllTabItemsByEventDate';
import { NewsBase } from '@/components/page/home/TeamNews/components/NewsBase';
import { TeamNewsTabs } from '@/components/page/home/TeamNews/components/TeamNewsTabs';

// Reuse the production feed layout styling 1:1.
import s from '@/components/page/home/TeamNews/TeamNews.module.scss';

import { NewsFeedCard } from './NewsFeedCard';
import { MOCK_GROUPS } from './mocks';
import local from './NewsFeed.module.scss';

const groups = MOCK_GROUPS;
const PAGE_SIZE = 6;

/**
 * Faithful copy of the production homepage `TeamNews` feed (tabs → category row
 * → card grid → Show All), with analytics stripped and mock data. Adds a small
 * follow/following button next to each team name in the card head.
 */
export default function NewsFeedPrototype() {
  // Tabs/Badge are base-ui / client-only — gate render so SSR === first client render.
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<string>(ALL_TAB);
  const [activeCategory, setActiveCategory] = useState<TeamNewsCategoryId>(ALL_CAT);
  const [expanded, setExpanded] = useState(false);
  const [followedTeams, setFollowedTeams] = useState<Set<string>>(new Set(['protocol-labs']));

  useEffect(() => setMounted(true), []);

  const toggleFollow = (teamUid: string) =>
    setFollowedTeams((prev) => {
      const next = new Set(prev);
      next.has(teamUid) ? next.delete(teamUid) : next.add(teamUid);
      return next;
    });

  const allItems = useMemo(() => sortAllTabItemsByEventDate(dedupeByUid(groups.flatMap((g) => g.items))), []);

  const itemsForActiveTab = useMemo(() => {
    if (activeTab === ALL_TAB) return allItems;
    const group = groups.find((g) => g.focusArea.title === activeTab);
    return group?.items ?? [];
  }, [activeTab, allItems]);

  const categoriesWithCounts = useMemo(() => {
    const activeDiscussionsCount = itemsForActiveTab.filter((i) => hasExistingDiscussion(i.discussion)).length;
    const base = CATEGORIES.map((c) => ({
      ...c,
      count: c.id === ALL_CAT ? itemsForActiveTab.length : itemsForActiveTab.filter((i) => i.eventType === c.id).length,
    }));

    if (activeDiscussionsCount === 0) return base;

    const withActive: Array<{ id: TeamNewsCategoryId; label: string; count: number }> = [];
    for (const c of base) {
      withActive.push(c);
      if (c.id === ALL_CAT) {
        withActive.push({ ...ACTIVE_DISCUSSIONS_CATEGORY, count: activeDiscussionsCount });
      }
    }
    return withActive;
  }, [itemsForActiveTab]);

  const filteredItems = useMemo(() => {
    if (activeCategory === ALL_CAT) return itemsForActiveTab;
    if (activeCategory === ACTIVE_DISCUSSIONS_CAT) {
      return itemsForActiveTab.filter((i) => hasExistingDiscussion(i.discussion));
    }
    return itemsForActiveTab.filter((i) => i.eventType === activeCategory);
  }, [activeCategory, itemsForActiveTab]);

  const visibleItems = expanded ? filteredItems : filteredItems.slice(0, PAGE_SIZE);
  const newCount = allItems.length;

  const handleTab = (id: string) => {
    setActiveTab(id);
    setActiveCategory(ALL_CAT);
    setExpanded(false);
  };

  const handleCategory = (id: TeamNewsCategoryId) => {
    setActiveCategory(id);
    setExpanded(false);
  };

  if (!mounted) return <div className={local.page} />;

  return (
    <div className={local.page}>
      <div className={local.inner}>
        {isEmpty(allItems) ? (
          <NewsBase>
            <div className={s.empty}>No network news in the last 14 days yet. Check back soon.</div>
          </NewsBase>
        ) : (
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
                    <NewsFeedCard
                      key={item.uid}
                      item={item}
                      following={followedTeams.has(item.teamUid)}
                      onToggleFollow={() => toggleFollow(item.teamUid)}
                    />
                  ))}
                </div>
                {filteredItems.length > PAGE_SIZE && (
                  <div className={s.showAll}>
                    <Button style="border" variant="secondary" type="button" onClick={() => setExpanded((v) => !v)}>
                      {expanded ? 'Show Less' : 'Show All'}
                    </Button>
                  </div>
                )}
              </>
            )}
          </NewsBase>
        )}
      </div>
    </div>
  );
}
