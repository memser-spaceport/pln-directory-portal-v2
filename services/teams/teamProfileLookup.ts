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
