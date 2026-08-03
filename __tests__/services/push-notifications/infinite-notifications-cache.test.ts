import type { QueryClient } from '@tanstack/react-query';
import {
  INFINITE_NOTIFICATIONS_KEY,
  patchInfiniteNotificationsAllRead,
  restoreInfiniteNotifications,
  type InfiniteNotificationsData,
} from '@/services/push-notifications/hooks/useInfiniteNotifications';

function makeQueryClient(initial?: InfiniteNotificationsData) {
  let store: InfiniteNotificationsData | undefined = initial;
  return {
    getQueryData: jest.fn(() => store),
    setQueryData: jest.fn((_key: unknown, value: InfiniteNotificationsData) => {
      store = value;
    }),
    read: () => store,
  } as unknown as QueryClient & { read: () => InfiniteNotificationsData | undefined };
}

const cache = (): InfiniteNotificationsData => ({
  pages: [
    {
      notifications: [
        { id: 'a', isRead: false },
        { id: 'b', isRead: true },
      ] as InfiniteNotificationsData['pages'][number]['notifications'],
      total: 3,
      unreadCount: 2,
      offset: 0,
    },
    {
      notifications: [{ id: 'c', isRead: false }] as InfiniteNotificationsData['pages'][number]['notifications'],
      total: 3,
      unreadCount: 2,
      offset: 2,
    },
  ],
  pageParams: [0, 2],
});

describe('patchInfiniteNotificationsAllRead', () => {
  it('flips every cached page to read and zeroes each unreadCount', () => {
    const client = makeQueryClient(cache());

    patchInfiniteNotificationsAllRead(client);

    const patched = client.read()!;
    expect(patched.pages.every((p) => p.unreadCount === 0)).toBe(true);
    expect(patched.pages.flatMap((p) => p.notifications).every((n) => n.isRead)).toBe(true);
    // Untouched fields survive the patch.
    expect(patched.pages[1].offset).toBe(2);
    expect(patched.pageParams).toEqual([0, 2]);
  });

  it('returns the pre-patch snapshot, which restore puts back verbatim', () => {
    const original = cache();
    const client = makeQueryClient(original);

    const snapshot = patchInfiniteNotificationsAllRead(client);
    expect(snapshot).toBe(original);

    restoreInfiniteNotifications(client, snapshot!);
    expect(client.read()).toBe(original);
    expect(client.setQueryData).toHaveBeenLastCalledWith(INFINITE_NOTIFICATIONS_KEY, original);
  });

  it('is a no-op with nothing cached (the page was never visited)', () => {
    const client = makeQueryClient(undefined);

    expect(patchInfiniteNotificationsAllRead(client)).toBeUndefined();
    expect(client.setQueryData).not.toHaveBeenCalled();
  });
});
