import { type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';

jest.unmock('@tanstack/react-query');

import {
  useLatestJobOpenings,
  LATEST_JOBS_LIMIT,
} from '@/components/page/home/LatestJobsSection/hooks/useLatestJobOpenings';
import { fetchJobsList } from '@/services/jobs/jobs.service';
import type { IJobRole, IJobTeam, IJobTeamGroup, IJobsListResponse } from '@/types/jobs.types';

jest.mock('@/services/jobs/jobs.service', () => ({
  fetchJobsList: jest.fn(),
}));

const mockFetchJobsList = fetchJobsList as jest.MockedFunction<typeof fetchJobsList>;

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

function buildTeam(overrides: Partial<IJobTeam> = {}): IJobTeam {
  return {
    uid: 'team-1',
    name: 'Protocol Labs',
    logoUrl: null,
    focusAreas: [],
    subFocusAreas: [],
    ...overrides,
  };
}

function buildRole(overrides: Partial<IJobRole> = {}): IJobRole {
  return {
    uid: 'role-1',
    roleTitle: 'Software Engineer',
    roleCategory: 'Engineering',
    seniority: 'Senior (L4)',
    location: ['Remote'],
    workMode: 'remote',
    applyUrl: 'https://example.com/apply',
    lastUpdated: '2026-01-01T00:00:00.000Z',
    postedDate: '2026-01-01T00:00:00.000Z',
    detectionDate: null,
    ...overrides,
  };
}

function buildResponse(groups: IJobTeamGroup[]): IJobsListResponse {
  return {
    groups,
    page: 1,
    limit: groups.length,
    total: groups.reduce((sum, g) => sum + g.roles.length, 0),
    totalGroups: groups.length,
    totalRoles: groups.reduce((sum, g) => sum + g.roles.length, 0),
  };
}

describe('useLatestJobOpenings', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('flattens roles out of their team groups, newest first', async () => {
    mockFetchJobsList.mockResolvedValue(
      buildResponse([
        {
          team: buildTeam({ uid: 'team-1', name: 'Older Co' }),
          totalRoles: 1,
          roles: [buildRole({ uid: 'role-older', postedDate: '2026-01-01T00:00:00.000Z' })],
        },
        {
          team: buildTeam({ uid: 'team-2', name: 'Newer Co' }),
          totalRoles: 1,
          roles: [buildRole({ uid: 'role-newer', postedDate: '2026-02-01T00:00:00.000Z' })],
        },
      ]),
    );

    const { result } = renderHook(() => useLatestJobOpenings(), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.openings.map((opening) => opening.role.uid)).toEqual(['role-newer', 'role-older']);
    expect(result.current.openings[0].team.name).toBe('Newer Co');
  });

  it('caps the flattened openings at LATEST_JOBS_LIMIT', async () => {
    const roles = Array.from({ length: LATEST_JOBS_LIMIT + 5 }, (_, i) =>
      buildRole({ uid: `role-${i}`, postedDate: `2026-01-${String(i + 1).padStart(2, '0')}T00:00:00.000Z` }),
    );
    mockFetchJobsList.mockResolvedValue(buildResponse([{ team: buildTeam(), totalRoles: roles.length, roles }]));

    const { result } = renderHook(() => useLatestJobOpenings(), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.openings).toHaveLength(LATEST_JOBS_LIMIT);
    // The most recently posted roles (highest index) should win over older ones.
    expect(result.current.openings[0].role.uid).toBe(`role-${LATEST_JOBS_LIMIT + 4}`);
  });

  it('returns an empty list when there are no groups', async () => {
    mockFetchJobsList.mockResolvedValue(buildResponse([]));

    const { result } = renderHook(() => useLatestJobOpenings(), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.openings).toEqual([]);
  });
});
