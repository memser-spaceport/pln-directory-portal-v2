'use client';

import { FiltersSidePanel } from '@/components/common/filters/FiltersSidePanel';
import { DEFAULT_ROADMAP_VISIBLE_COLUMNS, GANTRY_ROADMAP_COLUMN_STAGES } from '@/services/gantry/constants';
import filterStyles from '@/components/page/gantry/shared/GantryFilters.module.scss';
import { RoadmapFiltersContent } from './RoadmapFiltersContent';

export type RoadmapColumnStage = (typeof GANTRY_ROADMAP_COLUMN_STAGES)[number];

interface Props {
  readonly visibleColumns: RoadmapColumnStage[];
  readonly onVisibleColumnsChange: (columns: RoadmapColumnStage[]) => void;
  readonly selectedTags: string[];
  readonly onSelectedTagsChange: (tags: string[]) => void;
  readonly selectedTypes: string[];
  readonly onSelectedTypesChange: (types: string[]) => void;
  readonly searchText: string;
  readonly onSearchTextChange: (text: string) => void;
}

export function RoadmapFilters({ visibleColumns, onVisibleColumnsChange, selectedTags, onSelectedTagsChange, selectedTypes, onSelectedTypesChange, searchText, onSearchTextChange }: Props) {
  const clearParams = () => {
    onVisibleColumnsChange([...DEFAULT_ROADMAP_VISIBLE_COLUMNS]);
    onSelectedTagsChange([]);
    onSelectedTypesChange([]);
    onSearchTextChange('');
  };

  return (
    <FiltersSidePanel
      clearParams={clearParams}
      appliedFiltersCount={selectedTags.length + selectedTypes.length + (searchText ? 1 : 0)}
      className={filterStyles.filterRail}
      hideFooter
    >
      <RoadmapFiltersContent
        visibleColumns={visibleColumns}
        onVisibleColumnsChange={onVisibleColumnsChange}
        selectedTags={selectedTags}
        onSelectedTagsChange={onSelectedTagsChange}
        selectedTypes={selectedTypes}
        onSelectedTypesChange={onSelectedTypesChange}
        searchText={searchText}
        onSearchTextChange={onSearchTextChange}
      />
    </FiltersSidePanel>
  );
}
