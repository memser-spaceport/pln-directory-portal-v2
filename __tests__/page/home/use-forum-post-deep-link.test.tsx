import { act, renderHook } from '@testing-library/react';

import { useForumPostDeepLink } from '@/components/page/home/TeamNews/hooks/useForumPostDeepLink';
import type { ForumPostUid, IFeedForumPost } from '@/types/feed.types';

// Override the global next/navigation mock with a URL-backed one so the hook
// reads the same location the test controls via history.replaceState.
jest.mock('next/navigation', () => ({
  usePathname: () => '/home',
  useSearchParams: () => new URLSearchParams(window.location.search),
}));

function post(uid: string): IFeedForumPost {
  return {
    uid: uid as ForumPostUid,
    tid: 1,
    mainPid: 10,
    title: `Post ${uid}`,
    body: 'Body',
    author: { memberUid: 'm1', name: 'Mira Chen', avatarUrl: null, role: null },
    focusAreas: [],
    category: 'Compute',
    createdAt: '2026-07-01T00:00:00.000Z',
    forumTopicUrl: null,
    commentCount: 0,
    likeCount: 0,
    viewerHasLiked: false,
  };
}

function setUrl(search: string) {
  window.history.replaceState(null, '', `/home${search}`);
}

function currentPostParam(): string | null {
  return new URLSearchParams(window.location.search).get('post');
}

afterEach(() => {
  setUrl('');
});

describe('useForumPostDeepLink — five-state resolution matrix', () => {
  it('pending: holds the param while gates are unsettled (posts undefined, not settled)', () => {
    setUrl('?post=fp_a');
    const { result } = renderHook(() => useForumPostDeepLink({ posts: undefined, isSettled: false }));
    expect(result.current.activePostUid).toBeNull();
    expect(currentPostParam()).toBe('fp_a'); // NOT stripped — identity may still be loading
  });

  it('valid: opens the modal and reports the deep link once when the post arrives', () => {
    setUrl('?post=fp_a');
    const onDeepLinkOpen = jest.fn();
    const { result, rerender } = renderHook(
      ({ posts, isSettled }: { posts: IFeedForumPost[] | undefined; isSettled: boolean }) =>
        useForumPostDeepLink({ posts, isSettled, onDeepLinkOpen }),
      { initialProps: { posts: undefined as IFeedForumPost[] | undefined, isSettled: false } },
    );
    expect(result.current.activePostUid).toBeNull();

    rerender({ posts: [post('fp_a')], isSettled: true });
    expect(result.current.activePostUid).toBe('fp_a');
    expect(onDeepLinkOpen).toHaveBeenCalledTimes(1);
    expect(currentPostParam()).toBe('fp_a');

    rerender({ posts: [post('fp_a')], isSettled: true });
    expect(onDeepLinkOpen).toHaveBeenCalledTimes(1); // once, ever
  });

  it('settled-hidden: strips silently once settled without the post (signed-out / no access / error)', () => {
    setUrl('?post=fp_a');
    const { result } = renderHook(() => useForumPostDeepLink({ posts: undefined, isSettled: true }));
    expect(result.current.activePostUid).toBeNull();
    expect(currentPostParam()).toBeNull();
  });

  it('settled-invalid: strips an unknown uid once posts have loaded', () => {
    setUrl('?post=fp_unknown');
    const { result } = renderHook(() => useForumPostDeepLink({ posts: [post('fp_a')], isSettled: true }));
    expect(result.current.activePostUid).toBeNull();
    expect(currentPostParam()).toBeNull();
  });

  it('malformed uid: strips immediately, without waiting for any gate', () => {
    setUrl('?post=not-a-post-uid');
    renderHook(() => useForumPostDeepLink({ posts: undefined, isSettled: false }));
    expect(currentPostParam()).toBeNull();
  });

  it('both params at mount: news wins, post strips, news param untouched', () => {
    setUrl('?news=n1&post=fp_a');
    const { result } = renderHook(() => useForumPostDeepLink({ posts: [post('fp_a')], isSettled: true }));
    expect(result.current.activePostUid).toBeNull();
    expect(currentPostParam()).toBeNull();
    expect(new URLSearchParams(window.location.search).get('news')).toBe('n1');
  });
});

describe('useForumPostDeepLink — user interaction latch', () => {
  it('openPost/closePost write the param and override any deep-link resolution', () => {
    setUrl('');
    const { result } = renderHook(() => useForumPostDeepLink({ posts: [post('fp_a')], isSettled: true }));

    act(() => result.current.openPost('fp_a'));
    expect(result.current.activePostUid).toBe('fp_a');
    expect(currentPostParam()).toBe('fp_a');

    act(() => result.current.closePost());
    expect(result.current.activePostUid).toBeNull();
    expect(currentPostParam()).toBeNull();
  });

  it('closing a deep-linked modal wins over the derived open (manual latch)', () => {
    setUrl('?post=fp_a');
    const { result } = renderHook(() => useForumPostDeepLink({ posts: [post('fp_a')], isSettled: true }));
    expect(result.current.activePostUid).toBe('fp_a');

    act(() => result.current.closePost());
    expect(result.current.activePostUid).toBeNull();
    expect(currentPostParam()).toBeNull();
  });

  it('async-strip race: a late invalid verdict never strips a param the user just wrote', () => {
    setUrl('?post=fp_dead');
    const { result, rerender } = renderHook(
      ({ posts, isSettled }: { posts: IFeedForumPost[] | undefined; isSettled: boolean }) =>
        useForumPostDeepLink({ posts, isSettled }),
      { initialProps: { posts: undefined as IFeedForumPost[] | undefined, isSettled: false } },
    );

    // While fp_dead is still pending, the user opens a live post themselves.
    act(() => result.current.openPost('fp_live'));
    expect(currentPostParam()).toBe('fp_live');

    // The stale verdict settles: fp_dead is invalid — but the user owns the URL now.
    rerender({ posts: [post('fp_live')], isSettled: true });
    expect(currentPostParam()).toBe('fp_live');
    expect(result.current.activePostUid).toBe('fp_live');
  });
});
