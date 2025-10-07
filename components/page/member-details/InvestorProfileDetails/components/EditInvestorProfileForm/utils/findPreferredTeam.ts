import { ITeam } from '@/types/teams.types';

export const findPreferredTeam = (teams: ITeam[] | undefined): ITeam | undefined => {
  if (!teams || teams.length === 0) return undefined;

  // First priority: Find fund team
  const fundTeam = teams.find((team) => team.investmentTeam);
  if (fundTeam) return fundTeam;

  // Second priority: Find main team
  const mainTeam = teams.find((team) => team.mainTeam);
  if (mainTeam) return mainTeam;

  // Fallback: Return first team
  return teams[0];
};
