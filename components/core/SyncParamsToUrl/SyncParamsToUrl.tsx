'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useRef, useCallback } from 'react';
import { useFilterStore, setFilterAnalyticsCallback } from '@/services/members/store';
import { useMemberAnalytics } from '@/analytics/members.analytics';
import { useDebounce } from 'react-use';
import { OFFICE_HOURS_FILTER_PARAM_KEY, TOPICS_FILTER_PARAM_KEY } from '@/app/constants/filters';

// Whitelist of parameters that should be tracked and synced
const TRACKED_PARAMS = [
  TOPICS_FILTER_PARAM_KEY,
  'roles',
  OFFICE_HOURS_FILTER_PARAM_KEY,
  'sort',
  'search',
  'isInvestor',
  'investmentFocus',
  'minTypicalCheckSize',
  'maxTypicalCheckSize',
  'stage',
  'industry',
  'activity',
  'investorType',
] as const;

// Helper function to filter URLSearchParams to only include tracked parameters
const filterTrackedParams = (params: URLSearchParams): URLSearchParams => {
  const filtered = new URLSearchParams();

  TRACKED_PARAMS.forEach((param) => {
    const value = params.get(param);
    if (value !== null) {
      filtered.set(param, value);
    }
  });

  return filtered;
};

export function SyncParamsToUrl({ debounceTime = 700 }: { debounceTime?: number }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { params, _clearImmediate } = useFilterStore();
  const { onMembersFiltersChange } = useMemberAnalytics();
  const isInitialLoad = useRef(true);
  const lastSyncedParams = useRef<string>('');
  const lastAnalyticsParams = useRef<string>('');

  // Set analytics callback once on mount
  useEffect(() => {
    setFilterAnalyticsCallback(onMembersFiltersChange);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  // Function to update URL
  const updateUrl = useCallback(
    (allowDuringInitialLoad = false, forceClear = false) => {
      // Get current URL search params and filter to only tracked parameters
      const currentParams = filterTrackedParams(new URLSearchParams(searchParams.toString()));
      const newParams = filterTrackedParams(new URLSearchParams(params.toString()));

      // Compare if tracked params are actually different
      const areParamsDifferent = currentParams.toString() !== newParams.toString();
      const newParamsString = newParams.toString();

      // Only push to router if:
      // 1. (Not the initial load OR allowDuringInitialLoad), AND
      // 2. Tracked parameters are actually different, AND
      // 3. (We haven't already synced these exact params OR this is a forced clear)
      if (
        (!isInitialLoad.current || allowDuringInitialLoad) &&
        areParamsDifferent &&
        (lastSyncedParams.current !== newParamsString || forceClear)
      ) {
        // Start with current URL params to preserve non-tracked parameters
        const finalParams = new URLSearchParams(searchParams.toString());

        // Update only the tracked parameters
        TRACKED_PARAMS.forEach((param) => {
          const newValue = params.get(param);
          if (newValue !== null) {
            finalParams.set(param, newValue);
          } else {
            finalParams.delete(param);
          }
        });

        router.push(`?${finalParams.toString()}`, { scroll: false });
        lastSyncedParams.current = newParamsString;

        if (forceClear) {
          router.refresh();
        }
      }
    },
    [params, router, searchParams],
  );

  // Handle immediate clear operations
  useEffect(() => {
    if (_clearImmediate) {
      updateUrl(true, true); // Update immediately without debounce, allow during initial load, force clear
    }
  }, [_clearImmediate, updateUrl]);

  // Debounce the URL update with 300ms delay for regular changes
  useDebounce(
    () => {
      if (!_clearImmediate) {
        updateUrl();
      }
    },
    debounceTime,
    [params],
  );

  // Mark initial load as complete after first render
  useEffect(() => {
    if (isInitialLoad.current) {
      isInitialLoad.current = false;
      lastAnalyticsParams.current = filterTrackedParams(params).toString();
    }
  }, []);

  return null;
}
