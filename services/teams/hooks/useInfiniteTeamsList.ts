import { useEffect } from 'react';
import { toast } from '@/components/core/ToastContainer';
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { ITEMS_PER_PAGE, TOAST_MESSAGES } from '@/utils/constants';
import { TeamsListQueryParams } from '@/services/teams/types';
import { TeamsQueryKeys } from '@/services/teams/constants';
import { ITeam } from '@/types/teams.types';
import { getTeamList } from '@/app/actions/teams.actions';
import qs from 'qs';
import { getCookiesFromClient } from '@/utils/third-party.helper';

async function infiniteFetcher(searchParams: TeamsListQueryParams['searchParams'], page: number) {
  const { authToken } = getCookiesFromClient();
  const query = qs.stringify({
    ...searchParams,
    investmentFocus: searchParams.investmentFocus?.split('|').filter(Boolean),
    tiers: searchParams.tiers?.split('|').filter(Boolean),
  });

  const res = await getTeamList(query, page, ITEMS_PER_PAGE, authToken);

  return {
    items: res.data,
    total: res.totalItems,
  };
}

type QueryData = {
  total?: undefined;
  items?: undefined;
};

export function useInfiniteTeamsList(
  queryParams: TeamsListQueryParams,
  {
    initialData,
  }: {
    initialData: QueryData;
  },
) {
  const queryClient = useQueryClient();

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
    initialData: {
      pages: [{ items: initialData.items, total: initialData.total }],
      pageParams: [1],
    },
  });

  useEffect(() => {
    if (!hasNextPage) return;

    queryClient.fetchInfiniteQuery({
      queryKey: [TeamsQueryKeys.GET_TEAMS_LIST, queryParams.searchParams],
      queryFn: ({ pageParam = 2 }) => {
        return infiniteFetcher(queryParams.searchParams, pageParam);
      },
      initialPageParam: 2,
      getNextPageParam: (data: unknown, allPages: unknown, lastPageParam: number) => {
        return lastPageParam + 2;
      },
    });

    queryClient.fetchInfiniteQuery({
      queryKey: [TeamsQueryKeys.GET_TEAMS_LIST, queryParams.searchParams],
      queryFn: ({ pageParam = 3 }) => {
        return infiniteFetcher(queryParams.searchParams, pageParam);
      },
      initialPageParam: 3,
      getNextPageParam: (data: unknown, allPages: unknown, lastPageParam: number) => {
        return lastPageParam + 3;
      },
    });
  }, [hasNextPage, queryParams.searchParams, queryClient]);

  useEffect(() => {
    if (isError && error) {
      toast.error(TOAST_MESSAGES.SOMETHING_WENT_WRONG);
    }
  }, [error, isError]);

  const items: ITeam[] = data?.pages?.flatMap((page) => page.items) ?? [];

  return {
    data: items,
    error,
    fetchNextPage,
    hasNextPage,
    isLoading,
    isFetchingNextPage,
    status,
    refetch,
    isRefetching,
  };
}
