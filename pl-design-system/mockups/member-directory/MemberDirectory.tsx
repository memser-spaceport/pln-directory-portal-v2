'use client';

import { useState, useMemo } from 'react';
import { NavBar }       from '@components/NavBar';
import { MemberProfileCard } from '@components/MemberProfileCard';
import type { AvailabilityStatus } from '@components/MemberCard';
import { SearchInput }  from '@components/SearchInput';
import { Badge }        from '@components/Badge';
import { Pagination }   from '@components/Pagination';
import { EmptyState }   from '@components/EmptyState';
import {
  Dropdown,
  DropdownItem,
  DropdownLabel,
  DropdownSeparator,
} from '@components/Dropdown';
import { mockMembers, TEAMS } from './mock-data';
import s from './MemberDirectory.module.scss';

// ─── Icons ────────────────────────────────────────────────────────────────────

const ChevronDown = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
    <path d="M2.5 4.5 6 8l3.5-3.5" stroke="currentColor" strokeWidth="1.5"
      strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const FilterIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
    <path d="M1 3h12M3.5 7h7M6 11h2" stroke="currentColor" strokeWidth="1.5"
      strokeLinecap="round" />
  </svg>
);

// ─── Constants ────────────────────────────────────────────────────────────────

const PAGE_SIZE = 6;

// ─── Component ────────────────────────────────────────────────────────────────

export function MemberDirectory() {
  const [search,        setSearch]        = useState('');
  const [statusFilters, setStatusFilters] = useState<Set<AvailabilityStatus>>(new Set());
  const [teamFilter,    setTeamFilter]    = useState<string | null>(null);
  const [page,          setPage]          = useState(1);

  // ── Derived state ─────────────────────────────────────────────────────────

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return mockMembers.filter(m => {
      if (q && !m.name.toLowerCase().includes(q)) return false;
      if (statusFilters.size > 0) {
        if (!m.availability || !statusFilters.has(m.availability)) return false;
      }
      if (teamFilter && m.company !== teamFilter) return false;
      return true;
    });
  }, [search, statusFilters, teamFilter]);

  const totalPages   = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage     = Math.min(page, totalPages);
  const paged        = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  const hasFilters   = search || statusFilters.size > 0 || teamFilter;
  const countLabel   = filtered.length === mockMembers.length
    ? `${mockMembers.length} members`
    : `${filtered.length} of ${mockMembers.length} members`;

  // ── Handlers ──────────────────────────────────────────────────────────────

  function toggleStatus(status: AvailabilityStatus) {
    setStatusFilters(prev => {
      const next = new Set(prev);
      next.has(status) ? next.delete(status) : next.add(status);
      return next;
    });
    setPage(1);
  }

  function handleSearch(e: React.ChangeEvent<HTMLInputElement>) {
    setSearch(e.target.value);
    setPage(1);
  }

  function handleTeamSelect(team: string | null) {
    setTeamFilter(team);
    setPage(1);
  }

  function clearAll() {
    setSearch('');
    setStatusFilters(new Set());
    setTeamFilter(null);
    setPage(1);
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className={s.root}>
      {/* ── Navigation ───────────────────────────────────────────────────── */}
      <NavBar
        items={[
          { label: 'Members', href: '#', active: true },
          { label: 'Teams',   href: '#' },
          { label: 'Projects', href: '#' },
          { label: 'Events',  href: '#' },
        ]}
        userName="Alex Chen"
        avatar="https://i.pravatar.cc/300?img=11"
      />

      {/* ── Page body ─────────────────────────────────────────────────────── */}
      <div className={s.pageBody}>

        {/* ── Page header ─────────────────────────────────────────────── */}
        <div className={s.pageHeader}>
          <div className={s.headingGroup}>
            <h1 className={s.heading}>Members</h1>
            <p className={s.subheading}>{countLabel}</p>
          </div>
          <div className={s.searchWrapper}>
            <SearchInput
              placeholder="Search by name…"
              value={search}
              onChange={handleSearch}
              onClear={() => { setSearch(''); setPage(1); }}
              fullWidth
            />
          </div>
        </div>

        {/* ── Filter bar ──────────────────────────────────────────────── */}
        <div className={s.filterBar} role="group" aria-label="Filter members">
          <span className={s.filterIcon}><FilterIcon /></span>
          <span className={s.filterLabel}>Filter</span>

          {/* Status badge toggles */}
          <button
            className={s.filterBadge}
            onClick={() => toggleStatus('available')}
            aria-pressed={statusFilters.has('available')}
          >
            <Badge
              color="blue"
              styleType={statusFilters.has('available') ? 'fill' : 'outline'}
              size="md"
              dot
            >
              Available
            </Badge>
          </button>

          <button
            className={s.filterBadge}
            onClick={() => toggleStatus('booked')}
            aria-pressed={statusFilters.has('booked')}
          >
            <Badge
              color="yellow"
              styleType={statusFilters.has('booked') ? 'fill' : 'outline'}
              size="md"
              dot
            >
              Booked
            </Badge>
          </button>

          <span className={s.filterDivider} aria-hidden="true" />

          {/* Team dropdown */}
          <Dropdown
            trigger={
              <button
                className={s.dropdownTrigger}
                data-active={String(teamFilter !== null)}
              >
                {teamFilter ?? 'All Teams'}
                <span className={s.chevron}><ChevronDown /></span>
              </button>
            }
            align="start"
          >
            <DropdownLabel>Filter by team</DropdownLabel>
            <DropdownItem onSelect={() => handleTeamSelect(null)}>
              All Teams
            </DropdownItem>
            <DropdownSeparator />
            {TEAMS.map(team => (
              <DropdownItem key={team} onSelect={() => handleTeamSelect(team)}>
                {team}
              </DropdownItem>
            ))}
          </Dropdown>

          {/* Clear all — only visible when filters are active */}
          {hasFilters && (
            <button className={s.clearBtn} onClick={clearAll}>
              Clear all
            </button>
          )}
        </div>

        {/* ── Grid ────────────────────────────────────────────────────────── */}
        {paged.length === 0 ? (
          <EmptyState
            title="No members found"
            description="Try adjusting your search or removing some filters."
          />
        ) : (
          <div className={s.grid}>
            {paged.map(m => (
              <MemberProfileCard
                key={m.id}
                name={m.name}
                avatar={m.avatar}
                role={m.role}
                company={m.company}
                location={m.location}
                availability={m.availability}
                tags={m.tags}
                href="#"
              />
            ))}
          </div>
        )}

        {/* ── Pagination ────────────────────────────────────────────────── */}
        <div className={s.paginationBar}>
          <Pagination
            currentPage={safePage}
            totalPages={totalPages}
            onPageChange={p => { setPage(p); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            variant="with-text"
          />
        </div>

      </div>
    </div>
  );
}
