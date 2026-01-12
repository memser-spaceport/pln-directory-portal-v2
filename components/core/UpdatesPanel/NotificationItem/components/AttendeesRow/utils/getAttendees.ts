import get from 'lodash/get';
import isEmpty from 'lodash/isEmpty';

import { PushNotification } from '@/types/push-notifications.types';
import { Attendee } from '@/components/core/UpdatesPanel/NotificationItem/components/AttendeesRow/types';

import { getIrlGatheringAttendees } from './getIrlGatheringAttendees';

export function getAttendees(notification: PushNotification): Attendee[] {
  const { category, metadata: m } = notification;
  const metadata = m || {};

  if (category === 'EVENT') {
    return (metadata.attendees as Attendee[]) || [];
  }

  if (category === 'IRL_GATHERING') {
    return getIrlGatheringAttendees(notification) || [];
  }

  if (['FORUM_POST', 'FORUM_REPLY'].includes(category)) {
    const { authorPicture, authorUid, authorName } = metadata;

    let attendees = get(metadata, 'participantsSummary.participants');

    attendees = isEmpty(attendees) ? [
      {
        uid: authorUid,
        picture: authorPicture,
        displayName: authorName
      }
    ] : attendees;


    return attendees as Attendee[];
  }

  return [];
}
