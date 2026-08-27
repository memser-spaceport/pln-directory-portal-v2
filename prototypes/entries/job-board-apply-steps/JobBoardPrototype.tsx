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
 *  - JobApplyFlowDrawer   (new)             **the whole application, in one drawer with a step rail.**
 *                                            Review job → Your profile → Application, and the last
 *                                            step's footer button is Apply. This replaced three
 *                                            surfaces — a description drawer, a profile drawer and a
 *                                            centred apply modal — that the board handed to each
 *                                            other through four pieces of state, one of which existed
 *                                            only to carry a half-written cover letter across the
 *                                            seams. None of that was visible to the person, which was
 *                                            the problem: Apply opened an unknown number of dialogs
 *                                            in an unknown order, and no screen said how many were
 *                                            left. On mobile it is a page (`fullScreen` + `noBlur`
 *                                            under 768), which also fixes the 640–767 band where a
 *                                            720px drawer overflowed the viewport.
 *                                            **The profile step is skipped, not hidden**: a finished
 *                                            profile sends Apply straight to the letter, and step 2
 *                                            carries a check from the first frame — that mark is the
 *                                            evidence for "nothing to refill", and it gives
 *                                            `Edit profile` somewhere on screen to go.
 *                                            **And the visitor with no account walks the same rail.**
 *                                            Step 2 becomes "Your details" — `JobAccountPane`, the
 *                                            form that opens the account — and the final Apply opens
 *                                            it and files the application in one press. Nothing is
 *                                            created before that press, so abandoning at the letter
 *                                            costs nothing; the old shape registered you at the end
 *                                            of a sign-up modal and left an orphan account behind
 *                                            anyone who changed their mind. Three positions for
 *                                            everyone, one label that moves.
 *  - ApplyFlowSteps       (new)             the rail, transcribed from `pl-design-system/components/
 *                                            Steps` — the DS's own horizontal stepper, which had no
 *                                            consumer anywhere and cannot be imported because
 *                                            tsconfig excludes that package. Values 1:1, colour layer
 *                                            translated to token/fallback pairs. NOT the repo's
 *                                            dominant vertical dot-and-rail stepper: that one reports
 *                                            a process running on someone else's clock, this one is a
 *                                            position in a sequence you are walking.
 *  - JobDetailPane        (was a drawer)    step 1: the job, read in the app. Description mocked —
 *                                            production's job records carry no body, which is why the
 *                                            board has always linked out. That link survives here, in
 *                                            the masthead — and only for a signed-in reader, since it
 *                                            is the one door out of the account this flow is for.
 *  - JobProfilePane       (was a drawer)    step 2: the member profile itself, card for card, on
 *                                            production's `DetailsSection` chrome. **Your current role
 *                                            and the private job-search status are the whole
 *                                            requirement**, so they are the first two cards and each
 *                                            marks itself while it is unanswered; experience, project
 *                                            contributions, skills, bio and location refine a read
 *                                            that is already possible without them. Teams was cut —
 *                                            it duplicates an Experience entry's "Team or
 *                                            Organization" field. `PendingApprovalSteps`, the vertical
 *                                            account stepper, has been **deleted**: first it stopped
 *                                            being rendered (two steppers answering two different
 *                                            "where am I" questions in one column is worse than one),
 *                                            then a second argument was piled on — approval had
 *                                            stopped gating applying, so it described a wait holding
 *                                            nothing up. That second one has expired (approval gates
 *                                            applying again); the first stands on its own. The board
 *                                            still shows the account story in `PendingApprovalBanner`.
 *  - JobApplicationPane   (was a modal)     step 3: who on the hiring team receives it (an overlapping
 *                                            facepile of the leads, each name linking to their
 *                                            profile), your profile read back so you can see what is
 *                                            being sent — name, the current-role line, its dates and
 *                                            your skills, not the whole history and never the private
 *                                            status — an `Edit profile` escape that is now a step
 *                                            change rather than a teardown, and a required cover
 *                                            letter. The letter is required because without it
 *                                            "one-click apply" would send thirteen identical
 *                                            applications and mean nothing to anyone reading them.
 *                                            There is no fourth step confirming the send: the board
 *                                            behind it flips the row to "Applied".
 * GATED: **sending an application**, and only that. Two rules stand in front of it.
 *  1. An application has to carry a complete profile (a current role and an answered job search
 *     status), because a one-click application sends the team your profile instead of a form. This
 *     one is never a refusal — a stranger satisfies it in one pane, a member in a card stack, and
 *     the middle step exists to finish it.
 *  2. The account has to be approved. A PL review stands in front of the first application, which
 *     means a visitor who arrives on a role opens an account here and comes back to apply once the
 *     email lands. Step 2 is where a first visit ends.
 *  Everything else stays open at every stage: every role, every detail, the posting itself, and the
 *  profile — which is editable while a review runs, because it is the one useful thing to do
 *  meanwhile. Nothing on the board was ever hidden from a logged-out visitor and still isn't.
 *  NOTE: rule 2 has now been removed and restored once. It was dropped on the argument that the PL
 *  review "runs alongside" and governs the rest of the network rather than this board — which made
 *  the flow's last press open a stranger's account and send their letter together. That press was
 *  the hole: a brand-new account is under review from the moment it exists, so the account skipping
 *  the review most reliably was the one the rule was written for. Restoring the gate meant restoring
 *  both halves of `canApply` (`loggedIn && !pendingApproval`), splitting that press into
 *  `onCreateAccount` and `onSubmitApplication`, and putting the wait back into four pieces of copy:
 *  `BoardBanners` (both states), the flow footer (review and profile steps), `JobProfilePane`'s lede
 *  and `VIEWER_NOTE`. If it is ever dropped again, those are the four.
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
import type { IJobRole, IJobTeam, IJobTeamGroup, JobsSortKey } from '@/types/jobs.types';

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
import { JobBoardScopeTabs, SCOPE_APPLIED, SCOPE_PARAM } from './JobBoardScopeTabs';
import { SignInBanner } from './SignInBanner';
import { ProfileNudgeBanner, PendingApprovalBanner } from './BoardBanners';
import { JobApplyFlowDrawer, type ApplyFlowStepId } from './JobApplyFlowDrawer';
import { JobSignUpModal, type JobSignUpDetails } from './JobSignUpModal';
// DELETE WITH: the `design-canvas/` folder.
import { parseResultFor } from '../profile-shared/ExperienceImport/parseMocks';
import { readCanvasState, type CanvasStateSpec } from './canvasStates';
import { ApplicationEmailPreview } from './email/ApplicationEmailPreview';
import type { ApplicationEmailInput } from './email/applicationEmail';
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
 * One filled specimen of the application email, for the `?email=1` review
 * surface.
 *
 * Every value is read off the board's own mocks rather than typed here, so the
 * specimen cannot drift from the roles on screen — except the two the mock has no
 * source for: the recipient, and the letter.
 *
 * The recipient is a constant rather than the live `useTeamMembers` lookup on
 * purpose. That hook hits the real directory, and a review surface for *copy*
 * should render the same words every time it is opened rather than whatever the
 * API returns today — the apply modal is where the live leads are already shown.
 *
 * The letter is written the way the template assumes letters are written: naming
 * this role, from someone who read the posting. A lorem-ipsum specimen would make
 * the one part of the email a human wrote look like the part that matters least.
 */
