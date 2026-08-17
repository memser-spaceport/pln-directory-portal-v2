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
 *                                            pins under the header (desktop): the standing offer,
 *                                            escalating when intent is expressed.
 *  - SignInPromptModal    (new)             the requested timed prompt — "sign in and update your
 *                                            profile to increase your chances to match", opening
 *                                            itself after 20s of *visible* time on the board. It
 *                                            sits on top of the banner rather than replacing it,
 *                                            and everything that keeps a timed interstitial honest
 *                                            is in the timer, not the copy: logged-out only, once
 *                                            per session including dismissals, never over another
 *                                            dialog, paused in a background tab, and nothing on the
 *                                            board withheld to make it matter. Where the rail is
 *                                            already narrowed it reads that selection back instead
 *                                            of asking a question the person has answered.
 *  - MatchNudgeStrip      (new)             signed in, one self-extinguishing strip on production
 *                                            `DataIncomplete`. Names the criteria back when the
 *                                            rail is already narrowed — the intent is already
 *                                            expressed, so the strip offers to keep it rather than
 *                                            opening an empty form (the same intent-preserving
 *                                            move as JobAlertBanner).
 *  - JobPreferencesModal  (new)             fills in place, pre-filled from the rail, in two steps.
 *                                            Step 1 "what you want": four FormMultiSelects on the
 *                                            facet vocabulary + the profile's own "open to
 *                                            collaborate" row. Step 2 "what you do": Role, Team or
 *                                            organization and Skills — production's Experience
 *                                            entry and `member.skills`, which is what lets the
 *                                            modal say the answers go to Settings → Profile rather
 *                                            than into a job-board-only record. Step 2 is optional
 *                                            and never feeds the match; ranking stays on stated
 *                                            intent, so no seniority is inferred from a job title.
 *                                            The fields it doesn't ask for (description, dates,
 *                                            location) are editable in the profile-settings entry,
 *                                            which carries the full production field set.
 *  - "Best match for me"                    a third option on the existing SortDropdown, not a
 *                                            "For you" band: one sorted spine, and the control
 *                                            that already owns list order keeps owning it.
 * NOT gated: Apply. Blocking an application to harvest a login takes something from the person
 *  to get something from them, and the link leaves for an external ATS anyway.
 * SHARED (prototypes/entries/nav-shared/, no registry entry — like follow-shared/):
 *  - PrototypeNavBar + PrototypeMobileNav   copies of the production navbar / bottom bar carrying the
 *                                            proposed **Home** item with an unread dot — first in the
 *                                            desktop row, centre slot of the five-item mobile bar
 *                                            (Directory · Events · Home · Demo Day · More, with PL
 *                                            Infra displacing Events for viewers who have it). Hides
 *                                            the inherited real header while loaded. Shared with the
 *                                            newsfeed-discovery entry, where the item is argued in full.
 * SHARED (prototypes/entries/news-shared/, no registry entry — like follow-shared/):
 *  - TeamUpdatesLink      (default)         the card's news signal: "N new posts" on the name row,
 *                                            linking to the team's stories in the feed. Same badge
 *                                            the teams grid and member profile wear, in the feed's
 *                                            own noun — a door has to name what's behind it, and
 *                                            what's behind it is posts, not the board's job posts.
 *  - TeamUpdateStrip + mockTeamNews         the alternative kept on the version switch: the team's
 *                                            latest story told rather than counted —
 *                                            headline, two-line summary and the production NewsCard
 *                                            meta line, with "+N more updates" carrying the count
 *                                            the old badge showed. The story's age picks the
 *                                            destination: new goes to the feed at that story, old
 *                                            opens the feed's own FeedDetailModal in place. Never
 *                                            `?team=` — scoping the feed answers a question nobody
 *                                            clicking one headline asked, and leaves a filter to
 *                                            undo.
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
// Production's toast — `ToastContainer` is mounted in the root layout, which wraps
// prototype routes too, so this renders through the real react-toastify instance
// and the real `Toast` shell. Same call this prototype's ReferModal already makes.
import { toast } from '@/components/core/ToastContainer';
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
import { SignInPromptModal } from './SignInPromptModal';
import { JobPreferencesModal } from './JobPreferencesModal';
import {
  EMPTY_EXPERIENCE,
  EMPTY_PREFERENCES,
  SAVED_EXPERIENCE,
  SAVED_PREFERENCES,
  countMatches,
  hasCriteria,
  matchesPreferences,
  roleMatches,
  summariseExperience,
  type JobPreferences,
  type MemberExperience,
  type RoleCriteria,
  type ViewerId,
} from './viewerState';
import s from './JobBoardPrototype.module.scss';

