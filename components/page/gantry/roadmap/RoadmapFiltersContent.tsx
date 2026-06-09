'use client';

import { clsx } from 'clsx';
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
    } else {
      onSelectedObjectivesChange([...selectedObjectives, uid]);
    }
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
        <FilterSection title="Objective">
          <div>
            {objectives.map((obj) => (
              <CheckboxListItemRepresentation
                key={obj.uid}
                label={
                  <span className={filterStyles.objectiveFilterLabel}>
                    <span className={filterStyles.objectiveFilterDot} aria-hidden />
                    <span className={filterStyles.objectiveFilterCode}>{obj.code}</span>
                    {obj.label}
                  </span>
                }
                checked={selectedObjectives.includes(obj.uid)}
                onClick={() => toggleObjective(obj.uid)}
              />
            ))}
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

      <FilterSection title="Type">
        <FilterMultiSelect
          options={GANTRY_ITEM_TYPE_OPTIONS}
          value={GANTRY_ITEM_TYPE_OPTIONS.filter((o) => selectedTypes.includes(o.value))}
          onChange={(opts) => onSelectedTypesChange(opts.map((o) => o.value))}
          placeholder="Filter by type..."
          aria-label="Filter by type"
        />
      </FilterSection>
    </>
  );
}
