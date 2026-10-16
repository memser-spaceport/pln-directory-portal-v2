/**
 * LAB-2888: the board's server page fetches page 1 for the URL's filters the way the browser does, so the
 * server HTML carries the list and a link to every role.
 */
const mockGetJobsList = jest.fn();
jest.mock('@/app/actions/jobs.actions', () => ({ getJobsList: (...args: unknown[]) => mockGetJobsList(...args) }));
jest.mock('@/utils/next-helpers', () => ({
  getCookiesFromHeaders: async () => ({ userInfo: { uid: 'u1' }, isLoggedIn: true, authToken: 'token-1' }),
}));
const mockJobsContent = jest.fn((_props: unknown) => null);
jest.mock('@/app/jobs/(jobs-page)/@content/JobsContent', () => ({
  __esModule: true,
  default: (props: unknown) => mockJobsContent(props),
}));
jest.mock('@/services/jobs/getJobByUid', () => ({ getJobByUid: jest.fn() }));

import Page from '@/app/jobs/(jobs-page)/@content/page';

const LIST = { page: 1, limit: 50, total: 1, totalGroups: 1, totalRoles: 3, groups: [] };

const renderPage = async (searchParams: Record<string, string | string[]>) => {
  const element = await Page({ searchParams: Promise.resolve(searchParams) });
  return (element as { props: Record<string, unknown> }).props;
};

beforeEach(() => mockGetJobsList.mockReset());

it('fetches page 1 with the viewer token and the API mapping, keyed like the browser', async () => {
  mockGetJobsList.mockResolvedValue({ data: LIST });

  const props = await renderPage({ roleCategory: 'Engineering|Design', workplaceType: 'remote', utm_source: 'x' });

  const [query, token] = mockGetJobsList.mock.calls[0];
  const api = new URLSearchParams(query);
  expect(api.getAll('roleCategory')).toEqual(['Engineering', 'Design']);
  expect(api.getAll('workMode')).toEqual(['remote', 'distributed']);
  expect(api.get('page')).toBe('1');
  expect(api.has('utm_source')).toBe(false);
  expect(token).toBe('token-1');
  expect(props.serverPage).toEqual({
    key: 'roleCategory=Engineering&roleCategory=Design&workplaceType=remote',
    page: LIST,
  });
});

/* The hydrating render can't see the session either, so both leave the saved scope out and agree. */
it('leaves the saved scope out even for a signed-in viewer', async () => {
  mockGetJobsList.mockResolvedValue({ data: LIST });

  const props = await renderPage({ saved: 'true', q: 'rust' });

  expect(new URLSearchParams(mockGetJobsList.mock.calls[0][0]).has('saved')).toBe(false);
  expect((props.serverPage as { key: string }).key).toBe('q=rust');
});

it('passes nothing when the fetch fails, so the board loads in the browser as before', async () => {
  mockGetJobsList.mockResolvedValue({ isError: true, status: 500 });

  const props = await renderPage({});

  expect(props.serverPage).toBeUndefined();
  expect(props.isLoggedIn).toBe(true);
});
