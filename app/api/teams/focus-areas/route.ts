import { getFocusAreas } from '@/services/common.service';
import { getTeamFilterRouterWithOptionCounters, parseFocusAreasParams } from '@/utils/team.utils';

export const GET = getTeamFilterRouterWithOptionCounters({
  serviceFn: getFocusAreas,
  entityType: 'Team',
  errorMessage: 'Failed to fetch focus areas',
  parseParams: parseFocusAreasParams,
});
