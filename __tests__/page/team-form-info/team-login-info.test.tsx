import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import LoginInfo from '@/components/page/team-form-info/team-login-info';
import { useRouter } from 'next/navigation';

// Mock next/navigation useRouter
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

describe('LoginInfo Component', () => {
  let pushMock: jest.Mock;

  beforeEach(() => {
    pushMock = jest.fn();
    (useRouter as jest.Mock).mockReturnValue({ push: pushMock });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders all static text', () => {
    render(<LoginInfo />);
    expect(screen.getByText('Login to submit a team')).toBeInTheDocument();
    expect(screen.getByText('You need to log in to submit a team.Please login to proceed.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Proceed to Login' })).toBeInTheDocument();
  });

  it('navigates to home on Cancel click', () => {
    render(<LoginInfo />);
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(pushMock).toHaveBeenCalledWith('/');
  });

  it('navigates to login hash on Proceed to Login click', () => {
    // Mock window.location
    const originalLocation = window.location;
    // @ts-ignore
    delete window.location;
    // @ts-ignore
    window.location = { pathname: '/some-path', search: '?foo=bar' };

    render(<LoginInfo />);
    fireEvent.click(screen.getByRole('button', { name: 'Proceed to Login' }));
    expect(pushMock).toHaveBeenCalledWith('/some-path?foo=bar#login', { scroll: false });

    window.location = originalLocation;
  });
}); 