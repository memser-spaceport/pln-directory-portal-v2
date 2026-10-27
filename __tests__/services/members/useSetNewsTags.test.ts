import { renderHook } from '@testing-library/react';

import { useSetNewsTags } from '@/services/members/hooks/useSetNewsTags';

const mockMutate = jest.fn();
const mockToastError = jest.fn();
const cache = new Map<string, unknown>();
const keyOf = (key: unknown) => JSON.stringify(key);

jest.mock('@tanstack/react-query', () => ({
  useQueryClient: () => ({
    getQueryData: (key: unknown) => cache.get(keyOf(key)),
    setQueryData: (key: unknown, updater: unknown) => {
      const prev = cache.get(keyOf(key));
      cache.set(keyOf(key), typeof updater === 'function' ? (updater as (p: unknown) => unknown)(prev) : updater);
    },
  }),
}));
jest.mock('@/services/members/hooks/useUpdateMemberPreferences', () => ({
  useUpdateMemberPreferences: () => ({ mutate: mockMutate }),
}));
jest.mock('@/components/core/ToastContainer', () => ({ toast: { error: (...a: unknown[]) => mockToastError(...a) } }));

const KEY = keyOf(['GET_MEMBER_PREFERENCES', 'm1']);

describe('useSetNewsTags (LAB-3000)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    cache.clear();
    cache.set(KEY, { newsTags: ['desci'], newsTagsSeeded: true, memberPreferences: {} });
  });

  it('updates the cache at once, no longer seeded, and PATCHes only newsTags', () => {
    const { result } = renderHook(() => useSetNewsTags('m1'));
    result.current(['desci', 'ai']);

    expect(cache.get(KEY)).toMatchObject({ newsTags: ['desci', 'ai'], newsTagsSeeded: false });
    expect(mockMutate).toHaveBeenCalledWith({ uid: 'm1', payload: { newsTags: ['desci', 'ai'] } }, expect.anything());
  });

  it('restores the previous preferences and says so when the save fails', () => {
    const onError = jest.fn();
    const { result } = renderHook(() => useSetNewsTags('m1'));
    result.current([], { onError });
    mockMutate.mock.calls[0][1].onError();

    expect(cache.get(KEY)).toMatchObject({ newsTags: ['desci'], newsTagsSeeded: true });
    expect(mockToastError).toHaveBeenCalled();
    expect(onError).toHaveBeenCalled();
  });

  it('does nothing without a member', () => {
    const { result } = renderHook(() => useSetNewsTags(undefined));
    result.current(['ai']);
    expect(mockMutate).not.toHaveBeenCalled();
  });
});
