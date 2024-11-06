import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { IUserInfo } from '@/types/shared.types';
import { toast } from 'react-toastify';
import UserProfile from '@/components/core/navbar/userProfile';

jest.mock('react-toastify', () => ({
  toast: {
    success: jest.fn(),
  },
}));

const mockPush = jest.fn();
const mockPostMessage = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

jest.mock('@/components/core/login/broadcast-channel', () => ({
  createLogoutChannel: () => ({
    postMessage: mockPostMessage,
  }),
}));

const mockUserInfo: IUserInfo = {
  name: 'John Doe',
  profileImageUrl: '/path/to/image.jpg',
};

describe('UserProfile Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly with userInfo', () => {
    render(<UserProfile userInfo={mockUserInfo} />);
    expect(screen.getByAltText('profile')).toBeInTheDocument();
    expect(screen.getByAltText('dropdown')).toBeInTheDocument();
  });

  it('renders correctly without userInfo', () => {
    render(<UserProfile userInfo={{ name: 'John Doe', profileImageUrl: '' }} />);
    const profileImage = screen.getByAltText('profile');
    expect(profileImage).toBeInTheDocument();
    expect(profileImage).toHaveAttribute('src', '/icons/default_profile.svg');
  });

  it('toggles dropdown on button click', () => {
    render(<UserProfile userInfo={mockUserInfo} />);
    const dropdownButton = screen.getByAltText('dropdown');
    fireEvent.click(dropdownButton);
    expect(screen.getByText('Account Settings')).toBeInTheDocument();
    fireEvent.click(dropdownButton);
    expect(screen.queryByText('Account Settings')).not.toBeInTheDocument();
  });

  it('closes dropdown when clicking outside', () => {
    render(<UserProfile userInfo={mockUserInfo} />);
    const dropdownButton = screen.getByAltText('dropdown');
    fireEvent.click(dropdownButton);
    expect(screen.getByText('Account Settings')).toBeInTheDocument();
    fireEvent.click(document.body);
    expect(screen.queryByText('Account Settings')).not.toBeInTheDocument();
  });

  it('handles logout correctly', () => {
    render(<UserProfile userInfo={mockUserInfo} />);
    const dropdownButton = screen.getByAltText('dropdown');
    fireEvent.click(dropdownButton);
    const logoutButton = screen.getByText('Logout');
    fireEvent.click(logoutButton);
    expect(toast.success).toHaveBeenCalledWith('You have been logged out successfully');
    expect(mockPostMessage).toHaveBeenCalledWith('logout');
  });

  it('navigates to account settings on button click', () => {
    render(<UserProfile userInfo={mockUserInfo} />);
    const dropdownButton = screen.getByAltText('dropdown');
    fireEvent.click(dropdownButton);
    const settingsButton = screen.getByText('Account Settings');
    fireEvent.click(settingsButton);
    expect(mockPush).toHaveBeenCalledWith('/settings/profile');
  });
});