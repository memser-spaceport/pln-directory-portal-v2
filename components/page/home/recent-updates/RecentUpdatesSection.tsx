'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { clsx } from 'clsx';
import { usePushNotificationsContext } from '@/providers/PushNotificationsProvider';
import { PushNotification } from '@/types/push-notifications.types';
import { formatDistanceToNow } from 'date-fns';
import s from './RecentUpdatesSection.module.scss';

export function RecentUpdatesSection() {
  const { notifications, markAsRead } = usePushNotificationsContext();

  const handleNotificationClick = (notification: PushNotification) => {
    if (!notification.isRead) {
      markAsRead(notification.id);
    }
  };

  const formatTime = (dateString: string) => {
    try {
      return (
        formatDistanceToNow(new Date(dateString), { addSuffix: false })
          .replace('about ', '')
          .replace('less than a minute', '1min')
          .replace(' minutes', 'min')
          .replace(' minute', 'min')
          .replace(' hours', 'h')
          .replace(' hour', 'h')
          .replace(' days', 'd')
          .replace(' day', 'd') + ' ago'
      );
    } catch {
      return '';
    }
  };

  const getCategoryLabel = (category: PushNotification['category']) => {
    switch (category) {
      case 'DEMO_DAY_LIKE':
      case 'DEMO_DAY_CONNECT':
      case 'DEMO_DAY_INVEST':
      case 'DEMO_DAY_REFERRAL':
      case 'DEMO_DAY_FEEDBACK':
        return 'Demo Day';
      case 'EVENT':
        return 'Events';
      case 'FORUM_POST':
      case 'FORUM_REPLY':
        return 'Forum';
      case 'SYSTEM':
      default:
        return 'System';
    }
  };

  const getActionText = (category: PushNotification['category']) => {
    switch (category) {
      case 'DEMO_DAY_LIKE':
      case 'DEMO_DAY_CONNECT':
      case 'DEMO_DAY_INVEST':
      case 'DEMO_DAY_REFERRAL':
      case 'DEMO_DAY_FEEDBACK':
        return 'View more';
      case 'EVENT':
        return 'View event';
      case 'FORUM_POST':
        return 'Read more';
      case 'FORUM_REPLY':
        return 'View comment';
      case 'SYSTEM':
      default:
        return 'View';
    }
  };

  const getNotificationIcon = (notification: PushNotification) => {
    if (notification.image) {
      return (
        <div className={s.avatarWrapper}>
          <Image src={notification.image} alt="" width={40} height={40} className={s.avatar} />
        </div>
      );
    }

    return (
      <div className={s.iconWrapper}>
        <DefaultIcon />
      </div>
    );
  };

  return (
    <section id="recent-updates" className={s.section}>
      <h2 className={s.title}>Recent Updates</h2>
      <div className={s.card}>
        <div className={s.container}>
          {notifications.length === 0 ? (
            <div className={s.emptyState}>
              <div className={s.emptyContent}>
                <img
                  src="/images/empty-nature.svg"
                  alt=""
                  className={s.emptyIllustration}
                />
                <h3 className={s.emptyTitle}>You are all caught up!</h3>
                <p className={s.emptyDescription}>
                  Relevant updates from forum posts, demo day and your connections will appear here.
                </p>
              </div>
            </div>
          ) : (
            <div className={s.notificationsList}>
              {notifications.slice(0, 5).map((notification) => (
                <Link
                  key={notification.id}
                  href={notification.link || '#'}
                  className={clsx(s.notificationItem, {
                    [s.unread]: !notification.isRead,
                  })}
                  onClick={() => handleNotificationClick(notification)}
                >
                  {getNotificationIcon(notification)}
                  <div className={s.notificationContent}>
                    <div className={s.textSection}>
                      <div className={s.categoryBadge}>{getCategoryLabel(notification.category)}</div>
                      <div className={s.textContent}>
                        <p className={s.notificationTitle}>{notification.title}</p>
                        {notification.description && (
                          <p className={s.notificationDescription}>{notification.description}</p>
                        )}
                      </div>
                    </div>
                    <div className={s.notificationFooter}>
                      <span className={s.timestamp}>{formatTime(notification.createdAt)}</span>
                      {notification.link && <span className={s.actionLink}>{getActionText(notification.category)}</span>}
                    </div>
                  </div>
                  {!notification.isRead && <div className={s.unreadDot} />}
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function DefaultIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M10 2C5.58172 2 2 5.58172 2 10C2 14.4183 5.58172 18 10 18C14.4183 18 18 14.4183 18 10C18 5.58172 14.4183 2 10 2ZM10 16C6.68629 16 4 13.3137 4 10C4 6.68629 6.68629 4 10 4C13.3137 4 16 6.68629 16 10C16 13.3137 13.3137 16 10 16Z"
        fill="currentColor"
      />
    </svg>
  );
}

export default RecentUpdatesSection;

