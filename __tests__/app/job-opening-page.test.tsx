/**
 * LAB-2887: a role page is "not found" only when the backend says the role is gone. Any other failure throws
 * (Next answers 500, Google retries) instead of a 404 with noindex that tells Google to drop a live role.
 */
const mockNotFound = jest.fn(() => {
  throw new Error('NEXT_NOT_FOUND');
});
jest.mock('next/navigation', () => ({ notFound: () => mockNotFound() }));

const mockGetJobOpening = jest.fn();
jest.mock('@/app/actions/jobs.actions', () => ({ getJobOpening: (uid: string) => mockGetJobOpening(uid) }));
jest.mock('@/utils/next-helpers', () => ({
  getCookiesFromHeaders: async () => ({ userInfo: null, isLoggedIn: false }),
}));
jest.mock('@/components/page/jobs/JobOpeningView/JobOpeningView', () => ({ JobOpeningView: () => null }));

import { render } from '@testing-library/react';
import JobOpeningPage, { generateMetadata } from '@/app/jobs/openings/[uid]/page';

const params = Promise.resolve({ uid: 'role-1' });
const parent = Promise.resolve({ openGraph: { images: [] } }) as never;

const ROLE_GROUP = {
  team: { uid: 'team-1', name: 'Acme', logoUrl: null },
  roles: [
    {
      uid: 'role-1',
      roleTitle: 'Engineer',
      descriptionHtml: '<p>Build </script><script>alert(1)</script> things</p>',
      location: [],
      workMode: 'Remote',
      postedDate: '2026-10-01T00:00:00.000Z',
      detectionDate: null,
      lastUpdated: null,
      pay: null,
    },
  ],
};

beforeEach(() => {
  mockNotFound.mockClear();
  mockGetJobOpening.mockReset();
});

describe('a role the backend says is gone', () => {
  it.each([400, 404, 410])('answers not found with noindex for a backend %i', async (status) => {
    mockGetJobOpening.mockResolvedValue({ isError: true, status });

    await expect(JobOpeningPage({ params })).rejects.toThrow('NEXT_NOT_FOUND');
    expect(await generateMetadata({ params }, parent)).toMatchObject({ robots: { index: false, follow: false } });
  });

  it('answers not found when the backend returns the team with no role', async () => {
    mockGetJobOpening.mockResolvedValue({ data: { ...ROLE_GROUP, roles: [] } });

    await expect(JobOpeningPage({ params })).rejects.toThrow('NEXT_NOT_FOUND');
  });
});

describe('a backend failure', () => {
  it.each([
    ['a 500', { isError: true, status: 500 }],
    ['a 429', { isError: true, status: 429 }],
    ['a network error', { isError: true }],
  ])('throws on %s instead of answering not found', async (_label, result) => {
    mockGetJobOpening.mockResolvedValue(result);

    await expect(JobOpeningPage({ params })).rejects.toThrow(/could not be loaded/);
    await expect(generateMetadata({ params }, parent)).rejects.toThrow(/could not be loaded/);
    expect(mockNotFound).not.toHaveBeenCalled();
  });
});

describe('a live role', () => {
  it('is indexable and its JSON-LD cannot close the script tag', async () => {
    mockGetJobOpening.mockResolvedValue({ data: ROLE_GROUP });

    const metadata = await generateMetadata({ params }, parent);
    expect(metadata.robots).toBeUndefined();
    // LAB-2889: the title names "Protocol Labs Jobs", in the page title and its Open Graph card alike.
    expect(metadata.title).toBe('Engineer at Acme | Protocol Labs Jobs');
    expect(metadata.openGraph?.title).toBe('Engineer at Acme | Protocol Labs Jobs');

    const { container } = render(await JobOpeningPage({ params }));
    const script = container.querySelector('script[type="application/ld+json"]')?.innerHTML ?? '';
    expect(script).not.toContain('<');
    // The description's tags arrive escaped; the sanitizer already drops the injected script itself.
    expect(script).toContain('\\u003cp>');
    expect(JSON.parse(script)).toMatchObject({ '@type': 'JobPosting', title: 'Engineer' });
  });
});
