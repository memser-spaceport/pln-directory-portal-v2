'use client';

import { AI_APPS_SORT_OPTIONS, AI_APPS_SORT_PARAM } from '@/services/ai-apps/constants';

import { getAiAppsSort } from '@/services/ai-apps/utils/getAiAppsSort';

import { useAiAppsAnalytics } from '@/analytics/ai-apps.analytics';
import { useAiAppsFilterStore } from '@/services/ai-apps/store';
import { useFilteredAiApps } from '@/services/ai-apps/hooks/useFilteredAiApps';

import { MobileFilterWrapper } from '@/components/common/filters/MobileFilterWrapper';

import { AiAppsFilter } from '../AiAppsFilter';

/** Carries sort as well as filters, because the masthead's copy is hidden at these widths. */
export function AiAppsMobileFilters() {
  const analytics = useAiAppsAnalytics();
  const { params, setParam, clearParams } = useAiAppsFilterStore();
  const { visibleApps, filterCount } = useFilteredAiApps();

  const handleSortChange = (value: string) => {
    analytics.onSortChanged({ sort: value, source: 'mobile', resultCount: visibleApps.length });
    setParam(AI_APPS_SORT_PARAM, value);
  };

  const handleClearFilters = () => {
    analytics.onFiltersCleared({ source: 'mobile' });
    clearParams();
  };

  // The wrapper routes only X and swipe-down here — "Apply filters" closes via
  // the render prop instead, so a dismiss can never land as an apply.
  const handleFilterClose = () => {
    analytics.onFiltersPanelDismissed({ filterCount });
  };

  return (
    <MobileFilterWrapper
      filterCount={filterCount}
      currentSort={getAiAppsSort(params)}
      sortOptions={AI_APPS_SORT_OPTIONS}
      sortByLabel="Sort by:"
      onSortChange={handleSortChange}
      onClearFilters={handleClearFilters}
      onFilterClose={handleFilterClose}
      renderFilter={(onClose) => <AiAppsFilter onClose={onClose} source="mobile" />}
    />
  );
}
