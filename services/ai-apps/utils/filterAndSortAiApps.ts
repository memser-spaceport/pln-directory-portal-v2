import { decodeFilterValues } from '@/services/filters/decodeFilterValues';

import type { AiAppsSortValue } from '../constants';
import type { AiApp } from '../ai-apps.service';

import { AI_APPS_CREATED_BY_PARAM, AI_APPS_SEARCH_PARAM, AI_APPS_SORT } from '../constants';

import { getAiAppsSort } from './getAiAppsSort';

function matchesSearch(app: AiApp, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;

  return [app.name, app.description, app.member?.name].some((field) => !!field && field.toLowerCase().includes(q));
}

function timestamp(value: string | null | undefined): number {
  if (!value) return 0;

  const parsed = new Date(value).getTime();
  return Number.isNaN(parsed) ? 0 : parsed;
}

function compareAiApps(sort: AiAppsSortValue) {
  switch (sort) {
    case AI_APPS_SORT.NAME:
      return (a: AiApp, b: AiApp) => a.name.localeCompare(b.name);
    case AI_APPS_SORT.CREATED:
      return (a: AiApp, b: AiApp) => timestamp(b.createdAt) - timestamp(a.createdAt);
    case AI_APPS_SORT.VIEWS:
      return (a: AiApp, b: AiApp) => (b.viewCount ?? 0) - (a.viewCount ?? 0);
    default:
      return (a: AiApp, b: AiApp) => timestamp(b.updatedAt) - timestamp(a.updatedAt);
  }
}

export function filterAndSortAiApps(apps: AiApp[], params: URLSearchParams): AiApp[] {
  const query = params.get(AI_APPS_SEARCH_PARAM) ?? '';
  const creators = decodeFilterValues(params.get(AI_APPS_CREATED_BY_PARAM));

  const rows = apps.filter((app) => {
    if (creators.length && !creators.includes(app.member?.name)) {
      return false;
    }

    return matchesSearch(app, query);
  });

  // Never sorts the array React Query owns. Array#sort is stable, so ties keep API order.
  return rows.sort(compareAiApps(getAiAppsSort(params)));
}
