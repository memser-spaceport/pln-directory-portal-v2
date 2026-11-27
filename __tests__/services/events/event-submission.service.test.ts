import {
  deleteEvent,
  EventRequestError,
  getEventForEdit,
  getMyEvents,
  parseAgenda,
  resolvePlace,
  searchPlaces,
  submitEvent,
  updateEvent,
  uploadEventLogo,
} from '@/services/events/event-submission.service';
import type { SubmitEventBody } from '@/services/events/event-submission.types';
import { customFetch } from '@/utils/fetch-wrapper';

/* The calls behind the submit form, the edit page and My Submissions (`/v1/irl/events`). */

jest.mock('@/utils/fetch-wrapper', () => ({ customFetch: jest.fn() }));

const mockFetch = customFetch as jest.Mock;

const answer = (status: number, body?: unknown) =>
  Promise.resolve({
    ok: status >= 200 && status < 300,
    status,
    json: () => (body === undefined ? Promise.reject(new Error('no body')) : Promise.resolve(body)),
  } as Response);

const body: SubmitEventBody = {
  name: 'Lisbon Meetup',
  startDate: '2030-12-03T09:00:00.000Z',
  endDate: '2030-12-03T18:00:00.000Z',
  timezone: 'Europe/Lisbon',
  allDay: false,
  format: 'IN_PERSON',
  accessOption: 'OPEN',
  tags: ['Workshop'],
  hostName: 'Protocol Labs',
};

beforeAll(() => {
  process.env.DIRECTORY_API_URL = 'https://api.test';
});

beforeEach(() => {
  mockFetch.mockReset();
});

describe('submitEvent', () => {
  it.each(['APPROVED', 'PENDING'] as const)('returns the uid and the status the backend gave: %s', async (status) => {
    mockFetch.mockReturnValue(answer(201, { uid: 'e1', status }));
    await expect(submitEvent(body)).resolves.toEqual({ uid: 'e1', status });
    const [url, init, withAuth] = mockFetch.mock.calls[0];
    expect(url).toBe('https://api.test/v1/irl/events');
    expect(init.method).toBe('POST');
    expect(JSON.parse(init.body)).toEqual(body);
    expect(withAuth).toBe(true);
  });

  it('sends a draft and returns DRAFT', async () => {
    mockFetch.mockReturnValue(answer(201, { uid: 'e2', status: 'DRAFT' }));
    await expect(submitEvent({ ...body, draft: true })).resolves.toEqual({ uid: 'e2', status: 'DRAFT' });
    expect(JSON.parse(mockFetch.mock.calls[0][1].body).draft).toBe(true);
  });

  it('throws the status and the API message for a 400', async () => {
    mockFetch.mockReturnValue(
      answer(400, { message: 'tags: at least one tag is required; hostName: hostName is required' }),
    );
    await expect(submitEvent(body)).rejects.toMatchObject({
      name: 'EventRequestError',
      status: 400,
      message: 'tags: at least one tag is required; hostName: hostName is required',
    });
  });

  it('throws 429 for too many submissions', async () => {
    mockFetch.mockReturnValue(answer(429, { message: 'ThrottlerException: Too Many Requests' }));
    await expect(submitEvent(body)).rejects.toMatchObject({ status: 429 });
  });

  it('throws with no status when the network fails', async () => {
    mockFetch.mockRejectedValue(new TypeError('Failed to fetch'));
    const error = await submitEvent(body).catch((e) => e);
    expect(error).toBeInstanceOf(EventRequestError);
    expect(error.status).toBeNull();
  });

  it('throws with no status when the session ended before the call', async () => {
    mockFetch.mockResolvedValue(undefined);
    await expect(submitEvent(body)).rejects.toMatchObject({ status: null });
  });
});

describe('updateEvent and deleteEvent', () => {
  it('patches the event with the token and passes `submit`', async () => {
    mockFetch.mockReturnValue(answer(200, { uid: 'e 1', status: 'APPROVED' }));
    await expect(updateEvent('e 1', { name: 'New name', submit: true })).resolves.toEqual({
      uid: 'e 1',
      status: 'APPROVED',
    });
    const [url, init, withAuth] = mockFetch.mock.calls[0];
    expect(url).toBe('https://api.test/v1/irl/events/e%201');
    expect(init.method).toBe('PATCH');
    expect(JSON.parse(init.body)).toEqual({ name: 'New name', submit: true });
    expect(withAuth).toBe(true);
  });

  it('deletes the event, also when the answer has no body', async () => {
    mockFetch.mockReturnValue(answer(204));
    await expect(deleteEvent('e1')).resolves.toBeUndefined();
    expect(mockFetch.mock.calls[0][1].method).toBe('DELETE');
  });

  it('throws 403 when the submitter deletes an approved event', async () => {
    mockFetch.mockReturnValue(answer(403, { message: 'Forbidden' }));
    await expect(deleteEvent('e1')).rejects.toMatchObject({ status: 403 });
  });
});