const SAMPLE_ROLE_GROUP = MOCK_JOB_GROUPS.find((g) => g.team.name === 'Filecoin Foundation') ?? MOCK_JOB_GROUPS[0];

const SAMPLE_APPLICATION_EMAIL: ApplicationEmailInput = {
  recipientName: 'Clara Tsao',
  roleTitle: SAMPLE_ROLE_GROUP.roles[0].roleTitle,
  teamName: SAMPLE_ROLE_GROUP.team.name,
  profile: FILLED_PROFILE,
  coverLetter:
    'I built the transport layer this role touches — QUIC upgrade paths at Lattice, and the libp2p maintainer seat before that. Ecosystem growth here means talking to the teams already shipping on it, which is the half I have been doing informally for two years.',
  profileUrl: 'os.pl.xyz/members/cldvommb409tlu21kradd3rpm',
};

/**
 * Which viewer the mobile bottom bar is drawn for. Named after what the person
 * has, not after the slot that moves — "PL Infra viewer" is a fact about the
 * account; which of Events or PL Infra ends up in slot two is the consequence.
 */
/** The five entry states the apply flow branches into — see `BoardViewer`. */
const VIEWER_OPTIONS: Array<{ value: BoardViewer; label: string }> = [
  { value: 'logged-out', label: 'Logged out' },
  { value: 'pending-approval', label: 'Signed up, pending approval' },
  { value: 'profile-incomplete', label: 'Signed in, profile empty' },
  { value: 'profile-ready', label: 'Signed in, profile ready' },
  /* Last, because the row reads as a sequence: no account → waiting → signed in
     with nothing → signed in and ready → been and applied. Each tab is the next
     thing that happens to the same person. */
  { value: 'applied', label: 'Already applied' },
];

