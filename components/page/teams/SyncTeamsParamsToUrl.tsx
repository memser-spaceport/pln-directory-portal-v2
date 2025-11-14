'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { useTeamFilterStore } from '@/services/teams';
import { useDebounce } from 'react-use';

/**
 * SyncTeamsParamsToUrl
 *
 * Syncs Teams filter store state to URL with debouncing
 */
export function SyncTeamsParamsToUrl({ debounceTime = 700 }: { debounceTime?: number }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { params, _clearImmediate } = useTeamFilterStore();
  const isInitialLoad = useRef(true);
  const lastSyncedParams = useRef<string>('');

  // Skip initial load to avoid unnecessary navigation
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

      // Only sync if params actually changed
      if (currentParamsString === lastSyncedParams.current) {
        return;
      }

      lastSyncedParams.current = currentParamsString;

      // Build URL with updated params
      const newUrl = currentParamsString ? `?${currentParamsString}` : window.location.pathname;

      router.push(newUrl, { scroll: false });
    },
    _clearImmediate ? 0 : debounceTime,
    [params, _clearImmediate]
  );

  return null;
}
