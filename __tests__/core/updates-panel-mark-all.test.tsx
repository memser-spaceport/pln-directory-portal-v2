import '@testing-library/jest-dom';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';

const mockOnMarkAllClicked = jest.fn();
const mockOnMarkAllFailed = jest.fn();
const mockOnSearchOpened = jest.fn();
const mockOnSearchQueried = jest.fn();

jest.mock('@/analytics/notification.analytics', () => ({
  useNotificationAnalytics: () => ({
    onUpdatesPanelNotificationClicked: jest.fn(),
    onNotificationActionLinkClicked: jest.fn(),
    onViewAllUpdatesClicked: jest.fn(),
    onMarkAllUpdatesReadClicked: (...a: unknown[]) => mockOnMarkAllClicked(...a),
    onMarkAllUpdatesReadFailed: (...a: unknown[]) => mockOnMarkAllFailed(...a),
    onUpdatesSearchOpened: (...a: unknown[]) => mockOnSearchOpened(...a),
    onUpdatesSearchQueried: (...a: unknown[]) => mockOnSearchQueried(...a),
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

describe('UpdatesPanel search', () => {
  const now = new Date().toISOString();
  const notification = (id: string, title: string, category: string, description = '') =>
    ({ id, uid: id, title, description, isRead: false, category, createdAt: now }) as never;

  const SEARCH_PLACEHOLDER = 'Search by team or keyword…';

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  function typeAndSettle(input: HTMLElement, value: string) {
    fireEvent.change(input, { target: { value } });
    act(() => {
      jest.advanceTimersByTime(700);
    });
  }

  it('is never shown to logged-out viewers', () => {
    renderPanel({ isLoggedIn: false });
    expect(screen.queryByRole('button', { name: 'Search updates' })).not.toBeInTheDocument();
  });

  it('renders collapsed for logged-in viewers', () => {
    renderPanel();
    const toggle = screen.getByRole('button', { name: 'Search updates' });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByPlaceholderText(SEARCH_PLACEHOLDER)).not.toBeInTheDocument();
  });

  it('expands on click, focuses the input, and reports the open event', () => {
    renderPanel();
    fireEvent.click(screen.getByRole('button', { name: 'Search updates' }));

    const input = screen.getByPlaceholderText(SEARCH_PLACEHOLDER);
    expect(input).toHaveFocus();
    expect(mockOnSearchOpened).toHaveBeenCalledTimes(1);
  });

  it('filters by title and reports the queried event with the match count', () => {
    renderPanel({
      notifications: [
        notification('n1', 'Founder office hours', 'EVENT'),
        notification('n2', 'Quarterly update', 'SYSTEM'),
      ],
      unreadCount: 2,
    });
    fireEvent.click(screen.getByRole('button', { name: 'Search updates' }));

    typeAndSettle(screen.getByPlaceholderText(SEARCH_PLACEHOLDER), 'office');

    expect(screen.getByText('Founder office hours')).toBeInTheDocument();
    expect(screen.queryByText('Quarterly update')).not.toBeInTheDocument();
    expect(mockOnSearchQueried).toHaveBeenCalledWith('office', 1);
  });

  it('filters by the same category label NotificationItem renders (not the raw CATEGORY_CONFIG label)', () => {
    // GUIDE_POST renders as "Founder Guides" via getCategoryLabel(), but as
    // "Forum" in CATEGORY_CONFIG — searching "guide" must use the former.
    renderPanel({
      notifications: [notification('n1', 'New guide posted', 'GUIDE_POST'), notification('n2', 'A forum reply', 'FORUM_POST')],
      unreadCount: 2,
    });
    fireEvent.click(screen.getByRole('button', { name: 'Search updates' }));

    typeAndSettle(screen.getByPlaceholderText(SEARCH_PLACEHOLDER), 'guide');

    expect(screen.getByText('New guide posted')).toBeInTheDocument();
    expect(screen.queryByText('A forum reply')).not.toBeInTheDocument();
  });

  it('shows a distinct empty state when the search has zero matches', () => {
    renderPanel({ notifications: [notification('n1', 'Founder office hours', 'EVENT')], unreadCount: 1 });
    fireEvent.click(screen.getByRole('button', { name: 'Search updates' }));

    typeAndSettle(screen.getByPlaceholderText(SEARCH_PLACEHOLDER), 'nonexistent');

    expect(screen.getByText(/No results for/)).toBeInTheDocument();
    expect(screen.queryByText('Founder office hours')).not.toBeInTheDocument();
  });

  it('Escape clears the query first, then collapses the field and returns focus to the toggle on a second press', () => {
    renderPanel({ notifications: [notification('n1', 'Founder office hours', 'EVENT')], unreadCount: 1 });
    const toggle = screen.getByRole('button', { name: 'Search updates' });
    fireEvent.click(toggle);

    const input = screen.getByPlaceholderText(SEARCH_PLACEHOLDER);
    fireEvent.change(input, { target: { value: 'office' } });
    expect(input).toHaveValue('office');

    fireEvent.keyUp(input, { key: 'Escape' });
    expect(screen.getByPlaceholderText(SEARCH_PLACEHOLDER)).toHaveValue('');

    fireEvent.keyUp(screen.getByPlaceholderText(SEARCH_PLACEHOLDER), { key: 'Escape' });
    expect(screen.queryByPlaceholderText(SEARCH_PLACEHOLDER)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Search updates' })).toHaveFocus();
  });

  it('does not collapse on blur when focus moves to a notification link inside the panel', () => {
    renderPanel({ notifications: [notification('n1', 'Founder office hours', 'EVENT')], unreadCount: 1 });
    fireEvent.click(screen.getByRole('button', { name: 'Search updates' }));

    const input = screen.getByPlaceholderText(SEARCH_PLACEHOLDER);
    const notificationLink = screen.getByText('Founder office hours').closest('a') as HTMLElement;

    fireEvent.blur(input, { relatedTarget: notificationLink });
    expect(screen.getByPlaceholderText(SEARCH_PLACEHOLDER)).toBeInTheDocument();
  });

  it('collapses on blur to somewhere outside the panel when the field is empty', () => {
    renderPanel({ notifications: [notification('n1', 'Founder office hours', 'EVENT')], unreadCount: 1 });
    fireEvent.click(screen.getByRole('button', { name: 'Search updates' }));

    const input = screen.getByPlaceholderText(SEARCH_PLACEHOLDER);
    fireEvent.blur(input, { relatedTarget: document.body });

    expect(screen.queryByPlaceholderText(SEARCH_PLACEHOLDER)).not.toBeInTheDocument();
  });
});
