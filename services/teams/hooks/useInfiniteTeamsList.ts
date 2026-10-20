import { useEffect, useMemo, useSyncExternalStore } from 'react';
import { toast } from '@/components/core/ToastContainer';
import { InfiniteData, useInfiniteQuery } from '@tanstack/react-query';
import { ITEMS_PER_PAGE, TOAST_MESSAGES } from '@/utils/constants';
import { TeamsListQueryParams } from '@/services/teams/types';
import { TeamsQueryKeys } from '@/services/teams/constants';
import { ITeam } from '@/types/teams.types';
import { getTeamList } from '@/app/actions/teams.actions';
import { buildTeamsListQuery, type ServerTeamsPage } from '@/services/teams/teamsListQuery';
import { getCookiesFromClient } from '@/utils/third-party.helper';

async function infiniteFetcher(searchParams: TeamsListQueryParams['searchParams'], page: number) {
  const { authToken } = getCookiesFromClient();
  const query = buildTeamsListQuery(searchParams);

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

const subscribeToNothing = () => () => {};

/**
 * The teams list, infinitely paged.
 *
 * `serverPage` is page 1 as the server rendered it (LAB-2922). It stands in as placeholder data, never `initialData`:
 * the server QueryClient is a module-level singleton, and placeholder data is never written to the cache. It is shown
 *   - in the hydrating render, whatever the filter store holds: the store is still empty then (the URL sync fills it
 *     in a layout effect), and the HTML must match the server's;
 *   - afterwards, only while the list's own query is the one the server fetched, until the browser's fetch lands.
 * Any other set of filters gets no stand-in.
 */
export function useInfiniteTeamsList(
  queryParams: TeamsListQueryParams,
  { serverPage }: { serverPage?: ServerTeamsPage } = {},
): UseInfiniteTeamsListResult {
  const isHydrating = useSyncExternalStore(
    subscribeToNothing,
    () => false,
    () => true,
  );
  const usesServerPage =
    !!serverPage && (isHydrating || buildTeamsListQuery(queryParams.searchParams) === serverPage.key);
  // Stable, so the query keeps reusing it rather than treating every render's copy as new placeholder data.
  const serverPlaceholder = useMemo<InfiniteData<QueryData, number> | undefined>(
    () =>
      serverPage
        ? {
            pages: [{ items: serverPage.items, total: serverPage.total, followingTotal: serverPage.followingTotal }],
            pageParams: [1],
          }
        : undefined,
    [serverPage],
  );

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
    placeholderData: usesServerPage ? serverPlaceholder : undefined,
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
