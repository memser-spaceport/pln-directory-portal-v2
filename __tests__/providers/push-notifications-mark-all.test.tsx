import '@testing-library/jest-dom';
import { useState } from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';

// Stable react-query mocks (the global jest.setup mock builds new fns per
// call, which can't be asserted against). The provider only uses useQueryClient.
jest.mock('@tanstack/react-query', () => {
  const getQueryData = jest.fn();
  const setQueryData = jest.fn();
  return {
    useQueryClient: () => ({ getQueryData, setQueryData }),
    __rq: { getQueryData, setQueryData },
  };
});

// Stable websocket mocks + capture of the provider's onCountUpdate callback,
// so the cross-tab path can be driven directly.
jest.mock('@/hooks/usePushNotifications', () => {
  const wsMarkAsRead = jest.fn();
  const wsMarkAllAsRead = jest.fn();
  const captured: { onCountUpdate?: (p: { unreadCount: number }) => void } = {};
  return {
    usePushNotifications: (opts: { onCountUpdate: (p: { unreadCount: number }) => void }) => {
      captured.onCountUpdate = opts.onCountUpdate;
      return {
        isConnected: true,
        connectionEstablished: true,
        error: null,
        markAsRead: wsMarkAsRead,
        markAllAsRead: wsMarkAllAsRead,
      };
    },
    __ws: { wsMarkAsRead, wsMarkAllAsRead, captured },
  };
});

jest.mock('@/services/push-notifications.service', () => ({
  getUnreadLinks: jest.fn().mockResolvedValue([]),
  getNotifications: jest.fn(),
  markNotificationAsRead: jest.fn().mockResolvedValue({}),
  markAllNotificationsAsRead: jest.fn(),
}));

import { PushNotificationsProvider, usePushNotificationsContext } from '@/providers/PushNotificationsProvider';
import { getNotifications, markAllNotificationsAsRead } from '@/services/push-notifications.service';

const { __rq } = jest.requireMock('@tanstack/react-query');
const { __ws } = jest.requireMock('@/hooks/usePushNotifications');
const getNotificationsMock = getNotifications as jest.Mock;
const markAllMock = markAllNotificationsAsRead as jest.Mock;

function notif(id: string, isRead: boolean) {
  return { id, uid: id, title: `t-${id}`, description: '', isRead, category: 'NEW_FEATURE', createdAt: '' };
}

function Consumer() {
  const { notifications, unreadCount, markAllAsRead } = usePushNotificationsContext();
  const [failed, setFailed] = useState(false);
  return (
    <div>
      <span data-testid="count">{unreadCount}</span>
      <span data-testid="unread-ids">
        {notifications
          .filter((n) => !n.isRead)
          .map((n) => n.id)
          .join(',')}
      </span>
      {failed && <span data-testid="failed" />}
      <button
        onClick={() => {
          markAllAsRead().catch(() => setFailed(true));
        }}
      >
        mark all
      </button>
    </div>
  );
}

async function renderProvider() {
  render(
    <PushNotificationsProvider authToken="tok" enabled>
      <Consumer />
    </PushNotificationsProvider>,
  );
  await waitFor(() => expect(getNotificationsMock).toHaveBeenCalled());
}

