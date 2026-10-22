import { renderHook } from '@testing-library/react';

import { useSetNewsCategories } from '@/services/members/hooks/useSetNewsCategories';

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

describe('useSetNewsCategories (LAB-2941)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    cache.clear();
    cache.set(KEY, { newsCategories: ['FUNDING', 'LAUNCH'], memberPreferences: {} });
  });

  it('updates the cache at once and PATCHes only newsCategories', () => {
    const { result } = renderHook(() => useSetNewsCategories('m1'));
    result.current(['LAUNCH']);

    expect((cache.get(KEY) as any).newsCategories).toEqual(['LAUNCH']);
    expect(mockMutate).toHaveBeenCalledWith({ uid: 'm1', payload: { newsCategories: ['LAUNCH'] } }, expect.anything());
  });

  it('restores the previous list and says so when the save fails', () => {
    const onError = jest.fn();
    const { result } = renderHook(() => useSetNewsCategories('m1'));
    result.current(['LAUNCH'], { onError });
    mockMutate.mock.calls[0][1].onError();

    expect((cache.get(KEY) as any).newsCategories).toEqual(['FUNDING', 'LAUNCH']);
    expect(mockToastError).toHaveBeenCalled();
    expect(onError).toHaveBeenCalled();
  });
});
