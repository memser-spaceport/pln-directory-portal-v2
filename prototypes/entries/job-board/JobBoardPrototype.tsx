'use client';

/**
 * Job Board — faithful mocked copy of production /jobs.
 *
 * REUSE MAP (import verbatim, never copy CSS):
 *  - DashboardPagesLayout            @/components/core/dashboard-pages-layout/DashboardPagesLayout  (two-pane shell)
 *  - SortDropdown                    @/components/common/filters/SortDropdown                        (toolbar sort)
 *  - FiltersSidePanel / FilterSection / GenericCheckboxList / SearchInput  @/components/common/filters/*  (filter rail)
 *  - useGetFocusTags / TagsList / RoleRow Icons + *.module.scss (1:1)      @/components/page/jobs/TeamGroupCard/*
 *  - ArrowUpRightIcon                @/components/icons/ArrowUpRightIcon                             (leaves-the-page glyph)
 *  - jobs.utils (getJobDate, seniority sort, workplace helpers)            @/utils/jobs.utils
 *  - JobsContent.module.scss         @/app/jobs/(jobs-page)/@content/JobsContent.module.scss         (root/toolbar/list/title CSS, 1:1)
 * COPY-SIMPLIFY (prototype-local, mock store):
 *  - JobBoardFilterView   ← JobsFilterBody + FiltersContent   (react-query facets → mock facets)
 *  - mockJobsFilterStore  ← useJobsFilterStore                (Zustand + URL sync → external store)
 *  - JobTeamGroupCard     ← TeamGroupCard   (forked to render JobReferRoleRow; reuses its SCSS 1:1)
 *  - JobReferRoleRow      ← ReferRoleRow    (forked to add the "Refer" button; reuses its SCSS 1:1;
 *                                            keeps the production ReferMenu share icon alongside)
 *  - ReferModal           (new)             pick a member, pick who hears about it, send a drafted
 *                                            referral. Chrome = Demo Day's "Make an intro" modal
 *                                            (ReferCompanyModal.module.scss) inside production
 *                                            Modal; fields = FormSelect / FormTextArea. Mocked.
 * THE MATCH NUDGE (what this entry is asking about):
 *  A logged-out visitor sees exactly what a member sees, so signing in buys them nothing. The
 *  exchange offered here: tell the board what you're looking for, and it sorts around you and
 *  makes you findable by teams hiring for it.
 *  - viewerState          (new)             `RoleCriteria` = the four facet axes, which is also
 *                                            production's `IJobAlertFilterState`. One predicate,
 *                                            `roleMatches`, does filtering AND ranking so the two
 *                                            can't drift; the preference verb adds one guard —
 *                                            empty preferences match nothing, empty filters match
 *                                            everything.
 *  - SignInBanner         (new)             the logged-out ask, wearing production's home banner
 *                                            (components/page/home/Welcome, SCSS imported verbatim)
 *                                            so signing in looks the same here as at /home. Its
 *                                            second line reads the narrowed rail back, and once the
 *                                            rail IS narrowed the banner condenses to one line and
 *                                            pins under the header (desktop) — the answer to "open a
 *                                            modal after a few seconds". A timer fires when the
 *                                            person has been given nothing and asked for nothing;
 *                                            filtering is the intent, and it's already the whole
 *                                            question the modal would ask. So the ask escalates when
 *                                            earned, and by staying in view rather than blocking.
 *  - MatchNudgeStrip      (new)             signed in, one self-extinguishing strip on production
 *                                            `DataIncomplete`. Names the criteria back when the
 *                                            rail is already narrowed — the intent is already
 *                                            expressed, so the strip offers to keep it rather than
 *                                            opening an empty form (the same intent-preserving
 *                                            move as JobAlertBanner).
 *  - JobPreferencesModal  (new)             fills in place, pre-filled from the rail. Four
 *                                            FormMultiSelects on the facet vocabulary + the
 *                                            profile's own "open to collaborate" row.
 *  - "Best match for me"                    a third option on the existing SortDropdown, not a
 *                                            "For you" band: one sorted spine, and the control
 *                                            that already owns list order keeps owning it.
 * NOT gated: Apply. Blocking an application to harvest a login takes something from the person
 *  to get something from them, and the link leaves for an external ATS anyway.
 * SHARED (prototypes/entries/nav-shared/, no registry entry — like follow-shared/):
 *  - PrototypeNavBar + PrototypeMobileNav   copies of the production navbar / bottom bar carrying the
 *                                            proposed **News** item (first in the list) with an unread
 *                                            dot. Hides the inherited real header while loaded.
 *                                            Shared with the newsfeed-discovery entry, where the item
 *                                            is argued in full.
 * SHARED (prototypes/entries/news-shared/, no registry entry — like follow-shared/):
 *  - TeamUpdateStrip + mockTeamNews         the team's latest story told rather than counted —
 *                                            headline, two-line summary and the production NewsCard
 *                                            meta line, with "+N more updates" carrying the count
 *                                            the old badge showed. The story's age picks the
 *                                            destination: new goes to the feed at that story, old
 *                                            opens the feed's own FeedDetailModal in place. Never
 *                                            `?team=` — scoping the feed answers a question nobody
 *                                            clicking one headline asked, and leaves a filter to
 *                                            undo. (TeamUpdatesLink, the "N new updates" badge, is
 *                                            still what the teams grid and member-profile wear.)
 *  - RecipientPicker      (new)             one "type a name or email" field: hiring team grouped
 *                                            first with role lines, external addresses added from
 *                                            the same menu. react-select Creatable wearing
 *                                            FormMultiSelect's chrome (no production select can
 *                                            order, describe AND create).
 * OMITTED vs production: Focus Area tree filter, job-alert banner/indicator, infinite scroll,
 *  analytics, mobile filter sheet. Data is mocked; no API/react-query calls.
 */

