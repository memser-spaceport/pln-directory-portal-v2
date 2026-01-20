import React from 'react';
import { clsx } from 'clsx';
import Link from 'next/link';

import { PushNotification } from '@/types/push-notifications.types';

import { getCategoryLabel } from './utils/getCategoryLabel';
import { getNotificationIcon } from './utils/getNotificationIcon';

import { NotificationFooter } from './components/NotificationFooter';

import { AttendeesRow } from './components/AttendeesRow';

import s from './NotificationItem.module.scss';

interface NotificationItemProps {
  notification: PushNotification;
  onNotificationClick: (notification: PushNotification) => void;
  /** Variant controls styling differences between panel and page views */
  variant?: 'panel' | 'page';
  /** Callback for IRL_GATHERING notifications to open modal instead of navigating */
  onIrlGatheringClick?: (notification: PushNotification) => void;
}

export function NotificationItem(props: NotificationItemProps) {
  const { notification, onNotificationClick, variant = 'panel', onIrlGatheringClick } = props;

  const isIrlGathering = notification.category === 'IRL_GATHERING';

  const handleClick = (e: React.MouseEvent) => {
    onNotificationClick(notification);
    if (isIrlGathering && onIrlGatheringClick) {
      e.preventDefault();
      onIrlGatheringClick(notification);
    }
  };

  const content = (
    <>
      <div className={s.iconWrapper}>{getNotificationIcon(notification)}</div>
      <div className={s.notificationContent}>
        <div className={s.textSection}>
          <div className={s.categoryBadge}>{getCategoryLabel(notification.category)}</div>
          <div className={s.textContent}>
            <p className={s.notificationTitle}>{notification.title}</p>
            {notification.description && (
              <p className={s.notificationDescription}>
                {notification.description}{' '}
                {notification.category === 'DEMO_DAY_ANNOUNCEMENT' &&
                  notification?.metadata?.status === 'ACTIVE' &&
                  notification.link && (
                    <span>
                      To participate <Link href={notification.link}></Link>
                    </span>
                  )}
              </p>
            )}

            <AttendeesRow notification={notification} />
          </div>
        </div>
        <NotificationFooter variant={variant} notification={notification} isIrlGathering={isIrlGathering} />
      </div>
      <div
        className={clsx(s.unreadDot, {
          [s.hidden]: notification.isRead,
        })}
      />
    </>
  );

  // For IRL_GATHERING with modal handler, use a div instead of Link
  if (isIrlGathering && onIrlGatheringClick) {
    return (
      <div
        className={clsx(s.notificationItem, {
          [s.unread]: !notification.isRead,
        })}
        onClick={handleClick}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            handleClick(e as unknown as React.MouseEvent);
          }
        }}
      >
        {content}
      </div>
    );
  }

  let link = notification.link;

  if (isIrlGathering) {
    // @ts-ignore
    link = `/events/irl?location=${notification.metadata?.location?.name}`;
  }

  return (
    <Link
      href={(!link?.startsWith('/') ? `/${link}` : link) || '#'}
      className={clsx(s.notificationItem, {
        [s.unread]: !notification.isRead,
      })}
      onClick={handleClick}
    >
      {content}
    </Link>
  );
}
