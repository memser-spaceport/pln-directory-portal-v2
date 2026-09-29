import { customFetch } from '@/utils/fetch-wrapper';
import { getSpvSpotlight, requestSpvAccess } from '@/services/spv-spotlight/spv-spotlight.service';
import {
  getMockSpvSpotlight,
  MOCK_SPV_SLUG,
  mockRequestSpvAccess,
  readSpvMockOverrides,
} from '@/services/spv-spotlight/spv-spotlight.mock';
import { SpvAccessRequestBlockedError, type SpvAccessRequestPayload } from '@/services/spv-spotlight/types';

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

describe('spv-spotlight.service (real API path)', () => {
  beforeEach(() => mockedFetch.mockReset());

  it('reads the spotlight and resolves null on 404', async () => {
    mockedFetch.mockResolvedValueOnce(response(404, {}));
    await expect(getSpvSpotlight('missing', false)).resolves.toBeNull();
    expect(mockedFetch.mock.calls[0][0]).toMatch(/\/v1\/spv-spotlights\/missing$/);
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

  it('treats a 409 with an unknown reason as already applied', async () => {
    mockedFetch.mockResolvedValueOnce(response(409, { reason: 'SOMETHING_NEW' }));
    const error = await requestSpvAccess('s', payload, false).catch((e) => e);
    expect(error.reason).toBe('ALREADY_APPLIED');
  });

  it('surfaces the backend message on other failures', async () => {
    mockedFetch.mockResolvedValueOnce(response(400, { message: 'Bad email' }));
    await expect(requestSpvAccess('s', payload, false)).rejects.toThrow('Bad email');
  });
});

describe('spv-spotlight.mock', () => {
  it('reads the state switch and ignores values it does not know', () => {
    expect(readSpvMockOverrides(new URLSearchParams('mockStatus=closed&mockViewer=approved'))).toEqual({
      status: 'CLOSED',
      access: 'APPROVED',
    });
    expect(readSpvMockOverrides(new URLSearchParams('mockStatus=LIVE&mockViewer=admin'))).toEqual({
      status: undefined,
      access: undefined,
    });
  });

  it('only hands the DocSend link to approved viewers of an open spotlight', async () => {
    const open = await getMockSpvSpotlight(MOCK_SPV_SLUG, true, { status: 'OPEN', access: 'APPROVED' });
    const draft = await getMockSpvSpotlight(MOCK_SPV_SLUG, true, { status: 'DRAFT', access: 'APPROVED' });
    const pending = await getMockSpvSpotlight(MOCK_SPV_SLUG, true, { status: 'OPEN', access: 'PENDING' });
    expect(open?.docSendUrl).toBeTruthy();
    expect(draft?.docSendUrl).toBeNull();
    expect(pending?.docSendUrl).toBeNull();
  });

  it('knows one slug', async () => {
    await expect(getMockSpvSpotlight('another-spv', false)).resolves.toBeNull();
  });

  it('blocks the test emails for signed-out requesters', async () => {
    const error = await mockRequestSpvAccess(
      MOCK_SPV_SLUG,
      { ...payload, email: ' Rejected@Example.com ' },
      false,
    ).catch((e) => e);
    expect(error).toBeInstanceOf(SpvAccessRequestBlockedError);
    expect(error.reason).toBe('REJECTED');
  });

  it('makes a signed-in requester pending', async () => {
    await mockRequestSpvAccess(MOCK_SPV_SLUG, payload, true);
    const after = await getMockSpvSpotlight(MOCK_SPV_SLUG, true);
    expect(after?.viewerAccess).toBe('PENDING');
    // A signed-out read is still anonymous.
    expect((await getMockSpvSpotlight(MOCK_SPV_SLUG, false))?.viewerAccess).toBe('NONE');
  });
});
