import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { useAuthAnalytics } from '@/analytics/auth.analytics';
import Cookies from 'js-cookie';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import LoginBtn from '@/components/core/navbar/login-btn';
import { TOAST_MESSAGES } from '@/utils/constants';

jest.mock('@/analytics/auth.analytics');
jest.mock('js-cookie');
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));
jest.mock('react-toastify');

describe('LoginBtn Component', () => {
  const mockAuthAnalytics = {
    onLoginBtnClicked: jest.fn(),
  };
  const mockRouter = {
    refresh: jest.fn(),
    push: jest.fn(),
  };

  beforeEach(() => {
    (useAuthAnalytics as jest.Mock).mockReturnValue(mockAuthAnalytics);
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    jest.clearAllMocks();
  });

  it('renders the Login button', () => {
    render(<LoginBtn />);
    const loginButton = screen.getByText('Login');
    expect(loginButton).toBeInTheDocument();
  });

  it('calls onLoginClickHandler when the button is clicked', () => {
    render(<LoginBtn />);
    const loginButton = screen.getByText('Login');
    fireEvent.click(loginButton);
    expect(mockAuthAnalytics.onLoginBtnClicked).toHaveBeenCalled();
  });

  it('shows toast message and refreshes the router when userInfo cookie is present', () => {
    (Cookies.get as jest.Mock).mockReturnValue('userInfo');
    render(<LoginBtn />);
    const loginButton = screen.getByText('Login');
    fireEvent.click(loginButton);
    expect(toast.info).toHaveBeenCalledWith(TOAST_MESSAGES.LOGGED_IN_MSG);
    expect(mockRouter.refresh).toHaveBeenCalled();
  });

  it('redirects to login when userInfo cookie is not present', () => {
    (Cookies.get as jest.Mock).mockReturnValue(null);
    render(<LoginBtn />);
    const loginButton = screen.getByText('Login');
    fireEvent.click(loginButton);
    expect(mockRouter.push).toHaveBeenCalledWith(`${window.location.pathname}${window.location.search}#login`);
  });
});