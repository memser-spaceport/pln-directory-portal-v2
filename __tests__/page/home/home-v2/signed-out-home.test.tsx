import React from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';

import { SignedOutHome } from '@/components/page/home/HomeV2';
import { PORTFOLIO_FALLBACK } from '@/components/page/explore-pl-network/data/portfolio';
import { mergePortfolio } from '@/components/page/explore-pl-network/data/mergePortfolio';
import type { IHomeEvents, IHomeRoles } from '@/types/home.types';
import type { ITeamNewsItem } from '@/types/team-news.types';

jest.mock('next/font/local', () => () => ({ className: 'aileron', variable: 'aileron-var' }));

const mockRouter = { push: jest.fn(), replace: jest.fn(), refresh: jest.fn(), prefetch: jest.fn() };
jest.mock('next/navigation', () => ({
  useRouter: () => mockRouter,
  usePathname: () => '/home',
  // Next keeps useSearchParams in step with history.replaceState, which the story modal writes ?news= with.
  useSearchParams: () => new URLSearchParams(window.location.search),
}));

const mockHome = {
  onAuthDoorClicked: jest.fn(),
  onNewsPickClicked: jest.fn(),
  onRoleClicked: jest.fn(),
  onEventClicked: jest.fn(),
  onFocusAreaClicked: jest.fn(),
  onSeeAllClicked: jest.fn(),
};
jest.mock('@/analytics/home.analytics', () => ({ useHomeAnalytics: () => mockHome }));
const mockAuth: Record<string, jest.Mock> = {};
jest.mock('@/analytics/auth.analytics', () => ({
  useAuthAnalytics: () => new Proxy(mockAuth, { get: (target, key: string) => (target[key] ??= jest.fn()) }),
}));

const mockPrefetchPrivy = jest.fn();
jest.mock('@/components/core/login/components/PrivyLayer/prefetch', () => ({
  prefetchPrivyLayer: () => mockPrefetchPrivy(),
}));

const mockGoToLogin = jest.fn();
jest.mock('@/components/core/login/utils', () => ({
  ...jest.requireActual('@/components/core/login/utils'),
  useLoginRedirect: () => mockGoToLogin,
}));

jest.mock('@/services/feed/hooks/useFeedCommentCounts', () => ({
  ...jest.requireActual('@/services/feed/hooks/useFeedCommentCounts'),
  useFeedCommentCounts: () => ({ data: { s1: 4 } }),
}));

const mockOpenSupport = jest.fn();
jest.mock('@/services/contact-support/store', () => ({
  useContactSupportStore: (select: (st: unknown) => unknown) => select({ actions: { openModal: mockOpenSupport } }),
}));

// The story modal is the production one; its own suite covers it.
jest.mock('@/components/page/home/TeamNews/components/NewsDetailModal', () => ({
  NewsDetailModal: ({ item }: { item: ITeamNewsItem }) => <div role="dialog" aria-label={item.title} />,
}));

const MISSION = 'Protocol Labs drives breakthroughs in computing to push humanity forward.';

const makeStory = (uid: string, overrides: Partial<ITeamNewsItem> = {}): ITeamNewsItem => ({
  uid,
  teamUid: `team-${uid}`,
  teamName: `Team ${uid}`,
  teamLogoUrl: null,
  eventType: 'LAUNCH',
  eventDate: '2026-11-01T12:00:00.000Z',
  title: `Headline ${uid}`,
  summary: `Summary ${uid}`,
  sourceUrl: `https://example.com/${uid}`,
  sourceDomain: 'example.com',
  tags: [],
  focusAreas: [],
  subFocusAreas: [],
  createdAt: '2026-11-01T12:00:00.000Z',
  discussion: { count: 0, latestTopicUrl: null },
  upvoteCount: 2,
  viewCount: 1204,
  ...overrides,
});

const stories = [makeStory('s1'), makeStory('s2'), makeStory('s3')];

const roles: IHomeRoles = {
  total: 171,
  roles: [1, 2, 3, 4, 5].map((n) => ({
    uid: `r${n}`,
    title: `Role ${n}`,
    location: n === 1 ? 'Berlin' : '',
    applyUrl: n === 5 ? null : `https://jobs.example.com/r${n}`,
    teamUid: `team${n}`,
    teamName: `Hiring team ${n}`,
    teamLogoUrl: null,
  })),
};

