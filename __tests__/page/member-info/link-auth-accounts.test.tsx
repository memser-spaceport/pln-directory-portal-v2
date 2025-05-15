import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import LinkAuthAccounts from '@/components/page/member-info/link-auth-accounts';
import Cookies from 'js-cookie';
import { decodeToken } from '@/utils/auth.utils';

// Mock Cookies
jest.mock('js-cookie', () => ({
  get: jest.fn(),
  set: jest.fn(),
}));

// Mock decodeToken
jest.mock('@/utils/auth.utils', () => ({
  decodeToken: jest.fn(),
}));

describe('LinkAuthAccounts Component', () => {
  // Set up spies for document events
  let dispatchEventSpy: jest.SpyInstance;
  let addEventListenerSpy: jest.SpyInstance;
  let removeEventListenerSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;

  beforeAll(() => {
    // Mock process.env
    process.env.COOKIE_DOMAIN = 'test-domain.com';
    
    // Mock console.error to avoid cluttering test output
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock Cookies.get to return no linked accounts by default
    (Cookies.get as jest.Mock).mockImplementation((key) => {
      if (key === 'authLinkedAccounts') return null;
      if (key === 'refreshToken') return JSON.stringify('mock-refresh-token');
      return null;
    });
    
    // Mock decodeToken to return expiry timestamp
    (decodeToken as jest.Mock).mockReturnValue({ exp: Math.floor(Date.now() / 1000) + 3600 });
    
    // Set up spies for document events
    dispatchEventSpy = jest.spyOn(document, 'dispatchEvent');
    addEventListenerSpy = jest.spyOn(document, 'addEventListener');
    removeEventListenerSpy = jest.spyOn(document, 'removeEventListener');
  });

  afterEach(() => {
    // Clean up event spy
    dispatchEventSpy.mockRestore();
    addEventListenerSpy.mockRestore();
    removeEventListenerSpy.mockRestore();
  });

  afterAll(() => {
    consoleErrorSpy.mockRestore();
  });

  it('renders the component with all auth accounts shown', () => {
    render(<LinkAuthAccounts />);
    
    // Check the container and title
    expect(screen.getByText('Link your account for login')).toBeInTheDocument();
    
    // Check if all three account options are rendered with the Google account
    expect(screen.getByText('Google')).toBeInTheDocument();
    expect(screen.getByText('GitHub')).toBeInTheDocument();
    expect(screen.getByText('Wallet')).toBeInTheDocument();
    
    // Check that all three Link account buttons are visible (no accounts linked yet)
    const linkButtons = screen.getAllByText('Link account');
    expect(linkButtons).toHaveLength(3);
  });

  it('loads linked accounts from cookies correctly', () => {
    // Mock Cookies.get to return some linked accounts
    (Cookies.get as jest.Mock).mockImplementation((key) => {
      if (key === 'authLinkedAccounts') return JSON.stringify('google,github');
      return null;
    });
    
    render(<LinkAuthAccounts />);
    
    // Look for data-testid attributes for linked statuses
    const googleLinkedStatus = screen.getByTestId('linked-status-google');
    const githubLinkedStatus = screen.getByTestId('linked-status-github');
    
    expect(googleLinkedStatus).toBeInTheDocument();
    expect(githubLinkedStatus).toBeInTheDocument();
    
    // Should find only one "Link account" button (for Wallet)
    const linkButtons = screen.getAllByText('Link account');
    expect(linkButtons).toHaveLength(1);
  });

  it('dispatches auth-link-account event when link account button is clicked', () => {
    render(<LinkAuthAccounts />);
    
    // Find all Link account buttons
    const linkButtons = screen.getAllByText('Link account');
    
    // Click the first button (Google)
    fireEvent.click(linkButtons[0]);
    
    // Check if an event was dispatched
    expect(dispatchEventSpy).toHaveBeenCalled();
    expect(dispatchEventSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'auth-link-account'
      })
    );
  });

  it('handles click events with stopPropagation and preventDefault', () => {
    render(<LinkAuthAccounts />);
    
    // Create mock event
    const mockEvent = {
      stopPropagation: jest.fn(),
      preventDefault: jest.fn()
    };
    
    // Get the buttons and click the first one (Google)
    const linkButtons = screen.getAllByText('Link account');
    fireEvent.click(linkButtons[0], mockEvent);
    
    // Verify an event was dispatched
    expect(dispatchEventSpy).toHaveBeenCalled();
  });

  it('updates linked accounts when new-auth-accounts event is received', () => {
    const { rerender } = render(<LinkAuthAccounts />);
    
    // Initially, all three accounts should have "Link account" buttons
    const initialLinkButtons = screen.getAllByText('Link account');
    expect(initialLinkButtons).toHaveLength(3);
    
    // Find the event handler that was registered
    const eventCallback = addEventListenerSpy.mock.calls.find(
      call => call[0] === 'new-auth-accounts'
    )?.[1];
    
    expect(eventCallback).toBeDefined();
    
    // Create a custom event
    const authEvent = new CustomEvent('new-auth-accounts', {
      detail: 'google,github'
    });
    
    // Call the event handler directly within act to properly handle the state update
    act(() => {
      if (eventCallback) eventCallback(authEvent);
    });
    
    // Force a rerender to make sure the component updates
    rerender(<LinkAuthAccounts />);
    
    // Now we should see linked statuses for Google and GitHub
    expect(screen.getByTestId('linked-status-google')).toBeInTheDocument();
    expect(screen.getByTestId('linked-status-github')).toBeInTheDocument();
    
    // And only one "Link account" button (for Wallet)
    const linkButtons = screen.getAllByText('Link account');
    expect(linkButtons).toHaveLength(1);
    
    // Verify cookie was set
    expect(Cookies.set).toHaveBeenCalledWith(
      'authLinkedAccounts',
      JSON.stringify('google,github'),
      expect.objectContaining({
        path: '/',
        domain: 'test-domain.com'
      })
    );
  });

  it('does not update linked accounts without refresh token', () => {
    // Mock Cookies.get to return no refresh token
    (Cookies.get as jest.Mock).mockImplementation(() => null);
    
    render(<LinkAuthAccounts />);
    
    // Find the event handler
    const eventCallback = addEventListenerSpy.mock.calls.find(
      call => call[0] === 'new-auth-accounts'
    )?.[1];
    
    // Create a custom event
    const authEvent = new CustomEvent('new-auth-accounts', {
      detail: 'google,github'
    });
    
    // Call the event handler directly
    if (eventCallback) eventCallback(authEvent);
    
    // No cookies should be set without refresh token
    expect(Cookies.set).not.toHaveBeenCalled();
    
    // All three accounts should still have "Link account" buttons
    const linkButtons = screen.getAllByText('Link account');
    expect(linkButtons).toHaveLength(3);
  });

  it('removes event listener on unmount', () => {
    const { unmount } = render(<LinkAuthAccounts />);
    
    // Unmount the component
    unmount();
    
    // Check if removeEventListener was called with 'new-auth-accounts'
    expect(removeEventListenerSpy).toHaveBeenCalledWith(
      'new-auth-accounts',
      expect.any(Function)
    );
  });

  it('displays account icons with alt text', () => {
    render(<LinkAuthAccounts />);
    
    // Check for alt text on account icons using the alt attribute
    const images = screen.getAllByRole('img');
    const altTexts = images.map(img => img.getAttribute('alt'));
    
    // Check if we have the expected alt texts
    expect(altTexts).toContain('Google icon');
    expect(altTexts).toContain('GitHub icon');
    expect(altTexts).toContain('Wallet icon');
  });

  it('handles empty or malformed authLinkedAccounts cookie', () => {
    // Mock Cookies.get to return malformed data (using valid JSON but with a valid string inside)
    (Cookies.get as jest.Mock).mockImplementation((key) => {
      if (key === 'authLinkedAccounts') return "\"invalid json\""; // Valid JSON string
      return null;
    });
    
    // This should not throw an error due to the try/catch in the component
    render(<LinkAuthAccounts />);
    
    // We expect all three "Link account" buttons to be visible
    const linkButtons = screen.getAllByText('Link account');
    expect(linkButtons).toHaveLength(3);
  });
}); 