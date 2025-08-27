'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { useFilterStore } from '@/services/members/store';
import { useMemberAnalytics } from '@/analytics/members.analytics';

export function SyncParamsToUrl() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { params } = useFilterStore();
  const { onMembersFiltersChange } = useMemberAnalytics();
  const isInitialLoad = useRef(true);

  useEffect(() => {
    onMembersFiltersChange(params);

    // Get current URL search params
    const currentParams = new URLSearchParams(searchParams.toString());
    const newParams = new URLSearchParams(params.toString());

    // Compare if params are actually different
    const areParamsDifferent = currentParams.toString() !== newParams.toString();

    // Only push to router if:
    // 1. Not the initial load, AND
    // 2. Parameters are actually different
    if (!isInitialLoad.current && areParamsDifferent) {
      router.push(`?${params.toString()}`, { scroll: false });
    }

    // Mark that initial load is complete
    if (isInitialLoad.current) {
      isInitialLoad.current = false;
    }
  }, [params, router, searchParams]);

  return null;
}
