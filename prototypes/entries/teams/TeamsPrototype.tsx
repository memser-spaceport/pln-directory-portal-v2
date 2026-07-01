'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import clsx from 'clsx';

import { SortDropdown } from '@/components/common/filters/SortDropdown';
import { FilterSection } from '@/components/common/filters/FilterSection';
import { Checkbox } from '@/components/common/Checkbox';

import { MOCK_TEAMS, MOCK_FILTER_GROUPS } from './mocks';
import { TeamCardView } from './TeamCardView';
import { FollowToast } from '../follow-shared/FollowToast';
import s from './TeamsPrototype.module.scss';

const SORT_OPTIONS = [
  { value: 'default', label: 'Default' },
  { value: 'asc', label: 'A-Z (Ascending)' },
  { value: 'desc', label: 'Z-A (Descending)' },
];

export default function TeamsPrototype() {
  // SortDropdown + Checkbox are base-ui (client-only). Gate render on mount so
  // SSR === first client render and we avoid a hydration mismatch.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('default');
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [scope, setScope] = useState<'all' | 'following'>('all');
  const [selectedFilters, setSelectedFilters] = useState<Set<string>>(new Set());
  const [followed, setFollowed] = useState<Set<string>>(new Set());
  const [toastName, setToastName] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
  }, []);

  const toggleFollow = (id: string, name: string) => {
    setFollowed((prev) => {
      const next = new Set(prev);
      const willFollow = !next.has(id);
      next.has(id) ? next.delete(id) : next.add(id);
      if (willFollow) {
        setToastName(name);
        if (toastTimer.current) clearTimeout(toastTimer.current);
        toastTimer.current = setTimeout(() => setToastName(null), 4000);
      }
      return next;
    });
  };

  const toggleFilter = (key: string) =>
    setSelectedFilters((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });

  const visibleTeams = useMemo(() => {
    let rows = MOCK_TEAMS.slice();
    if (scope === 'following') rows = rows.filter((t) => followed.has(t.id));
    const q = search.trim().toLowerCase();
    if (q) {
      rows = rows.filter(
        (t) =>
          (t.name ?? '').toLowerCase().includes(q) || (t.shortDescription ?? '').toLowerCase().includes(q),
      );
    }
    if (sort === 'asc') rows.sort((a, b) => (a.name ?? '').localeCompare(b.name ?? ''));
    if (sort === 'desc') rows.sort((a, b) => (b.name ?? '').localeCompare(a.name ?? ''));
    return rows;
  }, [search, sort, scope, followed]);

  if (!mounted) {
    return <div className={s.page} />;
  }

  return (
    <div className={s.page}>
      <div className={s.shell}>
        {/* Left filters rail (real FilterSection + Checkbox, mocked groups) */}
        <aside className={s.filters}>
          <div className={s.filtersHead}>
            <h2 className={s.filtersTitle}>Filters</h2>
            {selectedFilters.size > 0 && (
              <button type="button" className={s.clearAll} onClick={() => setSelectedFilters(new Set())}>
                Clear all
              </button>
            )}
          </div>
          {MOCK_FILTER_GROUPS.map((group) => (
            <FilterSection key={group.title} title={group.title}>
              <div className={s.checkList}>
                {group.options.map((option) => {
                  const key = `${group.title}::${option}`;
                  const checked = selectedFilters.has(key);
                  return (
                    <label key={key} className={s.checkRow}>
                      <Checkbox checked={checked} onChange={() => toggleFilter(key)} />
                      <span className={clsx(s.checkLabel, checked && s.checkLabelActive)}>{option}</span>
                    </label>
                  );
                })}
              </div>
            </FilterSection>
          ))}
        </aside>

        <main className={s.content}>
          {/* Toolbar: title (N), search, sort, grid/list toggle */}
          <div className={s.toolbar}>
            <div className={s.toolbarLeft}>
              <div className={s.titleContainer}>
                <h1 className={s.title}>Teams</h1>
                <p className={s.count}>({visibleTeams.length})</p>
              </div>

              {/* Personal view lens: All vs teams you follow. */}
              <div className={s.scopeTabs} role="tablist" aria-label="Team scope">
                <button
                  type="button"
                  role="tab"
                  aria-selected={scope === 'all'}
                  className={clsx(s.scopeTab, scope === 'all' && s.scopeTabActive)}
                  onClick={() => setScope('all')}
                >
                  All
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={scope === 'following'}
                  className={clsx(s.scopeTab, scope === 'following' && s.scopeTabActive)}
                  onClick={() => setScope('following')}
                >
                  Following{followed.size > 0 ? ` (${followed.size})` : ''}
                </button>
              </div>
            </div>

            <div className={s.toolbarRight}>
              <div className={s.searchContainer}>
                <img src="/icons/search.svg" alt="search" height={16} width={16} className={s.searchIcon} />
                <input
                  className={s.searchInput}
                  placeholder="Search for a team"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                {search && (
                  <button type="button" className={s.clearBtn} onClick={() => setSearch('')} title="Clear">
                    <img src="/icons/close-gray.svg" alt="close" height={14} width={14} />
                  </button>
                )}
              </div>

              <SortDropdown
                sortByLabel="Sort by:"
                options={SORT_OPTIONS}
                currentSort={sort}
                onSortChange={setSort}
              />

              <div className={s.viewToggle}>
                <button
                  type="button"
                  className={clsx(s.viewBtn, view === 'grid' && s.viewBtnActive)}
                  onClick={() => setView('grid')}
                  aria-pressed={view === 'grid'}
                  title="Grid view"
                >
                  <GridIcon />
                </button>
                <button
                  type="button"
                  className={clsx(s.viewBtn, view === 'list' && s.viewBtnActive)}
                  onClick={() => setView('list')}
                  aria-pressed={view === 'list'}
                  title="List view"
                >
                  <ListIcon />
                </button>
              </div>
            </div>
          </div>

          {/* Responsive grid of real TeamGridView-styled cards */}
          {visibleTeams.length > 0 ? (
            <div className={clsx(s.grid, view === 'list' && s.gridList)}>
              {visibleTeams.map((team) => (
                <Link
                  key={team.id}
                  href="/prototypes/team-profile"
                  prefetch={false}
                  className={s.cardLink}
                >
                  <TeamCardView
                    team={team}
                    following={followed.has(team.id)}
                    onToggleFollow={() => toggleFollow(team.id, team.name ?? 'team')}
                  />
                </Link>
              ))}
            </div>
          ) : scope === 'following' && followed.size === 0 ? (
            <div className={s.empty}>You&apos;re not following any teams yet. Follow a team to see it here.</div>
          ) : (
            <div className={s.empty}>No teams match “{search}”. Try a different search.</div>
          )}
        </main>
      </div>

      {toastName && (
        <FollowToast>
          You&apos;re following <strong>{toastName}</strong> — you&apos;ll get its updates in your feed.
        </FollowToast>
      )}
    </div>
  );
}

function GridIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="1.5" y="1.5" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.4" />
      <rect x="9.5" y="1.5" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.4" />
      <rect x="1.5" y="9.5" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.4" />
      <rect x="9.5" y="9.5" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  );
}

function ListIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M2 4h12M2 8h12M2 12h12" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}
