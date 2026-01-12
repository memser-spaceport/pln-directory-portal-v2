import get from 'lodash/get';
import map from 'lodash/map';
import isEmpty from 'lodash/isEmpty';

import { PushNotification } from '@/types/push-notifications.types';
import { Attendee } from '@/components/core/UpdatesPanel/NotificationItem/components/AttendeesRow/types';

import { getIrlGatheringAttendees } from './getIrlGatheringAttendees';

type Participant = {
  memberUid: string;
  picture?: string;
  displayName: string;
};

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

    const participants = get(metadata, 'participantsSummary.participants') as Participant[];

    let attendees: Attendee[] = map(participants, (participant) => {
      const { picture, memberUid, displayName } = participant;

      return {
        picture,
        displayName,
        uid: memberUid,
      };
    });

    attendees = isEmpty(attendees)
      ? [
          {
            uid: authorUid,
            picture: authorPicture,
            displayName: authorName,
          } as Attendee,
        ]
      : attendees;

    return attendees;
  }

  return [];
}
