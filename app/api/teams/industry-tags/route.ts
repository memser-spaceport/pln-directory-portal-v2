import { getIndustryTags } from '@/services/common.service';
import { getTeamFilterRouterWithOptionCounters } from '@/utils/team.utils';

export const dynamic = 'force-dynamic';

export const GET = getTeamFilterRouterWithOptionCounters({
  serviceFn: getIndustryTags,
  entityType: 'Team',
  errorMessage: 'Failed to fetch industry tags',
});
