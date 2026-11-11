import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';

import { useCurrentUserStore } from '@/services/auth/store';
import { EventsQueryKeys } from '@/services/events/constants';
import * as service from '@/services/events/event-drawer.service';
import {
  useMarkGoing,
  useRemoveGoing,
  useSavePlans,
  useSetShowOnProfile,
} from '@/services/events/hooks/useEventDrawerMutations';
import { useEventAttendees, useEventDetail, useMyGatheringPlans } from '@/services/events/hooks/useEventDrawerQueries';

// The real React Query: the global mock in jest.setup.js ignores `enabled` and never settles a mutation.
jest.unmock('@tanstack/react-query');
jest.mock('@/services/events/event-drawer.service', () => ({
  ...jest.requireActual('@/services/events/event-drawer.service'),
  getEventDetail: jest.fn(),
  getEventAttendees: jest.fn(),
  getMyGatheringPlans: jest.fn(),
  createEventAttendance: jest.fn(),
  removeEventAttendance: jest.fn(),
  setEventShowOnProfile: jest.fn(),
  updateMyGatheringPlans: jest.fn(),
}));

const mocked = service as jest.Mocked<typeof service>;

function setup() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  const invalidate = jest.spyOn(queryClient, 'invalidateQueries');
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return { queryClient, invalidate, wrapper };
}

const invalidatedKeys = (invalidate: jest.SpyInstance) =>
  invalidate.mock.calls.map(([arg]) => (arg as { queryKey: unknown[] }).queryKey[0]);

const ALL_KEYS = [
  EventsQueryKeys.EVENT_DETAIL,
  EventsQueryKeys.EVENT_ATTENDEES,
  EventsQueryKeys.MY_GATHERING_PLANS,
  EventsQueryKeys.MEMBER_EVENTS,
  EventsQueryKeys.TEAM_EVENTS,
  EventsQueryKeys.MY_UPCOMING_EVENT_UIDS,
];

describe('event drawer hooks (LAB-3216)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useCurrentUserStore.setState({ currentUser: { uid: 'me', name: 'Me' } as never });
  });

  describe('queries', () => {
    it('reads the event with the token when signed in, and without it when not', async () => {
      mocked.getEventDetail.mockResolvedValue(null);
      const { wrapper } = setup();
      const { result } = renderHook(() => useEventDetail('ev'), { wrapper });
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(mocked.getEventDetail).toHaveBeenCalledWith('ev', true);

      useCurrentUserStore.setState({ currentUser: null as never });
      const second = setup();
      const { result: anon } = renderHook(() => useEventDetail('ev'), { wrapper: second.wrapper });
      await waitFor(() => expect(anon.current.isSuccess).toBe(true));
      expect(mocked.getEventDetail).toHaveBeenLastCalledWith('ev', false);
    });

    it('does not read the viewer plans without a current user', async () => {
      useCurrentUserStore.setState({ currentUser: null as never });
      const { wrapper } = setup();
      const { result } = renderHook(() => useMyGatheringPlans('loc'), { wrapper });
      await act(async () => {});
      expect(result.current.fetchStatus).toBe('idle');
      expect(mocked.getMyGatheringPlans).not.toHaveBeenCalled();
    });

    it('reads the attendees only once the list is opened, and pages until the total', async () => {
      mocked.getEventAttendees.mockImplementation(async ({ page }) => ({
        rows: [{ memberUid: `m-${page}`, name: '', image: null, role: null, teamName: null, roles: [] }],
        total: 2,
        page,
      }));
      const { wrapper } = setup();
      const { result, rerender } = renderHook(
        ({ enabled }) => useEventAttendees({ locationUid: 'loc', eventUid: 'ev', search: '', enabled }),
        { wrapper, initialProps: { enabled: false } },
      );
      await act(async () => {});
      expect(mocked.getEventAttendees).not.toHaveBeenCalled();

      rerender({ enabled: true });
      await waitFor(() => expect(result.current.hasNextPage).toBe(true));
      await act(async () => {
        await result.current.fetchNextPage();
      });
      await waitFor(() => expect(result.current.data?.pages).toHaveLength(2));
      expect(result.current.hasNextPage).toBe(false);
    });
  });

  describe('mutations invalidate the D3 keys, on success and on failure', () => {
    it.each([
      ['useMarkGoing', () => useMarkGoing(), mocked.createEventAttendance, { locationUid: 'loc', payload: {} }],
      [
        'useRemoveGoing',
        () => useRemoveGoing(),
        mocked.removeEventAttendance,
        { locationUid: 'loc', memberUid: 'me', eventUids: ['a'] },
      ],
      [
        'useSetShowOnProfile',
        () => useSetShowOnProfile(),
        mocked.setEventShowOnProfile,
        { eventUid: 'a', showOnProfile: false },
      ],
    ] as const)('%s', async (_name, useHook, call, variables) => {
      (call as jest.Mock).mockResolvedValueOnce(undefined).mockRejectedValueOnce(new Error('nope'));
      const { wrapper, invalidate } = setup();
      const { result } = renderHook(() => (useHook as () => { mutateAsync: (v: unknown) => Promise<unknown> })(), {
        wrapper,
      });

      await act(async () => {
        await result.current.mutateAsync(variables);
      });
      expect(invalidatedKeys(invalidate)).toEqual(ALL_KEYS);

      invalidate.mockClear();
      await act(async () => {
        await result.current.mutateAsync(variables).catch(() => {});
      });
      expect(invalidatedKeys(invalidate)).toEqual(ALL_KEYS);
    });

    it('useSavePlans', async () => {
      mocked.updateMyGatheringPlans.mockResolvedValue(undefined);
      const { wrapper, invalidate } = setup();
      const { result } = renderHook(() => useSavePlans(), { wrapper });
      await act(async () => {
        await result.current.mutateAsync({
          locationUid: 'loc',
          memberUid: 'me',
          existing: ['a'],
          selected: ['a'],
          pickable: ['a'],
          eventRoles: [],
          showOnProfile: true,
          shared: {
            teamUid: null,
            topics: [],
            reason: '',
            telegramId: '',
            officeHours: '',
            checkInDate: '',
            checkOutDate: '',
          },
        });
      });
      expect(mocked.updateMyGatheringPlans).toHaveBeenCalledTimes(1);
      expect(mocked.createEventAttendance).not.toHaveBeenCalled();
      expect(mocked.removeEventAttendance).not.toHaveBeenCalled();
      expect(invalidatedKeys(invalidate)).toEqual(ALL_KEYS);
    });
  });
});
