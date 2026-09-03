import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import React from 'react';

/**
 * The interest signal's data layer: the three calls, how a refusal is
 * classified, and — the part actually worth a harness — what the cache does
 * while a toggle is in flight and after one fails.
 *
 * **This file un-mocks React Query on purpose.** `jest.setup.js` replaces
 * `useMutation` with `{ mutate: jest.fn() }` and `useQueryClient` with a bag of
 * spies, which is right for component tests and useless here: every line worth
 * testing in `useToggleJobInterest` is a real cache write. Same escape hatch
 * `job-profile-drawer-footer.test.tsx` takes.
 */
jest.mock('@tanstack/react-query', () => jest.requireActual('@tanstack/react-query'));
jest.mock('@/utils/fetch-wrapper', () => ({ customFetch: jest.fn() }));

import { customFetch } from '@/utils/fetch-wrapper';
import { jobInterestListResponseSchema } from '@/schema/job-interests';
import {
  clearJobInterest,
  fetchJobInterests,
  isAlreadyInterestedError,
  isJobGoneError,
  JobInterestError,
  markJobInterest,
} from '@/services/jobs/job-interests.service';
import { jobInterestsQueryKey, useToggleJobInterest } from '@/services/jobs/hooks/useJobInterests';

const fetchMock = customFetch as jest.Mock;

const ok = (body: unknown) => ({ ok: true, status: 200, json: async () => body });
const fail = (status: number, body: unknown = {}) => ({ ok: false, status, json: async () => body });

const ROW = { uid: 'i1', jobUid: 'r1', createdAt: '2026-09-03T00:00:00.000Z' };

beforeEach(() => jest.clearAllMocks());

describe('the wire shape', () => {
  it('accepts the contract it was written against', () => {
    expect(jobInterestListResponseSchema.parse({ interests: [ROW] }).interests).toHaveLength(1);
  });

  /* Strict on purpose. The endpoint is being written as this ships, so a field
     the server sends and this schema has never heard of should fail loudly on
     dev — behind the flag — rather than arrive as `undefined` three components
     later. If this test is ever "fixed" by loosening the schema, the reason it
     was strict has to be re-argued first. */
  it('refuses a response that has drifted from it', () => {
    expect(() => jobInterestListResponseSchema.parse({ interests: [{ ...ROW, memberUid: 'm1' }] })).toThrow();
    expect(() => jobInterestListResponseSchema.parse({ interests: [{ uid: 'i1' }] })).toThrow();
  });
});

describe('the calls', () => {
  it('reads the whole list, so cache-absence can mean "not interested"', async () => {
    fetchMock.mockResolvedValue(ok({ interests: [ROW] }));

    await expect(fetchJobInterests()).resolves.toEqual([ROW]);
    expect(fetchMock.mock.calls[0][0]).toMatch(/\/v1\/job-openings\/interests$/);
    expect(fetchMock.mock.calls[0][1]).toEqual({ method: 'GET' });
  });

  it('marks and clears the same path with different verbs', async () => {
    fetchMock.mockResolvedValue(ok(ROW));
    await markJobInterest('r1');
    expect(fetchMock.mock.calls[0][0]).toMatch(/\/v1\/job-openings\/r1\/interests$/);
    expect(fetchMock.mock.calls[0][1].method).toBe('POST');

    fetchMock.mockResolvedValue({ ok: true, status: 204, json: async () => undefined });
    await expect(clearJobInterest('r1')).resolves.toBeUndefined();
    expect(fetchMock.mock.calls[1][1].method).toBe('DELETE');
  });

  it('carries the server’s own message when it sent one', async () => {
    fetchMock.mockResolvedValue(fail(400, { message: 'This role is no longer accepting interest' }));

    await expect(markJobInterest('r1')).rejects.toThrow('This role is no longer accepting interest');
  });

  /* `customFetch` resolves to `undefined` when it gives up and logs the session
     out. There is no response to read and a reload is already under way — this
     only has to not throw something unreadable on the way there. */
  it('survives a session that expired mid-press', async () => {
    fetchMock.mockResolvedValue(undefined);

    await expect(markJobInterest('r1')).rejects.toMatchObject({ status: 401 });
  });

  it('separates the refusals that mean different things', () => {
    expect(isAlreadyInterestedError(new JobInterestError(409, 'Already interested'))).toBe(true);
    expect(isJobGoneError(new JobInterestError(404, 'Not found'))).toBe(true);
    expect(isAlreadyInterestedError(new JobInterestError(404, 'Not found'))).toBe(false);
    expect(isAlreadyInterestedError(new Error('not ours'))).toBe(false);
  });
});

describe('the optimistic toggle', () => {
  const KEY = jobInterestsQueryKey('m1');

  const harness = () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
    client.setQueryData(KEY, []);
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
    const { result } = renderHook(() => useToggleJobInterest('m1'), { wrapper });
    return { client, result };
  };

  const rows = (client: QueryClient) => client.getQueryData(KEY) as Array<{ jobUid: string }> | undefined;

  it('shows the signal before the server has agreed to it', async () => {
    /* Held open so the optimistic window is observable. Without the deferral the
       request settles in the same tick and this test would pass on the final
       state while asserting nothing about the optimistic one. */
    let release: (value: unknown) => void = () => {};
    fetchMock.mockReturnValue(new Promise((resolve) => (release = resolve)));

    const { client, result } = harness();
    result.current.mutate({ roleUid: 'r1', nextInterested: true });

    await waitFor(() => expect(rows(client)).toHaveLength(1));
    expect(rows(client)?.[0].jobUid).toBe('r1');

    release(ok(ROW));
  });

  it('puts the screen back when the server refuses', async () => {
    fetchMock.mockResolvedValue(fail(500, { message: 'boom' }));

    const { client, result } = harness();
    result.current.mutate({ roleUid: 'r1', nextInterested: true });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(rows(client)).toHaveLength(0);
  });

  /* A 409 says the server already holds what we just wrote. The state the person
     asked for is the state that exists, so rolling back would undo a correct
     screen to report a problem that isn't one. */
  it('keeps the signal on a 409, because the server agrees with the screen', async () => {
    fetchMock.mockResolvedValue(fail(409, { message: 'Already interested' }));

    const { client, result } = harness();
    result.current.mutate({ roleUid: 'r1', nextInterested: true });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(rows(client)).toHaveLength(1);
  });

  it('removes the row on undo, and restores it if the undo fails', async () => {
    fetchMock.mockResolvedValue(fail(500, { message: 'boom' }));

    const { client, result } = harness();
    client.setQueryData(KEY, [ROW]);

    result.current.mutate({ roleUid: 'r1', nextInterested: false });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(rows(client)).toHaveLength(1);
  });

  it('does not add the same role twice', async () => {
    let release: (value: unknown) => void = () => {};
    fetchMock.mockReturnValue(new Promise((resolve) => (release = resolve)));

    const { client, result } = harness();
    client.setQueryData(KEY, [ROW]);

    result.current.mutate({ roleUid: 'r1', nextInterested: true });

    await waitFor(() => expect(rows(client)).toHaveLength(1));
    release(ok(ROW));
  });
});
