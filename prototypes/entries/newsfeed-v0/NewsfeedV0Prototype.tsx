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

import { V0FeedCard } from './V0FeedCard';
import type { TeamCluster } from './V0NewsCard';
import { FeedRail } from './FeedRail';
import { DigestBanner } from './DigestBanner';
import { WhyFollowBanner } from './WhyFollowBanner';
import { QuickActionsMock } from './QuickActionsMock';
import { FocusAreaSectionMock } from './FocusAreaSectionMock';
import { FollowToast } from '../follow-shared/FollowToast';
import { MOCK_GROUPS } from './mocks';
import local from './NewsfeedV0.module.scss';

const groups = MOCK_GROUPS;
const PAGE_SIZE = 6;

type Mode = 'v0' | 'banner' | 'v1';

const MODE_LABEL: Record<Mode, string> = {
  v0: 'V0',
  banner: 'V0 + digest',
  v1: 'V1',
};

const MODE_NOTE: Record<Mode, string> = {
  v0: 'Single column (two action-cards wide) — no sidebar, no upvotes.',
  banner: 'Same column, with the digest banner filling the reserved side column.',
  v1: 'Adds the follow-suggestions / focus-areas / popular rail and per-story upvotes.',
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
 * Newsfeed redesign. Single-column feed (one card per team, newest first) in
 * two cuts: V0 ships without the right rail or per-story upvotes; V1 adds
 * both back. Same shell, cards, and data either way — only that surface area
 * differs, so the two are easy to compare side by side.
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
  // Demo-only: preview the digest rail as a new user vs an already-subscribed one.
  const [digestSubscribed, setDigestSubscribed] = useState(false);

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

  const visibleClusters = expanded ? clusters : clusters.slice(0, PAGE_SIZE);
  const newCount = allItems.length;
  // A rail (and its reserved column) only exists in the banner / V1 modes; plain
  // V0 has none, so its cards grow to the full width.
  const hasRail = mode === 'banner' || mode === 'v1';

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
            {(['v0', 'banner', 'v1'] as const).map((m) => (
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

          {/* Demo-only: preview the digest rail in either subscription state (banner mode only). */}
          {mode === 'banner' && (
            <div className={local.switch} role="tablist" aria-label="Digest state (demo)">
              {([false, true] as const).map((sub) => (
                <button
                  key={String(sub)}
                  type="button"
                  role="tab"
                  aria-selected={digestSubscribed === sub}
                  className={clsx(local.switchBtn, digestSubscribed === sub && local.switchBtnActive)}
                  onClick={() => setDigestSubscribed(sub)}
                >
                  {sub ? 'Subscribed' : 'Not subscribed'}
                </button>
              ))}
            </div>
          )}
        </div>

        <QuickActionsMock />

        <div className={styles.home__cn__teamnews}>
          {isEmpty(allItems) ? (
          <NewsBase>
            <div className={s.empty}>No network news in the last 14 days yet. Check back soon.</div>
          </NewsBase>
        ) : (
          <NewsBase headerDetails={newCount > 0 && <span className={s.unreadBadge}>{newCount} new</span>}>
            {/* Constrain the tabs' underline to end at the news-card's right edge
                (reserve the rail column), instead of spanning the full width. */}
            <div className={clsx(local.tabsConstrain, mode === 'banner' && local.tabsConstrainBanner)}>
              <TeamNewsTabs groups={groups} allItems={allItems} activeTab={activeTab} onTabChange={handleTab} />
            </div>

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
                <div className={clsx(local.feedLayout, mode === 'banner' && local.feedLayoutBanner)}>
                  <div className={local.feedList}>
                    {visibleClusters.map((cluster) => (
                      <V0FeedCard
                        key={cluster.teamUid}
                        cluster={cluster}
                        following={followedTeams.has(cluster.teamUid)}
                        onToggleFollow={() => toggleFollow(cluster.teamUid, cluster.teamName)}
                        showUpvote={mode === 'v1'}
                      />
                    ))}
                  </div>
                  {/* The rail (and its reserved column) only exists in the banner / V1
                      modes — plain V0 drops it so the cards grow to full width. Banner
                      mode: the digest banner; V1: the full follow-suggestions rail. */}
                  {hasRail && (
                    <aside className={clsx(local.feedRail, mode === 'banner' && local.railHideMobile)}>
                      {mode === 'v1' ? (
                        <FeedRail followedTeams={followedTeams} onToggleFollow={toggleFollow} allItems={allItems} />
                      ) : (
                        <>
                          {/* Why-follow explainer sits above the digest banner. */}
                          <WhyFollowBanner />
                          <DigestBanner
                            subscribed={digestSubscribed}
                            onToggle={() => setDigestSubscribed((v) => !v)}
                          />
                        </>
                      )}
                    </aside>
                  )}
                </div>
                {clusters.length > PAGE_SIZE && (
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

        {/* V1's rail already carries a Focus Areas module — no duplicate below. */}
        {mode !== 'v1' && (
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
