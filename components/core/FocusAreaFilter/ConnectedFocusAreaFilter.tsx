import { useCallback, useMemo } from 'react';
import { IFocusArea } from '@/types/shared.types';
import { sortFocusAreas } from '@/utils/sortFocusAreas';

import { FocusAreaFilter } from './FocusAreaFilter';
import { toTreeFilterItems, getCountForKey, useFocusAreaToggle } from './adapters';
import type { FocusAreaTreeItem } from './adapters';

interface ConnectedFocusAreaFilterProps {
  focusAreas: {
    rawData: IFocusArea[];
    selectedFocusAreas: IFocusArea[];
  };
  countKey: 'teamAncestorFocusAreas' | 'projectAncestorFocusAreas';
  searchParams: any;
  onAnalytics?: (item: FocusAreaTreeItem) => void;
}

export function ConnectedFocusAreaFilter(props: ConnectedFocusAreaFilterProps) {
  const { focusAreas, countKey, searchParams, onAnalytics } = props;

  const treeItems = useMemo(
    () => toTreeFilterItems(sortFocusAreas(focusAreas.rawData.filter((fa) => !fa.parentUid))),
    [focusAreas.rawData],
  );

  const selectedIds = useMemo(
    () => new Set<string>(focusAreas.selectedFocusAreas.map((fa) => fa.uid)),
    [focusAreas.selectedFocusAreas],
  );

  const getCount = useMemo(() => getCountForKey(countKey), [countKey]);

  const handleToggle = useFocusAreaToggle({
    rootItems: treeItems,
    selectedItems: focusAreas.selectedFocusAreas,
    searchParams,
    onAnalytics,
  });

  return <FocusAreaFilter items={treeItems} selectedIds={selectedIds} onToggle={handleToggle} getCount={getCount} />;
}
