/**
 * LAB-3219: the team profile's Events data — the BE read (LAB-3215), the server's past-only fetch (design D5), and what
 * each viewer gets to see.
 */
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';

import {
  DEMO_DAY,
  pastEvent,
  TEAM_PAST,
  TEAM_UPCOMING,
  teamEvent,
} from '@/components/page/team-details/TeamEventsSection/TeamEventsSection.fixtures';
import { useTeamProfileEvents } from '@/components/page/team-details/TeamEventsSection/useTeamProfileEvents';
import { useCurrentUserStore } from '@/services/auth/store';
import { EventsQueryKeys } from '@/services/events/constants';
import { useTeamEvents } from '@/services/events/hooks/useTeamEvents';
import {
  getTeamEventsPublic,
  normalizeTeamEvents,
  teamEventsUrl,
  type TeamEvents,
} from '@/services/events/profile-events.service';

// The real React Query: the global mock in jest.setup.js ignores `enabled`.
jest.unmock('@tanstack/react-query');

const flag = { on: true };
jest.mock('@/utils/event-drawer', () => ({
  get SHOW_EVENT_DRAWER() {
    return flag.on;
  },
}));

const mockCustomFetch = jest.fn();
jest.mock('@/utils/fetch-wrapper', () => ({ customFetch: (...args: unknown[]) => mockCustomFetch(...args) }));

const ok = (body: unknown) => ({ ok: true, status: 200, json: async () => body }) as Response;
const group = <T,>(items: T[], total = items.length) => ({ page: 1, limit: 50, total, items });

