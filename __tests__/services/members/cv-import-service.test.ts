/**
 * The wire, against the contract the backend actually shipped.
 *
 * The parse is **asynchronous** — the upload is accepted with a 202 and the
 * extraction happens in the background — and this file is where that is hidden.
 * Everything upstream still sees one promise, so if the poll loop is wrong it
 * fails as a spinner that never stops rather than as anything a component test
 * would notice. Hence these.
 *
 * Contract: `apps/web-api/src/member-cv-imports/` and
 * `libs/contracts/src/schema/member-cv-import.ts`.
 */

const mockFetch = jest.fn();
jest.mock('@/utils/fetch-wrapper', () => ({
  customFetch: (...args: unknown[]) => mockFetch(...args),
}));

import { parseCv, applyCvImport, CvParseError } from '@/services/members/cv-import.service';

const UID = 'member-1';
const IMPORT_UID = 'import-1';
const file = () => new File(['%PDF-1.7'], 'cv.pdf', { type: 'application/pdf' });

const ok = (body: unknown, status = 200) => ({
  ok: true,
  status,
  json: async () => body,
});
const fail = (status: number, body: unknown = {}) => ({
  ok: false,
  status,
  json: async () => body,
});

const accepted = () => ok({ uid: IMPORT_UID, status: 'PROCESSING' }, 202);
const latest = (over: Record<string, unknown>) => ok({ uid: IMPORT_UID, originalFilename: 'cv.pdf', ...over });

const PAYLOAD = {
  role: 'Protocol Engineer',
  location: 'Berlin, Germany',
  skills: ['Rust'],
  experiences: [
    {
      key: 'k1',
      title: 'Protocol Engineer',
      company: 'Lattice',
      description: '',
      startDate: '2021-03',
      endDate: null,
      isCurrent: true,
      location: 'Remote',
    },
  ],
};

beforeEach(() => {
  jest.clearAllMocks();
  jest.useFakeTimers({ doNotFake: ['nextTick'] });
});
afterEach(() => jest.useRealTimers());

/** Drains the poll loop's `setTimeout` waits without spending real seconds. */
const settle = async (promise: Promise<unknown>) => {
  const result = promise.then(
    (value) => ({ ok: true as const, value }),
    (error) => ({ ok: false as const, error }),
  );
  for (let i = 0; i < 60; i += 1) {
    await Promise.resolve();
    jest.advanceTimersByTime(1_500);
  }
  return result;
};

