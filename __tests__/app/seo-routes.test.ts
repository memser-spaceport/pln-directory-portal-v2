/**
 * LAB-2887: what Google reads first — robots.txt and the site root.
 */
const mockPermanentRedirect = jest.fn();
const mockRedirect = jest.fn();
jest.mock('next/navigation', () => ({
  permanentRedirect: (...args: unknown[]) => mockPermanentRedirect(...args),
  redirect: (...args: unknown[]) => mockRedirect(...args),
}));

import robots from '@/app/robots';
import LandingPage from '@/app/page';

describe('robots.txt', () => {
  const rule = () => {
    const { rules } = robots();
    return Array.isArray(rules) ? rules[0] : rules;
  };

  /* Google renders the board without any resource robots.txt blocks, and the board fills itself from
     /api/jobs/list. The longest matching rule wins, so `Allow: /api/jobs/` beats `Disallow: /api/`. */
  it('lets crawlers fetch the job board API the page renders from, and nothing else under /api/', () => {
    expect(rule().allow).toEqual(expect.arrayContaining(['/', '/api/jobs/']));
    expect(rule().disallow).toEqual(expect.arrayContaining(['/api/']));
    expect(rule().allow).not.toContain('/api/');
  });
});

describe('the site root', () => {
  beforeEach(() => {
    mockPermanentRedirect.mockClear();
    mockRedirect.mockClear();
  });

  /* A temporary (307) redirect keeps `/` as the canonical address in Google's eyes. */
  it('redirects permanently to /home', async () => {
    await LandingPage();
    expect(mockPermanentRedirect).toHaveBeenCalledWith('/home');
    expect(mockRedirect).not.toHaveBeenCalled();
  });
});
