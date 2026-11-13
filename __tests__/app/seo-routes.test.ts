/**
 * LAB-2887: what Google reads first — robots.txt and the site root. LAB-3255: the homepage is the site root, and the
 * old /home redirects to it.
 */
import { getPathMatch } from 'next/dist/shared/lib/router/utils/path-match';
import robots from '@/app/robots';
import { HOME_REDIRECTS } from '@/utils/home-redirects';

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

describe('the old /home', () => {
  const redirectFor = (pathname: string) =>
    HOME_REDIRECTS.find((rule) => getPathMatch(rule.source, { removeUnnamedParams: true })(pathname));

  /* Permanent, so Google moves /home's signals to the root. Next.js appends the request's query to the
     destination, so `/home?news=<uid>` lands on `/?news=<uid>`. */
  it('redirects permanently to the site root', () => {
    expect(redirectFor('/home')).toEqual({ source: '/home', destination: '/', permanent: true });
  });

  it('leaves every other path alone', () => {
    expect(redirectFor('/')).toBeUndefined();
    expect(redirectFor('/home/anything')).toBeUndefined();
    expect(redirectFor('/homepage')).toBeUndefined();
  });
});
