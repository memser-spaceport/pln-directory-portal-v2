/**
 * LAB-3217: the member profile's Events data — the BE read (LAB-3215), the server's past-only fetch (design D5), and
 * what each viewer gets to see.
 */
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';

import {
  memberEvent,
  PAST,
  UPCOMING,
} from '@/components/page/member-details/MemberEventsSection/MemberEventsSection.fixtures';
import { useMemberProfileEvents } from '@/components/page/member-details/MemberEventsSection/useMemberProfileEvents';
import { useCurrentUserStore } from '@/services/auth/store';
import { EventsQueryKeys } from '@/services/events/constants';
import { useMemberEvents } from '@/services/events/hooks/useMemberEvents';
import {
  getMemberEventsPublic,
  memberEventsUrl,
  normalizeMemberEvents,
  type MemberEvents,
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

function wrapper({ children }: { children: React.ReactNode }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

const SERVER: MemberEvents = { upcoming: null, past: group(PAST) };

beforeEach(() => {
  flag.on = true;
  mockCustomFetch.mockReset();
  useCurrentUserStore.setState({ currentUser: { uid: 'viewer-1' } as never });
});

describe('normalizeMemberEvents', () => {
  it('keeps a well-formed response as it is', () => {
    const body = { upcoming: group(UPCOMING), past: group(PAST) };
    expect(normalizeMemberEvents(body)).toEqual(body);
  });

  it('is null for anything that is not this endpoint’s answer', () => {
    for (const body of [null, undefined, 'x', [], { memberInfo: {} }, { message: 'Forbidden', statusCode: 403 }]) {
      expect(normalizeMemberEvents(body)).toBeNull();
    }
  });

  it('drops malformed items, keeps known roles only, defaults the rest, and is idempotent', () => {
    const result = normalizeMemberEvents({
      past: {
        total: 1,
        items: [
          { uid: 'a', name: 'A', startDate: '2026-03-12T00:00:00.000Z', roles: ['Speaker', 'Attendee'], faces: [{}] },
          { uid: 'b', name: 'B', startDate: 'not a date' },
          { name: 'no uid', startDate: '2026-03-12T00:00:00.000Z' },
        ],
      },
    });

    expect(result?.upcoming).toBeNull();
    expect(result?.past?.items).toEqual([
      expect.objectContaining({
        uid: 'a',
        endDate: '2026-03-12T00:00:00.000Z',
        city: null,
        roles: ['Speaker'],
        faces: [],
        goingCount: 0,
        viewerGoing: false,
        showOnProfile: true,
      }),
    ]);
    expect(result?.past?.total).toBe(1);
    expect(normalizeMemberEvents(result)).toEqual(result);
  });
});

describe('getMemberEventsPublic (design D5)', () => {
  const realFetch = global.fetch;
  afterEach(() => {
    global.fetch = realFetch;
  });

  it('asks for past events only, without a token, and keeps no upcoming group', async () => {
    global.fetch = jest.fn().mockResolvedValue(ok({ upcoming: group(UPCOMING), past: group(PAST) }));

    const result = await getMemberEventsPublic('member-1');

    const [url, init] = (global.fetch as jest.Mock).mock.calls[0];
    expect(url).toBe(memberEventsUrl('member-1', { group: 'past', limit: 50 }));
    expect(url).toContain('/v1/members/member-1/events?group=past&limit=50');
    expect(init?.headers).toBeUndefined();
    expect(result).toEqual({ upcoming: null, past: group(PAST) });
  });

  it('is null when the request fails or throws', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 500, json: async () => ({}) });
    expect(await getMemberEventsPublic('member-1')).toBeNull();

    global.fetch = jest.fn().mockRejectedValue(new Error('offline'));
    expect(await getMemberEventsPublic('member-1')).toBeNull();
  });
});

describe('useMemberEvents', () => {
  it('reads both groups with the token, under MEMBER_EVENTS', async () => {
    mockCustomFetch.mockResolvedValue(ok({ upcoming: group(UPCOMING), past: group(PAST) }));

    const { result } = renderHook(() => useMemberEvents('member-1'), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockCustomFetch).toHaveBeenCalledWith(memberEventsUrl('member-1', { limit: 50 }), expect.anything(), true);
    expect(result.current.data?.upcoming?.items).toHaveLength(2);
    expect(EventsQueryKeys.MEMBER_EVENTS).toBe('MEMBER_EVENTS');
  });

  it('does not run for a signed-out visitor, nor with the flag off', () => {
    useCurrentUserStore.setState({ currentUser: null });
    const signedOut = renderHook(() => useMemberEvents('member-1'), { wrapper });
    expect(signedOut.result.current.fetchStatus).toBe('idle');

    useCurrentUserStore.setState({ currentUser: { uid: 'viewer-1' } as never });
    flag.on = false;
    const flagOff = renderHook(() => useMemberEvents('member-1'), { wrapper });
    expect(flagOff.result.current.fetchStatus).toBe('idle');

    expect(mockCustomFetch).not.toHaveBeenCalled();
  });
});

