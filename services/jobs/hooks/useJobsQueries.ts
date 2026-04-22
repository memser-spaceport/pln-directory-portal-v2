'use client';

import { keepPreviousData, useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { fetchJobsFilters, fetchJobsList } from '../jobs.service';
import { JobsQueryKey } from '../constants';
import type { IJobTeamGroup, IJobsListResponse } from '@/types/jobs.types';

const SINGLE_VALUE_KEYS = ['q', 'sort'] as const;
const MULTI_VALUE_KEYS = ['roleCategory', 'seniority', 'focus', 'location'] as const;

export const pickJobsParams = (searchParams: URLSearchParams): URLSearchParams => {
  const picked = new URLSearchParams();
  for (const key of SINGLE_VALUE_KEYS) {
    const value = searchParams.get(key);
    if (value) picked.set(key, value);
  }
  for (const key of MULTI_VALUE_KEYS) {
    const values = searchParams.getAll(key);
    for (const v of values) {
      if (v) picked.append(key, v);
    }
  }
  return picked;
};

export function useJobsSearchParams(): URLSearchParams {
  const raw = useSearchParams();
  return useMemo(() => pickJobsParams(new URLSearchParams(raw.toString())), [raw]);
}

export function useInfiniteJobsList() {
  const params = useJobsSearchParams();
  const key = params.toString();

  const query = useInfiniteQuery<IJobsListResponse>({
    queryKey: [JobsQueryKey.List, key],
    initialPageParam: undefined,
    queryFn: ({ pageParam }) => fetchJobsList(params, pageParam as string | undefined),
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
    placeholderData: keepPreviousData,
  });

  const groups: IJobTeamGroup[] = useMemo(
    () => query.data?.pages.flatMap((p) => p.groups) ?? [],
    [query.data],
  );
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
