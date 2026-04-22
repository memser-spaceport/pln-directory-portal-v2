'use server';

import { getHeader } from '@/utils/common.utils';
import type { IJobsFiltersResponse, IJobsListResponse } from '@/types/jobs.types';

const jobsAPI = `${process.env.DIRECTORY_API_URL}/v1/jobs`;

type Result<T> = { data: T } | { isError: true; status?: number; statusText?: string };

export async function getJobsList(query: string): Promise<Result<IJobsListResponse>> {
  try {
    const response = await fetch(`${jobsAPI}?${query}`, {
      method: 'GET',
      headers: getHeader(''),
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