const VIEWER_NOTE: Record<BoardViewer, string> = {
  'logged-out':
    'No account, and no separate sign-up. Apply opens the flow and step 2 becomes “Your details” — the form that opens the account. That is where a first visit ends: an application can’t be sent from an account under review, so they come back to apply once the PL team approves it.',
  'pending-approval':
    'Signed up, waiting on the PL team. Browsing and the profile work exactly as they do for an approved member; applying is the one thing that waits, and every surface that mentions it says the same thing — the banner, the flow footer and the profile step.',
  'profile-incomplete':
    'Signed in with nothing filled in. The ask moves from “sign in” to “update your profile”, and Apply opens the drawer on the job search status, which is the one required answer.',
  'profile-ready':
    'Signed in, profile already good. Apply goes straight to the cover letter — the modal reads the profile back, so a drawer in front of it would be showing the same thing twice.',
  applied:
    'The returning member: two applications already sent. The Applied tab has a count and a list, those rows show “Applied” instead of an offer, and the rest of the board carries on as normal — having applied to two roles is no reason to change what the other eleven look like.',
};

/**
 * What the `applied` viewer arrives having already done.
 *
 * Two roles from one team rather than one from each: applying twice to the same
 * hiring team is the ordinary case on a board grouped by team, and it makes the
 * Applied tab's own grouping visible — one card with two rows, rather than two
 * cards with one row each, which would look like an unfiltered board.
 *
 * Read off `MOCK_JOB_GROUPS` rather than typed as uids, so a rename or reorder in
 * the mocks can't leave this pointing at roles that no longer exist.
 */
const SEEDED_APPLICATION_ROLES = (
  MOCK_JOB_GROUPS.find((g) => g.team.name === 'Filecoin Foundation') ?? MOCK_JOB_GROUPS[0]
).roles.slice(0, 2);

const SEEDED_APPLICATION_LETTERS = [
  'I built the transport layer this role touches — QUIC upgrade paths at Lattice, and the libp2p maintainer seat before that. Ecosystem growth here means talking to the teams already shipping on it, which is the half I have been doing informally for two years.',
  'Most of my last two years has been grants-adjacent: scoping the work, writing the briefs, and chasing the reporting nobody enjoys. I would rather do it somewhere the grants are the product.',
];

/**
 * The seeded applications, built fresh each time the viewer is selected.
 *
 * **Backdated on purpose.** `appliedAt` is normally stamped at submit, so it is
 * always "just now" — true, and useless for reviewing a list whose whole job is
 * to carry a chronology. Two applications both reading "0d ago" would make the
 * date look like decoration. These land 2 and 9 days back, which is also what
 * the board's own role dates do (`mocks.ts` generates every posting relative to
 * now for the same reason).
 *
 * A function rather than a constant: the offsets are relative to the moment the
 * tab is picked, and a module constant would freeze them at import.
 */
function seededApplications(): Map<string, JobApplication> {
  const daysAgo = (n: number) => {
    const d = new Date();
    d.setDate(d.getDate() - n);
    return d.toISOString();
  };
  const offsets = [2, 9];

  return new Map(
    SEEDED_APPLICATION_ROLES.map((role, i) => [
      role.uid,
      { coverLetter: SEEDED_APPLICATION_LETTERS[i] ?? '', appliedAt: daysAgo(offsets[i] ?? 1) },
    ]),
  );
}

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

/** One sent application. The letter is what went; `appliedAt` is what the Applied
 *  tab reads to say how long ago it went. ISO, like every other date on the board,
 *  so `getJobDate`'s own formatting helpers can read it. */
