export const PL_PORTFOLIO_AFFILIATION = 'PL Portfolio';

export type PortfolioTeamRole = {
  memberUid?: string | null;
  endDate?: string | null;
  member?: { uid?: string | null } | null;
};

export type PortfolioTeam = {
  teamMemberRoles?: PortfolioTeamRole[] | null;
};

export function isCurrentTeamRole(endDate: string | null | undefined, now: Date): boolean {
  if (endDate == null || endDate === '') return true;
  const ended = new Date(endDate);
  if (Number.isNaN(ended.getTime())) return false;
  return ended.getTime() >= now.getTime();
}

function roleMemberUid(role: PortfolioTeamRole): string | null {
  return role.memberUid || role.member?.uid || null;
}

/** A current role on a team that already matched the PL Portfolio affiliation. */
export function hasCurrentPortfolioRole(teams: unknown, memberUid: string, now = new Date()): boolean {
  if (!Array.isArray(teams) || !memberUid) return false;
  return teams.some((team: PortfolioTeam) =>
    (team?.teamMemberRoles ?? []).some(
      (role) => roleMemberUid(role) === memberUid && isCurrentTeamRole(role?.endDate, now),
    ),
  );
}
