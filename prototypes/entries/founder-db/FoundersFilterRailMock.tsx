'use client';

import { useCallback, useMemo, useState } from 'react';
import clsx from 'clsx';
import { Switch } from '@base-ui-components/react/switch';
import { FiltersSidePanel } from '@/components/common/filters/FiltersSidePanel';
import { FilterSection } from '@/components/common/filters/FilterSection';
import { FUND_VALUES, FUND_LABEL, FOUNDER_STATUS_VALUES, FOUNDER_STATUS_LABEL } from '@/services/founders/constants';
import type { FundTag, FounderStatus } from '@/services/founders/types';
import { SearchIcon } from '@/components/icons';
// Reuse the production filter-rail styling so the prototype tracks production 1:1.
import s from '@/components/page/founders/FoundersFilterRail/FoundersFilterRail.module.scss';
import type { Filters, SetFilters } from './state';
import { mockSources, mockFocusAreas } from './mocks';

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

export function FoundersFilterRailMock({ filters, setFilters }: Props) {
  const setFilter = useCallback(
    (updates: Parameters<SetFilters>[0]) => setFilters({ ...updates, page: 1 }),
    [setFilters],
  );

  const onClear = useCallback(() => {
    setFilters({
      q: null,
      fund: null,
      status: null,
      source: null,
      focusArea: null,
      isRaising: null,
      page: null,
    });
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

  return (
    <FiltersSidePanel clearParams={onClear} appliedFiltersCount={appliedFiltersCount} hideFooter>
      <FilterSection title="Search">
        <SearchInput
          type="search"
          placeholder="Name or headline…"
          value={filters.q}
          onChange={(e) => setFilter({ q: e.target.value || null })}
        />
      </FilterSection>

      <FilterSection title="Raising now">
        <label className={s.toggleRow}>
          <span className={s.toggleLabel}>Currently raising</span>
          <Switch.Root
            className={s.switch}
            checked={filters.isRaising}
            onCheckedChange={(checked) => setFilter({ isRaising: checked ? true : null })}
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
          onChange={(next) => setFilter({ fund: next.length ? (next as FundTag[]) : null })}
          label={(v) => FUND_LABEL[v]}
        />
      </FilterSection>

      <FilterSection title="Thesis">
        <SearchableCheckboxOptions
          options={mockFocusAreas}
          values={filters.focusArea}
          onChange={(next) => setFilter({ focusArea: next.length ? next : null })}
          placeholder="Search thesis…"
        />
      </FilterSection>

      <FilterSection title="Review status">
        <CheckboxOptions<FounderStatus>
          options={FOUNDER_STATUS_VALUES}
          values={filters.status}
          onChange={(next) => setFilter({ status: next.length ? (next as FounderStatus[]) : null })}
          label={(v) => FOUNDER_STATUS_LABEL[v]}
        />
      </FilterSection>

      <FilterSection title="Source">
        <SearchableCheckboxOptions
          options={mockSources}
          values={filters.source}
          onChange={(next) => setFilter({ source: next.length ? next : null })}
          placeholder="Search sources…"
        />
      </FilterSection>
    </FiltersSidePanel>
  );
}
