import { renderHook } from '@testing-library/react';

import { useSetNewsCategoryTags } from '@/services/members/hooks/useSetNewsCategoryTags';

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

describe('useSetNewsCategoryTags (LAB-3140)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    cache.clear();
    cache.set(KEY, { newsTags: ['desci'], newsCategoryTags: [], memberPreferences: {} });
  });

  it('updates the cache at once and PATCHes only newsCategoryTags', () => {
    const { result } = renderHook(() => useSetNewsCategoryTags('m1'));
    result.current(['FUNDING']);

    expect(cache.get(KEY)).toMatchObject({ newsTags: ['desci'], newsCategoryTags: ['FUNDING'] });
    expect(mockMutate).toHaveBeenCalledWith(
      { uid: 'm1', payload: { newsCategoryTags: ['FUNDING'] } },
      expect.anything(),
    );
  });

  it('restores the previous preferences when the save fails', () => {
    const { result } = renderHook(() => useSetNewsCategoryTags('m1'));
    result.current(['LAUNCH']);
    mockMutate.mock.calls[0][1].onError();

    expect(cache.get(KEY)).toMatchObject({ newsTags: ['desci'], newsCategoryTags: [] });
    expect(mockToastError).toHaveBeenCalled();
  });
});
