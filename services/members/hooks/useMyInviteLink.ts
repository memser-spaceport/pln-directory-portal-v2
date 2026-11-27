import { useQuery } from '@tanstack/react-query';

import { MembersQueryKeys } from '@/services/members/constants';
import { getMyInviteLink } from '@/services/members/invite-link.service';

/**
 * The signed-in member's invite link for Settings → Invite (LAB-3398).
 * `enabled` stays false for a signed-out viewer, because `customFetch(..., true)` signs out with no session.
 */
export function useMyInviteLink(uid: string | undefined) {
  return useQuery({
    queryKey: [MembersQueryKeys.GET_MY_INVITE_LINK, uid],
    queryFn: getMyInviteLink,
    enabled: !!uid,
    staleTime: Infinity,
    retry: 1,
  });
}
