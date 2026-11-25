import { createFilterStore } from '@/services/filters';

import { FILTER_PARAMS, WHEN_PARAM, YEAR_PARAM } from './all-events.filters';

/**
 * The All Events page's state in the address (LAB-3247, design D4): the filters (`FILTER_PARAMS`), the view (`view`,
 * `cal`), Live & upcoming or Past and its year (`when`, `year`, LAB-3418) and the open event (`event`). One store, so a
 * copied link reopens the same view, filters and drawer, and a view switch keeps the filters. `FilterStoreUrlSync`
 * writes it with `history.pushState`: the list is filtered in the browser, so the server never needs to see a change.
 */
export const ALL_EVENTS_URL_PARAMS = [...FILTER_PARAMS, 'view', 'cal', WHEN_PARAM, YEAR_PARAM, 'event'] as const;

export const useAllEventsFilterStore = createFilterStore({
  namespace: 'all-events',
  trackedParams: ALL_EVENTS_URL_PARAMS,
  // The store's own debounce is one timer for every key, so a view switch or an opened event within 300ms would
  // swallow a filter change. The page settles each filter key on its own instead (AllEventsPage).
  analyticsDebounceMs: 0,
});
