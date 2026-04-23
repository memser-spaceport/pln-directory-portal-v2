import { useCallback } from 'react';
import { IFocusArea } from '@/types/shared.types';
import { FOCUS_AREAS_FILTER_KEYS, PAGE_ROUTES } from '@/utils/constants';
import { getAnalyticsUserInfo } from '@/utils/common.utils';
import { getUserInfo } from '@/utils/third-party.helper';
import { useTeamAnalytics } from '@/analytics/teams.analytics';
import { FilterSection } from '@/components/common/filters/FilterSection';
import { ConnectedFocusAreaFilter } from '@/components/core/FocusAreaFilter';

interface TeamsFocusAreaFilterProps {
  focusAreas: {
    rawData: IFocusArea[];
    selectedFocusAreas: IFocusArea[];
  };
  searchParams: any;
}

export function TeamsFocusAreaFilter({ focusAreas, searchParams }: TeamsFocusAreaFilterProps) {
  const analytics = useTeamAnalytics();

  const handleAnalytics = useCallback(
    (item: any) => {
      const user = getUserInfo();
      analytics.onFocusAreaFilterClicked({
        page: PAGE_ROUTES.TEAMS,
        name: 'Focus Area',
        value: item.label,
        user: getAnalyticsUserInfo(user),
        nameAndValue: `Focus Area - ${item.label}`,
      });
    },
    [analytics],
  );

  return (
    <FilterSection title="Focus Area">
      <ConnectedFocusAreaFilter
        focusAreas={focusAreas}
        countKey={FOCUS_AREAS_FILTER_KEYS.teams as 'teamAncestorFocusAreas' | 'projectAncestorFocusAreas'}
        searchParams={searchParams}
        onAnalytics={handleAnalytics}
      />
    </FilterSection>
  );
}
