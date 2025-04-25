import React from 'react';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import RatingContainer from '@/components/core/office-hours-rating/rating-container';
import cookies from 'js-cookie';
import { EVENTS } from '@/utils/constants';

// Mock HTMLDialogElement methods
class MockDialog {
  showModal = jest.fn();
  close = jest.fn();
}

// All jest.mock calls should come before any imports that use them
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  }),
  useSearchParams: () => ({
    get: jest.fn(),
    getAll: jest.fn(),
    has: jest.fn(),
    entries: jest.fn(),
    keys: jest.fn(),
    values: jest.fn(),
    toString: jest.fn(),
    forEach: jest.fn(),
    append: jest.fn(),
    delete: jest.fn(),
    set: jest.fn(),
    sort: jest.fn(),
    size: 0,
    [Symbol.iterator]: jest.fn(),
  }),
}));

// Use direct mock implementations inside factory functions
jest.mock('@/services/office-hours.service', () => {
  return {
    getFollowUps: jest.fn().mockResolvedValue({ data: [] }),
    patchFollowup: jest.fn().mockResolvedValue({ data: {} })
  };
});

// Mock child components
jest.mock('@/components/core/office-hours-rating/user-confirmation', () => ({
  __esModule: true,
  default: (props: any) => <div data-testid="user-confirmation">UserConfirmation</div>,
}));

jest.mock('@/components/core/office-hours-rating/not-happened', () => ({
  __esModule: true,
  default: (props: any) => <div data-testid="not-happened">NotHappened</div>,
}));

jest.mock('@/components/core/office-hours-rating/happened', () => ({
  __esModule: true,
  default: (props: any) => <div data-testid="happened">Happened</div>,
}));

jest.mock('@/components/core/register/register-form-loader', () => ({
  __esModule: true,
  default: () => <div data-testid="register-form-loader">Loader</div>,
}));

// Mock the dialog ref for testing
let mockDialogRef: MockDialog | null = null;

jest.mock('@/components/core/modal', () => ({
  __esModule: true,
  default: ({ children, modalRef, onClose }: any) => {
    // Assign our mock to the ref
    if (modalRef) {
      mockDialogRef = new MockDialog();
      modalRef.current = mockDialogRef;
    }
    return (
      <div data-testid="modal">
        <button data-testid="modal-close" onClick={onClose}>Close</button>
        {children}
      </div>
    );
  },
}));

// Mock constants
jest.mock('@/utils/constants', () => ({
  EVENTS: {
    TRIGGER_RATING_POPUP: 'trigger-notification-popup',
    GET_NOTIFICATIONS: 'get-notifications',
  },
  OFFICE_HOURS_STEPS: {
    MEETING_INITIATED: { name: 'MEETING_INITIATED' },
    NOT_HAPPENED: { name: 'not-happened' },
    MEETING_SCHEDULED: { name: 'MEETING_SCHEDULED' },
    MEETING_RESCHEDULED: { name: 'MEETING_RESCHEDULED' },
  },
  NOTIFICATION_REFETCH_TIME: 300000,
}));

// Mock js-cookie
jest.mock('js-cookie', () => ({
  get: jest.fn(),
  set: jest.fn(),
  remove: jest.fn(),
}));

// Import mocked functions AFTER they are defined by jest.mock
import { getFollowUps, patchFollowup } from '@/services/office-hours.service';

// Helper constants
const userInfo = { uid: 'user-1', name: 'Test User' };
const authToken = 'token';
const followup = {
  interactionUid: 'int-1',
  uid: 'fup-1',
  status: 'OPEN',
  type: 'MEETING_SCHEDULED',
  interaction: { targetMember: { name: 'Target User' } },
};

