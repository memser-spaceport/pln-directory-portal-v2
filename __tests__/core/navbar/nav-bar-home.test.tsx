import '@testing-library/jest-dom';
import { fireEvent, render, screen } from '@testing-library/react';

import Navbar from '@/components/core/navbar/nav-bar';

const mockUsePathname = jest.fn<string, []>();
jest.mock('next/navigation', () => ({ usePathname: () => mockUsePathname() }));

const mockHasNewNews = jest.fn<boolean, []>();
jest.mock('@/services/team-news/hooks/useHasNewNews', () => ({ useHasNewNews: () => mockHasNewNews() }));

const mockOnNavItemClicked = jest.fn();
const mockOnHomeNavClicked = jest.fn();
const mockOnHomeNewNewsDotShown = jest.fn();
const mockOnAppLogoClicked = jest.fn();
jest.mock('@/analytics/common.analytics', () => ({
  useCommonAnalytics: () => ({
    onNavItemClicked: mockOnNavItemClicked,
    onHomeNavClicked: mockOnHomeNavClicked,
    onHomeNewNewsDotShown: mockOnHomeNewNewsDotShown,
    onAppLogoClicked: mockOnAppLogoClicked,
  }),
}));

// The bar's right-hand chrome (search, notifications, account, Privy login)
// has nothing to do with the Home entry and drags in a large dependency tree.
jest.mock('@/components/core/navbar/components/LoginBtn', () => ({ LoginBtn: () => null }));
jest.mock('@/components/core/navbar/components/Signup', () => ({ Signup: () => null }));
jest.mock('@/components/core/application-search', () => ({ ApplicationSearch: () => null }));
jest.mock('@/components/core/navbar/components/AccountMenu/AccountMenu', () => ({ AccountMenu: () => null }));
jest.mock('@/components/core/navbar/components/NotificationsMenu', () => ({ NotificationsMenu: () => null }));
jest.mock('@/components/core/NotificationBell', () => ({ NotificationBell: () => null }));
jest.mock('@/components/core/navbar/components/navItems/MoreNavItems', () => ({ MoreNavItems: () => null }));
jest.mock('@/components/core/navbar/components/navItems/PLInfraNavItems', () => ({ PLInfraNavItems: () => null }));
jest.mock('@/services/notifications/hooks/useGetAppNotifications', () => ({
  useGetAppNotifications: () => ({ data: [] }),
}));
jest.mock('@/services/members/hooks/useMemberProfileStatus', () => ({ useMemberProfileStatus: () => ({ data: {} }) }));
jest.mock('@/services/rbac/hooks/useDemoDayAnalyticsAccess', () => ({
  useDemoDayAnalyticsAccess: () => ({ hasAccess: false }),
}));

const props = { userInfo: {} as never, isLoggedIn: false, authToken: '' };

describe('Navbar — Home entry', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUsePathname.mockReturnValue('/members');
    mockHasNewNews.mockReturnValue(false);
  });

  it('reports the dot as shown, giving the click event a denominator', () => {
    mockHasNewNews.mockReturnValue(true);

    render(<Navbar {...props} />);

    expect(mockOnHomeNewNewsDotShown).toHaveBeenCalledTimes(1);
  });

  it('reports nothing when there is no dot to see', () => {
    render(<Navbar {...props} />);

    expect(mockOnHomeNewNewsDotShown).not.toHaveBeenCalled();
  });

  // A refetch landing mid-session can flip the flag off and back on. That's
  // one dot the member saw, not two, and double-reporting it would silently
  // halve every click-through rate computed against it.
  it('reports one impression per page load, however often the flag flips', () => {
    mockHasNewNews.mockReturnValue(true);
    const { rerender } = render(<Navbar {...props} />);

    mockHasNewNews.mockReturnValue(false);
    rerender(<Navbar {...props} />);

    mockHasNewNews.mockReturnValue(true);
    rerender(<Navbar {...props} />);

    expect(mockOnHomeNewNewsDotShown).toHaveBeenCalledTimes(1);
  });

  it('carries the dot state on the click, which /home destroys on arrival', () => {
    mockHasNewNews.mockReturnValue(true);

    render(<Navbar {...props} />);
    fireEvent.click(screen.getByRole('link', { name: /Home/ }));

    expect(mockOnHomeNavClicked).toHaveBeenCalledWith('desktop-nav', true);
    // The shared nav event still fires, so existing nav reporting is intact.
    expect(mockOnNavItemClicked).toHaveBeenCalledWith('Home', null);
  });

  it('distinguishes a dotless Home click from a dotted one', () => {
    render(<Navbar {...props} />);
    fireEvent.click(screen.getByRole('link', { name: /Home/ }));

    expect(mockOnHomeNavClicked).toHaveBeenCalledWith('desktop-nav', false);
  });

  it('does not count a click on the page you are already on', () => {
    mockUsePathname.mockReturnValue('/home');

    render(<Navbar {...props} />);
    fireEvent.click(screen.getByRole('link', { name: /Home/ }));

    expect(mockOnHomeNavClicked).not.toHaveBeenCalled();
    expect(mockOnNavItemClicked).not.toHaveBeenCalled();
  });
});
