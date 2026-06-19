'use client';

// Prototype-local copy of production RoadmapFiltersContent (per the copy-and-simplify rule).
// Identical, except the objective title uses local classes so long titles wrap instead of
// truncating — which can't be done by editing production. Everything else reuses production
// components and styles (imported read-only).

import { clsx } from 'clsx';
import { FilterSection } from '@/components/common/filters/FilterSection';
import { CheckboxListItemRepresentation } from '@/components/common/filters/GenericCheckboxList/components/CheckboxListItemRepresentation';
import { FilterMultiSelect } from '@/components/common/filters/FilterSelect/FilterMultiSelect';
import { SearchInput } from '@/components/common/filters/SearchInput';
import { Checkbox } from '@/components/common/Checkbox';
import {
  GANTRY_ITEM_TYPE_OPTIONS,
  GANTRY_ROADMAP_COLUMN_STAGES,
  GANTRY_STAGE_LABELS,
  GANTRY_TAG_OPTIONS,
  sortRoadmapColumnStages,
} from '@/services/gantry/constants';
import type { GantryObjective } from '@/services/gantry/types';
import filterStyles from '@/components/page/gantry/shared/GantryFilters.module.scss';
import type { RoadmapColumnStage } from '@/components/page/gantry/roadmap/RoadmapFilters';
import s from './PrototypeRoadmapFilters.module.scss';

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
  readonly selectedObjective: string | null;
  readonly onSelectedObjectiveChange: (uid: string | null) => void;
}

export function PrototypeRoadmapFilters({
  visibleColumns,
  onVisibleColumnsChange,
  selectedTags,
  onSelectedTagsChange,
  selectedTypes,
  onSelectedTypesChange,
  searchText,
  onSearchTextChange,
  objectives,
  selectedObjective,
  onSelectedObjectiveChange,
}: Props) {
  const toggleColumn = (stage: RoadmapColumnStage) => {
    if (visibleColumns.includes(stage)) {
      onVisibleColumnsChange(visibleColumns.filter((col) => col !== stage));
      return;
    }
    onVisibleColumnsChange(sortRoadmapColumnStages([...visibleColumns, stage]));
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
            {objectives.map((obj) => {
              const checked = selectedObjective === obj.uid;
              return (
                // Prototype-only: top-left aligned, wrapping objective row (production centers + truncates).
                <div
                  key={obj.uid}
                  className={s.objectiveItem}
                  onClick={() => onSelectedObjectiveChange(checked ? null : obj.uid)}
                >
                  <span className={s.firstLineSlot}>
                    <Checkbox checked={checked} classes={{ root: s.objectiveCheckbox }} />
                  </span>
                  <span className={s.objectiveLabel}>
                    <span className={s.firstLineSlot}>
                      <span className={filterStyles.objectiveFilterCode}>O{obj.order}</span>
                    </span>
                    <span className={s.objectiveTitle}>{obj.title}</span>
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
