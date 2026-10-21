import { cache } from 'react';

import { getTeam, getTeamUIDByAirtableId } from '@/services/teams.service';
import { AIRTABLE_REGEX } from '@/utils/constants';

/**
 * The team as the profile route's metadata and layout read it: one API call per request, shared through `cache`.
 */
export const getTeamProfileLookup = cache((id: string) =>
  getTeam(id, { with: 'logo,technologies,membershipSources,industryTags,fundingStage,teamMemberRoles.member' }),
);

/**
 * Whether a team profile request should answer "not found" (LAB-2922): the API says this id is unknown. Any other
 * failure is not "not found". Old Airtable ids are never "not found" here: the page redirects them to the team's uid.
 */
export async function isTeamNotFound(id: string): Promise<boolean> {
  if (AIRTABLE_REGEX.test(id)) {
    return false;
  }
  const result = await getTeamProfileLookup(id);
  return !!result?.error && result.error.status === 404;
}

/**
 * The team uid behind an old Airtable record id (`/teams/rec…` links from the previous directory), or nothing when the
 * lookup fails or finds no team (LAB-2924).
 */
export async function getTeamUidForAirtableId(id: string): Promise<string | undefined> {
  try {
    const result = await getTeamUIDByAirtableId(id);
    // The list endpoint answers `{ count, teams: [...] }`. The page's own Airtable branch still reads a bare array,
    // which is why these links stopped redirecting at all; both shapes are accepted here.
    const teams = Array.isArray(result) ? result : result?.teams;
    const uid = Array.isArray(teams) ? teams[0]?.uid : undefined;
    return typeof uid === 'string' && uid ? uid : undefined;
  } catch {
    return undefined;
  }
}
