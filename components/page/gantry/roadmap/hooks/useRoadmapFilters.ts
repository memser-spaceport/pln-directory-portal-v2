import { useMemo, useState } from 'react';
import type { useGantryAnalytics } from '@/analytics/gantry.analytics';
import type { RoadmapColumnStage } from '../RoadmapFilters';

type Analytics = ReturnType<typeof useGantryAnalytics>;

export function useRoadmapFilters(orderedVisibleColumns: RoadmapColumnStage[], analytics: Analytics) {
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedObjectives, setSelectedObjectives] = useState<string[]>([]);
  const [searchText, setSearchText] = useState<string>('');

  const handleSelectedTagsChange = (tags: string[]) => {
    setSelectedTags(tags);
    if (tags.length > 0) analytics.onTagsFiltered(tags);
  };

  const handleSelectedTypesChange = (types: string[]) => {
    setSelectedTypes(types);
    if (types.length > 0) analytics.onTypeFiltered(types);
  };

  const handleSelectedObjectivesChange = (uids: string[]) => {
    setSelectedObjectives(uids);
    if (uids.length > 0) analytics.onObjectivesFiltered(uids);
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
      objectiveUid: selectedObjectives.length > 0 ? selectedObjectives : undefined,
    }),
    [orderedVisibleColumns, selectedTags, selectedTypes, selectedObjectives],
  );

  const activeFiltersCount =
    selectedTags.length + selectedTypes.length + selectedObjectives.length + (searchText ? 1 : 0);

  const handleClearAll = () => {
    setSelectedTags([]);
    setSelectedTypes([]);
    setSelectedObjectives([]);
    setSearchText('');
  };

  return {
    selectedTags,
    handleSelectedTagsChange,
    selectedTypes,
    handleSelectedTypesChange,
    selectedObjectives,
    handleSelectedObjectivesChange,
    searchText,
    handleSearchTextChange,
    handleClearAll,
    params,
    activeFiltersCount,
  };
}
