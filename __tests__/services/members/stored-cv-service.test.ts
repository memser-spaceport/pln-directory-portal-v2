/**
 * The at-rest half of the CV wire: what the profile is holding, and letting go
 * of it.
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
  it('maps the file response onto the card shape', async () => {
    mockFetch
      .mockResolvedValueOnce(ok({ uid: 'import-1', status: 'SUCCEEDED', originalFilename: 'ada-lovelace.pdf' }))
      .mockResolvedValueOnce(ok(FILE_BODY));

    await expect(getStoredCv(UID)).resolves.toEqual({
      fileName: 'ada-lovelace.pdf',
      uploadedAt: '2026-08-12T09:30:00.000Z',
      url: 'https://s3.example/signed',
      size: 182_000,
    });
  });

  it('answers null when the member has never uploaded', async () => {
    mockFetch.mockResolvedValueOnce(fail(404));

    await expect(getStoredCv(UID)).resolves.toBeNull();
    // The file route is not worth asking once `latest` has said there is no row.
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('answers null when the row exists but the object does not', async () => {
    mockFetch
      .mockResolvedValueOnce(ok({ uid: 'import-1', status: 'SUCCEEDED', originalFilename: 'cv.pdf' }))
      .mockResolvedValueOnce(fail(404));

    // Not an error: the offer coming back beats a card that cannot paint.
    await expect(getStoredCv(UID)).resolves.toBeNull();
  });

  /*
   * The reason this is not gated on the parse. The document reaches storage
   * before any status is decided, so these three are files someone uploaded and
   * must still be able to see, replace and remove.
   */
  it.each(['PROCESSING', 'NOTHING_FOUND', 'FAILED'])('returns the CV for a %s import', async (status) => {
    mockFetch
      .mockResolvedValueOnce(ok({ uid: 'import-1', status, originalFilename: 'cv.pdf' }))
      .mockResolvedValueOnce(ok(FILE_BODY));

    await expect(getStoredCv(UID)).resolves.toEqual(expect.objectContaining({ url: 'https://s3.example/signed' }));
  });

  it('carries an absent size through rather than failing on it', async () => {
    const { size, ...noSize } = FILE_BODY;
    mockFetch
      .mockResolvedValueOnce(ok({ uid: 'import-1', status: 'SUCCEEDED', originalFilename: 'cv.pdf' }))
      .mockResolvedValueOnce(ok(noSize));

    await expect(getStoredCv(UID)).resolves.toEqual(expect.objectContaining({ size: undefined }));
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
