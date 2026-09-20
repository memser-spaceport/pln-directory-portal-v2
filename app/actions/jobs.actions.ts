'use server';

import { getHeader } from '@/utils/common.utils';
import type { IJobTeamGroup, IJobsFiltersResponse, IJobsListResponse } from '@/types/jobs.types';

const jobsAPI = `${process.env.DIRECTORY_API_URL}/v1/job-openings`;

type Result<T> = { data: T } | { isError: true; status?: number; statusText?: string };

/**
 * The board.
 *
 * `authToken` is optional and the board is public without it — but when one is
 * passed the endpoint resolves the viewer, which is the only way
 * `IJobTeam.viewerIsInterestedInTeam` is ever true. The token comes from
 * `app/api/jobs/list/route.ts`, which reads the cookie server-side; it is NOT
 * obtained by flipping the client's `customFetch` auth flag, which logs a
 * visitor out when there is no refresh token and would take the public board
 * with it.
 *
 * Safe to personalize because nothing caches this: `cache: 'no-store'` here, and
 * the proxy route is `force-dynamic`.
 */
export async function getJobsList(query: string, authToken?: string): Promise<Result<IJobsListResponse>> {
  try {
    const response = await fetch(`${jobsAPI}?${query}`, {
      method: 'GET',
      headers: getHeader(authToken ?? ''),
      cache: 'no-store',
    });
    if (!response.ok) {
      return { isError: true, status: response.status, statusText: response.statusText };
    }
    const data = (await response.json()) as IJobsListResponse;
    return { data };
  } catch {
    return { isError: true };
  }
}

export async function getJobsFilters(query: string): Promise<Result<IJobsFiltersResponse>> {
  try {
    const response = await fetch(`${jobsAPI}/filters?${query}`, {
      method: 'GET',
      headers: getHeader(''),
      cache: 'no-store',
    });
    if (!response.ok) {
      return { isError: true, status: response.status, statusText: response.statusText };
    }
    const data = (await response.json()) as IJobsFiltersResponse;
    return { data };
  } catch {
    return { isError: true };
  }
}

export async function getJobOpening(uid: string): Promise<Result<IJobTeamGroup>> {
  try {
    const response = await fetch(`${jobsAPI}/${encodeURIComponent(uid)}`, {
      method: 'GET',
      headers: getHeader(''),
      next: { revalidate: 3600 },
    });
    if (!response.ok) {
      return { isError: true, status: response.status, statusText: response.statusText };
    }
    const data = (await response.json()) as IJobTeamGroup;
    return { data };
  } catch {
    return { isError: true };
  }
}
