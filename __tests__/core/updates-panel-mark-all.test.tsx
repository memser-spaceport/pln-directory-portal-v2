import '@testing-library/jest-dom';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

const mockOnMarkAllClicked = jest.fn();
const mockOnMarkAllFailed = jest.fn();

jest.mock('@/analytics/notification.analytics', () => ({
  useNotificationAnalytics: () => ({
    onUpdatesPanelNotificationClicked: jest.fn(),
    onNotificationActionLinkClicked: jest.fn(),
    onViewAllUpdatesClicked: jest.fn(),
    onMarkAllUpdatesReadClicked: (...a: unknown[]) => mockOnMarkAllClicked(...a),
    onMarkAllUpdatesReadFailed: (...a: unknown[]) => mockOnMarkAllFailed(...a),
  }),
}));

import { UpdatesPanel } from '@/components/core/UpdatesPanel';

function renderPanel(props: Partial<React.ComponentProps<typeof UpdatesPanel>> = {}) {
  const onMarkAllAsRead = jest.fn().mockResolvedValue(undefined);
  render(
    <UpdatesPanel
      open
      notifications={[]}
      unreadCount={3}
      onClose={jest.fn()}
      onMarkAsRead={jest.fn()}
      onMarkAllAsRead={onMarkAllAsRead}
      isLoggedIn
      {...props}
    />,
  );
  return { onMarkAllAsRead };
}

describe('UpdatesPanel mark all as read', () => {
  beforeEach(() => jest.clearAllMocks());

  it('shows the control with unread notifications — even when the loaded list is empty', () => {
    renderPanel();
    expect(screen.getByRole('button', { name: 'Mark all as read' })).toBeInTheDocument();
  });

  it('shows the control grayed out at zero unread, and a click does nothing', () => {
    const { onMarkAllAsRead } = renderPanel({ unreadCount: 0 });
    const button = screen.getByRole('button', { name: 'Mark all as read' });

    expect(button).toBeDisabled();
    fireEvent.click(button);
    expect(onMarkAllAsRead).not.toHaveBeenCalled();
  });

  it('never shows the control to logged-out viewers', () => {
    renderPanel({ isLoggedIn: false });
    expect(screen.queryByRole('button', { name: 'Mark all as read' })).not.toBeInTheDocument();
  });

  it('invokes the action, reports the click with the count, parks focus, and announces', () => {
    const { onMarkAllAsRead } = renderPanel();

    fireEvent.click(screen.getByRole('button', { name: 'Mark all as read' }));

    expect(onMarkAllAsRead).toHaveBeenCalledTimes(1);
    expect(mockOnMarkAllClicked).toHaveBeenCalledWith('updates_panel', 3);
    // Focus parked on Close before the mark-all button can unmount.
    expect(screen.getByRole('button', { name: 'Close' })).toHaveFocus();
    expect(screen.getByRole('status')).toHaveTextContent('All notifications marked as read');
  });

  it('reports the failure and updates the announcement when the action rejects', async () => {
    renderPanel({ onMarkAllAsRead: jest.fn().mockRejectedValue(new Error('boom')) });

    fireEvent.click(screen.getByRole('button', { name: 'Mark all as read' }));

    await waitFor(() => expect(mockOnMarkAllFailed).toHaveBeenCalledWith('updates_panel', 3));
    expect(screen.getByRole('status')).toHaveTextContent('Could not mark notifications as read');
  });

  it('scopes the list with the All/Unread/Read tabs, with a caught-up escape hatch', () => {
    const now = new Date().toISOString();
    const notification = (id: string, title: string, isRead: boolean) =>
      ({ id, uid: id, title, description: '', isRead, category: 'FORUM_POST', createdAt: now }) as never;
    renderPanel({
      notifications: [notification('n1', 'Unread thing', false), notification('n2', 'Read thing', true)],
      unreadCount: 1,
    });

    expect(screen.getByRole('tablist', { name: 'Filter updates' })).toBeInTheDocument();
    expect(screen.getByText('Unread thing')).toBeInTheDocument();
    expect(screen.getByText('Read thing')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('tab', { name: /Unread/ }));
    expect(screen.getByText('Unread thing')).toBeInTheDocument();
    expect(screen.queryByText('Read thing')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('tab', { name: 'Read' }));
    expect(screen.queryByText('Unread thing')).not.toBeInTheDocument();
    expect(screen.getByText('Read thing')).toBeInTheDocument();
  });

  it('offers "Show all updates" when the Unread segment is empty but the list is not', () => {
    const notification = { id: 'n2', title: 'Read thing', isRead: true, category: 'FORUM_POST' } as never;
    renderPanel({ notifications: [notification], unreadCount: 0 });

    fireEvent.click(screen.getByRole('tab', { name: 'Unread' }));
    expect(screen.getByText("You're all caught up")).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Show all updates' }));
    expect(screen.getByText('Read thing')).toBeInTheDocument();
  });
});
