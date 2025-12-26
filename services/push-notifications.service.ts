import { PushNotification } from '@/types/push-notifications.types';

const API_URL = process.env.DIRECTORY_API_URL;

interface GetNotificationsResponse {
  notifications: PushNotification[];
  total: number;
  unreadCount: number;
}

interface GetUnreadCountResponse {
  unreadCount: number;
}

/**
 * Fetch notifications for the current user
 */
export async function getNotifications(
  authToken: string,
  options?: { limit?: number; offset?: number; unreadOnly?: boolean }
): Promise<GetNotificationsResponse> {
  const params = new URLSearchParams();
  if (options?.limit) params.set('limit', options.limit.toString());
  if (options?.offset) params.set('offset', options.offset.toString());
  if (options?.unreadOnly) params.set('unreadOnly', 'true');

  const response = await fetch(`${API_URL}/v1/push-notifications?${params}`, {
    headers: {
      Authorization: `Bearer ${authToken}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch notifications');
  }

  return response.json();
}

/**
 * Get unread notification count
 */
export async function getUnreadCount(authToken: string): Promise<number> {
  const response = await fetch(`${API_URL}/v1/push-notifications/unread-count`, {
    headers: {
      Authorization: `Bearer ${authToken}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch unread count');
  }

  const data: GetUnreadCountResponse = await response.json();
  return data.unreadCount;
}

/**
 * Mark a notification as read
 */
export async function markNotificationAsRead(
  authToken: string,
  notificationUid: string
): Promise<void> {
  const response = await fetch(`${API_URL}/v1/push-notifications/${notificationUid}/read`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${authToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to mark notification as read');
  }
}

/**
 * Mark all notifications as read
 */
export async function markAllNotificationsAsRead(authToken: string): Promise<void> {
  const response = await fetch(`${API_URL}/v1/push-notifications/mark-all-read`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${authToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to mark all notifications as read');
  }
}
