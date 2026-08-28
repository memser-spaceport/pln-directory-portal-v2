import { renderHook, act } from '@testing-library/react';

import { buildLoginTarget, useLoginRedirect } from '@/components/core/login/utils/loginRedirect';

const mockRouter = {
  push: jest.fn(),
  replace: jest.fn(),
  refresh: jest.fn(),
  prefetch: jest.fn(),
};

jest.mock('next/navigation', () => ({
  useRouter: () => mockRouter,
}));

const setUrl = (url: string) => window.history.replaceState({}, '', url);

/**
 * The scroll rule is the whole point of this helper, so it gets asserted directly
 * rather than through a component. See loginRedirect.ts for why `{ scroll: false }`
 * is correct on same-page gating and wrong on cross-page gating.
 */
describe('buildLoginTarget', () => {
  it('returns to the current page and suppresses the scroll', () => {
    expect(buildLoginTarget({ pathname: '/members', search: '' })).toEqual({
      href: '/members#login',
      scroll: false,
    });
  });

  it('preserves the current search params', () => {
    expect(buildLoginTarget({ pathname: '/members', search: '?tab=all&sort=name' })).toEqual({
      href: '/members?tab=all&sort=name#login',
      scroll: false,
    });
  });

  it('still suppresses the scroll when only the search changes', () => {
    // Not an `onlyHashChange` navigation, but the visitor stays on the same page,
    // so resetting their scroll is just as wrong.
    const target = buildLoginTarget({ pathname: '/home', search: '' }, { returnTo: '/home?news=abc123' });

    expect(target).toEqual({ href: '/home?news=abc123#login', scroll: false });
  });

  it('leaves the scroll enabled when the pathname changes', () => {
    // The case a blanket `{ scroll: false }` sweep would have broken: this is a real
    // page navigation, and suppressing the scroll strands the visitor partway down
    // a page they have never seen.
    const target = buildLoginTarget({ pathname: '/teams', search: '' }, { returnTo: '/members' });

    expect(target).toEqual({ href: '/members#login', scroll: true });
  });

  it('sends visitors on /sign-up to the root with the scroll enabled', () => {
    // /sign-up cannot host the round trip, so the gate redirects. That makes it a
    // cross-page navigation, which must keep Next's default scroll.
    expect(buildLoginTarget({ pathname: '/sign-up', search: '?returnTo=members' })).toEqual({
      href: '/#login',
      scroll: true,
    });
  });

  it('honours an explicit returnTo over the /sign-up fallback', () => {
    const target = buildLoginTarget({ pathname: '/sign-up', search: '' }, { returnTo: '/members/xyz' });

    expect(target.href).toBe('/members/xyz#login');
  });

  it('merges extra params into the existing search', () => {
    const target = buildLoginTarget(
      { pathname: '/irl', search: '?event=lisbon' },
      { params: { 'open-modal': 'true' } },
    );

    expect(target.href).toBe('/irl?event=lisbon&open-modal=true#login');
    expect(target.scroll).toBe(false);
  });

  it('lets extra params override a colliding existing param', () => {
    const target = buildLoginTarget({ pathname: '/jobs', search: '?tab=all' }, { params: { tab: 'applied' } });

    expect(target.href).toBe('/jobs?tab=applied#login');
  });

  it('encodes param values', () => {
    const target = buildLoginTarget({ pathname: '/demoday', search: '' }, { params: { prefillEmail: 'a b@c.io' } });

    expect(target.href).toBe('/demoday?prefillEmail=a+b%40c.io#login');
  });
});

describe('useLoginRedirect', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setUrl('/members?tab=all');
  });

  it('pushes the login gate for the current page without scrolling', () => {
    const { result } = renderHook(() => useLoginRedirect());

    act(() => result.current());

    expect(mockRouter.push).toHaveBeenCalledWith('/members?tab=all#login', { scroll: false });
    expect(mockRouter.replace).not.toHaveBeenCalled();
  });

  it('reads the live URL rather than the router hooks', () => {
    // Several callers navigate from pages whose URL was written with raw
    // history.replaceState, which usePathname/useSearchParams never learn about.
    const { result } = renderHook(() => useLoginRedirect());

    setUrl('/home?news=abc123');
    act(() => result.current());

    expect(mockRouter.push).toHaveBeenCalledWith('/home?news=abc123#login', { scroll: false });
  });

  it('uses replace when asked, so Back does not restore the gate', () => {
    const { result } = renderHook(() => useLoginRedirect());

    act(() => result.current({ replace: true }));

    expect(mockRouter.replace).toHaveBeenCalledWith('/members?tab=all#login', { scroll: false });
    expect(mockRouter.push).not.toHaveBeenCalled();
  });

  it('keeps the scroll enabled when gating sends the visitor to another page', () => {
    setUrl('/sign-up');
    const { result } = renderHook(() => useLoginRedirect());

    act(() => result.current());

    expect(mockRouter.push).toHaveBeenCalledWith('/#login', { scroll: true });
  });
});
