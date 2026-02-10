import { stripHtml } from './stripHtml';

/**
 * Sanitizes notification title and description by removing HTML markup
 */
export function sanitizeNotification<T extends { title?: string; description?: string }>(notification: T): T {
  return {
    ...notification,
    title: stripHtml(notification.title),
    description: stripHtml(notification.description),
  };
}
