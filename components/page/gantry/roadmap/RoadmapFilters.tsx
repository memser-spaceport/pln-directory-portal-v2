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
import type { Option } from '@/components/form/FormSelect/types';
import filterStyles from '@/components/page/gantry/shared/GantryFilters.module.scss';

export type RoadmapColumnStage = (typeof GANTRY_ROADMAP_COLUMN_STAGES)[number];

interface Props {
  readonly mine: boolean;
  readonly visibleColumns: RoadmapColumnStage[];
  readonly focusAreaUids: string[];
  readonly focusAreaOptions: Option[];
  readonly onMineChange: (value: boolean) => void;
  readonly onVisibleColumnsChange: (columns: RoadmapColumnStage[]) => void;
  readonly onFocusAreaChange: (uids: string[]) => void;
}

export function RoadmapFilters({
  mine,
  visibleColumns,
  focusAreaUids,
  focusAreaOptions,
  onMineChange,
  onVisibleColumnsChange,
  onFocusAreaChange,
}: Props) {
  const toggleColumn = (stage: RoadmapColumnStage) => {
    if (visibleColumns.includes(stage)) {
      onVisibleColumnsChange(visibleColumns.filter((s) => s !== stage));
      return;
    }
    onVisibleColumnsChange(sortRoadmapColumnStages([...visibleColumns, stage]));
  };

  const toggleFocusArea = (uid: string) => {
    if (focusAreaUids.includes(uid)) {
      onFocusAreaChange(focusAreaUids.filter((id) => id !== uid));
      return;
    }
    onFocusAreaChange([...focusAreaUids, uid]);
  };

  const appliedFiltersCount = (mine ? 1 : 0) + visibleColumns.length + focusAreaUids.length;

  const clearParams = () => {
    onMineChange(false);
    onVisibleColumnsChange([...DEFAULT_ROADMAP_VISIBLE_COLUMNS]);
    onFocusAreaChange([]);
  };

  return (
    <FiltersSidePanel
      clearParams={clearParams}
      appliedFiltersCount={appliedFiltersCount}
      className={filterStyles.filterRail}
      hideFooter
    >
      <FilterSection title="Ideas">
        <div>
          <CheckboxListItemRepresentation label="My ideas" checked={mine} onClick={() => onMineChange(!mine)} />
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

      {focusAreaOptions.length > 0 && (
        <FilterSection title="Focus area">
          <div>
            {focusAreaOptions.map((option) => (
              <CheckboxListItemRepresentation
                key={option.value}
                label={option.label}
                checked={focusAreaUids.includes(option.value)}
                onClick={() => toggleFocusArea(option.value)}
              />
            ))}
          </div>
        </FilterSection>
      )}
    </FiltersSidePanel>
  );
}
