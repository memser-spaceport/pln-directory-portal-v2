import { customFetch } from '@/utils/fetch-wrapper';
import { getSpvSpotlight, requestSpvAccess } from '@/services/spv-spotlight/spv-spotlight.service';
import {
  SpvAccessRequestBlockedError,
  SpvAccessRequestValidationError,
  SpvSpotlightClosedError,
  type SpvAccessRequestPayload,
} from '@/services/spv-spotlight/types';

jest.mock('@/utils/fetch-wrapper', () => ({ customFetch: jest.fn() }));

const mockedFetch = customFetch as jest.Mock;

const payload: SpvAccessRequestPayload = {
  email: 'maya@northfield.vc',
  name: 'Maya Chen',
  role: 'Partner',
  organization: 'Northfield Ventures',
  isAccreditedInvestor: true,
};

const response = (status: number, body: unknown) => ({
  ok: status >= 200 && status < 300,
  status,
  json: () => Promise.resolve(body),
});

describe('spv-spotlight.service', () => {
  beforeEach(() => mockedFetch.mockReset());

  it('reads the spotlight and resolves null on 404', async () => {
    mockedFetch.mockResolvedValueOnce(response(404, { statusCode: 404, message: 'SPV spotlight not found' }));
    await expect(getSpvSpotlight('missing', false)).resolves.toBeNull();
    expect(mockedFetch.mock.calls[0][0]).toMatch(/\/v1\/spv-spotlights\/missing$/);
  });

  it('sends the token only for a signed-in read, and never caches it', async () => {
    mockedFetch.mockResolvedValue(response(200, { slug: 's' }));
    await getSpvSpotlight('s', true);
    await getSpvSpotlight('s', false);
    expect(mockedFetch.mock.calls[0][1]).toEqual(expect.objectContaining({ cache: 'no-store' }));
    expect(mockedFetch.mock.calls[0][2]).toBe(true);
    expect(mockedFetch.mock.calls[1][2]).toBe(false);
  });

  it('throws on other failures instead of painting an empty page', async () => {
    mockedFetch.mockResolvedValueOnce(response(500, {}));
    await expect(getSpvSpotlight('x', true)).rejects.toThrow();
  });

  it('posts JSON with a Content-Type (customFetch adds none)', async () => {
    mockedFetch.mockResolvedValueOnce(response(201, { memberUid: 'm1', isNewMember: true }));
    await expect(requestSpvAccess('s', payload, false)).resolves.toEqual({ memberUid: 'm1', isNewMember: true });
    const [url, init, authenticated] = mockedFetch.mock.calls[0];
    expect(url).toMatch(/\/v1\/spv-spotlights\/s\/access-requests$/);
    expect(init.headers['Content-Type']).toBe('application/json');
    expect(JSON.parse(init.body)).toEqual(payload);
    expect(authenticated).toBe(false);
  });

  it.each(['ALREADY_APPLIED', 'REJECTED', 'PRE_APPROVED'] as const)(
    'turns a 409 %s into a typed block',
    async (reason) => {
      mockedFetch.mockResolvedValueOnce(response(409, { reason }));
      const error = await requestSpvAccess('s', payload, false).catch((e) => e);
      expect(error).toBeInstanceOf(SpvAccessRequestBlockedError);
      expect(error.reason).toBe(reason);
    },
  );

  it('turns the reasonless closed 409 into a closed error, not a sign-in prompt', async () => {
    mockedFetch.mockResolvedValueOnce(response(409, { message: 'This spotlight is closed' }));
    const error = await requestSpvAccess('s', payload, false).catch((e) => e);
    expect(error).toBeInstanceOf(SpvSpotlightClosedError);
  });

  it('treats a 409 with no reason and no closed message as already applied', async () => {
    mockedFetch.mockResolvedValueOnce(response(409, { statusCode: 409 }));
    const error = await requestSpvAccess('s', payload, false).catch((e) => e);
    expect(error).toBeInstanceOf(SpvAccessRequestBlockedError);
    expect(error.reason).toBe('ALREADY_APPLIED');
  });

  it('treats a 409 with an unknown reason as already applied', async () => {
    mockedFetch.mockResolvedValueOnce(response(409, { reason: 'SOMETHING_NEW' }));
    const error = await requestSpvAccess('s', payload, false).catch((e) => e);
    expect(error.reason).toBe('ALREADY_APPLIED');
  });

  it('turns a 422 into a validation error carrying the backend message', async () => {
    const message = 'Input validation failed: email must be a valid email';
    mockedFetch.mockResolvedValueOnce(response(422, { statusCode: 422, message, error: 'Unprocessable Entity' }));
    const error = await requestSpvAccess('s', payload, false).catch((e) => e);
    expect(error).toBeInstanceOf(SpvAccessRequestValidationError);
    expect(error.message).toBe(message);
  });

  it('throws a plain error on other failures', async () => {
    mockedFetch.mockResolvedValueOnce(response(500, {}));
    const error = await requestSpvAccess('s', payload, false).catch((e) => e);
    expect(error).toBeInstanceOf(Error);
    expect(error).not.toBeInstanceOf(SpvAccessRequestValidationError);
  });
});
