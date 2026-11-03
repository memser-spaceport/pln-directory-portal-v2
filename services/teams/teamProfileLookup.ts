import { cache } from 'react';

import { getTeam, getTeamUIDByAirtableId } from '@/services/teams.service';
import { AIRTABLE_REGEX } from '@/utils/constants';

/**
 * The team as the profile route's metadata and layout read it: one API call per request, shared through `cache`.
 */
export const getTeamProfileLookup = cache((id: string) =>
  getTeam(id, { with: 'logo,technologies,membershipSources,industryTags,fundingStage,teamMemberRoles.member' }),
);

/** What the API answers a logged-out request for an `L0` team (soft-deleted, or no member has ever logged in). */
export const TEAM_INACTIVE_MESSAGE = 'Team is inactive';

type TeamLookupError = { status?: number; message?: string } | undefined;

/**
 * Whether the API refused a team because it is hidden from the public (LAB-3087). Such a team is not in the sitemap,
 * and to a visitor who may not see it, it does not exist: rendering the error page for it at 200 was a "soft 404".
 */
export function isTeamInactiveError(error: TeamLookupError): boolean {
  return error?.status === 403 && error?.message === TEAM_INACTIVE_MESSAGE;
}

/**
 * Whether a team profile request should answer "not found": the API says this id is unknown (LAB-2922), or the team
 * is hidden from the public and the visitor is logged out (LAB-3087).
 *
 * The lookup sends no token, so it gets the inactive answer for a logged-in viewer too. Such a viewer may still be
 * allowed in (a member of the team, an admin): the page asks again with their token, so they are never sent away here.
 * Any other failure is not "not found". Old Airtable ids are never "not found" here: the layout redirects them.
 */
export async function isTeamNotFound(id: string, isLoggedIn: boolean): Promise<boolean> {
  if (AIRTABLE_REGEX.test(id)) {
    return false;
  }
  const result = await getTeamProfileLookup(id);
  if (!result?.error) {
    return false;
  }
  return result.error.status === 404 || (!isLoggedIn && isTeamInactiveError(result.error));
}

/** What looking up an old Airtable record id found. */
export type AirtableTeamLookup = { kind: 'found'; uid: string } | { kind: 'missing' } | { kind: 'failed' };

/**
 * The team behind an old Airtable record id (`/teams/rec…` links from the previous directory), LAB-2924.
 *
 * Three outcomes, because they answer differently: a team found redirects to it, an id the API knows no team for is a
 * real 404 (answering 200 with an error page was a "soft 404" Search Console flagged), and a lookup that failed keeps
 * the error page so a crawler retries.
 */
export async function lookUpAirtableTeam(id: string): Promise<AirtableTeamLookup> {
  try {
    const result = await getTeamUIDByAirtableId(id);
    // The list endpoint answers `{ count, teams: [...] }`; the page's older branch read a bare array. Both are read.
    const teams = Array.isArray(result) ? result : result?.teams;
    if (!Array.isArray(teams)) {
      return { kind: 'failed' };
    }
    const uid = teams[0]?.uid;
    return typeof uid === 'string' && uid ? { kind: 'found', uid } : { kind: 'missing' };
  } catch {
    return { kind: 'failed' };
  }
}
