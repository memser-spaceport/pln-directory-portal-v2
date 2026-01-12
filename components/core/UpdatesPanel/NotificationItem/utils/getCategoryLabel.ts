
import { PushNotification } from '@/types/push-notifications.types';

export function getCategoryLabel(category: PushNotification['category']): string {
  switch (category) {
    case 'DEMO_DAY_LIKE':
    case 'DEMO_DAY_CONNECT':
    case 'DEMO_DAY_ANNOUNCEMENT':
    case 'DEMO_DAY_INVEST':
    case 'DEMO_DAY_REFERRAL':
    case 'DEMO_DAY_FEEDBACK':
      return 'Demo Day';
    case 'EVENT':
    case 'IRL_GATHERING':
      return 'Events';
    case 'FORUM_POST':
    case 'FORUM_REPLY':
      return 'Forum';
    case 'SYSTEM':
    default:
      return 'System';
  }
}
