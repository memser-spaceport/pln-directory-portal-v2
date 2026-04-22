import { customFetch } from '@/utils/fetch-wrapper';
import type { IJobsFiltersResponse, IJobsListResponse } from '@/types/jobs.types';

const buildQuery = (params: URLSearchParams, extras: Record<string, string | undefined> = {}) => {
  const out = new URLSearchParams(params.toString());
  for (const [key, value] of Object.entries(extras)) {
    if (value === undefined || value === '') out.delete(key);
    else out.set(key, value);
  }
  return out.toString();
};

export async function fetchJobsList(params: URLSearchParams, cursor?: string): Promise<IJobsListResponse> {
  const qs = buildQuery(params, cursor ? { cursor } : {});
  const response = await customFetch(`/api/jobs/list${qs ? `?${qs}` : ''}`, {}, false);
  if (!response || !response.ok) {
    throw new Error('Failed to fetch jobs list');
  }
  return response.json();
}

export async function fetchJobsFilters(params: URLSearchParams): Promise<IJobsFiltersResponse> {
  const qs = buildQuery(params);
  const response = await customFetch(`/api/jobs/filters${qs ? `?${qs}` : ''}`, {}, false);
  if (!response || !response.ok) {
    throw new Error('Failed to fetch jobs filters');
  }
  return response.json();
}
