import { isProtectedRoute, PROTECTED_ROUTES } from '@/utils/isProtectedRoute';

describe('isProtectedRoute', () => {
  it('protects every configured route, and everything nested under it', () => {
    for (const route of PROTECTED_ROUTES) {
      expect(isProtectedRoute(`${route.replace(/\/$/, '')}/child`)).toBe(true);
      expect(isProtectedRoute(`${route.replace(/\/$/, '')}/child/grandchild`)).toBe(true);
    }
  });

  // The bare /alignment-asset route is the program's public front door; the
  // nested assertions above still cover the rest of the section.

  it('protects a section root written without a trailing slash', () => {
    expect(isProtectedRoute('/investors')).toBe(true);
  });

  it('leaves the PLAA home public but keeps every sub-page gated (PLAA-94)', () => {
    expect(isProtectedRoute('/alignment-asset')).toBe(false);
    expect(isProtectedRoute('/alignment-asset/')).toBe(false);
    expect(isProtectedRoute('/alignment-asset/profile')).toBe(true);
    expect(isProtectedRoute('/alignment-asset/leaderboard')).toBe(true);
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

  it('keeps the alignment-asset sub-tree gated', () => {
    expect(PROTECTED_ROUTES).toContain('/alignment-asset');
  });
});
