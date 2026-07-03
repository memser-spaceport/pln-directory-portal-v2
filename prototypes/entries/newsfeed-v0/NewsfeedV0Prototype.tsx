'use client';

import clsx from 'clsx';
import isEmpty from 'lodash/isEmpty';
import { useEffect, useMemo, useState } from 'react';

import type { ITeamNewsItem } from '@/types/team-news.types';

import { Button } from '@/components/common/Button';

import {
  ACTIVE_DISCUSSIONS_CAT,
  ACTIVE_DISCUSSIONS_CATEGORY,
  ALL_TAB,
  ALL_CAT,
  CATEGORIES,
  type TeamNewsCategoryId,
} from '@/components/page/home/TeamNews/constants';
import { hasExistingDiscussion } from '@/components/page/home/TeamNews/components/NewsCard/components/StartConversationButton/utils/hasExistingDiscussion';
import { dedupeByUid } from '@/components/page/home/TeamNews/utils/dedupeByUid';
import { sortAllTabItemsByEventDate } from '@/components/page/home/TeamNews/utils/sortAllTabItemsByEventDate';
import { NewsBase } from '@/components/page/home/TeamNews/components/NewsBase';
import { TeamNewsTabs } from '@/components/page/home/TeamNews/components/TeamNewsTabs';

// Reuse the production feed layout styling 1:1.
import s from '@/components/page/home/TeamNews/TeamNews.module.scss';
// Production home-page shell (outer layout + section spacing), reused 1:1.
import styles from '@/app/home/page.module.css';

import { CurrentNewsCard } from './CurrentNewsCard';
import { V0NewsCard, type TeamCluster } from './V0NewsCard';
import { V0FeedCard } from './V0FeedCard';
import { FeedRail } from './FeedRail';
import { QuickActionsMock } from './QuickActionsMock';
import { FocusAreaSectionMock } from './FocusAreaSectionMock';
import { FollowToast } from '../follow-shared/FollowToast';
import { MOCK_GROUPS } from './mocks';
import local from './NewsfeedV0.module.scss';

const groups = MOCK_GROUPS;
const PAGE_SIZE = 6;

type Mode = 'current' | 'v0' | 'even' | 'feed';

const MODE_LABEL: Record<Mode, string> = {
  current: 'Current',
  v0: 'V0 · grid',
  even: 'V0 · even',
  feed: 'V0 · feed',
};

const MODE_NOTE: Record<Mode, string> = {
  current: 'Exact copy of the production homepage feed.',
  v0: 'Quick wins: summary on card · one card per team, other updates visible · event + source + discussion in one meta line.',
  even: 'Same cards in a row grid — side-by-side cards stretch to equal height.',
  feed: 'Single column, one card per team — every story equal weight, newest first.',
};

// How much each event type matters when picking a cluster's lead story.
const EVENT_TYPE_WEIGHT: Record<ITeamNewsItem['eventType'], number> = {
  FUNDING: 5,
  LAUNCH: 4,
  PARTNERSHIP: 3,
  MILESTONE: 2,
  ANNOUNCEMENT: 1,
  OTHER: 0,
};

/**
 * Lead = most important, not most recent: event-type weight dominates, live
 * discussion activity adds to it, and recency only breaks ties (items arrive
 * newest-first, so the first highest-scored item wins).
 */
function pickLead(items: ITeamNewsItem[]): ITeamNewsItem {
  let lead = items[0];
  let best = -1;
  for (const item of items) {
    const score = EVENT_TYPE_WEIGHT[item.eventType] * 2 + Math.min(item.discussion.count, 5);
    if (score > best) {
      best = score;
      lead = item;
    }
  }
  return lead;
}

/** Group filtered items (already newest-first) into one cluster per team. */
function clusterByTeam(items: ITeamNewsItem[]): TeamCluster[] {
  const byTeam = new Map<string, ITeamNewsItem[]>();
  for (const item of items) {
    const existing = byTeam.get(item.teamUid);
    if (existing) existing.push(item);
    else byTeam.set(item.teamUid, [item]);
  }

  return Array.from(byTeam.values()).map((teamItems) => {
    const lead = pickLead(teamItems);
    return {
      teamUid: lead.teamUid,
      teamName: lead.teamName,
      teamLogoUrl: lead.teamLogoUrl,
      lead,
      rest: teamItems.filter((i) => i.uid !== lead.uid),
      isLeadNewest: lead.uid === teamItems[0].uid,
    };
  });
}

