import { TeamStatus } from '@/types/teams.types';

export function isTeamInactive(team: { status?: TeamStatus | null } | null | undefined): boolean {
  return team?.status === 'INACTIVE';
}
