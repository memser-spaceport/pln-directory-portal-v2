'use client';

import { clsx } from 'clsx';
import { FiltersSidePanel } from '@/components/common/filters/FiltersSidePanel';
import { FilterSection } from '@/components/common/filters/FilterSection';
import { CheckboxListItemRepresentation } from '@/components/common/filters/GenericCheckboxList/components/CheckboxListItemRepresentation';
import {
  DEFAULT_ROADMAP_VISIBLE_COLUMNS,
  GANTRY_ROADMAP_COLUMN_STAGES,
  GANTRY_STAGE_LABELS,
  sortRoadmapColumnStages,
} from '@/services/gantry/constants';
import filterStyles from '@/components/page/gantry/shared/GantryFilters.module.scss';

export type RoadmapColumnStage = (typeof GANTRY_ROADMAP_COLUMN_STAGES)[number];

interface Props {
  readonly visibleColumns: RoadmapColumnStage[];
  readonly onVisibleColumnsChange: (columns: RoadmapColumnStage[]) => void;
}

export function RoadmapFilters({ visibleColumns, onVisibleColumnsChange }: Props) {
  const toggleColumn = (stage: RoadmapColumnStage) => {
    if (visibleColumns.includes(stage)) {
      onVisibleColumnsChange(visibleColumns.filter((s) => s !== stage));
      return;
    }
    onVisibleColumnsChange(sortRoadmapColumnStages([...visibleColumns, stage]));
  };

  const clearParams = () => {
    onVisibleColumnsChange([...DEFAULT_ROADMAP_VISIBLE_COLUMNS]);
  };

  return (
    <FiltersSidePanel
      clearParams={clearParams}
      appliedFiltersCount={visibleColumns.length}
      className={filterStyles.filterRail}
      hideFooter
    >
      <FilterSection title="Stages">
        <div>
          {GANTRY_ROADMAP_COLUMN_STAGES.map((stage) => (
            <CheckboxListItemRepresentation
              key={stage}
              label={
                <span className={filterStyles.stageFilterLabel}>
                  <span
                    className={clsx(filterStyles.stageFilterDot, filterStyles[`stageFilterDot_${stage}`])}
                    aria-hidden
                  />
                  {GANTRY_STAGE_LABELS[stage]}
                </span>
              }
              checked={visibleColumns.includes(stage)}
              onClick={() => toggleColumn(stage)}
            />
          ))}
        </div>
      </FilterSection>
    </FiltersSidePanel>
  );
}
