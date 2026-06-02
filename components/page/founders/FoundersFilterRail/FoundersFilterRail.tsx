'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import clsx from 'clsx';
import { FiltersSidePanel } from '@/components/common/filters/FiltersSidePanel';
import { FilterSection } from '@/components/common/filters/FilterSection';
import {
  FUND_VALUES,
  FUND_LABEL,
  FOUNDER_STATUS_VALUES,
  FOUNDER_STATUS_LABEL,
} from '@/services/founders/constants';
import type { FundTag, FounderStatus } from '@/services/founders/types';
import type { foundersFilterParsers } from '@/app/founders/(founders-page)/searchParams';
import type { useQueryStates } from 'nuqs';
import { useFoundersAnalytics } from '@/analytics/founders.analytics';
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

function NumericInput({
  value,
  onChange,
  min,
  max,
  step,
  placeholder,
}: {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
  placeholder?: string;
}) {
  const [localValue, setLocalValue] = useState<string>(value > 0 ? String(value) : '');
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync when parent resets the value (e.g. Clear filters)
  useEffect(() => {
    setLocalValue(value > 0 ? String(value) : '');
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalValue(e.target.value);
    const v = parseFloat(e.target.value);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      onChange(isNaN(v) ? 0 : v);
    }, 300);
  };

  return (
    <input
      type="number"
      className={s.input}
      value={localValue}
      min={min}
      max={max}
      step={step}
      placeholder={placeholder}
      onChange={handleChange}
    />
  );
}

export function FoundersFilterRail({ filters, setFilters }: Props) {
  const analytics = useFoundersAnalytics();

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
      minAlignment: null,
      minPlnProximity: null,
      page: null,
    } as never);
  }, [setFilters]);

  const appliedFiltersCount = useMemo(() => {
    let n = 0;
    if (filters.q) n++;
    n += filters.fund.length;
    n += filters.status.length;
    n += filters.source.length;
    if (filters.minAlignment > 0) n++;
    if (filters.minPlnProximity > 0) n++;
    return n;
  }, [filters]);

  // Derive unique source options from current filter selections (static list for MVP)
  const SOURCE_OPTIONS = useMemo(() => {
    const known = ['LinkedIn', 'Twitter', 'AngelList', 'Crunchbase', 'YC', 'Referral', 'Website', 'Email'];
    const extra = filters.source.filter((s) => !known.includes(s));
    return [...known, ...extra];
  }, [filters.source]);

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
        <SearchableCheckboxOptions
          options={SOURCE_OPTIONS}
          values={filters.source}
          onChange={(next) => {
            setFilter({ source: next.length ? next : null } as never);
            analytics.onFilterApplied('source', next);
          }}
          placeholder="Search sources…"
        />
      </FilterSection>

      <FilterSection title="Min alignment">
        <NumericInput
          value={filters.minAlignment}
          onChange={(v) => {
            setFilter({ minAlignment: v > 0 ? v : null } as never);
            analytics.onFilterApplied('minAlignment', v);
          }}
          min={0}
          max={1}
          step={0.01}
          placeholder="0.00 – 1.00"
        />
      </FilterSection>

      <FilterSection title="Min PLN proximity">
        <NumericInput
          value={filters.minPlnProximity}
          onChange={(v) => {
            setFilter({ minPlnProximity: v > 0 ? v : null } as never);
            analytics.onFilterApplied('minPlnProximity', v);
          }}
          min={0}
          max={1}
          step={0.01}
          placeholder="0.00 – 1.00"
        />
      </FilterSection>
    </FiltersSidePanel>
  );
}
