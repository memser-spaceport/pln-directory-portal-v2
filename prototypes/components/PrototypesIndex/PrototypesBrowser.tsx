'use client';

import { useMemo, useRef, useState } from 'react';
import clsx from 'clsx';
// Production's search-category pills (also reused by ContactSupport's TopicPills): grey at rest,
// brand border on hover, filled brand when chosen.
import sc from '@/components/core/application-search/components/SearchCategories/SearchCategories.module.scss';
import type { PrototypeListGroup, PrototypeListItem, PrototypeStatus, PrototypeVersion } from '@/prototypes/types';
import { PrototypeCard, STATUS_LABELS } from './PrototypeCard';
import s from './PrototypesIndex.module.scss';

type Props = {
  groups: PrototypeListGroup[];
};

const STATUS_ORDER: PrototypeStatus[] = ['ideation', 'progress', 'dev'];
const VERSION_ORDER: PrototypeVersion[] = [1, 2, 3];

function countBy<K>(items: PrototypeListItem[], key: (item: PrototypeListItem) => K | undefined) {
  const counts = new Map<K, number>();
  for (const item of items) {
    const k = key(item);
    if (k !== undefined) counts.set(k, (counts.get(k) ?? 0) + 1);
  }
  return counts;
}

type FilterRowProps<V> = {
  label: string;
  options: { value: V; label: string; count?: number }[];
  selected: V | null;
  onSelect: (value: V | null) => void;
};

function FilterRow<V extends string | number>({ label, options, selected, onSelect }: FilterRowProps<V>) {
  return (
    <div className={s.filterRow} role="group" aria-label={label}>
      <span className={s.filterLabel}>{label}</span>
      {options.map((option) => {
        const active = option.value === selected;
        const count = option.count ?? 0;
        // A pill that would show nothing is hidden rather than greyed, unless it is the one chosen.
        if (!count && !active) return null;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={active}
            className={clsx(sc.categoryBadge, s.filterPill, active && sc.active)}
            onClick={() => onSelect(active ? null : option.value)}
          >
            {option.label}
            <span className={s.filterCount}>{count}</span>
          </button>
        );
      })}
    </div>
  );
}

export function PrototypesBrowser({ groups }: Props) {
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<PrototypeStatus | null>(null);
  const [version, setVersion] = useState<PrototypeVersion | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const total = useMemo(() => groups.reduce((n, g) => n + g.items.length, 0), [groups]);

  // Search still reads the description, even though cards no longer show it.
  const matchesQuery = useMemo(() => {
    const q = query.trim().toLowerCase();
    // Match every whitespace-separated term against title + description + category,
    // so "gantry rating" narrows and a category word surfaces the whole group.
    const terms = q ? q.split(/\s+/) : [];
    return (item: PrototypeListItem) => {
      const haystack = `${item.title} ${item.description} ${item.category}`.toLowerCase();
      return terms.every((t) => haystack.includes(t));
    };
  }, [query]);

  const items = useMemo(() => groups.flatMap((g) => g.items).filter(matchesQuery), [groups, matchesQuery]);

  // Each group's counts honour the search and the *other* group's choice, so a count is what pressing it shows.
  const statusCounts = useMemo(
    () =>
      countBy(
        items.filter((i) => !version || i.version === version),
        (i) => i.status,
      ),
    [items, version],
  );
  const versionCounts = useMemo(
    () =>
      countBy(
        items.filter((i) => !status || i.status === status),
        (i) => i.version,
      ),
    [items, status],
  );

  const filtered = useMemo(
    () =>
      groups
        .map((group) => ({
          category: group.category,
          items: group.items.filter(
            (item) =>
              matchesQuery(item) && (!status || item.status === status) && (!version || item.version === version),
          ),
        }))
        .filter((group) => group.items.length > 0),
    [groups, matchesQuery, status, version],
  );

  const visible = useMemo(() => filtered.reduce((n, g) => n + g.items.length, 0), [filtered]);
  const searching = query.trim().length > 0;
  const narrowed = searching || status !== null || version !== null;

  return (
    <>
      <div className={s.search}>
        <svg className={s.searchIcon} width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
          <path d="m20 20-3.5-3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
        <input
          ref={inputRef}
          type="text"
          className={s.searchInput}
          placeholder="Search prototypes by name, description, or category…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Escape' && query) {
              e.preventDefault();
              setQuery('');
            }
          }}
          aria-label="Search prototypes"
        />
        {searching && (
          <button
            type="button"
            className={s.searchClear}
            onClick={() => {
              setQuery('');
              inputRef.current?.focus();
            }}
            aria-label="Clear search"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        )}
      </div>

      {/* Pressing the chosen pill again clears it — one control per meaning, no separate "All". */}
      <div className={s.filters}>
        <FilterRow
          label="Status"
          options={STATUS_ORDER.map((value) => ({
            value,
            label: STATUS_LABELS[value],
            count: statusCounts.get(value),
          }))}
          selected={status}
          onSelect={setStatus}
        />
        <FilterRow
          label="Version"
          options={VERSION_ORDER.map((value) => ({ value, label: `V${value}`, count: versionCounts.get(value) }))}
          selected={version}
          onSelect={setVersion}
        />
      </div>

      {narrowed && (
        <p className={s.resultsMeta} role="status" aria-live="polite">
          {visible} of {total} prototypes
        </p>
      )}

      {filtered.length === 0 ? (
        <div className={s.empty}>
          <p className={s.emptyTitle}>
            {searching ? <>No prototypes match “{query.trim()}”</> : 'No prototypes match these filters'}
          </p>
          <p className={s.emptyHint}>
            {searching
              ? 'Try a shorter term, a category name (e.g. “Gantry”), or clear the search.'
              : 'Press a selected filter again to clear it.'}
          </p>
        </div>
      ) : (
        filtered.map((group) => (
          <section key={group.category} className={s.section}>
            <h2 className={s.sectionTitle}>{group.category}</h2>
            <div className={s.grid}>
              {group.items.map((entry) => (
                <PrototypeCard key={entry.key} entry={entry} />
              ))}
            </div>
          </section>
        ))
      )}
    </>
  );
}
