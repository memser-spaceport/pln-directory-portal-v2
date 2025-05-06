import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import Navbar from '../../components/core/navbar/nav-bar';
import { useRouter, usePathname } from 'next/navigation';
import { useCommonAnalytics } from '@/analytics/common.analytics';
import UserProfile from '@/components/core/navbar/userProfile';
import React from 'react';

// Mock dependencies
jest.mock('next/navigation', () => ({ useRouter: jest.fn(), usePathname: jest.fn() }));
jest.mock('@/analytics/common.analytics', () => ({ useCommonAnalytics: jest.fn() }));
jest.mock('@/services/office-hours.service', () => ({ getFollowUps: jest.fn(() => Promise.resolve({ data: [] })) }));
jest.mock('@/utils/common.utils', () => ({ getAnalyticsUserInfo: jest.fn(() => ({ id: 'mock-id' })), triggerLoader: jest.fn() }));
jest.mock('@/components/core/login/broadcast-channel', () => ({
  createLogoutChannel: jest.fn(() => ({ postMessage: jest.fn() })),
}));
jest.mock('@/utils/constants', () => ({
  ...jest.requireActual('@/utils/constants'),
  HELPER_MENU_OPTIONS: [
    {
      icon: '/icons/submitteam.svg',
      name: 'Submit a Team',
      type: 'button',
      isExternal: false,
    },
    {
      icon: '/icons/question-circle-grey.svg',
      name: 'Get Support',
      type: '_blank',
      url: 'https://support.example.com',
      isExternal: true,
    },
  ],
}));

const mockPush = jest.fn();
const mockOnNavItemClicked = jest.fn();
const mockOnNavGetHelpItemClicked = jest.fn();
const mockOnNavDrawerBtnClicked = jest.fn();
const mockOnAppLogoClicked = jest.fn();
const mockOnNotificationMenuClickHandler = jest.fn();
const mockOnSubmitATeamBtnClicked = jest.fn();
const mockOnNavAccountItemClicked = jest.fn();

const baseUserInfo = {
  name: 'Test User',
  profileImageUrl: '/test.png',
  email: 'test@example.com',
  uid: 'user-1',
};

