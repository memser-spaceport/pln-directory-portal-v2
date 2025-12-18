'use client';

import React, { useEffect, useRef, useState } from 'react';
import { usePushNotificationsContext } from '@/providers/PushNotificationsProvider';
import { UpdatesPanel } from '@/components/core/UpdatesPanel';
import { motion, useAnimation } from 'framer-motion';
import s from './NotificationBell.module.scss';

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const { notifications, unreadCount, markAsRead } = usePushNotificationsContext();
  const controls = useAnimation();
  const prevUnreadCountRef = useRef(unreadCount);

  useEffect(() => {
    // Trigger animation when unread count increases
    if (unreadCount > prevUnreadCountRef.current && unreadCount > 0) {
      controls.start({
        rotate: [0, -15, 15, -15, 15, -10, 10, -5, 5, 0],
        transition: {
          duration: 0.6,
          ease: 'easeInOut',
        },
      });
    }
    prevUnreadCountRef.current = unreadCount;
  }, [unreadCount, controls]);

  const handleToggle = () => {
    setIsOpen((prev) => !prev);
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  return (
    <>
      <button
        className={s.bellButton}
        onClick={handleToggle}
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
      >
        <motion.div animate={controls} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <BellIcon />
        </motion.div>
        {unreadCount > 0 && (
          <motion.span
            className={s.badge}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 500, damping: 15 }}
            key={unreadCount}
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </motion.span>
        )}
      </button>

      <UpdatesPanel
        open={isOpen}
        notifications={notifications}
        onClose={handleClose}
        onMarkAsRead={markAsRead}
      />
    </>
  );
}

function BellIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M8.25 18.5625C8.42188 18.8906 8.67969 19.1484 8.99219 19.3359C9.30469 19.5234 9.65625 19.625 10.0312 19.625C10.4062 19.625 10.7578 19.5234 11.0703 19.3359C11.3828 19.1484 11.6406 18.8906 11.8125 18.5625M16.5 7.5625C16.5 6.21094 15.9609 4.92969 15.0078 3.97656C14.0547 3.02344 12.7734 2.48438 11.4219 2.48438C10.0703 2.48438 8.78906 3.02344 7.83594 3.97656C6.88281 4.92969 6.34375 6.21094 6.34375 7.5625C6.34375 14.4375 3.4375 16.5 3.4375 16.5H18.625C18.625 16.5 15.7188 14.4375 15.7188 7.5625"
        fill="currentColor"
      />
    </svg>
  );
}

export default NotificationBell;
