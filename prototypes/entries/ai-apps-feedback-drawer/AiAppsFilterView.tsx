'use client';

import { createFilterGetter } from '@/services/teams/utils/createFilterGetter';
import { FiltersSidePanel } from '@/components/common/filters/FiltersSidePanel';
import { FilterSection } from '@/components/common/filters/FilterSection';
import { GenericCheckboxList } from '@/components/common/filters/GenericCheckboxList';

import { AppsFilterSearch } from './AppsFilterSearch';
import { useMockAiAppsFilterStore, countAppliedFilters } from './mockAiAppsFilterStore';
import type { AiAppWithDoc } from './mocks';

interface Props {
  apps: AiAppWithDoc[];
  onClose?: () => void;
}

/**
 * The filters rail, built the way Members and Teams build theirs: a
 * `FiltersSidePanel` (which supplies the "Filters" heading, the applied count
 * and Clear All) holding a title-less search section, then one `FilterSection`
 * per facet.
 *
 * One facet — Created by. Apps here are personal projects, so "whose is this"
 * is the axis people actually browse along ("show me Nina's", "show me mine").
 *
 * Deliberately NOT here:
 *  - A **Status** section (Live / Draft / Needs attention). The record has a
 *    `status` field, which is what made it feel discovered rather than
 *    invented — but no filter rail in the product asks that question, and a
 *    schema field is not a facet. Removed on request.
 *  - A "has App Details" toggle — nobody looks for documentation as a category.
 *  - An "Only my apps" switch — that is just Created by = you, and a second
 *    control for one answer is a duplicate we would have to keep in agreement.
 *  - Any topic/category taxonomy — the record has no such field, and inventing
 *    one would invent the taxonomy with it.
 */
export function AiAppsFilterView({ apps, onClose }: Props) {
  const { params, clearParams } = useMockAiAppsFilterStore();

  const appliedFiltersCount = countAppliedFilters(params);

  // Options come off the data rather than a hand-kept list, so the counts can't
  // disagree with the grid.
  const creators = Array.from(new Set(apps.map((a) => a.member.name)))
    .sort((a, b) => a.localeCompare(b))
    .map((name) => ({
      value: name,
      disabled: false,
      count: apps.filter((a) => a.member.name === name).length,
    }));

  const getCreators = createFilterGetter(creators);

  return (
    <FiltersSidePanel onClose={onClose} clearParams={clearParams} appliedFiltersCount={appliedFiltersCount}>
      <FilterSection>
        <AppsFilterSearch label="Search for an app" placeholder="E.g. Warm Intro Matcher" />
      </FilterSection>

      <FilterSection title="Created by">
        <GenericCheckboxList
          label="Search or select a creator"
          paramKey="createdBy"
          placeholder="E.g. Nina Chen"
          filterStore={useMockAiAppsFilterStore}
          useGetDataHook={getCreators}
          defaultItemsToShow={5}
        />
      </FilterSection>
    </FiltersSidePanel>
  );
}
