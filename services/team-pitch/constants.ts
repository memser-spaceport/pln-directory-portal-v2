export enum TeamPitchQueryKeys {
  ACCESS = 'team-pitch-access',
  PITCH = 'team-pitch',
}

export const TEAM_SPOTLIGHT_BASE_PATH = '/spotlight';

export function getTeamSpotlightPath(slug: string) {
  return `${TEAM_SPOTLIGHT_BASE_PATH}/${slug}`;
}
