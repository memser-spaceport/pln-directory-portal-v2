import type { IJobRole } from '@/types/jobs.types';
import { seniorityDisplayLabel, workplaceTypeDisplayLabel } from '@/utils/jobs.utils';

// The account's address, so the profile's contact card and the account fact are
// one address rather than two that drift. See `FILLED_PROFILE.email`.
import { VIEWER_EMAIL, VIEWER_ROLE } from './profile/viewerIdentity';
import { MOCK_STORED_CV, type StoredCv } from '../profile-shared/StoredCv';

/**
 * Who is looking at the board, and whether they can apply from it.
 *
 * **What changed, and why.** This file used to carry a second job: preferences —
 * "what I'm looking for", saved as production's `IJobAlertFilterState` — which
 * ranked the board and badged rows "Matches you". That's gone. The board's
 * sign-in payoff is no longer a re-sort, it's **applying in one click**, so the
 * thing the flow collects is who you *are*, not what you *want*. The
 * looking-for-work facets still live at `/settings/job-alerts`.
 *
 * `RoleCriteria` survives because the **filter rail** is still those four axes.
 * One verb now, not two: as a filter, an empty axis means "no constraint".
 */

/** The four facet axes the filter rail collects. */
export interface RoleCriteria {
  roleCategory: string[];
  seniority: string[];
  workplaceType: string[];
  location: string[];
}

/**
 * One entry in the profile's work history.
 *
 * Field-for-field production's `TEditExperienceForm`
 * (`components/page/member-details/ExperienceDetails/types.ts`) — Role, Team or
 * Organization, description, dates and location — because this is that record,
 * not a job-board copy of it. The prototype adds `uid` only so React can key the
 * list.
 */
export interface ExperienceEntry {
  uid: string;
  /** Production `title` — labelled "Role". */
  title: string;
  /** Production `company` — labelled "Team or Organization". */
  company: string;
  description: string;
  /** 'YYYY-MM'. Required. */
  startDate: string;
  /** 'YYYY-MM'. Null while `isCurrent`. */
  endDate: string | null;
  isCurrent: boolean;
  location: string;
}

/* `TeamEntry` used to live here, and the drawer edited a Teams card alongside
   this one. It's gone: the primary team is already answered by an Experience
   entry's "Team or Organization" field, so the card asked for it twice. Project
   contributions stayed — they are the one part of the record that says what
   someone actually built, which is exactly what a hiring team reads an
   application for, and nothing in this flow depends on them being filled in. */

/**
 * One project the member contributed to.
 *
 * Production's `TEditContributionsForm`, same fields in the same order: the
 * project (a select), the role, the dates with a `Present` switch, and a
 * description. Dates are 'YYYY-MM' here for the same reason `ExperienceEntry`'s
 * are — see the note there.
 *
 * Optional, like everything except the job search status. See
 * `isProfileComplete`: adding a section never adds a requirement.
 */
export interface ContributionEntry {
  uid: string;
  /** Production's `project.name` — labelled "Project Name". */
  project: string;
  role: string;
  /** 'YYYY-MM'. Required. */
  startDate: string;
  /** 'YYYY-MM'. Null while `isCurrent`. */
  endDate: string | null;
  /** Production's `currentProject`. */
  isCurrent: boolean;
  description: string;
}

/**
 * Where someone is in their search.
 *
 * **Private.** It is never rendered on the profile and never leaves this record —
 * which is the whole reason it can be honest. A public field would make the
 * degree of your interest something you have to manage in front of the people
 * you might work for; kept private, it can just be true.
 *
 * **Two options, not three.** "Not looking" was here and is gone. It was the
 * answer that made the field a status report about the person rather than an
 * answer to the question this flow is actually asking — which is asked of
 * someone who has just pressed Apply on a job. Somebody standing in an
 * application is by definition not "not looking", so the option was either
 * never picked or picked by mistake, and it made a required question read as a
 * survey. What is left is the only distinction a hiring team can act on: are
 * you searching now, or would you take the right conversation.
 *
 * Deliberately NOT `member.openToWork`. That field is public in three places
 * (the profile header pill "Open to Collaborate", the members-list badge, the
 * home featured card) and it means *open to collaborate on projects*, not
 * job-seeking. Overloading it would silently publish an answer given in
 * confidence — and the existing `settings-contact-details` prototype already
 * relabels it "Open to new roles", which is the confusion this stays clear of.
 *
 * Wire values are lowercase-hyphen and display labels are separate, following
 * `utils/jobs.utils.ts` (`WORKPLACE_TYPE_LABELS`, `SENIORITY_DISPLAY`) — same
 * `?? raw` fallback, so an unknown value degrades to itself.
 */
