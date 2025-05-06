import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import UserProfile from '../../components/core/navbar/userProfile';
import '@testing-library/jest-dom';
import { useRouter } from 'next/navigation';
import { clearAllAuthCookies } from '@/utils/third-party.helper';
import { createLogoutChannel } from '../../components/core/login/broadcast-channel';
import { toast } from 'react-toastify';

jest.mock('@/analytics/common.analytics', () => ({
  useCommonAnalytics: () => ({
    onNavAccountItemClicked: jest.fn(),
  }),
}));
jest.mock('@/utils/third-party.helper', () => ({
  clearAllAuthCookies: jest.fn(),
}));
jest.mock('@/utils/common.utils', () => ({
  getAnalyticsUserInfo: jest.fn(() => ({})),
}));
jest.mock('react-toastify', () => ({
  toast: { success: jest.fn() },
}));
jest.mock('../../components/core/login/broadcast-channel', () => ({
  createLogoutChannel: jest.fn(),
}));
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

const userInfo = {
  uid: '123',
  title: 'Test User',
  description: 'Test Description',
  createdAt: '2021-01-01',
  updatedAt: '2021-01-01',
  parentUid: '123',
  children: [],
  teamAncestorFocusAreas: [],
  projectAncestorFocusAreas: [],
};

describe('UserProfile', () => {
  beforeEach(() => {
    window.innerWidth = 1200;
    window.dispatchEvent(new Event('resize'));
  });
  it('renders profile image', () => {
    render(<UserProfile userInfo={{ ...userInfo, profileImageUrl: 'https://example.com/image.jpg' }} />);
    expect(screen.getByAltText('profile')).toHaveAttribute('src', 'https://example.com/image.jpg');
  });

  it('renders default image if no profileImageUrl', () => {
    render(<UserProfile userInfo={{ ...userInfo, profileImageUrl: undefined }} />);
    expect(screen.getByAltText('profile')).toHaveAttribute('src', '/icons/default_profile.svg');
  });

//   it('renders dropdown button', () => {
//     render(<UserProfile userInfo={userInfo} />);
//     expect(screen.getByRole('button')).toBeInTheDocument();
//   });

  it('dropdown is closed by default', () => {
    render(<UserProfile userInfo={userInfo} />);
    expect(screen.queryByText('Account Settings')).not.toBeInTheDocument();
  });

  it('opens dropdown menu on button click', () => {
    render(<UserProfile userInfo={{ name: 'Test User' }} />);
    fireEvent.click(screen.getByRole('button', { name: 'settings' }));
    expect(screen.getByText('Account Settings')).toBeInTheDocument();
    expect(screen.getByText('Logout')).toBeInTheDocument();
  });

  it('closes dropdown on outside click', () => {
    render(<UserProfile userInfo={{ name: 'Test User' }} />);
    fireEvent.click(screen.getByRole('button', { name: 'settings' }));
    expect(screen.getByText('Account Settings')).toBeInTheDocument();

    fireEvent.mouseDown(document.body); 
    expect(screen.queryByText('Account Settings')).not.toBeInTheDocument();
  });

  it('renders Account Settings and Logout options', () => {
    render(<UserProfile userInfo={userInfo} />);
    fireEvent.click(screen.getByRole('button', { name: 'settings' }));
    expect(screen.getByText('Account Settings')).toBeInTheDocument();
    expect(screen.getByText('Logout')).toBeInTheDocument();
  });

  it('renders user name in dropdown and tooltip', () => {
    render(<UserProfile userInfo={userInfo} />);
    fireEvent.click(screen.getByRole('button'));
    expect(screen.getByText(userInfo.title)).toBeInTheDocument();
    // Tooltip test may require more setup depending on implementation
  });

  it('navigates to profile settings on "Account Settings" click', () => {
    const push = jest.fn();
    (useRouter as jest.Mock).mockReturnValue({ push });
    render(<UserProfile userInfo={{ name: 'Test User' }} />);
    fireEvent.click(screen.getByRole('button', { name: 'dropdown' }));
    fireEvent.click(screen.getByText('Account Settings'));

    expect(push).toHaveBeenCalledWith('/settings/profile');
  });

  it('logs out properly when clicking "Logout"', () => {
    const postMessageMock = jest.fn();
    (createLogoutChannel as jest.Mock).mockReturnValue({ postMessage: postMessageMock });

    render(<UserProfile userInfo={{ name: 'Test User' }} />);
    fireEvent.click(screen.getByRole('button', { name: "logout" }));
    fireEvent.click(screen.getByText('Logout'));

    expect(clearAllAuthCookies).toHaveBeenCalled();
    expect(postMessageMock).toHaveBeenCalledWith('logout');
    expect(toast.success).toHaveBeenCalledWith(expect.stringContaining('Logged out successfully'));
  });

  it('does not show dropdown initially', () => {
    render(<UserProfile userInfo={{ name: 'Test User' }} />);
    expect(screen.queryByText('Account Settings')).not.toBeInTheDocument();
  });

  it('shows user name inside dropdown', () => {
    render(<UserProfile userInfo={{ name: 'John Doe' }} />);
    fireEvent.click(screen.getByLabelText(/dropdown/i));
    const names = screen.getAllByText('John Doe');
    expect(names.length).toBeGreaterThan(0); 
  });
});
