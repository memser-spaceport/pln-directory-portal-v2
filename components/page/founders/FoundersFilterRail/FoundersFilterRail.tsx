'use client';

import { useCallback, useMemo, useState } from 'react';
import clsx from 'clsx';
import { Switch } from '@base-ui-components/react/switch';
import { FiltersSidePanel } from '@/components/common/filters/FiltersSidePanel';
import { FilterSection } from '@/components/common/filters/FilterSection';
import { FUND_VALUES, FUND_LABEL, FOUNDER_STATUS_VALUES, FOUNDER_STATUS_LABEL } from '@/services/founders/constants';
import type { FundTag, FounderStatus } from '@/services/founders/types';
import type { foundersFilterParsers } from '@/app/founders/(founders-page)/searchParams';
import type { useQueryStates } from 'nuqs';
import { useFoundersAnalytics } from '@/analytics/founders.analytics';
import { useGetFounderFilters } from '@/services/founders/hooks/useGetFounderFilters';
import { useFoundersAccess } from '@/services/rbac/hooks/useFoundersAccess';
import { SearchIcon } from '@/components/icons';
import s from './FoundersFilterRail.module.scss';

type Filters = ReturnType<typeof useQueryStates<typeof foundersFilterParsers>>[0];
type SetFilters = ReturnType<typeof useQueryStates<typeof foundersFilterParsers>>[1];

interface Props {
  filters: Filters;
  setFilters: SetFilters;
}

function SearchInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  const hasValue = !!props.value;
  const clearInput = () => {
    props.onChange?.({ target: { value: '' } } as React.ChangeEvent<HTMLInputElement>);
  };
  return (
    <div className={s.inputWrap}>
      {hasValue ? (
        <button type="button" className={s.inputIconBtn} onClick={clearInput} aria-label="Clear">
          ×
        </button>
      ) : (
        <span className={s.inputIcon}>
          <SearchIcon />
        </span>
      )}
      <input {...props} className={s.input} />
    </div>
  );
}

function CheckboxOptions<T extends string>({
  options,
  values,
  onChange,
  label,
}: {
  options: readonly T[];
  values: string[];
  onChange: (next: string[]) => void;
  label?: (v: T) => string;
}) {
  const set = new Set(values);
  const toggle = (v: T) => {
    const next = set.has(v) ? values.filter((x) => x !== v) : [...values, v];
    onChange(next);
  };
  return (
    <div className={s.options}>
      {options.map((v) => (
        <label key={v} className={clsx(s.option, set.has(v) && s.optionOn)}>
          <input type="checkbox" checked={set.has(v)} onChange={() => toggle(v)} />
          <span className={s.optionLabel}>{label ? label(v) : v}</span>
        </label>
      ))}
    </div>
  );
}

function SearchableCheckboxOptions({
  options,
  values,
  onChange,
  placeholder,
}: {
  options: string[];
  values: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
}) {
  const [query, setQuery] = useState('');
  const set = new Set(values);
  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return options;
    return options.filter((o) => o.toLowerCase().includes(q));
  }, [options, query]);
  const toggle = (v: string) => {
    const next = set.has(v) ? values.filter((x) => x !== v) : [...values, v];
    onChange(next);
  };
  return (
    <div className={s.searchable}>
      <SearchInput
        type="search"
        placeholder={placeholder ?? 'Search…'}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <div className={s.options}>
        {filtered.length === 0 ? (
          <div className={s.emptyHint}>No matches.</div>
        ) : (
          filtered.map((v) => (
            <label key={v} className={clsx(s.option, set.has(v) && s.optionOn)}>
              <input type="checkbox" checked={set.has(v)} onChange={() => toggle(v)} />
              <span className={s.optionLabel}>{v}</span>
            </label>
          ))
        )}
      </div>
    </div>
  );
}

