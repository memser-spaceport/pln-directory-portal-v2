import type { AiAppsSortValue } from '../constants';

import { AI_APPS_DEFAULT_SORT, AI_APPS_SORT_OPTIONS, AI_APPS_SORT_PARAM } from '../constants';

export function getAiAppsSort(params: URLSearchParams): AiAppsSortValue {
  const raw = params.get(AI_APPS_SORT_PARAM);
  const isKnown = AI_APPS_SORT_OPTIONS.some((option) => option.value === raw);

  return isKnown ? (raw as AiAppsSortValue) : AI_APPS_DEFAULT_SORT;
}
