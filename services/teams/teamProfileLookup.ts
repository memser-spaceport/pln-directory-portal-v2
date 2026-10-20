import { cache } from 'react';

import { getTeam } from '@/services/teams.service';
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
