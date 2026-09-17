import { isTeamLeaderOrAdmin } from '@/components/page/team-details/utils/isTeamLeaderOrAdmin';
import type { IUserInfo } from '@/types/shared.types';

/**
 * May this viewer read this team's applicants?
 *
 * One rule, in one place, because it is asked in two: the page redirects on it,
 * and the team profile decides whether to draw the count line at all. Two
 * copies would drift, and the way they would drift is a line that offers to
 * open a page the viewer is then bounced off.
 *
 * `isLoggedIn` is taken as `unknown` on purpose. It arrives from a parsed
 * header and is `''` for every signed-out request, not `false` — so callers
 * that pass it straight through are the common case, and coercing here is
 * safer than trusting each of them to remember.
 *
 * This is an affordance, never a boundary. The endpoints apply the same rule
 * server-side; a viewer who edits their cookie gets a page that fetches 403s.
 */
export function canReadApplicants({
  flagOn,
  isLoggedIn,
  userInfo,
  teamId,
}: {
  flagOn: boolean;
  isLoggedIn: unknown;
  userInfo?: IUserInfo | null;
  teamId: string;
}): boolean {
  if (!flagOn) return false;
  if (!isLoggedIn) return false;
  /* An empty team id would make `leadingTeams.includes('')` the question, which
     is false for a lead and true for nobody — but an admin passes on
     permissions alone, so without this an admin could reach an applicants page
     for no team at all. */
  if (!teamId) return false;

  return isTeamLeaderOrAdmin(userInfo, teamId);
}
