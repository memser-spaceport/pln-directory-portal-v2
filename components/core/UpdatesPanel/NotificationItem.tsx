import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { clsx } from 'clsx';
import { PushNotification } from '@/types/push-notifications.types';
import { DemoDayIcon, EventIcon, ForumIcon, SystemIcon } from './icons';
import { formatTime, getCategoryLabel, getActionText } from './utils';
import s from './UpdatesPanel.module.scss';
import { getDefaultAvatar } from '@/hooks/useDefaultAvatar';

interface NotificationItemProps {
  notification: PushNotification;
  onNotificationClick: (notification: PushNotification) => void;
}

function getNotificationIcon(notification: PushNotification) {
  // Otherwise show category icon
  switch (notification.category) {
    case 'DEMO_DAY_LIKE':
    case 'DEMO_DAY_CONNECT':
    case 'DEMO_DAY_ANNOUNCEMENT':
    case 'DEMO_DAY_INVEST':
    case 'DEMO_DAY_REFERRAL':
    case 'DEMO_DAY_FEEDBACK':
      return (
        <div className={s.iconWrapper}>
          <DemoDayIcon />
        </div>
      );
    case 'EVENT':
      return (
        <div className={s.iconWrapper}>
          <EventIcon />
        </div>
      );
    case 'FORUM_POST':
    case 'FORUM_REPLY':
      return (
        <div className={s.iconWrapper}>
          <ForumIcon />
        </div>
      );
    case 'SYSTEM':
    default:
      return (
        <div className={s.iconWrapper}>
          <SystemIcon />
        </div>
      );
  }
}

export function NotificationItem({ notification, onNotificationClick }: NotificationItemProps) {
  return (
    <Link
      href={(!notification.link?.startsWith('/') ? `/${notification.link}` : notification.link) || '#'}
      className={clsx(s.notificationItem, {
        [s.unread]: !notification.isRead,
      })}
      onClick={() => onNotificationClick(notification)}
    >
      {getNotificationIcon(notification)}
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

            {(notification.category === 'FORUM_POST' || notification.category === 'FORUM_REPLY') &&
            notification.metadata?.authorName ? (
              <div className={s.authorInfo}>
                <div className={s.avatarWrapper}>
                  <Image
                    src={
                      notification.metadata?.authorPicture
                        ? (notification.metadata?.authorPicture as string)
                        : getDefaultAvatar((notification?.metadata?.authorUid as string) ?? '')
                    }
                    alt=""
                    width={40}
                    height={40}
                    className={s.avatar}
                  />
                </div>
                <div>by {(notification?.metadata?.authorName as string) ?? 'Unknown'}</div>
              </div>
            ) : null}
          </div>
        </div>
        <div className={s.notificationFooter}>
          <span className={s.timestamp}>{formatTime(notification.createdAt)}</span>
          {notification.link && <span className={s.actionLink}>{getActionText(notification.category)}</span>}
        </div>
      </div>
      <div
        className={clsx(s.unreadDot, {
          [s.hidden]: notification.isRead,
        })}
      />
    </Link>
  );
}
