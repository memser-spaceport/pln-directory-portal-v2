import type { BaseFilterItem } from '@/services/teams/utils/createFilterGetter';

import type { AiApp } from '../ai-apps.service';

export function getCreatorOptions(apps: AiApp[]): BaseFilterItem[] {
  const counts = new Map<string, number>();
  const wauByName = new Map<string, number>();

  apps.forEach((app) => {
    const name = app.member?.name;
    if (!name) return;

    counts.set(name, (counts.get(name) ?? 0) + 1);
    wauByName.set(name, (wauByName.get(name) ?? 0) + (app.weeklyActiveUsers ?? 0));
  });

  return Array.from(counts.entries())
    .sort(([nameA], [nameB]) => {
      const wauDiff = (wauByName.get(nameB) ?? 0) - (wauByName.get(nameA) ?? 0);
      return wauDiff !== 0 ? wauDiff : nameA.localeCompare(nameB);
    })
    .map(([name, count]) => ({ value: name, disabled: false, count }));
}