export type JobSearchStatus = 'actively-looking' | 'open-to-right-role';

export const JOB_SEARCH_STATUS_OPTIONS: Array<{
  value: JobSearchStatus;
  label: string;
  hint: string;
}> = [
  {
    value: 'actively-looking',
    label: 'Actively looking',
    hint: "You're searching now and want to hear about roles that fit.",
  },
  {
    value: 'open-to-right-role',
    label: 'Open to the right role',
    /* "Passively open" was the working name. It describes the person from the
       system's point of view; this describes the offer from theirs, which is what
       they are actually answering. */
    hint: "You're not searching, but you'd take the right conversation.",
  },
  /* (A third option, `not-looking` / "Not looking", stood here. Removed — see
      the note on `JobSearchStatus`. Nothing else in the folder read the value,
      so no mock or canvas state had to be re-seeded.) */
];

const JOB_SEARCH_STATUS_LABELS: Record<string, string> = Object.fromEntries(
  JOB_SEARCH_STATUS_OPTIONS.map((o) => [o.value, o.label]),
);

export const jobSearchStatusDisplayLabel = (raw: string): string => JOB_SEARCH_STATUS_LABELS[raw] ?? raw;

/**
 * What an application carries with it — the member's own profile record, in the
 * shape the profile page already keeps it.
 *
 * `jobSearchStatus` is the only required part (see `isProfileComplete`).
 * Everything else is on the card because the profile has it and a hiring team
 * reads it, not because this flow demands it.
 */
export interface MemberProfile {
  /**
   * The CV the profile keeps, or none. The *file* — the fields it filled in are
   * the ordinary fields below, and removing one does not touch the other. See
   * `profile-shared/StoredCv`.
   */
  cv: StoredCv | null;
  /** Header card: `member.mainTeam.role ?? member.role`. */
  role: string;
  /** Header card: `parseMemberLocation(member.location)`. */
  location: string;
  /** Production `member.skills`. */
  skills: string[];
  /** Production `member.bio`. */
  bio: string;
  /** Production's Experience list. Optional — see `isProfileComplete`. */
  experiences: ExperienceEntry[];
  /** Production's Project Contributions list. Optional. */
  contributions: ContributionEntry[];
  /**
   * Production's `member.githubHandle`. Optional, and the only input the
   * Repositories section takes: the repositories themselves are derived from it,
   * never typed.
   */
  githubHandle: string;
  /**
   * Production's `member.linkedinHandle` — a handle or a profile URL, as the
   * sign-up form accepts it.
   *
   * It is here because the sign-up modal has always *asked* for it and then
   * dropped the answer on the floor: `onSignUpSubmit` seeded only `role`, and
   * `MemberProfile` had nowhere to put the rest. A field that asks for something
   * and does nothing with it is the worst kind of field — it spends the person's
   * attention and returns nothing.
   *
   * What it is not: an import source. Production's LinkedIn OAuth
   * (`useLinkedInVerification`) returns `ILinkedinProfile.profileData` — name,
   * email, picture, locale — and no positions at all, which is why
   * `ExperiencesList` carries a commented-out "Connect LinkedIn" button rather
   * than a working one. Work history comes from a document; see
   * `profile-shared/ExperienceImport`.
   */
  linkedin: string;
  /**
   * The rest of production's contact handles, so the profile step can render
   * the Contact Details card production puts directly under the header.
   *
   * **Added to this record rather than mocked separately.** `linkedin` and
   * `githubHandle` were already here, which meant a contact card built from a
   * second dataset would have shown one LinkedIn on the card and a different
   * one everywhere else on the same screen. One profile, one set of links.
   *
   * Production's names, so the mapping to `VISIBLE_HANDLES` is a rename and not
   * a translation: `member.email`, `member.telegramHandle`, `member.twitter`,
   * `member.discordHandle`, `member.blueskyHandle`. Empty string means "not
   * given" and the card simply renders nothing for it — the same thing
   * production does.
   *
   * All optional. `isProfileComplete` is unchanged: adding a section never adds
   * a requirement.
   */
  email: string;
  telegram: string;
  twitter: string;
  discord: string;
  bluesky: string;
  /** Private — see `JobSearchStatus`. Empty until answered. */
  jobSearchStatus: JobSearchStatus | '';
}

