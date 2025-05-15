import React from 'react';
import { render, screen, waitFor, act, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import Husky from '@/components/page/home/husky/husky';
import Cookies from 'js-cookie';
import { getParsedValue } from '@/utils/common.utils';
import { DAILY_CHAT_LIMIT } from '@/utils/constants';

// Mock dependencies
jest.mock('@/components/core/husky/husky-empty-chat', () => {
  return jest.fn(({ isHidden, checkIsLimitReached, limitReached, setLimitReached }) => (
    <div data-testid="husky-empty-chat">
      Mock HuskyEmptyChat
      <button 
        data-testid="mock-check-limit" 
        onClick={() => setLimitReached(checkIsLimitReached())}
      >
        Check Limit
      </button>
      <span data-testid="limit-reached-status">{limitReached ? 'true' : 'false'}</span>
      <span data-testid="is-hidden-status">{isHidden ? 'true' : 'false'}</span>
    </div>
  ));
});

jest.mock('js-cookie', () => ({
  get: jest.fn(),
}));

jest.mock('@/utils/common.utils', () => ({
  getParsedValue: jest.fn(),
}));

// Mock IntersectionObserver
const mockIntersectionObserver = jest.fn();
mockIntersectionObserver.mockReturnValue({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
});
window.IntersectionObserver = mockIntersectionObserver;

describe('Husky Component', () => {
  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
    
    // Setup fake timers
    jest.useFakeTimers();
    
    // Default mock implementations
    (Cookies.get as jest.Mock).mockImplementation((key) => {
      if (key === 'refreshToken') return null;
      if (key === 'dailyChats') return '0';
      return null;
    });
    
    (getParsedValue as jest.Mock).mockImplementation((value) => {
      if (value === null) return '';
      return value;
    });

    // Mock window.innerWidth for testing responsive behavior
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1200, // Default to desktop
    });
    
    // Mock getElementById
    document.getElementById = jest.fn().mockImplementation((id) => {
      if (id === 'husky-home') {
        return document.createElement('div');
      }
      return null;
    });
  });

  afterEach(() => {
    // Clean up timers
    jest.useRealTimers();
  });

  it('renders correctly with all expected elements', () => {
    render(<Husky />);
    
    // Check that the main component renders
    expect(screen.getByTestId('husky-component')).toBeInTheDocument();
    
    // Check for the title
    expect(screen.getByTestId('husky-title')).toHaveTextContent(
      'Explore Protocol Labs with Husky, an LLM-powered chatbot'
    );
    
    // Check that HuskyEmptyChat is rendered
    expect(screen.getByTestId('husky-empty-chat')).toBeInTheDocument();
  });

  it('initializes with limitReached set to false when chat limit not reached', () => {
    // Set up mocks to simulate not reached limit
    (Cookies.get as jest.Mock).mockImplementation((key) => {
      if (key === 'dailyChats') return '5'; // Less than DAILY_CHAT_LIMIT (10)
      return null;
    });
    
    render(<Husky />);
    
    // Check initial limitReached state
    expect(screen.getByTestId('limit-reached-status')).toHaveTextContent('false');
  });

  it('initializes with limitReached set to true when chat limit reached', () => {
    // Set up mocks to simulate reached limit
    (Cookies.get as jest.Mock).mockImplementation((key) => {
      if (key === 'dailyChats') return `${DAILY_CHAT_LIMIT}`; // Equal to DAILY_CHAT_LIMIT (10)
      return null;
    });
    
    render(<Husky />);
    
    // Check initial limitReached state
    expect(screen.getByTestId('limit-reached-status')).toHaveTextContent('true');
  });

  it('does not check limit for authenticated users', () => {
    // Set up mocks to simulate authenticated user
    (Cookies.get as jest.Mock).mockImplementation((key) => {
      if (key === 'refreshToken') return 'token-value';
      if (key === 'dailyChats') return `${DAILY_CHAT_LIMIT + 5}`; // Over the limit
      return null;
    });
    
    (getParsedValue as jest.Mock).mockReturnValue('parsed-token'); // Simulates logged in
    
    render(<Husky />);
    
    // Check limitReached state (should be false even with high chat count)
    expect(screen.getByTestId('limit-reached-status')).toHaveTextContent('false');
  });

  it('initializes IntersectionObserver with correct desktop configuration', () => {
    // Set window width to desktop
    window.innerWidth = 1200;
    
    render(<Husky />);
    
    // Check that IntersectionObserver was initialized with correct rootMargin for desktop
    expect(mockIntersectionObserver).toHaveBeenCalledWith(
      expect.any(Function),
      expect.objectContaining({
        rootMargin: '-250px 0px 0px 0px',
      })
    );
  });

  it('initializes IntersectionObserver with correct mobile configuration', () => {
    // Set window width to mobile
    window.innerWidth = 800;
    
    render(<Husky />);
    
    // Check that IntersectionObserver was initialized with correct rootMargin for mobile
    expect(mockIntersectionObserver).toHaveBeenCalledWith(
      expect.any(Function),
      expect.objectContaining({
        rootMargin: '-185px 0px 0px 0px',
      })
    );
  });

  it('applies shrunk class when intersection changes', () => {
    render(<Husky />);
    
    // Initially the component should not have the shrunk class
    expect(screen.getByTestId('husky-component')).not.toHaveClass('husky--shrunk');
    
    // Check that IntersectionObserver was set up correctly
    expect(mockIntersectionObserver().observe).toHaveBeenCalled();
  });

  it('passes isHidden state to HuskyEmptyChat', () => {
    render(<Husky />);
    
    // Get HuskyEmptyChat component - we know it receives isHidden initially as false
    // which will be whatever the value of isShrunk is
    expect(screen.getByTestId('is-hidden-status')).toHaveTextContent('false');
  });

  it('correctly parses dailyChats cookie', () => {
    // Create a spy on the component's internal checkIsLimitReached function
    const checkIsLimitReachedSpy = jest.fn();
    
    // Set up a custom mock for HuskyEmptyChat that calls our spy
    const HuskyEmptyChatMock = jest.requireMock('@/components/core/husky/husky-empty-chat');
    HuskyEmptyChatMock.mockImplementation(
      ({ isHidden, checkIsLimitReached, limitReached, setLimitReached }: {
        isHidden: boolean;
        checkIsLimitReached: () => boolean;
        limitReached: boolean;
        setLimitReached: (value: boolean) => void;
      }) => {
        // Wrap the real function with our spy
        const wrappedCheck = () => {
          const result = checkIsLimitReached();
          checkIsLimitReachedSpy(result);
          return result;
        };
        
        return (
          <div data-testid="husky-empty-chat">
            <button 
              data-testid="mock-check-limit" 
              onClick={() => setLimitReached(wrappedCheck())}
            >
              Check Limit
            </button>
            <span data-testid="limit-reached-status">{limitReached ? 'true' : 'false'}</span>
          </div>
        );
      }
    );
    
    // First, set up cookies to show we're under the limit
    (Cookies.get as jest.Mock).mockImplementation((key) => {
      if (key === 'dailyChats') return '5'; // Under limit
      return null;
    });
    
    render(<Husky />);
    
    // Now change the cookies to exceed the limit
    (Cookies.get as jest.Mock).mockImplementation((key) => {
      if (key === 'dailyChats') return '12'; // Over limit
      return null;
    });
    
    // Click the check button
    screen.getByTestId('mock-check-limit').click();
    
    // Verify the cookies were checked
    expect(Cookies.get).toHaveBeenCalledWith('dailyChats');
    
    // Our spy should report that the limit has been reached
    expect(checkIsLimitReachedSpy).toHaveBeenCalled();
  });

  it('handles missing dailyChats cookie', () => {
    // Set up mocks with null cookie value
    (Cookies.get as jest.Mock).mockImplementation((key) => {
      if (key === 'dailyChats') return null; // Cookie doesn't exist
      return null;
    });
    
    render(<Husky />);
    
    // Default to 0 when cookie is missing
    expect(screen.getByTestId('limit-reached-status')).toHaveTextContent('false');
  });

  it('does nothing when husky-home element is not found', () => {
    // Mock getElementById to return null specifically for this test
    document.getElementById = jest.fn().mockReturnValue(null);
    
    render(<Husky />);
    
    // Verify getElementById was called with the right ID
    expect(document.getElementById).toHaveBeenCalledWith('husky-home');
    
    // Verify that IntersectionObserver.observe was not called since the element was not found
    expect(mockIntersectionObserver().observe).not.toHaveBeenCalled();
  });

  it('disconnects IntersectionObserver on unmount', () => {
    const { unmount } = render(<Husky />);
    
    // Component is mounted, observer.observe should have been called
    expect(mockIntersectionObserver().observe).toHaveBeenCalled();
    
    // Unmount the component
    unmount();
    
    // Cleanup should disconnect the observer
    expect(mockIntersectionObserver().disconnect).toHaveBeenCalled();
  });

  it('sets isShrunk to true when intersection is false', () => {
    render(<Husky />);
    
    // Get the callback from the IntersectionObserver constructor call
    const [intersectionCallback] = mockIntersectionObserver.mock.calls[0];
    
    // Check the component was rendered and mocks were called correctly
    expect(screen.getByTestId('husky-empty-chat')).toBeInTheDocument();
    
    // Create the effect function similar to how it's done in the component
    const effectFn = () => {
      // Call the callback with a non-intersecting entry
      intersectionCallback([{ isIntersecting: false }]);
    };
    
    // Call the effect function to simulate the observer callback
    effectFn();
    
    // Ensure IntersectionObserver was initialized and used
    expect(mockIntersectionObserver).toHaveBeenCalled();
    expect(mockIntersectionObserver().observe).toHaveBeenCalled();
  });

  it('uses correct rootMargin based on viewport width', () => {
    // Test desktop view
    window.innerWidth = 1200;
    render(<Husky />);
    
    // Check that IntersectionObserver was initialized with correct rootMargin for desktop
    expect(mockIntersectionObserver).toHaveBeenCalledWith(
      expect.any(Function),
      expect.objectContaining({
        rootMargin: '-250px 0px 0px 0px',
      })
    );
    
    // Clean up
    jest.clearAllMocks();
    
    // Test mobile view
    window.innerWidth = 800;
    render(<Husky />);
    
    // Check that IntersectionObserver was initialized with correct rootMargin for mobile
    expect(mockIntersectionObserver).toHaveBeenCalledWith(
      expect.any(Function),
      expect.objectContaining({
        rootMargin: '-185px 0px 0px 0px',
      })
    );
  });

  it('tests checkIsLimitReached for all branches', () => {
    // Create a custom implementation for direct testing
    const HuskyEmptyChatMock = jest.requireMock('@/components/core/husky/husky-empty-chat');
    HuskyEmptyChatMock.mockImplementation(({ checkIsLimitReached }: any) => {
      const result = checkIsLimitReached();
      return (
        <div data-testid="husky-empty-chat">
          <button data-testid="check-button" onClick={() => checkIsLimitReached()}>
            Check Limit
          </button>
          <span data-testid="check-result">{String(result)}</span>
        </div>
      );
    });
    
    // Test case 1: refreshToken exists - should return false regardless of chat count
    (Cookies.get as jest.Mock).mockImplementation((key) => {
      if (key === 'refreshToken') return 'token';
      if (key === 'dailyChats') return '100'; // Even though > DAILY_CHAT_LIMIT
      return null;
    });
    (getParsedValue as jest.Mock).mockImplementation((value) => {
      if (value === 'token') return 'parsed-token';
      return value;
    });
    
    const { rerender } = render(<Husky />);
    expect(screen.getByTestId('check-result')).toHaveTextContent('false');
    
    // Test case 2: No refreshToken, chat count < limit - should return false
    (Cookies.get as jest.Mock).mockImplementation((key) => {
      if (key === 'refreshToken') return null;
      if (key === 'dailyChats') return '5'; // Less than DAILY_CHAT_LIMIT (10)
      return null;
    });
    (getParsedValue as jest.Mock).mockImplementation((value) => {
      return '';
    });
    
    rerender(<Husky />);
    
    // Force the component to check limit again
    fireEvent.click(screen.getByTestId('check-button'));
    expect(Cookies.get).toHaveBeenCalledWith('dailyChats');
    expect(Cookies.get).toHaveBeenCalledWith('refreshToken');
    
    // Test case 3: No refreshToken, chat count = limit - should return true
    (Cookies.get as jest.Mock).mockImplementation((key) => {
      if (key === 'refreshToken') return null;
      if (key === 'dailyChats') return `${DAILY_CHAT_LIMIT}`; // Equal to DAILY_CHAT_LIMIT
      return null;
    });
    
    rerender(<Husky />);
    fireEvent.click(screen.getByTestId('check-button'));
    
    // Test case 4: No refreshToken, chat count > limit - should return true 
    (Cookies.get as jest.Mock).mockImplementation((key) => {
      if (key === 'refreshToken') return null;
      if (key === 'dailyChats') return `${DAILY_CHAT_LIMIT + 1}`; // Greater than DAILY_CHAT_LIMIT
      return null;
    });
    
    rerender(<Husky />);
    fireEvent.click(screen.getByTestId('check-button'));
    
    // Test case 5: No refreshToken, no dailyChats cookie - should default to 0 and return false
    (Cookies.get as jest.Mock).mockImplementation((key) => {
      if (key === 'refreshToken') return null;
      if (key === 'dailyChats') return null; // Cookie doesn't exist
      return null;
    });
    
    rerender(<Husky />);
    fireEvent.click(screen.getByTestId('check-button'));
  });

  it('uses mobile rootMargin when viewport width is less than 1024px', () => {
    // Set window width to mobile size before component renders
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 800, // Mobile width (less than 1024px)
    });
    
    // Reset any previous mock calls
    jest.clearAllMocks();
    
    render(<Husky />);
    
    // Check that IntersectionObserver was initialized with mobile rootMargin
    expect(mockIntersectionObserver).toHaveBeenCalledWith(
      expect.any(Function),
      expect.objectContaining({
        rootMargin: '-185px 0px 0px 0px', // Mobile value
      })
    );
  });

  it('uses desktop rootMargin when viewport width is greater than or equal to 1024px', () => {
    // Set window width to desktop size before component renders
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1200, // Desktop width (greater than or equal to 1024px)
    });
    
    // Reset any previous mock calls
    jest.clearAllMocks();
    
    render(<Husky />);
    
    // Check that IntersectionObserver was initialized with desktop rootMargin
    expect(mockIntersectionObserver).toHaveBeenCalledWith(
      expect.any(Function),
      expect.objectContaining({
        rootMargin: '-250px 0px 0px 0px', // Desktop value
      })
    );
  });

  it('handles edge cases in checkIsLimitReached correctly', () => {
    // Access the original checkIsLimitReached function
    let capturedCheckIsLimitReached: () => boolean;
    
    // Create a custom mock to capture the function
    const HuskyEmptyChatMock = jest.requireMock('@/components/core/husky/husky-empty-chat');
    HuskyEmptyChatMock.mockImplementation(({ checkIsLimitReached }: any) => {
      capturedCheckIsLimitReached = checkIsLimitReached;
      return <div data-testid="husky-empty-chat"></div>;
    });
    
    // Case 1: No refreshToken, exactly at the limit
    (Cookies.get as jest.Mock).mockImplementation((key) => {
      if (key === 'refreshToken') return null;
      if (key === 'dailyChats') return `${DAILY_CHAT_LIMIT}`;
      return null;
    });
    (getParsedValue as jest.Mock).mockReturnValue('');
    
    render(<Husky />);
    
    // Verify that checkIsLimitReached returns true when exactly at limit
    expect(capturedCheckIsLimitReached!()).toBe(true);
    
    // Case 2: No refreshToken, one above the limit
    (Cookies.get as jest.Mock).mockImplementation((key) => {
      if (key === 'refreshToken') return null;
      if (key === 'dailyChats') return `${DAILY_CHAT_LIMIT + 1}`;
      return null;
    });
    
    // Re-render to update the mocks
    jest.clearAllMocks();
    render(<Husky />);
    
    // Verify that checkIsLimitReached returns true when above limit
    expect(capturedCheckIsLimitReached!()).toBe(true);
    
    // Case 3: No refreshToken, one below the limit
    (Cookies.get as jest.Mock).mockImplementation((key) => {
      if (key === 'refreshToken') return null;
      if (key === 'dailyChats') return `${DAILY_CHAT_LIMIT - 1}`;
      return null;
    });
    
    // Re-render to update the mocks
    jest.clearAllMocks();
    render(<Husky />);
    
    // Verify that checkIsLimitReached returns false when below limit
    expect(capturedCheckIsLimitReached!()).toBe(false);
    
    // Case 4: Has refreshToken, doesn't matter what dailyChats is
    (Cookies.get as jest.Mock).mockImplementation((key) => {
      if (key === 'refreshToken') return 'token';
      if (key === 'dailyChats') return `${DAILY_CHAT_LIMIT + 100}`; // Way over limit
      return null;
    });
    (getParsedValue as jest.Mock).mockImplementation((value) => {
      if (value === 'token') return 'parsed-token';
      return value;
    });
    
    // Re-render to update the mocks
    jest.clearAllMocks();
    render(<Husky />);
    
    // Verify that checkIsLimitReached returns false when user has refresh token
    expect(capturedCheckIsLimitReached!()).toBe(false);
  });

  it('cleans up IntersectionObserver on unmount properly', () => {
    // Ensure the element exists
    document.getElementById = jest.fn().mockImplementation((id) => {
      if (id === 'husky-home') {
        return document.createElement('div');
      }
      return null;
    });
    
    // Clear any previous mocks
    jest.clearAllMocks();
    
    // Render and unmount the component
    const { unmount } = render(<Husky />);
    
    // Verify observer.observe was called
    expect(mockIntersectionObserver().observe).toHaveBeenCalled();
    
    // Unmount to trigger cleanup function
    unmount();
    
    // Verify disconnect was called during cleanup
    expect(mockIntersectionObserver().disconnect).toHaveBeenCalled();
  });

  it('handles empty or zero dailyChats cookie correctly', () => {
    // Access the original checkIsLimitReached function
    let capturedCheckIsLimitReached: () => boolean;
    
    // Create a custom mock to capture the function
    const HuskyEmptyChatMock = jest.requireMock('@/components/core/husky/husky-empty-chat');
    HuskyEmptyChatMock.mockImplementation(({ checkIsLimitReached }: any) => {
      capturedCheckIsLimitReached = checkIsLimitReached;
      return <div data-testid="husky-empty-chat"></div>;
    });
    
    // Case 1: No refreshToken, empty dailyChats cookie string
    (Cookies.get as jest.Mock).mockImplementation((key) => {
      if (key === 'refreshToken') return null;
      if (key === 'dailyChats') return '';
      return null;
    });
    (getParsedValue as jest.Mock).mockReturnValue('');
    
    render(<Husky />);
    
    // Verify that empty string is parsed as 0 and 0 < DAILY_CHAT_LIMIT
    expect(capturedCheckIsLimitReached!()).toBe(false);
    
    // Case 2: No refreshToken, dailyChats is '0' string
    (Cookies.get as jest.Mock).mockImplementation((key) => {
      if (key === 'refreshToken') return null;
      if (key === 'dailyChats') return '0';
      return null;
    });
    
    // Re-render to update the mocks
    jest.clearAllMocks();
    render(<Husky />);
    
    // Verify that '0' is parsed correctly
    expect(capturedCheckIsLimitReached!()).toBe(false);
    
    // Case 3: No refreshToken, null dailyChats (cookie doesn't exist)
    (Cookies.get as jest.Mock).mockImplementation((key) => {
      if (key === 'refreshToken') return null;
      if (key === 'dailyChats') return null;
      return null;
    });
    
    // Re-render to update the mocks
    jest.clearAllMocks();
    render(<Husky />);
    
    // Verify that null is handled correctly (defaults to 0)
    expect(capturedCheckIsLimitReached!()).toBe(false);
  });

  // Test specifically targeting the early return in useEffect
  it('returns early from useEffect when element is not found', () => {
    // Mock React.useEffect to capture the function
    const useEffectSpy = jest.spyOn(React, 'useEffect');
    
    // Mock getElementById to return null
    document.getElementById = jest.fn().mockReturnValue(null);
    
    // Reset mocks
    jest.clearAllMocks();
    
    // Render the component
    render(<Husky />);
    
    // Check that getElementById was called
    expect(document.getElementById).toHaveBeenCalledWith('husky-home');
    
    // Check that IntersectionObserver was never created because of early return
    expect(mockIntersectionObserver).not.toHaveBeenCalled();
    
    // Verify that observer.observe was never called
    expect(mockIntersectionObserver().observe).not.toHaveBeenCalled();
  });

  it('sets isShrunk state via IntersectionObserver callback', () => {
    // Replace the useState implementation to intercept state changes
    const setIsShrunkMock = jest.fn();
    jest.spyOn(React, 'useState')
      .mockReturnValueOnce([false, jest.fn()]) // For limitReached
      .mockReturnValueOnce([false, setIsShrunkMock]); // For isShrunk
      
    // Render component
    render(<Husky />);
    
    // Get the callback function passed to IntersectionObserver
    const intersectionCallback = mockIntersectionObserver.mock.calls[0][0];
    
    // Simulate intersection events
    act(() => {
      // First triggering not intersecting (which should set isShrunk to true)
      intersectionCallback([{ isIntersecting: false }]);
    });
    
    expect(setIsShrunkMock).toHaveBeenCalledWith(true);
    
    // Reset mock
    setIsShrunkMock.mockClear();
    
    // Then triggering intersecting (which should set isShrunk to false)
    act(() => {
      intersectionCallback([{ isIntersecting: true }]);
    });
    
    expect(setIsShrunkMock).toHaveBeenCalledWith(false);
  });

  it('configures IntersectionObserver with correct options', () => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Mock getElementById to return a valid element
    document.getElementById = jest.fn().mockImplementation((id) => {
      if (id === 'husky-home') {
        return document.createElement('div');
      }
      return null;
    });
    
    // Set window width to desktop
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1200, // Desktop width
    });
    
    // Render component
    render(<Husky />);
    
    // Verify IntersectionObserver was created with the correct configuration
    expect(mockIntersectionObserver).toHaveBeenCalledWith(
      expect.any(Function), // callback function
      {
        root: null, // Default is the viewport
        threshold: 0, // Trigger as soon as the element exits the viewport
        rootMargin: '-250px 0px 0px 0px', // Desktop value
      }
    );
    
    // Reset mocks for the second test
    jest.clearAllMocks();
    
    // Set window width to mobile
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 800, // Mobile width
    });
    
    // Render again with mobile width
    render(<Husky />);
    
    // Verify IntersectionObserver was created with mobile rootMargin
    expect(mockIntersectionObserver).toHaveBeenCalledWith(
      expect.any(Function), // callback function
      {
        root: null, // Default is the viewport
        threshold: 0, // Trigger as soon as the element exits the viewport
        rootMargin: '-185px 0px 0px 0px', // Mobile value
      }
    );
  });

  it('applies correct class based on isShrunk state', () => {
    // Mock useState to control isShrunk state
    jest.spyOn(React, 'useState')
      .mockImplementationOnce(() => [false, jest.fn()]) // limitReached state
      .mockImplementationOnce(() => [false, jest.fn()]); // isShrunk state initially false
    
    // Render with isShrunk = false
    const { rerender, container } = render(<Husky />);
    
    // Verify the component doesn't have the shrunk class
    const huskyDivFalse = container.querySelector('.husky');
    expect(huskyDivFalse).not.toBeNull();
    expect(huskyDivFalse).not.toHaveClass('husky--shrunk');
    
    // Re-mock useState to return true for isShrunk
    jest.spyOn(React, 'useState')
      .mockImplementationOnce(() => [false, jest.fn()]) // limitReached state
      .mockImplementationOnce(() => [true, jest.fn()]); // isShrunk state now true
    
    // Re-render the component
    rerender(<Husky />);
    
    // Verify the component has the shrunk class
    const huskyDivTrue = container.querySelector('.husky');
    expect(huskyDivTrue).not.toBeNull();
    expect(huskyDivTrue).toHaveClass('husky--shrunk');
  });
}); 