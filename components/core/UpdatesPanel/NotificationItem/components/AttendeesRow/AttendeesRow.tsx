import React from 'react';
import isEmpty from 'lodash/isEmpty';

import { PushNotification } from '@/types/push-notifications.types';

import { getLabel } from './utils/getLabel';
import { getAttendees } from './utils/getAttendees';

import { AvatarGroup } from './components/AvatarGroup';

import s from './AttendeesRow.module.scss';

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M11.6667 3.5L5.25 9.91667L2.33333 7"
        stroke="#0A9952"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

interface Props {
  notification: PushNotification;
}

export function AttendeesRow(props: Props) {
  const { notification } = props;

  const attendees = getAttendees(notification);
  const label = getLabel(notification, attendees);
  const isAttended = notification.isAttended;

  if (isEmpty(attendees)) {
    return null;
  }

  const renderLabel = () => {
    if (isAttended && label.startsWith('You')) {
      return (
        <>
          <span className={s.labelYou}>You</span>
          <span className={s.label}>{label.slice(3)}</span>
        </>
      );
    }
    return <span className={s.label}>{label}</span>;
  };

  return (
    <div className={s.root}>
      <AvatarGroup attendees={attendees} isAttended={isAttended} />

      <div className={s.labelContainer}>
        {isAttended && (
          <span className={s.checkIcon}>
            <CheckIcon />
          </span>
        )}
        {renderLabel()}
      </div>
    </div>
  );
}