export const EMPTY_PROFILE: MemberProfile = {
  cv: null,
  role: '',
  location: '',
  skills: [],
  bio: '',
  experiences: [],
  contributions: [],
  githubHandle: '',
  linkedin: '',
  email: '',
  telegram: '',
  twitter: '',
  discord: '',
  bluesky: '',
  jobSearchStatus: '',
};

/**
 * A profile that already clears the bar — the returning member.
 *
 * Exists so the board can be reviewed in the state most real members are
 * actually in: signed in, profile filled in some time ago, and now looking at a
 * role. That path never opens an empty form, so it is a different design from
 * the one the empty state exercises, and it can't be reviewed by filling the
 * form in by hand each time.
 */
export const FILLED_PROFILE: MemberProfile = {
  /* Uploaded some weeks back, like everything else on this profile — so the
     returning member is the viewer the resting CV card is reviewed on. */
  cv: MOCK_STORED_CV,
  role: 'Senior Protocol Engineer',
  location: 'Berlin, Germany',
  skills: ['Distributed Systems', 'Rust', 'libp2p'],
  bio: '<p>Networking and consensus, mostly. Currently focused on transport performance.</p>',
  experiences: [
    {
      uid: 'exp-seed-1',
      title: 'Senior Protocol Engineer',
      company: 'Lattice Compute',
      description: '<p>Cut p95 handshake latency by 40% across the transport layer.</p>',
      startDate: '2021-03',
      endDate: null,
      isCurrent: true,
      location: 'Remote',
    },
  ],
  /* One entry, current, so the returning member's stack shows the section doing
     something rather than showing its empty state — the two are different
     designs and only one of them was reviewable before. Seeded from the board's
     own project names for the same reason the team select was: the profile and
     the board should describe one network, not two. */
  contributions: [
    {
      uid: 'con-seed-1',
      project: 'libp2p',
      role: 'Maintainer, transports',
      startDate: '2022-06',
      endDate: null,
      isCurrent: true,
      description: '<p>QUIC transport and connection upgrade paths.</p>',
    },
  ],
  githubHandle: '',
  /* Matches `VIEWER_NAME`, which is who this profile belongs to. */
  linkedin: 'polina-bublii',
  /* Enough handles for the Contact Details card to show a real row rather than
     one lonely link — but not all of them. `githubHandle` is deliberately still
     blank (the Repositories section's empty state is a thing this prototype
     exercises), and so are Discord and Bluesky: a card where every slot happens
     to be filled is the one arrangement that never has to decide what a partial
     row looks like, which is what almost every real profile is. */
  /* `VIEWER_EMAIL`, not a second literal. `viewerIdentity` is explicit that the
     board, the sign-up form and the application email must all name one
     applicant rather than three near-identical addresses; a contact card
     showing a fourth would be the same mistake on the same screen. */
  email: VIEWER_EMAIL,
  telegram: 'polinabublii',
  twitter: 'polinabublii',
  discord: '',
  bluesky: '',
  jobSearchStatus: 'open-to-right-role',
};

