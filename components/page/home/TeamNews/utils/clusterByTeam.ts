import type { ITeamNewsItem, TeamCluster } from '@/types/team-news.types';

export function clusterByTeam(items: ITeamNewsItem[]): TeamCluster[] {
  const byTeam = new Map<string, ITeamNewsItem[]>();
  for (const item of items) {
    const existing = byTeam.get(item.teamUid);
    if (existing) existing.push(item);
    else byTeam.set(item.teamUid, [item]);
  }

  return Array.from(byTeam.values()).map((teamItems) => ({
    teamUid: teamItems[0].teamUid,
    teamName: teamItems[0].teamName,
    teamLogoUrl: teamItems[0].teamLogoUrl,
    items: teamItems,
  }));
}
