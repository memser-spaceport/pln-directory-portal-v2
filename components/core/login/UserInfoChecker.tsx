'use client';

import { useCookie } from 'react-use';
import { useEffect } from 'react';
import { useMember } from '@/services/members/hooks/useMember';
import { IUserInfo } from '@/types/shared.types';
import { useRouter } from 'next/navigation';

export const UserInfoChecker = ({ userInfo }: { userInfo: IUserInfo }) => {
  const [userInfoCookie, setUserInfoCookie] = useCookie('userInfo');
  const { data: member } = useMember(userInfo.uid);
  const router = useRouter();

  useEffect(() => {
    if (userInfoCookie && userInfo && member && member.memberInfo.accessLevel !== userInfo.accessLevel) {
      try {
        const _userInfo = JSON.parse(userInfoCookie);

        if (_userInfo.uid === member.memberInfo.uid) {
          setUserInfoCookie(JSON.stringify({ ..._userInfo, accessLevel: member.memberInfo.accessLevel }));
          router.refresh();
        }
      } catch (e) {
        console.error('Failed to parse userInfo cookie: ', e);
      }
    }
  }, [member, router, setUserInfoCookie, userInfo, userInfoCookie]);

  return null;
};
