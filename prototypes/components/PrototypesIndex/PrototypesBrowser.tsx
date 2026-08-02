'use client';

import { useMemo, useRef, useState } from 'react';
import type { PrototypeListGroup } from '@/prototypes/types';
import { PrototypeCard } from './PrototypeCard';
import s from './PrototypesIndex.module.scss';

type Props = {
  groups: PrototypeListGroup[];
};

export function PrototypesBrowser({ groups }: Props) {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const total = useMemo(() => groups.reduce((n, g) => n + g.items.length, 0), [groups]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return groups;
    // Match every whitespace-separated term against title + description + category,
    // so "gantry rating" narrows and a category word surfaces the whole group.
    const terms = q.split(/\s+/);
    return groups
      .map((group) => ({
        category: group.category,
        items: group.items.filter((item) => {
          const haystack = `${item.title} ${item.description} ${item.category}`.toLowerCase();
          return terms.every((t) => haystack.includes(t));
        }),
      }))
      .filter((group) => group.items.length > 0);
  }, [groups, query]);

  const visible = useMemo(() => filtered.reduce((n, g) => n + g.items.length, 0), [filtered]);
  const searching = query.trim().length > 0;

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

      {searching && (
        <p className={s.resultsMeta} role="status" aria-live="polite">
          {visible} of {total} prototypes
        </p>
      )}

      {filtered.length === 0 ? (
        <div className={s.empty}>
          <p className={s.emptyTitle}>No prototypes match “{query.trim()}”</p>
          <p className={s.emptyHint}>Try a shorter term, a category name (e.g. “Gantry”), or clear the search.</p>
        </div>
      ) : (
        filtered.map((group) => (
          <section key={group.category} className={s.section}>
            <h2 className={s.sectionTitle}>
              {group.category}
              {group.category === 'Ideation' && <span className={s.sectionDraftNote}>Drafts — work in progress</span>}
            </h2>
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
