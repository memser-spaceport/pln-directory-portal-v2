import { formatDistanceToNow } from 'date-fns';
import { PushNotification } from '@/types/push-notifications.types';

export function formatTime(dateString: string): string {
  try {
    return (
      formatDistanceToNow(new Date(dateString), { addSuffix: false })
        .replace('about ', '')
        .replace('less than a minute', '1min')
        .replace(' minutes', 'min')
        .replace(' minute', 'min')
        .replace(' hours', 'h')
        .replace(' hour', 'h')
        .replace(' days', 'd')
        .replace(' day', 'd') + ' ago'
    );
  } catch {
    return '';
  }
}

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
      return 'Events';
    case 'FORUM_POST':
    case 'FORUM_REPLY':
      return 'Forum';
    case 'SYSTEM':
    default:
      return 'System';
  }
}

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
    case 'FORUM_POST':
      return 'Read more';
    case 'FORUM_REPLY':
      return 'View comment';
    case 'SYSTEM':
    default:
      return 'View';
  }
}
