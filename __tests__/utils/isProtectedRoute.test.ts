import { isProtectedRoute } from '@/utils/isProtectedRoute';

// PLAA-65: every /alignment-asset page requires LabOS login, no exceptions.
// (Profile/Onboarding get an additional, narrower restriction on top of this
// baseline — that's PLAA-66/67, not this ticket.)
describe('isProtectedRoute', () => {
  describe('alignment-asset (PLAA-65)', () => {
    it('protects the section root', () => {
      expect(isProtectedRoute('/alignment-asset')).toBe(true);
    });

    it('protects every known subpage, including ones that read as public marketing content today', () => {
      const subpages = [
        '/alignment-asset/overview',
        '/alignment-asset/activities',
        '/alignment-asset/incentive-model',
        '/alignment-asset/profile',
        '/alignment-asset/kudos',
        '/alignment-asset/trust-holdings',
        '/alignment-asset/product-versions',
        '/alignment-asset/faqs',
        '/alignment-asset/terms-of-use',
        '/alignment-asset/privacy-policy',
        '/alignment-asset/disclosure',
      ];
      for (const path of subpages) {
        expect(isProtectedRoute(path)).toBe(true);
      }
    });

    it('protects nested round pages, not just top-level subpages', () => {
      expect(isProtectedRoute('/alignment-asset/rounds/19')).toBe(true);
    });

    it('does not protect an unrelated path that merely starts with the same letters', () => {
      expect(isProtectedRoute('/alignment-asset-unrelated')).toBe(false);
    });
  });

  describe('existing protected routes (regression)', () => {
    it('still protects /deals/, /founder-guides, and /investors', () => {
      expect(isProtectedRoute('/deals/123')).toBe(true);
      expect(isProtectedRoute('/founder-guides')).toBe(true);
      expect(isProtectedRoute('/investors')).toBe(true);
    });
  });

  describe('unprotected routes (regression)', () => {
    it('leaves other site sections open', () => {
      expect(isProtectedRoute('/members')).toBe(false);
      expect(isProtectedRoute('/teams')).toBe(false);
      expect(isProtectedRoute('/')).toBe(false);
    });
  });
});
