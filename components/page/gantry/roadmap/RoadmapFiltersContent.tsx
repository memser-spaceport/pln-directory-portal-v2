'use client';

import { clsx } from 'clsx';
import { FilterSection } from '@/components/common/filters/FilterSection';
import { CheckboxListItemRepresentation } from '@/components/common/filters/GenericCheckboxList/components/CheckboxListItemRepresentation';
import {
  DEFAULT_ROADMAP_VISIBLE_COLUMNS,
  GANTRY_ROADMAP_COLUMN_STAGES,
  GANTRY_STAGE_LABELS,
  sortRoadmapColumnStages,
} from '@/services/gantry/constants';
import filterStyles from '@/components/page/gantry/shared/GantryFilters.module.scss';
import type { RoadmapColumnStage } from './RoadmapFilters';

interface Props {
  readonly visibleColumns: RoadmapColumnStage[];
  readonly onVisibleColumnsChange: (columns: RoadmapColumnStage[]) => void;
}

export function RoadmapFiltersContent({ visibleColumns, onVisibleColumnsChange }: Props) {
  const toggleColumn = (stage: RoadmapColumnStage) => {
    if (visibleColumns.includes(stage)) {
      onVisibleColumnsChange(visibleColumns.filter((s) => s !== stage));
      return;
    }
    onVisibleColumnsChange(sortRoadmapColumnStages([...visibleColumns, stage]));
  };

  return (
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
  );
}