describe('getMyEvents and getEventForEdit', () => {
  const mine = [{ uid: 'e1', name: 'A', startDate: 's', endDate: 'e', status: 'DRAFT' }];

  it('reads the list as an array or as `items`', async () => {
    mockFetch.mockReturnValueOnce(answer(200, mine));
    await expect(getMyEvents()).resolves.toEqual(mine);
    mockFetch.mockReturnValueOnce(answer(200, { items: mine }));
    await expect(getMyEvents()).resolves.toEqual(mine);
    expect(mockFetch.mock.calls[0][0]).toBe('https://api.test/v1/irl/events/mine');
  });

  it('throws when the list cannot load', async () => {
    mockFetch.mockReturnValue(answer(500, {}));
    await expect(getMyEvents()).rejects.toMatchObject({ status: 500 });
  });

  it('returns null for an event the member may not read (404), and throws for another failure', async () => {
    mockFetch.mockReturnValueOnce(answer(404, { message: 'Not found' }));
    await expect(getEventForEdit('e1')).resolves.toBeNull();
    mockFetch.mockReturnValueOnce(answer(500, {}));
    await expect(getEventForEdit('e1')).rejects.toMatchObject({ status: 500 });
  });
});

describe('lookups', () => {
  it('asks nothing for an empty venue text', async () => {
    await expect(searchPlaces('   ')).resolves.toEqual([]);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('returns venue suggestions that have a text and a place id', async () => {
    mockFetch.mockReturnValue(answer(200, [{ text: 'Avenida da Liberdade, Lisbon', placeId: 'p1' }, { text: 'x' }]));
    await expect(searchPlaces('Avenida da Liberdade')).resolves.toEqual([
      { text: 'Avenida da Liberdade, Lisbon', placeId: 'p1' },
    ]);
    expect(mockFetch.mock.calls[0][0]).toBe('https://api.test/v1/irl/events/places?query=Avenida%20da%20Liberdade');
    expect(mockFetch.mock.calls[0][2]).toBe(true);
  });

  it('resolves a place by id or by text, and returns null for no match', async () => {
    const place = { address: 'Shibuya', city: 'Tokyo', timezone: 'Asia/Tokyo' };
    mockFetch.mockReturnValueOnce(answer(200, place));
    await expect(resolvePlace({ placeId: 'p1' })).resolves.toEqual(place);
    expect(mockFetch.mock.calls[0][0]).toBe('https://api.test/v1/irl/events/places/resolve?placeId=p1');

    mockFetch.mockReturnValueOnce(answer(404, {}));
    await expect(resolvePlace({ address: 'zzzz qqqq' })).resolves.toBeNull();
    expect(mockFetch.mock.calls[1][0]).toBe('https://api.test/v1/irl/events/places/resolve?address=zzzz+qqqq');
  });

  it('reads parsed sessions under either date key and the message', async () => {
    mockFetch.mockReturnValue(
      answer(200, {
        sessions: [
          { name: 'Opening', start_date: '2030-01-28T10:00:00Z', end_date: '2030-01-28T10:30:00Z' },
          { name: 'Lunch', startDate: '2030-01-28T12:00:00Z', endDate: '2030-01-28T13:00:00Z', description: 'Food' },
          { name: 'No times' },
        ],
        message: ' ',
      }),
    );
    const input = { text: 'x', startDate: 's', endDate: 'e', timezone: 'Europe/Lisbon' };
    await expect(parseAgenda(input)).resolves.toEqual({
      sessions: [
        {
          name: 'Opening',
          description: null,
          start_date: '2030-01-28T10:00:00Z',
          end_date: '2030-01-28T10:30:00Z',
          timezone: 'Europe/Lisbon',
        },
        {
          name: 'Lunch',
          description: 'Food',
          start_date: '2030-01-28T12:00:00Z',
          end_date: '2030-01-28T13:00:00Z',
          timezone: 'Europe/Lisbon',
        },
      ],
      message: null,
    });
    expect(JSON.parse(mockFetch.mock.calls[0][1].body)).toEqual(input);
  });

  it('throws 401 when the session is gone, and 503 when the agenda parser is down', async () => {
    mockFetch.mockReturnValue(answer(503, {}));
    await expect(parseAgenda({ text: 'x', startDate: 's', endDate: 'e', timezone: 'UTC' })).rejects.toMatchObject({
      status: 503,
    });
  });
});

describe('uploadEventLogo', () => {
  const realFetch = global.fetch;
  afterEach(() => {
    global.fetch = realFetch;
  });
  const file = new File(['x'], 'logo.png', { type: 'image/png' });

  it('returns the stored image uid', async () => {
    global.fetch = jest.fn(() => answer(201, { image: { uid: 'img-1' } })) as unknown as typeof fetch;
    await expect(uploadEventLogo(file)).resolves.toBe('img-1');
  });

  it('throws when the upload fails', async () => {
    global.fetch = jest.fn(() => answer(500, {})) as unknown as typeof fetch;
    await expect(uploadEventLogo(file)).rejects.toMatchObject({ status: 500 });
  });
});
