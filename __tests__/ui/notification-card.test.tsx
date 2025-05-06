import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import NotificationCard from '@/components/core/navbar/notification-card';
import { NOTIFICATION_TYPES } from '@/utils/constants';
import * as utils from '@/utils/common.utils';

// Mock calculateTime utility
jest.mock('@/utils/common.utils', () => ({
  calculateTime: jest.fn()
}));

const mockCalculateTime = utils.calculateTime as jest.Mock;

// Helper to create a notification object
const baseNotification = {
  type: '',
  createdAt: '2023-01-01T00:00:00Z',
  interaction: {
    targetMember: {
      name: 'Alice',
      image: { url: '/profile/alice.png' }
    }
  }
};

/**
 * Test suite for NotificationCard component.
 * Covers all branches, lines, and edge cases for 100% coverage.
 */
describe('NotificationCard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCalculateTime.mockReturnValue('2 days ago');
  });

  /**
   * Should render meetingInitiated notification with correct text and image
   */
  it('renders meetingInitiated notification', () => {
    const notification = {
      ...baseNotification,
      type: NOTIFICATION_TYPES.meetingInitiated.name
    };
    render(<NotificationCard notification={notification as any} />);
    expect(screen.getByAltText('profile')).toHaveAttribute('src', '/profile/alice.png');
    expect(screen.getByText('2 days ago')).toBeInTheDocument();
    expect(screen.getByText(/Did you schedule Office Hours with Alice/)).toBeInTheDocument();
  });

  /**
   * Should render meetingScheduled notification with correct text
   */
  it('renders meetingScheduled notification', () => {
    const notification = {
      ...baseNotification,
      type: NOTIFICATION_TYPES.meetingScheduled.name
    };
    render(<NotificationCard notification={notification as any} />);
    expect(screen.getByText(/How was your recent meeting with Alice/)).toBeInTheDocument();
  });

  /**
   * Should render meetingRescheduled notification with correct text
   */
  it('renders meetingRescheduled notification', () => {
    const notification = {
      ...baseNotification,
      type: NOTIFICATION_TYPES.meetingRescheduled.name
    };
    render(<NotificationCard notification={notification as any} />);
    expect(screen.getByText(/How was your recent meeting with Alice/)).toBeInTheDocument();
  });

  /**
   * Should render default profile image if image is missing
   */
  it('renders default profile image if image is missing', () => {
    const notification = {
      ...baseNotification,
      type: NOTIFICATION_TYPES.meetingInitiated.name,
      interaction: { targetMember: { name: 'Alice' } }
    };
    render(<NotificationCard notification={notification as any} />);
    expect(screen.getByAltText('profile')).toHaveAttribute('src', '/icons/default_profile.svg');
  });

  /**
   * Should render empty title for unknown notification type
   */
  it('renders empty title for unknown notification type', () => {
    const notification = {
      ...baseNotification,
      type: 'unknownType'
    };
    const { container } = render(<NotificationCard notification={notification as any} />);
    const titleDiv = container.querySelector('.noticrd__cnt__ttl');
    expect(titleDiv).toBeInTheDocument();
    expect(titleDiv).toBeEmptyDOMElement();
  });

  /**
   * Should render date using calculateTime utility
   */
  it('renders date using calculateTime', () => {
    const notification = {
      ...baseNotification,
      type: NOTIFICATION_TYPES.meetingInitiated.name
    };
    mockCalculateTime.mockReturnValue('yesterday');
    render(<NotificationCard notification={notification as any} />);
    expect(screen.getByText('yesterday')).toBeInTheDocument();
  });
}); 