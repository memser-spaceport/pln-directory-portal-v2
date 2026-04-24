import { useCallback } from 'react';
import { IFocusArea } from '@/types/shared.types';
import { FOCUS_AREAS_FILTER_KEYS } from '@/utils/constants';
import { getAnalyticsUserInfo } from '@/utils/common.utils';
import { getUserInfo } from '@/utils/third-party.helper';
import { useProjectAnalytics } from '@/analytics/project.analytics';
import { ConnectedFocusAreaFilter } from '@/components/core/FocusAreaFilter';

interface ProjectFocusAreaFilterProps {
  focusAreas: {
    rawData: IFocusArea[];
    selectedFocusAreas: IFocusArea[];
  };
  searchParams: any;
}

export function ProjectFocusAreaFilter({ focusAreas, searchParams }: ProjectFocusAreaFilterProps) {
  const analytics = useProjectAnalytics();

  const handleAnalytics = useCallback(
    (item: any) => {
      const user = getUserInfo();
      analytics.onProjectFilterApplied(getAnalyticsUserInfo(user), {
        focusArea: item.label,
      });
    },
    [analytics],
  );

  return (
    <ConnectedFocusAreaFilter
      focusAreas={focusAreas}
      countKey={FOCUS_AREAS_FILTER_KEYS.projects as 'teamAncestorFocusAreas' | 'projectAncestorFocusAreas'}
      searchParams={searchParams}
      onAnalytics={handleAnalytics}
    />
  );
}
