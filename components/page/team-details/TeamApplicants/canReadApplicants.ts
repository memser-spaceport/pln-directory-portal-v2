import { isTeamLeaderOrAdmin } from '@/components/page/team-details/utils/isTeamLeaderOrAdmin';
import { isProtocolLabsTeam } from '@/services/jobs/protocol-labs-team';
import type { IJobTeam } from '@/types/jobs.types';
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
 *
 * **Protocol Labs is excluded, and that is about the team rather than the
 * viewer.** PL hiring lives in PL's own ATS, so this page would be a second
 * inbox nobody empties — which is true of a PL lead and of a Directory admin
 * looking at PL alike. Last of the checks because it is the only one that reads
 * two fields.
 *
 * **The whole team, not its uid.** `isProtocolLabsTeam` matches the uid and
 * falls back to the name, because dev, UAT and production each seed their own
 * teams and a uid-only test quietly misclassifies PL anywhere the seed differs.
 * `team` is required rather than optional for the same reason the rule is
 * shared: an omitted team would be a caller silently let through, and nothing
 * at the call site would look wrong.
 */
export function canReadApplicants({
  flagOn,
  isLoggedIn,
  userInfo,
  team,
}: {
  flagOn: boolean;
  isLoggedIn: unknown;
  userInfo?: IUserInfo | null;
  /* Structural rather than `IJobTeam` itself: the two callers hold a team from
     different fetches, and both carry these two fields. */
  team: Pick<IJobTeam, 'uid' | 'name'> | null | undefined;
}): boolean {
  if (!flagOn) return false;
  if (!isLoggedIn) return false;
  /* An empty team uid would make `leadingTeams.includes('')` the question, which
     is false for a lead and true for nobody — but an admin passes on
     permissions alone, so without this an admin could reach an applicants page
     for no team at all. */
  if (!team?.uid) return false;
  if (isProtocolLabsTeam(team)) return false;

  return isTeamLeaderOrAdmin(userInfo, team.uid);
}