describe('useMemberProfileEvents', () => {
  const view = (props: Partial<Parameters<typeof useMemberProfileEvents>[0]> = {}) =>
    renderHook(
      () =>
        useMemberProfileEvents({
          memberUid: 'member-1',
          serverEvents: SERVER,
          isOwner: false,
          isLoggedIn: true,
          ...props,
        }),
      { wrapper },
    );

  it('Signed-out visitor: the server’s past events only, and no request', () => {
    useCurrentUserStore.setState({ currentUser: null });

    const { result } = view({ isLoggedIn: false });

    expect(result.current.upcoming).toEqual([]);
    expect(result.current.past.map((e) => e.uid)).toEqual(['past-1', 'past-2', 'past-3']);
    expect(result.current.placement).toBe('low');
    expect(mockCustomFetch).not.toHaveBeenCalled();
  });

  it('draws the server list until the viewer’s read lands, then switches to it', async () => {
    mockCustomFetch.mockResolvedValue(ok({ upcoming: group(UPCOMING), past: group(PAST.slice(0, 1)) }));

    const { result } = view();

    expect(result.current.past).toHaveLength(3);
    await waitFor(() => expect(result.current.upcoming).toHaveLength(2));
    expect(result.current.past).toHaveLength(1);
    expect(result.current.placement).toBe('high');
  });

  it('Hidden event: a hidden event in the response is not shown to another member, and leaves the total', async () => {
    const hidden = memberEvent({ uid: 'up-hidden', name: 'Event A', showOnProfile: false });
    mockCustomFetch.mockResolvedValue(ok({ upcoming: group([hidden, UPCOMING[1]], 2), past: group([]) }));

    const { result } = view();

    await waitFor(() => expect(result.current.upcoming).toHaveLength(1));
    expect(result.current.upcoming.map((e) => e.name)).toEqual(['Funding the Commons']);
    expect(result.current.upcomingTotal).toBe(1);
  });

  it('the owner keeps their hidden events, and always gets the high slot', async () => {
    const hidden = memberEvent({ uid: 'up-hidden', name: 'Event A', showOnProfile: false });
    mockCustomFetch.mockResolvedValue(ok({ upcoming: group([hidden], 1), past: group([]) }));

    const { result } = view({ isOwner: true });

    expect(result.current.placement).toBe('high');
    await waitFor(() => expect(result.current.upcoming).toHaveLength(1));
  });

  it('sorts upcoming soonest first and past newest first', async () => {
    mockCustomFetch.mockResolvedValue(
      ok({ upcoming: group([...UPCOMING].reverse()), past: group([...PAST].reverse()) }),
    );

    const { result } = view();

    await waitFor(() => expect(result.current.upcoming).toHaveLength(2));
    expect(result.current.upcoming.map((e) => e.uid)).toEqual(['up-1', 'up-2']);
    expect(result.current.past.map((e) => e.uid)).toEqual(['past-1', 'past-2', 'past-3']);
  });

  it('falls back to the server’s past list when the read fails, and to nothing without one', async () => {
    mockCustomFetch.mockResolvedValue({ ok: false, status: 403, json: async () => ({}) });

    const withServer = view();
    const withoutServer = view({ serverEvents: null });

    await waitFor(() => expect(mockCustomFetch).toHaveBeenCalledTimes(2));
    expect(withServer.result.current.past).toHaveLength(3);
    expect(withServer.result.current.upcoming).toEqual([]);
    expect(withoutServer.result.current.past).toEqual([]);
    expect(withoutServer.result.current.placement).toBe('low');
  });

  it('member with past events only: the low slot', async () => {
    mockCustomFetch.mockResolvedValue(ok({ upcoming: group([]), past: group(PAST) }));

    const { result } = view();

    await waitFor(() => expect(mockCustomFetch).toHaveBeenCalled());
    expect(result.current.placement).toBe('low');
  });
});
