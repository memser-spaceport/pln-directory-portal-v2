import type { QueryClient } from '@tanstack/react-query';
import { TeamPitchQueryKeys } from '@/services/team-pitch/constants';

export function invalidateTeamPitchQueries(queryClient: QueryClient, pitchSlug: string) {
  queryClient.invalidateQueries({ queryKey: [TeamPitchQueryKeys.PITCH, pitchSlug] });
}
