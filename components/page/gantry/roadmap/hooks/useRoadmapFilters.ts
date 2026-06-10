import { useMemo, useState } from 'react';
import type { useGantryAnalytics } from '@/analytics/gantry.analytics';
import type { RoadmapColumnStage } from '../RoadmapFilters';

type Analytics = ReturnType<typeof useGantryAnalytics>;

export function useRoadmapFilters(orderedVisibleColumns: RoadmapColumnStage[], analytics: Analytics) {
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedObjective, setSelectedObjective] = useState<string | null>(null);
  const [searchText, setSearchText] = useState<string>('');

  const handleSelectedTagsChange = (tags: string[]) => {
    setSelectedTags(tags);
    if (tags.length > 0) analytics.onTagsFiltered(tags);
  };

  const handleSelectedTypesChange = (types: string[]) => {
    setSelectedTypes(types);
    if (types.length > 0) analytics.onTypeFiltered(types);
  };

  const handleSelectedObjectiveChange = (uid: string | null) => {
    setSelectedObjective(uid);
    if (uid) analytics.onObjectivesFiltered([uid]);
  };

  const handleSearchTextChange = (text: string) => {
    setSearchText(text);
    if (text) analytics.onSearched(text);
  };

  const params = useMemo(
    () => ({
      stage: orderedVisibleColumns.length > 0 ? orderedVisibleColumns : undefined,
      tags: selectedTags.length > 0 ? selectedTags : undefined,
      type: selectedTypes.length > 0 ? selectedTypes : undefined,
      objectiveUid: selectedObjective ?? undefined,
    }),
    [orderedVisibleColumns, selectedTags, selectedTypes, selectedObjective],
  );

  const activeFiltersCount = selectedTags.length + selectedTypes.length + (selectedObjective ? 1 : 0) + (searchText ? 1 : 0);

  return {
    selectedTags,
    handleSelectedTagsChange,
    selectedTypes,
    handleSelectedTypesChange,
    selectedObjective,
    handleSelectedObjectiveChange,
    searchText,
    handleSearchTextChange,
    params,
    activeFiltersCount,
  };
}
