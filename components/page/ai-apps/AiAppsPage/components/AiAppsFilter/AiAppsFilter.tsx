'use client';

import { useEffect, useRef } from 'react';

import { AI_APPS_CREATED_BY_PARAM, AI_APPS_SEARCH_PARAM } from '@/services/ai-apps/constants';

import { createFilterGetter } from '@/services/teams/utils/createFilterGetter';

import { useAiAppsAnalytics } from '@/analytics/ai-apps.analytics';
import { useAiAppsFilterStore } from '@/services/ai-apps/store';
import { useFilteredAiApps } from '@/services/ai-apps/hooks/useFilteredAiApps';

import { FilterSection } from '@/components/common/filters/FilterSection';
import { FiltersSidePanel } from '@/components/common/filters/FiltersSidePanel';
import { FilterSearchInput } from '@/components/common/filters/FilterSearchInput';
import { GenericCheckboxList } from '@/components/common/filters/GenericCheckboxList';

interface Props {
  /** Passed by the mobile bottom sheet so "Apply filters" can close it. */
  onClose?: () => void;
  source?: 'rail' | 'mobile';
}

export function AiAppsFilter(props: Props) {
  const { onClose, source = 'rail' } = props;

  const analytics = useAiAppsAnalytics();
  const { params, clearParams } = useAiAppsFilterStore();
  const { creators, visibleApps, filterCount } = useFilteredAiApps();

  const searchParam = params.get(AI_APPS_SEARCH_PARAM) ?? '';
  const lastTrackedSearch = useRef(searchParam);

  // The field debounces before writing the param, so the param is already the debounced signal.
  useEffect(() => {
    if (searchParam === lastTrackedSearch.current) return;
    lastTrackedSearch.current = searchParam;

    if (searchParam) {
      analytics.onSearchApplied({ queryLength: searchParam.length, resultCount: visibleApps.length, source });
    }
    // visibleApps changes as a *result* of the search; depending on it would double-count every query.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParam, analytics, source]);

  const getCreators = createFilterGetter(creators);

  // The creator box is a DebouncedInput (700ms), so this already arrives once
  // per settled query rather than once per keystroke — no debounce of our own.
  const handleCreatorSearch = (query: string) => {
    // Clearing the box flushes an immediate onChange(''); a reset is not a lookup,
    // and the app search above keeps the same silence.
    if (!query) return;

    analytics.onCreatorFilterSearched({ queryLength: query.length, source });
  };

  const handleClearParams = () => {
    analytics.onFiltersCleared({ source });
    clearParams();
  };

  // The rail has nothing to close, so the press is the whole signal there;
  // in the sheet it also commits. Fire before closing so the event survives unmount.
  const handleApplyFilters = () => {
    analytics.onFiltersApplied({ source, filterCount, resultCount: visibleApps.length });
    onClose?.();
  };

  return (
    <FiltersSidePanel onClose={handleApplyFilters} clearParams={handleClearParams} appliedFiltersCount={filterCount}>
      <FilterSection>
        <FilterSearchInput
          filterStore={useAiAppsFilterStore}
          paramKey={AI_APPS_SEARCH_PARAM}
          label="Search for an app"
          placeholder="E.g. Warm Intro Matcher"
          debounceMs={300}
        />
      </FilterSection>

      <FilterSection title="Created by">
        <GenericCheckboxList
          label="Search or select a creator"
          paramKey={AI_APPS_CREATED_BY_PARAM}
          placeholder="E.g. Nina Chen"
          filterStore={useAiAppsFilterStore}
          useGetDataHook={getCreators}
          defaultItemsToShow={5}
          onChange={(_key, values) =>
            analytics.onCreatorFilterSelected({ creatorCount: values.length, resultCount: visibleApps.length, source })
          }
          onSearch={handleCreatorSearch}
        />
      </FilterSection>
    </FiltersSidePanel>
  );
}
