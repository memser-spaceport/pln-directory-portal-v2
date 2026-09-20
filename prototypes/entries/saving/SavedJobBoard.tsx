'use client';

import { useMemo, useState } from 'react';

import DashboardPagesLayout from '@/components/core/dashboard-pages-layout/DashboardPagesLayout';
import { toast } from '@/components/core/ToastContainer';
import { SortDropdown } from '@/components/common/filters/SortDropdown';
import { JOBS_SORT_OPTIONS } from '@/services/jobs/constants';
import { getJobDate } from '@/utils/jobs.utils';
import { URL_QUERY_VALUE_SEPARATOR } from '@/utils/constants';
import { FILTER_VALUE_SEPARATOR, FILTER_VALUE_SEPARATOR_ENCODED } from '@/constants/filters';
import type { IJobRole, IJobTeam, IJobTeamGroup, JobsSortKey } from '@/types/jobs.types';

// Production's content shell (root / toolbar / title / list), 1:1 — the same
// import the board makes.
import contentCss from '@/app/jobs/(jobs-page)/@content/JobsContent.module.scss';

import { MOCK_JOB_GROUPS } from '../job-board/mocks';
import { useMockJobsFilterStore } from '../job-board/mockJobsFilterStore';
import { JobBoardFilterView } from '../job-board/JobBoardFilterView';
import { JobBoardMobileFilters } from '../job-board/JobBoardMobileFilters';
import { JobTeamGroupCard } from '../job-board/JobTeamGroupCard';
import { JobBoardScopeTabs, SCOPE_APPLIED, SCOPE_PARAM, SCOPE_SAVED } from '../job-board/JobBoardScopeTabs';
import { JobApplyFlowDrawer, type ApplyFlowStepId } from '../job-board/JobApplyFlowDrawer';
import { FILLED_PROFILE, roleMatches, type MemberProfile, type RoleCriteria } from '../job-board/viewerState';
import { PL_TEAM_UID } from '../newsfeed-v0/mocks';
// The board's own local classes — scope strip, empty state, section labels.
import jb from '../job-board/JobBoardPrototype.module.scss';
import sp from './SavingPrototype.module.scss';

import type { SavedItemsApi } from '../save-shared/savedItems';

interface Props {
  saved: SavedItemsApi;
  /** A role was just saved. Hands the shell a way into this surface's Saved
   *  tab, for the toast's link. */
  onSaved: (jumpToSaved: () => void) => void;
}

/** The board's own decoder for a multi-value param, verbatim. */
function decodeMulti(raw: string | null): string[] {
  if (!raw) return [];
  return raw
    .split(URL_QUERY_VALUE_SEPARATOR)
    .map((r) => r.trim().replaceAll(FILTER_VALUE_SEPARATOR_ENCODED, FILTER_VALUE_SEPARATOR))
    .filter(Boolean);
}

const isProtocolLabsGroup = (group: IJobTeamGroup) => group.team.uid === PL_TEAM_UID;

/**
 * COPY-SIMPLIFY of `job-board/JobBoardPrototype`, for the signed-in member with
 * a finished profile — the one viewer saving is about. Same shell, rail,
 * toolbar, cards and apply drawer; what is dropped is everything that belongs
 * to another viewer (the sign-in banner and sign-up modal, the pending-approval
 * and profile nudges, the aspirant's interest strip, the owner's submit door
 * and ⋯ menus, the open-role rows) and the review scaffolding that picks
 * between them. What is added is one thing, in three places:
 *
 *  - **a bookmark on every role row**, beside Share (`JobSaveButton`);
 *  - **a Saved tab** between All and Applied, counting what is kept;
 *  - **"Saved 3d ago"** in the row's clock inside that tab, where the posting
 *    age is no longer the number that decides anything.
 *
 * The Saved scope narrows the way Applied does — one more predicate in the
 * rail's own filter, so the rail, the search box and the sort keep working
 * inside it and the toolbar's count stays the count of what is on screen.
 *
 * **The apply drawer is the real one**, so a saved role can be opened, read
 * and applied to from the Saved tab, and then reads "Applied" there — a saved
 * list you cannot act from is a list you have to leave to use. The drawer's
 * masthead does not carry a second bookmark: the row's is one scroll away
 * behind it, and a save is a decision made while scanning, not while reading.
 * (Glassdoor puts one beside Apply in the detail; worth revisiting if the
 * drawer turns out to be where people decide to keep a role.)
 */
