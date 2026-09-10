'use client';

import { ReactNode, useEffect } from 'react';

import { OFFICE_HOURS_FILTER_PARAM_KEY, TOPICS_FILTER_PARAM_KEY } from '@/app/constants/filters';

import { useMemberAnalytics } from '@/analytics/members.analytics';
import { setFilterAnalyticsCallback } from '@/services/members/store';
import { useFilterStore } from '@/services/members/store';

import { FilterStoreUrlSync } from '@/components/common/filters/FilterStoreUrlSync';

/**
 * The set members actually syncs, which is NOT the store's declared
 * `trackedParams`: five of these (`stage`, `industry`, `activity`, `program`,
 * `investorType`) are missing from that list, and members filters server-side off
 * `searchParams`, so defaulting to the store would silently switch those filters
 * off. Kept explicit and unchanged from the component this replaces.
 */
const MEMBERS_TRACKED_PARAMS = [
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
  'program',
  'investorType',
  'isPortCoFounder',
] as const;

interface Props {
  children: ReactNode;
  debounceTime?: number;
}

export function MembersFilterUrlSync({ children, debounceTime = 700 }: Props) {
  const { onMembersFiltersChange } = useMemberAnalytics();

  useEffect(() => {
    setFilterAnalyticsCallback(onMembersFiltersChange);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <FilterStoreUrlSync
      store={useFilterStore}
      trackedParams={MEMBERS_TRACKED_PARAMS}
      debounceTime={debounceTime}
      refreshOnClear
    >
      {children}
    </FilterStoreUrlSync>
  );
}
