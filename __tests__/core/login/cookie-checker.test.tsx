import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import CookieChecker from '../../../components/core/login/cookie-checker';
import Cookies from 'js-cookie';

// Mock js-cookie
jest.mock('js-cookie');

// Mock analytics
const onSessionExpiredLoginClicked = jest.fn();
jest.mock('@/analytics/common.analytics', () => ({
  useCommonAnalytics: () => ({
    onSessionExpiredLoginClicked,
  }),
}));

// Mock HTMLDialogElement's methods that are not implemented in JSDOM
// Use type assertion to avoid TypeScript errors
(HTMLDialogElement.prototype.showModal as jest.Mock) = jest.fn();
(HTMLDialogElement.prototype.close as jest.Mock) = jest.fn();

// Mock window reload and location
const mockReload = jest.fn();
const mockLocation = {
  pathname: '/current-page',
  search: '?param=value',
  href: 'https://example.com/current-page',
  reload: mockReload,
};

// Save original implementation
const originalLocation = { ...window.location };

describe('CookieChecker', () => {
  // Set up and teardown for each test
  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Reset our mock functions
    mockReload.mockClear();
    
    // Mock window.location without using delete
    // This works because we're assigning to properties that TypeScript knows exist
    Object.defineProperty(window, 'location', {
      value: mockLocation,
      writable: true,
    });
  });

  // Restore window.location after tests
  afterAll(() => {
    Object.defineProperty(window, 'location', {
      value: originalLocation,
      writable: true,
    });
  });

  it('renders without errors', () => {
    render(<CookieChecker isLoggedIn={false} />);
    // Expect component to render (no session expired dialog by default for logged out user)
    expect(HTMLDialogElement.prototype.showModal).not.toHaveBeenCalled();
  });

  it('checks cookies when isLoggedIn is true but refreshToken is missing', () => {
    // Mock cookie to be missing
    (Cookies.get as jest.Mock).mockReturnValue(undefined);
    
    render(<CookieChecker isLoggedIn={true} />);
    
    // Verify dialog is shown
    expect(HTMLDialogElement.prototype.showModal).toHaveBeenCalled();
  });

  it('does not show dialog when isLoggedIn is true and refreshToken exists', () => {
    // Mock refreshToken cookie to exist
    (Cookies.get as jest.Mock).mockReturnValue('valid-token');
    
    render(<CookieChecker isLoggedIn={true} />);
    
    // Verify dialog is NOT shown
    expect(HTMLDialogElement.prototype.showModal).not.toHaveBeenCalled();
  });

  it('does not show dialog when isLoggedIn is false, regardless of cookie', () => {
    // Mock cookie to be missing
    (Cookies.get as jest.Mock).mockReturnValue(undefined);
    
    render(<CookieChecker isLoggedIn={false} />);
    
    // Verify dialog is NOT shown for logged out users
    expect(HTMLDialogElement.prototype.showModal).not.toHaveBeenCalled();
  });

  it('handles onClose action and reloads the page', () => {
    // Mock cookie to be missing to show dialog
    (Cookies.get as jest.Mock).mockReturnValue(undefined);
    
    render(<CookieChecker isLoggedIn={true} />);
    
    // Find and click close button
    const closeButton = screen.getByAltText('close');
    fireEvent.click(closeButton);
    
    // Verify dialog is closed
    expect(HTMLDialogElement.prototype.close).toHaveBeenCalled();
    
    // Verify page is reloaded
    expect(mockReload).toHaveBeenCalled();
  });

  it('handles onLogin action, triggers analytics, and redirects to login', () => {
    // Mock cookie to be missing to show dialog
    (Cookies.get as jest.Mock).mockReturnValue(undefined);
    
    render(<CookieChecker isLoggedIn={true} />);
    
    // Find and click login button
    const loginButton = screen.getByText('Login');
    fireEvent.click(loginButton);
    
    // Verify analytics called
    expect(onSessionExpiredLoginClicked).toHaveBeenCalled();
    
    // Verify redirection
    expect(window.location.href).toBe('/current-page?param=value#login');
    
    // Verify page is reloaded
    expect(mockReload).toHaveBeenCalled();
  });

  it('updates isUserLoggedIn state when isLoggedIn prop changes', () => {
    // Start with isLoggedIn=false
    const { rerender } = render(<CookieChecker isLoggedIn={false} />);
    
    // Should not show dialog initially
    expect(HTMLDialogElement.prototype.showModal).not.toHaveBeenCalled();
    
    // Mock cookie to be missing
    (Cookies.get as jest.Mock).mockReturnValue(undefined);
    
    // Update to isLoggedIn=true
    rerender(<CookieChecker isLoggedIn={true} />);
    
    // Now should show dialog because isLoggedIn=true but no refreshToken
    expect(HTMLDialogElement.prototype.showModal).toHaveBeenCalled();
  });

  it('checks cookie expiry periodically', () => {
    // Mock timers to test interval
    jest.useFakeTimers();
    
    // First, refreshToken exists
    (Cookies.get as jest.Mock).mockReturnValue('valid-token');
    
    render(<CookieChecker isLoggedIn={true} />);
    
    // Initial check shouldn't show dialog
    expect(HTMLDialogElement.prototype.showModal).not.toHaveBeenCalled();
    
    // Now, simulate token expiry by returning undefined
    (Cookies.get as jest.Mock).mockReturnValue(undefined);
    
    // Advance timer by the cookie check interval (10 minutes = 600,000ms)
    act(() => {
      jest.advanceTimersByTime(600000);
    });
    
    // Now dialog should be shown
    expect(HTMLDialogElement.prototype.showModal).toHaveBeenCalled();
    
    // Clean up
    jest.useRealTimers();
  });

  it('cleans up interval on unmount', () => {
    // Mock clearInterval to check if it's called on unmount
    const clearIntervalSpy = jest.spyOn(window, 'clearInterval');
    
    const { unmount } = render(<CookieChecker isLoggedIn={true} />);
    
    // Unmount component
    unmount();
    
    // Should have called clearInterval
    expect(clearIntervalSpy).toHaveBeenCalled();
    
    // Clean up
    clearIntervalSpy.mockRestore();
  });
}); 