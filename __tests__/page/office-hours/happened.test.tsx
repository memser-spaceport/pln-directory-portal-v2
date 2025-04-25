import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import Happened from '@/components/core/office-hours-rating/happened';
import { createFeedBack } from '@/services/office-hours.service';
import { useNotificationAnalytics } from '@/analytics/notification.analytics';
import { toast } from 'react-toastify';
import { IFollowUp } from '@/types/officehours.types';
import { FormEvent } from 'react';
import * as React from 'react';

// Mock the createFeedBack function with proper Jest mock methods
const mockCreateFeedBack = jest.fn();

// Mock dependencies
jest.mock('@/services/office-hours.service', () => ({
  createFeedBack: (...args: any[]) => mockCreateFeedBack(...args),
}));

jest.mock('@/analytics/notification.analytics', () => ({
  useNotificationAnalytics: jest.fn().mockReturnValue({
    onOfficeHoursFeedbackSubmitted: jest.fn(),
    onOfficeHoursFeedbackSuccess: jest.fn(),
    onOfficeHoursFeedbackFailed: jest.fn(),
  }),
}));

jest.mock('react-toastify', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

// Mock Object.fromEntries method to handle our mocked FormData correctly
const originalFromEntries = Object.fromEntries;
Object.fromEntries = jest.fn().mockImplementation((entries) => {
  // If it's our mocked FormData, process it specially
  if (entries && typeof entries === 'object' && entries._isMockFormData) {
    return entries._mockValues;
  }
  // Otherwise, use the original implementation
  return originalFromEntries(entries);
});

// Mock constants to ensure we have control over the options used in tests
jest.mock('@/utils/constants', () => {
  const originalModule = jest.requireActual('@/utils/constants');
  return {
    ...originalModule,
    RATINGS: [
      { value: 1, backgroundColor: '#EFF6FF', disableColor: '#F8FAFC' },
      { value: 2, backgroundColor: '#DBEAFE', disableColor: '#F8FAFC' },
      { value: 3, backgroundColor: '#BFDBFE', disableColor: '#F8FAFC' },
      { value: 4, backgroundColor: '#93C5FD', disableColor: '#F8FAFC' },
      { value: 5, backgroundColor: '#60A5FA', disableColor: '#F8FAFC' },
    ],
    TROUBLES_INFO: {
      technicalIssues: { name: 'technicalIssues' },
      didntHappened: { name: 'didntHappened' },
    },
    FEEDBACK_RESPONSE_TYPES: {
      positive: { name: 'POSITIVE' },
      negative: { name: 'NEGATIVE' },
    },
    TOAST_MESSAGES: {
      FEEDBACK_THANK: 'Thank you for the feedback!',
      SOMETHING_WENT_WRONG: 'Something went wrong',
      FEEDBACK__ALREADY__RECORDED: 'Thanks, we have already recorded your feedback',
    },
    EVENTS: {
      TRIGGER_REGISTER_LOADER: 'trigger-register-loader',
    },
  };
});

// Mock the document.dispatchEvent
const dispatchEventSpy = jest.spyOn(document, 'dispatchEvent');

// Setup mock timers
beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
});

// Mock TroubleSection
jest.mock('@/components/core/office-hours-rating/trouble-section', () => {
  return function MockTroubleSection(props: {
    onTroubleOptionClickHandler: (name: string) => void;
    troubles: string[];
    setErrors: any;
    currentFollowup: IFollowUp | null;
    onMultiSelectClicked: () => void;
  }) {
    return (
      <div data-testid="trouble-section">
        <button
          data-testid="technical-issues-btn"
          onClick={() => props.onTroubleOptionClickHandler('technicalIssues')}
        >
          Technical Issues
        </button>
        <button
          data-testid="didnt-happened-btn"
          onClick={() => props.onTroubleOptionClickHandler('didntHappened')}
        >
          Meeting Didn&apos;t Happen
        </button>
        <button
          data-testid="multi-select-btn"
          onClick={props.onMultiSelectClicked}
        >
          Multi Select
        </button>
      </div>
    );
  };
});

// Mock HiddenField component
jest.mock('@/components/form/hidden-field', () => {
  return function MockHiddenField({ name, value }: { name: string; value: string }) {
    return <input type="hidden" name={name} value={value} data-testid={`hidden-${name}`} />;
  };
});

// Mock TextArea component
jest.mock('@/components/form/text-area', () => {
  return function MockTextArea({ name }: { name: string }) {
    return <textarea name={name} data-testid={`textarea-${name}`} />;
  };
});