/**
 * Newsfeed redesign v0. "Current" renders a faithful copy of the production
 * homepage `TeamNews` feed (tabs → category row → card grid → Show All, with
 * analytics stripped and mock data). "V0" keeps the identical shell and layers
 * the quick wins on the cards.
 */
export default function NewsfeedV0Prototype() {
  // Tabs are base-ui / client-only — gate render so SSR === first client render.
  const [mounted, setMounted] = useState(false);
  const [mode, setMode] = useState<Mode>('v0');
  const [activeTab, setActiveTab] = useState<string>(ALL_TAB);
  const [activeCategory, setActiveCategory] = useState<TeamNewsCategoryId>(ALL_CAT);
  const [expanded, setExpanded] = useState(false);
  const [followedTeams, setFollowedTeams] = useState<Set<string>>(new Set());
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => setMounted(true), []);

  // Auto-dismiss the follow confirmation.
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  const toggleFollow = (teamUid: string, teamName: string) => {
    setFollowedTeams((prev) => {
      const next = new Set(prev);
      if (next.has(teamUid)) {
        next.delete(teamUid);
        setToast(null);
      } else {
        next.add(teamUid);
        setToast(teamName);
      }
      return next;
    });
  };

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

  const clusters = useMemo(() => clusterByTeam(filteredItems), [filteredItems]);

  const visibleItems = expanded ? filteredItems : filteredItems.slice(0, PAGE_SIZE);
  const visibleClusters = expanded ? clusters : clusters.slice(0, PAGE_SIZE);
  const totalForMode = mode === 'current' ? filteredItems.length : clusters.length;
  const newCount = allItems.length;

  const handleMode = (next: Mode) => {
    setMode(next);
    setExpanded(false);
  };

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
    <div className={clsx(local.page, styles.home)}>
      <div className={styles.home__cn}>
        <div className={local.switchBar}>
          <div className={local.switch} role="tablist" aria-label="Feed version">
            {(['current', 'v0', 'even', 'feed'] as const).map((m) => (
              <button
                key={m}
                type="button"
                role="tab"
                aria-selected={mode === m}
                className={clsx(local.switchBtn, mode === m && local.switchBtnActive)}
                onClick={() => handleMode(m)}
              >
                {MODE_LABEL[m]}
              </button>
            ))}
          </div>
          <span className={local.switchNote}>{MODE_NOTE[mode]}</span>
        </div>

        <QuickActionsMock />

        <div className={styles.home__cn__teamnews}>
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
                {mode === 'current' ? (
                  <div className={s.grid}>
                    {visibleItems.map((item) => (
                      <CurrentNewsCard key={item.uid} item={item} />
                    ))}
                  </div>
                ) : mode === 'v0' ? (
                  <div className={local.masonry}>
                    {visibleClusters.map((cluster) => (
                      <V0NewsCard
                        key={cluster.teamUid}
                        cluster={cluster}
                        following={followedTeams.has(cluster.teamUid)}
                        onToggleFollow={() => toggleFollow(cluster.teamUid, cluster.teamName)}
                      />
                    ))}
                  </div>
                ) : mode === 'even' ? (
                  <div className={s.grid}>
                    {visibleClusters.map((cluster) => (
                      <V0NewsCard
                        key={cluster.teamUid}
                        cluster={cluster}
                        following={followedTeams.has(cluster.teamUid)}
                        onToggleFollow={() => toggleFollow(cluster.teamUid, cluster.teamName)}
                      />
                    ))}
                  </div>
                ) : (
                  <div className={local.feedLayout}>
                    <div className={local.feedList}>
                      {visibleClusters.map((cluster) => (
                        <V0FeedCard
                          key={cluster.teamUid}
                          cluster={cluster}
                          following={followedTeams.has(cluster.teamUid)}
                          onToggleFollow={() => toggleFollow(cluster.teamUid, cluster.teamName)}
                        />
                      ))}
                    </div>
                    <aside className={local.feedRail}>
                      <FeedRail followedTeams={followedTeams} onToggleFollow={toggleFollow} allItems={allItems} />
                    </aside>
                  </div>
                )}
                {totalForMode > PAGE_SIZE && (
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

        {/* In feed mode the Focus Areas move into the right rail — no duplicate below. */}
        {mode !== 'feed' && (
          <div className={styles.home__cn__focusarea}>
            <FocusAreaSectionMock />
          </div>
        )}
      </div>

      {toast && (
        <FollowToast>
          You&apos;re now following {toast} — their updates will appear first in your feed. Manage who you follow from
          your profile.
        </FollowToast>
      )}
    </div>
  );
}
