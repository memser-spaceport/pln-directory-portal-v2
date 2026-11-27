import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';

import { useCurrentUserStore } from '@/services/auth/store';
import { allEventsItem as item } from '@/services/events/all-events.fixtures';
import { useMyPastEventUids } from '@/services/events/hooks/useMyPastEventUids';
import { usePastEvents } from '@/services/events/hooks/usePastEvents';
import { useSeenEvents } from '@/services/events/hooks/useSeenEvents';
import { getMyPastEventUids } from '@/services/events/my-past-events.service';

/* LAB-3418: the browser's reads of past events and of those the viewer went to. */

jest.unmock('@tanstack/react-query');
jest.mock('@/services/events/my-past-events.service', () => ({ getMyPastEventUids: jest.fn() }));

const wrapper = () => {
  const client = new QueryClient({ defaultOptions: { queries: { retryDelay: 1 } } });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  };
};

const realFetch = global.fetch;
const fetchMock = jest.fn();
beforeEach(() => {
  fetchMock.mockReset();
  global.fetch = fetchMock as unknown as typeof fetch;
});
afterEach(() => {
  global.fetch = realFetch;
});

describe('usePastEvents', () => {
  const answer = (body: unknown, ok = true) => ({ ok, status: ok ? 200 : 502, json: async () => body });

  it('loads, then has the events, from one call to the route', async () => {
    fetchMock.mockResolvedValue(answer({ items: [item({ uid: 'p1' })] }));
    const { result } = renderHook(() => usePastEvents(true), { wrapper: wrapper() });
    expect(result.current).toMatchObject({ isPending: true, data: undefined });
    await waitFor(() => expect(result.current.data?.map((e) => e.uid)).toEqual(['p1']));

    // A tab shown again, and another reader of the same query, ask for nothing.
    window.dispatchEvent(new Event('visibilitychange'));
    window.dispatchEvent(new Event('focus'));
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(fetchMock.mock.calls).toEqual([['/api/events/past']]);
  });

  it('a second mount reads the first one’s events', async () => {
    fetchMock.mockResolvedValue(answer({ items: [] }));
    const Wrapper = wrapper();
    const first = renderHook(() => usePastEvents(true), { wrapper: Wrapper });
    await waitFor(() => expect(first.result.current.isSuccess).toBe(true));
    renderHook(() => usePastEvents(true), { wrapper: Wrapper });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('asks for nothing until it is enabled', () => {
    renderHook(() => usePastEvents(false), { wrapper: wrapper() });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it.each([
    ['the route fails', answer({ error: 'no' }, false)],
    ['the body has no items', answer({ events: [] })],
  ])('fails when %s, after one retry', async (_name, response) => {
    fetchMock.mockResolvedValue(response);
    const { result } = renderHook(() => usePastEvents(true), { wrapper: wrapper() });
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.data).toBeUndefined();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});

describe('useSeenEvents', () => {
  it('lists every event once, soonest first, also when a list has it twice', () => {
    const at = (uid: string, day: string) =>
      item({ uid, startDate: `${day}T09:00:00.000Z`, endDate: `${day}T10:00:00.000Z` });
    const loaded = [at('b', '2020-02-01'), at('b', '2020-02-01'), at('c', '2020-03-01')];
    const listed = [at('b', '2020-02-01'), at('a', '2020-01-01'), at('a', '2020-01-01')];
    const { result } = renderHook(() => useSeenEvents(loaded, listed, 0));
    expect(result.current.seen.map((e) => e.uid)).toEqual(['a', 'b', 'c']);
    expect(result.current.fromPage.map((e) => e.uid)).toEqual(['b', 'c']);
  });
});

describe('useMyPastEventUids', () => {
  const uids = getMyPastEventUids as jest.Mock;
  const viewer = (uid: string | null) =>
    useCurrentUserStore.setState({ currentUser: uid ? ({ uid } as never) : null } as never);
  beforeEach(() => uids.mockReset().mockResolvedValue(['e1']));
  afterEach(() => viewer(null));

  it('reads the viewer’s own', async () => {
    viewer('m1');
    const { result } = renderHook(() => useMyPastEventUids(true), { wrapper: wrapper() });
    await waitFor(() => expect(result.current.data).toEqual(['e1']));
    expect(uids).toHaveBeenCalledWith('m1');
  });

  it('asks for nothing signed out, or until Past is shown', async () => {
    const signedOut = renderHook(() => useMyPastEventUids(true), { wrapper: wrapper() });
    signedOut.unmount();
    viewer('m1');
    renderHook(() => useMyPastEventUids(false), { wrapper: wrapper() });
    await Promise.resolve();
    expect(uids).not.toHaveBeenCalled();
  });
});
