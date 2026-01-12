import React from 'react';

import { PushNotification } from '@/types/push-notifications.types';

import { ArrowRightIcon } from '@/components/core/UpdatesPanel/icons';

import { getActionText } from './utils/getActionText';
import { getFooterDetails } from './utils/getFooterDetails';

import { DetailsItem } from './components/DetailsItem';

import s from './NotificationFooter.module.scss';

interface Props {
  notification: PushNotification;
  isIrlGathering: boolean;
  variant?: 'panel' | 'page';
}

export function NotificationFooter(props: Props) {
  const { variant, notification, isIrlGathering } = props;

  const details = getFooterDetails(notification);

  return (
    <div className={s.root}>
      <div className={s.details}>
        {details.map((data) => (
          <DetailsItem data={data} key={data} />
        ))}
      </div>

      {(notification.link || isIrlGathering) && (
        <span className={s.actionLink}>
          {getActionText(notification.category)}
          {variant === 'page' && <ArrowRightIcon />}
        </span>
      )}
    </div>
  );
}