/**
 * Which of the board's entry states is being previewed.
 *
 * Prototype scaffolding — the real page reads cookies and an access level. What
 * is being reviewed is what each of these five people sees, because the apply
 * flow branches differently for each and only one of them (`logged-out`) was
 * ever visible without editing code.
 *
 *  - `logged-out`         no account. The banner is the standing offer.
 *  - `pending-approval`   signed up, waiting on the PL team. The account exists
 *                         but the profile cannot be filled in yet, so applying
 *                         is blocked on something the person cannot do anything
 *                         about — which makes honest copy the whole design.
 *  - `profile-incomplete` signed in, nothing filled in. The ask moves from "sign
 *                         in" to "finish your profile".
 *  - `profile-ready`      signed in, profile already good. Applying should not
 *                         re-open a form; it should confirm what will be sent.
 *  - `applied`            the returning member: same profile as `profile-ready`,
 *                         but with applications already sent. It is the only
 *                         state where the Applied tab has anything in it, where
 *                         rows show the disabled "✓ Applied" button, and where
 *                         the board is something you come *back* to rather than
 *                         arrive at. Reaching it by hand meant applying to two
 *                         roles first — three modals each — which is exactly the
 *                         friction that stops a state from being reviewed.
 */
/* (`SIGNED_UP_PROFILE` stood here, with a `signed-up-modal` viewer beside it:
    someone who took the header/banner sign-up door and then pressed Apply, whose
    account step opened pre-filled so the only thing left was a completeness
    tick. Removed — it was a *second* signed-out state, and the flow's own
    account step already covers the one that matters. The tick it existed to show
    survives; it now belongs to `pending-approval`, which is where a real person
    signing up through the modal lands the moment the account exists. */

/**
 * **`job-aspirant` is the second thing "signed up" can mean, not the next thing
 * that happens after `pending-approval`.** The two are siblings: both are
 * accounts that exist, and the split is what the account is *for*. Someone
 * joining a PL Network team is vouched for by the PL team, so their account
 * waits; someone who came to the board to find work is not joining anything, so
 * there is nothing to approve and nothing to wait for. Applying is live from the
 * first minute.
 *
 * What that costs them instead is a document and a permission — the CV they
 * apply with, and consent to let hiring teams read it — which is why this viewer
 * exists as its own entry state rather than as `profile-incomplete` with a flag.
 * The profile step is a different ask for them.
 */
/**
 * **`team-lead` and `directory-admin` are a different axis from the six above.**
 * Those six are one person at successive moments; these two are what the same
 * board looks like to someone who *owns listings on it*. Both are ordinary
 * approved members with a finished profile — a lead can apply to another team's
 * role like anyone else — plus one power: they can put their team's jobs on the
 * board and take them off. Production decides that with
 * `isTeamLeaderOrAdmin(userInfo, teamId)`; here it is `managedTeamUids` in
 * `listings.ts`.
 *
 * Two, not one, because the form differs: a lead posts as the one team they
 * lead and is never asked which, an admin posts for any team and picks. That
 * is the only difference a reviewer needs to see, and it cannot be seen from
 * one viewer.
 */
export type BoardViewer =
  | 'logged-out'
  | 'pending-approval'
  | 'job-aspirant'
  | 'profile-incomplete'
  | 'profile-ready'
  | 'applied'
  | 'team-lead'
  | 'directory-admin';

/**
 * Signed up to look for work rather than to join a team — see `BoardViewer`.
 *
 * A function for the same reason `isViewerSignedIn` is one: the profile step,
 * the drawer and the board each need the test, and a literal written out three
 * times is three places to teach when a second aspirant state appears.
 */
export const isJobAspirant = (viewer: BoardViewer): boolean => viewer === 'job-aspirant';

/**
 * Whether this viewer is signed in *for the flow* — i.e. whether step 2 shows
 * the member profile or the account form.
 *
 * A function rather than `viewer !== 'logged-out'` written out at each call
 * site. It was written out at three (the query-string entry, the canvas pin
 * and the switcher), and when a second signed-out state existed all three had
 * to learn the same exception on the same day. That state is gone and the test
 * is one clause again — the function stays, so the next one only has to be
 * taught here.
 */
export const isViewerSignedIn = (viewer: BoardViewer): boolean => viewer !== 'logged-out';

