/**
 * The at-rest half of the CV wire: what the profile is holding, and letting go
 * of it.
 *
 * Contract: `GET /cv-imports/latest` carries a `file` object whenever the row
 * has an upload behind it, so "is there a CV" is one call and `file` is already
 * the shape the card renders. An earlier draft of this client invented a second
 * `/cv-imports/file` route and mapped its response — these tests passed against
 * that invention, because they mocked it. Assert against the wire, not the
 * client's idea of it.
 *
 * Worth its own file because `request()` in this service **resolves for any
 * status** — it rejects only when no response arrives at all. So every "no CV"
 * and every failure here is read off the response, and a `.catch()` written by
 * habit would silently never fire. That mistake was made and fixed while writing
 * this; these are the tests that would have caught it.
 *
 * Contract: `apps/web-api/src/member-cv-imports/` (pln-directory-portal#3420).
 */

const mockFetch = jest.fn();
jest.mock('@/utils/fetch-wrapper', () => ({
  customFetch: (...args: unknown[]) => mockFetch(...args),
}));

import { getStoredCv, removeStoredCv, CvParseError } from '@/services/members/cv-import.service';

const UID = 'member-1';

const ok = (body: unknown, status = 200) => ({ ok: true, status, json: async () => body });
const fail = (status: number) => ({ ok: false, status, json: async () => ({}) });

const FILE_BODY = {
  url: 'https://s3.example/signed',
  expiresAt: '2026-09-14T12:10:00.000Z',
  originalFilename: 'ada-lovelace.pdf',
  uploadedAt: '2026-08-12T09:30:00.000Z',
  size: 182_000,
};

beforeEach(() => jest.clearAllMocks());

describe('getStoredCv', () => {
  const FILE = {
    fileName: 'ada-lovelace.pdf',
    uploadedAt: '2026-08-12T09:30:00.000Z',
    size: 182_000,
    url: 'https://s3.example/signed',
  };
  const latest = (over: Record<string, unknown> = {}) =>
    ok({ uid: 'import-1', status: 'SUCCEEDED', originalFilename: 'ada-lovelace.pdf', ...over });

  it('hands back the file object `latest` already carries', async () => {
    mockFetch.mockResolvedValueOnce(latest({ file: FILE }));

    await expect(getStoredCv(UID)).resolves.toEqual(FILE);
    // One call. The API folds the signed link into `latest`.
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('answers null when the member has never uploaded', async () => {
    mockFetch.mockResolvedValueOnce(fail(404));

    await expect(getStoredCv(UID)).resolves.toBeNull();
  });

  /*
   * A row can exist with no stored file — the import predates the file columns,
   * or the upload never completed. `file` absent is "no CV", not an error.
   */
  it('answers null when the row carries no file', async () => {
    mockFetch.mockResolvedValueOnce(latest());

    await expect(getStoredCv(UID)).resolves.toBeNull();
  });

  /*
   * The API sets `file` from the upload timestamp, not the parse outcome, so a
   * document the model gave up on is still one the owner can see, replace and
   * remove. This asserts the client does not re-impose a gate the API declined.
   */
  it.each(['PROCESSING', 'NOTHING_FOUND', 'FAILED'])('returns the CV for a %s import', async (status) => {
    mockFetch.mockResolvedValueOnce(latest({ status, file: FILE }));

    await expect(getStoredCv(UID)).resolves.toEqual(FILE);
  });

  /* The API signs the URL at read time and swallows a signing failure rather
     than lose the response; the card falls back to a glyph. */
  it('keeps the file when the signed url could not be minted', async () => {
    const { url, ...noUrl } = FILE;
    mockFetch.mockResolvedValueOnce(latest({ file: noUrl }));

    await expect(getStoredCv(UID)).resolves.toEqual(noUrl);
  });

  it('throws on a server failure rather than reporting no CV', async () => {
    mockFetch.mockResolvedValueOnce(fail(500));

    await expect(getStoredCv(UID)).rejects.toBeInstanceOf(CvParseError);
  });
});

describe('removeStoredCv', () => {
  it('DELETEs the collection', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, status: 204, json: async () => ({}) });

    await expect(removeStoredCv(UID)).resolves.toBeUndefined();
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining(`/v1/members/${UID}/cv-imports`),
      expect.objectContaining({ method: 'DELETE' }),
      true,
    );
  });

  // Gone is gone. Asking twice — two tabs, a double press — is not a failure.
  it('treats a 404 as success', async () => {
    mockFetch.mockResolvedValueOnce(fail(404));

    await expect(removeStoredCv(UID)).resolves.toBeUndefined();
  });

  it('throws when the server refuses', async () => {
    mockFetch.mockResolvedValueOnce(fail(500));

    await expect(removeStoredCv(UID)).rejects.toBeInstanceOf(CvParseError);
  });
});
