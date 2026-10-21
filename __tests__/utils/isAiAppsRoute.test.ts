import { isAiAppsRoute } from '@/utils/isAiAppsRoute';

describe('isAiAppsRoute', () => {
  it.each(['/pl-infra/ai-apps', '/pl-infra/ai-apps/', '/pl-infra/ai-apps/app-1', '/pl-infra/ai-apps/app-1/feedback'])(
    'is true for %s',
    (pathname) => {
      expect(isAiAppsRoute(pathname)).toBe(true);
    },
  );

  it.each(['/members', '/home', '/pl-infra', '/pl-infra/ai-apps-old', '/teams/ai-apps', ''])(
    'is false for %s',
    (pathname) => {
      expect(isAiAppsRoute(pathname)).toBe(false);
    },
  );

  it('is false without a pathname', () => {
    expect(isAiAppsRoute(null)).toBe(false);
  });
});
