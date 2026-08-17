import { normalizeLink } from '@/providers/PushNotificationsProvider/utils/normalizeLink';
import type { PushNotification } from '@/types/push-notifications.types';

/** True when this TEAM_NEWS notification targets the given news item (mention/reply). */
export function isTeamNewsItemNotification(notification: PushNotification, newsItemUid: string): boolean {
  if (notification.category !== 'TEAM_NEWS') return false;
  if (notification.metadata?.newsItemUid === newsItemUid) return true;
  if (!notification.link) return false;
  return normalizeLink(notification.link) === `/home?news=${newsItemUid}`;
}