export function SavedJobBoard({ saved, onSaved }: Props) {
  const { params, setParam } = useMockJobsFilterStore();

  /* The member's own record, session-only — the board's own shape, reduced to
     the one field the row reads. */
  const [applications, setApplications] = useState<Map<string, { appliedAt: string }>>(() => new Map());
  const appliedRoleUids = useMemo(() => new Set(applications.keys()), [applications]);
  const appliedAtByRole = useMemo(
    () => new Map([...applications].map(([uid, a]) => [uid, a.appliedAt])),
    [applications],
  );
  const [profile, setProfile] = useState<MemberProfile>(FILLED_PROFILE);

  const [flow, setFlow] = useState<{ role: IJobRole; team: IJobTeam } | null>(null);
  const [flowStep, setFlowStep] = useState<ApplyFlowStepId>('review');

  const sort = (params.get('sort') ?? 'newest') as JobsSortKey;
  const scope = params.get(SCOPE_PARAM);
  const savedScope = scope === SCOPE_SAVED;
  const appliedScope = scope === SCOPE_APPLIED;

  const savedRoleUids = useMemo(() => saved.uidsOf('job'), [saved]);
  /* The clock reads "Saved …" only on the saved list — see the row. */
  const savedAtByRole = useMemo(
    () => (savedScope ? new Map([...savedRoleUids].map((uid) => [uid, saved.savedAt(uid) ?? ''])) : undefined),
    [savedScope, savedRoleUids, saved],
  );

  const criteria = useMemo<RoleCriteria>(
    () => ({
      roleCategory: decodeMulti(params.get('roleCategory')),
      seniority: decodeMulti(params.get('seniority')),
      workplaceType: decodeMulti(params.get('workplaceType')),
      location: decodeMulti(params.get('location')),
    }),
    [params],
  );

  /** The rail + search result set, scoped first, before the sort orders it. */
  const railGroups = useMemo<IJobTeamGroup[]>(() => {
    const q = (params.get('q') || '').trim().toLowerCase();
    const groups: IJobTeamGroup[] = [];
    for (const group of MOCK_JOB_GROUPS) {
      const teamMatchesQ = !q || group.team.name.toLowerCase().includes(q);
      const roles = group.roles.filter((role) => {
        /* The scope narrows first, and narrows like every other filter. */
        if (savedScope && !savedRoleUids.has(role.uid)) return false;
        if (appliedScope && !appliedRoleUids.has(role.uid)) return false;
        if (!roleMatches(criteria, role)) return false;
        if (q && !teamMatchesQ && !role.roleTitle.toLowerCase().includes(q)) return false;
        return true;
      });
      if (roles.length) groups.push({ team: group.team, roles, totalRoles: roles.length });
    }
    return groups;
  }, [params, criteria, savedScope, appliedScope, savedRoleUids, appliedRoleUids]);

  const visibleGroups = useMemo<IJobTeamGroup[]>(() => {
    const groups = [...railGroups];
    if (sort === 'company_az') groups.sort((a, b) => a.team.name.localeCompare(b.team.name));
    else if ((sort as string) === 'company_za') groups.sort((a, b) => b.team.name.localeCompare(a.team.name));
    else {
      const newest = (g: IJobTeamGroup) => Math.max(...g.roles.map((r) => new Date(getJobDate(r)).getTime()));
      groups.sort((a, b) => newest(b) - newest(a));
    }
    const plIndex = groups.findIndex(isProtocolLabsGroup);
    if (plIndex > 0) {
      const [pl] = groups.splice(plIndex, 1);
      groups.unshift(pl);
    }
    return groups;
  }, [railGroups, sort]);

  const plGroup = visibleGroups.length > 1 && isProtocolLabsGroup(visibleGroups[0]) ? visibleGroups[0] : null;
  const networkGroups = plGroup ? visibleGroups.slice(1) : visibleGroups;
  const totalRoles = visibleGroups.reduce((sum, g) => sum + g.totalRoles, 0);
  const totalGroups = visibleGroups.length;

  const teamForRole = (role: IJobRole) => MOCK_JOB_GROUPS.find((g) => g.roles.some((r) => r.uid === role.uid))?.team;

  const onViewJob = (role: IJobRole) => {
    const team = teamForRole(role);
    if (!team) return;
    setFlow({ role, team });
    setFlowStep('review');
  };
  const closeFlow = () => {
    setFlow(null);
    setFlowStep('review');
  };
  const onSubmitApplication = () => {
    if (!flow) return;
    const { role, team } = flow;
    setApplications((prev) => new Map(prev).set(role.uid, { appliedAt: new Date().toISOString() }));
    closeFlow();
    toast.success(`Applied to ${role.roleTitle} at ${team.name}. Your profile went with your note.`);
  };

  const jumpToSaved = () => setParam(SCOPE_PARAM, SCOPE_SAVED);
  const onToggleSave = (role: IJobRole) => {
    const nowSaved = saved.toggle(role.uid, 'job');
    if (nowSaved) onSaved(jumpToSaved);
  };

  const titleBlock = (
    <h1 className={contentCss.title}>
      Job Board{' '}
      <span className={contentCss.titleCount}>
        (<strong className={jb.titleCountRoles}>{`${totalRoles} ${totalRoles === 1 ? 'role' : 'roles'}`}</strong> across{' '}
        {totalGroups} {totalGroups === 1 ? 'team' : 'teams'})
      </span>
    </h1>
  );

  const renderGroupCard = (group: IJobTeamGroup) => (
    <JobTeamGroupCard
      key={group.team.uid}
      group={group}
      newsVariant="count"
      onViewJob={onViewJob}
      appliedRoleUids={appliedRoleUids}
      appliedAtByRole={appliedAtByRole}
      savedRoleUids={savedRoleUids}
      savedAtByRole={savedAtByRole}
      onToggleSave={onToggleSave}
    />
  );

  /* Three empty states, one per reason to be here. The two scoped ones say
     what the tab holds and point back at the roles; only the filtered case is
     a dead end you narrowed into, so only it gets "try clearing some". */
  const empty = savedScope ? (
    <>
      You haven&apos;t saved any roles yet. Roles you bookmark collect here, so you can come back to them.{' '}
      <button type="button" className={jb.emptyLink} onClick={() => setParam(SCOPE_PARAM, undefined)}>
        Browse all roles
      </button>
    </>
  ) : appliedScope ? (
    <>
      You haven&apos;t applied to anything yet. Roles you apply to collect here, so you can see what you&apos;ve already
      gone for.{' '}
      <button type="button" className={jb.emptyLink} onClick={() => setParam(SCOPE_PARAM, undefined)}>
        Browse all roles
      </button>
    </>
  ) : (
    <>No roles match your filters. Try clearing some.</>
  );

  const content = (
    <div className={contentCss.root}>
      <div className={`${contentCss.mobileHeader} ${jb.mobileHeaderWrap}`}>{titleBlock}</div>
      <div className={contentCss.mobileFilters}>
        <JobBoardMobileFilters />
      </div>

      <div className={contentCss.toolbar}>
        <div className={contentCss.titleGroup}>{titleBlock}</div>
        <div className={jb.toolbarActions}>
          <SortDropdown
            options={JOBS_SORT_OPTIONS}
            currentSort={sort}
            onSortChange={(value) => setParam('sort', value === 'newest' ? undefined : value)}
            sortByLabel="Sort by:"
          />
        </div>
      </div>

      {/* All · Saved · Applied — the board's strip with its new middle. */}
      <div className={`${jb.scopeTabs} ${sp.scopeTabs}`}>
        <JobBoardScopeTabs appliedCount={appliedRoleUids.size} savedCount={saved.countOf('job')} />
      </div>

      {visibleGroups.length === 0 ? (
        <div className={jb.emptyStack}>
          <div className={jb.empty}>{empty}</div>
        </div>
      ) : plGroup ? (
        <div className={jb.boardSections}>
          <section className={jb.boardSection} aria-labelledby="saving-board-section-pl">
            <h2 id="saving-board-section-pl" className={jb.boardSectionLabel}>
              From Protocol Labs
            </h2>
            <div className={contentCss.list}>{renderGroupCard(plGroup)}</div>
          </section>
          <section className={jb.boardSection} aria-labelledby="saving-board-section-network">
            <h2 id="saving-board-section-network" className={jb.boardSectionLabel}>
              Across the network
            </h2>
            <div className={contentCss.list}>{networkGroups.map(renderGroupCard)}</div>
          </section>
        </div>
      ) : (
        <div className={contentCss.list}>{visibleGroups.map(renderGroupCard)}</div>
      )}
    </div>
  );

  return (
    <>
      <DashboardPagesLayout filters={<JobBoardFilterView />} content={content} />

      <JobApplyFlowDrawer
        open={!!flow}
        onClose={closeFlow}
        role={flow?.role ?? null}
        team={flow?.team ?? null}
        step={flowStep}
        onStepChange={setFlowStep}
        profile={profile}
        onSaveProfile={setProfile}
        onSubmitApplication={onSubmitApplication}
        onCreateAccount={() => {}}
        loggedIn
        onSignIn={() => {}}
        pendingApproval={false}
        applied={flow ? appliedRoleUids.has(flow.role.uid) : false}
        appliedAt={flow ? appliedAtByRole.get(flow.role.uid) : undefined}
      />
    </>
  );
}
