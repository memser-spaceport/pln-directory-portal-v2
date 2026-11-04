import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

import Home from '@/app/home/page';
import { getCookiesFromHeaders } from '@/utils/next-helpers';
import {
  getTeamNewsGroupedByFocusArea,
  getTeamNewsItemByUid,
  getTeamNewsPopular,
} from '@/services/team-news/team-news.service';
import { getJobsList } from '@/app/actions/jobs.actions';
import { getUpcomingEvents } from '@/services/events/events.service';
import { getPortfolioTeams } from '@/services/explore-pl-network/portfolio.service';
import { getFocusAreas } from '@/services/common.service';
import { getFeaturedData } from '@/services/featured.service';
import { getDiscoverData } from '@/services/discovery.service';
import { getTeamList } from '@/app/actions/teams.actions';
import { PORTFOLIO_FALLBACK } from '@/components/page/explore-pl-network/data/portfolio';
import type { ITeamNewsItem } from '@/types/team-news.types';

// Build-time flag: mocked as a module (Turbopack inlines process.env), switchable per test.
let mockShowHomeV2 = false;
jest.mock('@/utils/home-v2', () => ({
  get SHOW_HOME_V2() {
    return mockShowHomeV2;
  },
}));

jest.mock('@/utils/next-helpers', () => ({ getCookiesFromHeaders: jest.fn() }));
jest.mock('@/services/team-news/team-news.service', () => ({
  getTeamNewsGroupedByFocusArea: jest.fn(),
  getTeamNewsItemByUid: jest.fn(),
  getTeamNewsPopular: jest.fn(),
}));
jest.mock('@/app/actions/jobs.actions', () => ({ getJobsList: jest.fn() }));
jest.mock('@/services/events/events.service', () => ({ getUpcomingEvents: jest.fn() }));
jest.mock('@/services/explore-pl-network/portfolio.service', () => ({ getPortfolioTeams: jest.fn() }));
jest.mock('@/services/focus-areas/project-focus-area-counts.service', () => ({
  getProjectFocusAreaCounts: jest.fn().mockResolvedValue(null),
}));
jest.mock('@/services/common.service', () => ({ getFocusAreas: jest.fn() }));
jest.mock('@/services/featured.service', () => ({ getFeaturedData: jest.fn() }));
jest.mock('@/services/discovery.service', () => ({ getDiscoverData: jest.fn() }));
jest.mock('@/app/actions/teams.actions', () => ({ getTeamList: jest.fn() }));

// The previous Home's sections, as markers.
jest.mock('@/components/page/home/Welcome', () => ({ Welcome: () => <div>Welcome card</div> }));
jest.mock('@/components/page/home/TeamNews', () => ({
  TeamNews: () => <div>Team news feed</div>,
  AutoMarkNewsNotification: () => null,
  MarkHomeVisited: () => null,
}));
jest.mock('@/components/page/home/FocusAreaSection', () => ({ FocusAreaSection: () => <div>Focus area section</div> }));
jest.mock('@/components/page/home/QuickActions', () => ({ QuickActions: () => <div>Quick actions</div> }));
jest.mock('@/components/page/home/husky-dialog', () => () => null);
jest.mock('@/components/page/home/husky-discover', () => () => null);
jest.mock('@/components/page/home/featured/scroll-to-top', () => () => null);
jest.mock('@/components/page/home/DigestEmailHomeLinkCapture', () => ({ DigestEmailHomeLinkCapture: () => null }));
jest.mock(
  '@/components/core/error',
  () =>
    function MockError() {
      return <div>Error page</div>;
    },
);

// What the new page's client pieces reach for.
jest.mock('next/font/local', () => () => ({ className: 'aileron', variable: 'aileron-var' }));
jest.mock('@/analytics/home.analytics', () => ({ useHomeAnalytics: () => new Proxy({}, { get: () => jest.fn() }) }));
jest.mock('@/analytics/auth.analytics', () => ({ useAuthAnalytics: () => new Proxy({}, { get: () => jest.fn() }) }));
jest.mock('@/components/core/login/components/PrivyLayer/prefetch', () => ({ prefetchPrivyLayer: jest.fn() }));
jest.mock('@/services/feed/hooks/useFeedCommentCounts', () => ({ useFeedCommentCounts: () => ({ data: {} }) }));
jest.mock('@/components/page/home/TeamNews/components/NewsDetailModal', () => ({ NewsDetailModal: () => null }));
// The signed-in page is a client tree with its own tests (signed-in-home.test.tsx); here it is a marker that keeps
// what the page hands it.
const mockSignedInHome = jest.fn();
jest.mock('@/components/page/home/HomeV2/SignedInHome', () => ({
  SignedInHome: (props: unknown) => {
    mockSignedInHome(props);
    return <div>Signed-in home</div>;
  },
}));

