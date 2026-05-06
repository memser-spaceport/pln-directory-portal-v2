'use client';

import { useEffect, useRef } from 'react';
import { useTeamFilterStore, setFilterAnalyticsCallback } from '@/services/teams';
import { useTeamAnalytics } from '@/analytics/teams.analytics';
import { useDebounce } from 'react-use';

/**
 * SyncTeamsParamsToUrl
 *
 * Syncs Teams filter store state to URL with debouncing
 */
export function SyncTeamsParamsToUrl({ debounceTime = 0 }: { debounceTime?: number }) {
  const { params, _clearImmediate } = useTeamFilterStore();
  const { onTeamsFiltersChange } = useTeamAnalytics();
  const isInitialLoad = useRef(true);
  const lastSyncedParams = useRef<string>('');

  // Set analytics callback once on mount
  useEffect(() => {
    setFilterAnalyticsCallback(onTeamsFiltersChange);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Skip initial load to avoid pushing the current URL back to history
  useEffect(() => {
    if (isInitialLoad.current) {
      isInitialLoad.current = false;
      lastSyncedParams.current = params.toString();
      return;
    }
  }, []);

  // Debounced sync to URL
  useDebounce(
    () => {
      if (isInitialLoad.current) return;

      const currentParamsString = params.toString();

      if (currentParamsString === lastSyncedParams.current) {
        return;
      }

      lastSyncedParams.current = currentParamsString;

      const newUrl = currentParamsString
        ? `${window.location.pathname}?${currentParamsString}`
        : window.location.pathname;

      window.history.pushState(null, '', newUrl);
    },
    _clearImmediate ? 0 : debounceTime,
    [params, _clearImmediate],
  );

  return null;
}
