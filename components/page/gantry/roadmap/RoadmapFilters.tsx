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
}

export function RoadmapFilters({ visibleColumns, onVisibleColumnsChange, selectedTags, onSelectedTagsChange }: Props) {
  const clearParams = () => {
    onVisibleColumnsChange([...DEFAULT_ROADMAP_VISIBLE_COLUMNS]);
    onSelectedTagsChange([]);
  };

  return (
    <FiltersSidePanel
      clearParams={clearParams}
      appliedFiltersCount={visibleColumns.length + selectedTags.length}
      className={filterStyles.filterRail}
      hideFooter
    >
      <RoadmapFiltersContent
        visibleColumns={visibleColumns}
        onVisibleColumnsChange={onVisibleColumnsChange}
        selectedTags={selectedTags}
        onSelectedTagsChange={onSelectedTagsChange}
      />
    </FiltersSidePanel>
  );
}