/**
 * How the cards carry a team's news: the teams grid's own chip on the name row —
 * unread dot, neutral grey, the feed's noun — linking to the team's stories
 * there. Says how much is waiting, not what it is.
 *
 * This was a four-way switch while the placement was open (`inline`, `line` and
 * `full` put the latest headline next to the name, after the roles, or with a
 * description). It's settled, so the alternatives are gone rather than parked
 * behind a control — a review switch left up after the decision invites the
 * decision to be re-litigated every time someone opens the page.
 * `JobCardNewsVariant` still types the other three; only this page's choice is
 * fixed.
 */
const NEWS_VARIANT: JobCardNewsVariant = 'count';

/**
 * Which viewer the mobile bottom bar is drawn for. Named after what the person
 * has, not after the slot that moves — "PL Infra viewer" is a fact about the
 * account; which of Events or PL Infra ends up in slot two is the consequence.
 */
const PL_INFRA_OPTIONS: Array<{ value: boolean; label: string }> = [
  { value: false, label: 'Standard viewer' },
  { value: true, label: 'PL Infra viewer' },
];

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
  return values
    .map((v) => v.replaceAll(FILTER_VALUE_SEPARATOR, FILTER_VALUE_SEPARATOR_ENCODED))
    .join(URL_QUERY_VALUE_SEPARATOR);
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

/** How long a logged-out visitor browses before the sign-in prompt opens itself.
 *  Visible time only — a tab left open in the background hasn't been read. */
const SIGN_IN_PROMPT_DWELL_MS = 20_000;

