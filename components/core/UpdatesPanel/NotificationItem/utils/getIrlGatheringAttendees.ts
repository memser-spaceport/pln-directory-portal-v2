import { IrlGatheringMetadata, PushNotification } from '@/types/push-notifications.types';

export function getIrlGatheringAttendees(notification: PushNotification): Array<{ uid: string; picture?: string }> {
  const metadata = notification.metadata as unknown as Partial<IrlGatheringMetadata> | undefined;
  if (!metadata?.attendees?.topAttendees) return [];
  return metadata.attendees.topAttendees.map((a) => ({
    uid: a.memberUid,
    picture: a.imageUrl || undefined,
  }));
}
