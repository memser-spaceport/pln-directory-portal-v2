'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';

import { SORT_OPTIONS, URL_QUERY_VALUE_SEPARATOR } from '@/utils/constants';
import { FILTER_VALUE_SEPARATOR, FILTER_VALUE_SEPARATOR_ENCODED } from '@/constants/filters';
import DashboardPagesLayout from '@/components/core/dashboard-pages-layout/DashboardPagesLayout';
import { Tabs } from '@/components/common/Tabs/Tabs';
import { TeamsMobileFiltersView } from './TeamsMobileFiltersView';

// Reuse the production shell + content/grid styling 1:1.
import contentCss from '@/app/teams/(teams-page)/@content/page.module.css';
import listCss from '@/components/page/teams/TeamList/TeamList.module.scss';

import { MOCK_TEAMS } from './mocks';
import { useMockTeamFilterStore } from './mockTeamFilterStore';
import { TeamsFilterView } from './TeamsFilterView';
import { TeamsToolbarView } from './TeamsToolbarView';
import type { ITeamNewsItem } from '@/types/team-news.types';

import { TeamCardView, type TeamUpdatesMode } from './TeamCardView';
import { TeamNewsModal } from './TeamNewsModal';
import s from './TeamsPrototype.module.scss';

const COUNTED_PARAMS = [
  'membershipSources',
  'tags',
  'fundingStage',
  'isFund',
  'minTypicalCheckSize',
  'maxTypicalCheckSize',
  'investmentFocus',
];

function decodeMulti(raw: string | null): string[] {
  if (!raw) return [];
  return raw
    .split(URL_QUERY_VALUE_SEPARATOR)
    .map((r) => r.trim().replaceAll(FILTER_VALUE_SEPARATOR_ENCODED, FILTER_VALUE_SEPARATOR))
    .filter(Boolean);
}

