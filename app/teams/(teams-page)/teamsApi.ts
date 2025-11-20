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
  data: Array<{
    uid: string;
    title: string;
    description?: string;
    parent?: string;
  }>;
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

  const response = await fetch(
    `/api/teams/list?${query}`,
    {
      headers: getHeaders(authToken),
      credentials: 'include',
    }
  );

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

  const response = await fetch(
    `/api/teams/filters`,
    {
      headers: getHeaders(authToken),
      credentials: 'include',
    }
  );

  if (!response.ok) {
    throw new Error('Failed to fetch filters data');
  }

  return response.json();
};

/**
 * Fetch focus areas from API
 */
export const fetchFocusAreas = async (searchParams: ITeamsSearchParams): Promise<FocusAreasResponse> => {
  const params = new URLSearchParams();
  params.set('type', 'Team');

  // Add other params from searchParams
  Object.entries(searchParams).forEach(([key, value]) => {
    if (value && key !== 'page' && key !== 'limit') {
      params.set(key, String(value));
    }
  });

  const response = await fetch(
    `/api/teams/focus-areas?${params.toString()}`,
    {
      credentials: 'include',
    }
  );

  if (!response.ok) {
    throw new Error('Failed to fetch focus areas');
  }

  return response.json();
};
