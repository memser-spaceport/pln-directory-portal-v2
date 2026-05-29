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
  readonly mine: boolean;
  readonly visibleColumns: RoadmapColumnStage[];
  readonly onMineChange: (value: boolean) => void;
  readonly onVisibleColumnsChange: (columns: RoadmapColumnStage[]) => void;
}

export function RoadmapFilters({ mine, visibleColumns, onMineChange, onVisibleColumnsChange }: Props) {
  const toggleColumn = (stage: RoadmapColumnStage) => {
    if (visibleColumns.includes(stage)) {
      onVisibleColumnsChange(visibleColumns.filter((s) => s !== stage));
      return;
    }
    onVisibleColumnsChange(sortRoadmapColumnStages([...visibleColumns, stage]));
  };

  const appliedFiltersCount = (mine ? 1 : 0) + visibleColumns.length;

  const clearParams = () => {
    onMineChange(false);
    onVisibleColumnsChange([...DEFAULT_ROADMAP_VISIBLE_COLUMNS]);
  };

  return (
    <FiltersSidePanel
      clearParams={clearParams}
      appliedFiltersCount={appliedFiltersCount}
      className={filterStyles.filterRail}
      hideFooter
    >
      <FilterSection title="Needs">
        <div>
          <CheckboxListItemRepresentation label="My needs" checked={mine} onClick={() => onMineChange(!mine)} />
        </div>
      </FilterSection>

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
