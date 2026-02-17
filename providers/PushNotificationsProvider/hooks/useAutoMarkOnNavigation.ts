import { type MutableRefObject, useEffect, useRef } from 'react';

import { markNotificationAsRead } from '@/services/push-notifications.service';

import { UnreadLinksMap } from '../types';

import { useGetPathToCompareNotificationLink } from './useGetPathToCompareNotificationLink';

interface UseAutoMarkOnNavigationOptions {
  authToken?: string;
  unreadLinksMapRef: MutableRefObject<UnreadLinksMap>;
  wsMarkAsReadRef: MutableRefObject<(id: string) => void>;
  fetchNotifications: () => Promise<void>;
}

/**
 * Automatically marks notifications as read when the user navigates to a page
 * that matches an entry in the unread links map.
 */
export function useAutoMarkOnNavigation(input: UseAutoMarkOnNavigationOptions) {
  const { authToken, unreadLinksMapRef, wsMarkAsReadRef, fetchNotifications } = input;

  const pathToCompareNotyLink = useGetPathToCompareNotificationLink();
  const isAutoMarkingRef = useRef(false);

  const unreadMap = unreadLinksMapRef.current;

  useEffect(() => {
    const uids = unreadMap.get(pathToCompareNotyLink);

    if (!authToken || !pathToCompareNotyLink || isAutoMarkingRef.current || !uids || uids.size === 0) {
      return;
    }

    isAutoMarkingRef.current = true;

    // Grab UIDs and remove the entry from the map immediately to prevent duplicate runs
    const uidsToMark = [...uids];
    unreadMap.delete(pathToCompareNotyLink);

    const markAll = async () => {
      try {
        await Promise.allSettled(
          uidsToMark.map(async (uid) => {
            await markNotificationAsRead(authToken, uid);
            wsMarkAsReadRef.current(uid);
          }),
        );
        await fetchNotifications();
      } finally {
        isAutoMarkingRef.current = false;
      }
    };

    markAll();
  }, [authToken, wsMarkAsReadRef, unreadMap.size, unreadLinksMapRef, fetchNotifications, pathToCompareNotyLink]);
}
