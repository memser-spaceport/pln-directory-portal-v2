import { useMemo } from 'react';

import { IMember } from '@/types/members.types';
import { useAllMembers } from '@/services/members/hooks/useAllMembers';
import { getDefaultAvatar } from '@/hooks/useDefaultAvatar';
import { MemberOption } from '../components/MemberMultiSelect';

interface Input {
  members: IMember[];
}

export function useGetMemberOptions(input: Input) {
  const { members } = input;

  const { data: allMembersResponse } = useAllMembers();

  const existingMemberUids = useMemo(() => new Set(members.map((m) => m.id)), [members]);

  const options: MemberOption[] = useMemo(() => {
    const allMembers = allMembersResponse?.data ?? [];
    return allMembers
      .filter((m: any) => !existingMemberUids.has(m.uid))
      .map((m: any) => ({
        value: m.uid,
        label: m.name,
        image: m.profile ?? getDefaultAvatar(m.name),
      }));
  }, [allMembersResponse?.data, existingMemberUids]);

  return options;
}