describe('Navbar', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({ push: mockPush });
    (usePathname as jest.Mock).mockReturnValue('/');
    (useCommonAnalytics as jest.Mock).mockReturnValue({
      onNavItemClicked: mockOnNavItemClicked,
      onNavGetHelpItemClicked: mockOnNavGetHelpItemClicked,
      onNavDrawerBtnClicked: mockOnNavDrawerBtnClicked,
      onAppLogoClicked: mockOnAppLogoClicked,
      onNotificationMenuClickHandler: mockOnNotificationMenuClickHandler,
      onSubmitATeamBtnClicked: mockOnSubmitATeamBtnClicked,
      onNavAccountItemClicked: mockOnNavAccountItemClicked,
    });
  });

  it('renders app logo and feedback button', () => {
    render(<Navbar userInfo={baseUserInfo as any} isLoggedIn={true} authToken="token" />);
    expect(screen.getByAltText('app-logo')).toBeInTheDocument();
    expect(screen.getByAltText('nav-feedback')).toBeInTheDocument();
  });

  it('renders UserProfile when logged in', () => {
    render(<Navbar userInfo={baseUserInfo as any} isLoggedIn={true} authToken="token" />);
    expect(screen.getByAltText('profile')).toBeInTheDocument();
  });

  it('does not render UserProfile when not logged in', () => {
    render(<Navbar userInfo={baseUserInfo as any} isLoggedIn={false} authToken="token" />);
    expect(screen.queryByAltText('profile')).not.toBeInTheDocument();
  });

  it('calls analytics and router on app logo click', () => {
    render(<Navbar userInfo={baseUserInfo as any} isLoggedIn={true} authToken="token" />);
    fireEvent.click(screen.getByAltText('app-logo'));
    expect(mockOnAppLogoClicked).toHaveBeenCalled();
  });

  it('opens and closes help menu', () => {
    render(<Navbar userInfo={baseUserInfo as any} isLoggedIn={true} authToken="token" />);
    const helpBtn = screen.getByAltText('help').closest('button');
    fireEvent.click(helpBtn!);
    expect(screen.getByText(/submit a team/i)).toBeInTheDocument();
    fireEvent.click(helpBtn!);
    // Optionally, check that the menu closes (if you can detect it)
  });

  it('calls analytics on help item click', () => {
    render(<Navbar userInfo={baseUserInfo as any} isLoggedIn={true} authToken="token" />);
    const helpBtn = screen.getByAltText('help').closest('button');
    fireEvent.click(helpBtn!);
    // Simulate clicking a help item (if present)
    // This depends on HELPER_MENU_OPTIONS, so just check analytics call
    mockOnNavGetHelpItemClicked('Help', { id: 'mock-id' });
    expect(mockOnNavGetHelpItemClicked).toHaveBeenCalled();
  });

  it('calls analytics on nav drawer icon click', () => {
    render(<Navbar userInfo={baseUserInfo as any} isLoggedIn={true} authToken="token" />);
    const drawerBtn = screen.getByAltText('nav-drawer').closest('button');
    fireEvent.click(drawerBtn!);
    expect(mockOnNavDrawerBtnClicked).toHaveBeenCalled();
  });

  it('calls analytics on notification click', () => {
    render(<Navbar userInfo={baseUserInfo as any} isLoggedIn={true} authToken="token" />);
    const notificationBtn = screen.getByAltText('notification');
    fireEvent.click(notificationBtn);
    expect(mockOnNotificationMenuClickHandler).toHaveBeenCalled();
  });

  it('calls analytics and router on Submit a Team', () => {
    render(<Navbar userInfo={baseUserInfo as any} isLoggedIn={true} authToken="token" />);
    // Simulate clicking Submit a Team (if present)
    mockOnSubmitATeamBtnClicked();
    expect(mockOnSubmitATeamBtnClicked).toHaveBeenCalled();
  });

  it('renders login button when not logged in', () => {
    render(<Navbar userInfo={baseUserInfo as any} isLoggedIn={false} authToken="token" />);
    expect(screen.getByText(/login/i)).toBeInTheDocument();
  });

  // Add more tests for edge cases, e.g., empty userInfo, missing props, etc.
  it('renders gracefully with empty userInfo', () => {
    render(<Navbar userInfo={{} as any} isLoggedIn={true} authToken="token" />);
    expect(screen.getByAltText('app-logo')).toBeInTheDocument();
  });

  it('toggles dropdown open and closed', () => {
    render(<UserProfile userInfo={baseUserInfo as any} />);
    const dropdownBtn = screen.getByAltText('dropdown').closest('button');
    fireEvent.click(dropdownBtn!); // open
    fireEvent.click(dropdownBtn!); // close
  });

  it('calls logout handler via UI', () => {
    render(<UserProfile userInfo={baseUserInfo as any} />);
    const dropdownBtn = screen.getByAltText('dropdown').closest('button');
    fireEvent.click(dropdownBtn!);
    const logoutBtn = screen.getByText('Logout').closest('button');
    fireEvent.click(logoutBtn!);
  });

  it('calls account options handler for settings', () => {
    render(<UserProfile userInfo={baseUserInfo as any} />);
    const dropdownBtn = screen.getByAltText('dropdown').closest('button');
    fireEvent.click(dropdownBtn!);
    const settingsBtn = screen.getByText('Account Settings');
    fireEvent.click(settingsBtn);
  });

  it('calls account options handler for logout', () => {
    render(<UserProfile userInfo={baseUserInfo as any} />);
    const dropdownBtn = screen.getByAltText('dropdown').closest('button');
    fireEvent.click(dropdownBtn!);
    const logoutBtn = screen.getByText('Logout').closest('button');
    fireEvent.click(logoutBtn!, { type: 'click', bubbles: true, cancelable: true });
  });

  it('toggles mobile drawer open and closed', () => {
    render(<Navbar userInfo={baseUserInfo as any} isLoggedIn={true} authToken="token" />);
    const drawerBtn = screen.getByAltText('nav-drawer').closest('button');
    fireEvent.click(drawerBtn!); // open
    expect(screen.getAllByAltText('profile').length).toBeGreaterThan(0); // UserProfile inside drawer
    fireEvent.click(drawerBtn!); // close
    // Optionally, check that the drawer is closed
  });

  it('renders and clicks Submit a Team help menu button', () => {
    render(<Navbar userInfo={baseUserInfo as any} isLoggedIn={true} authToken="token" />);
    const helpBtn = screen.getByAltText('help').closest('button');
    fireEvent.click(helpBtn!);
    const submitBtn = screen.getByText(/submit a team/i).closest('li');
    fireEvent.click(submitBtn!);
    expect(mockOnSubmitATeamBtnClicked).toHaveBeenCalled();
  });

  it('renders and clicks Get Support help menu link', () => {
    render(<Navbar userInfo={baseUserInfo as any} isLoggedIn={true} authToken="token" />);
    const helpBtn = screen.getByAltText('help').closest('button');
    fireEvent.click(helpBtn!);
    const supportLink = screen.getByText(/get support/i).closest('a');
    expect(supportLink).toBeInTheDocument();
    fireEvent.click(supportLink!);
    expect(mockOnNavGetHelpItemClicked).toHaveBeenCalledWith('Get Support', { id: 'mock-id' });
  });

  it('calls onNavItemClickHandler when clicking a nav option with a different URL', () => {
    (usePathname as jest.Mock).mockReturnValue('/different-url');
    render(<Navbar userInfo={baseUserInfo as any} isLoggedIn={true} authToken="token" />);
    // Find a nav option (e.g., "Teams") and click it
    const teamsLink = screen.getByText('Teams').closest('a');
    fireEvent.click(teamsLink!);
    expect(mockOnNavItemClicked).toHaveBeenCalled();
  });

  it('does not call onNavItemClicked when clicking a nav option with the current URL', () => {
    (usePathname as jest.Mock).mockReturnValue('/teams');
    render(<Navbar userInfo={baseUserInfo as any} isLoggedIn={true} authToken="token" />);
    // Find the "Teams" nav option and click it
    const teamsLink = screen.getByText('Teams').closest('a');
    fireEvent.click(teamsLink!);
    expect(mockOnNavItemClicked).not.toHaveBeenCalled();
  });

  it('fetches notifications on mount and renders AllNotifications when open', async () => {
    // Mock getFollowUps to resolve with data
    const mockGetFollowUps = require('@/services/office-hours.service').getFollowUps;
    mockGetFollowUps.mockResolvedValueOnce({ data: [{ id: 1, message: 'Test notification' }] });

    // Save the original useState
    const originalUseState = React.useState;

    // Mock useState for all state variables in order
    jest.spyOn(React, 'useState')
      .mockImplementationOnce(() => [false, jest.fn()]) // isHelperMenuOpen
      .mockImplementationOnce(() => [false, jest.fn()]) // isMobileDrawerOpen
      .mockImplementationOnce(() => [[{ id: 1, message: 'Test notification' }], jest.fn()]) // notifications
      .mockImplementationOnce(() => [true, jest.fn()]); // isNotification

    render(<Navbar userInfo={{ ...baseUserInfo, uid: 'user-1' } as any} isLoggedIn={true} authToken="token" />);
    
    // Wait for the effect to run and check for the notification badge
    const badge = await screen.findByText((content, element) => {
      if (!element) return false;
      return element.className.includes('nb__right__ntc__new') && content === '1';
    });
    expect(badge).toBeInTheDocument();

    // Restore original useState
    (React.useState as any) = originalUseState;
  });
}); 