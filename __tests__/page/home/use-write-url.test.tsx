import { act, renderHook } from '@testing-library/react';

import { useWriteUrl } from '@/components/page/home/TeamNews/hooks/useWriteUrl';

const mockPathname = jest.fn(() => '/home');

jest.mock('next/navigation', () => ({
  usePathname: () => mockPathname(),
}));

function setUrl(url: string) {
  window.history.replaceState(null, '', url);
}

const currentUrl = () => `${window.location.pathname}${window.location.search}`;

beforeEach(() => {
  mockPathname.mockReturnValue('/home');
  setUrl('/home');
});

describe('useWriteUrl', () => {
  it('adds a param to a bare URL', () => {
    const { result } = renderHook(() => useWriteUrl());

    act(() => result.current('post', 'fp_a'));

    expect(currentUrl()).toBe('/home?post=fp_a');
  });

  it('replaces the value of a param already there instead of appending a second one', () => {
    setUrl('/home?post=fp_a');
    const { result } = renderHook(() => useWriteUrl());

    act(() => result.current('post', 'fp_b'));

    expect(currentUrl()).toBe('/home?post=fp_b');
  });

  it('keeps the other params untouched', () => {
    setUrl('/home?tab=news&post=fp_a');
    const { result } = renderHook(() => useWriteUrl());

    act(() => result.current('post', 'fp_b'));

    const params = new URLSearchParams(window.location.search);
    expect(params.get('tab')).toBe('news');
    expect(params.get('post')).toBe('fp_b');
  });

  it.each([undefined, null, ''])('deletes the param when the value is %p', (value) => {
    setUrl('/home?tab=news&post=fp_a');
    const { result } = renderHook(() => useWriteUrl());

    act(() => result.current('post', value));

    expect(currentUrl()).toBe('/home?tab=news');
  });

  it('drops the "?" entirely once the last param is deleted', () => {
    setUrl('/home?post=fp_a');
    const { result } = renderHook(() => useWriteUrl());

    act(() => result.current('post', null));

    expect(currentUrl()).toBe('/home');
    expect(window.location.search).toBe('');
  });

  it('deleting a param that was never there is a no-op', () => {
    setUrl('/home?tab=news');
    const { result } = renderHook(() => useWriteUrl());

    act(() => result.current('post', null));

    expect(currentUrl()).toBe('/home?tab=news');
  });

  it('writes onto the current pathname, not a hardcoded /home', () => {
    mockPathname.mockReturnValue('/teams/t1');
    setUrl('/teams/t1');
    const { result } = renderHook(() => useWriteUrl());

    act(() => result.current('news', 'n1'));

    expect(currentUrl()).toBe('/teams/t1?news=n1');
  });

  it('falls back to /home when the pathname is not known yet', () => {
    mockPathname.mockReturnValue('' as unknown as string);
    const { result } = renderHook(() => useWriteUrl());

    act(() => result.current('post', 'fp_a'));

    expect(currentUrl()).toBe('/home?post=fp_a');
  });

  it('replaces rather than pushes — the back button does not walk the deep-link writes', () => {
    const { result } = renderHook(() => useWriteUrl());
    const lengthBefore = window.history.length;

    act(() => result.current('post', 'fp_a'));
    act(() => result.current('post', 'fp_b'));

    expect(window.history.length).toBe(lengthBefore);
  });
});
