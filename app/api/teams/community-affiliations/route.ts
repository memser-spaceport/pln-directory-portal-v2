import { getCommunityAffiliations } from '@/services/common.service';
import { getTeamFilterRouterWithOptionCounters } from '@/utils/team.utils';

export const dynamic = 'force-dynamic';

export const GET = getTeamFilterRouterWithOptionCounters({
  serviceFn: getCommunityAffiliations,
  entityType: 'Team',
  errorMessage: 'Failed to fetch community affiliations',
});
