'use client';

import { useMemo } from 'react';
import { useSearchParams } from 'next/navigation';

import { useIsLoggedIn } from '@/hooks/useIsLoggedIn';
import { keepPreviousData, useInfiniteQuery, useQuery } from '@tanstack/react-query';

import type { IJobTeamGroup, IJobsListResponse } from '@/types/jobs.types';

import { JobsQueryKey } from '../constants';
import { SAVED_PARAM } from '../savedParam';
import { pickJobsParams } from '../jobsParams';

import { fetchJobsFilters, fetchJobsList } from '../jobs.service';

export function useJobsSearchParams(): URLSearchParams {
  const raw = useSearchParams();
  /* False on the server and in the hydrating render (LAB-2888), so the board's server render — and the server
     page's fetch — always leave the saved scope out and agree with it. The `authToken` cookie it reads is also
     exactly what `/api/jobs/list` forwards, and the saved scope is refused without it. */
  const isLoggedIn = useIsLoggedIn();

  return useMemo(() => {
    const picked = pickJobsParams(new URLSearchParams(raw.toString()));
    /* The saved scope is the one filter the API refuses without a session — it
       answers 401 rather than widening, which would put the whole board on the
       error state. A shared link, or a logout that left the box ticked, is how
       a signed-out visitor gets here. */
    if (!isLoggedIn) {
      picked.delete(SAVED_PARAM);
    }
    return picked;
  }, [raw, isLoggedIn]);
}

/**
 * The board's first page as the server fetched it (LAB-2888), and the `pickJobsParams` string it was fetched for.
 * Rendered until the client's own fetch lands, so the server HTML carries the list and its role links.
 */
export type ServerJobsPage = {
  /** `pickJobsParams(...).toString()` for the URL it was fetched for — compared with the client's own key. */
  key: string;
  page: IJobsListResponse;
};

export function useInfiniteJobsList(serverPage?: ServerJobsPage) {
  const params = useJobsSearchParams();
  const key = params.toString();
  /* Placeholder, never `initialData`: the QueryClient is one module-level instance shared by every SSR request
     (providers/QueryProvider.tsx), and placeholder data is never written to its cache, so one viewer's page
     can't reach another's HTML. Only for the filters it was fetched for: after a filter change, the previous
     page (keepPreviousData) is what stands in, as before. */
  const fromServer = serverPage && serverPage.key === key ? serverPage.page : undefined;

  const query = useInfiniteQuery<IJobsListResponse>({
    queryKey: [JobsQueryKey.List, key],
    initialPageParam: 1,
    queryFn: ({ pageParam }) => fetchJobsList(params, pageParam as number),
    getNextPageParam: (lastPage) => {
      const totalPages = Math.ceil(lastPage.totalGroups / lastPage.limit);
      return lastPage.page < totalPages ? lastPage.page + 1 : undefined;
    },
    staleTime: 30_000,
    refetchOnWindowFocus: false,
    placeholderData: (previous) => previous ?? (fromServer ? { pages: [fromServer], pageParams: [1] } : undefined),
  });

  const groups: IJobTeamGroup[] = useMemo(() => query.data?.pages.flatMap((p) => p.groups) ?? [], [query.data]);
  const totalGroups = query.data?.pages[0]?.totalGroups ?? 0;
  const totalRoles = query.data?.pages[0]?.totalRoles ?? 0;

  return { ...query, groups, totalGroups, totalRoles };
}

export function useJobsFilters() {
  const params = useJobsSearchParams();
  const key = params.toString();

  return useQuery({
    queryKey: [JobsQueryKey.Filters, key],
    queryFn: () => fetchJobsFilters(params),
    staleTime: 30_000,
    refetchOnWindowFocus: false,
    placeholderData: keepPreviousData,
  });
}

export function useJobsBaseFilters() {
  const params = useJobsSearchParams();
  const baseParams = new URLSearchParams();
  const q = params.get('q');

  if (q) {
    baseParams.set('q', q);
  }
  const key = baseParams.toString();

  return useQuery({
    queryKey: [JobsQueryKey.BaseFilters, key],
    queryFn: () => fetchJobsFilters(baseParams),
    staleTime: 60_000,
    refetchOnWindowFocus: false,
    placeholderData: keepPreviousData,
  });
}
