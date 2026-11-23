import { feedbackApi } from '@/services/plaa/feedback/feedback.api';
import { FeedbackApiError } from '@/services/plaa/feedback/feedback.types';

const mockCookies = jest.fn();
jest.mock('@/utils/third-party.helper', () => ({ getCookiesFromClient: () => mockCookies() }));

const fetchMock = jest.fn();
const answer = (status: number, body?: unknown) =>
  fetchMock.mockResolvedValue({
    ok: status < 400,
    status,
    json: () => (body === undefined ? Promise.reject(new Error('no body')) : Promise.resolve(body)),
  });
const refusal = (call: Promise<unknown>) =>
  call.then(
    () => undefined,
    (error: unknown) => error as FeedbackApiError,
  );

beforeEach(() => {
  fetchMock.mockReset();
  global.fetch = fetchMock;
  mockCookies.mockReturnValue({ authToken: 'tok-1' });
});

describe('the feedback API client', () => {
  it("sends the member's own token with every call", async () => {
    answer(200, { is_admin: false });
    await feedbackApi.me();
    expect(fetchMock.mock.calls[0][1].headers.Authorization).toBe('Bearer tok-1');
  });

  it('refuses to call at all for a visitor who is not signed in', async () => {
    mockCookies.mockReturnValue({});
    const error = await refusal(feedbackApi.me());
    expect(error).toBeInstanceOf(FeedbackApiError);
    expect(error?.status).toBe(401);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("carries the API's status and reason to the caller, so the page can say why", async () => {
    answer(429, { message: 'Try again tomorrow.' });
    const error = await refusal(feedbackApi.addComment('item-1', 'A comment.'));
    expect(error).toBeInstanceOf(FeedbackApiError);
    expect(error?.status).toBe(429);
    expect(error?.message).toBe('Try again tomorrow.');
  });

  it('still reports the status when the refusal has no readable body', async () => {
    answer(502);
    const error = await refusal(feedbackApi.me());
    expect(error?.status).toBe(502);
  });

  it('treats an empty success as success', async () => {
    answer(204);
    await expect(feedbackApi.deleteComment('comment-1')).resolves.toBeUndefined();
  });

  it('asks for the page after the cursor it is given, and only for mine when asked', async () => {
    answer(200, { items: [], next_cursor: null });
    await feedbackApi.list({ sort: 'top', mine: true, cursor: 'abc' });
    const asked = new URL(fetchMock.mock.calls[0][0], 'http://portal');
    expect(asked.searchParams.get('cursor')).toBe('abc');
    expect(asked.searchParams.get('mine')).toBe('true');

    fetchMock.mockClear();
    await feedbackApi.list({ sort: 'top' });
    const plain = new URL(fetchMock.mock.calls[0][0], 'http://portal');
    expect(plain.searchParams.has('cursor')).toBe(false);
    expect(plain.searchParams.has('mine')).toBe(false);
  });
});
