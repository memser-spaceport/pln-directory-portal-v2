/**
 * @jest-environment node
 */
/**
 * LAB-2923: team and project profiles describe themselves in their own words, not with one shared template. Google
 * shows the description under the title, and a page whose description matches thousands of others reads as thin.
 */
jest.mock('next/navigation', () => ({
  notFound: jest.fn(),
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
  getAllTeams: jest.fn(),
  getTeamUIDByAirtableId: jest.fn(),
}));
const mockGetProject = jest.fn();
jest.mock('@/services/projects.service', () => ({
  getProject: (...args: unknown[]) => mockGetProject(...args),
  getProjectOsoDetails: jest.fn(),
}));
jest.mock('@/services/members.service', () => ({ getMembers: jest.fn() }));
jest.mock('@/services/common.service', () => ({ getFocusAreas: jest.fn() }));
jest.mock('@/services/team-news/team-news.service', () => ({ fetchTeamNewsByTeam: jest.fn() }));
jest.mock('@/services/follow/follow.service', () => ({ getTeamFollowers: jest.fn() }));
jest.mock('@/app/actions/jobs.actions', () => ({ getJobsList: jest.fn() }));

import { generateMetadata as teamMetadata } from '@/app/teams/[id]/page';
import { generateMetadata as projectMetadata } from '@/app/projects/[id]/page';

const props = { params: Promise.resolve({ id: 'uid-1' }), searchParams: Promise.resolve({}) };
const parent = Promise.resolve({ openGraph: { images: [] } }) as never;
const team = (fields: Record<string, unknown>) => ({ data: { formatedData: { name: 'Lab Team', ...fields } } });
const project = (fields: Record<string, unknown>) => ({ data: { formattedData: { name: 'Lab Tool', ...fields } } });

describe('team profile description', () => {
  it('is the short description, as plain text, on the page and its share cards', async () => {
    mockGetTeam.mockResolvedValue(team({ shortDescription: '<p>Builds open <b>labs</b>.</p>', longDescription: 'x' }));

    const metadata = await teamMetadata(props, parent);

    expect(metadata.description).toBe('Builds open labs.');
    expect(metadata.openGraph?.description).toBe('Builds open labs.');
    expect(metadata.twitter?.description).toBe('Builds open labs.');
  });

  it('falls back to the long description, then to the template', async () => {
    mockGetTeam.mockResolvedValue(team({ shortDescription: '', longDescription: '<p>A longer story.</p>' }));
    expect((await teamMetadata(props, parent)).description).toBe('A longer story.');

    mockGetTeam.mockResolvedValue(team({}));
    expect((await teamMetadata(props, parent)).description).toBe('Lab Team on Protocol Labs Directory');
  });
});

describe('project profile description', () => {
  it('is the tagline, then the description, then the template', async () => {
    mockGetProject.mockResolvedValue(project({ tagline: 'Maps permissions.', description: '<p>Long.</p>' }));
    expect((await projectMetadata(props, parent)).description).toBe('Maps permissions.');

    mockGetProject.mockResolvedValue(project({ tagline: '', description: '<p>Generates permission graphs.</p>' }));
    expect((await projectMetadata(props, parent)).description).toBe('Generates permission graphs.');

    mockGetProject.mockResolvedValue(project({ tagline: '', description: '' }));
    expect((await projectMetadata(props, parent)).description).toBe('Lab Tool on Protocol Labs Directory');
  });
});