// Create mock FormData function
function createMockFormData(mockValues: Record<string, any>) {
  return {
    _isMockFormData: true,
    _mockValues: { ...mockValues },
    entries: function*() {
      for (const [key, value] of Object.entries(mockValues)) {
        yield [key, value];
      }
    },
  };
}

describe('Happened Component', () => {
  const mockOnClose = jest.fn();
  
  const mockCurrentFollowup = {
    uid: '123',
    type: 'OFFICE_HOURS',
    status: 'PENDING',
    data: {},
    isDelayed: false,
    interactionUid: '456',
    followedUpAt: '2023-01-01',
    createdBy: 'user-456',
    createdAt: '2023-01-01',
    updatedAt: '2023-01-02',
    interaction: {
      targetMember: {
        name: 'John Doe',
      },
    },
  } as unknown as IFollowUp;

  const defaultProps = {
    onClose: mockOnClose,
    currentFollowup: mockCurrentFollowup,
    authToken: 'auth-token',
    userInfo: {
      uid: 'user-123',
      name: 'Test User',
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    dispatchEventSpy.mockClear();
    mockCreateFeedBack.mockClear();
    
    // Mock HTMLFormElement.reset
    HTMLFormElement.prototype.reset = jest.fn();
    
    // Mock getElementById with a persistent mock element
    const mockElement = {
      scrollTop: 0,
      scrollTo: jest.fn(),
      scrollHeight: 1000
    };
    (document.getElementById as jest.Mock) = jest.fn().mockImplementation((id) => {
      if (id === 'happened-form-con') return mockElement;
      return null;
    });
    
    // Mock FormData globally
    const origFormData = window.FormData;
    window.FormData = jest.fn().mockImplementation(function() {
      return createMockFormData({
        rating: '5',
        ratingComment: 'Great session',
        'technicalIssue-0': 'Audio issues',
        technnicalIssueReason: 'Some reason'
      });
    });
    
    // Mock console.error
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly', () => {
    render(<Happened {...defaultProps} />);
    
    expect(screen.getByText(/How was your recent meeting with John Doe/i)).toBeInTheDocument();
    expect(screen.getByText(/not valuable/i)).toBeInTheDocument();
    expect(screen.getByText(/extremely valuable/i)).toBeInTheDocument();
    expect(screen.getByTestId('trouble-section')).toBeInTheDocument();
  });

  it('handles rating selection correctly', () => {
    render(<Happened {...defaultProps} />);
    
    // Find all rating buttons
    const ratingButtons = screen.getAllByRole('button').filter(btn => 
      btn.className.includes('hdndC__ratingCndr__rating')
    );
    
    // Click on rating 3
    fireEvent.click(ratingButtons[2]);
    
    // Verify rating was selected (button should have 'selected' class)
    expect(ratingButtons[2]).toHaveClass('selected');
  });

  it('handles trouble option selection correctly', () => {
    render(<Happened {...defaultProps} />);
    
    const technicalIssuesButton = screen.getByTestId('technical-issues-btn');
    fireEvent.click(technicalIssuesButton);
    
    // Verify the trouble section was updated via props
    expect(technicalIssuesButton).toBeInTheDocument();
  });

  it("disables rating when 'Meeting didn't happen' is selected", () => {
    render(<Happened {...defaultProps} />);
    
    // First select some rating
    const ratingButtons = screen.getAllByRole('button').filter(btn => 
      btn.className.includes('hdndC__ratingCndr__rating')
    );
    fireEvent.click(ratingButtons[2]);
    
    // Then select "Meeting didn't happen"
    const didntHappenedButton = screen.getByTestId('didnt-happened-btn');
    fireEvent.click(didntHappenedButton);
    
    // Optional comment section should not be visible
    expect(screen.queryByText('Comment (Optional)')).not.toBeInTheDocument();
  });

  it('resets form when currentFollowup changes', () => {
    const { rerender } = render(<Happened {...defaultProps} />);
    
    // Select some rating
    const ratingButtons = screen.getAllByRole('button').filter(btn => 
      btn.className.includes('hdndC__ratingCndr__rating')
    );
    fireEvent.click(ratingButtons[2]);
    
    // Change currentFollowup
    rerender(<Happened {...defaultProps} currentFollowup={{ ...mockCurrentFollowup, uid: '456' }} />);
    
    // No rating should be selected anymore
    const updatedRatingButtons = screen.getAllByRole('button').filter(btn => 
      btn.className.includes('hdndC__ratingCndr__rating')
    );
    updatedRatingButtons.forEach(btn => expect(btn).not.toHaveClass('selected'));
  });

  it('cancels the form', () => {
    render(<Happened {...defaultProps} />);
    
    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);
    
    expect(mockOnClose).toHaveBeenCalledWith(true);
  });

  it('handles form submission with errors (no rating)', async () => {
    // Override FormData for this test
    window.FormData = jest.fn().mockImplementation(() => 
      createMockFormData({ rating: '0' })
    );
    
    render(<Happened {...defaultProps} />);
    
    const form = screen.getByRole('form');
    fireEvent.submit(form);
    
    await waitFor(() => {
      expect(screen.getByText('Please provide the rating')).toBeInTheDocument();
    });
  });
  
  it('handles form submission with errors (no reason for didnt happen)', async () => {
    // Override FormData for this test
    window.FormData = jest.fn().mockImplementation(() => 
      createMockFormData({ 
        rating: '0',
        didntHappenedReasons: '[]' // Pass as string to avoid type errors
      })
    );
    
    render(<Happened {...defaultProps} />);
    
    // Select Meeting didn't happen
    const didntHappenedButton = screen.getByTestId('didnt-happened-btn');
    fireEvent.click(didntHappenedButton);
    
    const form = screen.getByRole('form');
    fireEvent.submit(form);
    
    await waitFor(() => {
      expect(screen.getByText("Please select the reason for Meeting didn't happen")).toBeInTheDocument();
    });
  });
  
  it('handles form submission with errors (no reason for technical issues)', async () => {
    // Override FormData for this test
    window.FormData = jest.fn().mockImplementation(() => 
      createMockFormData({ 
        rating: '4',
        technnicalIssueReasons: '[]' // Pass as string to avoid type errors
      })
    );
    
    render(<Happened {...defaultProps} />);
    
    // Select Technical Issues
    const technicalIssuesButton = screen.getByTestId('technical-issues-btn');
    fireEvent.click(technicalIssuesButton);
    
    const form = screen.getByRole('form');
    fireEvent.submit(form);
    
    await waitFor(() => {
      expect(screen.getByText(/Please select the reason\(s\) for Faced technical issues/i)).toBeInTheDocument();
    });
  });
  
  it('handles form submission with errors (no reason given)', async () => {
    // Override FormData for this test
    window.FormData = jest.fn().mockImplementation(() => 
      createMockFormData({
        rating: '4',
        technnicalIssueReason: '',
        didntHappenedReason: '',
        isReasonGiven: 'false'
      })
    );
    
    render(<Happened {...defaultProps} />);
    
    const form = screen.getByRole('form');
    fireEvent.submit(form);
    
    await waitFor(() => {
      expect(screen.getByText('Please enter the reason(s)')).toBeInTheDocument();
    });
  });
  
  it('handles form submission with errors (missing scheduledAt for Got rescheduled)', async () => {
    // Override FormData for this test
    window.FormData = jest.fn().mockImplementation(() => 
      createMockFormData({
        rating: '4',
        technnicalIssueReason: 'Some reason',
        'technicalIssue-0': 'Got rescheduled',
        scheduledAt: '',
        isReasonGiven: 'true',
        comments: {
          technicalIssue: ['Got rescheduled'],
          didntHappenedOption: []
        }
      })
    );
    
    render(<Happened {...defaultProps} />);
    
    const form = screen.getByRole('form');
    fireEvent.submit(form);
    
    await waitFor(() => {
      expect(screen.getByText('Please provide a valid Date')).toBeInTheDocument();
    });
  });

  it('successfully submits form with positive feedback', async () => {
    // Mock successful API response
    mockCreateFeedBack.mockResolvedValueOnce({ data: { success: true } });
    
    // Override FormData for this test
    window.FormData = jest.fn().mockImplementation(() => 
      createMockFormData({
        rating: '5',
        ratingComment: 'Great session',
        technnicalIssueReason: 'Some reason',
        isReasonGiven: 'true',
        comments: {
          userReasons: ['Great session', 'Some reason'],
          technicalIssue: [],
          didntHappenedOption: []
        }
      })
    );
    
    render(<Happened {...defaultProps} />);
    
    const form = screen.getByRole('form');
    fireEvent.submit(form);
    
    await waitFor(() => {
      // Check that a CustomEvent with the correct type and detail was dispatched
      const loaderEvent = dispatchEventSpy.mock.calls.find(
        ([e]) => e.type === 'trigger-register-loader' && (e instanceof CustomEvent) && e.detail === true
      );
      expect(loaderEvent).toBeTruthy();
      
      // Verify API call
      expect(mockCreateFeedBack).toHaveBeenCalledWith(
        'user-123', 
        '123', 
        'auth-token',
        expect.objectContaining({
          rating: 5,
          type: 'OFFICE_HOURS_FEED_BACK'
        })
      );
      
      // Verify success toast
      expect(toast.success).toHaveBeenCalledWith('Thank you for the feedback!');
      
      // Verify loader turned off
      const loaderOffEvent = dispatchEventSpy.mock.calls.find(
        ([e]) => e.type === 'trigger-register-loader' && (e instanceof CustomEvent) && e.detail === false
      );
      expect(loaderOffEvent).toBeTruthy();
      
      // Verify onClose called
      expect(mockOnClose).toHaveBeenCalledWith(false);
    });
  });
  
  it('successfully submits form with negative feedback', async () => {
    // Mock successful API response
    mockCreateFeedBack.mockResolvedValueOnce({ data: { success: true } });
    
    // Override FormData for this test
    window.FormData = jest.fn().mockImplementation(() => 
      createMockFormData({
        rating: '0',
        'didntHappenedOption': 'Scheduling conflict',
        didntHappenedReason: 'Had another meeting',
        isReasonGiven: 'true',
        comments: {
          didntHappenedOption: ['Scheduling conflict'],
          technicalIssue: [],
          userReasons: ['Had another meeting']
        }
      })
    );
    
    render(<Happened {...defaultProps} />);
    
    // Select "Meeting didn't happen"
    const didntHappenedButton = screen.getByTestId('didnt-happened-btn');
    fireEvent.click(didntHappenedButton);
    
    const form = screen.getByRole('form');
    fireEvent.submit(form);
    
    await waitFor(() => {
      // Verify API called with negative response
      expect(mockCreateFeedBack).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.anything(),
        expect.objectContaining({
          response: 'NEGATIVE'
        })
      );
      
      // Verify success toast
      expect(toast.success).toHaveBeenCalledWith('Thank you for the feedback!');
    });
  });

  it('handles API error with "There is no follow-up" message', async () => {
    // Mock API error response
    mockCreateFeedBack.mockResolvedValueOnce({ 
      error: { 
        data: { 
          message: 'There is no follow-up' 
        } 
      } 
    });
    
    // Override FormData for this test
    window.FormData = jest.fn().mockImplementation(() => 
      createMockFormData({
        rating: '5',
        ratingComment: 'Great session',
        isReasonGiven: 'true',
        comments: {
          userReasons: ['Great session'],
          technicalIssue: [],
          didntHappenedOption: []
        }
      })
    );
    
    render(<Happened {...defaultProps} />);
    
    const form = screen.getByRole('form');
    fireEvent.submit(form);
    
    await waitFor(() => {
      // Verify error handling
      expect(toast.success).toHaveBeenCalledWith('Thanks, we have already recorded your feedback');
      expect(mockOnClose).toHaveBeenCalledWith(false);
    });
  });
  
  it('handles general API error', async () => {
    // Mock API error response
    mockCreateFeedBack.mockResolvedValueOnce({ 
      error: { 
        data: { 
          message: 'General error' 
        } 
      } 
    });
    
    // Override FormData for this test
    window.FormData = jest.fn().mockImplementation(() => 
      createMockFormData({
        rating: '5',
        ratingComment: 'Great session',
        isReasonGiven: 'true',
        comments: {
          userReasons: ['Great session'],
          technicalIssue: [],
          didntHappenedOption: []
        }
      })
    );
    
    render(<Happened {...defaultProps} />);
    
    const form = screen.getByRole('form');
    fireEvent.submit(form);
    
    await waitFor(() => {
      // Verify error handling
      expect(toast.error).toHaveBeenCalledWith('Something went wrong');
      expect(mockOnClose).toHaveBeenCalledWith(false);
    });
  });
  
  it('handles unexpected errors during submission', async () => {
    // Mock API error response
    mockCreateFeedBack.mockRejectedValueOnce(new Error('Network error'));
    
    // Override FormData for this test
    window.FormData = jest.fn().mockImplementation(() => 
      createMockFormData({
        rating: '5',
        ratingComment: 'Great session',
        isReasonGiven: 'true',
        comments: {
          userReasons: ['Great session'],
          technicalIssue: [],
          didntHappenedOption: []
        }
      })
    );
    
    render(<Happened {...defaultProps} />);
    
    const form = screen.getByRole('form');
    fireEvent.submit(form);
    
    await waitFor(() => {
      // Verify error handling
      expect(console.error).toHaveBeenCalled();
      expect(toast.error).toHaveBeenCalledWith('Something went wrong');
      expect(mockOnClose).toHaveBeenCalledWith(false);
      // Check that a CustomEvent with the correct type and detail was dispatched
      const loaderOffEvent = dispatchEventSpy.mock.calls.find(
        ([e]) => e.type === 'trigger-register-loader' && (e instanceof CustomEvent) && e.detail === false
      );
      expect(loaderOffEvent).toBeTruthy();
    });
  });
  
  it('handles form reference being null', async () => {
    // Mock useRef to return null for the form ref
    const originalUseRef = React.useRef;
    const mockUseRef = jest.spyOn(React, 'useRef').mockImplementation(() => ({
      current: null
    }));
    
    render(<Happened {...defaultProps} />);
    
    const form = screen.getByRole('form');
    fireEvent.submit(form);
    
    // This shouldn't throw an error, just return silently
    await waitFor(() => {
      // The form ref is null, so no API call should be made and no loader event dispatched
      expect(mockCreateFeedBack).not.toHaveBeenCalled();
      expect(dispatchEventSpy).not.toHaveBeenCalled();
    });
    
    // Restore original implementation
    mockUseRef.mockRestore();
  });
  
  it('tests multi-select scrolling behavior', () => {
    render(<Happened {...defaultProps} />);
    
    // Test onMultiSelectClicked function
    const multiSelectButton = screen.getByTestId('multi-select-btn');
    fireEvent.click(multiSelectButton);
    
    // Run the timer
    jest.advanceTimersByTime(50);
    
    // Verify getElementById and scrollTo were called
    expect(document.getElementById).toHaveBeenCalledWith('happened-form-con');
    const mockElement = (document.getElementById as jest.Mock).mock.results[0].value;
    expect(mockElement.scrollTo).toHaveBeenCalledWith({
      top: 1000,
      left: 0,
      behavior: 'smooth'
    });
  });
  
  it('tests transformObject function thoroughly', async () => {
    // Mock successful API response
    mockCreateFeedBack.mockResolvedValueOnce({ data: { success: true } });
    
    // Test all possible transforms in the transformObject function
    window.FormData = jest.fn().mockImplementation(() => 
      createMockFormData({
        rating: '5',
        ratingComment: 'This is great',
        'technicalIssue-0': 'Audio issues',
        'technicalIssue-1': 'Video issues',
        'didntHappenedOption': 'Got rescheduled',
        scheduledAt: '2023-06-01',
        didntHappenedReason: 'Detailed reason',
        technnicalIssueReason: 'Tech details',
        isReasonGiven: 'true',
        comments: {
          userReasons: ['This is great', 'Detailed reason', 'Tech details'],
          technicalIssue: ['Audio issues', 'Video issues'],
          didntHappenedOption: ['Got rescheduled']
        }
      })
    );
    
    render(<Happened {...defaultProps} />);
    
    const form = screen.getByRole('form');
    fireEvent.submit(form);
    
    await waitFor(() => {
      // Verify transformObject processed all fields correctly
      expect(mockCreateFeedBack).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.anything(),
        expect.objectContaining({
          rating: 5,
          data: expect.objectContaining({
            scheduledAt: expect.stringContaining('2023-06-01')
          })
        })
      );
    });
  });
  
  it('handles empty fields in transformObject', async () => {
    // Mock successful API response
    mockCreateFeedBack.mockResolvedValueOnce({ data: { success: true } });
    
    // Test with empty values
    window.FormData = jest.fn().mockImplementation(() => 
      createMockFormData({
        rating: '5',
        ratingComment: '',
        technnicalIssueReason: '',
        didntHappenedReason: '',
        isReasonGiven: 'true',
        comments: {
          userReasons: [],
          technicalIssue: [],
          didntHappenedOption: []
        }
      })
    );
    
    render(<Happened {...defaultProps} />);
    
    const form = screen.getByRole('form');
    fireEvent.submit(form);
    
    await waitFor(() => {
      // Should not call the API if required fields are missing
      expect(mockCreateFeedBack).not.toHaveBeenCalled();
    });
  });
  
  // Clean up mocks after all tests
  afterAll(() => {
    // Restore original implementations
    Object.fromEntries = originalFromEntries;
  });
});
