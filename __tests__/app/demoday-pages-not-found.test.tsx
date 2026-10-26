/**
 * @jest-environment node
 */
/**
 * LAB-2930: a Demo Day slug the API doesn't know used to render the loading skeleton forever, as an indexable 200 under
 * its own canonical address. Both public Demo Day pages now answer it with a 404. Only the API's 404 means that: any
 * other failure keeps the page as it was, so an outage never tells crawlers a live Demo Day is gone.
 *
 * No `loading.tsx` wraps these routes, so the page's own `notFound()` is still a real 404 status.
 */
const mockNotFound = jest.fn(() => {
  throw new Error('NEXT_NOT_FOUND');
});
const mockRedirect = jest.fn((url: string) => {
  throw new Error(`NEXT_REDIRECT ${url}`);
});
jest.mock('next/navigation', () => ({
  notFound: () => mockNotFound(),
  redirect: (url: string) => mockRedirect(url),
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), refresh: jest.fn() }),
  useParams: () => ({}),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}));

jest.mock('@/utils/next-helpers', () => ({
  getCookiesFromHeaders: async () => ({ userInfo: {}, isLoggedIn: false, authToken: '' }),
}));

const mockGetDemoDayState = jest.fn();
jest.mock('@/app/actions/demo-day.actions', () => ({
  getDemoDayState: (...args: unknown[]) => mockGetDemoDayState(...args),
  getMemberInfo: jest.fn(),
}));

import DemoDayLandingPage from '@/app/demoday/[demoDayId]/page';
import CompletedPage from '@/app/demoday/[demoDayId]/completed/page';

const props = { params: Promise.resolve({ demoDayId: 'not-a-demo-day' }) };

beforeEach(() => {
  mockNotFound.mockClear();
  mockRedirect.mockClear();
  mockGetDemoDayState.mockReset();
});

describe.each([
  ['the landing page', DemoDayLandingPage],
  ['the completed view', CompletedPage],
])('%s', (_name, Page) => {
  it('answers 404 when the API does not know the Demo Day', async () => {
    mockGetDemoDayState.mockResolvedValue({ isError: true, status: 404, message: 'Not Found' });

    await expect(Page(props)).rejects.toThrow('NEXT_NOT_FOUND');
  });

  it('keeps the page when the API fails for any other reason', async () => {
    mockGetDemoDayState.mockResolvedValue({ isError: true, status: 500, message: 'Internal Server Error' });

    await Page(props).catch(() => undefined);

    expect(mockNotFound).not.toHaveBeenCalled();
  });
});

it('still renders the landing page when the API call throws', async () => {
  mockGetDemoDayState.mockRejectedValue(new Error('fetch failed'));

  await expect(DemoDayLandingPage(props)).resolves.toBeTruthy();
  expect(mockNotFound).not.toHaveBeenCalled();
});

it('still sends an unfinished Demo Day from its completed view to its landing page', async () => {
  mockGetDemoDayState.mockResolvedValue({ data: { status: 'ACTIVE' } });

  await expect(CompletedPage(props)).rejects.toThrow('NEXT_REDIRECT /demoday/not-a-demo-day');
  expect(mockNotFound).not.toHaveBeenCalled();
});
