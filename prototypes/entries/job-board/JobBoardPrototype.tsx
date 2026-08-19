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
 * THE APPLY FLOW (what this entry is asking about):
 *  A logged-out visitor sees exactly what a member sees, so signing in has to buy them something
 *  real. The exchange offered here: **apply in one click.** Your profile is the reusable half of
 *  every application, so once it exists, applying to any of the roles on this board is a cover
 *  letter and nothing else.
 *
 *  This replaced an earlier *matching* answer to the same question — tell the board what you're
 *  looking for, and it sorts around you and badges the fits "Matches you". That is gone: the badge,
 *  the "Best match for me" sort, the nudge strip and the preferences modal with it. Two reasons.
 *  A re-sorted list is a weak payoff for an account — you can see the whole board either way, so
 *  nothing actually changed for the person. And the looking-for-work axes already have a permanent
 *  home at `/settings/job-alerts` (the `settings-contact-details` entry edits exactly those four
 *  fields), so the board was collecting them twice. What the board is uniquely placed to ask for is
 *  the thing you need *at the moment you press Apply*.
 *
 *  - viewerState          (rewritten)       `RoleCriteria` is now only the filter rail. `MemberProfile`
 *                                            is the new object, and it is production's member record
 *                                            rather than a job-board form: an Experience list
 *                                            (`ExperienceEntry`, field-for-field production's
 *                                            `TEditExperienceForm`), plus skills, bio and location.
 *                                            `isProfileComplete` is the one rule that gates Apply —
 *                                            **your current role and an answered job search status**
 *                                            — stated once and read from everywhere. It was one
 *                                            experience entry until review: an entry is something
 *                                            most real profiles already carry, while the status is
 *                                            the one answer only this flow can collect and the one
 *                                            that decides whether founders see the profile at all.
 *                                            The role joined it because an application has to say
 *                                            what you do now, and it is one field the header card
 *                                            was already asking for.
 *  - SignInBanner         (new)             the logged-out ask, wearing production's home banner
 *                                            (components/page/home/Welcome, SCSS imported verbatim)
 *                                            so signing in looks the same here as at /home. Its
 *                                            headline is the offer, with the *filtered* role count
 *                                            in it, so narrowing the rail narrows the number rather
 *                                            than making it a lie. Once the rail IS narrowed the
 *                                            banner condenses to one line and pins under the header
 *                                            (desktop): the standing offer, still in view.
 *  - JobProfileDrawer     (new)             the profile step, as a right-hand drawer — the same
 *                                            pattern Demo Day uses for investor and founder profile
 *                                            completion (`EditInvestorProfileDrawer`), whose header
 *                                            and content chrome it imports verbatim. Profile
 *                                            completion looks the same everywhere in the product
 *                                            rather than being a job-board invention. **Your current
 *                                            role and the private job-search status are the whole
 *                                            requirement**, so they are the first two cards and each
 *                                            marks itself while it is unanswered; experience, project
 *                                            contributions, skills, bio and location refine a read
 *                                            that is already possible without them. Teams was cut —
 *                                            it duplicates an Experience entry's "Team or
 *                                            Organization" field.
 *  - JobApplyModal        (new)             the per-role step: who on the hiring team receives it
 *                                            (an overlapping facepile of the leads, each name linking
 *                                            to their profile), your profile read back so you can see
 *                                            what is being sent — name, the current-role line, its
 *                                            dates and your skills, not the whole history and never
 *                                            the private status — an Edit escape that opens the
 *                                            drawer in place and carries the half-written letter
 *                                            through it, and a required cover letter. The letter is
 *                                            required because without it "one-click apply" would send
 *                                            thirteen identical applications and mean nothing to
 *                                            anyone reading them.
 * GATED: Apply, and only Apply. Not to harvest a login — a one-click application sends the team
 *  your *profile* instead of a form, so there has to be a profile. Nothing on the board is hidden
 *  from a logged-out visitor: every role, every detail, and the posting itself all stay open.
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
import type { IJobRole, IJobTeamGroup, JobsSortKey } from '@/types/jobs.types';

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
import { SignInBanner } from './SignInBanner';
import { ProfileNudgeBanner, PendingApprovalBanner } from './BoardBanners';
import { JobProfileDrawer } from './JobProfileDrawer';
import { JobApplyModal } from './JobApplyModal';
import { JobSignUpModal, type JobSignUpDetails } from './JobSignUpModal';
import {
  EMPTY_PROFILE,
  FILLED_PROFILE,
  type BoardViewer,
  hasCriteria,
  isProfileComplete,
  roleMatches,
  summariseProfile,
  type MemberProfile,
  type RoleCriteria,
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
/** The four entry states the apply flow branches into — see `BoardViewer`. */
const VIEWER_OPTIONS: Array<{ value: BoardViewer; label: string }> = [
  { value: 'logged-out', label: 'Logged out' },
  { value: 'pending-approval', label: 'Signed up, pending approval' },
  { value: 'profile-incomplete', label: 'Signed in, profile empty' },
  { value: 'profile-ready', label: 'Signed in, profile ready' },
];

const VIEWER_NOTE: Record<BoardViewer, string> = {
  'logged-out': 'No account. The banner is the standing offer, and Apply is the ask at the moment of intent.',
  'pending-approval':
    'Signed up, waiting on the PL team. Browsing is untouched and the profile is editable and saveable — finishing it is the one useful thing the wait allows — but applying is off until the account is approved.',
  'profile-incomplete':
    'Signed in with nothing filled in. The ask moves from “sign in” to “update your profile”, and Apply opens the drawer on the job search status, which is the one required answer.',
  'profile-ready':
    'Signed in, profile already good. Apply goes straight to the cover letter — the modal reads the profile back, so a drawer in front of it would be showing the same thing twice.',
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
  return values
    .map((v) => v.replaceAll(FILTER_VALUE_SEPARATOR, FILTER_VALUE_SEPARATOR_ENCODED))
    .join(URL_QUERY_VALUE_SEPARATOR);
}

const CRITERIA_KEYS = ['roleCategory', 'seniority', 'workplaceType', 'location'] as const;

/**
 * A role plus the team that posted it — what the apply flow has to carry between
 * pressing Apply and sending the letter, possibly across a sign-in and a drawer.
 * The card hands the row only the role, so the team is looked up here.
 */
interface ApplyTarget {
  role: IJobRole;
  teamName: string;
}

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

    /* The apply modal's "Edit profile" opens this route in a new tab with the
       viewer it was opened from and `profile=1`. Honoured here so the tab lands
       on the profile rather than on a logged-out board — the whole point of the
       new tab is that the letter behind it survives, and a tab that opens on the
       wrong person's board would have to be navigated back to be any use.
       Prototype scaffolding: in production this is one signed-in account and the
       parameter would only need to say "open the profile". */
    try {
      const q = new URLSearchParams(window.location.search);
      const asViewer = q.get('viewer') as BoardViewer | null;
      if (asViewer && VIEWER_OPTIONS.some((o) => o.value === asViewer)) {
        setViewer(asViewer);
        setIsLoggedIn(asViewer !== 'logged-out');
        setProfile(asViewer === 'profile-ready' ? FILLED_PROFILE : EMPTY_PROFILE);
      }
      if (q.get('profile') === '1') setDrawerOpen(true);
    } catch {
      /* no search params to read — the board just opens in its default state */
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

  // Who's looking, and what the board knows about them. Prototype scaffolding
  // stands in for the cookie read; everything downstream is the real decision.
  /* Which of the four entry states the board is being reviewed in. `isLoggedIn`
     and `profile` are derived from it on selection rather than tracked in
     parallel, so the switch can't put the page in a combination that doesn't
     exist — signed out with a filled profile, say. */
  const [viewer, setViewer] = useState<BoardViewer>('logged-out');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [profile, setProfile] = useState<MemberProfile>(EMPTY_PROFILE);
  const [drawerOpen, setDrawerOpen] = useState(false);

  /** Signed up, waiting on the PL team. Browsing is fine; applying is not. */
  const isPendingApproval = viewer === 'pending-approval';

  /* The apply flow's two halves.
   *
   * `applyTarget` is the role whose modal is open. `pendingApply` is the role
   * someone pressed Apply on *before* they could — logged out, or signed in with
   * an incomplete profile — held across the sign-in and the drawer so the flow
   * resumes where it was interrupted instead of dropping the person back on the
   * board to find their place again. Losing it is the difference between a gate
   * and a dead end. */
  /* The sign-up modal's state, and the role it is carrying if any.
   *
   * `null` = closed. `{ target: null }` = open with no role, which is what a
   * plain **Sign up** press produces — from the header or the banner, where the
   * person is asking for an account rather than for one particular job.
   * `{ target }` = open on a role, which is Apply-while-logged-out: filling the
   * form in IS the sign-up, the same shape Demo Day uses for its investor
   * application, and the role rides along so the flow can resume on it.
   *
   * One state rather than a boolean beside a target, because those two can
   * disagree — open with a stale role, or a role with the modal shut — and every
   * such pair eventually does. */
  const [signUp, setSignUp] = useState<{ target: ApplyTarget | null } | null>(null);
  const signUpTarget = signUp?.target ?? null;
  const [applyTarget, setApplyTarget] = useState<ApplyTarget | null>(null);
  const [pendingApply, setPendingApply] = useState<ApplyTarget | null>(null);

  /* The cover letter, held only while the apply modal is *not* on screen.
   *
   * Pressing "Edit profile" mid-letter closes the modal and opens the drawer, so
   * without this the letter would be gone by the time the drawer saved and the
   * modal came back — and losing someone's writing to a detour they took at our
   * suggestion is the kind of thing that stops people trusting a form. It lives
   * here rather than in the modal because the modal unmounts its form state on
   * close; the parent is what survives the round trip.
   *
   * Cleared whenever the trip ends for any reason other than coming back:
   * submitting, cancelling the modal, or abandoning the drawer. A letter is
   * written for one role, so it must never turn up pre-filled under a different
   * one. */
  const [coverLetterDraft, setCoverLetterDraft] = useState('');

  /* What's already been sent: role uid → the letter that went with it.
     Session-only, like everything else here — but the board has to show it,
     because an Apply button that looks identical after you've used it invites a
     second application nobody wants. Keyed by uid rather than a flat list so the
     row lookup is a `has`, and holding the letter (rather than a bare flag)
     keeps the mock honest about what an application actually is. */
  const [applications, setApplications] = useState<Map<string, string>>(() => new Map());
  const appliedRoleUids = useMemo(() => new Set(applications.keys()), [applications]);

  const sort = (params.get('sort') ?? 'newest') as JobsSortKey;

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

    if (sort === 'company_az') {
      groups.sort((a, b) => a.team.name.localeCompare(b.team.name));
    } else if ((sort as string) === 'company_za') {
      groups.sort((a, b) => b.team.name.localeCompare(a.team.name));
    } else {
      // newest: group's most-recent role first
      const newest = (g: IJobTeamGroup) => Math.max(...g.roles.map((r) => new Date(getJobDate(r)).getTime()));
      groups.sort((a, b) => newest(b) - newest(a));
    }
    return groups;
  }, [railGroups, sort]);

  const totalRoles = visibleGroups.reduce((sum, g) => sum + g.totalRoles, 0);
  const totalGroups = visibleGroups.length;

  /* Sign in. Production stashes the filter state and pushes `#login`, then replays
     it on return (JobAlertBanner → JobsContent). Pushing `#login` here would hand
     the page to the real Privy modal and lose the thing being reviewed — so the
     prototype writes the same key and plays back the *return* in place, which is
     the moment the design is about: you land signed in with the form already
     holding what you asked for. The mount effect above reads the stash back, so a
     real reload mid-flow lands in the same place. */
  const signIn = (openProfile: boolean) => {
    try {
      window.sessionStorage.setItem(PENDING_SAVE_STORAGE_KEY, JSON.stringify(criteria));
    } catch {
      /* sessionStorage unavailable — the replay is a nicety, not a requirement */
    }
    setIsLoggedIn(true);
    /* Straight into the drawer when the sign-in was asked for by something that
       promised one-click applying — the profile is what makes that promise true,
       so stopping at a signed-in board would leave the sentence unfinished. */
    if (openProfile && !isProfileComplete(profile)) setDrawerOpen(true);
  };

  /* Passed to onClick handlers, so it takes no arguments — a bare `signIn` would
     be handed a MouseEvent as its flag. */
  const onSignIn = () => signIn(false);

  /* The banner promises applying in one click, so it lands on the thing that
     makes it possible. */
  const onBannerSignIn = () => signIn(true);

  /* Sign up — the other door, and now genuinely a different one.
   *
   * It used to be an alias for `signIn`, on the argument that a brand-new
   * account and this prototype's empty signed-in viewer both land on the same
   * empty drawer, so splitting them would invent a difference the mock can't
   * have. That was true only while sign-up had nothing of its own to show. It
   * does now: `JobSignUpModal` is the form that creates the account, and it is
   * already what Apply opens for a logged-out visitor. Sending the header and
   * banner buttons somewhere else meant the board had two answers to "how do I
   * get an account", one of which quietly skipped the form.
   *
   * No role — see the state's own note. The modal goes generic, and because
   * submitting it lands the person in pending-approval, the sign-up door now
   * shows the real consequence of signing up rather than a shortcut past it. */
  const onSignUp = () => setSignUp({ target: null });

  /** Which team posted a role. The card hands the row only the role, so the team
   *  is recovered here rather than threaded through two components that have no
   *  other use for it. */
  const teamNameForRole = (role: IJobRole): string =>
    MOCK_JOB_GROUPS.find((g) => g.roles.some((r) => r.uid === role.uid))?.team.name ?? '';

  /**
   * Pressing Apply. One entry point, three outcomes, and the role is carried
   * through all of them — whatever is missing gets asked for, and then the
   * application resumes. The person never has to find their way back to the row.
   */
  const onApply = (role: IJobRole) => {
    const target: ApplyTarget = { role, teamName: teamNameForRole(role) };

    if (!isLoggedIn) {
      /* Not a sign-in prompt. Demo Day answers this exact moment with an
         application form whose submission creates the account, and defers real
         authentication to a later step — so the ask is for the details we need
         anyway, not for a password before anything has been offered. */
      setSignUp({ target });
      return;
    }

    /* A finished profile goes straight to the letter.

       For a while every Apply press went through the drawer first, including
       this case, on the argument that the drawer is the last place an
       application is legible before it's sent. It isn't — the apply modal is,
       and it reads the same profile back. So the stack was being shown twice:
       once as a full-height drawer nobody needed to touch, and then again, one
       press of `Continue to apply` later, as the panel at the top of the modal.
       A confirmation step whose only content is repeated by the next screen is a
       press charged for nothing. The modal's read-back plus its `Edit profile`
       link cover the "glance before sending" case at a fraction of the cost.

       Pending members still land in the drawer, because for them the drawer is
       the explanation — the stepper says where they are, the footer says what is
       waiting, and answering an Apply press with a silent no-op would leave the
       button looking broken. */
    if (isProfileComplete(profile) && !isPendingApproval) {
      setApplyTarget(target);
      return;
    }

    setPendingApply(target);
    setDrawerOpen(true);
  };

  /* Filling in the form is the sign-up. The account exists from here on, and it
     lands where a brand-new account actually lands: waiting on the PL team. The
     role they pressed is kept, so the moment approval lands they resume on it
     rather than having to find it again.

     Nothing is persisted beyond the session — this is a mock — but the details
     do seed the profile, because a sign-up that asked for a role and then showed
     an empty profile would be asking twice. */
  const onSignUpSubmit = (details: JobSignUpDetails) => {
    setViewer('pending-approval');
    setIsLoggedIn(true);
    setProfile({ ...EMPTY_PROFILE, role: details.role });
    setPendingApply(signUpTarget);
    setSignUp(null);
    setDrawerOpen(true);
    toast.success(`Account created for ${details.email}. The PL team reviews new accounts before you can apply.`);
  };

  /* The escape for people who already have an account. Straight to the signed-in
     board with the profile step still ahead of them — they are not a new account,
     so nothing is pending. */
  const onSignUpModalSignIn = () => {
    const target = signUpTarget;
    setSignUp(null);
    setViewer('profile-incomplete');
    setPendingApply(target);
    signIn(true);
  };

  const onSaveProfile = (next: MemberProfile) => {
    /* The stash has done its job. Left behind it would replay on the next load
       and re-narrow the rail for someone who had finished with it — a filter
       they didn't set, from a session they'd closed. */
    try {
      window.sessionStorage.removeItem(PENDING_SAVE_STORAGE_KEY);
    } catch {
      /* nothing to clean up if storage is unavailable */
    }
    setProfile(next);
    setDrawerOpen(false);

    /* Resume. The drawer was a detour, so its exit is the thing the person was
       doing when they were interrupted — not a "profile saved" dead end with the
       role they wanted somewhere back up the page. */
    if (pendingApply) {
      setApplyTarget(pendingApply);
      setPendingApply(null);
      return;
    }

    /* No pending role: this was an edit, so a toast is the whole report. It says
       what the profile now reads rather than "Saved", because what changed is
       what hiring teams will see — production's `toast`, mounted app-wide, same
       shell as every other confirmation in the product.

       Unless there's nothing to read back: experience is optional now, so a
       profile can be saved with only a job search status in it, and quoting an
       empty summary would produce "Applications will read .". */
    const summary = summariseProfile(next);
    toast.success(summary ? `Profile saved. Applications will read ${summary}.` : 'Profile saved.');
  };

  /* The drawer closed without saving. Whatever was pending is dropped — a person
     who backed out of the profile step has not applied, and holding the role to
     ambush them with the modal later would be the gate refusing to take no. */
  const onCloseDrawer = () => {
    setDrawerOpen(false);
    setPendingApply(null);
    /* The application is over, so the letter goes with it. Keeping it would mean
       a draft written for one role sitting in wait for the next Apply press. */
    setCoverLetterDraft('');
  };

  /**
   * "Edit profile", pressed from inside the apply modal.
   *
   * Closes the modal, opens the drawer on this page, and keeps the role pending
   * so `onSaveProfile` brings the modal straight back. The letter comes along as
   * an argument rather than being read out of the modal afterwards — by the time
   * this runs the modal is on its way to unmounting, and its form state with it.
   */
  const onEditProfileFromApply = (coverLetter: string) => {
    setCoverLetterDraft(coverLetter);
    setPendingApply(applyTarget);
    setApplyTarget(null);
    setDrawerOpen(true);
  };

  const onSubmitApplication = (coverLetter: string) => {
    if (!applyTarget) return;
    const { role, teamName } = applyTarget;

    setApplications((prev) => new Map(prev).set(role.uid, coverLetter));
    setApplyTarget(null);
    /* Sent, so there is nothing left to preserve. */
    setCoverLetterDraft('');

    /* The board behind the modal already flips this role's button to "Applied",
       so the toast doesn't repeat that. What it adds is the part the board can't
       show: who has it now, and that the profile went with the note rather than
       the note alone — which is the promise the whole flow was built on. */
    toast.success(`Applied to ${role.roleTitle} at ${teamName}. Your profile went with your note.`);
  };

  /* PL Infra is a signed-in-only slot, so choosing that viewer has to sign the
     page in — otherwise the switch looks broken from the default logged-out
     state, which is the state a reviewer opens the board in. Turning it back off
     leaves the session alone: signing out isn't what "standard viewer" means. */
  /* Picking a viewer rebuilds the page's state from scratch rather than nudging
     it, so every tab is reviewed from the same clean start — no half-open drawer
     or stale application carried in from the tab before. */
  const onSelectViewer = (next: BoardViewer) => {
    setViewer(next);
    setIsLoggedIn(next !== 'logged-out');
    setProfile(next === 'profile-ready' ? FILLED_PROFILE : EMPTY_PROFILE);
    setDrawerOpen(false);
    setApplyTarget(null);
    setPendingApply(null);
    setApplications(new Map());
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
      {/* `onSignUp` as well as `onSignIn`: on this board the two really are
          different doors — Sign up opens the form that creates the account, the
          same one Apply opens for a logged-out visitor — so the header pair
          leads where the banner pair leads rather than collapsing into one
          action. Other entries sharing this navbar pass only `onSignIn` and
          keep today's behaviour. */}
      <PrototypeNavBar
        hasUnreadNews={hasNewsUpdates}
        newsHref="/prototypes/newsfeed"
        isLoggedIn={isLoggedIn}
        onSignIn={onSignIn}
        onSignUp={onSignUp}
        searchable
      />
      {/* No auth prop: the mobile bottom bar carries no account cluster in
          production either, so there is nothing for it to switch. PL Infra is
          the exception — it's signed-in-only, so the slot follows the viewer. */}
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
    <>
      <h1 className={contentCss.title}>
        Job Board{' '}
        {/* The role count carries the weight, the team count doesn't. They're one
            parenthetical but not one fact: how much there is to apply to is the
            number someone is actually reading, and how many teams it's spread
            across is the qualifier. Emphasising both would flatten them back
            together and leave the line no louder than before.

            Weight and tone only, no colour — see `.titleCountRoles`. */}
        <span className={contentCss.titleCount}>
          (
          <strong className={s.titleCountRoles}>
            {totalRoles} {totalRoles === 1 ? 'role' : 'roles'}
          </strong>{' '}
          across {totalGroups} {totalGroups === 1 ? 'team' : 'teams'})
        </span>
      </h1>
    </>
  );

  const content = (
    <div className={contentCss.root}>
      {/* Logged out: the same banner production's home page shows a signed-out
          visitor (`components/page/home/Welcome`), in the same slot it holds
          there — first block in the column, above the page's own content. One
          sign-in ask per page, and it's this one. */}
      {!isLoggedIn && (
        <SignInBanner
          criteria={criteria}
          roleCount={totalRoles}
          teamCount={totalGroups}
          onSignIn={onBannerSignIn}
          onSignUp={onSignUp}
        />
      )}

      {/* Signed in, nothing filled in. Same slot, same card, one word of the ask
          changed: the account exists, so what stands between them and applying is
          the profile. Not shown to a pending member — telling someone to finish a
          profile so they can apply, while approval is the thing actually blocking
          them, would be pointing at the wrong obstacle. */}
      {isLoggedIn && !isPendingApproval && !isProfileComplete(profile) && (
        <ProfileNudgeBanner onUpdateProfile={() => setDrawerOpen(true)} />
      )}

      {/* Signed up, waiting. The board is untouched underneath; this says where
          they are and — while there's still profile left to fill in — hands back
          the one move that is theirs. */}
      {isPendingApproval && (
        <PendingApprovalBanner
          profileComplete={isProfileComplete(profile)}
          onUpdateProfile={() => setDrawerOpen(true)}
        />
      )}

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
        {/* Production's own three options, unextended. The board used to carry a
            fourth, "Best match for me", which is gone with the rest of the match
            flow — sorting is now only sorting, and there is no locked item to
            explain. */}
        <SortDropdown
          options={JOBS_SORT_OPTIONS}
          currentSort={sort}
          onSortChange={(value) => setParam('sort', value === 'newest' ? undefined : value)}
          sortByLabel="Sort by:"
        />
      </div>

      {visibleGroups.length === 0 ? (
        <div className={s.empty}>No roles match your filters. Try clearing some.</div>
      ) : (
        <div className={contentCss.list}>
          {visibleGroups.map((group) => (
            <JobTeamGroupCard
              key={group.team.uid}
              group={group}
              newsVariant={NEWS_VARIANT}
              canRefer={isLoggedIn}
              onReferBlocked={onSignIn}
              onApply={onApply}
              appliedRoleUids={appliedRoleUids}
            />
          ))}
        </div>
      )}
    </div>
  );

  /* Review scaffolding: the four entry states, directly under the navbar.
     Not inside the content column — between the toolbar and the list these read
     as a product control and push the thing under review below the fold. Under
     the header they are plainly outside the page, and because the navbar is
     sticky and this band is not, they scroll away and leave the board to be
     judged on its own. The mobile-bar switch that used to sit beside them is
     gone; this is the only scaffolding left. */
  const reviewControls = (
    <div className={s.reviewBand}>
      <div className={s.versionRow}>
        {/* The four states the apply flow branches into. Only the first was ever
            reachable without editing code, which meant the other three — the ones
            most members are actually in — could not be looked at. */}
        <div className={v0.switchBar}>
          <span className={v0.switchLabel}>Preview as</span>
          <div className={v0.switch} role="tablist" aria-label="Board viewer state">
            {VIEWER_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                role="tab"
                aria-selected={viewer === opt.value}
                className={`${v0.switchBtn} ${viewer === opt.value ? v0.switchBtnActive : ''}`}
                onClick={() => onSelectViewer(opt.value)}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <span className={v0.switchNote}>{VIEWER_NOTE[viewer]}</span>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {nav}
      {reviewControls}
      <DashboardPagesLayout filters={<JobBoardFilterView />} content={content} />
      {/* The profile step. `pendingRoleTitle` is what makes the drawer explain
          itself: opened on the way to an application it names the role it's
          holding up, and opened from the title line it doesn't, because there is
          nothing waiting. */}
      <JobProfileDrawer
        open={drawerOpen}
        onClose={onCloseDrawer}
        profile={profile}
        pendingRoleTitle={pendingApply?.role.roleTitle ?? null}
        pendingApproval={isPendingApproval}
        onSave={onSaveProfile}
      />

      {/* The account form, reached two ways: pressing Apply while logged out
          (which carries the role, so the modal names it and the flow resumes on
          it), and pressing Sign up in the header or the banner (which carries
          nothing, and gets the generic header).

          Unlike <applyTarget> below, the role can't double as the open flag —
          this modal legitimately exists without one — so `signUp` is its own
          nullable object and the role hangs off it. */}
      <JobSignUpModal
        open={!!signUp}
        onClose={() => setSignUp(null)}
        role={signUpTarget?.role ?? null}
        teamName={signUpTarget?.teamName ?? ''}
        onSignUp={onSignUpSubmit}
        onSignIn={onSignUpModalSignIn}
      />

      {/* The per-role step. <applyTarget> is the open/closed state as well as the
          data — there is no such thing as this modal without a role, so a
          separate boolean would only be something to keep in sync. Editing from
          here closes it and opens the drawer with the role still pending, so
          saving lands straight back on this modal. */}
      <JobApplyModal
        open={!!applyTarget}
        onClose={() => {
          setApplyTarget(null);
          /* Cancelled outright — not a detour, so the letter is not kept. */
          setCoverLetterDraft('');
        }}
        role={applyTarget?.role ?? null}
        teamName={applyTarget?.teamName ?? ''}
        profile={profile}
        initialCoverLetter={coverLetterDraft}
        onEditProfile={onEditProfileFromApply}
        onSubmit={onSubmitApplication}
      />
    </>
  );
}
