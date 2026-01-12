import React from 'react';
import { clsx } from 'clsx';
import Link from 'next/link';
import Image from 'next/image';

import { getDefaultAvatar } from '@/hooks/useDefaultAvatar';
import { PushNotification } from '@/types/push-notifications.types';

import { getCategoryLabel } from './utils/getCategoryLabel';
import { getNotificationIcon } from './utils/getNotificationIcon';
import { getIrlGatheringAttendees } from './utils/getIrlGatheringAttendees';
import { getIrlGatheringAttendeesCount } from './utils/getIrlGatheringAttendeesCount';

import { NotificationFooter } from './components/NotificationFooter';

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

            {/* Attendees row for EVENT notifications */}
            {notification.category === 'EVENT' && notification.metadata?.attendees ? (
              <div className={s.attendeesRow}>
                <div className={s.attendeesAvatarGroup}>
                  {(notification.metadata.attendees as Array<{ uid: string; picture?: string }>)
                    .slice(0, 3)
                    .map((attendee, index) => (
                      <div key={attendee.uid || index} className={s.attendeeAvatar}>
                        <Image
                          src={attendee.picture || getDefaultAvatar(attendee.uid || '')}
                          alt=""
                          width={20}
                          height={20}
                        />
                      </div>
                    ))}
                </div>
                <span className={s.attendeesCount}>{notification.metadata.attendeesCount as number} People going</span>
              </div>
            ) : null}

            {/* Attendees row for IRL_GATHERING notifications */}
            {notification.category === 'IRL_GATHERING' && getIrlGatheringAttendeesCount(notification) > 0 ? (
              <div className={s.attendeesRow}>
                <div className={s.attendeesAvatarGroup}>
                  {getIrlGatheringAttendees(notification)
                    .slice(0, 3)
                    .map((attendee, index) => (
                      <div key={attendee.uid || index} className={s.attendeeAvatar}>
                        <Image
                          src={attendee.picture || getDefaultAvatar(attendee.uid || '')}
                          alt=""
                          width={20}
                          height={20}
                        />
                      </div>
                    ))}
                </div>
                <span className={s.attendeesCount}>{getIrlGatheringAttendeesCount(notification)} People going</span>
              </div>
            ) : null}
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
