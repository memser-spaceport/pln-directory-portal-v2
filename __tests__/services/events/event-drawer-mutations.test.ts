import {
  EVENT_DRAWER_INVALIDATED_KEYS,
  SavePlansError,
  invalidateEventDrawerQueries,
  savePlans,
  type SavePlansInput,
} from '@/services/events/hooks/useEventDrawerMutations';
import { EventsQueryKeys } from '@/services/events/constants';
import { customFetch } from '@/utils/fetch-wrapper';

jest.mock('@/utils/fetch-wrapper', () => ({ customFetch: jest.fn() }));

const mockFetch = customFetch as jest.Mock;
const ok = { ok: true, status: 200, json: async () => ({}) };

const input = (overrides: Partial<SavePlansInput> = {}): SavePlansInput => ({
  locationUid: 'loc',
  memberUid: 'me',
  existing: ['a', 'b', 'past'],
  selected: ['a', 'c'],
  pickable: ['a', 'b', 'c'],
  eventRoles: [
    { eventUid: 'a', roles: ['Attendee'] },
    { eventUid: 'c', roles: ['Speaker'] },
  ],
  shared: {
    teamUid: null,
    topics: ['AI'],
    reason: '',
    telegramId: '@me',
    officeHours: '',
    checkInDate: '2030-12-01',
    checkOutDate: '2030-12-05',
  },
  showOnProfile: false,
  ...overrides,
});

const calls = () =>
  mockFetch.mock.calls.map(([url, init]) => ({
    url: String(url).replace(String(process.env.DIRECTORY_API_URL), ''),
    method: init.method,
    body: JSON.parse(init.body),
  }));

describe('saving plans is a diff, never PUT (LAB-3216, design D4)', () => {
  beforeEach(() => {
    mockFetch.mockReset();
    mockFetch.mockResolvedValue(ok);
  });

  it('creates added, updates kept and deletes removed events', async () => {
    const result = await savePlans(input());

    expect(result).toEqual({ added: ['c'], removed: ['b'], kept: ['a'] });
    expect(calls()).toEqual([
      {
        url: '/v1/irl/locations/loc/guests?type=upcoming',
        method: 'POST',
        body: {
          memberUid: 'me',
          telegramId: '@me',
          reason: '',
          topics: ['AI'],
          officeHours: '',
          additionalInfo: { checkInDate: '2030-12-01', checkOutDate: '2030-12-05' },
          showOnProfile: false,
          events: [{ uid: 'c', isHost: false, isSpeaker: true, isSponsor: false }],
        },
      },
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
          events: [{ uid: 'a', isHost: false, isSpeaker: false, isSponsor: false }],
        },
      },
      {
        url: '/v1/irl/locations/loc/events/guests',
        method: 'POST',
        body: { membersAndEvents: [{ memberUid: 'me', events: ['b'] }] },
      },
    ]);
    expect(mockFetch.mock.calls.every(([, init]) => init.method !== 'PUT')).toBe(true);
  });

  it('only updates when nothing was added or removed', async () => {
    await savePlans(input({ existing: ['a'], selected: ['a'] }));
    expect(calls().map((c) => c.method)).toEqual(['PATCH']);
  });

  it('sends a team only when one is chosen', async () => {
    await savePlans(input({ existing: [], selected: ['a'], shared: { ...input().shared, teamUid: 't-1' } }));
    expect(calls()[0].body.teamUid).toBe('t-1');
  });

  it('reports what was saved before a failure, so a retry does not redo it', async () => {
    mockFetch
      .mockResolvedValueOnce(ok)
      .mockResolvedValueOnce({ ok: false, status: 500, json: async () => ({ message: 'Boom' }) });

    const error = await savePlans(input()).catch((e) => e);

    expect(error).toBeInstanceOf(SavePlansError);
    expect(error.message).toBe('Boom');
    expect(error.done).toEqual({ added: ['c'], removed: [] });
    expect(calls().map((c) => c.method)).toEqual(['POST', 'PATCH']);
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
