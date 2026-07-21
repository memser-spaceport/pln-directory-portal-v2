import type { IJobRole } from '@/types/jobs.types';

export function getShareText(role: IJobRole, teamName: string): string {
  const seniority = role.seniority ? `${role.seniority.replace(/\s*\(.*\)\s*/, '').trim()} ` : '';
  return `Referring a great role — ${seniority}${role.roleTitle} at ${teamName}. Know someone perfect for it?`;
}