import { useEffect, useMemo, useState } from 'react';

import DashboardPagesLayout from '@/components/core/dashboard-pages-layout/DashboardPagesLayout';
import { SortDropdown, type SortOption } from '@/components/common/filters/SortDropdown';
import { JOBS_SORT_OPTIONS } from '@/services/jobs/constants';
import { PENDING_SAVE_STORAGE_KEY } from '@/services/job-alerts/constants';
import { getJobDate } from '@/utils/jobs.utils';
import { URL_QUERY_VALUE_SEPARATOR } from '@/utils/constants';
import { FILTER_VALUE_SEPARATOR, FILTER_VALUE_SEPARATOR_ENCODED } from '@/constants/filters';
import type { IJobTeamGroup, JobsSortKey } from '@/types/jobs.types';

// Reuse the production content shell styling 1:1 (root / toolbar / title / list).
import contentCss from '@/app/jobs/(jobs-page)/@content/JobsContent.module.scss';

import { PrototypeNavBar } from '../nav-shared/PrototypeNavBar';
import { PrototypeMobileNav } from '../nav-shared/PrototypeMobileNav';
import { getTeamNews } from '../news-shared/mockTeamNews';

// Reuse the newsfeed prototypes' switch chrome so prototype-only controls look
// the same across the category (newsfeed and newsfeed-discovery import it too).
import v0 from '../newsfeed-v0/NewsfeedV0.module.scss';

import { MOCK_JOB_GROUPS } from './mocks';
import { useMockJobsFilterStore } from './mockJobsFilterStore';
import { JobBoardFilterView } from './JobBoardFilterView';
import { JobBoardMobileFilters } from './JobBoardMobileFilters';
import { JobTeamGroupCard, type JobCardNewsVariant } from './JobTeamGroupCard';
import { MatchNudgeStrip } from './MatchNudgeStrip';
import { SignInBanner } from './SignInBanner';
import { JobPreferencesModal } from './JobPreferencesModal';
import {
  EMPTY_PREFERENCES,
  SAVED_PREFERENCES,
  countMatches,
  hasCriteria,
  matchesPreferences,
  roleMatches,
  type JobPreferences,
  type RoleCriteria,
  type ViewerId,
} from './viewerState';
import s from './JobBoardPrototype.module.scss';

