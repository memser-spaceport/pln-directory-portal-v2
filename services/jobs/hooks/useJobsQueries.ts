'use client';

import { useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { keepPreviousData, useInfiniteQuery, useQuery } from '@tanstack/react-query';

import type { IJobTeamGroup, IJobsListResponse } from '@/types/jobs.types';

import { URL_QUERY_VALUE_SEPARATOR } from '@/utils/constants';

import { JobsQueryKey } from '../constants';
import { FILTER_VALUE_SEPARATOR, FILTER_VALUE_SEPARATOR_ENCODED } from '@/constants/filters';

import { fetchJobsFilters, fetchJobsList } from '../jobs.service';

const SINGLE_VALUE_KEYS = ['q', 'sort'] as const;
const MULTI_VALUE_KEYS = ['roleCategory', 'seniority', 'focus', 'location', 'workplaceType'] as const;

export const pickJobsParams = (searchParams: URLSearchParams): URLSearchParams => {
  const picked = new URLSearchParams();
  for (const key of SINGLE_VALUE_KEYS) {
    const value = searchParams.get(key);
    if (value) picked.set(key, value);
  }
  for (const key of MULTI_VALUE_KEYS) {
    const parts: string[] = [];
    for (const raw of searchParams.getAll(key)) {
      if (raw) parts.push(...raw.split(URL_QUERY_VALUE_SEPARATOR).filter(Boolean));
    }
    for (const v of [...new Set(parts)]) {
      picked.append(key, v.replaceAll(FILTER_VALUE_SEPARATOR_ENCODED, FILTER_VALUE_SEPARATOR));
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
    initialPageParam: 1,
    queryFn: ({ pageParam }) => fetchJobsList(params, pageParam as number),
    getNextPageParam: (lastPage) => {
      const totalPages = Math.ceil(lastPage.totalGroups / lastPage.limit);
      return lastPage.page < totalPages ? lastPage.page + 1 : undefined;
    },
    staleTime: 30_000,
    refetchOnWindowFocus: false,
    placeholderData: keepPreviousData,
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
