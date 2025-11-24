import { getIndustryTags } from '@/services/common.service';
import { getTeamFilterRouterWithOptionCounters } from '@/utils/team.utils';

export const GET = getTeamFilterRouterWithOptionCounters({
  serviceFn: getIndustryTags,
  entityType: 'Team',
  errorMessage: 'Failed to fetch industry tags',
});
