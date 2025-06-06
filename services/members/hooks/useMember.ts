import { useQuery } from '@tanstack/react-query';
import { MembersQueryKeys } from '@/services/members/constants';
import { getMemberInfo } from '@/services/members.service';
import { getMemberPreferences } from '@/services/preferences.service';
import { getCookiesFromClient } from '@/utils/third-party.helper';

async function fetcher(uid: string | undefined) {
  if (!uid) {
    return;
  }

  const { authToken } = getCookiesFromClient();

  if (!authToken) {
    throw new Error('Cannot get auth token');
  }

  const memberInfo = await getMemberInfo(uid);
  if (memberInfo.isError) {
    return {
      isError: true,
    };
  }

  return {
    memberInfo: memberInfo.data,
  };
}

export function useMember(uid: string | undefined) {
  return useQuery({
    queryKey: [MembersQueryKeys.GET_MEMBER, uid],
    queryFn: () => fetcher(uid),
    enabled: Boolean(uid),
  });
}
