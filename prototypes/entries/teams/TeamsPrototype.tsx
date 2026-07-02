'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
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
import { TeamCardView } from './TeamCardView';
import { FollowToast } from '../follow-shared/FollowToast';
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

  const [followed, setFollowed] = useState<Set<string>>(new Set());
  const [toastName, setToastName] = useState<string | null>(null);
  // Demo-only: how the Follow control is presented on each card.
  const [cardVariant, setCardVariant] = useState<'cta' | 'top'>('cta');
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
  }, []);

  const toggleFollow = (id: string, name: string) => {
    setFollowed((prev) => {
      const next = new Set(prev);
      const willFollow = !next.has(id);
      next.has(id) ? next.delete(id) : next.add(id);
      if (willFollow) {
        setToastName(name);
        if (toastTimer.current) clearTimeout(toastTimer.current);
        toastTimer.current = setTimeout(() => setToastName(null), 4000);
      }
      return next;
    });
  };

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
      <TeamsMobileFiltersView filterCount={filterCount} />

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
                    following={followed.has(team.id)}
                    onToggleFollow={() => toggleFollow(team.id, team.name ?? 'team')}
                    variant={cardVariant}
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
      {/* Demo-only switcher: compare the two Follow-control card designs. */}
      <div className={s.demoBar}>
        <span className={s.demoLabel}>Follow control</span>
        <Tabs
          variant="pill"
          value={cardVariant}
          onValueChange={(v) => setCardVariant(v as 'cta' | 'top')}
          tabs={[
            { label: 'Secondary CTA', value: 'cta' },
            { label: 'Tertiary (top)', value: 'top' },
          ]}
        />
      </div>

      <DashboardPagesLayout filters={<TeamsFilterView />} content={content} />

      {toastName && (
        <FollowToast>
          You&apos;re following <strong>{toastName}</strong> — you&apos;ll get its updates in your feed.
        </FollowToast>
      )}
    </div>
  );
}
