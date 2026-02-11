import { UnreadLinksMap } from '@/providers/PushNotificationsProvider/types';

/**
 * Removes a single UID from the unread links map.
 * Cleans up the map entry entirely if the set becomes empty.
 */
export function removeUnreadLinkUid(uid: string, map: UnreadLinksMap) {
  for (const [path, uids] of map) {
    if (uids.delete(uid)) {
      if (uids.size === 0) {
        map.delete(path);
      }
      return;
    }
  }
}
