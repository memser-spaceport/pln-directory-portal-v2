'use client';

import { clsx } from 'clsx';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useJobsAnalytics } from '@/analytics/jobs.analytics';
import { CaretRightIcon } from '@/components/icons';
import { FilterSection } from '@/components/common/filters/FilterSection';
import { SearchInput } from '@/components/common/filters/SearchInput';
import { useJobsFilters, useInfiniteJobsList } from '@/services/jobs/hooks/useJobsQueries';
import { useJobsParamsUpdater } from '@/services/jobs/hooks/useJobsParamsUpdater';
import type { IJobsFacetItem, IJobsFacetTreeItem, JobsFilterKey } from '@/types/jobs.types';
import { filterStateFromURL, seniorityDisplayLabel, sortSeniorityValues } from '@/utils/jobs.utils';
import s from './JobsFilterBody.module.scss';

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
      analytics.onJobsFiltered({
        filter_type: 'q',
        filter_value: next,
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
    }),
    [searchParams],
  );

  if (filtersQuery.isError) return null;
  if (filtersQuery.isLoading || !filtersQuery.data) return null;

  const data = filtersQuery.data;

  const onToggle = (key: JobsFilterKey, value: string) => {
    toggleMulti(key, value);
    analytics.onJobsFiltered({
      filter_type: key,
      filter_value: value,
      result_count: totalRoles,
      filter_state: filterStateFromURL(searchParams),
    });
  };

  return (
    <>
      <FilterSection title="Search for a Job">
        <SearchInput
          value={qFromUrl}
          onChange={handleSearchChange}
          placeholder="Search a company or role"
        />
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

      <FocusTreeSection items={data.focus} selected={selected.focus} onToggle={(v) => onToggle('focus', v)} />

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

function FocusTreeSection({
  items,
  selected,
  onToggle,
}: {
  items: IJobsFacetTreeItem[];
  selected: Set<string>;
  onToggle: (value: string) => void;
}) {
  if (items.length === 0) return null;
  return (
    <FilterSection title="Focus Area">
      <ul className={s.optionList}>
        {items.map((parent) => (
          <FocusNode key={parent.value} parent={parent} selected={selected} onToggle={onToggle} />
        ))}
      </ul>
    </FilterSection>
  );
}

function FocusNode({
  parent,
  selected,
  onToggle,
}: {
  parent: IJobsFacetTreeItem;
  selected: Set<string>;
  onToggle: (value: string) => void;
}) {
  const hasChildren = parent.children.length > 0;
  const childSelected = parent.children.some((c) => selected.has(c.value));
  const [expanded, setExpanded] = useState<boolean>(childSelected);

  useEffect(() => {
    if (childSelected) setExpanded(true);
  }, [childSelected]);

  const isChecked = selected.has(parent.value);

  return (
    <li>
      <div className={s.treeRow}>
        <label className={s.option}>
          <input type="checkbox" checked={isChecked} onChange={() => onToggle(parent.value)} className={s.checkbox} />
          {hasChildren ? (
            <button
              type="button"
              className={s.treeChevron}
              onClick={(e) => {
                e.preventDefault();
                setExpanded((v) => !v);
              }}
              title={expanded ? 'Collapse' : 'Expand'}
            >
              <CaretRightIcon className={clsx(s.treeChevronIcon, { [s.treeChevronIcon_open]: expanded })} />
            </button>
          ) : (
            <span className={s.treeChevronSpacer} />
          )}
          <span className={s.optionLabel}>{parent.value}</span>
          <span className={s.optionCount}>{parent.count}</span>
        </label>
      </div>
      {hasChildren && expanded && (
        <ul className={s.treeChildren}>
          {parent.children.map((child) => {
            const childChecked = selected.has(child.value);
            return (
              <li key={child.value}>
                <label className={s.option}>
                  <input
                    type="checkbox"
                    checked={childChecked}
                    onChange={() => onToggle(child.value)}
                    className={s.checkbox}
                  />
                  <span className={s.optionLabel}>{child.value}</span>
                  <span className={s.optionCount}>{child.count}</span>
                </label>
              </li>
            );
          })}
        </ul>
      )}
    </li>
  );
}
