'use client';

/**
 * Job Board — faithful mocked copy of production /jobs.
 *
 * REUSE MAP (import verbatim, never copy CSS):
 *  - DashboardPagesLayout            @/components/core/dashboard-pages-layout/DashboardPagesLayout  (two-pane shell)
 *  - SortDropdown                    @/components/common/filters/SortDropdown                        (toolbar sort)
 *  - FiltersSidePanel / FilterSection / GenericCheckboxList / SearchInput  @/components/common/filters/*  (filter rail)
 *  - useGetFocusTags / TagsList / RoleRow Icons + *.module.scss (1:1)      @/components/page/jobs/TeamGroupCard/*
 *  - jobs.utils (getJobDate, seniority sort, workplace helpers)            @/utils/jobs.utils
 *  - JobsContent.module.scss         @/app/jobs/(jobs-page)/@content/JobsContent.module.scss         (root/toolbar/list/title CSS, 1:1)
 * COPY-SIMPLIFY (prototype-local, mock store):
 *  - JobBoardFilterView   ← JobsFilterBody + FiltersContent   (react-query facets → mock facets)
 *  - mockJobsFilterStore  ← useJobsFilterStore                (Zustand + URL sync → external store)
 *  - JobTeamGroupCard     ← TeamGroupCard   (forked to render ReferRoleRow; reuses its SCSS 1:1)
 *  - ReferRoleRow         ← RoleRow         (forked to add the per-job "Refer" control; reuses its SCSS 1:1)
 *  - ReferMenu            (new)             per-job Refer → LinkedIn / X web share-intent popover
 * OMITTED vs production: Focus Area tree filter, job-alert banner/indicator, infinite scroll,
 *  analytics, mobile filter sheet. Data is mocked; no API/react-query calls.
 */

import { useEffect, useMemo, useState } from 'react';

import DashboardPagesLayout from '@/components/core/dashboard-pages-layout/DashboardPagesLayout';
import { SortDropdown } from '@/components/common/filters/SortDropdown';
import { JOBS_SORT_OPTIONS } from '@/services/jobs/constants';
import { getJobDate } from '@/utils/jobs.utils';
import { URL_QUERY_VALUE_SEPARATOR } from '@/utils/constants';
import { FILTER_VALUE_SEPARATOR, FILTER_VALUE_SEPARATOR_ENCODED } from '@/constants/filters';
import type { IJobTeamGroup, JobsSortKey } from '@/types/jobs.types';

// Reuse the production content shell styling 1:1 (root / toolbar / title / list).
import contentCss from '@/app/jobs/(jobs-page)/@content/JobsContent.module.scss';

import { MOCK_JOB_GROUPS } from './mocks';
import { useMockJobsFilterStore } from './mockJobsFilterStore';
import { JobBoardFilterView } from './JobBoardFilterView';
import { JobTeamGroupCard } from './JobTeamGroupCard';
import s from './JobBoardPrototype.module.scss';

function decodeMulti(raw: string | null): string[] {
  if (!raw) return [];
  return raw
    .split(URL_QUERY_VALUE_SEPARATOR)
    .map((r) => r.trim().replaceAll(FILTER_VALUE_SEPARATOR_ENCODED, FILTER_VALUE_SEPARATOR))
    .filter(Boolean);
}

// Map a workplaceType filter value ('remote' | 'in-office' | 'hybrid') to a role's workMode.
const matchesWorkMode = (selected: string[], workMode: string | null): boolean => {
  if (selected.length === 0) return true;
  const wm = (workMode ?? '').toLowerCase();
  return selected.some((v) => (v === 'remote' ? wm === 'remote' || wm === 'distributed' : wm === v));
};

export default function JobBoardPrototype() {
  // Reused filter components are base-ui / react-hook-form (client-only). Gate on
  // mount so SSR === first client render (avoids hydration mismatch). Mock dates
  // are also computed client-side only, for the same reason.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const { params, setParam } = useMockJobsFilterStore();

  const sort = (params.get('sort') as JobsSortKey) ?? 'newest';

  const visibleGroups = useMemo<IJobTeamGroup[]>(() => {
    const q = (params.get('q') || '').trim().toLowerCase();
    const roleCategory = decodeMulti(params.get('roleCategory'));
    const seniority = decodeMulti(params.get('seniority'));
    const workplaceType = decodeMulti(params.get('workplaceType'));
    const location = decodeMulti(params.get('location'));

    const groups: IJobTeamGroup[] = [];
    for (const group of MOCK_JOB_GROUPS) {
      const teamMatchesQ = !q || group.team.name.toLowerCase().includes(q);
      const roles = group.roles.filter((role) => {
        if (roleCategory.length && !(role.roleCategory && roleCategory.includes(role.roleCategory))) return false;
        if (seniority.length && !(role.seniority && seniority.includes(role.seniority))) return false;
        if (!matchesWorkMode(workplaceType, role.workMode)) return false;
        if (location.length && !role.location.some((l) => location.includes(l))) return false;
        if (q && !teamMatchesQ && !role.roleTitle.toLowerCase().includes(q)) return false;
        return true;
      });
      if (roles.length) groups.push({ team: group.team, roles, totalRoles: roles.length });
    }

    if (sort === 'company_az') {
      groups.sort((a, b) => a.team.name.localeCompare(b.team.name));
    } else if ((sort as string) === 'company_za') {
      groups.sort((a, b) => b.team.name.localeCompare(a.team.name));
    } else {
      // newest: group's most-recent role first
      const newest = (g: IJobTeamGroup) => Math.max(...g.roles.map((r) => new Date(getJobDate(r)).getTime()));
      groups.sort((a, b) => newest(b) - newest(a));
    }
    return groups;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params, sort]);

  const totalRoles = visibleGroups.reduce((sum, g) => sum + g.totalRoles, 0);
  const totalGroups = visibleGroups.length;

  if (!mounted) {
    return <div className={s.mountGate} />;
  }

  const titleBlock = (
    <h1 className={contentCss.title}>
      Job Board{' '}
      <span className={contentCss.titleCount}>
        ({totalRoles} {totalRoles === 1 ? 'role' : 'roles'} across {totalGroups}{' '}
        {totalGroups === 1 ? 'team' : 'teams'})
      </span>
    </h1>
  );

  const content = (
    <div className={contentCss.root}>
      <div className={contentCss.toolbar}>
        <div className={contentCss.titleGroup}>{titleBlock}</div>
        <SortDropdown
          options={JOBS_SORT_OPTIONS}
          currentSort={sort}
          onSortChange={(value) => setParam('sort', value === 'newest' ? undefined : value)}
          sortByLabel="Sort by:"
        />
      </div>

      {visibleGroups.length === 0 ? (
        <div className={s.empty}>No roles match your filters. Try clearing some.</div>
      ) : (
        <div className={contentCss.list}>
          {visibleGroups.map((group) => (
            <JobTeamGroupCard key={group.team.uid} group={group} />
          ))}
        </div>
      )}
    </div>
  );

  return <DashboardPagesLayout filters={<JobBoardFilterView />} content={content} />;
}
