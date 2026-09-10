'use client';

import { useMemo } from 'react';

import { filterAndSortAiApps } from '../utils/filterAndSortAiApps';
import { getCreatorOptions } from '../utils/getCreatorOptions';
import { getTagOptions } from '../utils/getTagOptions';

import { useAiApps } from './useAiApps';
import { useAiAppsFilterCount } from './useAiAppsFilterCount';

import { useAiAppsFilterStore } from '../store';

export function useFilteredAiApps() {
  const { apps, isLoading, isError } = useAiApps();
  const { params } = useAiAppsFilterStore();
  const filterCount = useAiAppsFilterCount();

  const creators = useMemo(() => getCreatorOptions(apps), [apps]);
  const tagOptions = useMemo(() => getTagOptions(apps), [apps]);
  const visibleApps = useMemo(() => filterAndSortAiApps(apps, params), [apps, params]);

  return {
    /** Unfiltered, for lookups that must survive the filters changing underneath them. */
    apps,
    visibleApps,
    creators,
    /** Only tags in use, with app counts — the filter never offers an empty facet. */
    tagOptions,
    filterCount,
    isLoading,
    isError,
  };
}
