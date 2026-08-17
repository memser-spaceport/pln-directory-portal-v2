import type { IJobRole, IJobTeamGroup } from '@/types/jobs.types';
import { seniorityDisplayLabel, workplaceTypeDisplayLabel } from '@/utils/jobs.utils';

/**
 * Who is looking at the board, and what they've told it they want.
 *
 * The central claim of this prototype: **"what I'm looking for" is not a new
 * object.** It is production's `IJobAlertFilterState` (types/job-alerts.types.ts)
 * — `{ roleCategory[], seniority[], location[], workMode[] }` — which is also the
 * exact shape of the filter rail, and already has a permanent home at
 * `/settings/job-alerts`.
 *
 * One object, two verbs:
 *  - as a **filter** it removes rows (`roleMatches` with empty = no constraint)
 *  - as a **preference** it ranks them and makes you findable (`matchesPreferences`,
 *    where empty means "we don't know you" and matches nothing)
 *
 * Because preferences carry the same keys as the job facets, matching is exact.
 * No taxonomy bridge, no invented score, no percentage — the only honest options
 * when the two sides of the match share a vocabulary.
 */

export type ViewerId = 'logged-out' | 'no-preferences' | 'preferences-set';

/** The four facet axes, shared by the filter rail and saved preferences. */
export interface RoleCriteria {
  roleCategory: string[];
  seniority: string[];
  workplaceType: string[];
  location: string[];
}

export interface JobPreferences extends RoleCriteria {
  /** Production's `member.openToWork` — labelled "Open to Collaborate" there. */
  openToNewRoles: boolean;
}

/**
 * The other half of the match, and the other direction of it.
 *
 * Preferences point the board at the person; **this points the person at the
 * teams**. It is deliberately not a new object either: `title` / `company` are
 * production's `TEditExperienceForm` (the profile's own Experience entry) and
 * `skills` is `member.skills`, the field the settings form already owns. So the
 * three fields the modal collects have a home before it asks for them — which is
 * what lets it say "we'll put this on your profile" instead of parking the
 * answers somewhere only the job board can see.
 *
 * Trimmed against the production form on purpose: description, start/end dates
 * and location stay in Settings → Profile. A person mid-browse will answer "what
 * do you do and where" and abandon a date picker, and none of the omitted fields
 * change who finds you.
 *
 * Note what this is *not*: an input to the match. Matching runs on stated
 * intent (`roleMatches`) and nothing here feeds it — no inferred seniority, no
 * years-of-experience score. Experience makes the person legible to a team
 * reading them; it never quietly re-ranks the board.
 */
export interface MemberExperience {
  /** Production `TEditExperienceForm.title` — labelled "Role" on the profile. */
  title: string;
  /** Production `TEditExperienceForm.company` — "Team or Organization". */
  company: string;
  /** Production `member.skills`, same field the settings form edits. */
  skills: string[];
}

export const EMPTY_EXPERIENCE: MemberExperience = { title: '', company: '', skills: [] };

/** Seeds the "preferences already set" preview state alongside `SAVED_PREFERENCES`. */
export const SAVED_EXPERIENCE: MemberExperience = {
  title: 'Senior Protocol Engineer',
  company: 'Lattice Compute',
  skills: ['Distributed Systems', 'Rust'],
};

export const hasExperience = (experience: MemberExperience): boolean =>
  experience.title.trim().length > 0 || experience.company.trim().length > 0 || experience.skills.length > 0;

/** "Senior Protocol Engineer at Lattice Compute" — the line the profile will show. */
export function summariseExperience(experience: MemberExperience): string {
  const title = experience.title.trim();
  const company = experience.company.trim();
  if (title && company) return `${title} at ${company}`;
  return title || company;
}

export const EMPTY_CRITERIA: RoleCriteria = {
  roleCategory: [],
  seniority: [],
  workplaceType: [],
  location: [],
};

export const EMPTY_PREFERENCES: JobPreferences = { ...EMPTY_CRITERIA, openToNewRoles: false };

/** Seeds the "preferences already set" preview state. */
export const SAVED_PREFERENCES: JobPreferences = {
  roleCategory: ['Engineering'],
  seniority: ['Senior (L4)', 'Lead (L5)'],
  workplaceType: ['remote'],
  location: [],
  openToNewRoles: true,
};

/** A workplaceType value ('remote' | 'in-office' | 'hybrid') against a role's workMode. */
const matchesWorkMode = (selected: string[], workMode: string | null): boolean => {
  if (selected.length === 0) return true;
  const wm = (workMode ?? '').toLowerCase();
  return selected.some((v) => (v === 'remote' ? wm === 'remote' || wm === 'distributed' : wm === v));
};

/**
 * The one predicate. Filtering and ranking both run it, so a role that survives
 * the rail is always a role the match badge would mark — two copies of this would
 * drift, and the drift would be invisible until someone noticed the list
 * disagreeing with itself.
 *
 * Empty axis = no constraint, which is what a *filter* means.
 */
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
 * Same predicate, the preference verb. The guard is the whole difference: an
 * empty filter shows everything, an empty preference matches nothing. Without it
 * a person who has told us nothing would see every role badged "matches you",
 * which is the exact lie this feature exists to avoid.
 */
export const matchesPreferences = (criteria: RoleCriteria, role: IJobRole): boolean =>
  hasCriteria(criteria) && roleMatches(criteria, role);

export const countMatches = (groups: IJobTeamGroup[], criteria: RoleCriteria): number =>
  hasCriteria(criteria)
    ? groups.reduce((n, g) => n + g.roles.filter((r) => matchesPreferences(criteria, r)).length, 0)
    : 0;

/**
 * "Engineering · Senior, Lead · Remote" — what the person actually asked for, in
 * the words the rail used. Reads back their own selection rather than a count, so
 * the strip is recognisably about the thing they just did.
 */
export function summariseCriteria(criteria: RoleCriteria): string {
  return [
    ...criteria.roleCategory,
    ...criteria.seniority.map(seniorityDisplayLabel),
    ...criteria.workplaceType.map(workplaceTypeDisplayLabel),
    ...criteria.location,
  ].join(' · ');
}
