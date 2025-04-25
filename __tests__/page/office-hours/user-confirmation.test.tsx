import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import UserConfirmation from '@/components/core/office-hours-rating/user-confirmation';
import { createFeedBack } from '@/services/office-hours.service';
import { EVENTS, FEEDBACK_RESPONSE_TYPES, OFFICE_HOURS_STEPS, TOAST_MESSAGES } from '@/utils/constants';
import { toast } from 'react-toastify';
import { IFollowUp } from '@/types/officehours.types';
import { IUserInfo } from '@/types/shared.types';

// Mock the required modules
jest.mock('@/services/office-hours.service', () => ({
  createFeedBack: jest.fn()
}));

jest.mock('react-toastify', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn()
  }
}));

jest.mock('@/analytics/notification.analytics', () => ({
  useNotificationAnalytics: jest.fn(() => ({
    onOfficeHoursFeedbackSubmitted: jest.fn(),
    onOfficeHoursFeedbackFailed: jest.fn(),
    onOfficeHoursFeedbackSuccess: jest.fn()
  }))
}));

// Sample test data
const mockFollowup: IFollowUp = {
  uid: 'followup-123',
  type: 'MEETING_SCHEDULED',
  status: 'PENDING',
  data: {},
  isDelayed: false,
  interactionUid: 'interaction-123',
  createdBy: 'user-123',
  createdAt: '2023-01-01',
  updatedAt: '2023-01-01',
  interaction: {
    uid: 'interaction-123',
    type: 'OFFICE_HOURS',
    sourceMember: {
      name: 'Source User',
      image: {
        url: 'source-image-url'
      }
    },
    targetMember: {
      name: 'John Doe',
      image: {
        url: 'target-image-url'
      }
    }
  }
};

const mockUserInfo: IUserInfo = {
  uid: 'user-123',
  name: 'Test User',
  email: 'test@example.com',
  profileImageUrl: '',
  roles: [],
  leadingTeams: []
};

const mockProps = {
  onClose: jest.fn(),
  setCurrentStep: jest.fn(),
  currentFollowup: mockFollowup,
  userInfo: mockUserInfo,
  authToken: 'mock-token'
};

describe('UserConfirmation Component', () => {
  let originalDispatchEvent: typeof document.dispatchEvent;

  beforeEach(() => {
    jest.clearAllMocks();
    // Mock document.dispatchEvent
    originalDispatchEvent = document.dispatchEvent;
    document.dispatchEvent = jest.fn();
  });

  afterEach(() => {
    // Restore document.dispatchEvent
    document.dispatchEvent = originalDispatchEvent;
  });

  test('renders correctly with member name', () => {
    render(<UserConfirmation {...mockProps} />);
    
    expect(screen.getByText(`Did you schedule Office Hours with John Doe?`)).toBeInTheDocument();
    expect(screen.getByText('No')).toBeInTheDocument();
    expect(screen.getByText('Yes')).toBeInTheDocument();
  });

  test('handles "No" button click correctly', () => {
    render(<UserConfirmation {...mockProps} />);
    
    fireEvent.click(screen.getByText('No'));
    
    expect(mockProps.setCurrentStep).toHaveBeenCalledWith(OFFICE_HOURS_STEPS?.NOT_HAPPENED?.name);
  });

  test('handles "Yes" button click successfully', async () => {
    const mockResult = { data: { success: true } };
    (createFeedBack as jest.Mock).mockResolvedValueOnce(mockResult);
    
    render(<UserConfirmation {...mockProps} />);
    
    fireEvent.click(screen.getByText('Yes'));
    
    // Check if loader is triggered
    expect(document.dispatchEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        type: EVENTS.TRIGGER_REGISTER_LOADER,
        detail: true
      })
    );
    
    await waitFor(() => {
      // Verify createFeedBack was called with correct params
      expect(createFeedBack).toHaveBeenCalledWith(
        mockProps.userInfo.uid,
        mockProps.currentFollowup.uid,
        mockProps.authToken,
        {
          data: {},
          type: 'MEETING_SCHEDULED_FEED_BACK',
          rating: 0,
          comments: [],
          response: FEEDBACK_RESPONSE_TYPES.positive.name
        }
      );
      
      // Verify loader is hidden
      expect(document.dispatchEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: EVENTS.TRIGGER_REGISTER_LOADER,
          detail: false
        })
      );
      
      // Verify toast is shown
      expect(toast.success).toHaveBeenCalledWith(TOAST_MESSAGES.FEEDBACK_INITIATED_SUCCESS);
      
      // Verify onClose was called
      expect(mockProps.onClose).toHaveBeenCalledWith(false);
    });
  });

  test('handles "Yes" button click with API error - follow-up not found', async () => {
    const mockError = { 
      error: { 
        data: { 
          message: 'There is no follow-up' 
        } 
      } 
    };
    (createFeedBack as jest.Mock).mockResolvedValueOnce(mockError);
    
    render(<UserConfirmation {...mockProps} />);
    
    fireEvent.click(screen.getByText('Yes'));
    
    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith(TOAST_MESSAGES.FEEDBACK__ALREADY__RECORDED);
      expect(mockProps.onClose).toHaveBeenCalledWith(false);
    });
  });

  test('handles "Yes" button click with generic API error', async () => {
    const mockError = { 
      error: { 
        data: { 
          message: 'Some other error' 
        } 
      } 
    };
    (createFeedBack as jest.Mock).mockResolvedValueOnce(mockError);
    
    render(<UserConfirmation {...mockProps} />);
    
    fireEvent.click(screen.getByText('Yes'));
    
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(TOAST_MESSAGES.SOMETHING_WENT_WRONG);
      expect(mockProps.onClose).toHaveBeenCalledWith(false);
    });
  });

  test('handles exception during feedback creation', async () => {
    const mockError = new Error('Network error');
    (createFeedBack as jest.Mock).mockRejectedValueOnce(mockError);
    
    // Mock console.error to prevent test output noise
    const originalConsoleError = console.error;
    console.error = jest.fn();
    
    render(<UserConfirmation {...mockProps} />);
    
    fireEvent.click(screen.getByText('Yes'));
    
    await waitFor(() => {
      expect(console.error).toHaveBeenCalledWith(mockError);
      expect(document.dispatchEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: EVENTS.TRIGGER_REGISTER_LOADER,
          detail: false
        })
      );
      expect(toast.error).toHaveBeenCalledWith(TOAST_MESSAGES.SOMETHING_WENT_WRONG);
      expect(mockProps.onClose).toHaveBeenCalledWith(false);
    });
    
    // Restore console.error
    console.error = originalConsoleError;
  });

  test('handles null currentFollowup gracefully', () => {
    const propsWithNullFollowup = {
      ...mockProps,
      currentFollowup: null
    };
    
    render(<UserConfirmation {...propsWithNullFollowup} />);
    
    // Should render without crashing
    expect(screen.getByText('Did you schedule Office Hours with undefined?')).toBeInTheDocument();
  });
});
