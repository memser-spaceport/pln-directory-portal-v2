'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';

import { TEAM_NEWS_PREVIEW_LIMIT, TeamNewsQueryKeys } from '@/services/team-news/constants';
import { fetchTeamNewsByTeam } from '@/services/team-news/team-news.service';
import type { ITeamNewsByTeamResponse } from '@/types/team-news.types';
import { getCookiesFromClient } from '@/utils/third-party.helper';

import { MOCK_MEMBER_TEAM_NEWS, buildMockMemberTeamNews } from '../mockMemberTeamNews';

interface UseMemberTeamNewsOptions {
  teamUid: string | null;
  teamName: string;
  /** False for viewers who can't see the Teams section this card sits under. */
  enabled: boolean;
  /** In the key so a sign-in on this very page can't reuse the anonymous entry. */
  viewerUid?: string;
}

/**
 * Page 1 / 3 latest stories for a member's primary team.
 *
 * A plain useQuery rather than useTeamNewsByTeamInfinite: this card never
 * paginates, so getNextPageParam/keepPreviousData buy nothing — but the two
 * settings that DO matter are copied from it deliberately, see below.
 */
export function useMemberTeamNews({ teamUid, teamName, enabled, viewerUid }: UseMemberTeamNewsOptions) {
  const mocking = MOCK_MEMBER_TEAM_NEWS && !!teamUid;

  const query = useQuery<ITeamNewsByTeamResponse>({
    // Auth identity is IN the key. The team profile's rail keys on
    // [BY_TEAM, teamUid, search, limit] and gets away with it because it is
    // seeded from SSR and never refetches for a different viewer. Here the
    // reader can sign in ON THIS PAGE (the modal's guest gate pushes #login);
    // without the viewer in the key, the anonymous entry would be reused and the
    // modal would show viewerHasUpvoted:false for a story they already liked.
    queryKey: [TeamNewsQueryKeys.BY_TEAM, teamUid, 'member-profile', viewerUid ?? 'anon'],
    queryFn: () =>
      // The fetcher swallows every failure into `null`, which React Query would
      // cache as a successful empty result — throw so it retries and so the card
      // treats a broken API the same as "no news" only after trying.
      fetchTeamNewsByTeam(
        teamUid as string,
        { page: 1, limit: TEAM_NEWS_PREVIEW_LIMIT },
        getCookiesFromClient().authToken,
      ).then((data) => {
        if (!data) {
          throw new Error('Failed to fetch team news');
        }
        return data;
      }),
    // Gate the WORK: most profiles resolve no primary team, and those should
    // never mount a request at all. Mocking disables it too, so the fixture
    // can't be overwritten by a real response landing later.
    enabled: enabled && !!teamUid && !mocking,
    staleTime: 30_000,
    // A refetch that drops the open story out of the top 3 would otherwise pull
    // it out from under a reader who tabbed away to the source and came back.
    // TeamNewsDetails also holds the opened item itself for the same reason.
    refetchOnWindowFocus: false,
  });

  // Built once per team rather than per render: the fixture stamps relative
  // dates, so rebuilding it would hand the modal a fresh `item` object (and
  // drifting timestamps) on every render.
  const mockData = useMemo(
    () => (mocking ? buildMockMemberTeamNews(teamUid as string, teamName || 'Mock Team') : undefined),
    [mocking, teamUid, teamName],
  );

  if (mockData) {
    return { data: mockData, isPending: false };
  }

  return { data: query.data, isPending: query.isPending };
}
