'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { clsx } from 'clsx';
import { PushNotification } from '@/types/push-notifications.types';
import { formatDistanceToNow } from 'date-fns';
import { AnimatePresence, motion } from 'framer-motion';
import s from './UpdatesPanel.module.scss';

interface UpdatesPanelProps {
  open: boolean;
  notifications: PushNotification[];
  onClose: () => void;
  onMarkAsRead: (id: string) => void;
}

export function UpdatesPanel({ open, notifications, onClose, onMarkAsRead }: UpdatesPanelProps) {

  const handleNotificationClick = (notification: PushNotification) => {
    if (!notification.isRead) {
      onMarkAsRead(notification.id);
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
    // If notification has an image (user avatar), show it
    if (notification.image) {
      return (
        <div className={s.avatarWrapper}>
          <Image src={notification.image} alt="" width={40} height={40} className={s.avatar} />
        </div>
      );
    }

    // Otherwise show category icon
    switch (notification.category) {
      case 'DEMO_DAY_LIKE':
      case 'DEMO_DAY_CONNECT':
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
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className={s.overlay}
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          />
          <motion.div
            className={s.panel}
            onClick={(e) => e.stopPropagation()}
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
          >
            <div className={s.header}>
              <h2 className={s.title}>Updates</h2>
              <button className={s.closeButton} onClick={onClose} aria-label="Close">
                <CloseIcon />
              </button>
            </div>

            <div className={s.content}>
              {notifications.length === 0 ? (
                <div className={s.emptyState}>
                  <p>No updates yet</p>
                </div>
              ) : (
                <div className={s.notificationsList}>
                  {notifications.map((notification) => (
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

            <div className={s.footer}>
              <Link href="/home#recent-updates" className={s.viewAllLink} onClick={onClose}>
                View all recent updates
                <ArrowRightIcon />
              </Link>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// Icons
function CloseIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M15 5L5 15M5 5L15 15"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function DemoDayIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M17.4167 3.66669H16.5V3.20835C16.5 3.05924 16.4407 2.91617 16.3344 2.80989C16.2281 2.70362 16.085 2.64435 15.9359 2.64435C15.7868 2.64435 15.6437 2.70362 15.5374 2.80989C15.4312 2.91617 15.3719 3.05924 15.3719 3.20835V3.66669H11.0052V3.20835C11.0052 3.05924 10.9459 2.91617 10.8396 2.80989C10.7334 2.70362 10.5903 2.64435 10.4412 2.64435C10.2921 2.64435 10.149 2.70362 10.0427 2.80989C9.93645 2.91617 9.87718 3.05924 9.87718 3.20835V3.66669H5.51051C5.21229 3.66669 4.92639 3.78507 4.71385 3.99761C4.50131 4.21015 4.38293 4.49605 4.38293 4.79427V17.4167C4.38293 17.7149 4.50131 18.0008 4.71385 18.2133C4.92639 18.4259 5.21229 18.5443 5.51051 18.5443H17.4167C17.7149 18.5443 18.0008 18.4259 18.2133 18.2133C18.4259 18.0008 18.5443 17.7149 18.5443 17.4167V4.79427C18.5443 4.49605 18.4259 4.21015 18.2133 3.99761C18.0008 3.78507 17.7149 3.66669 17.4167 3.66669ZM17.4167 17.4167H5.51051V7.05002H17.4167V17.4167ZM11.4635 15.1635L13.7188 12.0052H12.5698V10.1927L10.3146 13.351H11.4635V15.1635Z"
        fill="#1B4DFF"
      />
    </svg>
  );
}

function EventIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M17.4167 3.66669H16.5V3.20835C16.5 3.05924 16.4407 2.91617 16.3344 2.80989C16.2281 2.70362 16.085 2.64435 15.9359 2.64435C15.7868 2.64435 15.6437 2.70362 15.5374 2.80989C15.4312 2.91617 15.3719 3.05924 15.3719 3.20835V3.66669H11.0052V3.20835C11.0052 3.05924 10.9459 2.91617 10.8396 2.80989C10.7334 2.70362 10.5903 2.64435 10.4412 2.64435C10.2921 2.64435 10.149 2.70362 10.0427 2.80989C9.93645 2.91617 9.87718 3.05924 9.87718 3.20835V3.66669H5.51051C5.21229 3.66669 4.92639 3.78507 4.71385 3.99761C4.50131 4.21015 4.38293 4.49605 4.38293 4.79427V17.4167C4.38293 17.7149 4.50131 18.0008 4.71385 18.2133C4.92639 18.4259 5.21229 18.5443 5.51051 18.5443H17.4167C17.7149 18.5443 18.0008 18.4259 18.2133 18.2133C18.4259 18.0008 18.5443 17.7149 18.5443 17.4167V4.79427C18.5443 4.49605 18.4259 4.21015 18.2133 3.99761C18.0008 3.78507 17.7149 3.66669 17.4167 3.66669ZM17.4167 17.4167H5.51051V7.05002H17.4167V17.4167Z"
        fill="#1B4DFF"
      />
    </svg>
  );
}

function ForumIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M17.4167 5.51051H5.51051C4.91384 5.51051 4.38293 6.04142 4.38293 6.63809V15.3714C4.38293 15.9681 4.91384 16.499 5.51051 16.499H8.87718L11.4635 19.0854L14.0498 16.499H17.4167C18.0134 16.499 18.5443 15.9681 18.5443 15.3714V6.63809C18.5443 6.04142 18.0134 5.51051 17.4167 5.51051Z"
        stroke="#1B4DFF"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SystemIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M11 7.33331V11M11 14.6666H11.0113M19.25 11C19.25 15.5563 15.5563 19.25 11 19.25C6.44365 19.25 2.75 15.5563 2.75 11C2.75 6.44365 6.44365 2.75 11 2.75C15.5563 2.75 19.25 6.44365 19.25 11Z"
        stroke="#1B4DFF"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ArrowRightIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M2.91669 7H11.0834M11.0834 7L7.00002 2.91669M11.0834 7L7.00002 11.0834"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default UpdatesPanel;
