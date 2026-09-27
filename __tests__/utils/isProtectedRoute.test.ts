import { isProtectedRoute, PLAA_PUBLIC_EXACT_PATHS, PROTECTED_ROUTES } from '@/utils/isProtectedRoute';

describe('isProtectedRoute', () => {
  it('protects every configured route, and everything nested under it', () => {
    for (const route of PROTECTED_ROUTES) {
      expect(isProtectedRoute(`${route.replace(/\/$/, '')}/child`)).toBe(true);
      expect(isProtectedRoute(`${route.replace(/\/$/, '')}/child/grandchild`)).toBe(true);
    }
  });

  it('protects a section root written without a trailing slash', () => {
    expect(isProtectedRoute('/investors')).toBe(true);
  });

  describe('the PLAA public list', () => {
    it('leaves only the listed PLAA pages open', () => {
      for (const route of PLAA_PUBLIC_EXACT_PATHS) {
        expect(isProtectedRoute(route)).toBe(false);
        expect(isProtectedRoute(`${route}/`)).toBe(false);
      }
    });

    it('keeps every other PLAA page gated, including ones added later', () => {
      expect(isProtectedRoute('/alignment-asset/profile')).toBe(true);
      expect(isProtectedRoute('/alignment-asset/leaderboard')).toBe(true);
      expect(isProtectedRoute('/alignment-asset/some-new-page')).toBe(true);
    });

    it('matches public PLAA pages exactly, never as a prefix', () => {
      for (const route of PLAA_PUBLIC_EXACT_PATHS) {
        expect(isProtectedRoute(`${route}/child`)).toBe(true);
      }
    });

    it('only lists pages inside the PLAA section', () => {
      for (const route of PLAA_PUBLIC_EXACT_PATHS) {
        expect(route === '/alignment-asset' || route.startsWith('/alignment-asset/')).toBe(true);
      }
    });
  });

  it('does not protect a sibling path that merely shares the prefix', () => {
    expect(isProtectedRoute('/alignment-asset-unrelated')).toBe(false);
    expect(isProtectedRoute('/investors-club')).toBe(false);
  });

  describe('the AI Apps carve-outs', () => {
    it('protects the AI Apps section', () => {
      expect(isProtectedRoute('/pl-infra/ai-apps')).toBe(true);
      expect(isProtectedRoute('/pl-infra-os')).toBe(true);
    });

    it('leaves the sub-paths that render their own signed-out state open', () => {
      expect(isProtectedRoute('/pl-infra/ai-apps/connect')).toBe(false);
      expect(isProtectedRoute('/pl-infra/ai-apps/feedback')).toBe(false);
    });
  });

  it('leaves unconfigured sections open', () => {
    expect(isProtectedRoute('/members')).toBe(false);
    expect(isProtectedRoute('/teams')).toBe(false);
    expect(isProtectedRoute('/')).toBe(false);
  });

  it('gates the whole alignment-asset section by default', () => {
    expect(PROTECTED_ROUTES).toContain('/alignment-asset');
  });
});
