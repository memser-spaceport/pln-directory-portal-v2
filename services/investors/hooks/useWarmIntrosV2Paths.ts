'use client';

import { useInfiniteQuery } from '@tanstack/react-query';
import { InvestorsQueryKeys } from '../constants';
import { listWarmIntrosV2Paths } from '../warm-intros-v2.service';
import type { WarmIntrosV2ListParams, WarmIntrosV2ListResponse } from '../warm-intros-v2.types';

export function getWarmIntrosV2PathsNextOffset(
  lastPage: WarmIntrosV2ListResponse,
  allPages: WarmIntrosV2ListResponse[],
): number | undefined {
  const loaded = allPages.reduce((n, p) => n + p.paths.length, 0);
  if (loaded >= lastPage.total || lastPage.paths.length === 0) return undefined;
  return loaded;
}

/**
 * Paginated Warm Intros v2 paths. Fetches pages on demand via `fetchNextPage`.
 * `offset` is excluded from the query key so filter changes reset to page 1.
 */
export function useWarmIntrosV2Paths(params: WarmIntrosV2ListParams, enabled = true) {
  const { offset: _offset, ...filterParams } = params;

  return useInfiniteQuery({
    queryKey: [InvestorsQueryKeys.WARM_INTROS_V2_PATHS, filterParams],
    queryFn: ({ pageParam }) => listWarmIntrosV2Paths({ ...params, offset: pageParam as number }),
    initialPageParam: 0,
    getNextPageParam: getWarmIntrosV2PathsNextOffset,
    enabled,
    staleTime: 60 * 1000,
  });
}
