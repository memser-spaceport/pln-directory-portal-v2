import { render, screen, fireEvent } from '@testing-library/react';
import { useNotificationAnalytics } from '@/analytics/notification.analytics';
import { usePathname } from 'next/navigation';
import AllNotifications from '@/components/core/navbar/all-notifications';
import '@testing-library/jest-dom';
import { NOTIFICATION_TYPES } from '@/utils/constants';

jest.mock('@/analytics/notification.analytics');
jest.mock('next/navigation', () => ({
  usePathname: jest.fn(),
  useRouter: jest.fn(),
}));

describe('AllNotifications Component', () => {
  const mockAnalytics = {
    onSeeAllNotificationsClicked: jest.fn(),
    onNotificationCardClicked: jest.fn(),
  };

  beforeEach(() => {
    (useNotificationAnalytics as jest.Mock).mockReturnValue(mockAnalytics);
    (usePathname as jest.Mock).mockReturnValue('/');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    render(<AllNotifications allNotifications={[]} userInfo={{}} />);
    expect(screen.getByText('All Notifications')).toBeInTheDocument();
  });

  it('displays "No Notifications" message when there are no notifications', () => {
    render(<AllNotifications userInfo={{}} />);
    expect(screen.getByText('No Notifications')).toBeInTheDocument();
  });

  it('calls analytics on notification click', () => {
    const notifications = [
      {
        uid: 1,
        notification: {
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
        },
      },
    ];
    render(<AllNotifications allNotifications={notifications} userInfo={{}} />);
    const notificationText = screen.getByTestId('notification-text');
    fireEvent.click(notificationText);
    expect(mockAnalytics.onNotificationCardClicked).toHaveBeenCalled();
  });

  it('calls analytics on "See all notifications" click', () => {
    render(<AllNotifications allNotifications={[]} userInfo={{}} />);
    fireEvent.click(screen.getByText('See all notifications'));
    expect(mockAnalytics.onSeeAllNotificationsClicked).toHaveBeenCalled();
  });
});
