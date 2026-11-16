/**
 * @jest-environment node
 */
/**
 * The domain move: directory.plnetwork.io 301s every path to os.pl.xyz, but Google had recrawled only 122 old URLs three
 * weeks after the Change of Address, because the old host had no sitemap. os.pl.xyz serves one that lists the old
 * host's addresses, to be submitted in Search Console.
 */
import { unstable_doesMiddlewareMatch } from 'next/experimental/testing/server';
import { GET } from '@/app/sitemaps/legacy-directory-plnetwork.xml/route';
import { config } from '@/proxy';
import { LEGACY_SITEMAP_PATH, legacyHostSitemapXml } from '@/services/seo/legacyHostSitemap';
import { sitemapIndexXml } from '@/services/seo/sitemapSections';

const original = { base: process.env.APPLICATION_BASE_URL, api: process.env.DIRECTORY_API_URL };

function jsonOk(body: unknown) {
  return Promise.resolve({ ok: true, json: async () => body });
}

beforeEach(() => {
  process.env.APPLICATION_BASE_URL = 'https://os.pl.xyz';
  process.env.DIRECTORY_API_URL = 'https://api.example';
  global.fetch = jest.fn().mockImplementation((url: string) => {
    if (url.includes('/v1/teams/crawl-index')) {
      return jsonOk({ teams: [{ uid: 'team-1', updatedAt: '2026-03-01T00:00:00.000Z' }] });
    }
    if (url.includes('/v1/members/crawl-index')) {
      return jsonOk({ members: [{ uid: 'member-1' }] });
    }
    if (url.includes('/v1/projects')) {
      return jsonOk({ projects: [{ uid: 'project-1', updatedAt: '2026-04-01T00:00:00.000Z' }] });
    }
    if (url.includes('/v1/job-openings/crawl-index')) {
      return jsonOk({ jobs: [{ uid: 'job-1', lastModified: '2026-01-02T00:00:00.000Z' }] });
    }
    return jsonOk({});
  }) as unknown as typeof fetch;
});

afterEach(() => {
  process.env.APPLICATION_BASE_URL = original.base;
  process.env.DIRECTORY_API_URL = original.api;
});

const locs = (xml: string) => [...xml.matchAll(/<loc>([^<]*)<\/loc>/g)].map((match) => match[1]);

describe(LEGACY_SITEMAP_PATH, () => {
  it('lists every sitemap address on the old host, plus the old root and the old /home', async () => {
    const response = await GET();
    const xml = await response.text();

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toMatch(/application\/xml/);
    expect(xml).toContain('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">');
    expect(locs(xml)).toEqual(
      expect.arrayContaining([
        'https://directory.plnetwork.io/',
        'https://directory.plnetwork.io/home',
        'https://directory.plnetwork.io/events/all',
        'https://directory.plnetwork.io/teams/team-1',
        'https://directory.plnetwork.io/members/member-1',
        'https://directory.plnetwork.io/projects/project-1',
        'https://directory.plnetwork.io/jobs/openings/job-1',
      ]),
    );
    expect(locs(xml).every((loc) => loc.startsWith('https://directory.plnetwork.io/'))).toBe(true);
    expect(new Set(locs(xml)).size).toBe(locs(xml).length);
  });

  // The date each old URL became a redirect is unknown, and a guessed lastmod teaches Google to ignore the field.
  it('gives no lastmod', async () => {
    expect(await (await GET()).text()).not.toContain('<lastmod>');
  });

  // Only production's entity ids are the old host's, so a feature env or preview must not claim them.
  it.each(['https://directory-portal-lab-3083.os.pl.xyz', 'http://localhost:4200', ''])(
    'answers 404 on a deployment at %p',
    async (base) => {
      process.env.APPLICATION_BASE_URL = base;
      expect((await GET()).status).toBe(404);
    },
  );

  it('escapes the addresses', () => {
    expect(legacyHostSitemapXml(['https://directory.plnetwork.io/a?b=1&c=<2>'])).toContain(
      '<loc>https://directory.plnetwork.io/a?b=1&amp;c=&lt;2&gt;</loc>',
    );
  });

  // /sitemap.xml lists only addresses meant to be indexed, and every old-host address redirects.
  it('is not in the sitemap index', () => {
    expect(sitemapIndexXml('https://os.pl.xyz')).not.toContain('legacy');
  });

  it('is skipped by the session proxy, so it carries no cookie headers', () => {
    expect(unstable_doesMiddlewareMatch({ config, url: LEGACY_SITEMAP_PATH })).toBe(false);
  });
});
