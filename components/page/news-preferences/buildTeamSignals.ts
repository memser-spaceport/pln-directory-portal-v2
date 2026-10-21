/**
 * What actually shapes a member's news suggestions (LAB-2939): each team they
 * belong to, with the focus areas, industry tags and communities that For You
 * and the digest match other teams on. Skills are not used for news.
 */
export interface NewsTeamSignal {
  teamUid: string;
  teamName: string;
  focusAreas: string[];
  industryTags: string[];
  communities: string[];
}

const titles = (list: unknown, pick: (entry: any) => unknown): string[] => {
  if (!Array.isArray(list)) return [];
  const values = list.map(pick).filter((v): v is string => typeof v === 'string' && v.trim().length > 0);
  return [...new Set(values)];
};

/** From `getTeam(...).data.formatedData` objects; skips anything that failed to load. */
export function buildTeamSignals(teams: Array<any | null | undefined>): NewsTeamSignal[] {
  return teams
    .filter((team): team is any => Boolean(team?.id && team?.name))
    .map((team) => ({
      teamUid: team.id,
      teamName: team.name,
      focusAreas: titles(team.teamFocusAreas, (fa) => fa?.focusArea?.title ?? fa?.title),
      industryTags: titles(team.industryTags, (tag) => tag?.title),
      communities: titles(team.communityAffiliations, (c) => c?.title),
    }));
}

/** Member teams, main team first, at most `limit` (the page fetches each one). */
export function pickSignalTeamUids(
  teamMemberRoles: Array<{ teamUid?: string; mainTeam?: boolean }> | undefined,
  limit = 5,
): string[] {
  const roles = [...(teamMemberRoles ?? [])].filter((r) => r?.teamUid);
  roles.sort((a, b) => Number(Boolean(b.mainTeam)) - Number(Boolean(a.mainTeam)));
  return [...new Set(roles.map((r) => r.teamUid as string))].slice(0, limit);
}
