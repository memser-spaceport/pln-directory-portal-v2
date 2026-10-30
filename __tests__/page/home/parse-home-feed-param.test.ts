import { parseHomeFeedParam } from '@/components/page/home/TeamNews/utils/parseHomeFeedParam';

describe('parseHomeFeedParam (LAB-3036)', () => {
  it('reads ?feed=for-you as the For You feed', () => {
    expect(parseHomeFeedParam('for-you')).toBe('for-you');
  });

  it('ignores a missing, unknown or repeated value', () => {
    expect(parseHomeFeedParam(undefined)).toBeUndefined();
    expect(parseHomeFeedParam('')).toBeUndefined();
    expect(parseHomeFeedParam('all')).toBeUndefined();
    expect(parseHomeFeedParam('For-You')).toBeUndefined();
    expect(parseHomeFeedParam(['for-you', 'all'])).toBeUndefined();
  });
});
