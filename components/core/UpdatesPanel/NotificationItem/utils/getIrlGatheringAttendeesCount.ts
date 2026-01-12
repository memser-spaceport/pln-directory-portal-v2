import { IrlGatheringMetadata, PushNotification } from '@/types/push-notifications.types';

export function getIrlGatheringAttendeesCount(notification: PushNotification): number {
  const metadata = notification.metadata as unknown as Partial<IrlGatheringMetadata> | undefined;
  return metadata?.attendees?.total || 0;
}