/**
 * A job aspirant's starting profile: the status and the role the sign-up
 * collected, and nothing else.
 *
 * **Neither of these is an assumption — the sign-up collected them.**
 * `actively-looking` is what signing up as a job aspirant *means*, and the
 * current role is a field on the account form itself (see `accountFields`). A
 * step that opens by asking someone to re-enter what they typed two presses ago
 * is the product not listening. The role is no longer a requirement, so nothing
 * would mark its absence any more; it is seeded because it was answered, which
 * is the only reason a fixture ever needs.
 *
 * `VIEWER_ROLE`, not a fourth literal of the same string. `viewerIdentity` is
 * explicit that the sign-up form and the profile behind it have to describe one
 * person, which is exactly what this fixture stands between.
 *
 * Both stay ordinary editable answers, not locked ones: the header card and the
 * status card render as they do for anyone else, with these filled in.
 *
 * **What this makes true, and what it must not.** With the status in,
 * `isProfileComplete` passes — so nothing on the board nags this viewer, which
 * is right. It would also make the profile step *skippable* on the usual rule
 * (complete → straight to the letter), which is wrong: for an aspirant that step
 * was never a form to finish. It is the profile a stranger is about to be judged
 * on, opened so they can put a CV on it and say they have read it. See
 * `onApplyPressed`.
 */
export const JOB_ASPIRANT_PROFILE: MemberProfile = {
  ...EMPTY_PROFILE,
  role: VIEWER_ROLE,
  jobSearchStatus: 'actively-looking',
};

/** The profile each viewer arrives holding. */
export const profileForViewer = (viewer: BoardViewer): MemberProfile =>
  /* A lead or an admin is a member in good standing, so they arrive with the
     finished profile — and can apply to another team's role like anyone else. */
  viewer === 'profile-ready' || viewer === 'applied' || viewer === 'team-lead' || viewer === 'directory-admin'
    ? FILLED_PROFILE
    : viewer === 'job-aspirant'
      ? JOB_ASPIRANT_PROFILE
      : EMPTY_PROFILE;

/**
 * The gate on Apply: **an answered job search status, and nothing else.**
 *
 * Narrowed three times. The first version asked for a role, a team and a
 * years-of-experience band as three separate top-level fields; those collapsed
 * into a single Experience entry, which answers all three at once. Then the
 * entry went too. The current role stood here last and is now gone as well.
 *
 * **Why the status and not the experience.** They are not the same kind of
 * question. An experience entry is a thing a member either has written down or
 * hasn't, and most of a real directory profile is already carrying one — asking
 * for it at the gate mostly stops people who have nothing new to say. The job
 * search status is the one field this flow is uniquely placed to collect, it
 * cannot be inferred from anything else in the record, it takes one click, and
 * it is the field that decides whether the profile gets surfaced to founders who
 * are hiring. Requiring the answer that only the person can give — and that
 * changes what the product does next — is a better gate than requiring the
 * paragraph they may have written elsewhere already.
 *
 * **And the current role, which stood here and no longer does.** The argument
 * for it was that the status says whether to surface someone and the role says
 * *as what* — the one line a hiring team reads first. That is still true about
 * how a profile *reads*; it was never true that the board should refuse the
 * application without it. It is the same class of answer as an Experience entry:
 * a fact about the person that they may have written down elsewhere, that a CV
 * fills in, and that a hiring team can ask for. Gating on it bought a tidier
 * read-back at the price of stopping people at the door, which is the trade the
 * experience gate had already lost.
 *
 * So the role is asked for in the two places it belongs — the account form and
 * the profile's header card, both in production's own words — and neither of
 * them stops anybody. Only the status does.
 *
 * The status still lives in the first card of the drawer's profile step: the
 * required thing is the first thing asked for, not the thing three cards down.
 *
 * Everything else is optional on purpose — the role, experience, contributions,
 * skills, bio, location, repositories all refine a read rather than making one
 * possible. Adding a section to the drawer never adds a requirement; this line
 * is the only place a requirement can be written.
 */
export const isProfileComplete = (profile: MemberProfile): boolean => profile.jobSearchStatus !== '';

/** The entry a summary should speak for: the current role, else the most recent. */
export function primaryExperience(profile: MemberProfile): ExperienceEntry | null {
  if (!profile.experiences.length) return null;
  const current = profile.experiences.find((e) => e.isCurrent);
  if (current) return current;
  return [...profile.experiences].sort((a, b) => (b.startDate ?? '').localeCompare(a.startDate ?? ''))[0];
}

