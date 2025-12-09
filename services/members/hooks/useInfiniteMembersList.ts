import { useEffect } from 'react';
import cookies from 'js-cookie';
import { toast } from '@/components/core/ToastContainer';
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';

import { MembersListQueryParams } from '@/services/members/types';
import { MembersQueryKeys } from '@/services/members/constants';
import { IMember, IMemberListOptions } from '@/types/members.types';
import { getMemberListForQuery } from '@/app/actions/members.actions';
import { ITEMS_PER_PAGE, TOAST_MESSAGES } from '@/utils/constants';
import qs from 'qs';

async function infiniteFetcher(searchParams: MembersListQueryParams['searchParams'], page: number) {
  const authToken = cookies.get('authToken');

  const invType = searchParams.investorType?.split('|') || '';

  if (invType.length > 0) {
    invType.push('ANGEL_AND_FUND');
  }

  const query = qs.stringify({
    ...searchParams,
    roles: searchParams.roles?.split('|'),
    topics: searchParams.topics?.split('|') || '',
    investorType: invType,
    sort: searchParams.sort
      ?.split(',')
      .map((s: string) => s.toLowerCase())
      .join(':'),
    investmentFocus: searchParams.investmentFocus?.split('|').filter(Boolean),
  });

  return await getMemberListForQuery(query, page, ITEMS_PER_PAGE, authToken);
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
    queryKey: [MembersQueryKeys.GET_MEMBERS_LIST, queryParams.searchParams],
    initialPageParam: 1,
    queryFn: async ({ pageParam = 1 }) => {
      return infiniteFetcher(queryParams.searchParams, pageParam);
    },
    getNextPageParam: (data, allPages, lastPageParam) => {
      return data?.items?.length < ITEMS_PER_PAGE ? undefined : lastPageParam + 1;
    },
    initialData: {
      pages: [{ items: initialData.items, total: initialData.total }],
      pageParams: [1],
    },
    refetchOnMount: 'always',
    staleTime: 0,
  });

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
