'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { clsx } from 'clsx';
import { PushNotification, PushNotificationCategory } from '@/types/push-notifications.types';
import { formatDistanceToNow } from 'date-fns';
import s from './UpdatesPanel.module.scss';

// Tab configuration
type TabKey = 'all' | 'demo_day' | 'forum' | 'events' | 'feedback';

interface Tab {
  key: TabKey;
  label: string;
  categories: PushNotificationCategory[];
}

const TABS: Tab[] = [
  {
    key: 'all',
    label: 'All',
    categories: [],
  },
  {
    key: 'demo_day',
    label: 'Demo Day',
    categories: ['DEMO_DAY_LIKE', 'DEMO_DAY_CONNECT', 'DEMO_DAY_INVEST', 'DEMO_DAY_REFERRAL'],
  },
  {
    key: 'forum',
    label: 'Forum',
    categories: ['FORUM_POST', 'FORUM_REPLY'],
  },
  {
    key: 'events',
    label: 'Events',
    categories: ['EVENT'],
  },
  {
    key: 'feedback',
    label: 'Feedback',
    categories: ['DEMO_DAY_FEEDBACK'],
  },
];

interface UpdatesPanelProps {
  open: boolean;
  notifications: PushNotification[];
  onClose: () => void;
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
}

export function UpdatesPanel({ open, notifications, onClose, onMarkAsRead, onMarkAllAsRead }: UpdatesPanelProps) {
  const [activeTab, setActiveTab] = useState<TabKey>('all');

  const unreadCount = useMemo(() => notifications.filter((n) => !n.isRead).length, [notifications]);

  const filteredNotifications = useMemo(() => {
    const tab = TABS.find((t) => t.key === activeTab);
    if (!tab || tab.key === 'all') {
      return notifications;
    }
    return notifications.filter((n) => tab.categories.includes(n.category));
  }, [notifications, activeTab]);

  if (!open) return null;

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
        return 'Read post';
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

  const hasUnreadNotifications = unreadCount > 0;

  return (
    <div className={s.overlay} onClick={onClose}>
      <div className={s.panel} onClick={(e) => e.stopPropagation()}>
        <div className={s.header}>
          <h2 className={s.title}>Updates</h2>
          <button className={s.closeButton} onClick={onClose} aria-label="Close">
            <CloseIcon />
          </button>
        </div>

        <div className={s.tabs}>
          {TABS.map((tab) => (
            <button
              key={tab.key}
              className={clsx(s.tab, { [s.active]: activeTab === tab.key })}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
              {tab.key === 'all' && unreadCount > 0 && <span className={s.tabBadge}>{unreadCount}</span>}
            </button>
          ))}
        </div>

        <div className={s.content}>
          {filteredNotifications.length === 0 ? (
            <div className={s.emptyState}>
              <p>No updates yet</p>
            </div>
          ) : (
            <div className={s.notificationsList}>
              {filteredNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={clsx(s.notificationItem, {
                    [s.unread]: !notification.isRead,
                  })}
                  onClick={() => handleNotificationClick(notification)}
                >
                  {getNotificationIcon(notification)}
                  <div className={s.notificationContent}>
                    <p className={s.notificationText}>
                      <span className={s.notificationTitle}>{notification.title}</span>
                      {notification.description && (
                        <span className={s.notificationDescription}> {notification.description}</span>
                      )}
                      {notification.link && (
                        <Link href={notification.link} className={s.actionLink} onClick={(e) => e.stopPropagation()}>
                          {getActionText(notification.category)}
                        </Link>
                      )}
                    </p>
                    <span className={s.timestamp}>{formatTime(notification.createdAt)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className={s.footer}>
          <Link href="/notifications" className={s.viewAllLink} onClick={onClose}>
            View recent updates
            <ArrowRightIcon />
          </Link>
          {hasUnreadNotifications && (
            <button className={s.markAllReadButton} onClick={onMarkAllAsRead}>
              Mark all as read
              <CheckIcon />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// Icons
function CloseIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M18 6L6 18M6 6L18 18"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function DemoDayIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="24" height="24" rx="6" fill="#EBF3FF" />
      <path
        d="M16 7H15V6.5C15 6.36739 14.9473 6.24021 14.8536 6.14645C14.7598 6.05268 14.6326 6 14.5 6C14.3674 6 14.2402 6.05268 14.1464 6.14645C14.0527 6.24021 14 6.36739 14 6.5V7H10V6.5C10 6.36739 9.94732 6.24021 9.85355 6.14645C9.75979 6.05268 9.63261 6 9.5 6C9.36739 6 9.24021 6.05268 9.14645 6.14645C9.05268 6.24021 9 6.36739 9 6.5V7H8C7.73478 7 7.48043 7.10536 7.29289 7.29289C7.10536 7.48043 7 7.73478 7 8V16C7 16.2652 7.10536 16.5196 7.29289 16.7071C7.48043 16.8946 7.73478 17 8 17H16C16.2652 17 16.5196 16.8946 16.7071 16.7071C16.8946 16.5196 17 16.2652 17 16V8C17 7.73478 16.8946 7.48043 16.7071 7.29289C16.5196 7.10536 16.2652 7 16 7ZM16 16H8V10H16V16ZM12 14.5L13.5 12.5H12.5V11L11 13H12V14.5Z"
        fill="#156FF7"
      />
    </svg>
  );
}

function EventIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="24" height="24" rx="6" fill="#F0FDF4" />
      <path
        d="M16 7H15V6.5C15 6.36739 14.9473 6.24021 14.8536 6.14645C14.7598 6.05268 14.6326 6 14.5 6C14.3674 6 14.2402 6.05268 14.1464 6.14645C14.0527 6.24021 14 6.36739 14 6.5V7H10V6.5C10 6.36739 9.94732 6.24021 9.85355 6.14645C9.75979 6.05268 9.63261 6 9.5 6C9.36739 6 9.24021 6.05268 9.14645 6.14645C9.05268 6.24021 9 6.36739 9 6.5V7H8C7.73478 7 7.48043 7.10536 7.29289 7.29289C7.10536 7.48043 7 7.73478 7 8V16C7 16.2652 7.10536 16.5196 7.29289 16.7071C7.48043 16.8946 7.73478 17 8 17H16C16.2652 17 16.5196 16.8946 16.7071 16.7071C16.8946 16.5196 17 16.2652 17 16V8C17 7.73478 16.8946 7.48043 16.7071 7.29289C16.5196 7.10536 16.2652 7 16 7ZM16 16H8V10H16V16Z"
        fill="#10B981"
      />
    </svg>
  );
}

function ForumIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="24" height="24" rx="6" fill="#F5F3FF" />
      <path
        d="M16 7H8C7.44772 7 7 7.44772 7 8V14C7 14.5523 7.44772 15 8 15H10L12 17L14 15H16C16.5523 15 17 14.5523 17 14V8C17 7.44772 16.5523 7 16 7Z"
        stroke="#8B5CF6"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SystemIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="24" height="24" rx="6" fill="#F3F4F6" />
      <path
        d="M12 8V12M12 16H12.01M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z"
        stroke="#6B7280"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ArrowRightIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M3.33334 8H12.6667M12.6667 8L8.00001 3.33333M12.6667 8L8.00001 12.6667"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M13.3333 4L6 11.3333L2.66667 8"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default UpdatesPanel;
