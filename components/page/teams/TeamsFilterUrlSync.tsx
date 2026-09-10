'use client';

import { ReactNode, useEffect } from 'react';

import { useTeamAnalytics } from '@/analytics/teams.analytics';
import { setFilterAnalyticsCallback, useTeamFilterStore } from '@/services/teams';

import { FilterStoreUrlSync } from '@/components/common/filters/FilterStoreUrlSync';

/**
 * Teams filters in the browser — its Server Component never reads `searchParams` —
 * so the URL is a bookmark and writing it must not trigger an RSC round-trip.
 * Hence the 'history' strategy, which is what this page has always done.
 */
export function TeamsFilterUrlSync({ children }: { children: ReactNode }) {
  const { onTeamsFiltersChange } = useTeamAnalytics();

  useEffect(() => {
    setFilterAnalyticsCallback(onTeamsFiltersChange);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <FilterStoreUrlSync store={useTeamFilterStore} strategy="history">
      {children}
    </FilterStoreUrlSync>
  );
}
