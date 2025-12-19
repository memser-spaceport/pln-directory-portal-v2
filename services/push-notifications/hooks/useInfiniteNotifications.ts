'use client';

import { useInfiniteQuery } from '@tanstack/react-query';
import { PushNotification } from '@/types/push-notifications.types';
import { getNotifications } from '@/services/push-notifications.service';
import Cookies from 'js-cookie';
import { getParsedValue } from '@/utils/common.utils';

const NOTIFICATIONS_PER_PAGE = 10;

export const NotificationsQueryKeys = {
  INFINITE_NOTIFICATIONS: 'infinite-notifications',
} as const;

interface UseInfiniteNotificationsOptions {
  enabled?: boolean;
}

export function useInfiniteNotifications(options: UseInfiniteNotificationsOptions = {}) {
  const { enabled = true } = options;

  const {
    data,
    error,
    fetchNextPage,
    hasNextPage,
    isLoading,
    isFetchingNextPage,
    status,
    refetch,
    isRefetching,
  } = useInfiniteQuery({
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

  const notifications: PushNotification[] = data?.pages?.flatMap((page) => page.notifications) ?? [];
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

