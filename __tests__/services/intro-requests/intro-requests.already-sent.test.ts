/**
 * LAB-3457: the C3 guard. `POST /v1/intro-requests` answers 409 DRAFT_CLOSED `{ status: 'sent' }` when this text went
 * to this target from a saved agent card already; the error carries the code and the status.
 */
import {
  createIntroRequest,
  IntroRequestError,
  isIntroAlreadySent,
} from '@/services/intro-requests/intro-requests.service';

const customFetch = jest.fn();
jest.mock('@/utils/fetch-wrapper', () => ({ customFetch: (...args: unknown[]) => customFetch(...args) }));

const reply = (status: number, body: unknown) => ({ ok: false, status, json: async () => body });
const send = () => createIntroRequest({ type: 'MEMBER', targetId: 'm-2', text: 'Some words for the intro.' });

describe('createIntroRequest: the already-sent 409', () => {
  it('carries code and status, and reads as already sent', async () => {
    customFetch.mockResolvedValue(
      reply(409, { statusCode: 409, code: 'DRAFT_CLOSED', message: 'This draft is closed.', status: 'sent' }),
    );
    const error = await send().catch((e: unknown) => e);
    expect(error).toBeInstanceOf(IntroRequestError);
    expect(error).toMatchObject({ status: 409, code: 'DRAFT_CLOSED', draftStatus: 'sent' });
    expect(isIntroAlreadySent(error)).toBe(true);
  });

  it('anything else is not already sent', async () => {
    customFetch.mockResolvedValueOnce(reply(409, { code: 'DRAFT_CLOSED', status: 'cancelled' }));
    expect(isIntroAlreadySent(await send().catch((e: unknown) => e))).toBe(false);
    customFetch.mockResolvedValueOnce(reply(403, { message: 'No' }));
    const forbidden = await send().catch((e: unknown) => e);
    expect(forbidden).toMatchObject({ status: 403, code: undefined, draftStatus: undefined });
    expect(isIntroAlreadySent(forbidden)).toBe(false);
    expect(isIntroAlreadySent(new Error('x'))).toBe(false);
  });
});
