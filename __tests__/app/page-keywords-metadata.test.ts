/**
 * @jest-environment node
 */
/**
 * LAB-2923: each main page has its own title and description, carrying the searches the site should be found for.
 * "Protocol Labs" everywhere, "innovation network" on the home page, "venture investors" and "VC" on Demo Day. Share
 * cards say the same as the search result. The job board keeps LAB-2889's title.
 */
import type { Metadata } from 'next';

jest.mock('@/services/team-news/team-news.service', () => ({ getTeamNewsItemByUid: jest.fn() }));
// The home page's import graph reaches the AI Search code block, whose syntax highlighter ships ESM only.
jest.mock('@/components/core/husky/husky-code-block', () => () => null);

const load = async (): Promise<Record<string, Metadata>> => {
  const home = await import('@/app/home/page');
  return {
    '/home': await home.generateMetadata({ searchParams: Promise.resolve({}) } as never),
    '/members': (await import('@/app/members/(members-page)/layout')).metadata,
    '/teams': (await import('@/app/teams/(teams-page)/layout')).metadata,
    '/projects': (await import('@/app/projects/(projects-page)/layout')).metadata,
    '/events/all': (await import('@/app/events/all/page')).metadata,
    '/jobs': (await import('@/app/jobs/(jobs-page)/layout')).metadata,
    '/demoday': (await import('@/app/demoday/page')).metadata,
  };
};

const text = (value: unknown) => String(value ?? '');

let pages: Record<string, Metadata>;
beforeAll(async () => {
  pages = await load();
});

it.each(['/home', '/members', '/teams', '/projects', '/events/all', '/jobs', '/demoday'])(
  '%s names Protocol Labs in its title and description',
  (path) => {
    expect(text(pages[path].title)).toContain('Protocol Labs');
    expect(text(pages[path].description)).toContain('Protocol Labs');
  },
);

it('the home page names the innovation network in its title and description', () => {
  expect(text(pages['/home'].title)).toContain('innovation network');
  expect(text(pages['/home'].description)).toContain('innovation network');
});

it('Demo Day names venture investors and VCs in its title and description', () => {
  for (const field of [pages['/demoday'].title, pages['/demoday'].description]) {
    expect(text(field)).toContain('venture investors');
    expect(text(field)).toContain('VC');
  }
});

it('no two pages share a title or a description', () => {
  const titles = Object.values(pages).map((m) => text(m.title));
  const descriptions = Object.values(pages).map((m) => text(m.description));
  expect(new Set(titles).size).toBe(titles.length);
  expect(new Set(descriptions).size).toBe(descriptions.length);
});

it.each(['/home', '/members', '/teams', '/projects', '/events/all', '/jobs', '/demoday'])(
  '%s share cards say the same as its search result',
  (path) => {
    const page = pages[path];
    expect(page.openGraph?.title).toBe(page.title);
    expect(page.openGraph?.description).toBe(page.description);
    expect(page.twitter?.title).toBe(page.title);
    expect(page.twitter?.description).toBe(page.description);
  },
);

it('the job board keeps its LAB-2889 title', () => {
  expect(pages['/jobs'].title).toBe('Protocol Labs Jobs | LabOS');
});