const MISSION = 'Protocol Labs drives breakthroughs in computing to push humanity forward.';

const story = (uid: string, overrides: Partial<ITeamNewsItem> = {}): ITeamNewsItem => ({
  uid,
  teamUid: `team-${uid}`,
  teamName: `Team ${uid}`,
  teamLogoUrl: null,
  eventType: 'LAUNCH',
  eventDate: '2026-11-01T12:00:00.000Z',
  title: `Headline ${uid}`,
  summary: null,
  sourceUrl: `https://example.com/${uid}`,
  sourceDomain: null,
  tags: [],
  focusAreas: [],
  subFocusAreas: [],
  createdAt: '2026-11-01T12:00:00.000Z',
  discussion: { count: 0, latestTopicUrl: null },
  ...overrides,
});

const soon = (days: number) => new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();

const signedOut = () =>
  (getCookiesFromHeaders as jest.Mock).mockResolvedValue({ isLoggedIn: false, userInfo: null, authToken: '' });

const signedIn = () =>
  (getCookiesFromHeaders as jest.Mock).mockResolvedValue({
    isLoggedIn: true,
    userInfo: { uid: 'u1', name: 'Member' },
    authToken: 'token',
  });

const fetchedUrls = () => (global.fetch as jest.Mock).mock.calls.map(([url]) => String(url));

const renderHome = async (searchParams: { news?: string } = {}) =>
  render(await Home({ searchParams: Promise.resolve(searchParams) }));

beforeEach(() => {
  jest.clearAllMocks();
  mockShowHomeV2 = false;
  signedOut();
  global.fetch = jest.fn().mockResolvedValue({ ok: false, json: async () => null });

  (getTeamNewsGroupedByFocusArea as jest.Mock).mockResolvedValue({
    windowDays: 14,
    generatedAt: '2026-11-04T00:00:00.000Z',
    groups: [
      {
        focusArea: { uid: 'fa', title: 'AI & Robotics' },
        total: 4,
        items: [
          story('ranked', { editorialRank: 1, eventDate: '2026-10-28T12:00:00.000Z' }),
          story('newest', { eventDate: '2026-11-03T12:00:00.000Z' }),
          story('newer', { eventDate: '2026-11-02T12:00:00.000Z' }),
          story('oldest', { eventDate: '2026-10-20T12:00:00.000Z' }),
        ],
      },
    ],
  });
  (getTeamNewsPopular as jest.Mock).mockResolvedValue({ items: [] });
  (getJobsList as jest.Mock).mockResolvedValue({
    data: {
      groups: [
        {
          team: { uid: 't1', name: 'Hiring Co', logoUrl: null, focusAreas: [], subFocusAreas: [] },
          totalRoles: 1,
          roles: [
            {
              uid: 'r1',
              roleTitle: 'Protocol Engineer',
              roleCategory: null,
              seniority: null,
              location: ['Remote'],
              workMode: null,
              applyUrl: 'https://jobs.example.com/r1',
              lastUpdated: '2026-11-01T00:00:00.000Z',
              postedDate: '2026-11-01T00:00:00.000Z',
              detectionDate: null,
            },
          ],
        },
      ],
      page: 1,
      limit: 50,
      total: 1,
      totalGroups: 1,
      totalRoles: 171,
    },
  });
  (getUpcomingEvents as jest.Mock).mockResolvedValue({
    events: [
      { uid: 'e45', name: 'Too far out', startDate: soon(45), endDate: soon(45), location: 'Tokyo' },
      { uid: 'e3', name: 'Founders Dinner', startDate: soon(3), endDate: soon(3), location: 'Berlin' },
    ],
    total: 2,
  });
  (getPortfolioTeams as jest.Mock).mockResolvedValue([]);
  (getFocusAreas as jest.Mock).mockResolvedValue({ data: [] });
  (getFeaturedData as jest.Mock).mockResolvedValue({ data: [] });
  (getDiscoverData as jest.Mock).mockResolvedValue({ data: [] });
  (getTeamList as jest.Mock).mockResolvedValue({ totalItems: 1185 });
});

