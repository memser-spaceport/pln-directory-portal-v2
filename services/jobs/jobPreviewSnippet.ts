import type { IJobRole, IJobTeam } from '@/types/jobs.types';

import { workplaceTypeDisplayLabel } from '@/utils/jobs.utils';

export function getJobPreviewSnippet(role: IJobRole, team: IJobTeam): string {
  const facts: string[] = [];

  if (role.roleCategory) {
    facts.push(role.roleCategory);
  }

  if (role.workMode) {
    facts.push(workplaceTypeDisplayLabel(role.workMode));
  }

  if (role.location.length) {
    facts.push(role.location.join(', '));
  }

  return [...facts, `${team.name} is hiring.`].join(' · ');
}
