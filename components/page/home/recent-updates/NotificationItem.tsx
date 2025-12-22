import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { PushNotification } from '@/types/push-notifications.types';
import { DemoDayIcon, EventIcon, ForumIcon, SystemIcon, ArrowRightIcon } from './icons';
import { formatTime, getCategoryLabel, getActionText } from './utils';
import s from './RecentUpdatesSection.module.scss';

interface NotificationItemProps {
  notification: PushNotification;
  onNotificationClick: (notification: PushNotification) => void;
}

function getNotificationIcon(notification: PushNotification) {
  if (notification.image) {
    return (
      <div className={s.avatarWrapper}>
        <Image src={notification.image} alt="" width={40} height={40} className={s.avatar} />
      </div>
    );
  }

  // Return category-specific icon
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
      href={notification.link || '#'}
      className={s.notificationItem}
      onClick={() => onNotificationClick(notification)}
    >
      {getNotificationIcon(notification)}
      <div className={s.notificationContent}>
        <div className={s.textSection}>
          <div className={s.categoryBadge}>{getCategoryLabel(notification.category)}</div>
          <p className={s.notificationTitle}>{notification.title}</p>
          {notification.description && <p className={s.notificationDescription}>{notification.description}</p>}
        </div>
        <div className={s.notificationFooter}>
          <div className={s.infoSection}>
            <span className={s.timestamp}>{formatTime(notification.createdAt)}</span>
          </div>
          {notification.link && (
            <span className={s.actionLink}>
              {getActionText(notification.category)}
              <ArrowRightIcon />
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