describe('/home with the new Home flag off', () => {
  it('renders the previous Home for a signed-out visitor', async () => {
    await renderHome();

    expect(screen.getByText('Welcome card')).toBeInTheDocument();
    expect(screen.getByText('Team news feed')).toBeInTheDocument();
    expect(screen.getByText('Focus area section')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1, name: 'Protocol Labs Directory' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'About Protocol Labs Directory' })).toBeInTheDocument();
    expect(screen.queryByText(MISSION)).not.toBeInTheDocument();
    expect(getFeaturedData).toHaveBeenCalled();
    expect(getJobsList).not.toHaveBeenCalled();
  });

  it('renders the previous Home for a signed-in member, Quick Actions and its access call included', async () => {
    signedIn();

    await renderHome();

    expect(screen.getByText('Quick actions')).toBeInTheDocument();
    expect(screen.getByText('Team news feed')).toBeInTheDocument();
    expect(screen.getByText('Focus area section')).toBeInTheDocument();
    expect(screen.queryByText('Signed-in home')).not.toBeInTheDocument();
    expect(fetchedUrls().some((url) => url.includes('/me/access'))).toBe(true);
    expect(getJobsList).not.toHaveBeenCalled();
    expect(mockSignedInHome).not.toHaveBeenCalled();
  });
});

