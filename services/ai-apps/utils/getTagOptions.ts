import type { BaseFilterItem } from '@/services/teams/utils/createFilterGetter';

import type { AiApp } from '../ai-apps.service';

export function getTagOptions(apps: AiApp[]): BaseFilterItem[] {
  const counts = new Map<string, number>();

  apps.forEach((app) => {
    (app.tags ?? []).forEach((tag) => counts.set(tag, (counts.get(tag) ?? 0) + 1));
  });

  return Array.from(counts.entries())
    .sort(([tagA, countA], [tagB, countB]) => countB - countA || tagA.localeCompare(tagB))
    .map(([tag, count]) => ({ value: tag, disabled: false, count }));
}
