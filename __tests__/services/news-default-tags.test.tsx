import type { ReactNode } from 'react';
import { act, renderHook, waitFor } from '@testing-library/react';

// jest.setup.js replaces useQuery and useMutation with stubs; these hooks need the real ones.
jest.mock('@tanstack/react-query', () => jest.requireActual('@tanstack/react-query'));
jest.mock('@/utils/news-categories', () => ({
  ...jest.requireActual('@/utils/news-categories'),
  SHOW_NEWS_PREFERENCES: true,
}));
const mockCustomFetch = jest.fn();
jest.mock('@/utils/fetch-wrapper', () => ({ customFetch: (...a: unknown[]) => mockCustomFetch(...a) }));

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { MembersQueryKeys } from '@/services/members/constants';
import { TeamNewsQueryKeys } from '@/services/team-news/constants';
import { useApproveNewsDefaultTags, useNewsDefaultTags } from '@/services/team-news/hooks/useNewsDefaultTags';
import {
  approveNewsDefaultTags,
  getNewsDefaultTags,
  readNewsDefaultTags,
} from '@/services/team-news/team-news.service';

const aiTags = {
  tags: [
    { slug: 'ai', title: 'AI' },
    { slug: 'desci', title: 'DeSci' },
  ],
  source: 'ai',
  approved: false,
  approvedAt: null,
  generatedAt: '2026-11-10T08:00:00.000Z',
};
const ok = (body: unknown) => ({ ok: true, json: async () => body });

beforeEach(() => {
  mockCustomFetch.mockReset();
});

describe('readNewsDefaultTags', () => {
  it('reads a well-formed response', () => {
    expect(readNewsDefaultTags(aiTags)).toEqual(aiTags);
  });

  it('drops malformed tags and normalizes the optional fields', () => {
    expect(
      readNewsDefaultTags({ tags: [{ slug: 'ai', title: 'AI' }, { slug: 7 }, null], source: 'team', approved: 'yes' }),
    ).toEqual({
      tags: [{ slug: 'ai', title: 'AI' }],
      source: 'team',
      approved: false,
      approvedAt: null,
      generatedAt: null,
    });
  });

  it.each([null, undefined, {}, { tags: 'ai', source: 'ai' }, { tags: [], source: 'popular' }, { memberInfo: {} }])(
    'is null for %p',
    (raw) => {
      expect(readNewsDefaultTags(raw)).toBeNull();
    },
  );
});

describe('default tags service calls', () => {
  it('reads the default tags with the session token', async () => {
    mockCustomFetch.mockResolvedValue(ok(aiTags));

    await expect(getNewsDefaultTags()).resolves.toEqual(aiTags);
    const [url, options, withToken] = mockCustomFetch.mock.calls[0];
    expect(url).toMatch(/\/v1\/team-news\/default-tags$/);
    expect(options.method).toBe('GET');
    expect(withToken).toBe(true);
  });

  it.each([
    ['a failed request', { ok: false }],
    ['no response', undefined],
    ['an unexpected shape', ok({ memberInfo: {} })],
  ])('throws on %s', async (_name, response) => {
    mockCustomFetch.mockResolvedValue(response);
    await expect(getNewsDefaultTags()).rejects.toThrow();
  });

  it('approves as shown with an empty JSON object', async () => {
    mockCustomFetch.mockResolvedValue(ok({ ...aiTags, approved: true }));

    await approveNewsDefaultTags();
    const [url, options] = mockCustomFetch.mock.calls[0];
    expect(url).toMatch(/\/v1\/team-news\/default-tags\/approve$/);
    expect(options).toMatchObject({ method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
  });

  it('sends the chosen tags when the member changed them', async () => {
    mockCustomFetch.mockResolvedValue(ok({ ...aiTags, source: 'member-set', approved: true }));

    await approveNewsDefaultTags(['ai']);
    expect(mockCustomFetch.mock.calls[0][1].body).toBe('{"tags":["ai"]}');
  });

  it('throws when the save fails', async () => {
    mockCustomFetch.mockResolvedValue({ ok: false });
    await expect(approveNewsDefaultTags(['ai'])).rejects.toThrow('Failed to save default news tags');
  });
});

describe('default tags hooks', () => {
  function setup() {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
    return { client, wrapper };
  }

  it('loads the default tags once for a signed-in member', async () => {
    mockCustomFetch.mockResolvedValue(ok(aiTags));
    const { wrapper } = setup();

    const { result, rerender } = renderHook(() => useNewsDefaultTags('user-1'), { wrapper });
    await waitFor(() => expect(result.current.data).toEqual(aiTags));
    rerender();
    expect(mockCustomFetch).toHaveBeenCalledTimes(1);
  });

  it('makes no request for a signed-out visitor', () => {
    const { wrapper } = setup();
    const { result } = renderHook(() => useNewsDefaultTags(undefined), { wrapper });
    expect(result.current.data).toBeUndefined();
    expect(mockCustomFetch).not.toHaveBeenCalled();
  });

  it('has no data after a failed request, and does not retry', async () => {
    mockCustomFetch.mockResolvedValue({ ok: false });
    const { wrapper } = setup();

    const { result } = renderHook(() => useNewsDefaultTags('user-1'), { wrapper });
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.data).toBeUndefined();
    expect(mockCustomFetch).toHaveBeenCalledTimes(1);
  });

  it('writes the answer into the cached default tags, and leaves the preferences alone on approve', async () => {
    const approved = { ...aiTags, approved: true, approvedAt: '2026-11-13T12:00:00.000Z' };
    mockCustomFetch.mockResolvedValue(ok(approved));
    const { client, wrapper } = setup();
    const invalidate = jest.spyOn(client, 'invalidateQueries');

    const { result } = renderHook(() => useApproveNewsDefaultTags('user-1'), { wrapper });
    await act(async () => {
      await result.current.mutateAsync(undefined);
    });

    expect(client.getQueryData([TeamNewsQueryKeys.DEFAULT_TAGS, 'user-1'])).toEqual(approved);
    expect(invalidate).not.toHaveBeenCalled();
  });

  it('refreshes the cached preferences when tags were saved', async () => {
    mockCustomFetch.mockResolvedValue(ok({ ...aiTags, source: 'member-set', approved: true }));
    const { client, wrapper } = setup();
    const invalidate = jest.spyOn(client, 'invalidateQueries');

    const { result } = renderHook(() => useApproveNewsDefaultTags('user-1'), { wrapper });
    await act(async () => {
      await result.current.mutateAsync(['ai']);
    });

    expect(invalidate).toHaveBeenCalledWith({ queryKey: [MembersQueryKeys.GET_MEMBER_PREFERENCES] });
  });
});
