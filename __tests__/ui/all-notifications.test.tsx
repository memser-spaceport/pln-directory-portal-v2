import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import AllNotifications from '@/components/core/navbar/all-notifications';
import { useNotificationAnalytics } from '@/analytics/notification.analytics';
import * as utils from '@/utils/common.utils';
import { usePathname } from 'next/navigation';
import { EVENTS } from '@/utils/constants';

// Mock NotificationCard and Link for isolation
jest.mock('@/components/core/navbar/notification-card', () => ({ __esModule: true, default: ({ notification }: any) => <div data-testid={`notification-card-${notification.id}`}>{notification.text}</div> }));
jest.mock('next/link', () => ({ __esModule: true, default: ({ children, ...props }: any) => <a {...props}>{children}</a> }));

// Mock analytics and utils
jest.mock('@/analytics/notification.analytics', () => ({ useNotificationAnalytics: jest.fn() }));
jest.mock('@/utils/common.utils', () => ({
  getAnalyticsNotificationInfo: jest.fn(() => 'notif-info'),
  getAnalyticsUserInfo: jest.fn(() => 'user-info'),
  triggerLoader: jest.fn(),
}));
jest.mock('next/navigation', () => ({ usePathname: jest.fn() }));

const mockOnSeeAllNotificationsClicked = jest.fn();
const mockOnNotificationCardClicked = jest.fn();
const mockTriggerLoader = utils.triggerLoader as jest.Mock;
const mockGetAnalyticsUserInfo = utils.getAnalyticsUserInfo as jest.Mock;
const mockGetAnalyticsNotificationInfo = utils.getAnalyticsNotificationInfo as jest.Mock;
const mockUsePathname = usePathname as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
  (useNotificationAnalytics as jest.Mock).mockReturnValue({
    onSeeAllNotificationsClicked: mockOnSeeAllNotificationsClicked,
    onNotificationCardClicked: mockOnNotificationCardClicked,
  });
  mockUsePathname.mockReturnValue('/');
});

/**
 * Test suite for AllNotifications component.
 * Covers all branches, lines, and edge cases for 100% coverage.
 */
describe('AllNotifications', () => {
  const notifications = [
    { id: 1, text: 'Notification 1' },
    { id: 2, text: 'Notification 2' },
  ];
  const userInfo = { name: 'Test User' };

  /**
   * Should render notification cards when notifications are present
   */
  it('renders notification cards when notifications are present', () => {
    render(<AllNotifications allNotifications={notifications} userInfo={userInfo} />);
    expect(screen.getByText('All Notifications')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByTestId('notification-card-1')).toBeInTheDocument();
    expect(screen.getByTestId('notification-card-2')).toBeInTheDocument();
    expect(screen.queryByText('No Notifications')).not.toBeInTheDocument();
  });

  /**
   * Should render empty state when no notifications are present
   */
  it('renders empty state when no notifications are present', () => {
    render(<AllNotifications allNotifications={[]} userInfo={userInfo} />);
    expect(screen.getByText('No Notifications')).toBeInTheDocument();
    expect(screen.getByText('You have no notifications right now. Please come back later')).toBeInTheDocument();
    expect(screen.getByText('All Notifications')).toBeInTheDocument();
    expect(screen.getByText('0')).toBeInTheDocument();
  });

  /**
   * Should call analytics and triggerLoader when clicking See all notifications (not on notifications page)
   */
  it('calls analytics and triggerLoader when clicking See all notifications', () => {
    render(<AllNotifications allNotifications={notifications} userInfo={userInfo} />);
    fireEvent.click(screen.getByText('See all notifications'));
    expect(mockTriggerLoader).toHaveBeenCalledWith(true);
    expect(mockOnSeeAllNotificationsClicked).toHaveBeenCalledWith('user-info');
  });

  /**
   * Should not call analytics or triggerLoader if already on notifications page
   */
  it('does not call analytics or triggerLoader if already on notifications page', () => {
    mockUsePathname.mockReturnValue('/notifications');
    render(<AllNotifications allNotifications={notifications} userInfo={userInfo} />);
    fireEvent.click(screen.getByText('See all notifications'));
    expect(mockTriggerLoader).not.toHaveBeenCalled();
    expect(mockOnSeeAllNotificationsClicked).not.toHaveBeenCalled();
  });

  /**
   * Should call analytics and dispatch event when notification card is clicked
   */
  it('calls analytics and dispatches event when notification card is clicked', () => {
    const dispatchEventSpy = jest.spyOn(document, 'dispatchEvent');
    render(<AllNotifications allNotifications={notifications} userInfo={userInfo} />);
    fireEvent.click(screen.getByTestId('notification-card-1').parentElement!);
    expect(mockOnNotificationCardClicked).toHaveBeenCalledWith('user-info', 'notif-info');
    expect(dispatchEventSpy).toHaveBeenCalled();

    // Get the event object
    const event = dispatchEventSpy.mock.calls[0][0] as CustomEvent;
    expect(event.type).toBe(EVENTS.TRIGGER_RATING_POPUP);
    expect(event.detail).toBeDefined();
    expect(event.detail.notification).toBeDefined();
  });

  /**
   * Should handle missing allNotifications and userInfo props gracefully
   */
  it('handles missing allNotifications and userInfo props gracefully', () => {
    render(<AllNotifications />);
    expect(screen.getByText('No Notifications')).toBeInTheDocument();
    expect(screen.getByText('0')).toBeInTheDocument();
  });
}); 