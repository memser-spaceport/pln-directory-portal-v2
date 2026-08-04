import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';

const getCookiesFromHeadersMock = jest.fn();

jest.mock('@/utils/next-helpers', () => ({
  getCookiesFromHeaders: () => getCookiesFromHeadersMock(),
}));

jest.mock('@/services/common.service', () => ({
  getFocusAreas: jest.fn().mockResolvedValue({ data: [] }),
}));
jest.mock('@/services/featured.service', () => ({
  getFeaturedData: jest.fn().mockResolvedValue({ data: [] }),
}));
jest.mock('@/services/discovery.service', () => ({
  getDiscoverData: jest.fn().mockResolvedValue({ data: [] }),
}));
jest.mock('@/services/team-news/team-news.service', () => ({
  getTeamNewsGroupedByFocusArea: jest.fn().mockResolvedValue({ groups: [], allTabExtraItems: [] }),
  getTeamNewsPopular: jest.fn().mockResolvedValue({ items: [] }),
}));
jest.mock('@/utils/home.utils', () => ({
  formatFeaturedData: () => [],
}));

// Stubbed so the test asserts on the page composition only, not on child internals.
jest.mock('@/components/page/home/QuickActions', () => ({
  __esModule: true,
  QuickActions: () => <div data-testid="quick-actions">Quick Actions</div>,
}));
jest.mock('@/components/page/home/Welcome', () => ({
  __esModule: true,
  Welcome: () => <div data-testid="welcome" />,
}));
jest.mock('@/components/page/home/TeamNews', () => ({
  __esModule: true,
  TeamNews: () => <div data-testid="team-news" />,
  AutoMarkNewsNotification: () => null,
}));
jest.mock('@/components/page/home/FocusAreaSection', () => ({
  __esModule: true,
  FocusAreaSection: () => <div data-testid="focus-area" />,
}));
jest.mock('@/components/page/home/husky-dialog', () => ({ __esModule: true, default: () => null }));
jest.mock('@/components/page/home/husky-discover', () => ({ __esModule: true, default: () => null }));
jest.mock('@/components/page/home/featured/scroll-to-top', () => ({ __esModule: true, default: () => null }));

import Home from '@/app/home/page';

describe('Home page — Quick Actions is hidden', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => null }) as unknown as typeof fetch;
  });

  it('does not render the Quick Actions section for a logged-in member', async () => {
    getCookiesFromHeadersMock.mockResolvedValue({
      isLoggedIn: true,
      userInfo: { uid: 'uid-1', name: 'Member' },
      authToken: 'token',
    });

    render(await Home());

    expect(screen.queryByTestId('quick-actions')).not.toBeInTheDocument();
    expect(screen.queryByText('Quick Actions')).not.toBeInTheDocument();
    // The rest of the home page still renders.
    expect(screen.getByTestId('team-news')).toBeInTheDocument();
    expect(screen.getByTestId('focus-area')).toBeInTheDocument();
  });

  it('does not render the Quick Actions section for a guest', async () => {
    getCookiesFromHeadersMock.mockResolvedValue({ isLoggedIn: false, userInfo: null, authToken: undefined });

    render(await Home());

    expect(screen.queryByTestId('quick-actions')).not.toBeInTheDocument();
    expect(screen.getByTestId('welcome')).toBeInTheDocument();
  });
});
