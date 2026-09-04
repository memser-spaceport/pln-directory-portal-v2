import type { BaseFilterItem } from '@/services/teams/utils/createFilterGetter';

import type { AiApp } from '../ai-apps.service';

export function getCreatorOptions(apps: AiApp[]): BaseFilterItem[] {
  const counts = new Map<string, number>();

  apps.forEach((app) => {
    const name = app.member?.name;
    if (!name) return;

    counts.set(name, (counts.get(name) ?? 0) + 1);
  });

  return Array.from(counts.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([name, count]) => ({ value: name, disabled: false, count }));
}
