'use client';
'use client';

import clsx from 'clsx';
import isEmpty from 'lodash/isEmpty';
import { useMemo, useState } from 'react';

import { useTeamNewsAnalytics } from '@/analytics/team-news.analytics';
import type { ITeamNewsGroup, ITeamNewsItem } from '@/types/team-news.types';

import { Button } from '@/components/common/Button';

import {
  ACTIVE_DISCUSSIONS_CAT,
  ACTIVE_DISCUSSIONS_CATEGORY,
  ALL_TAB,
  ALL_CAT,
  CATEGORIES,
  type TeamNewsCategoryId,
} from './constants';

import { hasExistingDiscussion } from './components/NewsCard/components/StartConversationButton/utils/hasExistingDiscussion';

import { dedupeByUid } from './utils/dedupeByUid';

import { NewsCard } from './components/NewsCard';
import { NewsBase } from './components/NewsBase';
import { TeamNewsTabs } from './components/TeamNewsTabs';

import s from './TeamNews.module.scss';

import { sortAllTabItemsByEventDate } from './utils/sortAllTabItemsByEventDate';

interface TeamNewsProps {
  groups: ITeamNewsGroup[];
  pageSize?: number;
}

export const TeamNews = ({ groups, pageSize = 6 }: TeamNewsProps) => {
  const [activeTab, setActiveTab] = useState<string>(ALL_TAB);
  const [activeCategory, setActiveCategory] = useState<TeamNewsCategoryId>(ALL_CAT);
  const [expanded, setExpanded] = useState(false);
  const analytics = useTeamNewsAnalytics();

  const allItems = useMemo(() => sortAllTabItemsByEventDate(dedupeByUid(groups.flatMap((g) => g.items))), [groups]);

  const itemsForActiveTab = useMemo(() => {
    if (activeTab === ALL_TAB) return allItems;
    const group = groups.find((g) => g.focusArea.title === activeTab);
    return group?.items ?? [];
  }, [activeTab, allItems, groups]);

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

  const visibleItems = expanded ? filteredItems : filteredItems.slice(0, pageSize);
  const newCount = allItems.length;

  const handleTab = (id: string) => {
    const nextItems = id === ALL_TAB ? allItems : (groups.find((g) => g.focusArea.title === id)?.items ?? []);
    analytics.onTeamNewsTabClicked(id, nextItems.length);
    setActiveTab(id);
    setActiveCategory(ALL_CAT);
    setExpanded(false);
  };

  const handleCategory = (id: TeamNewsCategoryId) => {
    const nextCount =
      id === ALL_CAT
        ? itemsForActiveTab.length
        : id === ACTIVE_DISCUSSIONS_CAT
          ? itemsForActiveTab.filter((i) => hasExistingDiscussion(i.discussion)).length
          : itemsForActiveTab.filter((i) => i.eventType === id).length;
    analytics.onTeamNewsCategoryClicked(String(id), nextCount, activeTab);
    setActiveCategory(id);
    setExpanded(false);
  };

  const handleToggleAll = () => {
    analytics.onTeamNewsLoadMoreClicked(visibleItems.length, filteredItems.length, 'home', {
      currentTab: activeTab,
      currentCategory: String(activeCategory),
    });
    setExpanded((v) => !v);
  };

  const handleCardClick = (item: ITeamNewsItem) => {
    const position = visibleItems.findIndex((v) => v.uid === item.uid);
    analytics.onTeamNewsCardClicked(item, position >= 0 ? position : 0, 'home');
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
            {visibleItems.map((item, index) => (
              <NewsCard key={item.uid} item={item} position={index} onClick={handleCardClick} />
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
