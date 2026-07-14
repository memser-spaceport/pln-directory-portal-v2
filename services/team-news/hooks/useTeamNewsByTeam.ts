'use client';

import { useMemo } from 'react';
import { keepPreviousData, useInfiniteQuery } from '@tanstack/react-query';

import type { ITeamNewsByTeamResponse, ITeamNewsItem } from '@/types/team-news.types';
import { getCookiesFromClient } from '@/utils/third-party.helper';

import { fetchTeamNewsByTeam } from '../team-news.service';
import { TeamNewsQueryKeys, TEAM_NEWS_MODAL_PAGE_SIZE } from '../constants';
import { getTeamNewsByTeamNextPageParam } from '../team-news.utils';

interface UseTeamNewsByTeamInfiniteOptions {
  teamUid: string;
  q?: string;
  enabled?: boolean;
  limit?: number;
}

export function useTeamNewsByTeamInfinite({
  teamUid,
  q,
  enabled = true,
  limit = TEAM_NEWS_MODAL_PAGE_SIZE,
}: UseTeamNewsByTeamInfiniteOptions) {
  const search = q?.trim() ?? '';

  const query = useInfiniteQuery<ITeamNewsByTeamResponse>({
    queryKey: [TeamNewsQueryKeys.BY_TEAM, teamUid, search, limit],
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      // Pass the viewer's token so `viewerHasUpvoted` reflects them, not the
      // anonymous view (the server rail fetch does the same via page.tsx).
      fetchTeamNewsByTeam(
        teamUid,
        {
          page: pageParam as number,
          limit,
          q: search || undefined,
        },
        getCookiesFromClient().authToken,
      ).then((data) => {
        if (!data) {
          throw new Error('Failed to fetch team news');
        }
        return data;
      }),
    getNextPageParam: getTeamNewsByTeamNextPageParam,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
    placeholderData: keepPreviousData,
    enabled: enabled && !!teamUid,
  });

  const items: ITeamNewsItem[] = useMemo(() => query.data?.pages.flatMap((page) => page.items) ?? [], [query.data]);

  const total = query.data?.pages[0]?.total ?? 0;

  return { ...query, items, total };
}
