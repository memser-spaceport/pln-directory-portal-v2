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
import { useMockTeamFilterStore, countAppliedFilters } from './mockTeamFilterStore';
import { TeamsFilterView } from './TeamsFilterView';
import { TeamsToolbarView } from './TeamsToolbarView';
import type { ITeamNewsItem } from '@/types/team-news.types';

import { TeamCardView, type TeamUpdatesMode } from './TeamCardView';
// Shared with the job board, which opens the same modal from the same chip.
import { TeamNewsModal } from '../news-shared/TeamNewsModal';
import s from './TeamsPrototype.module.scss';

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
   * What the card says about the team's news. Three answers now, down from six —
   * the question narrowed to how one count should be marked, so the tabs that
   * answered a different question came off. Listed in tab order:
   *  - `dot`      — "3 new posts" led by production's unread dot, and the
   *    default. The dot carries "you haven't seen it", which frees the words to
   *    name what kind of thing is waiting rather than repeating that it's new.
   *  - `new`      — "3 new" in brand blue. Twelve blue marks down a grid is
   *    twelve things competing for one click.
   *  - `short`    — the same words at the same size in the neutral chip. Sat
   *    next to the tab before it, colour is the only variable left: grey states,
   *    blue asks, and this is where you decide which the grid wants.
   *
   * The two grey chips open the team's news in place; the blue badge leaves for
   * the feed. The job board wears the same grey chip and opens the same modal,
   * so the mark behaves the same wherever it's met.
   *
   * Dropped from the switch: `count` (the same sentence behind the news glyph
   * instead of the dot), `follow` (count + a Follow control on the top band) and
   * `headline` (the latest story itself, a row of card height). `TeamCardView`
   * still implements all three — nothing selects them.
   */
  const [updatesLabel, setUpdatesLabel] = useState<TeamUpdatesMode>('dot');
  /** The chip lists a team's news here instead of leaving for the feed. */
  const [newsModal, setNewsModal] = useState<{
    teamName: string;
    items: ITeamNewsItem[];
    teamLogo: string;
  } | null>(null);

  const filterCount = countAppliedFilters(params);

  const { visibleTeams, hiddenInactiveCount } = useMemo(() => {
    const selectedTags = decodeMulti(params.get('tags'));
    const q = (params.get('searchBy') || '').trim().toLowerCase();
    const sort = params.get('sort') || SORT_OPTIONS.DEFAULT;
    const showInactive = params.get('showInactive') === 'true';

    /**
     * Every filter except the inactive gate, in one predicate. Split out so the
     * grid and the "N inactive teams are hidden" count can't disagree: the count
     * is this same test run with the gate open, not a second reading of the
     * rules. Two copies of a filter is how a list and its footnote end up
     * describing different sets.
     */
    const matchesRest = (t: (typeof MOCK_TEAMS)[number]) => {
      if (params.get('following') === 'true' && !followed.has(t.id)) return false;
      if (selectedTags.length && !(t.industryTags ?? []).some((tag) => selectedTags.includes(tag.title ?? '')))
        return false;
      if (q && !((t.name ?? '').toLowerCase().includes(q) || (t.shortDescription ?? '').toLowerCase().includes(q)))
        return false;
      return true;
    };

    const matched = MOCK_TEAMS.filter(matchesRest);
    /**
     * Teams that have wound down are in the list by default — see the toggle's
     * note in TeamsFilterView — and they sit wherever the sort puts them rather
     * than being swept to the end. Demoting them would be a second, silent
     * ranking on top of the one the reader picked from the Sort menu, and the
     * card already says what they are.
     */
    const rows = showInactive ? matched.slice() : matched.filter((t) => !t.inactive);

    if (sort === SORT_OPTIONS.ASCENDING) rows.sort((a, b) => (a.name ?? '').localeCompare(b.name ?? ''));
    if (sort === SORT_OPTIONS.DESCENDING) rows.sort((a, b) => (b.name ?? '').localeCompare(a.name ?? ''));

    return { visibleTeams: rows, hiddenInactiveCount: showInactive ? 0 : matched.length - rows.length };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params, followed]);

  if (!mounted) {
    return <div className={s.mountGate} />;
  }

  /**
   * The empty state, when the only thing standing between the reader and a
   * result is the inactive switch they turned off.
   *
   * "No teams match your filters. Try clearing some." would be advice that
   * doesn't work — the tag or search is right, and the switch is what removed
   * the answer. So the card names the actual reason and offers the way back
   * rather than sending someone to the panel to guess which control it was.
   *
   * There used to be a second copy of this as a footnote above a *populated*
   * grid, for the case where a match was sitting behind the default. That was
   * scaffolding for a default that hid teams without being asked; now that they
   * ship visible, hiding them is something the reader chose, with the switch
   * still showing its state a few inches away. Telling them about a choice they
   * just made, on every search, is noise. Only the empty case survives, because
   * only there does the omission read as "this team isn't in the directory".
   */
  const showsHiddenNote = hiddenInactiveCount > 0 && visibleTeams.length === 0;
  const one = hiddenInactiveCount === 1;

  const hiddenNoteAction = (
    <button type="button" className={s.hiddenNoteAction} onClick={() => setParam('showInactive', 'true')}>
      Show {one ? 'it' : 'them'}
    </button>
  );

  const emptyStateNote = showsHiddenNote ? (
    <>
      No teams match your filters. {one ? '1 inactive team does' : `${hiddenInactiveCount} inactive teams do`} —{' '}
      {hiddenNoteAction}
    </>
  ) : (
    'No teams match your filters. Try clearing some.'
  );

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
            <div className={s.empty}>{emptyStateNote}</div>
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
            { label: 'New posts + dot', value: 'dot' },
            // These two say "3 new" at the same 11px in the same 18px pill; the
            // only thing that differs is the colour, which is the question.
            // Named for that difference, since "New" alone no longer tells the
            // two apart.
            { label: 'New (blue)', value: 'new' },
            { label: 'New (grey)', value: 'short' },
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
