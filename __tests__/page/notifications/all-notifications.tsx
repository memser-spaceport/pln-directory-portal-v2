import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import AllNotifications from '../../../components/page/notifications/all-notifications';
import { IFollowUp } from '../../../types/officehours.types';

// --- Mocks ---
jest.mock('next/link', () => ({ __esModule: true, default: ({ children, ...props }: any) => <a {...props}>{children}</a> }));
jest.mock('@/components/core/navbar/notification-card', () => ({ __esModule: true, default: ({ notification }: any) => <div data-testid={`notification-card-${notification.id}`}>{notification.text}</div> }));
jest.mock('@/analytics/notification.analytics', () => ({ useNotificationAnalytics: jest.fn() }));
jest.mock('@/utils/common.utils', () => ({
  getAnalyticsNotificationInfo: jest.fn(() => 'notif-info'),
  getAnalyticsUserInfo: jest.fn(() => 'user-info'),
  triggerLoader: jest.fn(),
}));

const mockOnNotificationCardClicked = jest.fn();
const mockTriggerLoader = require('@/utils/common.utils').triggerLoader;
const mockUseNotificationAnalytics = require('@/analytics/notification.analytics').useNotificationAnalytics;

beforeEach(() => {
  jest.clearAllMocks();
  mockUseNotificationAnalytics.mockReturnValue({
    onNotificationCardClicked: mockOnNotificationCardClicked,
  });
});

describe('AllNotifications', () => {
  const notifications = [
    {
      uid: 'f1',
      status: 'PENDING' as const,
      type: 'MEETING_INITIATED' as const,
      data: { text: 'Notification 1' },
      isDelayed: false,
      interactionUid: 'i1',
      createdBy: 'u1',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
      interaction: {
        uid: 'i1',
        type: 'MEETING',
        sourceMember: { name: 'Source 1', image: { url: 'source1.png' } },
        targetMember: { name: 'Target 1', image: { url: 'target1.png' } },
      },
      id: 1, // for testid compatibility with mock NotificationCard
      text: 'Notification 1', // for testid compatibility with mock NotificationCard
    },
    {
      uid: 'f2',
      status: 'PENDING' as const,
      type: 'MEETING_SCHEDULED' as const,
      data: { text: 'Notification 2' },
      isDelayed: false,
      interactionUid: 'i2',
      createdBy: 'u2',
      createdAt: '2024-01-02T00:00:00Z',
      updatedAt: '2024-01-02T00:00:00Z',
      interaction: {
        uid: 'i2',
        type: 'MEETING',
        sourceMember: { name: 'Source 2', image: { url: 'source2.png' } },
        targetMember: { name: 'Target 2', image: { url: 'target2.png' } },
      },
      id: 2, // for testid compatibility with mock NotificationCard
      text: 'Notification 2', // for testid compatibility with mock NotificationCard
    },
  ] as unknown as IFollowUp[];
  const userInfo = { name: 'Test User', uid: 'u1' };
  const authToken = 'token';

  it('renders notification cards when notifications are present', () => {
    render(<AllNotifications notifications={notifications} userInfo={userInfo} authToken={authToken} />);
    expect(screen.getByText('All Notifications')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    
    expect(screen.getByTestId('notification-card-1')).toBeInTheDocument();
    expect(screen.getByTestId('notification-card-2')).toBeInTheDocument();
    expect(screen.queryByText('No Notifications')).not.toBeInTheDocument();
  });

  it('renders empty state when no notifications are present', () => {
    render(<AllNotifications notifications={[]} userInfo={userInfo} authToken={authToken} />);
    expect(screen.getByText('No Notifications')).toBeInTheDocument();
    expect(screen.getByText('You have no notifications right now. Please come back later')).toBeInTheDocument();
    expect(screen.getByText('0')).toBeInTheDocument();
  });

  it('calls triggerLoader when Go Back Home is clicked', () => {
    render(<AllNotifications notifications={[]} userInfo={userInfo} authToken={authToken} />);
    fireEvent.click(screen.getByText('Go Back Home'));
    expect(mockTriggerLoader).toHaveBeenCalledWith(true);
  });

  it('calls analytics and dispatches event when notification card is clicked', () => {
    const dispatchEventSpy = jest.spyOn(document, 'dispatchEvent');
    render(<AllNotifications notifications={notifications} userInfo={userInfo} authToken={authToken} />);
    fireEvent.click(screen.getByTestId('notification-card-1').parentElement!);
    expect(mockOnNotificationCardClicked).toHaveBeenCalledWith('user-info', 'notif-info');
    expect(dispatchEventSpy).toHaveBeenCalled();
    const event = dispatchEventSpy.mock.calls[0][0] as CustomEvent;
    expect(event.type).toBe('TRIGGER_RATING_POPUP');
    expect(event.detail).toBeDefined();
    expect(event.detail.notification).toBeDefined();
  });

  it('handles missing notifications and userInfo props gracefully', () => {
    // @ts-expect-error intentionally missing props
    render(<AllNotifications />);
    expect(screen.getByText('No Notifications')).toBeInTheDocument();
    expect(screen.getByText('0')).toBeInTheDocument();
  });
}); 