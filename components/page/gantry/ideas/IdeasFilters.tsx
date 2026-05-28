'use client';

import { clsx } from 'clsx';
import { FiltersSidePanel } from '@/components/common/filters/FiltersSidePanel';
import { FilterSection } from '@/components/common/filters/FilterSection';
import { CheckboxListItemRepresentation } from '@/components/common/filters/GenericCheckboxList/components/CheckboxListItemRepresentation';
import { GANTRY_STAGE_LABELS } from '@/services/gantry/constants';
import type { GantryStage } from '@/services/gantry/types';
import type { Option } from '@/components/form/FormSelect/types';
import filterStyles from '@/components/page/gantry/shared/GantryFilters.module.scss';

interface Props {
  readonly mine: boolean;
  readonly selectedStages: GantryStage[];
  readonly focusAreaUids: string[];
  readonly focusAreaOptions: Option[];
  readonly onMineChange: (value: boolean) => void;
  readonly onStagesChange: (stages: GantryStage[]) => void;
  readonly onFocusAreaChange: (uids: string[]) => void;
}

const stageOptions: GantryStage[] = ['IDEA', 'UNDER_REVIEW', 'PLANNED', 'IN_PROGRESS', 'SHIPPED', 'DECLINED'];

export function IdeasFilters({
  mine,
  selectedStages,
  focusAreaUids,
  focusAreaOptions,
  onMineChange,
  onStagesChange,
  onFocusAreaChange,
}: Props) {
  const toggleStage = (stage: GantryStage) => {
    if (selectedStages.includes(stage)) {
      onStagesChange(selectedStages.filter((s) => s !== stage));
      return;
    }
    onStagesChange([...selectedStages, stage]);
  };

  const toggleFocusArea = (uid: string) => {
    if (focusAreaUids.includes(uid)) {
      onFocusAreaChange(focusAreaUids.filter((id) => id !== uid));
      return;
    }
    onFocusAreaChange([...focusAreaUids, uid]);
  };

  const appliedFiltersCount = (mine ? 1 : 0) + selectedStages.length + focusAreaUids.length;

  const clearParams = () => {
    onMineChange(false);
    onStagesChange([]);
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
          {stageOptions.map((stage) => (
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
              checked={selectedStages.includes(stage)}
              onClick={() => toggleStage(stage)}
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
