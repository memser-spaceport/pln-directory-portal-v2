import { isBareRoute } from '@/utils/isBareRoute';

describe('isBareRoute', () => {
  it('matches the AI App PRD viewer route', () => {
    expect(isBareRoute('/pl-infra/ai-apps/app-1/prd')).toBe(true);
  });

  it('matches with a trailing slash', () => {
    expect(isBareRoute('/pl-infra/ai-apps/app-1/prd/')).toBe(true);
  });

  it('does not match the app detail route itself', () => {
    expect(isBareRoute('/pl-infra/ai-apps/app-1')).toBe(false);
  });

  it('does not match the ai-apps list route', () => {
    expect(isBareRoute('/pl-infra/ai-apps')).toBe(false);
  });

  it('does not match an unrelated route', () => {
    expect(isBareRoute('/members')).toBe(false);
  });

  it('does not match a nested path beyond /prd', () => {
    expect(isBareRoute('/pl-infra/ai-apps/app-1/prd/extra')).toBe(false);
  });
});
