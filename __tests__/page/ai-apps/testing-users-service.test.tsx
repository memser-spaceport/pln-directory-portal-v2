import { act, renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';

import { AiAppsQueryKeys } from '@/services/ai-apps/constants';
import { useCreateAiAppTestingUsers, useRevokeAiAppTestingUser } from '@/services/ai-apps/hooks/useAiAppTestingUsers';
import {
  createAiAppTestingUsers,
  fetchAiAppTestingUsers,
  mintAiAppTestingUserAccess,
  revokeAiAppTestingUser,
} from '@/services/ai-apps/testing-users.service';

jest.mock('@tanstack/react-query', () => jest.requireActual('@tanstack/react-query'));

const mockCustomFetch = jest.fn();
jest.mock('@/utils/fetch-wrapper', () => ({
  customFetch: (...args: unknown[]) => mockCustomFetch(...args),
}));

function jsonResponse(status: number, body: unknown) {
  return { ok: status >= 200 && status < 300, status, json: async () => body } as Response;
}

const USER = { uid: 'tu-1', name: 'Testing user 1', createdAt: '2026-10-03T00:00:00.000Z', revokedAt: null };

describe('testing users service', () => {
  beforeEach(() => mockCustomFetch.mockReset());

  it('lists every page of testing users', async () => {
    const page1 = Array.from({ length: 100 }, (_, i) => ({ ...USER, uid: `tu-${i}` }));
    mockCustomFetch
      .mockResolvedValueOnce(jsonResponse(200, { page: 1, limit: 100, total: 101, items: page1 }))
      .mockResolvedValueOnce(jsonResponse(200, { page: 2, limit: 100, total: 101, items: [USER] }));

    const result = await fetchAiAppTestingUsers('app-1');

    expect(result.error).toBeNull();
    expect(result.data).toHaveLength(101);
    expect(mockCustomFetch.mock.calls[0][0]).toMatch(/\/v1\/ai-apps\/app-1\/testing-users\?page=1&limit=100$/);
    expect(mockCustomFetch.mock.calls[1][0]).toMatch(/page=2&limit=100$/);
  });

  it('creates with the count in the body', async () => {
    mockCustomFetch.mockResolvedValueOnce(jsonResponse(201, { items: [USER] }));

    const result = await createAiAppTestingUsers('app-1', 3);

    expect(result).toEqual({ data: [USER], error: null });
    const [url, init] = mockCustomFetch.mock.calls[0];
    expect(url).toMatch(/\/v1\/ai-apps\/app-1\/testing-users$/);
    expect(init).toMatchObject({ method: 'POST', body: JSON.stringify({ count: 3 }) });
  });

  it('turns the cap refusal into plain words with the remaining capacity', async () => {
    mockCustomFetch.mockResolvedValueOnce(
      jsonResponse(400, {
        message: 'An app can have at most 100 active testing users; you can create 2 more',
      }),
    );
    expect((await createAiAppTestingUsers('app-1', 5)).error).toBe(
      'You can have at most 100 testing users for this app. You can create 2 more.',
    );

    mockCustomFetch.mockResolvedValueOnce(
      jsonResponse(400, {
        message: 'An app can have at most 100 active testing users; revoke one to create another',
      }),
    );
    expect((await createAiAppTestingUsers('app-1', 5)).error).toBe(
      'You can have at most 100 testing users for this app. Revoke one to create another.',
    );
  });

  it('explains a non-owner refusal and falls back to a generic message', async () => {
    mockCustomFetch.mockResolvedValueOnce(jsonResponse(403, { message: 'Forbidden' }));
    expect((await revokeAiAppTestingUser('app-1', 'tu-1')).error).toBe(
      'Only the app owner or a directory admin can manage testing users.',
    );

    mockCustomFetch.mockResolvedValueOnce(jsonResponse(500, {}));
    expect((await revokeAiAppTestingUser('app-1', 'tu-1')).error).toBe('Something went wrong. Try again.');

    mockCustomFetch.mockResolvedValueOnce(undefined);
    expect((await fetchAiAppTestingUsers('app-1')).error).toBe('Something went wrong. Try again.');
  });

  it('mints for all active users or only the given ones', async () => {
    const item = { uid: 'tu-1', name: 'Testing user 1', token: 'tok', expiresAt: '2026-10-05T00:00:00.000Z' };
    mockCustomFetch.mockResolvedValue(jsonResponse(200, { items: [item] }));

    expect(await mintAiAppTestingUserAccess('app-1')).toEqual({ data: [item], error: null });
    expect(mockCustomFetch.mock.calls[0][0]).toMatch(/\/testing-users\/sessions$/);
    expect(mockCustomFetch.mock.calls[0][1].body).toBe('{}');

    await mintAiAppTestingUserAccess('app-1', ['tu-1']);
    expect(mockCustomFetch.mock.calls[1][1].body).toBe(JSON.stringify({ uids: ['tu-1'] }));
  });
});

describe('testing users hooks update the list without a reload', () => {
  function setup() {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    queryClient.setQueryData([AiAppsQueryKeys.AI_APP_TESTING_USERS, 'app-1'], { data: [USER], error: null });
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
    const read = () => queryClient.getQueryData<{ data: unknown[] }>([AiAppsQueryKeys.AI_APP_TESTING_USERS, 'app-1']);
    return { wrapper, read };
  }

  beforeEach(() => mockCustomFetch.mockReset());

  it('appends created users', async () => {
    const { wrapper, read } = setup();
    const created = { ...USER, uid: 'tu-2', name: 'Testing user 2' };
    mockCustomFetch.mockResolvedValueOnce(jsonResponse(201, { items: [created] }));
    const { result } = renderHook(() => useCreateAiAppTestingUsers('app-1'), { wrapper });

    await act(async () => {
      await result.current.mutateAsync(1);
    });

    expect(read()?.data).toEqual([USER, created]);
  });

  it('marks a revoked user in place', async () => {
    const { wrapper, read } = setup();
    mockCustomFetch.mockResolvedValueOnce(
      jsonResponse(200, { uid: 'tu-1', revoked: true, revokedAt: '2026-10-04T00:00:00.000Z' }),
    );
    const { result } = renderHook(() => useRevokeAiAppTestingUser('app-1'), { wrapper });

    await act(async () => {
      await result.current.mutateAsync('tu-1');
    });

    expect(read()?.data).toEqual([{ ...USER, revokedAt: '2026-10-04T00:00:00.000Z' }]);
  });

  it('leaves the list unchanged on a refusal', async () => {
    const { wrapper, read } = setup();
    mockCustomFetch.mockResolvedValueOnce(jsonResponse(400, { message: 'count must be a whole number' }));
    const { result } = renderHook(() => useCreateAiAppTestingUsers('app-1'), { wrapper });

    await act(async () => {
      await result.current.mutateAsync(1);
    });

    expect(read()?.data).toEqual([USER]);
  });
});
