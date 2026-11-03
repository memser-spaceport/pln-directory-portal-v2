/**
 * @jest-environment node
 */
/**
 * LAB-3106: Google never processed the single sitemap ("Couldn't fetch", 0 discovered pages, though its live test
 * fetched it). /sitemap.xml is now an index of one sitemap per section, at the address robots.txt already gives, and the
 * crawler files no longer pass through the session proxy, which answered them with cookie-clearing headers.
 */
import { unstable_doesMiddlewareMatch } from 'next/experimental/testing/server';
import { GET } from '@/app/sitemap.xml/route';
import sectionSitemap, { generateSitemaps } from '@/app/sitemaps/sitemap';
import { config } from '@/proxy';
import { SITEMAP_SECTIONS, sitemapIndexXml, sitemapSectionPath } from '@/services/seo/sitemapSections';

const original = { base: process.env.APPLICATION_BASE_URL, api: process.env.DIRECTORY_API_URL };

beforeEach(() => {
  process.env.APPLICATION_BASE_URL = 'https://os.pl.xyz';
  process.env.DIRECTORY_API_URL = 'https://api.example';
  global.fetch = jest.fn().mockImplementation((url: string) =>
    Promise.resolve({
      ok: true,
      json: async () =>
        url.includes('/v1/teams/crawl-index')
          ? { teams: [{ uid: 'team-1', updatedAt: '2026-03-01T00:00:00.000Z' }] }
          : url.includes('/v1/members')
            ? { members: [{ uid: 'member-1' }] }
            : {},
    }),
  ) as unknown as typeof fetch;
});

afterEach(() => {
  process.env.APPLICATION_BASE_URL = original.base;
  process.env.DIRECTORY_API_URL = original.api;
});

describe('/sitemap.xml', () => {
  it('is a sitemap index of the five sections, with absolute locations', async () => {
    const response = GET();
    const xml = await response.text();

    expect(response.headers.get('content-type')).toMatch(/application\/xml/);
    expect(xml).toContain('<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">');
    expect(xml.match(/<sitemap><loc>/g)).toHaveLength(5);
    for (const section of SITEMAP_SECTIONS) {
      expect(xml).toContain(`<loc>https://os.pl.xyz/sitemaps/sitemap/${section}.xml</loc>`);
    }
  });

  it('lists nothing rather than relative locations when the base URL is unknown', () => {
    expect(sitemapIndexXml('')).not.toContain('<loc>');
  });
});

describe('section sitemaps', () => {
  it('has one sitemap per section, served where the index points', async () => {
    expect(await generateSitemaps()).toEqual(SITEMAP_SECTIONS.map((id) => ({ id })));
    expect(sitemapSectionPath('teams')).toBe('/sitemaps/sitemap/teams.xml');
  });

  it('lists only its own kind of page', async () => {
    const teams = await sectionSitemap({ id: Promise.resolve('teams') });
    const members = await sectionSitemap({ id: Promise.resolve('members') });

    expect(teams.map((entry) => entry.url)).toEqual(['https://os.pl.xyz/teams/team-1']);
    expect(members.map((entry) => entry.url)).toEqual(['https://os.pl.xyz/members/member-1']);
  });

  it('answers an unknown section with an empty sitemap', async () => {
    await expect(sectionSitemap({ id: Promise.resolve('nope') })).resolves.toEqual([]);
  });
});

describe('the session proxy', () => {
  it.each(['/sitemap.xml', '/sitemaps/sitemap/teams.xml', '/robots.txt'])('leaves %s alone', (path) => {
    expect(unstable_doesMiddlewareMatch({ config, url: path })).toBe(false);
  });

  it.each(['/home', '/teams/abc', '/members'])('still runs on %s', (path) => {
    expect(unstable_doesMiddlewareMatch({ config, url: path })).toBe(true);
  });
});
