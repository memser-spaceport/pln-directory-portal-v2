import {
  EventDetailError,
  createEventAttendance,
  eventAttendeesUrl,
  getEventAttendees,
  getEventDetail,
  getMyGatheringPlans,
  removeEventAttendance,
  updateMyGatheringPlans,
} from '@/services/events/event-drawer.service';
import { customFetch } from '@/utils/fetch-wrapper';

jest.mock('@/utils/fetch-wrapper', () => ({ customFetch: jest.fn() }));

const mockFetch = customFetch as jest.Mock;
const API = process.env.DIRECTORY_API_URL;

const json = (body: unknown, status = 200) => ({ ok: status < 400, status, json: async () => body });

describe('event drawer service (LAB-3216)', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  describe('getEventDetail', () => {
    it('reads one event, with the token only for a signed-in viewer', async () => {
      mockFetch.mockResolvedValue(json({ uid: 'ev 1' }));
      await expect(getEventDetail('ev 1', true)).resolves.toEqual({ uid: 'ev 1' });
      expect(mockFetch).toHaveBeenCalledWith(`${API}/v1/irl/events/ev%201`, { method: 'GET', cache: 'no-store' }, true);

      await getEventDetail('ev-2', false);
      expect(mockFetch).toHaveBeenLastCalledWith(`${API}/v1/irl/events/ev-2`, expect.anything(), false);
    });

    it('returns null for a missing or deleted event', async () => {
      mockFetch.mockResolvedValue(json({ message: 'Not found' }, 404));
      await expect(getEventDetail('gone', true)).resolves.toBeNull();
    });

    it('throws with the status on any other failure', async () => {
      mockFetch.mockResolvedValue(json({}, 500));
      await expect(getEventDetail('ev', true)).rejects.toEqual(new EventDetailError(500));
      mockFetch.mockResolvedValue(undefined);
      await expect(getEventDetail('ev', true)).rejects.toBeInstanceOf(EventDetailError);
    });
  });

  describe('attendees', () => {
    it('asks for one event only, without a type, and searches only when there is a needle', () => {
      expect(eventAttendeesUrl({ locationUid: 'loc', eventUid: 'ev', search: '  ', page: 2, limit: 20 })).toBe(
        `${API}/v1/irl/locations/loc/guests?eventUid=ev&page=2&limit=20`,
      );
      expect(
        eventAttendeesUrl({ locationUid: 'loc', eventUid: 'ev', search: ' light house ', page: 1, limit: 20 }),
      ).toBe(`${API}/v1/irl/locations/loc/guests?eventUid=ev&page=1&limit=20&search=light+house`);
    });

    it('maps rows and reads the total from the first row', async () => {
      mockFetch.mockResolvedValue(
        json([
          { memberUid: 'a', member: { name: 'A' }, events: [{ uid: 'ev', isHost: true }], count: 41 },
          { memberUid: 'b', member: { name: 'B' }, events: [], count: 41 },
        ]),
      );
      const page = await getEventAttendees({
        locationUid: 'loc',
        eventUid: 'ev',
        search: '',
        page: 1,
        limit: 20,
        withAuth: true,
      });
      expect(page.total).toBe(41);
      expect(page.rows.map((r) => [r.memberUid, r.roles])).toEqual([
        ['a', ['Host']],
        ['b', []],
      ]);
    });

    it('reads an empty list as zero', async () => {
      mockFetch.mockResolvedValue(json([]));
      const page = await getEventAttendees({
        locationUid: 'loc',
        eventUid: 'ev',
        search: 'x',
        page: 1,
        limit: 20,
        withAuth: false,
      });
      expect(page).toEqual({ rows: [], total: 0, page: 1 });
    });
  });

  it('reads the caller rows at a gathering with the token', async () => {
    mockFetch.mockResolvedValue(json([{ event: { uid: 'a' } }]));
    const plans = await getMyGatheringPlans('loc', 'me');
    expect(mockFetch).toHaveBeenCalledWith(
      `${API}/v1/irl/locations/loc/guests/me?type=upcoming`,
      { method: 'GET', cache: 'no-store' },
      true,
    );
    expect(plans.eventUids).toEqual(['a']);
  });

  describe('writes', () => {
    it('creates attendance with POST', async () => {
      mockFetch.mockResolvedValue(json({}, 201));
      const payload = {
        memberUid: 'me',
        officeHours: '',
        additionalInfo: { checkInDate: '2030-12-01', checkOutDate: '2030-12-02' },
        events: [{ uid: 'ev', isHost: false, isSpeaker: false, isSponsor: false }],
      };
      await createEventAttendance('loc', payload);
      const [url, init, withToken] = mockFetch.mock.calls[0];
      expect(url).toBe(`${API}/v1/irl/locations/loc/guests?type=upcoming`);
      expect(init.method).toBe('POST');
      expect(JSON.parse(init.body)).toEqual(payload);
      expect(withToken).toBe(true);
    });

    it('carries the API message in the error', async () => {
      mockFetch.mockResolvedValue(json({ message: 'Guest already exists' }, 409));
      await expect(
        createEventAttendance('loc', {
          memberUid: 'me',
          officeHours: '',
          additionalInfo: { checkInDate: '', checkOutDate: '' },
          events: [],
        }),
      ).rejects.toThrow('Guest already exists');
    });

    it('deletes only the named events, and never sends an empty list', async () => {
      mockFetch.mockResolvedValue(json({}));
      await removeEventAttendance('loc', 'me', []);
      expect(mockFetch).not.toHaveBeenCalled();

      await removeEventAttendance('loc', 'me', ['b']);
      const [url, init] = mockFetch.mock.calls[0];
      expect(url).toBe(`${API}/v1/irl/locations/loc/events/guests`);
      expect(init.method).toBe('POST');
      expect(JSON.parse(init.body)).toEqual({ membersAndEvents: [{ memberUid: 'me', events: ['b'] }] });
    });

    it('updates plans in place with PATCH, and fails with a fallback message', async () => {
      mockFetch.mockResolvedValue(json({}));
      await updateMyGatheringPlans('loc', { topics: ['AI'] });
      expect(mockFetch.mock.calls[0][0]).toBe(`${API}/v1/irl/locations/loc/guests/me`);
      expect(mockFetch.mock.calls[0][1].method).toBe('PATCH');

      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => {
          throw new Error('no body');
        },
      });
      await expect(updateMyGatheringPlans('loc', {})).rejects.toThrow('Failed to save your plans');
    });
  });
});
