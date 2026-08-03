import '@testing-library/jest-dom';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

const mockMarkAllAsRead = jest.fn();
const mockOnMarkAllClicked = jest.fn();
const mockOnMarkAllFailed = jest.fn();
let providerUnreadCount = 0;

jest.mock('@/providers/PushNotificationsProvider', () => ({
  usePushNotificationsContext: () => ({
    markAsRead: jest.fn(),
    markAllAsRead: mockMarkAllAsRead,
    unreadCount: providerUnreadCount,
  }),
  stripHtml: (value: string) => value,
}));

jest.mock('@/services/push-notifications/hooks', () => ({
  useInfiniteNotifications: () => ({
    notifications: [],
    total: 0,
    // Deliberately 0 while the provider says otherwise: the control and the
    // pill must run off the provider's LIVE count, not this first-page snapshot.
    unreadCount: 0,
    hasNextPage: false,
    fetchNextPage: jest.fn(),
    isFetchingNextPage: false,
    isLoading: false,
  }),
}));

jest.mock('@/analytics/notification.analytics', () => ({
  useNotificationAnalytics: () => ({
    onRecentUpdatesNotificationClicked: jest.fn(),
    onNotificationActionLinkClicked: jest.fn(),
    onMarkAllUpdatesReadClicked: (...a: unknown[]) => mockOnMarkAllClicked(...a),
    onMarkAllUpdatesReadFailed: (...a: unknown[]) => mockOnMarkAllFailed(...a),
  }),
}));

import { RecentUpdatesSection } from '@/components/page/home/recent-updates/RecentUpdatesSection';

describe('RecentUpdatesSection mark all as read', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    providerUnreadCount = 2;
    mockMarkAllAsRead.mockResolvedValue(undefined);
  });

  it('drives visibility and the pill off the provider count, not the page snapshot', () => {
    render(<RecentUpdatesSection isLoggedIn />);

    expect(screen.getByRole('button', { name: 'Mark all as read' })).toBeInTheDocument();
    expect(screen.getByText('Unread 2')).toBeInTheDocument();
  });

  it('hides the control at zero unread', () => {
    providerUnreadCount = 0;
    render(<RecentUpdatesSection isLoggedIn />);

    expect(screen.queryByRole('button', { name: 'Mark all as read' })).not.toBeInTheDocument();
  });

  it('never shows the control to logged-out viewers', () => {
    render(<RecentUpdatesSection isLoggedIn={false} />);

    expect(screen.queryByRole('button', { name: 'Mark all as read' })).not.toBeInTheDocument();
  });

  it('invokes the provider action, reports the click, parks focus on the heading, and announces', () => {
    render(<RecentUpdatesSection isLoggedIn />);

    fireEvent.click(screen.getByRole('button', { name: 'Mark all as read' }));

    expect(mockMarkAllAsRead).toHaveBeenCalledTimes(1);
    expect(mockOnMarkAllClicked).toHaveBeenCalledWith('recent_updates', 2);
    expect(screen.getByRole('heading', { name: 'Recent Updates' })).toHaveFocus();
    expect(screen.getByRole('status')).toHaveTextContent('All notifications marked as read');
  });

  it('reports the failure and updates the announcement when the action rejects', async () => {
    mockMarkAllAsRead.mockRejectedValue(new Error('boom'));
    render(<RecentUpdatesSection isLoggedIn />);

    fireEvent.click(screen.getByRole('button', { name: 'Mark all as read' }));

    await waitFor(() => expect(mockOnMarkAllFailed).toHaveBeenCalledWith('recent_updates', 2));
    expect(screen.getByRole('status')).toHaveTextContent('Could not mark notifications as read');
  });
});
