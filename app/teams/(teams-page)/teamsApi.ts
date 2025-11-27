import { ITeamsSearchParams } from '@/types/teams.types';
import qs from 'qs';

/**
 * Client-side API functions for teams page
 * These functions are called from React Query hooks
 */

const getAuthToken = () => {
  // Get auth token from cookies
  const cookies = document.cookie.split(';');
  const authCookie = cookies.find((c) => c.trim().startsWith('authToken='));
  return authCookie ? authCookie.split('=')[1] : '';
};

const getHeaders = (authToken?: string) => {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }
  return headers;
};

export interface TeamListResponse {
  teams: Array<{
    id: string;
    name: string;
    logo?: string;
    tier?: number;
    shortDescription?: string;
    industryTags: Array<{ uid: string; title: string }>;
    asks: Array<any>;
  }>;
  totalItems: number;
}

export interface FilterDataResponse {
  tags: string[];
  fundingStage: string[];
  membershipSources: string[];
  technology: string[];
  askTags: string[];
  tiers?: Array<{ tier: string; count: number }>;
}

export interface FocusAreasResponse {
  data: {
    uid: string;
    title: string;
    description?: string;
    parent?: string;
  }[];
}

export interface OptionWithTeams {
  uid: string;
  title: string;
  teams: unknown[];
}

export interface TeamsCountResponse {
  data: OptionWithTeams[];
}

/**
 * Fetch teams list from API
 */
export const fetchTeamsList = async (searchParams: ITeamsSearchParams): Promise<TeamListResponse> => {
  const authToken = getAuthToken();

  const query = qs.stringify({
    ...searchParams,
    investmentFocus: searchParams.investmentFocus?.split('|').filter(Boolean),
    tiers: searchParams.tiers?.split('|').filter(Boolean),
  });

  const response = await fetch(`/api/teams/list?${query}`, {
    headers: getHeaders(authToken),
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Failed to fetch teams list');
  }

  return response.json();
};

/**
 * Fetch filter data from API
 */
export const fetchFiltersData = async (): Promise<FilterDataResponse> => {
  const authToken = getAuthToken();

  const response = await fetch(`/api/teams/filters`, {
    headers: getHeaders(authToken),
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Failed to fetch filters data');
  }

  return response.json();
};

/**
 * Generic function to fetch filter-related data from API endpoints
 * Reduces duplication across similar fetch functions
 *
 * @param endpoint - API endpoint path (e.g., 'focus-areas', 'membership-source')
 * @param searchParams - Search parameters to include in the request
 * @param errorMessage - Custom error message if request fails
 * @returns Promise with the API response data
 */
const fetchFilterData = async <T = FocusAreasResponse>(
  endpoint: string,
  searchParams: ITeamsSearchParams,
  errorMessage: string,
): Promise<T> => {
  const params = new URLSearchParams();

  // Add params from searchParams, excluding pagination params
  Object.entries(searchParams).forEach(([key, value]) => {
    if (value && key !== 'page' && key !== 'limit') {
      params.set(key, String(value));
    }
  });

  const response = await fetch(`/api/teams/${endpoint}?${params.toString()}`, {
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error(errorMessage);
  }

  return response.json();
};

export async function fetchFocusAreas(searchParams: ITeamsSearchParams): Promise<FocusAreasResponse> {
  return fetchFilterData('focus-areas', searchParams, 'Failed to fetch focus areas');
}

export async function fetchMembershipSource(searchParams: ITeamsSearchParams): Promise<TeamsCountResponse> {
  return fetchFilterData('membership-source', searchParams, 'Failed to fetch membership source');
}

export async function fetchIndustryTags(searchParams: ITeamsSearchParams): Promise<TeamsCountResponse> {
  return fetchFilterData('industry-tags', searchParams, 'Failed to fetch industry tags');
}

export async function fetchFundingStages(searchParams: ITeamsSearchParams): Promise<TeamsCountResponse> {
  return fetchFilterData('funding-stages', searchParams, 'Failed to fetch funding stages');
}
