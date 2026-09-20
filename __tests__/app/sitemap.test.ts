/**
 * @jest-environment node
 */

import sitemap from '@/app/sitemap';

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
        return jsonOk({ jobs: [{ uid: 'job-1', updatedAt: '2026-01-02T00:00:00.000Z' }] });
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
});
