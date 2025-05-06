import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import LoginBtn from '@/components/core/navbar/login-btn';
import { useRouter } from 'next/navigation';
import { useAuthAnalytics } from '@/analytics/auth.analytics';
import Cookies from 'js-cookie';
import { toast } from 'react-toastify';

// Mock dependencies
jest.mock('next/navigation', () => ({ useRouter: jest.fn() }));
jest.mock('@/analytics/auth.analytics', () => ({ useAuthAnalytics: jest.fn() }));
jest.mock('js-cookie', () => ({ get: jest.fn() }));
jest.mock('react-toastify', () => ({ toast: { info: jest.fn() } }));

const mockPush = jest.fn();
const mockRefresh = jest.fn();
const mockOnLoginBtnClicked = jest.fn();
const mockToastInfo = toast.info as jest.Mock;
const mockCookiesGet = Cookies.get as jest.Mock;

// Save original window.location
const originalLocation = window.location;

/**
 * Test suite for LoginBtn component.
 * Covers all branches, lines, and edge cases for 100% coverage.
 */
describe('LoginBtn', () => {
  beforeAll(() => {
    // @ts-ignore
    delete window.location;
    // @ts-ignore
    window.location = { pathname: '/', search: '' };
  });

  afterAll(() => {
    window.location = originalLocation;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({ push: mockPush, refresh: mockRefresh });
    (useAuthAnalytics as jest.Mock).mockReturnValue({ onLoginBtnClicked: mockOnLoginBtnClicked });
    mockCookiesGet.mockReset();
    mockToastInfo.mockReset();
    // Reset window.location for each test
    window.location.pathname = '/';
    window.location.search = '';
  });

  /**
   * Should render the login button
   */
  it('renders the login button', () => {
    render(<LoginBtn />);
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
    expect(screen.getByText('Login')).toBeInTheDocument();
  });

  /**
   * Should handle click when user is logged in (cookie exists):
   * - Calls analytics
   * - Shows toast
   * - Calls router.refresh
   */
  it('handles click when user is logged in (cookie exists)', () => {
    mockCookiesGet.mockReturnValue('mockUserInfo');
    render(<LoginBtn />);
    fireEvent.click(screen.getByRole('button', { name: /login/i }));
    expect(mockOnLoginBtnClicked).toHaveBeenCalled();
    expect(mockToastInfo).toHaveBeenCalled();
    expect(mockRefresh).toHaveBeenCalled();
    expect(mockPush).not.toHaveBeenCalled();
  });

  /**
   * Should handle click when user is not logged in (cookie missing):
   * - Calls analytics
   * - Navigates to login section on current page
   */
  it('handles click when user is not logged in (cookie missing)', () => {
    mockCookiesGet.mockReturnValue(undefined);
    window.location.pathname = '/some-page';
    window.location.search = '?foo=bar';
    render(<LoginBtn />);
    fireEvent.click(screen.getByRole('button', { name: /login/i }));
    expect(mockOnLoginBtnClicked).toHaveBeenCalled();
    expect(mockToastInfo).not.toHaveBeenCalled();
    expect(mockRefresh).not.toHaveBeenCalled();
    expect(mockPush).toHaveBeenCalledWith('/some-page?foo=bar#login');
  });

  /**
   * Should handle sign-up page edge case:
   * - Navigates to /#login if on /sign-up
   */
  it('handles sign-up page edge case', () => {
    mockCookiesGet.mockReturnValue(undefined);
    window.location.pathname = '/sign-up';
    window.location.search = '';
    render(<LoginBtn />);
    fireEvent.click(screen.getByRole('button', { name: /login/i }));
    expect(mockOnLoginBtnClicked).toHaveBeenCalled();
    expect(mockPush).toHaveBeenCalledWith('/#login');
  });

  /**
   * Should handle click when search is empty and not on sign-up
   */
  it('handles click with empty search and not on sign-up', () => {
    mockCookiesGet.mockReturnValue(undefined);
    window.location.pathname = '/another-page';
    window.location.search = '';
    render(<LoginBtn />);
    fireEvent.click(screen.getByRole('button', { name: /login/i }));
    expect(mockPush).toHaveBeenCalledWith('/another-page#login');
  });

  /**
   * Should handle click when search is present and not on sign-up
   */
  it('handles click with search present and not on sign-up', () => {
    mockCookiesGet.mockReturnValue(undefined);
    window.location.pathname = '/search-page';
    window.location.search = '?q=test';
    render(<LoginBtn />);
    fireEvent.click(screen.getByRole('button', { name: /login/i }));
    expect(mockPush).toHaveBeenCalledWith('/search-page?q=test#login');
  });
}); 