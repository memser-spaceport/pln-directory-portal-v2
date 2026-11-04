import type { IJobRole, IJobTeamGroup } from '@/types/jobs.types';
import type { IHomeRole } from '@/types/home.types';

/** Roles beside events; with no events the roles take the room. */
export const ROLES_BESIDE_EVENTS = 3;
export const ROLES_WITHOUT_EVENTS = 5;

/** The most the rail can show, fetched once and sliced by the rail. */
export const HOME_ROLES_MAX = ROLES_WITHOUT_EVENTS;

const postedAt = (role: IJobRole) => Date.parse(role.postedDate ?? role.detectionDate ?? role.lastUpdated) || 0;

/**
 * The newest roles from the job board's team groups, as rail rows.
 *
 * Newest first by posting date (detection, then last update, when a posting has no date). One role per team comes
 * first, then the rest, the way the prototype's rows span teams: a team that posts twenty roles in a day doesn't fill
 * the rail.
 */
export function flattenNewestRoles(groups: IJobTeamGroup[], n: number): IHomeRole[] {
  const rows = groups
    .flatMap((group) => group.roles.map((role) => ({ group, role, at: postedAt(role) })))
    .sort((a, b) => b.at - a.at);

  const seen = new Set<string>();
  const first: typeof rows = [];
  const rest: typeof rows = [];
  for (const row of rows) {
    if (seen.has(row.group.team.uid)) {
      rest.push(row);
    } else {
      seen.add(row.group.team.uid);
      first.push(row);
    }
  }

  return [...first, ...rest].slice(0, n).map(({ group, role }) => ({
    uid: role.uid,
    title: role.roleTitle,
    location: (role.location ?? []).filter(Boolean).join(', '),
    applyUrl: role.applyUrl,
    teamUid: group.team.uid,
    teamName: group.team.name,
    teamLogoUrl: group.team.logoUrl,
  }));
}
