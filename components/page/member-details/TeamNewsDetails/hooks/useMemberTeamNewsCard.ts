'use client';

import { useMemo } from 'react';

import { TEAM_NEWS_PREVIEW_LIMIT } from '@/services/team-news/constants';
import type { IMember } from '@/types/members.types';
import type { ITeamNewsItem } from '@/types/team-news.types';
import type { IUserInfo } from '@/types/shared.types';

import { resolvePrimaryTeam } from '../../utils/resolvePrimaryTeam';
import { useMemberTeamNews } from './useMemberTeamNews';

interface UseMemberTeamNewsCardArgs {
  /** Nullable: the page calls this before its own `!member` early return. */
  member: IMember | null | undefined;
  isLoggedIn: boolean;
  userInfo: IUserInfo | null;
}

export interface MemberTeamNewsCardState {
  /** Whether the card has anything to show — drives the page's rail gate too. */
  visible: boolean;
  teamUid: string | null;
  teamName: string;
  /** Already sliced to the preview limit. Not overlay-merged; the card does that. */
  items: ITeamNewsItem[];
  total: number;
  hiddenReason: string | null;
}

/**
 * Everything needed to decide whether the card renders, and what's in it.
 *
 * Lifted out of the component because app/members/[id]/page.tsx needs the same
 * answer BEFORE it decides whether to open the right rail at all — the rail is
 * otherwise gated on Affinity/connect state, and a member whose only rail
 * content is news would get no rail. Calling this in both places is free: both
 * calls land on the same React Query entry.
 */
export function useMemberTeamNewsCard({
  member,
  isLoggedIn,
  userInfo,
}: UseMemberTeamNewsCardArgs): MemberTeamNewsCardState {
  const primaryTeam = resolvePrimaryTeam(member);

  // Same gate as the TeamsDetails section (TeamsDetails.tsx:35), so the card
  // never appears without the teams context it continues.
  const isOwner = userInfo?.uid === member?.id;
  const isApprovedUser = userInfo?.rbac?.status === 'APPROVED';
  const canView = isLoggedIn && (isApprovedUser || isOwner);

  const { data } = useMemberTeamNews({
    teamUid: primaryTeam?.uid ?? null,
    teamName: primaryTeam?.name ?? '',
    enabled: canView,
    viewerUid: userInfo?.uid,
  });

  const items = useMemo(() => (data?.items ?? []).slice(0, TEAM_NEWS_PREVIEW_LIMIT), [data?.items]);

  const hiddenReason = !canView
    ? 'viewer failed the Teams auth gate'
    : !primaryTeam
      ? 'no primary team'
      : items.length === 0
        ? 'no news items'
        : null;

  return {
    visible: hiddenReason === null,
    teamUid: primaryTeam?.uid ?? null,
    // The response's name is fresher than the member payload's, which can be
    // served from a cached path and go stale after a team rename.
    teamName: data?.teamName?.trim() || primaryTeam?.name || '',
    items,
    total: data?.total ?? items.length,
    hiddenReason,
  };
}
