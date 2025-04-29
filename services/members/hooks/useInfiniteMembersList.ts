import { useEffect } from 'react';
import cookies from 'js-cookie';
import { toast } from 'react-toastify';
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';

import { MembersListQueryParams } from '@/services/members/types';
import { MembersQueryKeys } from '@/services/members/constants';
import { getMembersListOptions, getMembersOptionsFromQuery } from '@/utils/member.utils';
import { IMember, IMemberListOptions } from '@/types/members.types';
import { getMemberListForQuery } from '@/app/actions/members.actions';
import { ITEMS_PER_PAGE, TOAST_MESSAGES } from '@/utils/constants';

async function infiniteFetcher(searchParams: MembersListQueryParams['searchParams'], page: number) {
  const authToken = cookies.get('authToken');
  const optionsFromQuery = getMembersOptionsFromQuery(searchParams);
  const listOptions: IMemberListOptions = getMembersListOptions(optionsFromQuery);

  return await getMemberListForQuery(listOptions, page, ITEMS_PER_PAGE, authToken);
}

type QueryData = {
  total?: undefined;
  items?: undefined;
};

export function useInfiniteMembersList(
  queryParams: MembersListQueryParams,
  {
    initialData,
  }: {
    initialData: QueryData;
  },
) {
  const queryClient = useQueryClient();

  const { isRefetching, data, error, isError, fetchNextPage, hasNextPage, isLoading, isFetchingNextPage, status, refetch } = useInfiniteQuery({
    queryKey: [MembersQueryKeys.GET_MEMBERS_LIST, queryParams.searchParams],
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
      queryKey: [MembersQueryKeys.GET_MEMBERS_LIST, queryParams.searchParams],
      queryFn: ({ pageParam = 2 }) => {
        return infiniteFetcher(queryParams.searchParams, pageParam);
      },
      initialPageParam: 2,
      getNextPageParam: (data: unknown, allPages: unknown, lastPageParam: number) => {
        return lastPageParam + 2;
      },
    });

    queryClient.fetchInfiniteQuery({
      queryKey: [MembersQueryKeys.GET_MEMBERS_LIST, queryParams.searchParams],
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

  const items: IMember[] = data?.pages?.flatMap((page) => page.items) ?? [];

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
