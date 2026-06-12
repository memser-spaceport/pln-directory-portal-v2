import { type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';

// jest.setup.js stubs useQuery globally (returns member-shaped data); this hook
// needs the real react-query so the batch request actually runs.
jest.unmock('@tanstack/react-query');

import { useConnectorLens } from '@/services/investors/hooks/useConnectorLens';
import { fetchConnectorMatches } from '@/services/investors/pathfinder.service';
import type { OutreachInvestor } from '@/services/investors/types';

jest.mock('@/services/investors/pathfinder.service', () => ({
  fetchConnectorMatches: jest.fn(),
}));

const mockFetchMatches = fetchConnectorMatches as jest.MockedFunction<typeof fetchConnectorMatches>;

function member(id: string, has_path?: boolean): OutreachInvestor {
  return { investor_id: id, has_path } as OutreachInvestor;
}

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

describe('useConnectorLens', () => {
  beforeEach(() => {
    mockFetchMatches.mockReset();
  });

  it('makes a single batch request for the whole visible page', async () => {
    mockFetchMatches.mockResolvedValue(['inv-1', 'inv-2']);

    const { result } = renderHook(
      () =>
        useConnectorLens(
          [member('inv-1'), member('inv-2'), member('inv-3')],
          { exactLabels: ['Neuro Labs', 'Alice Founder'] },
          true,
        ),
      { wrapper },
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(mockFetchMatches).toHaveBeenCalledTimes(1);
    expect(mockFetchMatches).toHaveBeenCalledWith(['inv-1', 'inv-2', 'inv-3'], ['Neuro Labs', 'Alice Founder'], []);
    expect(result.current.matchedIds).toEqual(new Set(['inv-1', 'inv-2']));
  });

  it('passes contains labels for team substring matching', async () => {
    mockFetchMatches.mockResolvedValue(['inv-1']);

    const { result } = renderHook(
      () =>
        useConnectorLens(
          [member('inv-1')],
          { exactLabels: ['Modular Globe'], containsLabels: ['Modular Globe'] },
          true,
        ),
      { wrapper },
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(mockFetchMatches).toHaveBeenCalledWith(['inv-1'], ['Modular Globe'], ['Modular Globe']);
    expect(result.current.matchedIds).toEqual(new Set(['inv-1']));
  });

  it('skips confirmed-cold members', async () => {
    mockFetchMatches.mockResolvedValue([]);

    const { result } = renderHook(
      () =>
        useConnectorLens([member('cold-1', false), member('warm-1', true)], { exactLabels: ['Alice Founder'] }, true),
      { wrapper },
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(mockFetchMatches).toHaveBeenCalledTimes(1);
    expect(mockFetchMatches).toHaveBeenCalledWith(['warm-1'], ['Alice Founder'], []);
  });

  it('does not request at all when the lens is inactive or labels are blank', () => {
    const { result } = renderHook(() => useConnectorLens([member('inv-1')], { exactLabels: ['  '] }, true), {
      wrapper,
    });

    expect(mockFetchMatches).not.toHaveBeenCalled();
    expect(result.current).toEqual({ matchedIds: new Set(), isLoading: false });
  });
});
