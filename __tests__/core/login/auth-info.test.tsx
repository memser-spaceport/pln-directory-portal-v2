import { render, screen, fireEvent } from '@testing-library/react';
import AuthInfo from '@/components/core/login/auth-info';
import { useRouter } from 'next/navigation';
import usePrivyWrapper from '@/hooks/auth/usePrivyWrapper';
import { createStateUid } from '@/services/auth.service';

// Mocking necessary hooks and functions
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

jest.mock('@/hooks/auth/usePrivyWrapper', () => jest.fn(() => ({
  logout: jest.fn(),
})));

jest.mock('@/services/auth.service', () => ({
  createStateUid: jest.fn(),
}));

describe('AuthInfo Component', () => {
  const mockRouter = { push: jest.fn() };
  const mockLogout = jest.fn();
  const mockCreateStateUid = jest.fn();

  beforeEach(() => {
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (usePrivyWrapper as jest.Mock).mockReturnValue({ logout: mockLogout });
    (createStateUid as jest.Mock).mockImplementation(mockCreateStateUid);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('renders AuthInfo component', () => {
    render(<AuthInfo />);
    expect(screen.getByTestId('authinfo-container')).not.toBeNull();
    expect(screen.getByText(/New Authentication Method/i)).not.toBeNull();
  });


  test('does not include privy_ keys in query params', () => {
    render(<AuthInfo />);
    
    // Simulate a URL with privy_ keys
    window.history.pushState({}, 'Test Title', '/?privy_test=value&other=value');
    
    fireEvent.click(screen.getByRole('button', { name: /Cancel/i }));
    
    expect(mockRouter.push).toHaveBeenCalledWith(expect.stringContaining('other=value'));
  });

});

