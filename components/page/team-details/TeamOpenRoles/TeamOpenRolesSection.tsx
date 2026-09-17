'use client';

import { useCallback, useMemo } from 'react';

import type { IJobTeamGroup } from '@/types/jobs.types';
import type { IUserInfo } from '@/types/shared.types';
import { SHOW_JOB_BOARD_APPLY, SHOW_TEAM_APPLICANTS } from '@/services/jobs/constants';
import { useApplicantCounts } from '@/services/jobs/hooks/useTeamApplicants';
import { useJobApplySurface } from '@/components/page/jobs/hooks/useJobApplySurface';
import { canReadApplicants } from '@/components/page/team-details/TeamApplicants/canReadApplicants';

import { RoleApplicantsLine } from './components/RoleApplicantsLine';
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

  const teamUid = group?.team.uid ?? '';
  /**
   * The applicants count line, for a lead of this team (or an admin).
   *
   * The same rule the applicants page redirects on, asked here so the line and
   * the page it opens can never disagree — a line offering a page the viewer
   * gets bounced off is the specific way two copies of this would drift.
   *
   * It gates the QUERY, not just the render. Every applicants read is
   * authenticated, and `customFetch` answers a missing session by logging out
   * and reloading — so an ungated one on a team profile, which is a public
   * page, would be a reload loop for every signed-out visitor.
   */
  const canReadApplicantCounts = canReadApplicants({
    flagOn: SHOW_TEAM_APPLICANTS,
    isLoggedIn,
    userInfo,
    teamId: teamUid,
  });

  const { data: counts } = useApplicantCounts({
    teamUid,
    viewerUid: userInfo?.uid,
    enabled: canReadApplicantCounts,
  });

  /* `useCallback`, because `TeamOpenRoles` is memoized so that typing a cover
     letter in the apply drawer — whose state lives in this host — does not
     re-render every visible row. An inline function would hand it a new prop on
     every keystroke and undo exactly that. */
  const renderRoleFooter = useCallback(
    (roleUid: string) =>
      canReadApplicantCounts ? (
        <RoleApplicantsLine
          teamId={teamUid}
          roleUid={roleUid}
          count={counts?.find((count) => count.roleUid === roleUid)}
        />
      ) : null,
    [canReadApplicantCounts, teamUid, counts],
  );

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
    source: 'team-profile',
    isLoggedIn,
    userInfo,
    groups,
    // Server-rendered: the roles arrive with the page, so there is nothing to wait for.
    isLoading: false,
    /* No `?job=` here. Share links already point at `/jobs/openings/[uid]`.
       Writing the param onto `/teams/[id]` would make the URL someone sees
       and the URL they can send disagree. */
    deepLink: false,
  });

  return (
    <>
      {group && (
        <TeamOpenRoles
          group={group}
          userInfo={userInfo}
          apply={surface.applyProps}
          renderRoleFooter={canReadApplicantCounts ? renderRoleFooter : undefined}
        />
      )}
      {surface.controller}
    </>
  );
}
