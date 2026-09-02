'use client';

import { ReactNode } from 'react';

import { useAiAppsFilterStore } from '@/services/ai-apps/store';

import { FilterStoreUrlSync } from '@/components/common/filters/FilterStoreUrlSync';

/**
 * Binds the AI Apps filter store to the URL. Exists as a wrapper because a store
 * hook is a function, and functions cannot reach a Client Component as props from
 * the Server Component that mounts this.
 *
 * Keeps the 'router' strategy rather than teams' 'history', even though this list
 * is also filtered in the browser: `AiAppsPage` reads `?dialog=addAiApp` through
 * `useSearchParams`, which only stays accurate while writes go through the router.
 * Under 'history' that read would go stale and closing the create modal — which
 * rebuilds the query string to drop `dialog` — would drop the live filters with it.
 * The cost is one RSC round-trip per debounced filter change, which is what /jobs
 * already does.
 *
 * Tracked keys come from the store's own `trackedParams`.
 */
export function AiAppsFilterUrlSync({ children }: { children: ReactNode }) {
  return <FilterStoreUrlSync store={useAiAppsFilterStore}>{children}</FilterStoreUrlSync>;
}