describe('RatingContainer', () => {
  // Store event handlers for testing
  let eventHandlers: { [key: string]: EventListener } = {};
  
  // Mock document.addEventListener and document.removeEventListener
  beforeAll(() => {
    // Save original methods
    const originalAddEventListener = document.addEventListener;
    const originalRemoveEventListener = document.removeEventListener;
    
    // Replace document.addEventListener
    document.addEventListener = jest.fn((event, handler) => {
      eventHandlers[event] = handler as EventListener;
      return originalAddEventListener.call(document, event, handler);
    });
    
    // Replace document.removeEventListener
    document.removeEventListener = jest.fn((event, handler) => {
      return originalRemoveEventListener.call(document, event, handler);
    });
  });
  
  afterAll(() => {
    // Restore original document methods
    jest.restoreAllMocks();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockDialogRef = null;
    eventHandlers = {};
    // @ts-ignore
    cookies.get.mockReset();
    // @ts-ignore
    cookies.remove.mockReset();
    // @ts-ignore - The imported mock functions
    getFollowUps.mockReset();
    // @ts-ignore
    patchFollowup.mockReset();
  });

  it('renders modal and loader', () => {
    render(<RatingContainer isLoggedIn={false} authToken={authToken} userInfo={userInfo} />);
    expect(screen.getByTestId('modal')).toBeInTheDocument();
    expect(screen.getByTestId('register-form-loader')).toBeInTheDocument();
  });

  it('does not call getRecentBooking if not logged in', () => {
    render(<RatingContainer isLoggedIn={false} authToken={authToken} userInfo={userInfo} />);
    expect(getFollowUps).not.toHaveBeenCalled();
  });

  it('calls getRecentBooking and shows UserConfirmation if MEETING_INITIATED', async () => {
    // @ts-ignore
    cookies.get.mockImplementation((key) => (key === 'showNotificationPopup' ? 'true' : undefined));
    // @ts-ignore
    getFollowUps.mockResolvedValueOnce({
      data: [{ ...followup, type: 'MEETING_INITIATED' }],
    });
    render(<RatingContainer isLoggedIn={true} authToken={authToken} userInfo={userInfo} />);
    await waitFor(() => expect(screen.getByTestId('user-confirmation')).toBeInTheDocument());
    expect(cookies.remove).toHaveBeenCalledWith('showNotificationPopup');
  });

  it('shows NotHappened if currentStep is NOT_HAPPENED', async () => {
    // @ts-ignore
    cookies.get.mockImplementation((key) => (key === 'showNotificationPopup' ? 'true' : undefined));
    // @ts-ignore
    getFollowUps.mockResolvedValueOnce({
      data: [{ ...followup, type: 'not-happened' }],
    });
    render(<RatingContainer isLoggedIn={true} authToken={authToken} userInfo={userInfo} />);
    await waitFor(() => expect(screen.getByTestId('not-happened')).toBeInTheDocument());
  });

  it('shows Happened if currentStep is MEETING_SCHEDULED', async () => {
    // @ts-ignore
    cookies.get.mockImplementation((key) => (key === 'showNotificationPopup' ? 'true' : undefined));
    // @ts-ignore
    getFollowUps.mockResolvedValueOnce({
      data: [{ ...followup, type: 'MEETING_SCHEDULED' }],
    });
    render(<RatingContainer isLoggedIn={true} authToken={authToken} userInfo={userInfo} />);
    await waitFor(() => expect(screen.getByTestId('happened')).toBeInTheDocument());
  });

  it('shows Happened if currentStep is MEETING_RESCHEDULED', async () => {
    // @ts-ignore
    cookies.get.mockImplementation((key) => (key === 'showNotificationPopup' ? 'true' : undefined));
    // @ts-ignore
    getFollowUps.mockResolvedValueOnce({
      data: [{ ...followup, type: 'MEETING_RESCHEDULED' }],
    });
    render(<RatingContainer isLoggedIn={true} authToken={authToken} userInfo={userInfo} />);
    await waitFor(() => expect(screen.getByTestId('happened')).toBeInTheDocument());
  });

  it('calls patchFollowup and closes modal on close click', async () => {
    // @ts-ignore
    cookies.get.mockImplementation((key) => (key === 'showNotificationPopup' ? 'true' : undefined));
    // @ts-ignore
    getFollowUps.mockResolvedValueOnce({
      data: [{ ...followup, type: 'MEETING_SCHEDULED' }],
    });
    render(<RatingContainer isLoggedIn={true} authToken={authToken} userInfo={userInfo} />);
    await waitFor(() => expect(screen.getByTestId('happened')).toBeInTheDocument());
    // Simulate close
    fireEvent.click(screen.getByTestId('modal-close'));
    await waitFor(() => expect(patchFollowup).toHaveBeenCalled());
  });

  it('does not call patchFollowup if followup is closed', async () => {
    // @ts-ignore
    cookies.get.mockImplementation((key) => (key === 'showNotificationPopup' ? 'true' : undefined));
    // @ts-ignore
    getFollowUps.mockResolvedValueOnce({
      data: [{ ...followup, status: 'CLOSED', type: 'MEETING_SCHEDULED' }],
    });
    render(<RatingContainer isLoggedIn={true} authToken={authToken} userInfo={userInfo} />);
    await waitFor(() => expect(screen.getByTestId('happened')).toBeInTheDocument());
    fireEvent.click(screen.getByTestId('modal-close'));
    await waitFor(() => expect(patchFollowup).not.toHaveBeenCalled());
  });

  it('registers event listener for TRIGGER_RATING_POPUP and calls updateNotification when triggered (lines 108-109)', async () => {
    render(<RatingContainer isLoggedIn={true} authToken={authToken} userInfo={userInfo} />);
    
    // Verify that event listener was registered
    expect(document.addEventListener).toHaveBeenCalledWith(
      EVENTS.TRIGGER_RATING_POPUP,
      expect.any(Function)
    );
    
    // Get the stored event handler
    const eventHandler = eventHandlers[EVENTS.TRIGGER_RATING_POPUP];
    expect(eventHandler).toBeDefined();
    
    // Create a custom event with notification detail
    const customEvent = new CustomEvent(EVENTS.TRIGGER_RATING_POPUP, {
      detail: { notification: { ...followup, type: 'MEETING_SCHEDULED' } },
    });
    
    // Manually trigger the event handler with our custom event
    act(() => {
      eventHandler(customEvent);
    });
    
    // Verify the dialog's showModal was called
    expect(mockDialogRef?.showModal).toHaveBeenCalled();
    
    // Verify the correct component is shown after state update
    await waitFor(() => expect(screen.getByTestId('happened')).toBeInTheDocument());
  });
  
  it('removes event listener on unmount (lines 118-119)', () => {
    // Render and then immediately unmount to test cleanup
    const { unmount } = render(<RatingContainer isLoggedIn={true} authToken={authToken} userInfo={userInfo} />);
    
    // Check that addEventListener was called
    expect(document.addEventListener).toHaveBeenCalledWith(
      EVENTS.TRIGGER_RATING_POPUP,
      expect.any(Function)
    );
    
    // Store the handler before unmounting
    const eventHandler = eventHandlers[EVENTS.TRIGGER_RATING_POPUP];
    
    // Unmount the component
    unmount();
    
    // Verify removeEventListener was called with the same event name and a function
    expect(document.removeEventListener).toHaveBeenCalledWith(
      EVENTS.TRIGGER_RATING_POPUP,
      expect.any(Function)
    );
  });
  
  it('handles error case in onCloseClickHandler', async () => {
    // Setup a rejected promise for patchFollowup
    // @ts-ignore
    patchFollowup.mockRejectedValueOnce(new Error('Test error'));
    
    // @ts-ignore
    cookies.get.mockImplementation((key) => (key === 'showNotificationPopup' ? 'true' : undefined));
    // @ts-ignore
    getFollowUps.mockResolvedValueOnce({
      data: [{ ...followup, type: 'MEETING_SCHEDULED' }],
    });
    
    // Mock console.error to prevent actual errors in test output
    const originalConsoleError = console.error;
    console.error = jest.fn();
    
    render(<RatingContainer isLoggedIn={true} authToken={authToken} userInfo={userInfo} />);
    await waitFor(() => expect(screen.getByTestId('happened')).toBeInTheDocument());
    
    // Simulate close - this should call onCloseClickHandler which has a try/catch
    fireEvent.click(screen.getByTestId('modal-close'));
    
    // Wait for the error to be caught
    await waitFor(() => {
      expect(console.error).toHaveBeenCalled();
      expect(mockDialogRef?.close).toHaveBeenCalled();
    });
    
    // Restore console.error
    console.error = originalConsoleError;
  });

  it('handles getRecentBooking with no notifications', async () => {
    // @ts-ignore
    cookies.get.mockImplementation((key) => (key === 'showNotificationPopup' ? 'true' : undefined));
    // @ts-ignore
    getFollowUps.mockResolvedValueOnce({ data: [] });
    render(<RatingContainer isLoggedIn={true} authToken={authToken} userInfo={userInfo} />);
    await waitFor(() => expect(screen.getByTestId('modal')).toBeInTheDocument());
    expect(screen.queryByTestId('user-confirmation')).not.toBeInTheDocument();
    expect(screen.queryByTestId('not-happened')).not.toBeInTheDocument();
    expect(screen.queryByTestId('happened')).not.toBeInTheDocument();
  });

  it('handles getRecentBooking with filter for MEETING_SCHEDULED', async () => {
    // @ts-ignore
    cookies.get.mockImplementation((key) => (key === 'showNotificationPopup' ? 'true' : undefined));
    // @ts-ignore
    getFollowUps.mockResolvedValueOnce({
      data: [
        { ...followup, type: 'MEETING_INITIATED' },
        { ...followup, type: 'MEETING_SCHEDULED' },
      ],
    });
    render(<RatingContainer isLoggedIn={true} authToken={authToken} userInfo={userInfo} />);
    await waitFor(() => expect(screen.getByTestId('happened')).toBeInTheDocument());
  });
});
