/**
 * LAB-3219: the team page wires the Events section per design D5, behind the event drawer flag, in place of the
 * Contributions tiles. The page is an async server component, so its element tree is inspected rather than rendered.
 */
import React, { isValidElement, type ReactElement, type ReactNode } from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

const flag = { on: true };
jest.mock('@/utils/event-drawer', () => ({
  get SHOW_EVENT_DRAWER() {
    return flag.on;
  },
}));

// The real drawer pulls in `react-calendar`, which jest can't load.
jest.mock('@/components/page/events/EventDrawer', () => ({ EventDrawer: () => null, eventGoingToastText: () => '' }));
jest.mock('@/components/core/ToastContainer', () => ({ toast: { success: jest.fn() } }));

// Pulls in `next/server` (no `Request` in jsdom); only its place in the tree matters here.
jest.mock('@/components/page/team-details/TeamDetails', () => ({ TeamDetails: () => null }));

const mockCookies = jest.fn();
jest.mock('@/utils/next-helpers', () => ({ getCookiesFromHeaders: async () => mockCookies() }));

const mockGetTeamEventsPublic = jest.fn();
jest.mock('@/services/events/profile-events.service', () => ({
  ...jest.requireActual('@/services/events/profile-events.service'),
  getTeamEventsPublic: (...args: unknown[]) => mockGetTeamEventsPublic(...args),
}));

const TEAM = {
  id: 'team-1',
  name: 'Lighthouse',
  maintainingProjects: [],
  contributingProjects: [],
  eventGuests: [{ uid: 'guest-1' }],
  associations: [],
};
jest.mock('@/services/teams.service', () => ({
  getTeam: jest.fn(async () => ({ data: { formatedData: { ...TEAM } } })),
  getAllTeams: jest.fn().mockResolvedValue({ data: { formattedData: [] } }),
  getTeamUIDByAirtableId: jest.fn(),
}));
jest.mock('@/services/members.service', () => ({
  getMembers: jest.fn().mockResolvedValue({ data: { formattedData: [] } }),
}));
jest.mock('@/services/common.service', () => ({ getFocusAreas: jest.fn().mockResolvedValue({ data: [] }) }));
jest.mock('@/services/team-news/team-news.service', () => ({ fetchTeamNewsByTeam: jest.fn().mockResolvedValue(null) }));
jest.mock('@/services/follow/follow.service', () => ({ getTeamFollowers: jest.fn().mockResolvedValue(null) }));
jest.mock('@/app/actions/jobs.actions', () => ({ getJobsList: jest.fn().mockResolvedValue({ isError: true }) }));

import TeamPage from '@/app/teams/[id]/page';
import TeamIrlContributions from '@/components/page/team-details/team-irl-contributions';
import { TeamProfileEvents } from '@/components/page/team-details/TeamEventsSection';
import { TEAM_PAST } from '@/components/page/team-details/TeamEventsSection/TeamEventsSection.fixtures';

const LOGGED_OUT = { userInfo: {}, isLoggedIn: false, authToken: '' };
const props = { params: Promise.resolve({ id: 'team-1' }), searchParams: Promise.resolve({}) };
const SERVER_EVENTS = { upcoming: null, past: { page: 1, limit: 50, total: TEAM_PAST.length, items: TEAM_PAST } };

/** Every element of a type in a server component's returned tree (children props only; no rendering). */
function findAll(node: ReactNode, type: unknown, found: ReactElement[] = []): ReactElement[] {
  if (Array.isArray(node)) {
    node.forEach((child) => findAll(child, type, found));
  } else if (isValidElement(node)) {
    if (node.type === type) found.push(node);
    findAll((node.props as { children?: ReactNode }).children, type, found);
  }
  return found;
}

const renderPage = async () => (await (TeamPage as (p: unknown) => Promise<ReactNode>)(props)) as ReactNode;

beforeEach(() => {
  flag.on = true;
  mockCookies.mockReturnValue(LOGGED_OUT);
  mockGetTeamEventsPublic.mockReset();
  mockGetTeamEventsPublic.mockResolvedValue(SERVER_EVENTS);
});

describe('team page Events wiring (LAB-3219)', () => {
  it('Signed-out visitor on a team profile: the section shows past events only, from the token-less server read', async () => {
    const tree = await renderPage();

    expect(mockGetTeamEventsPublic).toHaveBeenCalledWith('team-1');
    const [section] = findAll(tree, TeamProfileEvents);
    expect(section.props).toMatchObject({
      teamUid: 'team-1',
      teamName: 'Lighthouse',
      serverEvents: SERVER_EVENTS,
      isLoggedIn: false,
    });
    expect(findAll(tree, TeamIrlContributions)).toHaveLength(0);

    render(section);
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Past events');
    expect(screen.queryByRole('list', { name: /is going to/ })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'PL Demo Day, June 2026' })).toHaveAttribute('href', '/demoday/june-2026');
  });

  it('a signed-in viewer gets the same section, told they are signed in, to load upcoming on the client', async () => {
    mockCookies.mockReturnValue({ userInfo: { uid: 'm1' }, isLoggedIn: true, authToken: 'token' });

    const [section] = findAll(await renderPage(), TeamProfileEvents);

    expect(section.props).toMatchObject({ isLoggedIn: true, serverEvents: SERVER_EVENTS });
  });

  it('the endpoint failing (a 403, 404 or outage) leaves the section absent, with no error banner', async () => {
    mockGetTeamEventsPublic.mockResolvedValue(null);

    const [section] = findAll(await renderPage(), TeamProfileEvents);
    const { container } = render(section);

    expect(container).toBeEmptyDOMElement();
  });

  it('with the flag off, keeps the Contributions tiles and makes no events request', async () => {
    flag.on = false;

    const tree = await renderPage();

    expect(findAll(tree, TeamProfileEvents)).toHaveLength(0);
    expect(findAll(tree, TeamIrlContributions)).toHaveLength(1);
    expect(mockGetTeamEventsPublic).not.toHaveBeenCalled();
  });
});
