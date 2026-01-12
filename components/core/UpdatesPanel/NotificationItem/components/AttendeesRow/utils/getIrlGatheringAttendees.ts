import { IrlGatheringMetadata, PushNotification } from '@/types/push-notifications.types';
import { Attendee } from '@/components/core/UpdatesPanel/NotificationItem/components/AttendeesRow/types';

export function getIrlGatheringAttendees(notification: PushNotification): Attendee[] {
  const metadata = notification.metadata as unknown as Partial<IrlGatheringMetadata> | undefined;

  if (!metadata?.attendees?.topAttendees) {
    return [];
  }

  return metadata.attendees.topAttendees.map((a) => ({
    uid: a.memberUid,
    picture: a.imageUrl || undefined,
  }));
}
