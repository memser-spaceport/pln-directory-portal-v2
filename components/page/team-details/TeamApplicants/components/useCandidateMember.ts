'use client';

import { useQuery } from '@tanstack/react-query';

import { useCurrentUserStore } from '@/services/auth/store';
import { MembersQueryKeys } from '@/services/members/constants';
import { getMember } from '@/services/members.service';
import { isAdminUser } from '@/utils/user/isAdminUser';

/**
 * The member as `/members/[id]` shows them. The same key and the same call the
 * member page and the investor drawer make, so a profile already read elsewhere
 * in this session is a cache hit — and the Suggested tab's bar, which reads the
 * address for its Email press, shares this one fetch with the pane under it.
 */
export function useCandidateMember(memberUid: string, isLoggedIn: boolean) {
  const { currentUser: userInfo } = useCurrentUserStore();
  const isAdmin = isAdminUser(userInfo);

  return useQuery({
    queryKey: [MembersQueryKeys.GET_MEMBER, memberUid, isLoggedIn, userInfo?.uid],
    queryFn: () =>
      getMember(
        memberUid,
        { with: 'image,skills,location,teamMemberRoles.team' },
        isLoggedIn,
        userInfo,
        !isAdmin,
        true,
      ),
    enabled: !!memberUid,
    select: (data) => data?.data?.formattedData,
  });
}
