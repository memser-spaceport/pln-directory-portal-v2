import { UnreadLink } from '@/services/push-notifications.service';

import { normalizeLink } from './normalizeLink';
import { UnreadLinksMap } from '@/providers/PushNotificationsProvider/types';
import { IRL_GATHERING_ROUTE } from '@/constants/routes';

export function addUnreadLinkEntry(entry: UnreadLink, map: UnreadLinksMap) {
  const { uid, link } = entry;

  let normalized: string;
  if (link.includes(IRL_GATHERING_ROUTE)) {
    // IRL routes need query params preserved; handle both absolute and relative links
    if (/^https?:\/\//i.test(link)) {
      try {
        const url = new URL(link);
        normalized = `${url.pathname}?${url.searchParams.toString()}`;
      } catch {
        normalized = link.split('#')[0];
      }
    } else {
      normalized = link.split('#')[0];
    }
  } else {
    normalized = normalizeLink(link);
  }

  const existing = map.get(normalized);

  if (existing) {
    existing.add(uid);
  } else {
    map.set(normalized, new Set([uid]));
  }
}
