import type { IJobRole, IJobTeam } from '@/types/jobs.types';

/**
 * Page titles for the job board and its role pages (LAB-2889): they name the search people make, "Protocol
 * Labs jobs". One module so the board's metadata, its `?job=` link preview and the role page can't drift.
 * Wording proposed on LAB-2876 (Q3); the location stays in role titles because people search by place too.
 */
export const JOBS_BOARD_TITLE = 'Protocol Labs Jobs | LabOS';

export function jobRoleSeoTitle(role: Pick<IJobRole, 'roleTitle' | 'location'>, team: Pick<IJobTeam, 'name'>): string {
  const location = role.location.length ? ` (${role.location.join(', ')})` : '';
  return `${role.roleTitle} at ${team.name}${location} | Protocol Labs Jobs`;
}
