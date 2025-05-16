import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';

import { IrlQueryKeys } from '@/services/irl/constants';
import { getGuestsByLocation } from '@/services/irl.service';
import { IGuest, IGuestDetails } from '@/types/irl.types';
import { getParsedValue } from '@/utils/common.utils';
import Cookies from 'js-cookie';
import { useEffect } from 'react';
import { toast } from 'react-toastify';
import { TOAST_MESSAGES } from '@/utils/constants';

type QueryParams = {
  location: string;
  searchParams: Record<string, string>;
  currentEventNames: string[];
};

async function infiniteFetcher(queryParams: QueryParams, page: number) {
  const authToken = getParsedValue(Cookies.get('authToken'));
  return await getGuestsByLocation(queryParams.location, queryParams.searchParams, authToken, queryParams.currentEventNames, page, 10);
}

export function useInfiniteGuestsList(
  queryParams: QueryParams,
  {
    initialData,
  }: {
    initialData: IGuestDetails;
  },
) {
  const queryClient = useQueryClient();

  const { isRefetching, data, error, isError, fetchNextPage, hasNextPage, isLoading, isFetchingNextPage, status, refetch } = useInfiniteQuery({
    queryKey: [IrlQueryKeys.GET_GUESTS_LIST, queryParams.location, queryParams.searchParams, queryParams.currentEventNames.join(',')],
    initialPageParam: 1,
    queryFn: async ({ pageParam = 1 }) => {
      return (await infiniteFetcher(queryParams, pageParam)) as unknown as IGuestDetails;
    },
    getNextPageParam: (data, allPages, lastPageParam) => {
      return data?.guests?.length < 10 ? undefined : lastPageParam + 1;
    },
    // staleTime: 2000,
    refetchOnWindowFocus: false,
    initialData: {
      pages: [initialData],
      pageParams: [1],
    },
  });

  useEffect(() => {
    if (isError && error) {
      toast.error(TOAST_MESSAGES.SOMETHING_WENT_WRONG);
    }
  }, [error, isError]);

  const items: IGuest[] = data?.pages?.flatMap((page) => page?.guests) ?? [];

  return {
    data: {
      ...initialData,
      guests: items,
      totalGuests: data.pages?.[0].totalGuests,
    },
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