describe('/home with the new Home flag on', () => {
  beforeEach(() => {
    mockShowHomeV2 = true;
  });

  it('gives a signed-in member the member page, with no Quick Actions and none of the previous sections', async () => {
    signedIn();

    await renderHome();

    expect(screen.getByText('Signed-in home')).toBeInTheDocument();
    expect(screen.queryByText('Quick actions')).not.toBeInTheDocument();
    expect(screen.queryByText('Team news feed')).not.toBeInTheDocument();
    expect(screen.queryByText('Focus area section')).not.toBeInTheDocument();
    expect(screen.queryByText(MISSION)).not.toBeInTheDocument();
    // HomeIntro's hidden heading stays the page's one h1.
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
  });

  it("fetches the feed's server data and the rail's, but no /me/access, featured or discover data", async () => {
    signedIn();
    (getTeamNewsGroupedByFocusArea as jest.Mock).mockResolvedValue({
      groups: [{ focusArea: { uid: 'fa', title: 'AI & Robotics' }, total: 1, items: [story('s1')] }],
      allTabExtraItems: [story('extra')],
      forYouTeamUids: ['team-s1'],
    });
    (getTeamNewsPopular as jest.Mock).mockResolvedValue({
      items: [{ uid: 'p1', title: 'Popular', teamUid: 't', teamName: 'T', sourceUrl: 'https://x', upvoteCount: 2 }],
    });
    (getTeamNewsItemByUid as jest.Mock).mockResolvedValue(story('linked'));

    await renderHome({ news: 'linked' });

    expect(getTeamNewsGroupedByFocusArea).toHaveBeenCalledWith({}, 'token');
    expect(getTeamNewsPopular).toHaveBeenCalledWith(undefined, 'token');
    expect(getTeamNewsItemByUid).toHaveBeenCalledWith('linked');
    expect(getJobsList).toHaveBeenCalledWith('sort=newest');
    expect(getUpcomingEvents).toHaveBeenCalledWith({ days: 30, limit: 3 });
    expect(getPortfolioTeams).toHaveBeenCalled();
    expect(fetchedUrls().some((url) => url.includes('/me/access'))).toBe(false);
    expect(fetchedUrls().some((url) => url.includes('/v1/notification/settings/u1/forum'))).toBe(true);
    expect(getFeaturedData).not.toHaveBeenCalled();
    expect(getDiscoverData).not.toHaveBeenCalled();
    expect(getFocusAreas).not.toHaveBeenCalled();

    const props = mockSignedInHome.mock.calls[0][0];
    expect(props.feed.groups[0].items.map((i: ITeamNewsItem) => i.uid)).toEqual(['s1']);
    expect(props.feed.allTabExtraItems.map((i: ITeamNewsItem) => i.uid)).toEqual(['extra']);
    expect(props.feed.forYouTeamUids).toEqual(['team-s1']);
    expect(props.feed.popularItems.map((i: { uid: string }) => i.uid)).toEqual(['p1']);
    expect(props.feed.deepLinkedItem.uid).toBe('linked');
    expect(props.roles.total).toBe(171);
    expect(props.events.events.map((e: { uid: string }) => e.uid)).toEqual(['e3']);
    expect(props.portfolio).toHaveLength(PORTFOLIO_FALLBACK.length);
    // The page's user info stays on the server.
    expect(props).not.toHaveProperty('userInfo');
  });

  it('still renders the member page when the news call fails', async () => {
    signedIn();
    (getTeamNewsGroupedByFocusArea as jest.Mock).mockRejectedValue(new Error('down'));

    await renderHome();

    expect(screen.getByText('Signed-in home')).toBeInTheDocument();
    expect(screen.queryByText('Error page')).not.toBeInTheDocument();
    expect(mockSignedInHome.mock.calls[0][0].feed.groups).toEqual([]);
  });

  it('gives a signed-out visitor the story, with the mission as the only h1 and no About foot', async () => {
    const { container } = await renderHome();

    const h1s = screen.getAllByRole('heading', { level: 1 });
    expect(h1s).toHaveLength(1);
    expect(h1s[0]).toHaveTextContent(MISSION);
    expect(screen.queryByText('Welcome card')).not.toBeInTheDocument();
    expect(screen.queryByText('Team news feed')).not.toBeInTheDocument();
    expect(screen.queryByText('Focus area section')).not.toBeInTheDocument();
    expect(screen.queryByText(/About Protocol Labs Directory/)).not.toBeInTheDocument();

    const jsonLd = container.querySelector('script[type="application/ld+json"]');
    expect(jsonLd?.innerHTML).toContain('"Organization"');
    expect(jsonLd?.innerHTML).toContain('"WebSite"');
  });

  it('fetches only what the story needs', async () => {
    await renderHome();

    expect(getFeaturedData).not.toHaveBeenCalled();
    expect(getDiscoverData).not.toHaveBeenCalled();
    expect(getFocusAreas).not.toHaveBeenCalled();
    expect(getJobsList).toHaveBeenCalledWith('sort=newest');
    expect(getUpcomingEvents).toHaveBeenCalledWith({ days: 30, limit: 3 });
  });

  it('shows the editorial pick, then the newest stories', async () => {
    await renderHome();

    const titles = screen.getAllByRole('heading', { level: 3, name: /^Headline/ }).map((h) => h.textContent);
    expect(titles).toEqual(['Headline ranked', 'Headline newest', 'Headline newer']);
  });

  it('lists roles and only the events that start in the next 30 days', async () => {
    await renderHome();

    expect(screen.getByRole('link', { name: 'Protocol Engineer' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'See all 171 jobs' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Founders Dinner' })).toBeInTheDocument();
    expect(screen.queryByText('Too far out')).not.toBeInTheDocument();
  });

  it('drops only the roles when the job board call fails', async () => {
    (getJobsList as jest.Mock).mockResolvedValue({ isError: true, status: 500 });

    await renderHome();

    expect(screen.queryByRole('region', { name: 'Open roles in the network' })).not.toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Upcoming events' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(MISSION);
  });

  it('drops only the events when the events call fails', async () => {
    (getUpcomingEvents as jest.Mock).mockRejectedValue(new Error('down'));

    await renderHome();

    expect(screen.queryByRole('region', { name: 'Upcoming events' })).not.toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Open roles in the network' })).toBeInTheDocument();
    expect(screen.queryByText('Error page')).not.toBeInTheDocument();
  });

  it('draws the map from the fallback file when the portfolio call fails', async () => {
    (getPortfolioTeams as jest.Mock).mockRejectedValue(new Error('down'));

    await renderHome();

    expect(
      screen.getByText(`${PORTFOLIO_FALLBACK.length} teams across four focus areas, with Protocol Labs at the centre.`),
    ).toBeInTheDocument();
  });

  it('still renders when the news call fails', async () => {
    (getTeamNewsGroupedByFocusArea as jest.Mock).mockRejectedValue(new Error('down'));

    await renderHome();

    expect(screen.getByRole('heading', { name: 'This week in the network' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { level: 3, name: /^Headline/ })).not.toBeInTheDocument();
  });
});