export default function TeamsPrototype() {
  // Reused filter components are base-ui / react-hook-form (client-only). Gate on
  // mount so SSR === first client render (avoids hydration mismatch).
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const { params, setParam } = useMockTeamFilterStore();

  /**
   * Writable again for the `follow` tab, which is the only mode that puts a
   * Follow control on the card. The Following tab above the grid reads the same
   * set, so following from a card immediately populates it — which is the point
   * of trying the control here rather than only on the team profile.
   */
  const [followed, setFollowed] = useState<Set<string>>(new Set());
  const toggleFollow = (id: string) =>
    setFollowed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  /**
   * What the card says about the team's news — four answers to compare by
   * looking, which is the only way this call gets made honestly. Listed in tab
   * order, which is also the order they open on:
   *  - `count`    — "3 updates" in the neutral chip. States a fact and lets the
   *    team's own name stay the loudest thing on the card. The default, so the
   *    quietest treatment is the one you judge the others against.
   *  - `follow`   — that same chip paired with the feed's Follow control across
   *    the top band. Tests whether a card should let you act on a team as well
   *    as read about it.
   *  - `new`      — "3 new" in brand blue: the same count, pitched as an offer
   *    rather than a fact. Twelve blue marks down a grid is twelve things
   *    competing for one click, which is what this tab is for seeing.
   *  - `headline` — the latest story itself. Says *why* you'd open the team
   *    rather than how much is in there, and costs a row of card height to.
   */
  const [updatesLabel, setUpdatesLabel] = useState<TeamUpdatesMode>('count');
  /** The `count` chip lists a team's news here instead of leaving for the feed. */
  const [newsModal, setNewsModal] = useState<{
    teamName: string;
    items: ITeamNewsItem[];
    teamLogo: string;
  } | null>(null);

  const filterCount = COUNTED_PARAMS.filter((k) => params.get(k)).length;

  const visibleTeams = useMemo(() => {
    const selectedTags = decodeMulti(params.get('tags'));
    const q = (params.get('searchBy') || '').trim().toLowerCase();
    const sort = params.get('sort') || SORT_OPTIONS.DEFAULT;

    let rows = MOCK_TEAMS.slice();
    if (params.get('following') === 'true') {
      rows = rows.filter((t) => followed.has(t.id));
    }
    if (selectedTags.length) {
      rows = rows.filter((t) => (t.industryTags ?? []).some((tag) => selectedTags.includes(tag.title ?? '')));
    }
    if (q) {
      rows = rows.filter(
        (t) => (t.name ?? '').toLowerCase().includes(q) || (t.shortDescription ?? '').toLowerCase().includes(q),
      );
    }
    if (sort === SORT_OPTIONS.ASCENDING) rows.sort((a, b) => (a.name ?? '').localeCompare(b.name ?? ''));
    if (sort === SORT_OPTIONS.DESCENDING) rows.sort((a, b) => (b.name ?? '').localeCompare(a.name ?? ''));
    return rows;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params, followed]);

  if (!mounted) {
    return <div className={s.mountGate} />;
  }

  const content = (
    <div className={contentCss.team__right__content}>
      {/* Desktop toolbar (hidden on mobile in production). */}
      <div className={contentCss.team__right__toolbar}>
        <TeamsToolbarView totalTeams={visibleTeams.length} filterCount={filterCount} onOpenFilters={() => {}} />
      </div>

      {/* Mobile-only "Teams (N)" header + the production "⊕ Filters" + sort bar. */}
      <div className={listCss.titleSec}>
        <span className={listCss.title}>Teams</span>
        <span className={listCss.count}>({visibleTeams.length})</span>
      </div>
      <div className={s.mobileFiltersGutter}>
        <TeamsMobileFiltersView filterCount={filterCount} />
      </div>

      {/* All / Following tabs (shared Tabs component), left-aligned under the header. */}
      <div className={s.tabsRow}>
        <Tabs
          variant="underline"
          classes={{ root: s.tabsRoot, list: s.tabsList, tab: s.tabsTab }}
          value={params.get('following') === 'true' ? 'following' : 'all'}
          onValueChange={(v) => setParam('following', v === 'following' ? 'true' : undefined)}
          tabs={[
            { label: 'All', value: 'all' },
            { label: 'Following', value: 'following', badge: followed.size || undefined },
          ]}
        />
      </div>

      <div className={contentCss.team__right__teamslist}>
        <div className={listCss.root}>
          {visibleTeams.length > 0 ? (
            <div className={`${listCss.grid} ${s.gridFull}`}>
              {visibleTeams.map((team) => (
                <Link key={team.id} href="/prototypes/team-profile" prefetch={false} className={s.cardLink}>
                  <TeamCardView
                    team={team}
                    updates={updatesLabel}
                    onOpenNews={(teamName, items, teamLogo) => setNewsModal({ teamName, items, teamLogo })}
                    following={followed.has(team.id)}
                    onToggleFollow={() => toggleFollow(team.id)}
                  />
                </Link>
              ))}
            </div>
          ) : params.get('following') === 'true' && followed.size === 0 ? (
            <div className={s.empty}>You&apos;re not following any teams yet. Follow a team to see it here.</div>
          ) : (
            <div className={s.empty}>No teams match your filters. Try clearing some.</div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className={s.page}>
      {/* Demo-only switcher for how the updates badge labels itself. */}
      <div className={s.demoBar}>
        <span className={s.demoLabel}>Updates badge</span>
        <Tabs
          variant="pill"
          value={updatesLabel}
          onValueChange={(v) => setUpdatesLabel(v as TeamUpdatesMode)}
          tabs={[
            { label: 'Updates', value: 'count' },
            { label: 'Follow', value: 'follow' },
            { label: 'New', value: 'new' },
            { label: 'Headline', value: 'headline' },
          ]}
        />
      </div>

      <DashboardPagesLayout filters={<TeamsFilterView />} content={content} />

      {newsModal && (
        <TeamNewsModal
          teamName={newsModal.teamName}
          teamLogo={newsModal.teamLogo}
          items={newsModal.items}
          onClose={() => setNewsModal(null)}
        />
      )}
    </div>
  );
}
