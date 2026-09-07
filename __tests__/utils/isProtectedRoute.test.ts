import { isProtectedRoute, PLAA_SECTION, PROTECTED_ROUTES } from '@/utils/isProtectedRoute';

describe('isProtectedRoute', () => {
  describe('the alignment-asset section', () => {
    it('protects the section root', () => {
      expect(isProtectedRoute(PLAA_SECTION)).toBe(true);
    });

    it('protects anything nested under it, at any depth', () => {
      expect(isProtectedRoute(`${PLAA_SECTION}/faqs`)).toBe(true);
      expect(isProtectedRoute(`${PLAA_SECTION}/rounds/19`)).toBe(true);
    });

    it('does not protect a sibling path that merely shares the prefix', () => {
      expect(isProtectedRoute(`${PLAA_SECTION}-unrelated`)).toBe(false);
    });
  });

  describe('the other configured routes', () => {
    it('protects each of them, and everything nested under them', () => {
      for (const route of PROTECTED_ROUTES) {
        expect(isProtectedRoute(`${route.replace(/\/$/, '')}/child`)).toBe(true);
      }
    });

    it('matches them on a plain prefix, the long-standing behaviour', () => {
      expect(isProtectedRoute('/investors')).toBe(true);
      expect(isProtectedRoute('/founder-guides')).toBe(true);
      expect(isProtectedRoute('/deals/123')).toBe(true);
    });
  });

  it('leaves unconfigured sections open', () => {
    expect(isProtectedRoute('/members')).toBe(false);
    expect(isProtectedRoute('/teams')).toBe(false);
    expect(isProtectedRoute('/')).toBe(false);
  });
});
