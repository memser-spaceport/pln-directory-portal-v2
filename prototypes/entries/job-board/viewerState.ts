import type { IJobRole } from '@/types/jobs.types';
import { seniorityDisplayLabel, workplaceTypeDisplayLabel } from '@/utils/jobs.utils';

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
 * which is the whole reason it can be honest. "Not looking" is only a safe answer
 * if saying it costs nothing, and a public field would make it cost something.
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
export type JobSearchStatus = 'actively-looking' | 'open-to-right-role' | 'not-looking';

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
  {
    value: 'not-looking',
    label: 'Not looking',
    hint: "You don't want to hear about roles right now.",
  },
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
  /** Private — see `JobSearchStatus`. Empty until answered. */
  jobSearchStatus: JobSearchStatus | '';
}

export const EMPTY_PROFILE: MemberProfile = {
  role: '',
  location: '',
  skills: [],
  bio: '',
  experiences: [],
  contributions: [],
  githubHandle: '',
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
export type BoardViewer = 'logged-out' | 'pending-approval' | 'profile-incomplete' | 'profile-ready' | 'applied';

/**
 * The gate on Apply: **your current role, and an answered job search status.**
 *
 * Narrowed twice. The first version asked for a role, a team and a
 * years-of-experience band as three separate top-level fields; those collapsed
 * into a single Experience entry, which answers all three at once. This version
 * drops even that.
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
 * **And the current role, added second.** The status says whether to surface
 * someone; the role says *as what*, and it is the one line a hiring team reads
 * before anything else — an application from "someone, status: actively
 * looking" is not an application. It also costs a single field, and it is the
 * field the header card is already asking for in production's own amber
 * `+ Your Role` affordance, so requiring it adds a rule rather than a form.
 *
 * Deliberately not the same as an Experience entry's title. A member may have
 * no work history written down and still hold a job today; asking for the
 * current role directly gets the answer in one field instead of making them
 * file a dated entry to say it. The two coexist — the entry is the record, this
 * is the headline — and only this one gates.
 *
 * Both live in the first two cards of the drawer, in that order: the required
 * things are the first things asked for, not the things three cards down.
 *
 * Everything else is optional on purpose — experience, contributions, skills,
 * bio, location, repositories all refine a read rather than making one
 * possible. Adding a section to the drawer never adds a requirement; this line
 * is the only place a requirement can be written.
 */
export const isProfileComplete = (profile: MemberProfile): boolean =>
  profile.role.trim() !== '' && profile.jobSearchStatus !== '';

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
 * **The title comes from `profile.role`, not from the experience entry.** It
 * used to be the entry's `title`, which meant this returned an empty string for
 * anyone who hadn't filled in a work history — and the apply modal then had to
 * apologise for having nothing to quote. That was backwards twice over: the
 * current role is a *required* field, so there is always a title; and the header
 * card of the profile shows `role` as the headline, so quoting the entry instead
 * could read the profile back differently from how the profile displays itself.
 *
 * The entry still supplies the company, because "at <somewhere>" is the half a
 * standalone role can't state. Entry-less profiles get the role alone, which is
 * a complete sentence and a true one. The entry's own `title` survives only as a
 * fallback for the impossible case of a blank role.
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