let client: QueryClient;
function wrapper({ children }: { children: React.ReactNode }) {
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

const SERVER: TeamEvents = { upcoming: null, past: group(TEAM_PAST) };

beforeEach(() => {
  flag.on = true;
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  mockCustomFetch.mockReset();
  useCurrentUserStore.setState({ currentUser: { uid: 'viewer-1' } as never });
});

describe('normalizeTeamEvents', () => {
  it('keeps a well-formed response as it is, Demo Days included', () => {
    const body = { upcoming: group(TEAM_UPCOMING), past: group(TEAM_PAST) };
    expect(normalizeTeamEvents(body)).toEqual(body);
  });

  it('is null for anything that is not this endpoint’s answer', () => {
    for (const body of [null, undefined, 'x', [], { message: 'Forbidden', statusCode: 403 }]) {
      expect(normalizeTeamEvents(body)).toBeNull();
    }
  });

  it('drops malformed items, defaults the rest, keeps memberCount at least the faces it has, and is idempotent', () => {
    const result = normalizeTeamEvents({
      upcoming: {
        items: [
          { uid: 'a', name: 'A', startDate: '2026-12-01T00:00:00.000Z', members: [{ uid: 'm1' }, {}] },
          { uid: 'b', name: 'B', startDate: 'soon' },
        ],
      },
      past: {
        items: [
          { kind: 'demo-day', uid: 'dd', title: 'Demo Day', slug: 'dd-2026', startDate: '2026-06-01T00:00:00.000Z' },
          { kind: 'demo-day', uid: 'dd-no-slug', title: 'No slug', startDate: '2026-06-01T00:00:00.000Z' },
          { uid: 'p', name: 'P', startDate: '2026-03-01T00:00:00.000Z', roles: ['Host', 'Participant'] },
        ],
      },
    });

    expect(result?.upcoming?.items).toEqual([
      expect.objectContaining({ uid: 'a', memberCount: 1, members: [{ uid: 'm1', name: '', image: null }] }),
    ]);
    expect(result?.past?.items).toEqual([
      {
        kind: 'demo-day',
        uid: 'dd',
        title: 'Demo Day',
        slug: 'dd-2026',
        startDate: '2026-06-01T00:00:00.000Z',
        endDate: '2026-06-01T00:00:00.000Z',
      },
      expect.objectContaining({ kind: 'event', uid: 'p', roles: ['Host'] }),
    ]);
    expect(normalizeTeamEvents(result)).toEqual(result);
  });
});

describe('getTeamEventsPublic (design D5)', () => {
  const realFetch = global.fetch;
  afterEach(() => {
    global.fetch = realFetch;
  });

  it('asks for past events only, without a token, and keeps no upcoming group', async () => {
    global.fetch = jest.fn().mockResolvedValue(ok({ upcoming: group(TEAM_UPCOMING), past: group(TEAM_PAST) }));

    const result = await getTeamEventsPublic('team-1');

    const [url, init] = (global.fetch as jest.Mock).mock.calls[0];
    expect(url).toBe(teamEventsUrl('team-1', { group: 'past', limit: 50 }));
    expect(url).toContain('/v1/teams/team-1/events?group=past&limit=50');
    expect(init?.headers).toBeUndefined();
    expect(result).toEqual({ upcoming: null, past: group(TEAM_PAST) });
  });

  it('is null on a 403, a 404, a 500 or a throw: the section is absent, with no error banner', async () => {
    for (const status of [403, 404, 500]) {
      global.fetch = jest.fn().mockResolvedValue({ ok: false, status, json: async () => ({}) });
      expect(await getTeamEventsPublic('team-1')).toBeNull();
    }

    global.fetch = jest.fn().mockRejectedValue(new Error('offline'));
    expect(await getTeamEventsPublic('team-1')).toBeNull();
  });
});

describe('useTeamEvents', () => {
  it('reads both groups with the token, under TEAM_EVENTS', async () => {
    mockCustomFetch.mockResolvedValue(ok({ upcoming: group(TEAM_UPCOMING), past: group(TEAM_PAST) }));

    const { result } = renderHook(() => useTeamEvents('team-1'), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockCustomFetch).toHaveBeenCalledWith(teamEventsUrl('team-1', { limit: 50 }), expect.anything(), true);
    expect(result.current.data?.upcoming?.items).toHaveLength(2);
    expect(client.getQueryCache().find({ queryKey: [EventsQueryKeys.TEAM_EVENTS, 'team-1', 'viewer-1'] })).toBeTruthy();
  });

  it('does not run for a signed-out visitor, nor with the flag off', () => {
    useCurrentUserStore.setState({ currentUser: null });
    const signedOut = renderHook(() => useTeamEvents('team-1'), { wrapper });
    expect(signedOut.result.current.fetchStatus).toBe('idle');

    useCurrentUserStore.setState({ currentUser: { uid: 'viewer-1' } as never });
    flag.on = false;
    const flagOff = renderHook(() => useTeamEvents('team-1'), { wrapper });
    expect(flagOff.result.current.fetchStatus).toBe('idle');

    expect(mockCustomFetch).not.toHaveBeenCalled();
  });

  it('does not retry a 403 or 404', async () => {
    client = new QueryClient();
    mockCustomFetch.mockResolvedValue({ ok: false, status: 403, json: async () => ({}) });

    const { result } = renderHook(() => useTeamEvents('team-1'), { wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(mockCustomFetch).toHaveBeenCalledTimes(1);
  });
});

describe('useTeamProfileEvents', () => {
  const view = (props: Partial<Parameters<typeof useTeamProfileEvents>[0]> = {}) =>
    renderHook(() => useTeamProfileEvents({ teamUid: 'team-1', serverEvents: SERVER, isLoggedIn: true, ...props }), {
      wrapper,
    });

  it('Signed-out visitor on a team profile: the server’s past events only, and no request', () => {
    useCurrentUserStore.setState({ currentUser: null });

    const { result } = view({ isLoggedIn: false });

    expect(result.current.upcoming).toEqual([]);
    expect(result.current.upcomingTotal).toBe(0);
    expect(result.current.past.map((e) => e.uid)).toEqual(['dd-1', 'past-1', 'past-2']);
    expect(mockCustomFetch).not.toHaveBeenCalled();
  });

  it('draws the server list until the viewer’s read lands, then switches to it', async () => {
    mockCustomFetch.mockResolvedValue(ok({ upcoming: group(TEAM_UPCOMING), past: group([DEMO_DAY]) }));

    const { result } = view();

    expect(result.current.past).toHaveLength(3);
    expect(result.current.upcoming).toEqual([]);
    await waitFor(() => expect(result.current.upcoming).toHaveLength(2));
    expect(result.current.past).toEqual([DEMO_DAY]);
  });

  it('keeps the server list when the viewer’s read fails', async () => {
    mockCustomFetch.mockResolvedValue({ ok: false, status: 404, json: async () => ({}) });

    const { result } = view();

    await waitFor(() =>
      expect(client.getQueryState([EventsQueryKeys.TEAM_EVENTS, 'team-1', 'viewer-1'])?.status).toBe('error'),
    );
    expect(result.current.past).toHaveLength(3);
  });

  it('orders upcoming soonest first, and past with Demo Days first, then newest first', async () => {
    const later = teamEvent({ uid: 'u-late', name: 'Late', startDate: '2027-01-10T00:00:00.000Z' });
    const sooner = teamEvent({ uid: 'u-soon', name: 'Soon', startDate: '2026-11-20T00:00:00.000Z' });
    const old = pastEvent({ uid: 'p-old', name: 'Old', startDate: '2025-01-01T00:00:00.000Z' });
    const recent = pastEvent({ uid: 'p-new', name: 'New', startDate: '2026-10-01T00:00:00.000Z' });
    mockCustomFetch.mockResolvedValue(
      ok({ upcoming: group([later, sooner]), past: group([old, recent, DEMO_DAY], 5) }),
    );

    const { result } = view();

    await waitFor(() => expect(result.current.upcoming).toHaveLength(2));
    expect(result.current.upcoming.map((e) => e.uid)).toEqual(['u-soon', 'u-late']);
    expect(result.current.past.map((e) => e.uid)).toEqual(['dd-1', 'p-new', 'p-old']);
    expect(result.current.pastTotal).toBe(5);
  });

  it('no server list and no read: nothing to draw', () => {
    useCurrentUserStore.setState({ currentUser: null });

    const { result } = view({ serverEvents: null, isLoggedIn: false });

    expect(result.current).toEqual({ upcoming: [], upcomingTotal: 0, past: [], pastTotal: 0 });
  });
});