/**
 * The three versions of the team-update strip, demoed rather than decided. One
 * switch rather than a detail × placement pair: next to the name only ever means
 * without a description, so a two-axis control would offer combinations that
 * don't exist.
 */
const NEWS_OPTIONS: Array<{ value: JobCardNewsVariant; label: string }> = [
  { value: 'inline', label: 'Next to the name' },
  { value: 'line', label: 'Below the roles' },
  { value: 'full', label: 'Below, with description' },
  { value: 'count', label: 'N updates' },
];

const NEWS_NOTE: Record<JobCardNewsVariant, string> = {
  inline: 'The headline stands where the "N new updates" badge did — no description on a name row.',
  line: 'A band after the roles: the latest headline and when it landed.',
  full: 'The same band, plus event type · source · date and the summary clamped to two lines.',
  count: 'The badge the others replaced, for comparison: a count, on the name row, saying nothing about what happened.',
};

function decodeMulti(raw: string | null): string[] {
  if (!raw) return [];
  return raw
    .split(URL_QUERY_VALUE_SEPARATOR)
    .map((r) => r.trim().replaceAll(FILTER_VALUE_SEPARATOR_ENCODED, FILTER_VALUE_SEPARATOR))
    .filter(Boolean);
}

/** Exact inverse of `decodeMulti`. Same `join('|')` production's
 *  `filterStateToURLSearchParams` writes, so the replayed rail is byte-identical
 *  to one the person had narrowed by hand. */
function encodeMulti(values: string[]): string {
  return values.map((v) => v.replaceAll(FILTER_VALUE_SEPARATOR, FILTER_VALUE_SEPARATOR_ENCODED)).join(
    URL_QUERY_VALUE_SEPARATOR,
  );
}

const CRITERIA_KEYS = ['roleCategory', 'seniority', 'workplaceType', 'location'] as const;

/** The three viewers the nudge has to answer to. Prototype scaffolding — the real
 *  page reads cookies; what's being reviewed is what each of them sees. */
const VIEWER_OPTIONS: Array<{ value: ViewerId; label: string }> = [
  { value: 'logged-out', label: 'Logged out' },
  { value: 'no-preferences', label: 'Signed in' },
  { value: 'preferences-set', label: 'Signed in, preferences set' },
];

const VIEWER_NOTE: Record<ViewerId, string> = {
  'logged-out': 'Nothing is hidden and Apply still works — the only locked thing is the match itself.',
  'no-preferences':
    'Signed in, but the board still doesn’t know what they want. Narrow the rail to see the ask change.',
  'preferences-set': 'Engineering · Senior, Lead · Remote. The strip is gone; the payoff is in the sort.',
};

const MATCH_SORT = 'best_match';

/** A lock rides in the label — `SortOption.label` is a ReactNode, and SortDropdown
 *  has no disabled state, so the gate is swallowed in the change handler instead.
 *  Same lock asset family the production login strip uses, so "you need an account"
 *  looks the same here as everywhere else — the grey one, because `lock.svg` is
 *  stroked white for that strip's blue background and vanishes on a white menu. */
const LOCKED_MATCH_LABEL = (
  <span className={s.lockedOption}>
    Best match for me <img src="/icons/lock-grey.svg" alt="" width={14} height={14} />
  </span>
);

