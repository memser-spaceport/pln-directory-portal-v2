import { useCallback, useMemo } from 'react';
import { IFocusArea } from '@/types/shared.types';
import { FOCUS_AREAS_FILTER_KEYS, PAGE_ROUTES, URL_QUERY_VALUE_SEPARATOR } from '@/utils/constants';
import { getAnalyticsUserInfo } from '@/utils/common.utils';
import { useCurrentUserStore } from '@/services/auth/store';
import { useTeamAnalytics } from '@/analytics/teams.analytics';
import { useTeamFilterStore } from '@/services/teams';
import { FilterSection } from '@/components/common/filters/FilterSection';
import { FocusAreaFilter } from '@/components/core/FocusAreaFilter';
import { toTreeFilterItems, getCountForKey } from '@/components/core/FocusAreaFilter/adapters';
import type { FocusAreaTreeItem } from '@/components/core/FocusAreaFilter/adapters';
import { findAllParents, findChildren } from '@/components/core/FocusAreaFilter/utils';
import { sortFocusAreas } from '@/utils/sortFocusAreas';
import { ITeamsSearchParams } from '@/types/teams.types';

interface TeamsFocusAreaFilterProps {
  focusAreas: {
    rawData: IFocusArea[];
    selectedFocusAreas: IFocusArea[];
  };
  searchParams: ITeamsSearchParams;
}

export function TeamsFocusAreaFilter({ focusAreas }: TeamsFocusAreaFilterProps) {
  const analytics = useTeamAnalytics();
  const { setParam, params } = useTeamFilterStore();

  const selectedTitles = useMemo(() => {
    const raw = params.get('focusAreas') ?? '';
    return new Set(raw ? raw.split(URL_QUERY_VALUE_SEPARATOR) : []);
  }, [params]);

  const treeItems = useMemo(
    () => toTreeFilterItems(sortFocusAreas(focusAreas.rawData.filter((fa) => !fa.parentUid))),
    [focusAreas.rawData],
  );

  const selectedIds = useMemo(
    () => new Set<string>(focusAreas.rawData.filter((fa) => selectedTitles.has(fa.title)).map((fa) => fa.uid)),
    [focusAreas.rawData, selectedTitles],
  );

  const getCount = useMemo(
    () => getCountForKey(FOCUS_AREAS_FILTER_KEYS.teams as 'teamAncestorFocusAreas' | 'projectAncestorFocusAreas'),
    [],
  );

  const handleToggle = useCallback(
    (item: FocusAreaTreeItem) => {
      const hasItem = selectedTitles.has(item.label);
      let updatedTitles: string[];

      if (hasItem) {
        updatedTitles = [...selectedTitles].filter((t) => t !== item.label);
      } else {
        const parents = findAllParents(treeItems, item.id);
        const children = findChildren(item);
        const labelsToRemove = new Set([...parents, ...children].map((n) => n.label));
        const kept = [...selectedTitles].filter((t) => !labelsToRemove.has(t));

        const user = useCurrentUserStore.getState().currentUser;
        analytics.onFocusAreaFilterClicked({
          page: PAGE_ROUTES.TEAMS,
          name: 'Focus Area',
          value: item.label,
          user: getAnalyticsUserInfo(user),
          nameAndValue: `Focus Area - ${item.label}`,
        });

        updatedTitles = [...kept, item.label];
      }

      setParam('focusAreas', updatedTitles.join(URL_QUERY_VALUE_SEPARATOR) || undefined);
    },
    [selectedTitles, treeItems, analytics, setParam],
  );

  return (
    <FilterSection title="Focus Area">
      <FocusAreaFilter items={treeItems} selectedIds={selectedIds} onToggle={handleToggle} getCount={getCount} />
    </FilterSection>
  );
}
