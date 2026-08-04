'use client';

import { useMemo } from 'react';

import { useCurrentUserStore } from '@/services/auth/store';
import { useMember } from '@/services/members/hooks/useMember';

import { Referrer } from '../types';

/**
 * Whoever is signing the referral.
 *
 * The name comes from the hydrated session (`useCurrentUserStore`, filled from the
 * `userInfo` cookie in the root layout). The role doesn't travel in that cookie —
 * `IUserInfo` carries `name` and `mainTeamName` but no title — so `useMember` fetches
 * the member record behind the same uid for it. Signed out there is no referrer at all,
 * and the note simply goes unsigned.
 */
export function useReferrer(): Referrer | null {
  const currentUser = useCurrentUserStore((state) => state.currentUser);
  const { data } = useMember(currentUser?.uid);

  return useMemo(() => {
    if (!currentUser?.name) return null;

    const info: any = (data as any)?.memberInfo;
    const roles = info?.teamMemberRoles ?? [];
    const mainRole = roles.find((role: any) => role?.mainTeam) ?? roles[0];

    return {
      name: currentUser.name,
      title: mainRole?.role ?? '',
      // The session already knows the team in the common case; the member record covers
      // sessions whose cookie predates that field.
      team: currentUser.mainTeamName || mainRole?.teamTitle || mainRole?.team?.name || '',
    };
    // The store hands back a stable `currentUser` object, so depending on it whole is
    // no worse than picking fields off it — and it's what the compiler can verify.
  }, [currentUser, data]);
}
