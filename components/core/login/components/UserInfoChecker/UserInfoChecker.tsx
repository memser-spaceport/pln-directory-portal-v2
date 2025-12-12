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

    // Handle access level changes
    if (memberInfo.accessLevel !== userInfo.accessLevel) {
      try {
        const parsedCookie = JSON.parse(userInfoCookie);

        if (parsedCookie.uid === memberInfo.uid) {
          setUserInfoCookie(JSON.stringify({ ...parsedCookie, accessLevel: memberInfo.accessLevel }), {
            domain: process.env.COOKIE_DOMAIN || '',
          });
          router.refresh();
        }
      } catch (e) {
        console.error('Failed to parse userInfo cookie:', e);
      }
      return;
    }

    // Handle rejected access level
    if (memberInfo.accessLevel === 'Rejected' && !rejectedRef.current) {
      rejectedRef.current = true;
      handleLogout();
      return;
    }

    // Handle roles changes
    const serverRoles = memberInfo.memberRoles?.map((r: { name: string }) => r.name) || [];
    if (!areRolesEqual(serverRoles, userInfo.roles)) {
      try {
        const parsedCookie = JSON.parse(userInfoCookie);

        if (parsedCookie.uid === memberInfo.uid) {
          setUserInfoCookie(JSON.stringify({ ...parsedCookie, roles: serverRoles }), {
            domain: process.env.COOKIE_DOMAIN || '',
          });
          router.refresh();
        }
      } catch (e) {
        console.error('Failed to parse userInfo cookie:', e);
      }
      return;
    }

    // Handle name or profile image changes
    if (memberInfo.name !== userInfo.name || memberInfo.imageUrl !== userInfo.profileImageUrl) {
      try {
        const parsedCookie = JSON.parse(userInfoCookie);

        if (parsedCookie.uid === memberInfo.uid) {
          setUserInfoCookie(
            JSON.stringify({
              ...parsedCookie,
              name: memberInfo.name,
              profileImageUrl: memberInfo.imageUrl,
            }),
            { domain: process.env.COOKIE_DOMAIN || '' }
          );
          router.refresh();
        }
      } catch (e) {
        console.error('Failed to parse userInfo cookie:', e);
      }
    }
  }, [handleLogout, member, router, setUserInfoCookie, userInfo, userInfoCookie]);

  return null;
}
