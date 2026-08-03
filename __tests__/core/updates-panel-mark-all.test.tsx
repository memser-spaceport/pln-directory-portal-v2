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

  it('hides the control at zero unread rather than disabling it', () => {
    renderPanel({ unreadCount: 0 });
    expect(screen.queryByRole('button', { name: 'Mark all as read' })).not.toBeInTheDocument();
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
});
