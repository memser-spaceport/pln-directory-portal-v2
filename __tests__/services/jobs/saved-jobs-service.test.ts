jest.mock('@/utils/fetch-wrapper', () => ({ customFetch: jest.fn() }));

import { fetchSavedJobs, saveJob, unsaveJob } from '@/services/jobs/saved-jobs.service';
import { customFetch } from '@/utils/fetch-wrapper';

const mockCustomFetch = customFetch as jest.MockedFunction<typeof customFetch>;

const ok = (body: unknown) => ({ ok: true, json: async () => body }) as unknown as Response;
const refused = (status: number) => ({ ok: false, status }) as unknown as Response;

const lastCall = () => mockCustomFetch.mock.calls[mockCustomFetch.mock.calls.length - 1];

beforeEach(() => {
  mockCustomFetch.mockReset();
});

describe('fetchSavedJobs', () => {
  it('reads the whole list, unpaged', async () => {
    const savedJobs = [{ uid: 'save-1', jobUid: 'job-1', savedAt: '2026-09-01T00:00:00.000Z' }];
    mockCustomFetch.mockResolvedValue(ok({ savedJobs }));

    await expect(fetchSavedJobs()).resolves.toEqual(savedJobs);

    const [url, options, withAuth] = lastCall();
    expect(url).toEqual(expect.stringContaining('/v1/job-openings/saved'));
    expect(options).toMatchObject({ method: 'GET' });
    expect(withAuth).toBe(true);
  });

  it('throws on a refusal rather than reporting an empty list', async () => {
    mockCustomFetch.mockResolvedValue(refused(401));

    await expect(fetchSavedJobs()).rejects.toThrow('Could not load your saved jobs');
  });

  /* `customFetch` resolves to undefined when it gives up and logs the session
     out — there is no response to read. */
  it('throws when the session went away mid-request', async () => {
    mockCustomFetch.mockResolvedValue(undefined as unknown as Response);

    await expect(fetchSavedJobs()).rejects.toThrow('Could not load your saved jobs');
  });
});

describe('saveJob', () => {
  /* The API answers a bodiless POST with a 415 — its contract declares an
     optional object body. This pins the fix. */
  it('sends an empty JSON body, which is what keeps the API from answering 415', async () => {
    mockCustomFetch.mockResolvedValue(ok({ jobUid: 'job-1', viewerHasSaved: true }));

    await saveJob('job-1');

    const [url, options] = lastCall();
    expect(url).toEqual(expect.stringContaining('/v1/job-openings/job-1/save'));
    expect(options).toMatchObject({
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{}',
    });
  });

  it('throws on a refusal, so the press can roll back', async () => {
    mockCustomFetch.mockResolvedValue(refused(404));

    await expect(saveJob('job-1')).rejects.toThrow('Could not save this role');
  });
});

describe('unsaveJob', () => {
  it('deletes the same path, with the same body', async () => {
    mockCustomFetch.mockResolvedValue(ok({ jobUid: 'job-1', viewerHasSaved: false }));

    await unsaveJob('job-1');

    const [url, options] = lastCall();
    expect(url).toEqual(expect.stringContaining('/v1/job-openings/job-1/save'));
    expect(options).toMatchObject({
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: '{}',
    });
  });

  it('throws on a refusal', async () => {
    mockCustomFetch.mockResolvedValue(refused(500));

    await expect(unsaveJob('job-1')).rejects.toThrow('Could not remove this role from your saved list');
  });
});