export function FoundersFilterRail({ filters, setFilters }: Props) {
  const analytics = useFoundersAnalytics();
  const access = useFoundersAccess();
  const { data: filterOptions, isLoading: isLoadingSources } = useGetFounderFilters(access.canView);

  const setFilter = useCallback(
    (updates: Parameters<typeof setFilters>[0]) => setFilters({ ...updates, page: 1 } as never),
    [setFilters],
  );

  const onClear = useCallback(() => {
    setFilters({
      q: null,
      fund: null,
      status: null,
      source: null,
      isRaising: null,
      focusArea: null,
      page: null,
    } as never);
  }, [setFilters]);

  const appliedFiltersCount = useMemo(() => {
    let n = 0;
    if (filters.q) n++;
    n += filters.fund.length;
    n += filters.status.length;
    n += filters.source.length;
    n += filters.focusArea.length;
    if (filters.isRaising) n++;
    return n;
  }, [filters]);

  const sourceOptions = useMemo(() => {
    const apiSources = filterOptions?.sources ?? [];
    const apiLower = new Set(apiSources.map((src) => src.toLowerCase()));
    const extra = filters.source.filter((src) => !apiLower.has(src.toLowerCase()));
    return [...apiSources, ...extra];
  }, [filterOptions?.sources, filters.source]);

  const focusAreaOptions = useMemo(() => {
    const apiAreas = filterOptions?.focusAreas ?? [];
    const apiLower = new Set(apiAreas.map((a) => a.toLowerCase()));
    const extra = filters.focusArea.filter((a) => !apiLower.has(a.toLowerCase()));
    return [...apiAreas, ...extra];
  }, [filterOptions?.focusAreas, filters.focusArea]);

  return (
    <FiltersSidePanel clearParams={onClear} appliedFiltersCount={appliedFiltersCount} hideFooter>
      <FilterSection title="Search">
        <SearchInput
          type="search"
          placeholder="Name…"
          value={filters.q}
          onChange={(e) => {
            const v = e.target.value || null;
            setFilter({ q: v } as never);
            if (v) analytics.onFilterApplied('q', v);
          }}
        />
      </FilterSection>

      <FilterSection title="Raising now">
        <label className={s.toggleRow}>
          <span className={s.toggleLabel}>Currently raising</span>
          <Switch.Root
            className={s.switch}
            checked={filters.isRaising}
            onCheckedChange={(checked) => {
              setFilter({ isRaising: checked ? true : null } as never);
              analytics.onFilterApplied('isRaising', checked);
            }}
          >
            <Switch.Thumb className={s.thumb}>
              <div className={s.dot} />
            </Switch.Thumb>
          </Switch.Root>
        </label>
      </FilterSection>

      <FilterSection title="Fund">
        <CheckboxOptions<FundTag>
          options={FUND_VALUES}
          values={filters.fund}
          onChange={(next) => {
            setFilter({ fund: next.length ? next : null } as never);
            analytics.onFilterApplied('fund', next);
          }}
          label={(v) => FUND_LABEL[v]}
        />
      </FilterSection>

      <FilterSection title="Thesis">
        {focusAreaOptions.length === 0 ? (
          <div className={s.emptyHint}>No thesis areas yet.</div>
        ) : (
          <SearchableCheckboxOptions
            options={focusAreaOptions}
            values={filters.focusArea}
            onChange={(next) => {
              setFilter({ focusArea: next.length ? next : null } as never);
              analytics.onFilterApplied('focusArea', next);
            }}
            placeholder="Search thesis…"
          />
        )}
      </FilterSection>

      <FilterSection title="Review status">
        <CheckboxOptions<FounderStatus>
          options={FOUNDER_STATUS_VALUES}
          values={filters.status}
          onChange={(next) => {
            setFilter({ status: next.length ? next : null } as never);
            analytics.onFilterApplied('status', next);
          }}
          label={(v) => FOUNDER_STATUS_LABEL[v]}
        />
      </FilterSection>

      <FilterSection title="Source">
        {isLoadingSources ? (
          <div className={s.emptyHint}>Loading sources…</div>
        ) : sourceOptions.length === 0 ? (
          <div className={s.emptyHint}>No sources available.</div>
        ) : (
          <SearchableCheckboxOptions
            options={sourceOptions}
            values={filters.source}
            onChange={(next) => {
              setFilter({ source: next.length ? next : null } as never);
              analytics.onFilterApplied('source', next);
            }}
            placeholder="Search sources…"
          />
        )}
      </FilterSection>
    </FiltersSidePanel>
  );
}
