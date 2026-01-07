import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { clsx } from 'clsx';
import { PushNotification, IrlGatheringMetadata } from '@/types/push-notifications.types';
import { DemoDayIcon, EventIcon, ForumIcon, SystemIcon, ArrowRightIcon } from './icons';
import { formatTime, getCategoryLabel, getActionText } from './utils';
import s from './UpdatesPanel.module.scss';
import { getDefaultAvatar } from '@/hooks/useDefaultAvatar';

function getIrlGatheringAttendees(notification: PushNotification): Array<{ uid: string; picture?: string }> {
  const metadata = notification.metadata as unknown as Partial<IrlGatheringMetadata> | undefined;
  if (!metadata?.attendees?.topAttendees) return [];
  return metadata.attendees.topAttendees.map((a) => ({
    uid: a.memberUid,
    picture: a.imageUrl || undefined,
  }));
}

function getIrlGatheringAttendeesCount(notification: PushNotification): number {
  const metadata = notification.metadata as unknown as Partial<IrlGatheringMetadata> | undefined;
  return metadata?.attendees?.total || 0;
}

interface NotificationItemProps {
  notification: PushNotification;
  onNotificationClick: (notification: PushNotification) => void;
  /** Variant controls styling differences between panel and page views */
  variant?: 'panel' | 'page';
  /** Callback for IRL_GATHERING notifications to open modal instead of navigating */
  onIrlGatheringClick?: (notification: PushNotification) => void;
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
    case 'IRL_GATHERING':
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

export function NotificationItem({
  notification,
  onNotificationClick,
  variant = 'panel',
  onIrlGatheringClick,
}: NotificationItemProps) {
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
        <div className={s.notificationFooter}>
          <span className={s.timestamp}>{formatTime(notification.createdAt)}</span>
          {(notification.link || isIrlGathering) && (
            <span className={s.actionLink}>
              {getActionText(notification.category)}
              {variant === 'page' && <ArrowRightIcon />}
            </span>
          )}
        </div>
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

  return (
    <Link
      href={(!notification.link?.startsWith('/') ? `/${notification.link}` : notification.link) || '#'}
      className={clsx(s.notificationItem, {
        [s.unread]: !notification.isRead,
      })}
      onClick={handleClick}
    >
      {content}
    </Link>
  );
}
