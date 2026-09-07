import { isProtectedRoute, PROTECTED_ROUTES } from '@/utils/isProtectedRoute';

describe('isProtectedRoute', () => {
  it('protects every configured route, and everything nested under it', () => {
    for (const route of PROTECTED_ROUTES) {
      expect(isProtectedRoute(`${route.replace(/\/$/, '')}/child`)).toBe(true);
      expect(isProtectedRoute(`${route.replace(/\/$/, '')}/child/grandchild`)).toBe(true);
    }
  });

  it('protects a section root written without a trailing slash', () => {
    expect(isProtectedRoute('/alignment-asset')).toBe(true);
  });

  it('does not protect a sibling path that merely shares the prefix', () => {
    expect(isProtectedRoute('/alignment-asset-unrelated')).toBe(false);
    expect(isProtectedRoute('/investors-club')).toBe(false);
  });

  it('leaves unconfigured sections open', () => {
    expect(isProtectedRoute('/members')).toBe(false);
    expect(isProtectedRoute('/teams')).toBe(false);
    expect(isProtectedRoute('/')).toBe(false);
  });

  it('covers the alignment-asset section, so no PLAA page can be reached without a login', () => {
    expect(PROTECTED_ROUTES).toContain('/alignment-asset');
  });
});
