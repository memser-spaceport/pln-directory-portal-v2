import { IMember } from '@/types/members.types';
import { ITeam } from '@/types/teams.types';

/**
 * Determines if we should show the investor tag based on investor profile type and conditions
 */
export const shouldShowInvestorTag = (member: IMember): boolean => {
  const investorProfile = member?.investorProfile;
  const teams = member?.teams;

  if (!investorProfile?.type) {
    return false; // No investor profile type
  }

  // Helper function to find preferred team (fund team, main team, or first team)
  const findPreferredTeam = (teams: ITeam[] | undefined): ITeam | undefined => {
    if (!teams || teams.length === 0) return undefined;

    // First priority: Find fund team
    const fundTeam = teams.find((team) => team.isFund);
    if (fundTeam) return fundTeam;

    // Second priority: Find main team
    const mainTeam = teams.find((team) => team.mainTeam);
    if (mainTeam) return mainTeam;

    // Fallback: Return first team
    return teams[0];
  };

  const preferredTeam = findPreferredTeam(teams);

  switch (investorProfile.type) {
    case 'ANGEL':
      // ANGEL type: show tag if secRulesAccepted
      return !!investorProfile.secRulesAccepted;

    case 'FUND':
      // FUND type: show tag if has a team
      return !!preferredTeam;

    case 'ANGEL_AND_FUND':
      // ANGEL_AND_FUND: show tag if has a team OR secRulesAccepted
      return !!preferredTeam || !!investorProfile.secRulesAccepted;

    default:
      return false; // Unknown type
  }
};
