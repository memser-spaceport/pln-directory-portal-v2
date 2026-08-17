import { act, renderHook } from '@testing-library/react';

import { useNewsDeepLink } from '@/components/page/home/TeamNews/hooks/useNewsDeepLink';

jest.mock('next/navigation', () => ({
  usePathname: () => '/home',
  useSearchParams: () => new URLSearchParams(window.location.search),
}));

function setUrl(search: string) {
  window.history.replaceState(null, '', `/home${search}`);
}

afterEach(() => {
  setUrl('');
});

describe('useNewsDeepLink — comment URL hygiene', () => {
  it('closing the modal clears both news and comment', () => {
    setUrl('?news=n1&comment=c1&utm_source=li');
    const { result } = renderHook(() => useNewsDeepLink({ isValidUid: (uid) => uid === 'n1' }));

    expect(result.current.activeNewsUid).toBe('n1');

    act(() => result.current.closeNews());

    expect(result.current.activeNewsUid).toBeNull();
    const params = new URLSearchParams(window.location.search);
    expect(params.get('news')).toBeNull();
    expect(params.get('comment')).toBeNull();
    expect(params.get('utm_source')).toBe('li');
  });

  it('opening from a card clears a leftover comment param', () => {
    setUrl('?comment=stale');
    const { result } = renderHook(() => useNewsDeepLink({ isValidUid: () => true }));

    act(() => result.current.openNews('n2'));

    const params = new URLSearchParams(window.location.search);
    expect(params.get('news')).toBe('n2');
    expect(params.get('comment')).toBeNull();
  });

  it('stripping an invalid news uid also clears comment', () => {
    setUrl('?news=expired&comment=c1&utm_source=li');
    renderHook(() => useNewsDeepLink({ isValidUid: () => false }));

    const params = new URLSearchParams(window.location.search);
    expect(params.get('news')).toBeNull();
    expect(params.get('comment')).toBeNull();
    expect(params.get('utm_source')).toBe('li');
  });

  it('a valid deep link with comment keeps the comment param until close', () => {
    setUrl('?news=n1&comment=c1');
    const { result } = renderHook(() => useNewsDeepLink({ isValidUid: (uid) => uid === 'n1' }));

    expect(result.current.activeNewsUid).toBe('n1');
    expect(new URLSearchParams(window.location.search).get('comment')).toBe('c1');
  });
});

describe('useNewsDeepLink — soft-nav while already on /home (LAB-2281)', () => {
  it('adopts a mid-session ?news= without remounting and keeps ?comment=', () => {
    setUrl('');
    const isValidUid = (uid: string) => uid === 'n1';
    const { result, rerender } = renderHook(() => useNewsDeepLink({ isValidUid }));

    expect(result.current.activeNewsUid).toBeNull();
    expect(result.current.openedViaDeepLink).toBe(false);

    setUrl('?news=n1&comment=c1');
    rerender();

    expect(result.current.activeNewsUid).toBe('n1');
    expect(result.current.openedViaDeepLink).toBe(true);
    expect(new URLSearchParams(window.location.search).get('comment')).toBe('c1');
  });

  it('does not mark a card openNews as a deep-link open', () => {
    setUrl('');
    const { result } = renderHook(() => useNewsDeepLink({ isValidUid: () => true }));

    act(() => result.current.openNews('n2'));

    expect(result.current.activeNewsUid).toBe('n2');
    expect(result.current.openedViaDeepLink).toBe(false);
  });
});
