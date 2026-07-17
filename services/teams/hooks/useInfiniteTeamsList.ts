import { useEffect, useMemo } from 'react';
import { toast } from '@/components/core/ToastContainer';
import { InfiniteData, useInfiniteQuery } from '@tanstack/react-query';
import { ITEMS_PER_PAGE, TOAST_MESSAGES } from '@/utils/constants';
import { TeamsListQueryParams } from '@/services/teams/types';
import { TeamsQueryKeys } from '@/services/teams/constants';
import { ITeam } from '@/types/teams.types';
import { getTeamList } from '@/app/actions/teams.actions';
import qs from 'qs';
import { getCookiesFromClient } from '@/utils/third-party.helper';

const toPriorityValues = (val: string | undefined) =>
  (val ?? '')
    ?.split('|')
    .filter(Boolean)
    .map((v) => (v === '-1' ? '99' : v));

async function infiniteFetcher(searchParams: TeamsListQueryParams['searchParams'], page: number) {
  const { authToken } = getCookiesFromClient();
  const query = qs.stringify({
    ...searchParams,
    sort: searchParams.sort?.split(',').map((s: string) => s.toLowerCase()).join(':'),
    investmentFocus: searchParams.investmentFocus?.split('|').filter(Boolean),
    priorities: toPriorityValues(searchParams.priorities),
  });

  const res = await getTeamList(query, page, ITEMS_PER_PAGE, authToken);

  if (res.isError) {
    throw new Error('Failed to fetch teams list');
  }

  return {
    // getTeamList's formattedData is a deliberately trimmed subset of ITeam (pre-existing
    // behavior); cast at this boundary rather than widening ITeam's required fields.
    items: (res.data ?? []) as unknown as ITeam[],
    total: res.totalItems ?? 0,
    followingTotal: res.followingTotal ?? 0,
  };
}

export type QueryData = {
  total: number;
  items: ITeam[];
  followingTotal: number;
};

export interface UseInfiniteTeamsListResult {
  data: ITeam[];
  total: number;
  followingTotal: number | undefined;
  error: unknown;
  isError: boolean;
  fetchNextPage: () => void;
  hasNextPage: boolean;
  isLoading: boolean;
  isFetchingNextPage: boolean;
  status: 'pending' | 'error' | 'success';
  refetch: () => void;
  isRefetching: boolean;
}

const EMPTY_INITIAL_DATA: Partial<QueryData> = { items: [], total: 0 };

export function useInfiniteTeamsList(
  queryParams: TeamsListQueryParams,
  { initialData }: { initialData?: Partial<QueryData> } = {},
): UseInfiniteTeamsListResult {
  const seed = initialData ?? EMPTY_INITIAL_DATA;

  const {
    isRefetching,
    data,
    error,
    isError,
    fetchNextPage,
    hasNextPage,
    isLoading,
    isFetchingNextPage,
    status,
    refetch,
  } = useInfiniteQuery({
    queryKey: [TeamsQueryKeys.GET_TEAMS_LIST, queryParams.searchParams],
    initialPageParam: 1,
    queryFn: async ({ pageParam = 1 }) => {
      return infiniteFetcher(queryParams.searchParams, pageParam);
    },
    getNextPageParam: (data, allPages, lastPageParam) => {
      return data.items.length < ITEMS_PER_PAGE ? undefined : lastPageParam + 1;
    },
    initialData: seed.items?.length
      ? ({
          pages: [{ items: seed.items, total: seed.total ?? 0, followingTotal: seed.followingTotal ?? 0 }],
          pageParams: [1],
        } as InfiniteData<QueryData, number>)
      : undefined,
    staleTime: 30000,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (isError && error) {
      toast.error(TOAST_MESSAGES.SOMETHING_WENT_WRONG);
    }
  }, [error, isError]);

  const items = useMemo<ITeam[]>(() => data?.pages?.flatMap((page) => page.items) ?? [], [data]);

  return {
    data: items,
    total: data?.pages?.[0]?.total ?? 0,
    followingTotal: data?.pages?.[0]?.followingTotal,
    error,
    isError,
    fetchNextPage,
    hasNextPage,
    isLoading,
    isFetchingNextPage,
    status,
    refetch,
    isRefetching,
  };
}
