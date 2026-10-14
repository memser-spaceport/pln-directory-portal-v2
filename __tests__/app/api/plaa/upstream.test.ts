import { plaaUpstreamUrl } from '@/app/api/plaa/_upstream';

const BASE = 'https://plaa.internal.example';

describe('plaaUpstreamUrl', () => {
  it('joins fixed segments under /api/v1', () => {
    expect(plaaUpstreamUrl(BASE, ['kudos', 'community-pool'])).toBe(`${BASE}/api/v1/kudos/community-pool`);
  });

  it('accepts ids made of letters, digits, underscore and hyphen', () => {
    expect(plaaUpstreamUrl(BASE, ['kudos', 'community', 'cmq8d7vhr00nlny4g33b74d9t'])).toBe(
      `${BASE}/api/v1/kudos/community/cmq8d7vhr00nlny4g33b74d9t`,
    );
    expect(plaaUpstreamUrl(BASE, ['kudos', 'community', 'A_b-9'])).toBe(`${BASE}/api/v1/kudos/community/A_b-9`);
  });

  it.each(['', '.', '..', 'a/b', 'a%2Fb', 'a b', 'a?b', 'a#b', 'a'.repeat(65)])(
    'returns null when a segment is %p',
    (segment) => {
      expect(plaaUpstreamUrl(BASE, ['kudos', 'community', segment])).toBeNull();
    },
  );

  it('encodes query values so they cannot add parameters or a fragment', () => {
    const url = plaaUpstreamUrl(BASE, ['points', 'me'], { snapshotPeriod: 'October 2026&x=1#frag' });

    expect(url).toBe(`${BASE}/api/v1/points/me?snapshotPeriod=October+2026%26x%3D1%23frag`);
    expect(new URL(url as string).searchParams.get('snapshotPeriod')).toBe('October 2026&x=1#frag');
  });

  it('skips empty, null and undefined query values', () => {
    expect(plaaUpstreamUrl(BASE, ['kudos'], { limit: '10', cursor: null, other: undefined, blank: '' })).toBe(
      `${BASE}/api/v1/kudos?limit=10`,
    );
  });

  it('adds no question mark when every query value is skipped', () => {
    expect(plaaUpstreamUrl(BASE, ['kudos'], { cursor: null })).toBe(`${BASE}/api/v1/kudos`);
  });
});
