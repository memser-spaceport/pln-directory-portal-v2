'use client';

import { clsx } from 'clsx';
import { Checkbox } from '@/components/common/Checkbox';
import { FilterSection } from '@/components/common/filters/FilterSection';
import { CheckboxListItemRepresentation } from '@/components/common/filters/GenericCheckboxList/components/CheckboxListItemRepresentation';
import { FilterMultiSelect } from '@/components/common/filters/FilterSelect/FilterMultiSelect';
import { SearchInput } from '@/components/common/filters/SearchInput';
import {
  GANTRY_ITEM_TYPE_OPTIONS,
  GANTRY_ROADMAP_COLUMN_STAGES,
  GANTRY_STAGE_LABELS,
  GANTRY_TAG_OPTIONS,
  sortRoadmapColumnStages,
} from '@/services/gantry/constants';
import type { GantryObjective } from '@/services/gantry/types';
import filterStyles from '@/components/page/gantry/shared/GantryFilters.module.scss';
import type { RoadmapColumnStage } from './RoadmapFilters';

interface Props {
  readonly visibleColumns: RoadmapColumnStage[];
  readonly onVisibleColumnsChange: (columns: RoadmapColumnStage[]) => void;
  readonly selectedTags: string[];
  readonly onSelectedTagsChange: (tags: string[]) => void;
  readonly selectedTypes: string[];
  readonly onSelectedTypesChange: (types: string[]) => void;
  readonly searchText: string;
  readonly onSearchTextChange: (text: string) => void;
  readonly objectives: GantryObjective[];
  readonly selectedObjectives: string[];
  readonly onSelectedObjectivesChange: (uids: string[]) => void;
}

export function RoadmapFiltersContent({
  visibleColumns,
  onVisibleColumnsChange,
  selectedTags,
  onSelectedTagsChange,
  selectedTypes,
  onSelectedTypesChange,
  searchText,
  onSearchTextChange,
  objectives,
  selectedObjectives,
  onSelectedObjectivesChange,
}: Props) {
  const toggleColumn = (stage: RoadmapColumnStage) => {
    if (visibleColumns.includes(stage)) {
      onVisibleColumnsChange(visibleColumns.filter((s) => s !== stage));
      return;
    }
    onVisibleColumnsChange(sortRoadmapColumnStages([...visibleColumns, stage]));
  };

  const toggleObjective = (uid: string) => {
    if (selectedObjectives.includes(uid)) {
      onSelectedObjectivesChange(selectedObjectives.filter((id) => id !== uid));
      return;
    }
    onSelectedObjectivesChange([...selectedObjectives, uid]);
  };

  return (
    <>
      <div>
        <SearchInput value={searchText} onChange={onSearchTextChange} placeholder="Search items..." />
      </div>

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

      {objectives.length > 0 && (
        <FilterSection title="Objectives">
          <div>
            {objectives.map((obj) => {
              const checked = selectedObjectives.includes(obj.uid);
              return (
                <div
                  key={obj.uid}
                  className={filterStyles.objectiveItem}
                  onClick={() => toggleObjective(obj.uid)}
                >
                  <span className={filterStyles.objectiveFirstLineSlot}>
                    <Checkbox checked={checked} classes={{ root: filterStyles.objectiveCheckbox }} />
                  </span>
                  <span className={filterStyles.objectiveLabel}>
                    <span className={filterStyles.objectiveFirstLineSlot}>
                      <span className={filterStyles.objectiveFilterCode}>O{obj.order}</span>
                    </span>
                    <span className={filterStyles.objectiveFilterTitle}>{obj.title}</span>
                  </span>
                </div>
              );
            })}
          </div>
        </FilterSection>
      )}

      <FilterSection title="Tags">
        <FilterMultiSelect
          options={GANTRY_TAG_OPTIONS}
          value={GANTRY_TAG_OPTIONS.filter((o) => selectedTags.includes(o.value))}
          onChange={(opts) => onSelectedTagsChange(opts.map((o) => o.value))}
          placeholder="Filter by tag..."
          isSearchable
          aria-label="Filter by tags"
        />
      </FilterSection>

      <FilterSection title="Type of request">
        <div>
          {GANTRY_ITEM_TYPE_OPTIONS.map((opt) => (
            <CheckboxListItemRepresentation
              key={opt.value}
              label={opt.label}
              checked={selectedTypes.includes(opt.value)}
              onClick={() => {
                if (selectedTypes.includes(opt.value)) {
                  onSelectedTypesChange(selectedTypes.filter((t) => t !== opt.value));
                } else {
                  onSelectedTypesChange([...selectedTypes, opt.value]);
                }
              }}
            />
          ))}
        </div>
      </FilterSection>
    </>
  );
}
