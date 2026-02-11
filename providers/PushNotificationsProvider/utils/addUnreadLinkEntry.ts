import { UnreadLink } from '@/services/push-notifications.service';

import { normalizeLink } from './normalizeLink';
import { UnreadLinksMap } from '@/providers/PushNotificationsProvider/types';

export function addUnreadLinkEntry(entry: UnreadLink, map: UnreadLinksMap) {
  const { uid, link } = entry;

  const normalized = normalizeLink(link);
  const existing = map.get(normalized);
  if (existing) {
    existing.add(uid);
  } else {
    map.set(normalized, new Set([uid]));
  }
}