interface JobApplication {
  coverLetter: string;
  appliedAt: string;
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
        setProfile(asViewer === 'profile-ready' || asViewer === 'applied' ? FILLED_PROFILE : EMPTY_PROFILE);
        // Same seeding as the switcher, so `?viewer=applied` lands on the state
        // the tab shows rather than on an empty version of it.
        if (asViewer === 'applied') setApplications(seededApplications());
      }
      if (q.get('profile') === '1') openProfileEditor();
      /* `?email=1` opens the review surface for the email the hiring team gets
         when someone applies — see `email/ApplicationEmailPreview`. A parameter
         rather than a control on the board, because it is not part of the
         product: it renders an artifact that leaves the product entirely, and a
         button for it would put a reviewer's tool in an applicant's flow. */
      if (q.get('email') === '1') setEmailPreviewOpen(true);

      /* DELETE WITH: the `design-canvas/` folder.
         Seed the filter rail from the URL.

         `useMockJobsFilterStore` is a module-level store that starts as an EMPTY
         URLSearchParams and never reads the address bar, so until now the rail,
         the search box, the sort and the scope tab were reachable only by
         clicking. That made four states impossible to link to — narrowed,
         searched, narrowed to nothing, and the Applied tab — which is four
         frames the canvas could not hold.

         Production's own board IS URL-synced (`JobsContent` reads the filter
         state out of the query), so this makes the mock behave like the thing it
         mocks rather than inventing a behaviour. The sessionStorage replay below
         still wins when it has something, because that is the sign-in round trip
         putting back what the person had already chosen. */
      const seeded = new URLSearchParams();
      for (const key of ['q', 'sort', SCOPE_PARAM, ...CRITERIA_KEYS]) {
        const value = q.get(key);
        if (value) seeded.set(key, value);
      }
      if (Array.from(seeded.keys()).length) setAllParams(seeded);

      /* DELETE WITH: the `design-canvas/` folder.
         The design canvas photographs real routes, so the overlays it holds
         frames of have to be reachable at a URL — see `canvasStates.ts` for why
         this is separate from the parameters above. Applied last and on top of
         whatever `?viewer=` seeded, so a state says only what it changes. */
      const pinned = readCanvasState(window.location.search);
      if (pinned) {
        setCanvasPin(pinned);
        if (pinned.viewer) {
          setViewer(pinned.viewer);
          setIsLoggedIn(pinned.viewer !== 'logged-out');
          setProfile(pinned.viewer === 'profile-ready' || pinned.viewer === 'applied' ? FILLED_PROFILE : EMPTY_PROFILE);
          if (pinned.viewer === 'applied') setApplications(seededApplications());
        }
        /* One role for every pinned frame, so the sign-up form and every step
           of the flow name the same job — frames of one application rather than
           unrelated ones. */
        const job = { role: SAMPLE_ROLE_GROUP.roles[0], team: SAMPLE_ROLE_GROUP.team };
        if (pinned.signUp) setSignUp(true);
        if (pinned.flow) {
          setFlow({ job });
          setFlowStep(pinned.flow);
        }
      }
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

  /** Signed up, waiting on the PL team. Browsing is fine; applying is not. */
  const isPendingApproval = viewer === 'pending-approval';

  /* DELETE WITH: the `design-canvas/` folder. Held rather than applied and
     dropped, because two of its fields describe how the sign-up form should
     render (filled in, or refused) rather than what to open — and the form is
     mounted below, not here. */
  const [canvasPin, setCanvasPin] = useState<CanvasStateSpec | null>(null);

  /* A plain boolean now.
   *
   * It used to be `{ target: ApplyTarget | null } | null`, because this modal had
   * two doors and the role-carrying one had to name the job it came from. That
   * door is the apply flow's details step now, so every press that reaches this
   * modal is the role-less one — and a nullable object whose only field is always
   * null is just a boolean with a place for a bug to live. */
  const [signUp, setSignUp] = useState(false);

  /* The apply flow: which job, and where in it.
   *
   * **This is what four pieces of state collapsed into.** There used to be
   * `viewJob` (the description drawer), `pendingApply` (a role someone pressed
   * Apply on before they could), `applyTarget` (the modal's role) and
   * `coverLetterDraft` — a string the board held purely so it could survive the
   * modal being torn down and rebuilt around a drawer. Three of those existed
   * because the flow was three surfaces; the fourth existed because moving
   * between them destroyed component state. One drawer with a step needs neither:
   * the role is the flow, the step is where you are, and the letter lives inside
   * the drawer that never closes.
   *
   * The object doubles as the open flag — there is no such thing as this flow
   * `null` is closed. `job: null` is the one case that isn't an application at
   * all: the banners' "Update profile", which edits the record with no role in
   * mind. It opens the same drawer on the same profile step and simply draws no
   * rail — a position indicator for a journey nobody is on would be inventing a
   * flow to justify a component. */
  const [flow, setFlow] = useState<{ job: { role: IJobRole; team: IJobTeam } | null } | null>(null);
  const [flowStep, setFlowStep] = useState<ApplyFlowStepId>('review');
  const flowJob = flow?.job ?? null;

  /** Opens the profile on its own, with nothing pending — the banners' route. */
  const openProfileEditor = () => {
    setFlow({ job: null });
    setFlowStep('details');
  };

  /** Review surface for the application email — opened by `?email=1`, never by
   *  anything on the board. See the mount effect. */
  const [emailPreviewOpen, setEmailPreviewOpen] = useState(false);

  /* What's already been sent: role uid → the letter that went with it.
     Session-only, like everything else here — but the board has to show it,
     because an Apply button that looks identical after you've used it invites a
     second application nobody wants. Keyed by uid rather than a flat list so the
     row lookup is a `has`, and holding the record (rather than a bare flag)
     keeps the mock honest about what an application actually is.

     `appliedAt` arrived with the Applied tab. A list of things you have already
     done needs a chronology: standing inside that tab, "have I gone for this
     one?" is answered by the tab itself, and the only question left is *when*.
     Stamped at submit rather than seeded, so it is always a real moment from
     this session — and safe against hydration, because no application exists
     before a click and the board only renders after mount. */
  const [applications, setApplications] = useState<Map<string, JobApplication>>(() => new Map());
  const appliedRoleUids = useMemo(() => new Set(applications.keys()), [applications]);
  /** The same map, reduced to what the row needs: uid → when. Derived rather than
   *  passed whole, so the row never receives the cover letters — a list of roles
   *  has no business carrying the letters that went with them. */
  const appliedAtByRole = useMemo(
    () => new Map([...applications].map(([uid, application]) => [uid, application.appliedAt])),
    [applications],
  );

  const sort = (params.get('sort') ?? 'newest') as JobsSortKey;

  /** Which scope tab is open. A filter-store param like every other narrowing on
   *  this board, so Clear All takes it off with the rest. */
  const appliedScope = params.get(SCOPE_PARAM) === SCOPE_APPLIED;

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
        /* The Applied scope narrows first, and narrows like every other filter:
           it is one more predicate in this list rather than a separate list. So
           the rail, the search box and the sort all keep working inside it — you
           can search your own applications, or narrow them to Remote — and the
           count in the toolbar stays the count of what is on screen. A tab that
           swapped the data source instead would have had to reimplement all
           three, or quietly drop them. */
        if (appliedScope && !appliedRoleUids.has(role.uid)) return false;
        // The shared predicate — the same one the match badge runs, so a role that
        // survives the rail is always a role the badge would mark.
        if (!roleMatches(criteria, role)) return false;
        if (q && !teamMatchesQ && !role.roleTitle.toLowerCase().includes(q)) return false;
        return true;
      });
      if (roles.length) groups.push({ team: group.team, roles, totalRoles: roles.length });
    }
    return groups;
  }, [params, criteria, appliedScope, appliedRoleUids]);

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

    const plIndex = groups.findIndex((g) => g.team.name.trim().toLowerCase() === 'protocol labs');
    if (plIndex > 0) {
      const [protocolLabs] = groups.splice(plIndex, 1);
      groups.unshift(protocolLabs);
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
    /* Straight into the profile when the sign-in was asked for by something that
       promised one-click applying — the profile is what makes that promise true,
       so stopping at a signed-in board would leave the sentence unfinished.

       If a flow is already open this leaves it alone: the flow knows which job
       it is about and where in itself it is, and this doesn't. */
    if (openProfile && !isProfileComplete(profile) && !flow) openProfileEditor();
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
   * have. That was true only while sign-up had nothing of its own to show.
   * `JobSignUpModal` is that form.
   *
   * **The only door left into this modal.** Applying from a role used to open it
   * too; that case is the apply flow's own details step now, which is why the
   * state below is a plain boolean and the modal no longer takes a role. What
   * remains is the person who wants an account before they have picked a job —
   * the header and banner `Sign up` presses — and for them the generic form is
   * exactly right. */
  const onSignUp = () => setSignUp(true);

  /** Which team posted a role. The card hands the row only the role, so the team
   *  is recovered here rather than threaded through two components that have no
   *  other use for it. */
  const teamForRole = (role: IJobRole): IJobTeam | null =>
    MOCK_JOB_GROUPS.find((g) => g.roles.some((r) => r.uid === role.uid))?.team ?? null;

  /**
   * Pressing **View job**, or the role title — which is now the board's only
   * door into the apply flow, and opens it on its first step.
   *
   * Ungated on purpose, in every viewer state. Reading a posting is browsing,
   * and nothing on this board has ever been hidden from a logged-out visitor —
   * the gate sits on the moment something is sent on someone's behalf, which is
   * the Apply in the flow's footer, not the door to it.
   */
  const onViewJob = (role: IJobRole) => {
    const team = teamForRole(role);
    if (!team) return;
    setFlow({ job: { role, team } });
    setFlowStep('review');
  };

  /**
   * Apply pressed by someone with no account.
   *
   * Not a sign-in prompt. Demo Day answers this exact moment with an application
   * form whose submission creates the account, and defers real authentication to
   * a later step — so the ask is for the details we need anyway, not for a
   * password before anything has been offered.
   *
   * The flow stays open underneath (`Modal` is z-index 9999 against `Drawer`'s
   * 10). The old flow closed the drawer on the way through, because the next
   * surface was another drawer and two would have stacked; there is only one
   * now, and leaving it up is what makes **Cancel** cheap — the person lands
   * back on the job they were reading, on the step they pressed from, instead of
   * somewhere up the board hunting for their place.
   *
   * Not, note, so they can *see* the job behind the form: `Modal`'s overlay
   * carries `backdrop-filter: blur(15px)` and the drawer behind it is a smear.
   * The value is where Cancel returns you, which is true whatever the backdrop
   * does.
   *
   * **The branching that used to live here is gone.** `onApply` was the board's
   * one entry point with three outcomes — sign up, profile, letter — because
   * three separate surfaces had to be chosen between. The flow's footer makes
   * that choice now, next to the button that triggers it, and this is the single
   * outcome the board still owns: the one that opens something outside the
   * drawer.
   */
  /* (`onRequireAccount` lived here — Apply pressed with no account, which opened
     `JobSignUpModal` over the flow drawer. There is no such moment any more: the
     account is step 2 of the flow, so pressing Apply logged out advances the
     rail like it does for everyone else. The modal survives only for the
     role-less `Sign up` door in the header and the banner.) */

  /* Filling in the form is the sign-up, for the one door that still opens this
     modal: **Sign up** with no role in hand. The account exists from here on and
     lands where a brand-new account lands — waiting on the PL team — which is
     now a fact about the account rather than a hold on the board.

     No flow to resume. This door is pressed by someone who has not picked a job,
     so there is nothing to advance to; they land on the signed-in board and the
     pending banner picks up from there. The role-carrying door used to end here
     too, and it is the apply flow's own details step now.

     Nothing is persisted beyond the session — this is a mock — but the details
     do seed the profile, because a sign-up that asked for a role and then showed
     an empty profile would be asking twice. */
  const onSignUpSubmit = (details: JobSignUpDetails) => {
    setViewer('pending-approval');
    setIsLoggedIn(true);
    /* `linkedin` comes along now. The modal has always asked for it and the
       answer was dropped here — seeding only `role` meant the one optional
       field on that form spent someone's attention and returned nothing. It is
       a profile link, not an import source; see the note on `MemberProfile`. */
    setProfile({ ...EMPTY_PROFILE, role: details.role, linkedin: details.linkedin.trim() });
    setSignUp(false);
    /* Says what happened and what is still running — including what the review
       holds, which is the clause that came back with the gate. This door is
       pressed with no role in hand, so there is nothing to promise them
       afterwards beyond the board itself. */
    toast.success(`Account created for ${details.email}. The PL team reviews it before applications can be sent.`);
  };

  /* The escape for people who already have an account. Straight to the signed-in
     board — they are not a new account, so nothing is pending. */
  const onSignUpModalSignIn = () => {
    setSignUp(false);
    setViewer('profile-incomplete');
    signIn(false);
  };

  /* The same escape, from the apply flow's details step.
   *
   * Deliberately does *not* touch the flow. `signIn` already leaves an open flow
   * alone, so the drawer stays on the job and the step it was on — step 2 simply
   * stops being an account form and becomes the member's profile. The alternative
   * (close, sign in, reopen) would take the role away from someone whose last act
   * was telling us they have an account, which is the opposite of what the escape
   * is for.
   *
   * `profile-incomplete` rather than `profile-ready`: a returning member is being
   * mocked, and the honest mock is the one that still has something to do on the
   * step they are standing on — landing on a finished profile would show a step
   * that skips itself, which is the *other* viewer's frame. */
  const onFlowSignIn = () => {
    setViewer('profile-incomplete');
    signIn(false);
  };

  /**
   * The profile step's work, committed.
   *
   * **No longer "persist and resume".** It used to close the drawer and, when a
   * role was pending, open the apply modal on it — because saving was the only
   * moment the board could hand someone from one surface to the next. The flow
   * moves itself now, so this does exactly what its name says and nothing else.
   */
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

    /* A receipt, but only where there is nothing else to serve as one.
     *
     * Inside an application the step change IS the receipt — the rail ticks the
     * profile and the letter appears — so a toast on top of that would be a
     * third report of one event. Opened from a banner there is no next step: the
     * flow just closes, and without this the press would look like it did
     * nothing. It says what the profile now *reads* rather than "Saved", because
     * what changed is what hiring teams will see.
     *
     * Unless there is nothing to read back: experience is optional, so a profile
     * can be saved with only a role and a status in it, and quoting an empty
     * summary would produce "Applications will read .". */
    if (flowJob) return;
    const summary = summariseProfile(next);
    toast.success(summary ? `Profile saved. Applications will read ${summary}.` : 'Profile saved.');
  };

  /**
   * The flow closed — from the first step's Back, from the ✕, from Escape or the
   * overlay.
   *
   * Nothing is held for later. A person who backed out has not applied, and
   * keeping the role to ambush them with the application later would be the gate
   * refusing to take no. The letter goes with it, inside the drawer that held it:
   * a draft written for one role must never turn up pre-filled under another.
   */
  const onCloseFlow = () => {
    setFlow(null);
    setFlowStep('review');
  };

  /**
   * The last press of the flow, and one act: the letter goes.
   *
   * **It was briefly two.** For a visitor with no account this same press opened
   * the account and sent the application together, so the flow either completed
   * or cost nothing — the alternative being the old sign-up modal, which
   * registered you at the end of step 2 and left an orphan account behind
   * anyone who changed their mind at the letter. That argument was sound about
   * *orphan accounts* and silent about the review: a brand-new account is under
   * review, and an application may not be sent from one. So the account half
   * moved to `onCreateAccount` and this press is now only ever pressed by
   * someone approved. The orphan-account problem comes back with it, and the
   * honest answer is that an account opened on purpose at the end of a form is
   * not an orphan — what made the old one an orphan was that it was a side
   * effect of a flow aimed somewhere else.
   */
  const onSubmitApplication = (coverLetter: string) => {
    if (!flowJob) return;
    const { role, team } = flowJob;

    setApplications((prev) => new Map(prev).set(role.uid, { coverLetter, appliedAt: new Date().toISOString() }));
    onCloseFlow();

    /* The board behind the flow already flips this role's button to "Applied",
       so the toast doesn't repeat that. What it adds is the part the board can't
       show: who has it now, and that the profile went with the note rather than
       the note alone — which is the promise the whole flow was built on. */
    toast.success(`Applied to ${role.roleTitle} at ${team.name}. Your profile went with your note.`);
  };

  /**
   * The end of the flow for a visitor who arrived without an account.
   *
   * **No application is filed here**, and that is the change. This used to be a
   * branch inside `onSubmitApplication` — one press opened the account and sent
   * the letter together, so the flow either completed or cost nothing. An
   * application may not be sent from an account under review, and a brand-new
   * account is under review from the moment it exists, so the two acts had to
   * come apart. What is left is the half that can happen now.
   *
   * The profile is the flow's own draft, seeded rather than rebuilt: it already
   * holds the role and LinkedIn from the form *and* the job search status, which
   * is a profile answer the account form has no field for.
   *
   * The role they came for is not held for them. Naming it in the toast is the
   * most this can honestly do — a queued application would be the other answer,
   * and it is not the one this board gives.
   */
  const onCreateAccount = ({ details, profile: seeded }: { details: JobSignUpDetails; profile: MemberProfile }) => {
    const roleTitle = flowJob?.role.roleTitle;
    setViewer('pending-approval');
    setIsLoggedIn(true);
    setProfile(seeded);
    onCloseFlow();
    toast.success(
      roleTitle
        ? `Account created for ${details.email}. We'll email you when it's approved — then you can apply to ${roleTitle}.`
        : `Account created for ${details.email}. The PL team reviews new accounts before applications can be sent.`,
    );
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
    /* `applied` is `profile-ready` plus a history: same finished profile, because
       you cannot have applied without one. */
    setProfile(next === 'profile-ready' || next === 'applied' ? FILLED_PROFILE : EMPTY_PROFILE);
    onCloseFlow();
    setApplications(next === 'applied' ? seededApplications() : new Map());
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

  /* The email review surface takes the whole page rather than sitting over the
     board. It is not a state the board can be in — it renders something that
     leaves the product — so drawing it as a layer on top of a live board would
     invite it to be read as a feature of one. */
  if (emailPreviewOpen) {
    return (
      <>
        {nav}
        <div className={s.emailStage}>
          <ApplicationEmailPreview input={SAMPLE_APPLICATION_EMAIL} />
        </div>
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

  /* The scope strip, rendered ONCE and on its own row.
   *
   * Production puts it beside the title (`TeamList` → `.titleSec`), and that was
   * the first attempt here — inside `titleBlock`. It doesn't transfer: this board
   * has *two* title rows, because `JobsContent` renders one for mobile and one in
   * the desktop toolbar and hides whichever doesn't apply. Duplicating an `<h1>`
   * that way is production's own trick and harmless; duplicating a tab strip puts
   * two live controls in the DOM, both wired to the same store, one of them
   * invisible — which is a thing for assistive tech to read out twice and a thing
   * for the next person to keep in sync.
   *
   * So it gets its own full-width row above the list, which is where a scope
   * belongs regardless: the toolbar's controls reorder the list you are looking
   * at, and this chooses which list that is.
   *
   * Signed in only, per production's rule (`TeamList` wraps it in `isLoggedIn`):
   * a logged-out visitor has no applications, so the tab could only ever open on
   * nothing. */
  const scopeTabs = isLoggedIn ? (
    <div className={s.scopeTabs}>
      <JobBoardScopeTabs appliedCount={appliedRoleUids.size} />
    </div>
  ) : null;

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
          changed: the account exists, so what is left to do is the profile.

          Still not shown to a pending member, but for a different reason than it
          used to be. The old one was that approval was the real obstacle, so
          naming the profile would point at the wrong thing; approval blocks
          nothing now. The reason that survives is simpler — `PendingApprovalBanner`
          already makes exactly this ask, with the same button, for exactly this
          person. Two banners in one slot saying "finish your profile" is one ask
          rendered twice. */}
      {isLoggedIn && !isPendingApproval && !isProfileComplete(profile) && (
        <ProfileNudgeBanner onUpdateProfile={openProfileEditor} />
      )}

      {/* Signed up, waiting. The board is untouched underneath; this says where
          they are and — while there's still profile left to fill in — hands back
          the one move that is theirs. */}
      {isPendingApproval && (
        <PendingApprovalBanner profileComplete={isProfileComplete(profile)} onUpdateProfile={openProfileEditor} />
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

      {scopeTabs}

      {visibleGroups.length === 0 ? (
        /* Two empty states, because there are two different reasons to be here
           and only one of them is a dead end you got to by narrowing.

           In the Applied tab with nothing applied to, "try clearing some
           filters" would be advice that doesn't apply — there is nothing to
           clear, and the list is empty because of something the person hasn't
           done yet rather than something they have. It says what the tab holds
           and points at the tab that holds the roles. The distinction is between
           "you have applied to nothing" and "nothing you applied to survived
           this rail", which is why the filtered case still gets the original
           line. */
        <div className={s.empty}>
          {appliedScope && appliedRoleUids.size === 0 ? (
            <>
              You haven&apos;t applied to anything yet. Roles you apply to collect here, so you can see what you&apos;ve
              already gone for.{' '}
              <button type="button" className={s.emptyLink} onClick={() => setParam(SCOPE_PARAM, undefined)}>
                Browse all roles
              </button>
            </>
          ) : (
            <>No roles match your filters. Try clearing some.</>
          )}
        </div>
      ) : (
        <div className={contentCss.list}>
          {visibleGroups.map((group) => (
            <JobTeamGroupCard
              key={group.team.uid}
              group={group}
              newsVariant={NEWS_VARIANT}
              canRefer={isLoggedIn}
              onViewJob={onViewJob}
              appliedRoleUids={appliedRoleUids}
              appliedAtByRole={appliedAtByRole}
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

        {/* (A `Details step` switch stood here while two drawings of the
            logged-out step 2 were being compared. It is gone with the losing
            one: a review switch left up after the decision invites the decision
            to be re-litigated every time someone opens the page. The viewer
            switch above is the only scaffolding on this board again.) */}
      </div>
    </div>
  );

  return (
    <>
      {nav}
      {reviewControls}
      <DashboardPagesLayout filters={<JobBoardFilterView />} content={content} />

      {/* The whole application, in one drawer: read the job, fill in what it
          needs, write the note, apply. Three components used to stand here — a
          detail drawer, a profile drawer and a centred apply modal — each with
          its own header and footer, handed to each other by four pieces of board
          state. See the note at the top of `JobApplyFlowDrawer`. */}
      <JobApplyFlowDrawer
        open={!!flow}
        onClose={onCloseFlow}
        role={flowJob?.role ?? null}
        team={flowJob?.team ?? null}
        step={flowStep}
        onStepChange={setFlowStep}
        profile={profile}
        onSaveProfile={onSaveProfile}
        onSubmitApplication={onSubmitApplication}
        onCreateAccount={onCreateAccount}
        loggedIn={isLoggedIn}
        onSignIn={onFlowSignIn}
        pendingApproval={isPendingApproval}
        applied={flowJob ? appliedRoleUids.has(flowJob.role.uid) : false}
        appliedAt={flowJob ? appliedAtByRole.get(flowJob.role.uid) : undefined}
        /* DELETE WITH: the `design-canvas/` folder. The importer's beats live in
           component state; see `canvasStates.ts`. A `scenario` is turned into the
           parse it names here, so the profile step receives the same record the
           real reader would have resolved to. */
        canvasImport={
          canvasPin?.import
            ? {
                parsed: canvasPin.import.scenario ? parseResultFor(canvasPin.import.scenario) : undefined,
                panel: {
                  open: canvasPin.import.open,
                  status: canvasPin.import.status,
                  fileName: canvasPin.import.fileName,
                },
              }
            : undefined
        }
        // DELETE WITH: the `design-canvas/` folder. See `canvasStates.ts`.
        canvasCoverLetter={canvasPin?.coverLetter}
      />

      {/* The account form, now reached exactly one way: pressing **Sign up** in
          the header or the banner, which names no role.

          It used to have a second door — Apply while logged out — and that door
          is the one the flow drawer took over. Applying from a role now walks
          the rail's own details step, so this modal is left holding the case it
          was always the right shape for: someone who wants an account before
          they have picked a job. */}
      <JobSignUpModal
        open={signUp}
        onClose={() => setSignUp(false)}
        onSignUp={onSignUpSubmit}
        onSignIn={onSignUpModalSignIn}
        // DELETE WITH: the `design-canvas/` folder. See `canvasStates.ts`.
        canvasFilled={canvasPin?.signUpFilled}
        canvasRefused={canvasPin?.signUpRefused}
      />
    </>
  );
}
