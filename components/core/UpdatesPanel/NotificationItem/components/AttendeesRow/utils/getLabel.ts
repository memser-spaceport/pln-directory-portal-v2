import first from 'lodash/first';

import { PushNotification } from '@/types/push-notifications.types';
import { Attendee } from '@/components/core/UpdatesPanel/NotificationItem/components/AttendeesRow/types';

export function getLabel(notification: PushNotification, attendees: Attendee[]) {
  const { category, metadata, isAttended } = notification;

  const attendeesNum = attendees.length;

  if (category === 'EVENT') {
    return `${metadata?.attendeesCount as number} People going`;
  }

  if (category === 'IRL_GATHERING') {
    if (isAttended) {
      // @ts-ignore
      return `You and ${metadata?.attendees?.total - 1} People going`;
    }
    // @ts-ignore
    return `${metadata?.attendees?.total} People going`;
  }

  if (['FORUM_POST', 'FORUM_REPLY'].includes(category)) {
    if (attendeesNum < 1) {
      return '';
    }

    const firstAttendee = first(attendees);
    const remainingNum = attendeesNum - 1;

    if (attendeesNum === 1) {
      return `by ${firstAttendee?.displayName ?? 'Unknown'}`;
    }

    return `${firstAttendee?.displayName} and ${remainingNum} other${remainingNum === 1 ? '' : 's'} in this conversation`;
  }

  return '';
}
