/**
 * @jest-environment node
 */
jest.mock('next/headers', () => ({ cookies: jest.fn() }));
jest.mock('@/app/actions/jobs.actions', () => ({ getJobsFilters: jest.fn() }));

import { cookies } from 'next/headers';
import type { NextRequest } from 'next/server';

import { GET } from '@/app/api/jobs/filters/route';
import { getJobsFilters } from '@/app/actions/jobs.actions';

const mockCookies = cookies as jest.MockedFunction<typeof cookies>;
const mockGetJobsFilters = getJobsFilters as jest.MockedFunction<typeof getJobsFilters>;

const request = (search: string) =>
  ({ nextUrl: { searchParams: new URLSearchParams(search) } }) as unknown as NextRequest;

const withCookie = (value?: string) =>
  mockCookies.mockResolvedValue({
    get: (name: string) => (name === 'authToken' && value ? { value } : undefined),
  } as unknown as Awaited<ReturnType<typeof cookies>>);

const forwardedToken = () => mockGetJobsFilters.mock.calls[0][1];
const forwardedQuery = () => mockGetJobsFilters.mock.calls[0][0];

beforeEach(() => {
  mockCookies.mockReset();
  mockGetJobsFilters.mockReset();
  mockGetJobsFilters.mockResolvedValue({ data: {} as never });
});

describe('GET /api/jobs/filters', () => {
  /* `saved=true` narrows the facets to the caller's own bookmarks, and the API
     refuses a saved scope it cannot resolve a member for — without the token
     the Saved tab loses its filter rail to a 401. */
  it('forwards the member token, which is what the saved scope needs', async () => {
    withCookie(encodeURIComponent(JSON.stringify('token-123')));

    await GET(request('saved=true'));

    expect(forwardedToken()).toBe('token-123');
    expect(forwardedQuery()).toContain('saved=true');
  });

  /* The facets are public. Anonymous has to stay exactly as anonymous as it
     was before the token was threaded through. */
  it('sends no token for a signed-out visitor', async () => {
    withCookie(undefined);

    await GET(request(''));

    expect(forwardedToken()).toBeUndefined();
  });

  it('sends no token when the cookie is unreadable rather than an empty string', async () => {
    withCookie('not-json');

    await GET(request(''));

    expect(forwardedToken()).toBeUndefined();
  });

  it('answers the action’s failure with its status', async () => {
    withCookie(undefined);
    mockGetJobsFilters.mockResolvedValue({ isError: true, status: 401 } as never);

    const response = await GET(request('saved=true'));

    expect(response.status).toBe(401);
  });
});
