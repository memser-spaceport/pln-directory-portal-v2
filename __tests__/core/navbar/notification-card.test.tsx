import { render, screen } from '@testing-library/react';
import { NOTIFICATION_TYPES } from '@/utils/constants';
import { calculateTime } from '@/utils/common.utils';
import '@testing-library/jest-dom';
import NotificationCard from '@/components/core/navbar/notification-card';

jest.mock('@/utils/common.utils', () => ({
  calculateTime: jest.fn(),
}));

describe('NotificationCard Component', () => {
  const mockNotification = {
    type: NOTIFICATION_TYPES.meetingInitiated.name,
    createdAt: '2023-10-01T00:00:00Z',
    interaction: {
      targetMember: {
        name: 'John Doe',
        image: {
          url: '/path/to/profile.jpg',
        },
      },
    },
  } as any;

  beforeEach(() => {
    (calculateTime as jest.Mock).mockReturnValue('2 days ago');
  });

  it('renders correctly with profile image', () => {
    render(<NotificationCard notification={mockNotification} />);
    const profileImage = screen.getByAltText('profile');
    expect(profileImage).toHaveAttribute('src', '/path/to/profile.jpg');
  });

  it('renders correctly with default profile image', () => {
    const notificationWithoutImage = {
      ...mockNotification,
      interaction: {
        targetMember: {
          name: 'John Doe',
          image: null,
        },
      },
    };
    render(<NotificationCard notification={notificationWithoutImage} />);
    const profileImage = screen.getByAltText('profile');
    expect(profileImage).toHaveAttribute('src', '/icons/default_profile.svg');
  });

  it('displays the correct notification text for meeting initiated', () => {
    render(<NotificationCard notification={mockNotification} />);
    const notificationText = screen.getByText(/Did you schedule Office Hours with John Doe\?/);
    expect(notificationText).toBeInTheDocument();
  });

  it('displays the correct notification text for meeting scheduled', () => {
    const notificationScheduled = {
      ...mockNotification,
      type: NOTIFICATION_TYPES.meetingScheduled.name,
    };
    render(<NotificationCard notification={notificationScheduled} />);
    const notificationText = screen.getByText(/How was your recent meeting with John Doe\?/);
    expect(notificationText).toBeInTheDocument();
  });

  it('displays the correct notification text for meeting rescheduled', () => {
    const notificationRescheduled = {
      ...mockNotification,
      type: NOTIFICATION_TYPES.meetingRescheduled.name,
    };
    render(<NotificationCard notification={notificationRescheduled} />);
    const notificationText = screen.getByText(/How was your recent meeting with John Doe\?/);
    expect(notificationText).toBeInTheDocument();
  });

  it('displays the correct date', () => {
    render(<NotificationCard notification={mockNotification} />);
    const dateText = screen.getByText('2 days ago');
    expect(dateText).toBeInTheDocument();
  });

  it('displays an empty string when notification type does not match', () => {
    const notificationUnknownType = {
      ...mockNotification,
      type: 'unknownType',
    };
    render(<NotificationCard notification={notificationUnknownType} />);
    const notificationText = screen.getByTestId('notification-text');
    expect(notificationText).toBeInTheDocument();
  });
});
