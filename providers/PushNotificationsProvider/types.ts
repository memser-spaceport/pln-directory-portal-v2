import { PushNotification } from '@/types/push-notifications.types';

export interface PushNotificationsContextValue {
  notifications: PushNotification[];
  unreadCount: number;
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  refreshNotifications: () => Promise<void>;
}
