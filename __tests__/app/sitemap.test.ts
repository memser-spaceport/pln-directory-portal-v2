/**
 * @jest-environment node
 */

import { SITEMAP_SECTIONS, sitemapSection } from '@/services/seo/sitemapSections';

/** Every section's entries together: what the single sitemap used to list. */
const sitemap = async () => (await Promise.all(SITEMAP_SECTIONS.map((section) => sitemapSection(section)))).flat();

function jsonOk(body: unknown) {
  return Promise.resolve({ ok: true, json: async () => body });
}

describe('sitemap', () => {
  const originalBase = process.env.APPLICATION_BASE_URL;
  const originalApi = process.env.DIRECTORY_API_URL;

  beforeEach(() => {
    process.env.APPLICATION_BASE_URL = 'https://os.pl.xyz';
    process.env.DIRECTORY_API_URL = 'https://api.example';
    global.fetch = jest.fn();
  });

  afterEach(() => {
    process.env.APPLICATION_BASE_URL = originalBase;
    process.env.DIRECTORY_API_URL = originalApi;
    jest.restoreAllMocks();
  });

  it('emits lastmod for jobs and other entities that have updatedAt', async () => {
    (global.fetch as jest.Mock).mockImplementation((url: string) => {
      if (url.includes('/v1/job-openings/crawl-index')) {
        return jsonOk({
          jobs: [{ uid: 'job-1', updatedAt: '2026-11-03T03:00:00.000Z', lastModified: '2026-01-02T00:00:00.000Z' }],
        });
      }
      if (url.includes('/v1/teams')) {
        return jsonOk({ teams: [{ uid: 'team-1', updatedAt: '2026-03-01T00:00:00.000Z' }] });
      }
      if (url.includes('/v1/members')) {
        return jsonOk({ members: [{ uid: 'member-1' }] });
      }
      if (url.includes('/v1/projects')) {
        return jsonOk({ projects: [{ uid: 'project-1', updatedAt: '2026-04-01T00:00:00.000Z' }] });
      }
      return Promise.resolve({ ok: false, json: async () => ({}) });
    });

    const entries = await sitemap();
    const byUrl = Object.fromEntries(entries.map((entry) => [entry.url, entry]));

    expect(byUrl['https://os.pl.xyz/jobs/openings/job-1']?.lastModified).toEqual(new Date('2026-01-02T00:00:00.000Z'));
    expect(byUrl['https://os.pl.xyz/teams/team-1']?.lastModified).toEqual(new Date('2026-03-01T00:00:00.000Z'));
    expect(byUrl['https://os.pl.xyz/projects/project-1']?.lastModified).toEqual(new Date('2026-04-01T00:00:00.000Z'));
    expect(byUrl['https://os.pl.xyz/members/member-1']?.lastModified).toBeUndefined();
    expect(byUrl['https://os.pl.xyz/home']?.lastModified).toBeUndefined();
  });

  /* LAB-2923 / LAB-2924: every static URL is an address Google should index as is. `/events` only redirects to the
     calendar, and Demo Day was missing. */
  it('lists the events calendar and Demo Day by their own addresses, and no redirect', async () => {
    (global.fetch as jest.Mock).mockImplementation(() => jsonOk({}));

    const urls = (await sitemap()).map((entry) => entry.url);

    expect(urls).toEqual(expect.arrayContaining(['https://os.pl.xyz/events/all', 'https://os.pl.xyz/demoday']));
    expect(urls).not.toContain('https://os.pl.xyz/events');
  });

  /* LAB-3087: the teams come from the crawl index, which leaves out the teams the API refuses to a logged-out
     visitor. The full list only stands in while the API has no crawl index. */
  it('lists teams from the crawl index, not the full list', async () => {
    (global.fetch as jest.Mock).mockImplementation((url: string) => {
      if (url.includes('/v1/teams/crawl-index')) {
        return jsonOk({ teams: [{ uid: 'public-team', updatedAt: '2026-03-01T00:00:00.000Z' }] });
      }
      if (url.includes('/v1/teams')) {
        return jsonOk({ teams: [{ uid: 'public-team' }, { uid: 'inactive-team' }] });
      }
      return jsonOk({});
    });

    const urls = (await sitemap()).map((entry) => entry.url);

    expect(urls).toContain('https://os.pl.xyz/teams/public-team');
    expect(urls).not.toContain('https://os.pl.xyz/teams/inactive-team');
  });

  it('falls back to the full team list when the API has no crawl index', async () => {
    (global.fetch as jest.Mock).mockImplementation((url: string) => {
      if (url.includes('/v1/teams/crawl-index')) {
        return Promise.resolve({ ok: false, json: async () => ({}) });
      }
      if (url.includes('/v1/teams')) {
        return jsonOk({ teams: [{ uid: 'team-1' }] });
      }
      return jsonOk({});
    });

    const urls = (await sitemap()).map((entry) => entry.url);

    expect(urls).toContain('https://os.pl.xyz/teams/team-1');
  });

  /* LAB-3096: members come from their crawl index, which leaves out empty profiles (no photo, no bio); the member page
     marks those noindex. The full list only stands in while the API has no crawl index. */
  it('lists members from the crawl index, not the full list', async () => {
    (global.fetch as jest.Mock).mockImplementation((url: string) => {
      if (url.includes('/v1/members/crawl-index')) {
        return jsonOk({ members: [{ uid: 'member-with-bio', updatedAt: '2026-03-01T00:00:00.000Z' }] });
      }
      if (url.includes('/v1/members')) {
        return jsonOk({ members: [{ uid: 'member-with-bio' }, { uid: 'empty-member' }] });
      }
      return jsonOk({});
    });

    const urls = (await sitemap()).map((entry) => entry.url);

    expect(urls).toContain('https://os.pl.xyz/members/member-with-bio');
    expect(urls).not.toContain('https://os.pl.xyz/members/empty-member');
  });

  it('falls back to the full member list when the API has no member crawl index', async () => {
    (global.fetch as jest.Mock).mockImplementation((url: string) => {
      if (url.includes('/v1/members/crawl-index')) {
        return Promise.resolve({ ok: false, json: async () => ({}) });
      }
      if (url.includes('/v1/members')) {
        return jsonOk({ members: [{ uid: 'member-1' }] });
      }
      return jsonOk({});
    });

    const urls = (await sitemap()).map((entry) => entry.url);

    expect(urls).toContain('https://os.pl.xyz/members/member-1');
  });

  /* LAB-3094: Google ignores changefreq and priority; lastmod is the one field it reads, and a job's must be the
     posting's own date, not the nightly sync that rewrites updatedAt. */
  it('has no changefreq or priority, and dates a job by lastModified, never by updatedAt', async () => {
    (global.fetch as jest.Mock).mockImplementation((url: string) => {
      if (url.includes('/v1/job-openings/crawl-index')) {
        return jsonOk({ jobs: [{ uid: 'job-sync-only', updatedAt: '2026-11-03T03:00:00.000Z' }] });
      }
      if (url.includes('/v1/teams')) {
        return jsonOk({ teams: [{ uid: 'team-1', updatedAt: '2026-03-01T00:00:00.000Z' }] });
      }
      return jsonOk({});
    });

    const entries = await sitemap();

    for (const entry of entries) {
      expect(entry).not.toHaveProperty('changeFrequency');
      expect(entry).not.toHaveProperty('priority');
    }
    const job = entries.find((entry) => entry.url.endsWith('/jobs/openings/job-sync-only'));
    expect(job).toBeDefined();
    expect(job?.lastModified).toBeUndefined();
  });
  /* Every browse page is listed: page 1 is the only one any page links to, and Search Console still had
     `/teams/browse` as "unknown to Google". 401 teams make three pages; page 1 keeps its one address. */
  it('lists every page of the browse indexes', async () => {
    const teams = Array.from({ length: 401 }, (_, i) => ({ uid: `t${i}`, name: `Team ${i}` }));
    (global.fetch as jest.Mock).mockImplementation((url: string) => {
      if (url.includes('/v1/teams?pagination=false&select=uid,name')) return jsonOk({ teams });
      if (url.includes('/v1/members?pagination=false&select=uid,name')) {
        return jsonOk({ members: [{ uid: 'm1', name: 'Ada' }] });
      }
      return jsonOk({});
    });

    const urls = (await sitemapSection('pages')).map((entry) => entry.url);

    expect(urls.filter((url) => url.includes('/browse'))).toEqual([
      'https://os.pl.xyz/teams/browse',
      'https://os.pl.xyz/teams/browse?page=2',
      'https://os.pl.xyz/teams/browse?page=3',
      'https://os.pl.xyz/members/browse',
      'https://os.pl.xyz/projects/browse',
    ]);
  });

  it('still lists page 1 of each browse index when the API cannot be read', async () => {
    (global.fetch as jest.Mock).mockImplementation(() => Promise.resolve({ ok: false, json: async () => ({}) }));

    const urls = (await sitemapSection('pages')).map((entry) => entry.url);

    expect(urls).toEqual(
      expect.arrayContaining([
        'https://os.pl.xyz/teams/browse',
        'https://os.pl.xyz/members/browse',
        'https://os.pl.xyz/projects/browse',
      ]),
    );
    expect(urls.some((url) => url.includes('?page='))).toBe(false);
  });
});
