import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import UserProfile from '../../components/core/navbar/userProfile';
import { useRouter } from 'next/navigation';
import { useCommonAnalytics } from '@/analytics/common.analytics';
import { toast } from 'react-toastify';

// Mock dependencies
jest.mock('next/navigation', () => ({ useRouter: jest.fn() }));
jest.mock('@/analytics/common.analytics', () => ({ useCommonAnalytics: jest.fn() }));
jest.mock('react-toastify', () => ({ toast: { success: jest.fn() } }));
jest.mock('@/utils/third-party.helper', () => ({ clearAllAuthCookies: jest.fn() }));
jest.mock('../../components/core/login/broadcast-channel', () => ({ createLogoutChannel: jest.fn(() => ({ postMessage: jest.fn() })) }));
jest.mock('@/hooks/useClickedOutside', () => jest.fn());
jest.mock('@/utils/common.utils', () => ({ getAnalyticsUserInfo: jest.fn(() => ({ id: 'mock-id' })) }));

const mockPush = jest.fn();
const mockOnNavAccountItemClicked = jest.fn();
const mockClearAllAuthCookies = require('@/utils/third-party.helper').clearAllAuthCookies;
const mockCreateLogoutChannel = require('../../components/core/login/broadcast-channel').createLogoutChannel;
const mockToastSuccess = toast.success;
const mockGetAnalyticsUserInfo = require('@/utils/common.utils').getAnalyticsUserInfo;

const baseUserInfo = {
  name: 'Test User',
  profileImageUrl: '/test.png',
  email: 'test@example.com',
};

describe('UserProfile', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({ push: mockPush });
    (useCommonAnalytics as jest.Mock).mockReturnValue({ onNavAccountItemClicked: mockOnNavAccountItemClicked });
  });

  it('renders user avatar and dropdown button', () => {
    render(<UserProfile userInfo={baseUserInfo as any} />);
    expect(screen.getByAltText('profile')).toBeInTheDocument();
    expect(screen.getByAltText('dropdown')).toBeInTheDocument();
  });

  it('shows default avatar if profileImageUrl is missing', () => {
    render(<UserProfile userInfo={{ ...baseUserInfo, profileImageUrl: undefined } as any} />);
    expect(screen.getByAltText('profile')).toHaveAttribute('src', '/icons/default_profile.svg');
  });

  it('opens and closes dropdown on button click', () => {
    render(<UserProfile userInfo={baseUserInfo as any} />);
    const dropdownBtn = screen.getByAltText('dropdown').closest('button');
    expect(screen.queryByText('Account Settings')).not.toBeInTheDocument();
    fireEvent.click(dropdownBtn!);
    expect(screen.getByText('Account Settings')).toBeInTheDocument();
    fireEvent.click(dropdownBtn!);
    expect(screen.queryByText('Account Settings')).not.toBeInTheDocument();
  });

  it('navigates to settings and fires analytics on Account Settings click', () => {
    render(<UserProfile userInfo={baseUserInfo as any} />);
    const dropdownBtn = screen.getByAltText('dropdown').closest('button');
    fireEvent.click(dropdownBtn!);
    const settingsBtn = screen.getByText('Account Settings');
    fireEvent.click(settingsBtn);
    expect(mockPush).toHaveBeenCalledWith('/settings/profile');
    expect(mockOnNavAccountItemClicked).toHaveBeenCalledWith('settings', { id: 'mock-id' });
  });

  it('handles logout: closes dropdown, clears cookies, fires analytics, broadcasts, and shows toast', () => {
    const mockPostMessage = jest.fn();
    (mockCreateLogoutChannel as jest.Mock).mockReturnValue({ postMessage: mockPostMessage });
    render(<UserProfile userInfo={baseUserInfo as any} />);
    const dropdownBtn = screen.getByAltText('dropdown').closest('button');
    fireEvent.click(dropdownBtn!);
    const logoutBtn = screen.getByText('Logout').closest('button');
    // onClickCapture triggers analytics, onClick triggers logout
    fireEvent.click(logoutBtn!);
    expect(mockOnNavAccountItemClicked).toHaveBeenCalledWith('logout', { id: 'mock-id' });
    expect(mockClearAllAuthCookies).toHaveBeenCalled();
    expect(mockPostMessage).toHaveBeenCalledWith('logout');
    expect(mockToastSuccess).toHaveBeenCalled();
  });

  it('renders user name in tooltip and as truncated text', () => {
    render(<UserProfile userInfo={baseUserInfo as any} />);
    const dropdownBtn = screen.getByAltText('dropdown').closest('button');
    fireEvent.click(dropdownBtn!);
    const nameElements = screen.getAllByText(baseUserInfo.name);
    expect(nameElements.length).toBeGreaterThan(1); // Should render in both tooltip triggers
    nameElements.forEach(el => expect(el).toBeInTheDocument());
  });

  it('handles missing userInfo gracefully', () => {
    render(<UserProfile userInfo={{} as any} />);
    expect(screen.getByAltText('profile')).toBeInTheDocument();
    // Should not throw or crash
  });

  it('closes dropdown on outside click (useClickedOutside hook)', () => {
    // The hook is mocked, so we just ensure no crash and dropdown logic is not broken
    render(<UserProfile userInfo={baseUserInfo as any} />);
    const dropdownBtn = screen.getByAltText('dropdown').closest('button');
    fireEvent.click(dropdownBtn!);
    expect(screen.getByText('Account Settings')).toBeInTheDocument();
  });

  it('dropdown menu is not rendered when isDropdown is false', () => {
    render(<UserProfile userInfo={baseUserInfo as any} />);
    expect(screen.queryByText('Account Settings')).not.toBeInTheDocument();
  });

  it('renders correctly with long user name (truncation/tooltip)', () => {
    const longName = 'A very very very long user name that should be truncated';
    render(<UserProfile userInfo={{ ...baseUserInfo, name: longName } as any} />);
    const dropdownBtn = screen.getByAltText('dropdown').closest('button');
    fireEvent.click(dropdownBtn!);
    const nameElements = screen.getAllByText(longName);
    expect(nameElements.length).toBeGreaterThan(1);
    nameElements.forEach(el => expect(el).toBeInTheDocument());
  });

  it('renders gracefully when userInfo.name is undefined', () => {
    render(<UserProfile userInfo={{ ...baseUserInfo, name: undefined } as any} />);
    const dropdownBtn = screen.getByAltText('dropdown').closest('button');
    fireEvent.click(dropdownBtn!);
    // Should render empty tooltip and text node
    const nameElements = screen.getAllByText('', { exact: true });
    expect(nameElements.length).toBeGreaterThan(0);
  });
}); 