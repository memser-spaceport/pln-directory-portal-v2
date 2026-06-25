'use client';

import { useEffect, useMemo, useState } from 'react';
import clsx from 'clsx';
import Link from 'next/link';

import type { IMember } from '@/types/members.types';

import MemberGridView from '@/components/page/members/member-grid-view';
import MemberListView from '@/components/page/members/member-list-view';
import { SortDropdown } from '@/components/common/filters/SortDropdown';
import { FilterSection } from '@/components/common/filters/FilterSection';
import { Checkbox } from '@/components/common/Checkbox';

// Reuse the production members page shell + grid styling so the prototype tracks
// production 1:1.
import shell from '@/app/members/(members-page)/@content/page.module.scss';
import grid from '@/components/page/members/MemberInfiniteList/MemberInfiniteList.module.scss';

import s from './MembersPrototype.module.scss';
import { MOCK_MEMBERS, FILTER_GROUPS, SORT_OPTIONS } from './mocks';

// Where a member card links to — the Affinity profile prototype (flat key).
const PROFILE_PATH = '/prototypes/member-affinity-profile';

type ViewType = 'grid' | 'list';

export default function MembersPrototype() {
  // Reusing interactive production components — gate on a mounted flag so SSR ===
  // first client render and we avoid hydration drift.
  const [mounted, setMounted] = useState(false);
  const [view, setView] = useState<ViewType>('grid');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('asc');
  const [checked, setChecked] = useState<Record<string, boolean>>({});

  useEffect(() => setMounted(true), []);

  const members = useMemo(() => {
    const q = search.trim().toLowerCase();
    const filtered = q
      ? MOCK_MEMBERS.filter(
          (m) =>
            m.name.toLowerCase().includes(q) ||
            m.mainTeam.name.toLowerCase().includes(q) ||
            m.role.toLowerCase().includes(q),
        )
      : MOCK_MEMBERS;
    return [...filtered].sort((a, b) =>
      sort === 'asc' ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name),
    );
  }, [search, sort]);

  if (!mounted) {
    return <div className={shell.members} />;
  }

  return (
    <div className={shell.members}>
      {/* Filters sidebar (desktop) */}
      <aside className={clsx(shell.members__left, shell.members__left__filterweb)}>
        <div className={s.filters}>
          <div className={s.filtersHeader}>
            <span className={s.filtersTitle}>Filters</span>
            <button type="button" className={s.clearAll} onClick={() => setChecked({})}>
              Clear All
            </button>
          </div>
          <div className={s.filtersBody}>
            {FILTER_GROUPS.map((group) => (
              <FilterSection key={group.title} title={group.title}>
                {group.options.map((opt) => {
                  const key = `${group.title}:${opt}`;
                  return (
                    <label key={key} className={s.filterRow}>
                      <Checkbox
                        checked={!!checked[key]}
                        onChange={(value) => setChecked((c) => ({ ...c, [key]: value }))}
                      />
                      <span className={s.filterRowLabel}>{opt}</span>
                    </label>
                  );
                })}
              </FilterSection>
            ))}
          </div>
        </div>
      </aside>

      {/* Right content */}
      <div className={shell.members__right}>
        <div className={shell.members__right__content}>
          <div className={shell.members__right__toolbar}>
            <div className={s.toolbarInner}>
              <div className={s.toolbarLeft}>
                <div className={s.title}>
                  <span className={s.titleText}>Members</span>
                  <span className={s.titleCount}>({members.length})</span>
                </div>
                <div className={s.search}>
                  <SearchIcon />
                  <input
                    className={s.searchInput}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search by Member Name, Team, or Project"
                  />
                </div>
              </div>

              <div className={s.toolbarRight}>
                <div className={s.viewToggle}>
                  <button
                    type="button"
                    className={clsx(s.viewBtn, { [s.active]: view === 'grid' })}
                    onClick={() => setView('grid')}
                    aria-label="Grid view"
                  >
                    <GridIcon />
                  </button>
                  <button
                    type="button"
                    className={clsx(s.viewBtn, { [s.active]: view === 'list' })}
                    onClick={() => setView('list')}
                    aria-label="List view"
                  >
                    <ListIcon />
                  </button>
                </div>
                <SortDropdown
                  sortByLabel="Sort by:"
                  options={SORT_OPTIONS}
                  currentSort={sort}
                  onSortChange={setSort}
                />
              </div>
            </div>
          </div>

          <div className={shell.members__right__membersList} style={{ flex: 1 }}>
            {members.length === 0 ? (
              <div className={s.empty}>
                <span className={s.emptyTitle}>No members found</span>
                <span className={s.emptyText}>Try a different search term.</span>
              </div>
            ) : (
              <div className={clsx({ [grid.grid]: view === 'grid', [grid.list]: view === 'list' })}>
                {members.map((member) => (
                  <Link
                    key={member.id}
                    href={PROFILE_PATH}
                    className={clsx(grid.member, { [grid.listMember]: view === 'list' })}
                  >
                    {view === 'grid' ? (
                      <MemberGridView isUserLoggedIn member={member as unknown as IMember} />
                    ) : (
                      <MemberListView isUserLoggedIn member={member as unknown as IMember} />
                    )}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- Inline toolbar icons ---------- */
const SearchIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
    <path
      d="M7.333 12.667A5.333 5.333 0 1 0 7.333 2a5.333 5.333 0 0 0 0 10.667ZM14 14l-2.9-2.9"
      stroke="#94a3b8"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const GridIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M6.5 2.5h-4v4h4v-4ZM13.5 2.5h-4v4h4v-4ZM6.5 9.5h-4v4h4v-4ZM13.5 9.5h-4v4h4v-4Z"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinejoin="round"
    />
  </svg>
);

const ListIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M5.5 4h8M5.5 8h8M5.5 12h8M2.5 4h.01M2.5 8h.01M2.5 12h.01"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);