/**
 * "Senior Protocol Engineer at Lattice Compute" — the line the hiring team sees,
 * read back to the applicant before they send it. Reading back what will be sent
 * is the whole reason the apply modal isn't one button.
 *
 * **The title comes from `profile.role` first, then from the experience entry.**
 * It used to be the entry's `title` alone, which meant this returned an empty
 * string for anyone who hadn't filled in a work history while the header card
 * of the profile was showing `role` as the headline — a read-back sourced
 * differently from the thing it reads back, which will eventually disagree with
 * it.
 *
 * The entry still supplies the company, because "at <somewhere>" is the half a
 * standalone role can't state. Entry-less profiles get the role alone, which is
 * a complete sentence and a true one.
 *
 * **This can now return an empty string, and callers have to expect it.** The
 * role stopped being required (see `isProfileComplete`), so a profile with no
 * role, no entry and no company has nothing to quote. That is not a state to
 * apologise for in copy — the application pane simply omits the line, the way it
 * already omits the skills row when there are no skills.
 */
export function summariseProfile(profile: MemberProfile): string {
  const entry = primaryExperience(profile);
  const title = profile.role.trim() || entry?.title.trim() || '';
  const company = entry?.company.trim() ?? '';
  return title && company ? `${title} at ${company}` : title || company;
}

/**
 * "March 2021 — Present" / "March 2021 — June 2023". 'YYYY-MM' in, prose out.
 *
 * Takes the three date fields rather than a whole `ExperienceEntry`, so a
 * contribution — which keeps the same three, because production's contributions
 * form asks the same dates question — reads its line off the same function
 * instead of a second copy that can drift. Every existing caller still type-checks:
 * `ExperienceEntry` satisfies the narrower shape.
 */
export function formatExperienceDates(entry: {
  startDate: string;
  endDate: string | null;
  isCurrent: boolean;
}): string {
  const pretty = (ym: string | null): string => {
    if (!ym) return '';
    const [y, m] = ym.split('-');
    const month = Number(m);
    if (!y || !month) return ym;
    const MONTHS = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ];
    return `${MONTHS[month - 1] ?? m} ${y}`;
  };
  const start = pretty(entry.startDate);
  const end = entry.isCurrent ? 'Present' : pretty(entry.endDate);
  return [start, end].filter(Boolean).join(' — ');
}

/** A workplaceType value ('remote' | 'in-office' | 'hybrid') against a role's workMode. */
const matchesWorkMode = (selected: string[], workMode: string | null): boolean => {
  if (selected.length === 0) return true;
  const wm = (workMode ?? '').toLowerCase();
  return selected.some((v) => (v === 'remote' ? wm === 'remote' || wm === 'distributed' : wm === v));
};

/** The rail predicate. Empty axis = no constraint, which is what a filter means. */
export function roleMatches(criteria: RoleCriteria, role: IJobRole): boolean {
  const { roleCategory, seniority, workplaceType, location } = criteria;
  if (roleCategory.length && !(role.roleCategory && roleCategory.includes(role.roleCategory))) return false;
  if (seniority.length && !(role.seniority && seniority.includes(role.seniority))) return false;
  if (!matchesWorkMode(workplaceType, role.workMode)) return false;
  if (location.length && !role.location.some((l) => location.includes(l))) return false;
  return true;
}

export const hasCriteria = (criteria: RoleCriteria): boolean =>
  criteria.roleCategory.length > 0 ||
  criteria.seniority.length > 0 ||
  criteria.workplaceType.length > 0 ||
  criteria.location.length > 0;

/**
 * "Engineering · Senior, Lead · Remote" — what the person narrowed the rail to,
 * in the words the rail used. Reads back their own selection rather than a count.
 */
export function summariseCriteria(criteria: RoleCriteria): string {
  return [
    ...criteria.roleCategory,
    ...criteria.seniority.map(seniorityDisplayLabel),
    ...criteria.workplaceType.map(workplaceTypeDisplayLabel),
    ...criteria.location,
  ].join(' · ');
}
