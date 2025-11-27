import { getFundingStages } from '@/services/common.service';
import { getTeamFilterRouterWithOptionCounters } from '@/utils/team.utils';

export const GET = getTeamFilterRouterWithOptionCounters({
  serviceFn: getFundingStages,
  entityType: 'Team',
  errorMessage: 'Failed to fetch funding stages',
});
