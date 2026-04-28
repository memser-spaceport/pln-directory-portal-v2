'use client';

import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { useJobsAnalytics } from '@/analytics/jobs.analytics';
import { FilterSection } from '@/components/common/filters/FilterSection';
import { SearchInput } from '@/components/common/filters/SearchInput';
import { useJobsFilters, useInfiniteJobsList } from '@/services/jobs/hooks/useJobsQueries';
import { useJobsParamsUpdater } from '@/services/jobs/hooks/useJobsParamsUpdater';
import type { IJobsFacetItem, JobsFilterKey } from '@/types/jobs.types';
import {
  buildWorkplaceTypeFacetItems,
  filterStateFromURL,
  seniorityDisplayLabel,
  sortSeniorityValues,
  workplaceTypeDisplayLabel,
} from '@/utils/jobs.utils';
import s from './JobsFilterBody.module.scss';
import { FocusAreaFilter, getJobsFocusAreaCount, toJobsTreeFilterItems } from '@/components/core/FocusAreaFilter';

const parseList = (values: string[]): Set<string> => {
  return new Set(values.map((v) => v.trim()).filter(Boolean));
};

export default function JobsFilterBody() {
  const searchParams = useSearchParams();
  const filtersQuery = useJobsFilters();
  const { totalRoles } = useInfiniteJobsList();
  const { setParam, toggleMulti } = useJobsParamsUpdater();
  const analytics = useJobsAnalytics();

  const qFromUrl = searchParams.get('q') ?? '';

  const handleSearchChange = useCallback(
    (value: string) => {
      const next = value.trim();
      setParam('q', next || null);
      analytics.onJobsSearched({
        search_query: next,
        result_count: totalRoles,
        filter_state: filterStateFromURL(searchParams),
      });
    },
    [setParam, analytics, totalRoles, searchParams],
  );

  const selected = useMemo(
    () => ({
      roleCategory: parseList(searchParams.getAll('roleCategory')),
      seniority: parseList(searchParams.getAll('seniority')),
      focus: parseList(searchParams.getAll('focus')),
      location: parseList(searchParams.getAll('location')),
      workplaceType: parseList(searchParams.getAll('workplaceType')),
    }),
    [searchParams],
  );

  const focusTreeItems = useMemo(
    () => (filtersQuery.data?.focus ? toJobsTreeFilterItems(filtersQuery.data.focus) : []),
    [filtersQuery.data?.focus],
  );

  const handleFocusToggle = useCallback(
    (item: { id: string }) => {
      toggleMulti('focus', item.id);
      analytics.onJobsFiltersApplied({
        filter_type: 'focus',
        filter_value: item.id,
        result_count: totalRoles,
        filter_state: filterStateFromURL(searchParams),
      });
    },
    [toggleMulti, analytics, totalRoles, searchParams],
  );

  if (filtersQuery.isError) return null;
  if (filtersQuery.isLoading || !filtersQuery.data) return null;

  const data = filtersQuery.data;

  const onToggle = (key: JobsFilterKey, value: string) => {
    toggleMulti(key, value);
    analytics.onJobsFiltersApplied({
      filter_type: key,
      filter_value: value,
      result_count: totalRoles,
      filter_state: filterStateFromURL(searchParams),
    });
  };

  return (
    <>
      <FilterSection title="Search for a Job">
        <SearchInput value={qFromUrl} onChange={handleSearchChange} placeholder="Search a team or role" />
      </FilterSection>

      <FacetSection
        title="Role Category"
        items={data.roleCategory}
        selected={selected.roleCategory}
        onToggle={(v) => onToggle('roleCategory', v)}
      />

      <FacetSection
        title="Seniority"
        items={sortSeniorityValues(data.seniority)}
        selected={selected.seniority}
        onToggle={(v) => onToggle('seniority', v)}
        renderLabel={(v) => seniorityDisplayLabel(v)}
      />

      {focusTreeItems.length > 0 && (
        <FilterSection title="Focus Area">
          <FocusAreaFilter
            items={focusTreeItems}
            selectedIds={selected.focus}
            onToggle={handleFocusToggle}
            getCount={getJobsFocusAreaCount}
          />
        </FilterSection>
      )}

      <FacetSection
        title="Workplace type"
        items={buildWorkplaceTypeFacetItems(data.workMode)}
        selected={selected.workplaceType}
        onToggle={(v) => onToggle('workplaceType', v)}
        renderLabel={(v) => workplaceTypeDisplayLabel(v)}
      />

      <FacetSection
        title="Location"
        items={data.location}
        selected={selected.location}
        onToggle={(v) => onToggle('location', v)}
      />
    </>
  );
}

function FacetSection({
  title,
  items,
  selected,
  onToggle,
  renderLabel,
}: {
  title: string;
  items: IJobsFacetItem[];
  selected: Set<string>;
  onToggle: (value: string) => void;
  renderLabel?: (value: string) => string;
}) {
  if (items.length === 0) return null;
  return (
    <FilterSection title={title}>
      <ul className={s.optionList}>
        {items.map((item) => {
          const isChecked = selected.has(item.value);
          return (
            <li key={item.value}>
              <label className={s.option}>
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => onToggle(item.value)}
                  className={s.checkbox}
                />
                <span className={s.optionLabel}>{renderLabel ? renderLabel(item.value) : item.value}</span>
                <span className={s.optionCount}>{item.count}</span>
              </label>
            </li>
          );
        })}
      </ul>
    </FilterSection>
  );
}
