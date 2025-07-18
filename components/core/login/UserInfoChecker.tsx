'use client';

import { useCookie } from 'react-use';
import { useCallback, useEffect, useRef } from 'react';
import { useMember } from '@/services/members/hooks/useMember';
import { IUserInfo } from '@/types/shared.types';
import { useRouter } from 'next/navigation';
import { clearAllAuthCookies } from '@/utils/third-party.helper';
import { createLogoutChannel } from '@/components/core/login/broadcast-channel';
import { usePostHog } from 'posthog-js/react';

export const UserInfoChecker = ({ userInfo }: { userInfo: IUserInfo }) => {
  const [userInfoCookie, setUserInfoCookie] = useCookie('userInfo');
  const { data: member } = useMember(userInfo.uid);
  const router = useRouter();
  const rejectedRef = useRef(false);
  const postHogProps = usePostHog();

  const handleLogout = useCallback(() => {
    clearAllAuthCookies();
    document.dispatchEvent(new CustomEvent('init-privy-logout'));
    createLogoutChannel().postMessage('logout');
    postHogProps.reset();
  }, [postHogProps]);

  useEffect(() => {
    if (!userInfoCookie || !userInfo || !member?.memberInfo) {
      return;
    }

    if (member.memberInfo.accessLevel !== userInfo.accessLevel) {
      try {
        const _userInfo = JSON.parse(userInfoCookie);

        if (_userInfo.uid === member?.memberInfo.uid) {
          setUserInfoCookie(JSON.stringify({ ..._userInfo, accessLevel: member.memberInfo.accessLevel }), {
            domain: process.env.COOKIE_DOMAIN || '',
          });
          router.refresh();
        }
      } catch (e) {
        console.error('Failed to parse userInfo cookie: ', e);
      }
    } else if (member.memberInfo.accessLevel === 'Rejected' && !rejectedRef.current) {
      rejectedRef.current = true;
      handleLogout();
    } else if (member.memberInfo.name !== userInfo.name || member.memberInfo.imageUrl !== userInfo.profileImageUrl) {
      try {
        const _userInfo = JSON.parse(userInfoCookie);

        if (_userInfo.uid === member?.memberInfo.uid) {
          setUserInfoCookie(JSON.stringify({ ..._userInfo, name: member.memberInfo.name, profileImageUrl: member.memberInfo.imageUrl }), {
            domain: process.env.COOKIE_DOMAIN || '',
          });
          router.refresh();
        }
      } catch (e) {
        console.error('Failed to parse userInfo cookie: ', e);
      }
    }
  }, [handleLogout, member, router, setUserInfoCookie, userInfo, userInfoCookie]);

  return null;
};
