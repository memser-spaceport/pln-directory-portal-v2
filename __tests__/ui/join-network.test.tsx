import { render, screen, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import JoinNetwork from '@/components/core/navbar/join-network';
import { useRouter } from 'next/navigation';
import { useCommonAnalytics } from '@/analytics/common.analytics';
import Cookies from 'js-cookie';
import { toast } from 'react-toastify';
import useClickedOutside from '@/hooks/useClickedOutside';
import { EVENTS, JOIN_NETWORK_MENUS, TOAST_MESSAGES } from '@/utils/constants';

// Mock dependencies
jest.mock('next/navigation', () => ({ useRouter: jest.fn() }));
jest.mock('@/analytics/common.analytics', () => ({ useCommonAnalytics: jest.fn() }));
jest.mock('js-cookie', () => ({ get: jest.fn() }));
jest.mock('react-toastify', () => ({ toast: { info: jest.fn() } }));
jest.mock('@/hooks/useClickedOutside', () => jest.fn());

const mockPush = jest.fn();
const mockRefresh = jest.fn();
const mockOnNavJoinNetworkClicked = jest.fn();
const mockOnNavJoinNetworkOptionClicked = jest.fn();
const mockToastInfo = toast.info as jest.Mock;
const mockCookiesGet = Cookies.get as jest.Mock;

// Helper to spy on document.dispatchEvent
const dispatchEventSpy = jest.spyOn(document, 'dispatchEvent');

// Patch JOIN_NETWORK_MENUS for test predictability
jest.mock('@/utils/constants', () => ({
  EVENTS: {
    OPEN_MEMBER_REGISTER_DIALOG: 'OPEN_MEMBER_REGISTER_DIALOG',
    OPEN_TEAM_REGISTER_DIALOG: 'OPEN_TEAM_REGISTER_DIALOG',
  },
  JOIN_NETWORK_MENUS: [
    { name: 'Member', key: 'member', logo: '/logo-member.svg' },
    { name: 'Team', key: 'team', logo: '/logo-team.svg' },
  ],
  TOAST_MESSAGES: { LOGGED_IN_MSG: 'Already logged in!' },
}));

/**
 * Test suite for JoinNetwork component.
 * Covers all branches, lines, and edge cases for 100% coverage.
 */
describe('JoinNetwork', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({ push: mockPush, refresh: mockRefresh });
    (useCommonAnalytics as jest.Mock).mockReturnValue({
      onNavJoinNetworkClicked: mockOnNavJoinNetworkClicked,
      onNavJoinNetworkOptionClicked: mockOnNavJoinNetworkOptionClicked,
    });
    mockCookiesGet.mockReset();
    mockToastInfo.mockReset();
    (useClickedOutside as jest.Mock).mockImplementation(({ callback }) => callback);
    dispatchEventSpy.mockClear();
  });

  /**
   * Should render the join network button
   */
  it('renders the join network button', () => {
    render(<JoinNetwork />);
    expect(screen.getByRole('button', { name: /join the network/i })).toBeInTheDocument();
    expect(screen.getByText('Join the network')).toBeInTheDocument();
  });

  /**
   * Should show toast and refresh if user is logged in
   */
  it('shows toast and refresh if user is logged in', () => {
    mockCookiesGet.mockReturnValue('mockUserInfo');
    render(<JoinNetwork />);
    fireEvent.click(screen.getByRole('button', { name: /join the network/i }));
    expect(mockToastInfo).toHaveBeenCalledWith('Already logged in!');
    expect(mockRefresh).toHaveBeenCalled();
    expect(mockOnNavJoinNetworkClicked).not.toHaveBeenCalled();
  });

  /**
   * Should open dropdown and call analytics if user is not logged in
   */
  it('opens dropdown and calls analytics if user is not logged in', () => {
    mockCookiesGet.mockReturnValue(undefined);
    render(<JoinNetwork />);
    const btn = screen.getByRole('button', { name: /join the network/i });
    fireEvent.click(btn);
    // Dropdown should appear
    expect(screen.getByText('Member')).toBeInTheDocument();
    expect(screen.getByText('Team')).toBeInTheDocument();
    expect(mockOnNavJoinNetworkClicked).toHaveBeenCalledWith(true);
  });

  /**
   * Should close dropdown on second click and call analytics with false
   */
  it('closes dropdown on second click and calls analytics with false', () => {
    mockCookiesGet.mockReturnValue(undefined);
    render(<JoinNetwork />);
    const btn = screen.getByRole('button', { name: /join the network/i });
    fireEvent.click(btn); // open
    fireEvent.click(btn); // close
    expect(mockOnNavJoinNetworkClicked).toHaveBeenCalledWith(false);
  });

  /**
   * Should handle Member option click: analytics and event
   */
  it('handles Member option click: analytics and event', () => {
    mockCookiesGet.mockReturnValue(undefined);
    render(<JoinNetwork />);
    fireEvent.click(screen.getByRole('button', { name: /join the network/i }));
    fireEvent.click(screen.getByText('Member'));
    expect(mockOnNavJoinNetworkOptionClicked).toHaveBeenCalledWith('Member');
    expect(dispatchEventSpy).toHaveBeenCalledWith(expect.objectContaining({ type: 'OPEN_MEMBER_REGISTER_DIALOG' }));
  });

  /**
   * Should handle Team option click: analytics and event
   */
  it('handles Team option click: analytics and event', () => {
    mockCookiesGet.mockReturnValue(undefined);
    render(<JoinNetwork />);
    fireEvent.click(screen.getByRole('button', { name: /join the network/i }));
    fireEvent.click(screen.getByText('Team'));
    expect(mockOnNavJoinNetworkOptionClicked).toHaveBeenCalledWith('Team');
    expect(dispatchEventSpy).toHaveBeenCalledWith(expect.objectContaining({ type: 'OPEN_TEAM_REGISTER_DIALOG' }));
  });

  /**
   * Should close dropdown after option click
   */
  it('closes dropdown after option click', () => {
    mockCookiesGet.mockReturnValue(undefined);
    render(<JoinNetwork />);
    fireEvent.click(screen.getByRole('button', { name: /join the network/i }));
    fireEvent.click(screen.getByText('Member'));
    expect(screen.queryByText('Member')).not.toBeInTheDocument();
    expect(screen.queryByText('Team')).not.toBeInTheDocument();
  });

  /**
   * Should close dropdown when clicking outside (useClickedOutside)
   */
  it('closes dropdown when clicking outside', () => {
    mockCookiesGet.mockReturnValue(undefined);
    render(<JoinNetwork />);
    fireEvent.click(screen.getByRole('button', { name: /join the network/i }));
    // Simulate outside click by calling the callback
    act(() => {
      (useClickedOutside as jest.Mock).mock.calls[0][0].callback();
    });
    expect(screen.queryByText('Member')).not.toBeInTheDocument();
    expect(screen.queryByText('Team')).not.toBeInTheDocument();
  });
}); 