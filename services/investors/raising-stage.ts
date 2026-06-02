import type { PlPortfolioTeam, StageFocus } from './types';

export function effectiveTeamRaisingStage(team: PlPortfolioTeam | undefined): StageFocus | undefined {
  if (!team) {
    return undefined;
  }

  if (team.raising_now === 'yes' && team.raising_stage) {
    return team.raising_stage;
  }

  return undefined;
}
