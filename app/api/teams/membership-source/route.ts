import { getMembershipSource } from '@/services/common.service';
import { getTeamFilterRouterWithOptionCounters } from '@/utils/team.utils';

export const dynamic = 'force-dynamic';

export const GET = getTeamFilterRouterWithOptionCounters({
  serviceFn: getMembershipSource,
  entityType: 'Team',
  errorMessage: 'Failed to fetch membership source',
});
