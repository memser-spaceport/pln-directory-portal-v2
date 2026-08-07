'use client';

import { useInfiniteQuery, type QueryClient } from '@tanstack/react-query';
import { PushNotification } from '@/types/push-notifications.types';
import { getNotifications } from '@/services/push-notifications.service';
import Cookies from 'js-cookie';
import { getParsedValue } from '@/utils/common.utils';

const NOTIFICATIONS_PER_PAGE = 10;

export const NotificationsQueryKeys = {
  INFINITE_NOTIFICATIONS: 'infinite-notifications',
} as const;

export const INFINITE_NOTIFICATIONS_KEY = [NotificationsQueryKeys.INFINITE_NOTIFICATIONS];

interface NotificationsPage {
  notifications: PushNotification[];
  total: number;
  unreadCount: number;
  offset?: number;
}

export interface InfiniteNotificationsData {
  pages: NotificationsPage[];
  pageParams: unknown[];
}

/**
 * Flip every cached notification to read and zero each page's unreadCount, in
 * place — used by the provider's markAllAsRead. setQueryData rather than
 * invalidateQueries on purpose: the server sorts unread-first and paginates in
 * memory, so a refetch after mark-all reshuffles rows already on screen (and
 * recomputing unreadCount server-side is expensive).
 *
 * Returns the pre-patch snapshot for rollback, or undefined when nothing is
 * cached (the /recent-updates page was never visited).
 */
export function patchInfiniteNotificationsAllRead(queryClient: QueryClient): InfiniteNotificationsData | undefined {
  const previous = queryClient.getQueryData<InfiniteNotificationsData>(INFINITE_NOTIFICATIONS_KEY);
  if (!previous) return undefined;

  queryClient.setQueryData<InfiniteNotificationsData>(INFINITE_NOTIFICATIONS_KEY, {
    ...previous,
    pages: previous.pages.map((page) => ({
      ...page,
      unreadCount: 0,
      notifications: page.notifications.map((n) => (n.isRead ? n : { ...n, isRead: true })),
    })),
  });

  return previous;
}

export function restoreInfiniteNotifications(queryClient: QueryClient, snapshot: InfiniteNotificationsData): void {
  queryClient.setQueryData(INFINITE_NOTIFICATIONS_KEY, snapshot);
}

interface UseInfiniteNotificationsOptions {
  enabled?: boolean;
}

export function useInfiniteNotifications(options: UseInfiniteNotificationsOptions = {}) {
  const { enabled = true } = options;

  const { data, error, fetchNextPage, hasNextPage, isLoading, isFetchingNextPage, status, refetch, isRefetching } =
    useInfiniteQuery({
      queryKey: [NotificationsQueryKeys.INFINITE_NOTIFICATIONS],
      initialPageParam: 0,
      enabled,
      queryFn: async ({ pageParam = 0 }) => {
        const authToken = getParsedValue(Cookies.get('authToken'));
        if (!authToken) {
          return { notifications: [], total: 0, unreadCount: 0 };
        }

        const response = await getNotifications(authToken, {
          limit: NOTIFICATIONS_PER_PAGE,
          offset: pageParam,
        });

        return {
          notifications: response.notifications.map((n) => ({
            ...n,
            id: n.uid ?? n.id, // Normalize id field
          })),
          total: response.total,
          unreadCount: response.unreadCount,
          offset: pageParam,
        };
      },
      getNextPageParam: (lastPage, allPages) => {
        const totalFetched = allPages.reduce((acc, page) => acc + page.notifications.length, 0);
        if (totalFetched >= lastPage.total) {
          return undefined; // No more pages
        }
        return totalFetched; // Next offset
      },
    });

  // Dedupe by id: cumulative offsets are computed against the ordering at
  // fetch time, and a mark-all changes the server's unread-first sort — a page
  // fetched afterwards can re-serve rows that are already on screen.
  const seenIds = new Set<string>();
  const notifications: PushNotification[] = (data?.pages?.flatMap((page) => page.notifications) ?? []).filter((n) => {
    if (seenIds.has(n.id)) return false;
    seenIds.add(n.id);
    return true;
  });
  const total = data?.pages?.[0]?.total ?? 0;
  const unreadCount = data?.pages?.[0]?.unreadCount ?? 0;

  return {
    notifications,
    total,
    unreadCount,
    error,
    fetchNextPage,
    hasNextPage: hasNextPage ?? false,
    isLoading,
    isFetchingNextPage,
    status,
    refetch,
    isRefetching,
  };
}
