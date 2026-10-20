/**
 * @jest-environment node
 */
/**
 * LAB-2922: a team or project profile answers "not found" only when the API says the id is unknown. Any other failure
 * (an outage, a thrown fetch) keeps the error page, so Google retries instead of dropping a live profile.
 *
 * The route layouts make the check: the pages render inside `loading.tsx`'s boundary, after the 200 has been streamed,
 * so only a layout's `notFound()` becomes a real 404 status. The pages keep their own check for the not-found UI.
 */
const mockNotFound = jest.fn(() => {
  throw new Error('NEXT_NOT_FOUND');
});
jest.mock('next/navigation', () => ({
  notFound: () => mockNotFound(),
  redirect: jest.fn(),
  RedirectType: { replace: 'replace' },
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), refresh: jest.fn() }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}));

jest.mock('@/utils/next-helpers', () => ({
  getCookiesFromHeaders: async () => ({ userInfo: {}, isLoggedIn: false, authToken: '' }),
}));

const mockGetTeam = jest.fn();
jest.mock('@/services/teams.service', () => ({
  getTeam: (...args: unknown[]) => mockGetTeam(...args),
  getAllTeams: jest.fn().mockResolvedValue({ data: { formattedData: [] } }),
  getTeamUIDByAirtableId: jest.fn().mockResolvedValue([{ uid: 'team-uid' }]),
}));
const mockGetProject = jest.fn();
jest.mock('@/services/projects.service', () => ({
  getProject: (...args: unknown[]) => mockGetProject(...args),
  getProjectOsoDetails: jest.fn().mockResolvedValue({ data: {} }),
}));
jest.mock('@/services/members.service', () => ({
  getMembers: jest.fn().mockResolvedValue({ data: { formattedData: [] } }),
}));
jest.mock('@/services/common.service', () => ({ getFocusAreas: jest.fn().mockResolvedValue({ data: [] }) }));
jest.mock('@/services/team-news/team-news.service', () => ({ fetchTeamNewsByTeam: jest.fn().mockResolvedValue(null) }));
jest.mock('@/services/follow/follow.service', () => ({ getTeamFollowers: jest.fn().mockResolvedValue(null) }));
jest.mock('@/app/actions/jobs.actions', () => ({ getJobsList: jest.fn().mockResolvedValue({ isError: true }) }));

import ErrorPage from '@/components/core/error';
import TeamPage, { generateMetadata as teamMetadata } from '@/app/teams/[id]/page';
import TeamLayout from '@/app/teams/[id]/layout';
import ProjectPage, { generateMetadata as projectMetadata } from '@/app/projects/[id]/page';
import ProjectLayout from '@/app/projects/[id]/layout';

const props = { params: Promise.resolve({ id: 'doesnotexist' }), searchParams: Promise.resolve({}) };
const layoutProps = { params: Promise.resolve({ id: 'doesnotexist' }), children: 'profile' };
const parent = Promise.resolve({ openGraph: { images: [] } }) as never;

type AsyncComponent = (p: unknown) => Promise<unknown>;

beforeEach(() => {
  mockNotFound.mockClear();
  mockGetTeam.mockReset();
  mockGetProject.mockReset();
});

describe.each([
  ['team', TeamPage as AsyncComponent, TeamLayout as AsyncComponent, teamMetadata, mockGetTeam],
  ['project', ProjectPage as AsyncComponent, ProjectLayout as AsyncComponent, projectMetadata, mockGetProject],
])('%s profile', (_name, Page, Layout, metadata, lookup) => {
  it('answers not found from the layout and the page when the API says 404', async () => {
    lookup.mockResolvedValue({ error: { status: 404, statusText: 'Not Found' } });

    await expect(Layout(layoutProps)).rejects.toThrow('NEXT_NOT_FOUND');
    await expect(Page(props)).rejects.toThrow('NEXT_NOT_FOUND');
  });

  it('keeps the error page for an outage', async () => {
    lookup.mockResolvedValue({ error: { status: 503, statusText: 'Service Unavailable' } });

    await expect(Layout(layoutProps)).resolves.toBe('profile');
    expect(((await Page(props)) as { type: unknown }).type).toBe(ErrorPage);
    await expect(metadata(props, parent)).resolves.toMatchObject({ title: 'Protocol Labs Directory' });
    expect(mockNotFound).not.toHaveBeenCalled();
  });

  it('keeps the error page when the lookup throws', async () => {
    lookup.mockRejectedValue(new TypeError('fetch failed'));

    expect(((await Page(props)) as { type: unknown }).type).toBe(ErrorPage);
    expect(mockNotFound).not.toHaveBeenCalled();
  });
});

it('never answers not found for an old Airtable team id, which the page redirects', async () => {
  mockGetTeam.mockResolvedValue({ error: { status: 404, statusText: 'Not Found' } });

  await expect(
    (TeamLayout as AsyncComponent)({ ...layoutProps, params: Promise.resolve({ id: 'recAbCdEfGhIjKlMn' }) }),
  ).resolves.toBe('profile');
  expect(mockNotFound).not.toHaveBeenCalled();
});
