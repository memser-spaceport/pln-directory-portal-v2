'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { useFilterStore } from '@/services/members/store';
import { useMemberAnalytics } from '@/analytics/members.analytics';

// Whitelist of parameters that should be tracked and synced
const TRACKED_PARAMS = ['topics', 'roles', 'hasOfficeHours', 'sort', 'search', 'showInvestors', 'investmentFocus'] as const;

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

export function SyncParamsToUrl() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { params } = useFilterStore();
  const { onMembersFiltersChange } = useMemberAnalytics();
  const isInitialLoad = useRef(true);

  useEffect(() => {
    onMembersFiltersChange(params);

    // Get current URL search params and filter to only tracked parameters
    const currentParams = filterTrackedParams(new URLSearchParams(searchParams.toString()));
    const newParams = filterTrackedParams(new URLSearchParams(params.toString()));

    // Compare if tracked params are actually different
    const areParamsDifferent = currentParams.toString() !== newParams.toString();

    // Only push to router if:
    // 1. Not the initial load, AND
    // 2. Tracked parameters are actually different
    if (!isInitialLoad.current && areParamsDifferent) {
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
    }

    // Mark that initial load is complete
    if (isInitialLoad.current) {
      isInitialLoad.current = false;
    }
  }, [params, router, searchParams]);

  return null;
}
