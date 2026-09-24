'use client';

import { useMemo } from 'react';

import type { ITeamMemberRole } from '@/types/members.types';
import { useMember } from '@/services/members/hooks/useMember';

export function useMemberTeamUids(memberUid: string | undefined): Set<string> {
  const { data } = useMember(memberUid);
  const member = data && 'memberInfo' in data ? data.memberInfo : null;
  const teamMemberRoles: ITeamMemberRole[] | undefined = member?.teamMemberRoles;

  return useMemo(
    () => new Set(teamMemberRoles?.flatMap((teamMemberRole) => teamMemberRole.team?.uid ?? []) ?? []),
    [teamMemberRoles],
  );
}
