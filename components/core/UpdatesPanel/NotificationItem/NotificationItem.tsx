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
  /** When set, appended as ?backTo=<value> so the destination's BackButton returns here */
  backTo?: string;
}

export function NotificationItem(props: NotificationItemProps) {
  const { notification, onNotificationClick, variant = 'panel', backTo } = props;

  const isIrlGathering = notification.category === 'IRL_GATHERING';

  const handleClick = (e: React.MouseEvent) => {
    onNotificationClick(notification);
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

  let link = notification.link;

  if (isIrlGathering) {
    // @ts-ignore
    link = `/events/irl?location=${notification.metadata?.location?.name}&open-modal=true`;
  }

  let href = (!link?.startsWith('/') ? `/${link}` : link) || '#';
  if (backTo && href !== '#') {
    const separator = href.includes('?') ? '&' : '?';
    href = `${href}${separator}backTo=${encodeURIComponent(backTo)}`;
  }

  return (
    <Link
      href={href}
      className={clsx(s.notificationItem, {
        [s.unread]: !notification.isRead,
      })}
      onClick={handleClick}
    >
      {content}
    </Link>
  );
}