/** Once per session, dismissal included. A prompt that comes back is a toll gate. */
const PROMPT_SETTLED_KEY = 'pln-proto-jobs-signin-prompt-settled';

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
      /* Starts settled so the timer can't arm before this runs — a prompt that
         appeared and then discovered it had already been dismissed would be the
         second interruption the key exists to prevent. */
      setPromptSettled(window.sessionStorage.getItem(PROMPT_SETTLED_KEY) === '1');
    } catch {
      /* storage unavailable: leave it settled. Erring toward not interrupting. */
    }

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

  /* Whether the viewer is one production would resolve PL Infra links for. Only
     the mobile bar changes shape on it — that's the bar with a fixed number of
     slots, so it's the only place the extra item has to displace something. */
  const [plInfra, setPlInfra] = useState(false);

  // Who's looking, and what they've told the board. Prototype scaffolding stands
  // in for the cookie read; everything downstream is the real decision.
  const [viewer, setViewer] = useState<ViewerId>('logged-out');
  const [preferences, setPreferences] = useState<JobPreferences>(EMPTY_PREFERENCES);
  const [experience, setExperience] = useState<MemberExperience>(EMPTY_EXPERIENCE);
  const [prefsOpen, setPrefsOpen] = useState(false);

  /* The dwell prompt. `settled` covers both outcomes — shown or dismissed — and
     survives a reload, so the interruption is a once-per-session event rather
     than something that meets the person again every time they come back to the
     tab. */
  const [promptOpen, setPromptOpen] = useState(false);
  const [promptSettled, setPromptSettled] = useState(true);

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

  /** The rail + search result set: everything the filters and the search box
   *  leave standing, before the sort orders it. */
  const railGroups = useMemo<IJobTeamGroup[]>(() => {
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
    return groups;
  }, [params, criteria]);

  const visibleGroups = useMemo<IJobTeamGroup[]>(() => {
    // A copy: the sorts below mutate, and `railGroups` is the memo's own value.
    const groups: IJobTeamGroup[] = [...railGroups];

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
  }, [railGroups, sort, matchMode, preferences]);

  const totalRoles = visibleGroups.reduce((sum, g) => sum + g.totalRoles, 0);
  const totalGroups = visibleGroups.length;

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
  const signIn = (openPreferences: boolean) => {
    try {
      window.sessionStorage.setItem(PENDING_SAVE_STORAGE_KEY, JSON.stringify(criteria));
    } catch {
      /* sessionStorage unavailable — the replay is a nicety, not a requirement */
    }
    setViewer('no-preferences');
    if (openPreferences || hasCriteria(criteria)) setPrefsOpen(true);
  };

  /* Passed to onClick handlers, so it takes no arguments — a bare `signIn` would
     be handed a MouseEvent as its flag. */
  const onSignIn = () => signIn(false);

  /* The Welcome banner always opens the form, filters or no filters — its own
     copy is "Sign in to tell us what you're looking for", so landing someone on
     a signed-in board and stopping there breaks the sentence they just pressed.
     Same contract as the dwell prompt, which makes the same promise in the same
     words and answers it the same way. */
  const onBannerSignIn = () => signIn(true);

  /** Marks the dwell prompt done for the session, whichever way it ended. */
  const settlePrompt = () => {
    setPromptOpen(false);
    setPromptSettled(true);
    try {
      window.sessionStorage.setItem(PROMPT_SETTLED_KEY, '1');
    } catch {
      /* storage unavailable — the in-memory flag still holds for this page life */
    }
  };

  /* The dwell timer. Counts only while the tab is visible, never runs for a
     signed-in viewer, never opens over the preferences modal, and arms once —
     `promptSettled` is set the moment it fires, so a dismissal and a sign-in end
     it the same way. Ticking a counter rather than one long `setTimeout` is what
     lets a backgrounded tab pause instead of accruing time nobody spent reading. */
  useEffect(() => {
    if (!mounted || isLoggedIn || promptSettled || promptOpen || prefsOpen) return;

    let spent = 0;
    const id = window.setInterval(() => {
      if (document.visibilityState !== 'visible') return;
      spent += 1000;
      if (spent < SIGN_IN_PROMPT_DWELL_MS) return;
      window.clearInterval(id);
      setPromptOpen(true);
      setPromptSettled(true);
      try {
        window.sessionStorage.setItem(PROMPT_SETTLED_KEY, '1');
      } catch {
        /* see above */
      }
    }, 1000);

    return () => window.clearInterval(id);
  }, [mounted, isLoggedIn, promptSettled, promptOpen, prefsOpen]);

  /* Signing in from the prompt always opens the form, filters or no filters: the
     prompt asked for a profile update, so it has to land on the thing that
     collects one. */
  const onPromptSignIn = () => {
    settlePrompt();
    signIn(true);
  };

  const onSavePreferences = (next: JobPreferences, nextExperience: MemberExperience) => {
    /* The stash has done its job. Left behind it would replay on the next load
       and re-narrow the rail for someone whose preferences are already saved —
       a filter they didn't set, from a session they'd finished. */
    try {
      window.sessionStorage.removeItem(PENDING_SAVE_STORAGE_KEY);
    } catch {
      /* nothing to clean up if storage is unavailable */
    }
    setPreferences(next);
    setExperience(nextExperience);
    setViewer('preferences-set');
    setPrefsOpen(false);
    // The list re-sorts behind the modal — the reward has to be visible from where
    // they were standing, not somewhere they'd have to go looking for it.
    setParam('sort', MATCH_SORT);

    /* The confirmation is a toast, not a strip in the page.

       It reports on something that just happened and then has nothing left to
       say, which is what a toast is for — and it dismisses itself, so the
       "report and leave" behaviour comes from the component instead of an 8s
       timer clearing a flag. Production's `toast`, mounted app-wide in
       app/layout.tsx: same shell, position and status icon as every other
       confirmation in the product, including this prototype's own referral
       error.

       It also unblocks the page. As a strip it took the slot directly above the
       list, so the moment it appeared it pushed the newly re-sorted board down —
       the confirmation covered the thing it was confirming.

       Counts come off `next`, not the `preferences` state set two lines up: that
       setter hasn't applied yet on this tick. `visibleGroups` is the rail's
       current set, which saving doesn't change — only the sort does, and sorting
       doesn't change how many roles match. */
    const savedMatches = countMatches(visibleGroups, next);
    const profileLine = summariseExperience(nextExperience);

    toast.success(
      <>
        {/* One template string for the tail, not interleaved JSX: two expressions
            with text between them lose the space at the wrap and it renders
            "13roles". */}
        Saved. <strong>{savedMatches}</strong>
        {` of ${totalRoles} roles match what you're looking for — sorted to the top, and teams hiring for them can find you.`}
        {/* Only when there's a line to name — skills alone are a real answer but
            not a sentence, and "your profile now reads ." is worse than saying
            nothing. */}
        {profileLine && ` Your profile now reads ${profileLine}.`}
      </>,
    );
  };

  /* Prototype scaffolding: replay the dwell prompt on demand.
   *
   * It can't be reviewed any other way. The prompt fires once per session after
   * 20 seconds of *visible* time, and firing settles it permanently — so without
   * this, seeing it a second time means a new session and another 20-second wait.
   *
   * Puts the viewer back to logged-out first, because a sign-in prompt shown to
   * someone already signed in would be reviewing a state that can't happen. */
  const showPromptNow = () => {
    setViewer('logged-out');
    setPreferences(EMPTY_PREFERENCES);
    setExperience(EMPTY_EXPERIENCE);
    setPrefsOpen(false);
    try {
      window.sessionStorage.removeItem(PROMPT_SETTLED_KEY);
    } catch {
      /* nothing to clear if storage is unavailable */
    }
    setPromptSettled(false);
    setPromptOpen(true);
  };

  /* PL Infra is a signed-in-only slot, so choosing that viewer has to sign the
     page in — otherwise the switch looks broken from the default logged-out
     state, which is the state a reviewer opens the board in. Turning it back off
     leaves the session alone: signing out isn't what "standard viewer" means. */
  const onSelectMobileBar = (next: boolean) => {
    setPlInfra(next);
    if (next && !isLoggedIn) setViewer('no-preferences');
  };

  const onSelectViewer = (next: ViewerId) => {
    setViewer(next);
    setPreferences(next === 'preferences-set' ? SAVED_PREFERENCES : EMPTY_PREFERENCES);
    setExperience(next === 'preferences-set' ? SAVED_EXPERIENCE : EMPTY_EXPERIENCE);
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
        searchable
      />
      {/* No auth prop: the mobile bottom bar carries no account cluster in
          production either, so there is nothing for it to switch. PL Infra is
          the exception — it's signed-in-only, so the slot follows the viewer. */}
      <PrototypeMobileNav
        hasUnreadNews={hasNewsUpdates}
        newsHref="/prototypes/newsfeed"
        active={false}
        plInfra={isLoggedIn && plInfra}
      />
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

  /* The way back into the preferences form.

     Without it step 1 was write-once: the nudge strip removes itself the moment
     preferences exist, and the sort gate stops firing for the same reason, so
     between them there was no route back to the modal. Step 2's answers were
     always editable — they land on real profile fields and the modal says so —
     but the four things that actually sort the board were not.

     Only while `matchMode` is on, which already implies saved preferences (see
     its definition). That's the one moment the person is looking at a board
     arranged by an answer they gave, so it's the one moment "change that answer"
     is worth screen space. Under any other sort it would be a control for
     something not currently happening.

     Reopens the modal rather than linking to /settings/job-alerts, where this
     state really lives: sending someone to settings to widen a search they are
     standing in front of is the trip the modal exists to avoid. `prefsOpen` is
     the existing state and the modal already seeds from saved preferences, so
     this is a setter call and nothing else. */
  const titleBlock = (
    <>
      <h1 className={contentCss.title}>
        Job Board{' '}
        <span className={contentCss.titleCount}>
          ({totalRoles} {totalRoles === 1 ? 'role' : 'roles'} across {totalGroups} {totalGroups === 1 ? 'team' : 'teams'}
          )
        </span>
      </h1>
      {matchMode && (
        <p className={s.matchLine}>
          Sorted around what you&apos;re looking for.{' '}
          <button type="button" className={s.matchEdit} onClick={() => setPrefsOpen(true)}>
            Edit
          </button>
        </p>
      )}
    </>
  );

  const content = (
    <div className={contentCss.root}>
      {/* Logged out: the same banner production's home page shows a signed-out
          visitor (`components/page/home/Welcome`), in the same slot it holds
          there — first block in the column, above the page's own content. One
          sign-in ask per page, and it's this one. */}
      {!isLoggedIn && <SignInBanner criteria={criteria} onSignIn={onBannerSignIn} />}

      {/* Prototype-only: replay the dwell prompt without waiting out its timer.
          Directly under the Welcome banner, because that's the state it belongs
          to — the prompt is the logged-out ask, and pressing this puts the page
          back to logged out, so the control and the thing it produces sit
          together.

          Note what it is *not*: the banner's own Sign in opens the preferences
          modal, which is where the prompt leads, but the prompt itself is a
          different dialog with its own copy. Reaching the destination is not the
          same as reviewing the thing that sends you there.

          Unconditional, unlike the banner above it — signed in, this is the way
          back to the logged-out state, so gating it on `!isLoggedIn` would make
          it unreachable exactly when it's needed. */}
      <div className={s.promptBand}>
        <div className={v0.switchBar}>
          <span className={v0.switchLabel}>Sign-in prompt</span>
          <div className={v0.switch}>
            <button type="button" className={`${v0.switchBtn} ${v0.switchBtnActive}`} onClick={showPromptNow}>
              Show it now
            </button>
          </div>
          <span className={v0.switchNote}>
            Logged out, it opens by itself after 20s of visible time on the page — once per session, never over another
            dialog, and dismissing it settles it for good.
          </span>
        </div>
      </div>

      {/* Mobile (< 1024): title + the "⊕ Filters" / sort trigger (desktop toolbar is hidden here). */}
      {/* `mobileHeader` is a baseline row with no wrap, so the match line would
          sit alongside the title and overflow on a narrow screen. The local class
          only adds wrapping. */}
      <div className={`${contentCss.mobileHeader} ${s.mobileHeaderWrap}`}>{titleBlock}</div>
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
        <MatchNudgeStrip criteria={criteria} preferences={preferences} onSetPreferences={() => setPrefsOpen(true)} />
      )}

      {visibleGroups.length === 0 ? (
        <div className={s.empty}>No roles match your filters. Try clearing some.</div>
      ) : (
        <div className={contentCss.list}>
          {visibleGroups.map((group) => (
            <JobTeamGroupCard
              key={group.team.uid}
              group={group}
              newsVariant={NEWS_VARIANT}
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

  /* Review chrome, above the navbar rather than inside the content column.
     These switches are scaffolding for whoever is reviewing the prototype, not
     part of the page — sitting between the toolbar and the list they read as a
     product control, and they pushed the thing under review below the fold.
     Above the header they're plainly outside the page, and they scroll away
     while the (sticky) navbar stays, so the board is reviewed on its own. */
  const reviewControls = (
    <div className={s.reviewBand}>
      <div className={s.versionRow}>
        {/* The team-update switch used to lead here; the placement is settled, so
            the cards just wear it (see NEWS_VARIANT). The "Preview as" viewer
            switch is parked — the viewer state and `onSelectViewer` below still
            drive the page from their defaults, so it can come back by rendering a
            switchBar over VIEWER_OPTIONS. */}

        {/* The mobile bar's fifth slot. Nothing above 1024px shows it, so it's
            worth saying what it does rather than leaving the switch looking
            broken on a desktop review. */}
        <div className={v0.switchBar}>
          <span className={v0.switchLabel}>Mobile bar</span>
          <div className={v0.switch} role="tablist" aria-label="Mobile bottom bar variant">
            {PL_INFRA_OPTIONS.map((opt) => (
              <button
                key={String(opt.value)}
                type="button"
                role="tab"
                aria-selected={plInfra === opt.value}
                className={`${v0.switchBtn} ${plInfra === opt.value ? v0.switchBtnActive : ''}`}
                onClick={() => onSelectMobileBar(opt.value)}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <span className={v0.switchNote}>
            Visible under 1024px. Home holds the centre slot in both orders — Directory · Events · Home · Demo Day ·
            More, or Directory · PL Infra · Home · Demo Day · More, with Events demoted into More. Picking the PL Infra
            viewer signs the page in, because nobody resolves PL Infra logged out.
          </span>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {reviewControls}
      {nav}
      <DashboardPagesLayout filters={<JobBoardFilterView />} content={content} />
      {/* The dwell prompt. Never rendered alongside the preferences modal — the
          timer won't fire while that's open, and signing in from here closes this
          one before opening that one. */}
      <SignInPromptModal open={promptOpen} criteria={criteria} onClose={settlePrompt} onSignIn={onPromptSignIn} />
      <JobPreferencesModal
        open={prefsOpen}
        onClose={() => setPrefsOpen(false)}
        preferences={preferences}
        criteria={criteria}
        experience={experience}
        onSave={onSavePreferences}
      />
    </>
  );
}
