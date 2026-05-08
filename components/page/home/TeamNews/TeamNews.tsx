'use client';

import { useMemo, useState } from 'react';
import { NewsCard } from './components/NewsCard';
import type {
  ITeamNewsGroup,
  ITeamNewsItem,
  TeamNewsEventType,
} from '@/types/team-news.types';
import { useTeamNewsAnalytics } from '@/analytics/team-news.analytics';
import styles from './TeamNews.module.scss';

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

export const TeamNews = ({ groups, pageSize = 6 }: TeamNewsProps) => {
  const [activeTab, setActiveTab] = useState<string>(ALL_TAB);
  const [activeCategory, setActiveCategory] = useState<TeamNewsEventType | typeof ALL_CAT>(ALL_CAT);
  const [page, setPage] = useState<number>(1);
  const analytics = useTeamNewsAnalytics();

  const allItems = useMemo(() => dedupeByUid(groups.flatMap((g) => g.items)), [groups]);

  const tabsWithCounts = useMemo(() => {
    const tabs: Array<{ id: string; label: string; count: number }> = [
      { id: ALL_TAB, label: 'All', count: allItems.length },
    ];
    for (const g of groups) {
      tabs.push({ id: g.focusArea.title, label: g.focusArea.title, count: g.total });
    }
    return tabs;
  }, [groups, allItems]);

  const itemsForActiveTab = useMemo(() => {
    if (activeTab === ALL_TAB) return allItems;
    const group = groups.find((g) => g.focusArea.title === activeTab);
    return group?.items ?? [];
  }, [activeTab, allItems, groups]);

  const categoriesWithCounts = useMemo(() => {
    return CATEGORIES.map((c) => ({
      ...c,
      count:
        c.id === ALL_CAT
          ? itemsForActiveTab.length
          : itemsForActiveTab.filter((i) => i.eventType === c.id).length,
    }));
  }, [itemsForActiveTab]);

  const filteredItems = useMemo(() => {
    if (activeCategory === ALL_CAT) return itemsForActiveTab;
    return itemsForActiveTab.filter((i) => i.eventType === activeCategory);
  }, [activeCategory, itemsForActiveTab]);

  const visibleItems = filteredItems.slice(0, page * pageSize);
  const hasMore = visibleItems.length < filteredItems.length;
  const newCount = allItems.length;

  const handleTab = (id: string) => {
    const nextItems = id === ALL_TAB ? allItems : groups.find((g) => g.focusArea.title === id)?.items ?? [];
    analytics.onTeamNewsTabClicked(id, nextItems.length);
    setActiveTab(id);
    setActiveCategory(ALL_CAT);
    setPage(1);
  };

  const handleCategory = (id: TeamNewsEventType | typeof ALL_CAT) => {
    const nextCount =
      id === ALL_CAT ? itemsForActiveTab.length : itemsForActiveTab.filter((i) => i.eventType === id).length;
    analytics.onTeamNewsCategoryClicked(String(id), nextCount, activeTab);
    setActiveCategory(id);
    setPage(1);
  };

  const handleLoadMore = () => {
    analytics.onTeamNewsLoadMoreClicked(visibleItems.length, filteredItems.length, activeTab, String(activeCategory));
    setPage((p) => p + 1);
  };

  const handleCardClick = (item: ITeamNewsItem) => {
    const position = visibleItems.findIndex((v) => v.uid === item.uid);
    analytics.onTeamNewsCardClicked(item, position >= 0 ? position : 0);
  };

  if (allItems.length === 0) {
    return (
      <section className={styles.section}>
        <div className={styles.header}>
          <h2 className={styles.title}>News from the network</h2>
        </div>
        <p className={styles.sub}>Recent shipping, raises, partnerships, and milestones from across the network.</p>
        <div className={styles.empty}>No network news in the last 14 days yet. Check back soon.</div>
      </section>
    );
  }

  return (
    <section className={styles.section}>
      <div className={styles.header}>
        <h2 className={styles.title}>News from the network</h2>
        {newCount > 0 && <span className={styles.unreadBadge}>{newCount} new</span>}
      </div>
      <p className={styles.sub}>Recent shipping, raises, partnerships, and milestones from across the network.</p>

      <div className={styles.tabsRow} role="tablist" aria-label="Filter team news by focus area">
        {tabsWithCounts.map((t) => {
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              className={`${styles.tab} ${isActive ? styles.tabActive : ''}`}
              onClick={() => handleTab(t.id)}
            >
              {t.label}
              {t.count > 0 && <span className={styles.tabCount}>{t.count}</span>}
            </button>
          );
        })}
      </div>

      <div className={styles.catRow}>
        {categoriesWithCounts.map((c) => {
          const isActive = activeCategory === c.id;
          const isDisabled = c.count === 0 && c.id !== ALL_CAT;
          return (
            <button
              key={c.id}
              type="button"
              className={`${styles.cat} ${isActive ? styles.catActive : ''}`}
              onClick={() => handleCategory(c.id)}
              disabled={isDisabled}
            >
              {c.label}
              {c.count > 0 && <span className={styles.catCount}>{c.count}</span>}
            </button>
          );
        })}
      </div>

      {filteredItems.length === 0 ? (
        <div className={styles.empty}>No network news in this filter.</div>
      ) : (
        <>
          <div className={styles.grid}>
            {visibleItems.map((item) => (
              <NewsCard key={item.uid} item={item} onClick={handleCardClick} />
            ))}
          </div>
          {hasMore && (
            <div className={styles.loadMoreRow}>
              <button type="button" className={styles.loadMore} onClick={handleLoadMore}>
                Load {Math.min(pageSize, filteredItems.length - visibleItems.length)} more
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              <span className={styles.loadCount}>
                Showing {visibleItems.length} of {filteredItems.length}
              </span>
            </div>
          )}
        </>
      )}
    </section>
  );
};
