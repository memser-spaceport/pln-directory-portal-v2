'use client';

import { useCallback, useEffect, useRef } from 'react';
import { useCookie } from 'react-use';
import { useRouter } from 'next/navigation';
import { usePostHog } from 'posthog-js/react';

import { useMember } from '@/services/members/hooks/useMember';
import { clearAllAuthCookies } from '@/utils/third-party.helper';
import { authEvents } from '@/components/core/login/utils';
import { broadcastLogout } from '../BroadcastChannel';
import { IUserInfo } from '@/types/shared.types';

interface UserInfoCheckerProps {
  userInfo: IUserInfo;
}

type TeamMemberRoleLike = {
  teamLead?: boolean;
  team?: { uid?: string | null } | null;
  teamUid?: string | null;
};

/**
 * Compares two arrays of roles for equality (order-independent)
 */
function areRolesEqual(roles1: string[] | undefined, roles2: string[] | undefined): boolean {
  if (!roles1 && !roles2) return true;
  if (!roles1 || !roles2) return false;
  if (roles1.length !== roles2.length) return false;
  const sorted1 = [...roles1].sort();
  const sorted2 = [...roles2].sort();
  return sorted1.every((role, index) => role === sorted2[index]);
}

function getLeadingTeamIds(teamMemberRoles: TeamMemberRoleLike[] | undefined): string[] {
  return Array.from(
    new Set(
      (teamMemberRoles ?? [])
        .filter((teamMemberRole) => teamMemberRole.teamLead)
        .map((teamMemberRole) => teamMemberRole.team?.uid || teamMemberRole.teamUid)
        .filter((teamUid): teamUid is string => Boolean(teamUid)),
    ),
  );
}

/**
 * UserInfoChecker - Syncs user info between cookie and server
 *
 * This component monitors for changes in user data (access level, name, profile image, roles)
 * and updates cookies accordingly. Also handles rejected access levels by logging out.
 */
export function UserInfoChecker({ userInfo }: UserInfoCheckerProps) {
  const [userInfoCookie, setUserInfoCookie] = useCookie('userInfo');
  const { data: member } = useMember(userInfo.uid);
  const router = useRouter();
  const rejectedRef = useRef(false);
  const postHog = usePostHog();

  const handleLogout = useCallback(() => {
    clearAllAuthCookies();
    authEvents.emit('auth:logout');
    broadcastLogout();
    postHog.reset();
  }, [postHog]);

  useEffect(() => {
    if (!userInfoCookie || !userInfo || !member?.memberInfo) {
      return;
    }

    const memberInfo = member.memberInfo;

    let parsedCookie: Record<string, unknown>;
    try {
      parsedCookie = JSON.parse(userInfoCookie);
    } catch {
      return;
    }

    if (parsedCookie.uid !== memberInfo.uid) return;

    const memberPermissions = memberInfo.rbac.effectivePermissions;
    const memberPermissionCodes = memberPermissions?.map((p: { code: string }) => p.code);

    // Compare the CURRENT COOKIE against API data (not the server-rendered prop).
    // The server prop is stale until router.refresh() runs, so using it here would
    // cause a permanent loop. The cookie is the ground truth: once it matches the API,
    // there is nothing left to do in this block.
    const cookieRbac = parsedCookie.rbac as typeof memberInfo.rbac | undefined | null;
    const cookiePermCodes = cookieRbac?.effectivePermissions?.map((p: { code: string }) => p.code);
    const cookieRbacChanged =
      cookieRbac?.status !== memberInfo.rbac?.status || !areRolesEqual(cookiePermCodes, memberPermissionCodes);

    if (cookieRbacChanged) {
      setUserInfoCookie(JSON.stringify({ ...parsedCookie, rbac: memberInfo.rbac }), {
        domain: process.env.COOKIE_DOMAIN || '',
      });
      router.refresh();
      return;
    }

    // Handle rejected access level
    if (memberInfo.rbac.status === 'REJECTED' && !rejectedRef.current) {
      rejectedRef.current = true;
      // handleLogout();
      authEvents.emit('auth:invalid-email', 'rejected_access_level');
      return;
    }

    // Handle roles changes
    const serverRoles = memberInfo.memberRoles?.map((r: { name: string }) => r.name) || [];
    if (!areRolesEqual(serverRoles, userInfo.roles)) {
      setUserInfoCookie(JSON.stringify({ ...parsedCookie, roles: serverRoles }), {
        domain: process.env.COOKIE_DOMAIN || '',
      });
      router.refresh();
      return;
    }

    // Handle leading teams changes
    const serverLeadingTeams = getLeadingTeamIds(memberInfo.teamMemberRoles);
    const cookieLeadingTeams = userInfo.leadingTeams ?? [];
    const leadingTeamsChanged =
      serverLeadingTeams.length !== cookieLeadingTeams.length ||
      serverLeadingTeams.some((teamUid) => !cookieLeadingTeams.includes(teamUid));

    if (leadingTeamsChanged) {
      setUserInfoCookie(JSON.stringify({ ...parsedCookie, leadingTeams: serverLeadingTeams }), {
        domain: process.env.COOKIE_DOMAIN || '',
      });
      router.refresh();
      return;
    }

    // Handle name or profile image changes
    if (memberInfo.name !== userInfo.name || memberInfo.imageUrl !== userInfo.profileImageUrl) {
      setUserInfoCookie(
        JSON.stringify({ ...parsedCookie, name: memberInfo.name, profileImageUrl: memberInfo.imageUrl }),
        { domain: process.env.COOKIE_DOMAIN || '' },
      );
      router.refresh();
    }
  }, [handleLogout, member, router, setUserInfoCookie, userInfo, userInfoCookie]);

  return null;
}
