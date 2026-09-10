'use client';

import { useMemo } from 'react';

import { filterAndSortAiApps } from '../utils/filterAndSortAiApps';
import { getCreatorOptions } from '../utils/getCreatorOptions';

import { useAiApps } from './useAiApps';
import { useAiAppsFilterCount } from './useAiAppsFilterCount';

import { useAiAppsFilterStore } from '../store';

export function useFilteredAiApps() {
  const { apps, isLoading, isError } = useAiApps();
  const { params } = useAiAppsFilterStore();
  const filterCount = useAiAppsFilterCount();

  const creators = useMemo(() => getCreatorOptions(apps), [apps]);
  const visibleApps = useMemo(() => filterAndSortAiApps(apps, params), [apps, params]);

  return {
    /** Unfiltered, for lookups that must survive the filters changing underneath them. */
    apps,
    visibleApps,
    creators,
    filterCount,
    isLoading,
    isError,
  };
}
