'use client';

import { useMemo } from 'react';

import type { IJobTeamGroup } from '@/types/jobs.types';
import type { IUserInfo } from '@/types/shared.types';
import { SHOW_JOB_BOARD_APPLY, SHOW_JOB_BOARD_INTEREST } from '@/services/jobs/constants';
import { useJobApplySurface } from '@/components/page/jobs/hooks/useJobApplySurface';

import { TeamOpenRoles } from './TeamOpenRoles';

interface TeamOpenRolesSectionProps {
  /** `null` when this team isn't hiring — the section stays absent, the host does not. */
  group: IJobTeamGroup | null;
  isLoggedIn: boolean;
  userInfo: IUserInfo | undefined;
}

/**
 * Host for the team profile's open roles: owns the apply flow, renders the list.
 *
 * **It mounts whether or not the team has roles, and that is the whole point.**
 * The list is gated three times over — the page's `openRoles &&`, the selector's
 * team-uid check, the section's own empty guard — and step 2 of the apply drawer
 * composes the real member-profile sections, every one of which calls
 * `router.refresh()` on save. On `/teams/[id]` that re-runs the page's server
 * fetch, jobs call included. So a member editing their profile *inside the
 * drawer* can flip the gate that renders the drawer. Owning the flow above the
 * gate is what keeps a cover letter from vanishing on a successful save.
 *
 * The same placement is what lets a sign-up round trip land: the resume effect
 * has to be able to strip `?applyTo=` even when the role it named is gone.
 *
 * The board reaches the same hook from `JobsContent`; it is one pipeline with two
 * hosts, so the two surfaces cannot drift the way they did before.
 */
export function TeamOpenRolesSection({ group, isLoggedIn, userInfo }: TeamOpenRolesSectionProps) {
  const groups = useMemo(() => (group ? [group] : []), [group]);

  const surface = useJobApplySurface({
    /* The flag, and nothing else. Narrowing this to "teams that have roles" was
       tried and reverted: it makes the flow switch off at exactly the moment
       `group` goes null, which is the moment this host was hoisted above the
       gate to survive — and it strands a returning sign-up on a team whose last
       role closed, leaving `?applyTo=` in the address bar forever. It also
       bought little. `useJobBoardViewer` issues nothing at all while logged out,
       and for a member it is one `[GET_MEMBER, uid]` query the rest of the app
       already shares. */
    enabled: SHOW_JOB_BOARD_APPLY,
    /* Same drawer, same banner — this host renders the identical controller, so
       withholding the flag here would make the feature exist on one surface and
       not the other for no reason a reader could name. */
    interestEnabled: SHOW_JOB_BOARD_INTEREST,
    source: 'team-profile',
    isLoggedIn,
    userInfo,
    groups,
    // Server-rendered: the roles arrive with the page, so there is nothing to wait for.
    isLoading: false,
    /* No `?job=` here. `jobDetailPath` is `/jobs?job=<uid>`, so sharing from this
       page already points at the board — a destination that works. Writing the
       param onto `/teams/[id]` without changing that would make the URL someone
       sees and the URL they can send disagree. */
    deepLink: false,
  });

  return (
    <>
      {group && <TeamOpenRoles group={group} userInfo={userInfo} apply={surface.applyProps} />}
      {surface.controller}
    </>
  );
}