export default function JobBoardPrototype() {
  // Reused filter components are base-ui / react-hook-form (client-only). Gate on
  // mount so SSR === first client render (avoids hydration mismatch). Mock dates
  // are also computed client-side only, for the same reason.
  const [mounted, setMounted] = useState(false);

  const { params, setParam, setAllParams } = useMockJobsFilterStore();

  /* The return leg of the sign-in round-trip, mirroring production's own replay
     (`JobsContent.tsx`: read the key, remove it, put the filter state back into
     the URL). `onSignIn` below writes the stash; without this it was write-only,
     so a visitor who narrowed the rail, signed in and came back landed on an
     unfiltered board being asked what they were looking for — the one question
     they had already answered. Read once, on mount, then drop the key. */
  useEffect(() => {
    setMounted(true);
    try {
      const raw = window.sessionStorage.getItem(PENDING_SAVE_STORAGE_KEY);
      if (!raw) return;
      window.sessionStorage.removeItem(PENDING_SAVE_STORAGE_KEY);

      const pending = JSON.parse(raw) as Partial<RoleCriteria>;
      const restored = new URLSearchParams();
      for (const key of CRITERIA_KEYS) {
        const values = pending[key];
        if (Array.isArray(values) && values.length) restored.set(key, encodeMulti(values));
      }
      if (Array.from(restored.keys()).length) setAllParams(restored);
    } catch {
      /* storage unavailable or the stash is unreadable — the board just opens
         unnarrowed, which is the state it would have been in anyway */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Prototype chrome, ephemeral like every other version switch here — not in the
  // URL, which belongs to the filters.
  const [newsVariant, setNewsVariant] = useState<JobCardNewsVariant>('inline');

  // Who's looking, and what they've told the board. Prototype scaffolding stands
  // in for the cookie read; everything downstream is the real decision.
  const [viewer, setViewer] = useState<ViewerId>('logged-out');
  const [preferences, setPreferences] = useState<JobPreferences>(EMPTY_PREFERENCES);
  const [prefsOpen, setPrefsOpen] = useState(false);
  const [justSaved, setJustSaved] = useState(false);

  const isLoggedIn = viewer !== 'logged-out';

  const rawSort = params.get('sort') ?? 'newest';
  // Only signed-in viewers with preferences can actually be ranked, so the match
  // sort falls back rather than producing an order nobody can explain.
  const matchMode = rawSort === MATCH_SORT && hasCriteria(preferences);
  const sort = (matchMode ? MATCH_SORT : rawSort === MATCH_SORT ? 'newest' : rawSort) as JobsSortKey;

  /** What the rail is currently narrowed to — the intent the visitor has already expressed. */
  const criteria = useMemo<RoleCriteria>(
    () => ({
      roleCategory: decodeMulti(params.get('roleCategory')),
      seniority: decodeMulti(params.get('seniority')),
      workplaceType: decodeMulti(params.get('workplaceType')),
      location: decodeMulti(params.get('location')),
    }),
    [params],
  );

  const visibleGroups = useMemo<IJobTeamGroup[]>(() => {
    const q = (params.get('q') || '').trim().toLowerCase();

    const groups: IJobTeamGroup[] = [];
    for (const group of MOCK_JOB_GROUPS) {
      const teamMatchesQ = !q || group.team.name.toLowerCase().includes(q);
      const roles = group.roles.filter((role) => {
        // The shared predicate — the same one the match badge runs, so a role that
        // survives the rail is always a role the badge would mark.
        if (!roleMatches(criteria, role)) return false;
        if (q && !teamMatchesQ && !role.roleTitle.toLowerCase().includes(q)) return false;
        return true;
      });
      if (roles.length) groups.push({ team: group.team, roles, totalRoles: roles.length });
    }

    if (matchMode) {
      /* Groups lead with their best match. The board is grouped by team, so
         ranking can't be a flat list with a cut line under it — the honest unit is
         the card, ordered by how many of its roles fit and tie-broken by recency
         so a one-match team doesn't outrank a three-match one. */
      const score = (g: IJobTeamGroup) => g.roles.filter((r) => matchesPreferences(preferences, r)).length;
      const newest = (g: IJobTeamGroup) => Math.max(...g.roles.map((r) => new Date(getJobDate(r)).getTime()));
      groups.sort((a, b) => score(b) - score(a) || newest(b) - newest(a));
    } else if (sort === 'company_az') {
      groups.sort((a, b) => a.team.name.localeCompare(b.team.name));
    } else if ((sort as string) === 'company_za') {
      groups.sort((a, b) => b.team.name.localeCompare(a.team.name));
    } else {
      // newest: group's most-recent role first
      const newest = (g: IJobTeamGroup) => Math.max(...g.roles.map((r) => new Date(getJobDate(r)).getTime()));
      groups.sort((a, b) => newest(b) - newest(a));
    }
    return groups;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params, criteria, sort, matchMode, preferences]);

  const totalRoles = visibleGroups.reduce((sum, g) => sum + g.totalRoles, 0);
  const totalGroups = visibleGroups.length;
  const matchCount = countMatches(visibleGroups, preferences);

  const sortOptions = useMemo<SortOption[]>(
    () => [
      ...JOBS_SORT_OPTIONS,
      { value: MATCH_SORT, label: isLoggedIn && hasCriteria(preferences) ? 'Best match for me' : LOCKED_MATCH_LABEL },
    ],
    [isLoggedIn, preferences],
  );

  /* Sign in. Production stashes the filter state and pushes `#login`, then replays
     it on return (JobAlertBanner → JobsContent). Pushing `#login` here would hand
     the page to the real Privy modal and lose the thing being reviewed — so the
     prototype writes the same key and plays back the *return* in place, which is
     the moment the design is about: you land signed in with the form already
     holding what you asked for. The mount effect above reads the stash back, so a
     real reload mid-flow lands in the same place. */
  const onSignIn = () => {
    try {
      window.sessionStorage.setItem(PENDING_SAVE_STORAGE_KEY, JSON.stringify(criteria));
    } catch {
      /* sessionStorage unavailable — the replay is a nicety, not a requirement */
    }
    setViewer('no-preferences');
    if (hasCriteria(criteria)) setPrefsOpen(true);
  };

  const onSavePreferences = (next: JobPreferences) => {
    /* The stash has done its job. Left behind it would replay on the next load
       and re-narrow the rail for someone whose preferences are already saved —
       a filter they didn't set, from a session they'd finished. */
    try {
      window.sessionStorage.removeItem(PENDING_SAVE_STORAGE_KEY);
    } catch {
      /* nothing to clean up if storage is unavailable */
    }
    setPreferences(next);
    setViewer('preferences-set');
    setPrefsOpen(false);
    setJustSaved(true);
    // The list re-sorts behind the modal — the reward has to be visible from where
    // they were standing, not somewhere they'd have to go looking for it.
    setParam('sort', MATCH_SORT);
  };

  /* The confirmation reports and leaves. Left up it would become the permanent
     banner this whole design is trying not to be. */
  useEffect(() => {
    if (!justSaved) return;
    const t = setTimeout(() => setJustSaved(false), 8000);
    return () => clearTimeout(t);
  }, [justSaved]);

  const onSelectViewer = (next: ViewerId) => {
    setViewer(next);
    setPreferences(next === 'preferences-set' ? SAVED_PREFERENCES : EMPTY_PREFERENCES);
    setJustSaved(false);
    setPrefsOpen(false);
    setParam('sort', next === 'preferences-set' ? MATCH_SORT : undefined);
  };

  /**
   * Drives the dot on the News item. Read off the shared news mock rather than
   * hardcoded, so it goes quiet when the mock has nothing — a dot that is always
   * on is decoration, not a signal. Whole-feed rather than filter-scoped: the
   * nav item is global, and a dot that flickered as you ticked job filters would
   * be reporting on the wrong thing.
   */
  const hasNewsUpdates = MOCK_JOB_GROUPS.some((g) => getTeamNews(g.team.uid, g.team.name).length > 0);

  /* Replaces the inherited production header/bottom bar, both hidden by
     nav-shared's stylesheet. Rendered outside the mount gate so the page never
     paints without its chrome. News links to the feed prototype; the dot is
     cleared by visiting, which here means leaving for that route. */
  const nav = (
    <>
      <PrototypeNavBar
        hasUnreadNews={hasNewsUpdates}
        newsHref="/prototypes/newsfeed"
        isLoggedIn={isLoggedIn}
        onSignIn={onSignIn}
      />
      {/* No auth prop: the mobile bottom bar carries no account cluster in
          production either, so there is nothing for it to switch. */}
      <PrototypeMobileNav hasUnreadNews={hasNewsUpdates} newsHref="/prototypes/newsfeed" active={false} />
    </>
  );

  if (!mounted) {
    return (
      <>
        {nav}
        <div className={s.mountGate} />
      </>
    );
  }

  const titleBlock = (
    <h1 className={contentCss.title}>
      Job Board{' '}
      <span className={contentCss.titleCount}>
        ({totalRoles} {totalRoles === 1 ? 'role' : 'roles'} across {totalGroups} {totalGroups === 1 ? 'team' : 'teams'})
      </span>
    </h1>
  );

  const content = (
    <div className={contentCss.root}>
      {/* Logged out: the same banner production's home page shows a signed-out
          visitor (`components/page/home/Welcome`), in the same slot it holds
          there — first block in the column, above the page's own content. One
          sign-in ask per page, and it's this one. */}
      {!isLoggedIn && <SignInBanner criteria={criteria} onSignIn={onSignIn} />}

      {/* Mobile (< 1024): title + the "⊕ Filters" / sort trigger (desktop toolbar is hidden here). */}
      <div className={contentCss.mobileHeader}>{titleBlock}</div>
      <div className={contentCss.mobileFilters}>
        <JobBoardMobileFilters />
      </div>

      <div className={contentCss.toolbar}>
        <div className={contentCss.titleGroup}>{titleBlock}</div>
        <SortDropdown
          options={sortOptions}
          currentSort={sort}
          onSortChange={(value) => {
            /* The gate. SortDropdown fires on every item — there's no disabled
               state — so picking the locked option becomes the nudge rather than
               a sort that silently does nothing. */
            if (value === MATCH_SORT && !hasCriteria(preferences)) {
              /* Always ends in the modal, logged in or not: picking this option is
                 the most explicit possible statement of intent, so answering it
                 with a strip that asks again would be a dead end. */
              if (!isLoggedIn) onSignIn();
              setPrefsOpen(true);
              return;
            }
            setParam('sort', value === 'newest' ? undefined : value);
          }}
          sortByLabel="Sort by:"
        />
      </div>

      {/* The nudge. Above the list, below the toolbar — production's job-alert
          banner slot, and the only place a page-level offer belongs. Signed-in
          only: logged out, the ask is the banner at the top of the column, and
          the preference question comes after the account exists. */}
      {isLoggedIn && (
        <MatchNudgeStrip
          criteria={criteria}
          preferences={preferences}
          matchCount={matchCount}
          totalRoles={totalRoles}
          justSaved={justSaved}
          onSetPreferences={() => setPrefsOpen(true)}
        />
      )}

      {/* Prototype-only: which version of the team-update strip the cards wear.
          The "Preview as" viewer switch is parked for now — the viewer state and
          `onSelectViewer` below still drive the page from their defaults, so the
          control can come back by re-rendering a switchBar over VIEWER_OPTIONS. */}
      <div className={s.versionRow}>
        <div className={v0.switchBar}>
          <span className={v0.switchLabel}>Update</span>
          <div className={v0.switch} role="tablist" aria-label="Team update version">
            {NEWS_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                role="tab"
                aria-selected={newsVariant === opt.value}
                className={`${v0.switchBtn} ${newsVariant === opt.value ? v0.switchBtnActive : ''}`}
                onClick={() => setNewsVariant(opt.value)}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <span className={v0.switchNote}>{NEWS_NOTE[newsVariant]}</span>
        </div>
      </div>

      {visibleGroups.length === 0 ? (
        <div className={s.empty}>No roles match your filters. Try clearing some.</div>
      ) : (
        <div className={contentCss.list}>
          {visibleGroups.map((group) => (
            <JobTeamGroupCard
              key={group.team.uid}
              group={group}
              newsVariant={newsVariant}
              matchMode={matchMode}
              isMatch={(role) => matchesPreferences(preferences, role)}
              canRefer={isLoggedIn}
              onReferBlocked={onSignIn}
            />
          ))}
        </div>
      )}
    </div>
  );

  return (
    <>
      {nav}
      <DashboardPagesLayout filters={<JobBoardFilterView />} content={content} />
      <JobPreferencesModal
        open={prefsOpen}
        onClose={() => setPrefsOpen(false)}
        preferences={preferences}
        criteria={criteria}
        onSave={onSavePreferences}
      />
    </>
  );
}
