import { UnreadLink } from '@/services/push-notifications.service';

import { normalizeLink } from './normalizeLink';
import { UnreadLinksMap } from '@/providers/PushNotificationsProvider/types';
import { IRL_GATHERING_ROUTE } from '@/constants/routes';

export function addUnreadLinkEntry(entry: UnreadLink, map: UnreadLinksMap) {
  const { uid, link } = entry;

  const normalized = link.includes(IRL_GATHERING_ROUTE) ? link : normalizeLink(link);
  const existing = map.get(normalized);

  if (existing) {
    existing.add(uid);
  } else {
    map.set(normalized, new Set([uid]));
  }
}
