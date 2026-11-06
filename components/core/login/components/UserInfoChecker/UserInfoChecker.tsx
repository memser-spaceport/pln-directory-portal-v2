'use client';

import { useCallback, useEffect, useRef } from 'react';
import { useCookie } from 'react-use';
import Cookies from 'js-cookie';
import { useRouter } from 'next/navigation';
import { usePostHog } from 'posthog-js/react';

import { useMember } from '@/services/members/hooks/useMember';
import { clearAllAuthCookies, clientSessionCookieAttributes, expireSharedCookie } from '@/utils/third-party.helper';
import { authEvents } from '@/components/core/login/utils';
import { broadcastLogout } from '../BroadcastChannel';
import { IUserInfo } from '@/types/shared.types';
import { useCurrentUserStore } from '@/services/auth/store';

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

type MemberRbac = {
  status?: string;
  policies?: { code: string }[];
  effectivePermissions?: { code: string }[];
  roles?: { code: string }[];
};

/**
 * The rbac the cookie keeps: the status and the codes, which is all its readers
 * use. The API's entries also carry names and descriptions, and for a member
 * with many permissions that pushes the cookie past the browser's ~4 KB cap,
 * where the browser drops the write without an error (LAB-2956).
 */
export function compactRbac(rbac: MemberRbac): NonNullable<IUserInfo['rbac']> {
  const codes = (entries: { code: string }[] | undefined) => (entries ?? []).map(({ code }) => ({ code }));
  return {
    status: rbac.status as NonNullable<IUserInfo['rbac']>['status'],
    policies: codes(rbac.policies),
    effectivePermissions: codes(rbac.effectivePermissions),
    roles: codes(rbac.roles),
  };
}

/**
 * UserInfoChecker - Syncs user info between cookie and server
 *
 * This component monitors for changes in user data (access level, name, profile image, roles)
 * and updates cookies accordingly. Also handles rejected access levels by logging out.
 */
export function UserInfoChecker({ uid }: { uid: string }) {
  const [userInfoCookie, setUserInfoCookie] = useCookie('userInfo');
  const { data: member } = useMember(uid);
  const router = useRouter();
  const rejectedRef = useRef(false);
  const postHog = usePostHog();

  const handleLogout = useCallback(async () => {
    await clearAllAuthCookies();
    authEvents.emit('auth:logout');
    broadcastLogout();
    postHog.reset();
  }, [postHog]);

  /**
   * Writes the cookie and the store, then refreshes the server-rendered tree,
   * but only if the browser kept the cookie. A refresh can't see a write the
   * browser dropped, and on a 404 page Next turns router.refresh() into a full
   * reload: refreshing after a dropped write reloaded the page forever, since
   * every reload found the same mismatch (LAB-2956).
   */
  const syncUserInfo = useCallback(
    (next: IUserInfo) => {
      const serialized = JSON.stringify(next);
      expireSharedCookie('userInfo');
      setUserInfoCookie(serialized, clientSessionCookieAttributes());
      useCurrentUserStore.getState().actions.setCurrentUserFromApi(next);
      if (Cookies.get('userInfo') === serialized) {
        router.refresh();
      }
    },
    [router, setUserInfoCookie],
  );

  useEffect(() => {
    if (!userInfoCookie || !member?.memberInfo) {
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
    const memberPermissionCodes = memberPermissions?.map((p: { code: string }) => p.code) ?? [];

    // Compare the CURRENT COOKIE against API data (not the server-rendered prop).
    // The server prop is stale until router.refresh() runs, so using it here would
    // cause a permanent loop. The cookie is the ground truth: once it matches the API,
    // there is nothing left to do in this block.
    const cookieRbac = parsedCookie.rbac as typeof memberInfo.rbac | undefined | null;
    // A missing list and an empty one are the same: compactRbac stores [] for
    // either, and treating them as different would rewrite the cookie forever.
    const cookiePermCodes = cookieRbac?.effectivePermissions?.map((p: { code: string }) => p.code) ?? [];
    const cookieRbacChanged =
      cookieRbac?.status !== memberInfo.rbac?.status || !areRolesEqual(cookiePermCodes, memberPermissionCodes);

    if (cookieRbacChanged) {
      syncUserInfo({ ...(parsedCookie as IUserInfo), rbac: compactRbac(memberInfo.rbac) });
      return;
    }

    // Handle rejected access level
    if (memberInfo?.rbac?.status === 'REJECTED' && !rejectedRef.current) {
      rejectedRef.current = true;
      // handleLogout();
      authEvents.emit('auth:invalid-email', 'rejected_access_level');
      return;
    }

    // Handle roles changes
    const serverRoles = memberInfo.memberRoles?.map((r: { name: string }) => r.name) || [];
    if (!areRolesEqual(serverRoles, parsedCookie.roles as [])) {
      syncUserInfo({ ...(parsedCookie as IUserInfo), roles: serverRoles });
      return;
    }

    // Handle leading teams changes
    const serverLeadingTeams = getLeadingTeamIds(memberInfo.teamMemberRoles);
    const cookieLeadingTeams = (parsedCookie.leadingTeams as string[]) ?? [];
    const leadingTeamsChanged =
      serverLeadingTeams.length !== cookieLeadingTeams.length ||
      serverLeadingTeams.some((teamUid) => !cookieLeadingTeams.includes(teamUid));

    if (leadingTeamsChanged) {
      syncUserInfo({ ...(parsedCookie as IUserInfo), leadingTeams: serverLeadingTeams });
      return;
    }

    // Handle name or profile image changes
    if (memberInfo.name !== parsedCookie.name || memberInfo.imageUrl !== parsedCookie.profileImageUrl) {
      syncUserInfo({ ...(parsedCookie as IUserInfo), name: memberInfo.name, profileImageUrl: memberInfo.imageUrl });
    }
  }, [member, syncUserInfo, userInfoCookie]);

  return null;
}
