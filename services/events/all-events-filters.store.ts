import { createFilterStore } from '@/services/filters';

/**
 * The All Events page's state in the address (LAB-3247, design D4): the filters (`search`, `going`, `mode`, `city`),
 * the view (`view`, `cal`) and the open event (`event`). One store, so a copied link reopens the same view, filters
 * and drawer, and a view switch keeps the filters. `FilterStoreUrlSync` writes it with `history.pushState`: the list
 * is filtered in the browser, so the server never needs to see a change.
 */
export const ALL_EVENTS_URL_PARAMS = ['search', 'going', 'mode', 'city', 'view', 'cal', 'event'] as const;

export const useAllEventsFilterStore = createFilterStore({
  namespace: 'all-events',
  trackedParams: ALL_EVENTS_URL_PARAMS,
});