const events: IHomeEvents = {
  total: 9,
  events: [
    {
      uid: 'e1',
      name: 'LabWeek Lisbon',
      startDate: '2026-11-03T09:00:00.000Z',
      endDate: '2026-11-07T18:00:00.000Z',
      location: 'Lisbon',
    },
    {
      uid: 'e2',
      name: 'libp2p Day',
      startDate: '2026-11-20T09:00:00.000Z',
      endDate: '2026-11-20T18:00:00.000Z',
      location: 'Berlin',
    },
  ],
};

const portfolio = mergePortfolio(PORTFOLIO_FALLBACK, []);

const renderHome = (props: Partial<React.ComponentProps<typeof SignedOutHome>> = {}) =>
  render(<SignedOutHome stories={stories} roles={roles} events={events} portfolio={portfolio} {...props} />);

const rolesSection = () => screen.queryByRole('region', { name: 'Open roles in the network' });
const eventsSection = () => screen.queryByRole('region', { name: 'Upcoming events' });

beforeEach(() => {
  jest.clearAllMocks();
  window.history.replaceState(null, '', '/');
});

describe('SignedOutHome', () => {
  describe('the hero', () => {
    it('has the mission as the page’s one h1, with one sentence under it', () => {
      renderHome();

      const h1s = screen.getAllByRole('heading', { level: 1 });
      expect(h1s).toHaveLength(1);
      expect(h1s[0]).toHaveTextContent(MISSION);
      expect(
        screen.getByText(/^We are an innovation network that connects over 760 tech startups/),
      ).toBeInTheDocument();
      expect(screen.queryByText(/Organizations collaborate across/)).not.toBeInTheDocument();
    });

    it('offers both doors in the Join the network card', () => {
      renderHome();

      const card = screen.getByRole('complementary', { name: 'Join the network' });
      expect(within(card).getByRole('button', { name: 'Sign up for free' })).toBeInTheDocument();
      expect(within(card).getByRole('button', { name: 'Sign in' })).toBeInTheDocument();
      expect(within(card).getByText('750+ organizations in the network')).toBeInTheDocument();
    });

    it('opens sign-up from Sign up for free and records the hero door', async () => {
      renderHome();

      await userEvent.click(screen.getByRole('button', { name: 'Sign up for free' }));

      expect(mockHome.onAuthDoorClicked).toHaveBeenCalledWith({ door: 'sign_up', section: 'hero' });
      expect(mockRouter.push).toHaveBeenCalledWith(`/sign-up?returnTo=${encodeURIComponent('/')}`);
    });

    it('starts the navbar’s sign-in from Sign in', async () => {
      renderHome();

      await userEvent.hover(screen.getByRole('button', { name: 'Sign in' }));
      expect(mockPrefetchPrivy).toHaveBeenCalled();
      await userEvent.click(screen.getByRole('button', { name: 'Sign in' }));

      expect(mockHome.onAuthDoorClicked).toHaveBeenCalledWith({ door: 'sign_in', section: 'hero' });
      expect(mockAuth.onLoginBtnClicked).toHaveBeenCalled();
      expect(mockGoToLogin).toHaveBeenCalled();
    });
  });

  it('shows the sections in the spec’s order', () => {
    const { container } = renderHome();

    const order = [
      screen.getByRole('heading', { level: 1 }),
      screen.getByText('Network organizations'),
      screen.getByRole('heading', { name: 'This week in the network' }),
      screen.getByRole('heading', { name: 'The portfolio' }),
      screen.getByRole('heading', { name: 'Protocol Labs entities' }),
      container.querySelector('footer')!,
    ];
    for (let i = 1; i < order.length; i += 1) {
      expect(order[i - 1].compareDocumentPosition(order[i]) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    }
  });

  describe('This week', () => {
    it('lists the stories with team, event type, time and title', () => {
      renderHome();

      const list = screen.getByRole('region', { name: 'This week in the network' });
      const rows = within(list).getAllByRole('button', { name: /Headline/ });
      expect(rows).toHaveLength(3);
      expect(within(rows[0]).getByText('Team s1')).toBeInTheDocument();
      expect(within(rows[0]).getByText('Launch')).toBeInTheDocument();
      expect(within(rows[0]).getByText('1.2k Views')).toBeInTheDocument();
      expect(within(rows[0]).getByText('4 Comments')).toBeInTheDocument();
    });

    it('opens the story from its row and records the pick', async () => {
      renderHome();

      await userEvent.click(screen.getByRole('heading', { name: 'Headline s2' }));

      expect(mockHome.onNewsPickClicked).toHaveBeenCalledWith({ news_uid: 's2', position: 2 });
      expect(screen.getByRole('dialog', { name: 'Headline s2' })).toBeInTheDocument();
      expect(window.location.search).toBe('?news=s2');
    });

    it('asks a signed-out visitor to sign up from Follow and Like, without opening the story', async () => {
      renderHome();

      await userEvent.click(screen.getByRole('button', { name: 'Follow Team s1' }));
      await userEvent.click(screen.getAllByRole('button', { name: 'Like (2 likes)' })[0]);

      expect(mockHome.onAuthDoorClicked).toHaveBeenCalledTimes(2);
      expect(mockHome.onAuthDoorClicked).toHaveBeenCalledWith({ door: 'sign_up', section: 'news' });
      expect(mockRouter.push).toHaveBeenCalledTimes(2);
      expect(mockHome.onNewsPickClicked).not.toHaveBeenCalled();
    });

    it('links See all updates to the news view', async () => {
      renderHome();

      const link = screen.getByRole('link', { name: 'See all updates' });
      expect(link).toHaveAttribute('href', '/home?view=news');
      await userEvent.click(link);
      expect(mockHome.onSeeAllClicked).toHaveBeenCalledWith({ section: 'news' });
    });
  });

  describe('the rail', () => {
    it('shows three roles, then the events, with events this month', () => {
      renderHome();

      const rolesEl = rolesSection()!;
      expect(within(rolesEl).getAllByRole('listitem')).toHaveLength(3);
      expect(within(rolesEl).getByRole('link', { name: 'See all 171 jobs' })).toHaveAttribute('href', '/jobs');
      expect(within(rolesEl).getByText('Hiring team 1 · Berlin')).toBeInTheDocument();
      expect(within(rolesEl).getByRole('link', { name: 'Role 1' })).toHaveAttribute(
        'href',
        'https://jobs.example.com/r1?utm_source=os.pl.xyz&utm_medium=home_feed',
      );

      const eventsEl = eventsSection()!;
      expect(rolesEl.compareDocumentPosition(eventsEl) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
      expect(within(eventsEl).getAllByRole('listitem')).toHaveLength(2);
      expect(within(eventsEl).getByText('Nov 3–7 · Lisbon')).toBeInTheDocument();
      expect(within(eventsEl).getByRole('link', { name: 'See all 9 events' })).toHaveAttribute('href', '/events/irl');
    });

    it('drops the events and shows five roles when no event starts this month', () => {
      renderHome({ events: { events: [], total: 0 } });

      expect(eventsSection()).not.toBeInTheDocument();
      expect(within(rolesSection()!).getAllByRole('listitem')).toHaveLength(5);
      // A role without a posting opens the board.
      expect(screen.getByRole('link', { name: 'Role 5' })).toHaveAttribute('href', '/jobs');
    });

    it('drops only the roles when the roles call failed', () => {
      renderHome({ roles: null });

      expect(rolesSection()).not.toBeInTheDocument();
      expect(eventsSection()).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: 'This week in the network' })).toBeInTheDocument();
    });

    it('drops only the events when the events call failed', () => {
      renderHome({ events: null });

      expect(eventsSection()).not.toBeInTheDocument();
      expect(within(rolesSection()!).getAllByRole('listitem')).toHaveLength(5);
    });

    it('carries the sign-up note on the roles', async () => {
      renderHome();

      const rolesEl = rolesSection()!;
      expect(rolesEl).toHaveTextContent('Sign up to apply with your directory profile.');
      await userEvent.click(within(rolesEl).getByRole('button', { name: 'Sign up' }));
      expect(mockHome.onAuthDoorClicked).toHaveBeenCalledWith({ door: 'sign_up', section: 'roles' });
      expect(mockRouter.push).toHaveBeenCalled();
    });

    it('records role, event and See all clicks', async () => {
      renderHome();

      await userEvent.click(screen.getByRole('link', { name: 'Role 2' }));
      expect(mockHome.onRoleClicked).toHaveBeenCalledWith({ team_uid: 'team2', position: 2, signed_in: false });

      await userEvent.click(screen.getByRole('link', { name: 'libp2p Day' }));
      expect(mockHome.onEventClicked).toHaveBeenCalledWith({ event_uid: 'e2', position: 2, signed_in: false });

      await userEvent.click(screen.getByRole('link', { name: 'See all 171 jobs' }));
      expect(mockHome.onSeeAllClicked).toHaveBeenCalledWith({ section: 'roles' });
      await userEvent.click(screen.getByRole('link', { name: 'See all 9 events' }));
      expect(mockHome.onSeeAllClicked).toHaveBeenCalledWith({ section: 'events' });
    });
  });

  describe('the portfolio', () => {
    it('counts the merged portfolio in the figures and the section line', () => {
      renderHome();

      expect(
        screen.getByText(`${portfolio.length} teams across four focus areas, with Protocol Labs at the centre.`),
      ).toBeInTheDocument();
      expect(screen.getByText(String(portfolio.length))).toBeInTheDocument();
    });

    it('unclamps the map from Show the whole map', async () => {
      const { container } = renderHome();

      const button = screen.getByRole('button', { name: 'Show the whole map' });
      const clamp = button.parentElement!;
      expect(clamp.className).toContain('mapClamp');
      expect(clamp.className).not.toContain('mapClampOpen');

      await userEvent.click(button);

      expect(clamp.className).toContain('mapClampOpen');
      expect(screen.queryByRole('button', { name: 'Show the whole map' })).not.toBeInTheDocument();
      expect(mockHome.onSeeAllClicked).toHaveBeenCalledWith({ section: 'map' });
      expect(container.querySelectorAll('[class*="mapClamp"]')).toHaveLength(1);
    });

    it('links each focus-area card by the directory’s title and counts its island', async () => {
      renderHome();

      const cards = within(screen.getByRole('list', { name: 'Browse the directory by focus area' })).getAllByRole(
        'listitem',
      );
      expect(cards).toHaveLength(4);

      const neuro = cards.find((c) => within(c).queryByRole('heading', { name: 'Neurotechnology' }))!;
      const onIsland = portfolio.filter((t) => t.island === 'neurotech').length;
      expect(within(neuro).getByText(`${onIsland} portfolio teams`)).toBeInTheDocument();
      expect(within(neuro).getByRole('link', { name: 'Teams' })).toHaveAttribute('href', '/teams?focusAreas=Neurotech');
      expect(within(neuro).getByRole('link', { name: 'Projects' })).toHaveAttribute(
        'href',
        '/projects?focusAreas=Neurotech',
      );

      await userEvent.click(within(neuro).getByRole('link', { name: 'Projects' }));
      expect(mockHome.onFocusAreaClicked).toHaveBeenCalledWith({ area: 'Neurotech', target: 'projects' });
    });
  });

  it('shows the PL entities, each linking out', () => {
    renderHome();

    const entities = screen.getByRole('region', { name: 'Protocol Labs entities' });
    const link = within(entities).getByRole('link', { name: /PL R&D/ });
    expect(link).toHaveAttribute('href', 'https://www.plrd.org/');
    expect(link).toHaveAttribute('target', '_blank');
  });

  describe('the footer', () => {
    it('has the mission and the Directory, Network and Protocol Labs columns', () => {
      const { container } = renderHome();

      const footer = container.querySelector('footer')!;
      expect(within(footer).getByText(MISSION)).toBeInTheDocument();
      ['Directory', 'Network', 'Protocol Labs'].forEach((title) =>
        expect(within(footer).getByRole('heading', { name: title })).toBeInTheDocument(),
      );
      expect(within(footer).getByRole('link', { name: 'Events' })).toHaveAttribute('href', '/events/irl');
      expect(within(footer).getByText(/^© \d{4} Protocol Labs\./)).toBeInTheDocument();
    });

    it('opens the support form from Contact support', async () => {
      renderHome();

      await userEvent.click(screen.getByRole('button', { name: 'Contact support' }));

      expect(mockOpenSupport).toHaveBeenCalled();
    });
  });

  it('opens a shared ?news= story that is not one of the three', () => {
    window.history.replaceState(null, '', '/home?news=shared');

    renderHome({ deepLinkedItem: makeStory('shared') });

    expect(screen.getByRole('dialog', { name: 'Headline shared' })).toBeInTheDocument();
  });
});