describe('PushNotificationsProvider.markAllAsRead', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    __rq.getQueryData.mockReturnValue(undefined);
    getNotificationsMock.mockResolvedValue({
      notifications: [notif('n1', false), notif('n2', true)],
      unreadCount: 1,
      total: 2,
    });
    markAllMock.mockResolvedValue({ success: true });
  });

  it('optimistically clears everything, calls the API once, then broadcasts', async () => {
    await renderProvider();
    await waitFor(() => expect(screen.getByTestId('count')).toHaveTextContent('1'));

    fireEvent.click(screen.getByText('mark all'));

    expect(screen.getByTestId('count')).toHaveTextContent('0');
    expect(screen.getByTestId('unread-ids')).toHaveTextContent('');
    await waitFor(() => expect(markAllMock).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(__ws.wsMarkAllAsRead).toHaveBeenCalledTimes(1));
  });

  it('skips the API entirely with zero unread', async () => {
    getNotificationsMock.mockResolvedValue({ notifications: [notif('n2', true)], unreadCount: 0, total: 1 });
    await renderProvider();
    await waitFor(() => expect(screen.getByTestId('count')).toHaveTextContent('0'));

    fireEvent.click(screen.getByText('mark all'));

    expect(markAllMock).not.toHaveBeenCalled();
  });

  it('still calls the API when the loaded 50 are all read but the count says otherwise', async () => {
    // The old guard (`some(!isRead)` over loaded items) silently skipped this.
    getNotificationsMock.mockResolvedValue({ notifications: [notif('n2', true)], unreadCount: 3, total: 1 });
    await renderProvider();
    await waitFor(() => expect(screen.getByTestId('count')).toHaveTextContent('3'));

    fireEvent.click(screen.getByText('mark all'));

    expect(screen.getByTestId('count')).toHaveTextContent('0');
    await waitFor(() => expect(markAllMock).toHaveBeenCalledTimes(1));
  });

  it('absorbs a double-click into one API call', async () => {
    let resolveCall!: (v: unknown) => void;
    markAllMock.mockImplementation(() => new Promise((res) => (resolveCall = res)));
    await renderProvider();
    await waitFor(() => expect(screen.getByTestId('count')).toHaveTextContent('1'));

    fireEvent.click(screen.getByText('mark all'));
    fireEvent.click(screen.getByText('mark all'));

    expect(markAllMock).toHaveBeenCalledTimes(1);
    await act(async () => resolveCall({ success: true }));
  });

  it('patches and rolls back the infinite cache alongside its own state', async () => {
    const cached = {
      pages: [{ notifications: [notif('n1', false)], total: 1, unreadCount: 1, offset: 0 }],
      pageParams: [0],
    };
    __rq.getQueryData.mockReturnValue(cached);
    markAllMock.mockRejectedValue(new Error('boom'));
    await renderProvider();
    await waitFor(() => expect(screen.getByTestId('count')).toHaveTextContent('1'));

    fireEvent.click(screen.getByText('mark all'));

    // Optimistic patch first…
    expect(__rq.setQueryData).toHaveBeenCalledTimes(1);
    // …then the failure restores the exact snapshot.
    await waitFor(() => expect(screen.getByTestId('failed')).toBeInTheDocument());
    expect(__rq.setQueryData).toHaveBeenCalledTimes(2);
    expect(__rq.setQueryData).toHaveBeenLastCalledWith(['infinite-notifications'], cached);
  });

  it('rolls back read state on failure without broadcasting to other tabs', async () => {
    markAllMock.mockRejectedValue(new Error('boom'));
    await renderProvider();
    await waitFor(() => expect(screen.getByTestId('count')).toHaveTextContent('1'));

    fireEvent.click(screen.getByText('mark all'));

    await waitFor(() => expect(screen.getByTestId('failed')).toBeInTheDocument());
    expect(screen.getByTestId('count')).toHaveTextContent('1');
    expect(screen.getByTestId('unread-ids')).toHaveTextContent('n1');
    expect(__ws.wsMarkAllAsRead).not.toHaveBeenCalled();
  });

  it('patches the infinite cache when another tab broadcasts count 0', async () => {
    __rq.getQueryData.mockReturnValue({
      pages: [{ notifications: [notif('n1', false)], total: 1, unreadCount: 1, offset: 0 }],
      pageParams: [0],
    });
    await renderProvider();
    await waitFor(() => expect(screen.getByTestId('count')).toHaveTextContent('1'));

    act(() => __ws.captured.onCountUpdate!({ unreadCount: 0 }));

    expect(screen.getByTestId('count')).toHaveTextContent('0');
    expect(screen.getByTestId('unread-ids')).toHaveTextContent('');
    expect(__rq.setQueryData).toHaveBeenCalledTimes(1);
  });
});
