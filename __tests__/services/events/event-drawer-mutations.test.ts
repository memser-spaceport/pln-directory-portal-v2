import {
  EVENT_DRAWER_INVALIDATED_KEYS,
  invalidateEventDrawerQueries,
  updateEventPlans,
  type UpdateEventPlansInput,
} from '@/services/events/hooks/useEventDrawerMutations';
import { EventsQueryKeys } from '@/services/events/constants';
import { customFetch } from '@/utils/fetch-wrapper';

jest.mock('@/utils/fetch-wrapper', () => ({ customFetch: jest.fn() }));

const mockFetch = customFetch as jest.Mock;
const ok = { ok: true, status: 200, json: async () => ({}) };

const input = (overrides: Partial<UpdateEventPlansInput> = {}): UpdateEventPlansInput => ({
  locationUid: 'loc',
  eventUid: 'a',
  roles: ['Speaker'],
  shared: {
    teamUid: null,
    topics: ['AI'],
    reason: '',
    telegramId: '@me',
    officeHours: '',
    checkInDate: '2030-12-01',
    checkOutDate: '2030-12-05',
  },
  ...overrides,
});

const calls = () =>
  mockFetch.mock.calls.map(([url, init]) => ({
    url: String(url).replace(String(process.env.DIRECTORY_API_URL), ''),
    method: init.method,
    body: JSON.parse(init.body),
  }));

describe('"Add your plans" is one PATCH for the drawer\'s event (LAB-3234)', () => {
  beforeEach(() => {
    mockFetch.mockReset();
    mockFetch.mockResolvedValue(ok);
  });

  it("updates in place: this event's role and the shared plans, nothing created or deleted", async () => {
    await updateEventPlans(input());

    expect(calls()).toEqual([
      {
        url: '/v1/irl/locations/loc/guests/me',
        method: 'PATCH',
        body: {
          teamUid: null,
          topics: ['AI'],
          reason: '',
          telegramId: '@me',
          officeHours: '',
          additionalInfo: { checkInDate: '2030-12-01', checkOutDate: '2030-12-05' },
          events: [{ uid: 'a', isHost: false, isSpeaker: true, isSponsor: false }],
        },
      },
    ]);
  });

  it('no role is plain attendance', async () => {
    await updateEventPlans(input({ roles: [] }));
    expect(calls()[0].body.events).toEqual([{ uid: 'a', isHost: false, isSpeaker: false, isSponsor: false }]);
  });

  it('several roles at once', async () => {
    await updateEventPlans(input({ roles: ['Host', 'Sponsor'] }));
    expect(calls()[0].body.events).toEqual([{ uid: 'a', isHost: true, isSpeaker: false, isSponsor: true }]);
  });

  it('sends the chosen team', async () => {
    await updateEventPlans(input({ shared: { ...input().shared, teamUid: 't-1' } }));
    expect(calls()[0].body.teamUid).toBe('t-1');
  });

  it('rejects with the API message', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 500, json: async () => ({ message: 'Boom' }) });
    await expect(updateEventPlans(input())).rejects.toThrow('Boom');
  });

  it('invalidates every key an attendance change makes stale', async () => {
    const queryClient = { invalidateQueries: jest.fn(() => Promise.resolve()) };
    await invalidateEventDrawerQueries(queryClient);
    expect(EVENT_DRAWER_INVALIDATED_KEYS).toEqual([
      EventsQueryKeys.EVENT_DETAIL,
      EventsQueryKeys.EVENT_ATTENDEES,
      EventsQueryKeys.MY_GATHERING_PLANS,
      EventsQueryKeys.MEMBER_EVENTS,
      EventsQueryKeys.TEAM_EVENTS,
      EventsQueryKeys.MY_UPCOMING_EVENT_UIDS,
    ]);
    expect(
      (queryClient.invalidateQueries.mock.calls as unknown as [{ queryKey: string[] }][]).map(([arg]) => arg.queryKey),
    ).toEqual(EVENT_DRAWER_INVALIDATED_KEYS.map((key) => [key]));
  });
});