describe('parseCv', () => {
  it('uploads, polls, and resolves with the payload plus the import it came from', async () => {
    mockFetch
      .mockResolvedValueOnce(accepted())
      .mockResolvedValueOnce(latest({ status: 'PROCESSING' }))
      .mockResolvedValueOnce(latest({ status: 'SUCCEEDED', payload: PAYLOAD }));

    const outcome = await settle(parseCv(UID, file()));

    expect(outcome).toEqual({ ok: true, value: { ...PAYLOAD, importUid: IMPORT_UID } });

    const [uploadUrl, uploadInit] = mockFetch.mock.calls[0];
    expect(uploadUrl).toContain(`/v1/members/${UID}/cv-imports`);
    expect(uploadInit.method).toBe('POST');
    /* No Content-Type: the browser has to set the multipart boundary itself, and
       naming the type by hand omits it. */
    expect(uploadInit.headers).toBeUndefined();
    expect(mockFetch.mock.calls[1][0]).toContain(`/v1/members/${UID}/cv-imports/latest`);
  });

  /**
   * A document that carried no positions. Read successfully, so not an error —
   * the panel has a dead end for it that says something true about the file
   * rather than about us.
   */
  it('resolves NOTHING_FOUND as an empty profile, not a failure', async () => {
    mockFetch.mockResolvedValueOnce(accepted()).mockResolvedValueOnce(latest({ status: 'NOTHING_FOUND' }));

    const outcome = await settle(parseCv(UID, file()));

    expect(outcome).toEqual({
      ok: true,
      value: { role: '', location: '', skills: [], experiences: [], importUid: IMPORT_UID },
    });
  });

  /**
   * The server emits exactly two codes. Only `UNREADABLE_PDF` is a statement
   * about the document; anything else is ours, and blaming a file that is fine
   * sends someone off to fix nothing.
   */
  it.each([
    ['UNREADABLE_PDF', 'rejected'],
    ['PARSE_FAILED', 'server'],
    ['SOMETHING_NEW', 'server'],
  ])('maps a FAILED %s to %s', async (code, category) => {
    mockFetch
      .mockResolvedValueOnce(accepted())
      .mockResolvedValueOnce(latest({ status: 'FAILED', error: { code, message: 'nope' } }));

    const outcome = (await settle(parseCv(UID, file()))) as { ok: false; error: CvParseError };

    expect(outcome.ok).toBe(false);
    expect(outcome.error).toBeInstanceOf(CvParseError);
    expect(outcome.error.category).toBe(category);
  });

  /** The upload validates synchronously — wrong type, over 5MB, empty — and all
   *  of it is the person's to fix by bringing a different file. */
  it.each([[400], [413], [415], [422]])('treats a %s on upload as the file being rejected', async (status) => {
    mockFetch.mockResolvedValueOnce(fail(status, { message: 'Only PDF files are accepted' }));

    const outcome = (await settle(parseCv(UID, file()))) as { ok: false; error: CvParseError };

    expect(outcome.error.category).toBe('rejected');
    expect(outcome.error.message).toBe('Only PDF files are accepted');
    // Nothing to poll for.
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('treats a 500 on upload as ours, not the file’s', async () => {
    mockFetch.mockResolvedValueOnce(fail(500));

    const outcome = (await settle(parseCv(UID, file()))) as { ok: false; error: CvParseError };

    expect(outcome.error.category).toBe('server');
  });

  /**
   * A newer upload — a second tab, or a second file here — replaces the row.
   * Ours is no longer what `latest` reports on, so there is nothing to resolve
   * and nothing to complain about.
   */
  it('gives up quietly when a newer import replaces the one being polled', async () => {
    mockFetch
      .mockResolvedValueOnce(accepted())
      .mockResolvedValueOnce(
        ok({ uid: 'import-2', status: 'SUCCEEDED', originalFilename: 'other.pdf', payload: PAYLOAD }),
      );

    const outcome = (await settle(parseCv(UID, file()))) as { ok: false; error: CvParseError };

    expect(outcome.error.category).toBe('aborted');
  });

  it('stops polling when the caller aborts', async () => {
    const controller = new AbortController();
    mockFetch.mockResolvedValueOnce(accepted()).mockResolvedValue(latest({ status: 'PROCESSING' }));

    const promise = parseCv(UID, file(), controller.signal);
    const settled = promise.then(
      () => ({ ok: true }),
      (error) => ({ ok: false, error }),
    );

    await Promise.resolve();
    await Promise.resolve();
    controller.abort();
    jest.advanceTimersByTime(1_500);

    const outcome = (await settled) as { ok: false; error: CvParseError };
    expect(outcome.error.category).toBe('aborted');
  });

  /** A 202 with no uid leaves nothing to poll for, and guessing would mean
   *  polling somebody else's row. */
  it('refuses an acceptance with no import uid', async () => {
    mockFetch.mockResolvedValueOnce(ok({ status: 'PROCESSING' }, 202));

    const outcome = (await settle(parseCv(UID, file()))) as { ok: false; error: CvParseError };

    expect(outcome.error.category).toBe('server');
  });

  /** `customFetch` returns undefined when it decides the session is over. */
  it('treats a missing response as network rather than the file’s fault', async () => {
    mockFetch.mockResolvedValueOnce(undefined);

    const outcome = (await settle(parseCv(UID, file()))) as { ok: false; error: CvParseError };

    expect(outcome.error.category).toBe('network');
  });
});

describe('applyCvImport', () => {
  const payload = {
    importUid: IMPORT_UID,
    role: 'Protocol Engineer',
    location: 'Berlin, Germany',
    skills: ['Rust'],
    experiences: [],
  };

  it('posts the selection and returns what the server actually did', async () => {
    const result = {
      uid: UID,
      role: 'Protocol Engineer',
      locationApplied: true,
      skillsAdded: ['Rust'],
      experiencesAdded: 1,
    };
    mockFetch.mockResolvedValueOnce(ok(result));

    await expect(applyCvImport(UID, payload)).resolves.toEqual(result);

    const [url, init] = mockFetch.mock.calls[0];
    expect(url).toContain(`/v1/members/${UID}/cv-imports/apply`);
    expect(JSON.parse(init.body)).toEqual(payload);
  });

  /**
   * The review sat open while a newer CV was uploaded. The server refuses rather
   * than writing rows from a parse nobody looked at, and the only honest
   * recovery is to read again — so this is worth telling apart.
   */
  it('flags a stale import so the caller can say re-read rather than retry', async () => {
    mockFetch.mockResolvedValueOnce(fail(409, { message: 'Import is stale' }));

    await expect(applyCvImport(UID, payload)).rejects.toMatchObject({
      name: 'CvImportApplyError',
      status: 409,
      stale: true,
      message: 'Import is stale',
    });
  });

  it('does not flag anything else as stale', async () => {
    mockFetch.mockResolvedValueOnce(fail(500));

    await expect(applyCvImport(UID, payload)).rejects.toMatchObject({ status: 500, stale: false });
  });
});
