import React from 'react';
import isEmpty from 'lodash/isEmpty';

import { PushNotification } from '@/types/push-notifications.types';

import { getLabel } from './utils/getLabel';
import { getAttendees } from './utils/getAttendees';

import { AvatarGroup } from './components/AvatarGroup';

import s from './AttendeesRow.module.scss';

interface Props {
  notification: PushNotification;
}

export function AttendeesRow(props: Props) {
  const { notification } = props;

  const attendees = getAttendees(notification);
  const label = getLabel(notification, attendees);

  if (isEmpty(attendees)) {
    return null;
  }

  return (
    <div className={s.root}>
      <AvatarGroup attendees={attendees} />

      <span className={s.label}>{label}</span>
    </div>
  );
}
