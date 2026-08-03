import { PushNotification } from '@/types/push-notifications.types';

export interface PushNotificationsContextValue {
  notifications: PushNotification[];
  unreadCount: number;
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
  markAsRead: (id: string) => void;
  /** Rejects on API failure (after rolling back) so surfaces can report it —
   *  there is no toast/undo in this flow, analytics is the only failure signal. */
  markAllAsRead: () => Promise<void>;
  refreshNotifications: () => Promise<void>;
}

export type UnreadLinksMap = Map<string, Set<string>>;
