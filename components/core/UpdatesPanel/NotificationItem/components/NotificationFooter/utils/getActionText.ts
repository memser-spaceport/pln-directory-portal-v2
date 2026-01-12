import { PushNotification } from '@/types/push-notifications.types';

export function getActionText(category: PushNotification['category']): string {
  switch (category) {
    case 'DEMO_DAY_LIKE':
    case 'DEMO_DAY_CONNECT':
    case 'DEMO_DAY_ANNOUNCEMENT':
    case 'DEMO_DAY_INVEST':
    case 'DEMO_DAY_REFERRAL':
    case 'DEMO_DAY_FEEDBACK':
      return 'View more';
    case 'EVENT':
      return 'View event';
    case 'IRL_GATHERING':
      return 'Learn more';
    case 'FORUM_POST':
      return 'Read more';
    case 'FORUM_REPLY':
      return 'View comment';
    case 'SYSTEM':
    default:
      return 'View';
  }
}
