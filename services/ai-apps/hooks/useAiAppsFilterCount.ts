import { useFilterCount } from '@/services/filters';

import { AI_APPS_FILTER_PARAMS } from '../constants';

import { useAiAppsFilterStore } from '../store';

const shouldCountAiAppsFilter = (key: string, value: string) =>
  (AI_APPS_FILTER_PARAMS as readonly string[]).includes(key) && value.trim() !== '';

export function useAiAppsFilterCount() {
  return useFilterCount(useAiAppsFilterStore, { shouldCount: shouldCountAiAppsFilter });
}
