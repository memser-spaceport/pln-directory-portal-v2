import { renderHook } from '@testing-library/react';
import '@testing-library/jest-dom';

/**
 * Two things neither a rendered row nor a screenshot would show: the Saved
 * filter reaches the REQUEST (or the board ignores it), and it reaches the
 * query KEY (or the filtered and unfiltered lists share one cache entry).
 */
const capturedInfinite: Array<Record<string, unknown>> = [];
const capturedQuery: Array<Record<string, unknown>> = [];

jest.mock('@tanstack/react-query', () => ({
  ...jest.requireActual('@tanstack/react-query'),
  useInfiniteQuery: (options: Record<string, unknown>) => {
    capturedInfinite.push(options);
    return { data: undefined };
  },
  useQuery: (options: Record<string, unknown>) => {
    capturedQuery.push(options);
    return { data: undefined };
  },
}));

const searchParams = new URLSearchParams();
jest.mock('next/navigation', () => ({
  useSearchParams: () => searchParams,
}));

const mockIsLoggedIn = jest.fn(() => true);
jest.mock('@/components/core/login/utils', () => ({
  authStatus: { isLoggedIn: () => mockIsLoggedIn() },
}));

const fetchJobsList = jest.fn();
const fetchJobsFilters = jest.fn();
jest.mock('@/services/jobs/jobs.service', () => ({
  fetchJobsList: (...args: unknown[]) => fetchJobsList(...args),
  fetchJobsFilters: (...args: unknown[]) => fetchJobsFilters(...args),
}));

import { useInfiniteJobsList, useJobsFilters, useJobsBaseFilters } from '@/services/jobs/hooks/useJobsQueries';

const lastKey = (captured: Array<Record<string, unknown>>) =>
  (captured[captured.length - 1].queryKey as unknown[])[1] as string;

beforeEach(() => {
  capturedInfinite.length = 0;
  capturedQuery.length = 0;
  fetchJobsList.mockClear();
  mockIsLoggedIn.mockReturnValue(true);
  [...searchParams.keys()].forEach((key) => searchParams.delete(key));
});

describe('the Saved filter on the board queries', () => {
  it('leaves both queries untouched while the box is unticked', () => {
    renderHook(() => useInfiniteJobsList());
    renderHook(() => useJobsFilters());

    expect(lastKey(capturedInfinite)).toBe('');
    expect(lastKey(capturedQuery)).toBe('');
  });

  it('narrows the list and its facets together once the box is ticked', () => {
    searchParams.set('saved', 'true');

    renderHook(() => useInfiniteJobsList());
    renderHook(() => useJobsFilters());

    expect(lastKey(capturedInfinite)).toBe('saved=true');
    expect(lastKey(capturedQuery)).toBe('saved=true');
  });

  it('composes with the rest of the rail, like any other filter', () => {
    searchParams.set('q', 'engineer');
    searchParams.set('roleCategory', 'Engineering');
    searchParams.set('saved', 'true');

    renderHook(() => useInfiniteJobsList());

    const key = lastKey(capturedInfinite);
    expect(key).toContain('saved=true');
    expect(key).toContain('q=engineer');
    expect(key).toContain('roleCategory=Engineering');
  });

  it('sends the filter to the API, not just the cache key', () => {
    searchParams.set('saved', 'true');

    renderHook(() => useInfiniteJobsList());
    (capturedInfinite[0].queryFn as (ctx: { pageParam: number }) => unknown)({ pageParam: 1 });

    expect(fetchJobsList.mock.calls[0][0].get('saved')).toBe('true');
  });

  it('gives the filtered and unfiltered boards different cache entries', () => {
    renderHook(() => useInfiniteJobsList());
    const allKey = lastKey(capturedInfinite);

    searchParams.set('saved', 'true');
    renderHook(() => useInfiniteJobsList());

    expect(lastKey(capturedInfinite)).not.toBe(allKey);
  });

  /* The API refuses the saved scope without a session rather than widening it,
     which would put the whole board on the error state. A shared link, or a
     logout that left the box ticked, is how a signed-out visitor gets here. */
  it('drops the filter for a signed-out visitor', () => {
    mockIsLoggedIn.mockReturnValue(false);
    searchParams.set('saved', 'true');
    searchParams.set('q', 'engineer');

    renderHook(() => useInfiniteJobsList());

    expect(lastKey(capturedInfinite)).toBe('q=engineer');
  });

  it('leaves the base filters unscoped, so the rail lists values rather than dropping them', () => {
    searchParams.set('saved', 'true');

    renderHook(() => useJobsBaseFilters());

    expect(lastKey(capturedQuery)).toBe('');
  });
});
