import React from 'react';
import { useMedia } from 'react-use';

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

  const isMobile = useMedia('(max-width: 640px)');

  const details = getFooterDetails(notification);

  const actionText = notification.linkText ?? getActionText(notification.category);

  return (
    <div className={s.root}>
      <div className={s.details}>
        {details.map((data, index) => (
          <DetailsItem data={data} key={index} showIcon={isMobile} showLabel={!isMobile} />
        ))}
      </div>

      {(notification.link || isIrlGathering) && (
        <span className={s.actionLink}>
          {/* The page variant draws its own arrow, so a text arrow at the end of linkText would double it. */}
          {variant === 'page' ? actionText.replace(/\s*→\s*$/, '') : actionText}
          {variant === 'page' && <ArrowRightIcon />}
        </span>
      )}
    </div>
  );
}
