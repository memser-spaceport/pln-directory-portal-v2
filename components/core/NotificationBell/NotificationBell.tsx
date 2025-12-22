'use client';

import React, { useEffect, useRef, useState } from 'react';
import { usePushNotificationsContext } from '@/providers/PushNotificationsProvider';
import { UpdatesPanel } from '@/components/core/UpdatesPanel';
import { motion, useAnimation } from 'framer-motion';
import s from './NotificationBell.module.scss';

export function NotificationBell({ isLoggedIn }: { isLoggedIn: boolean }) {
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
        isLoggedIn={isLoggedIn}
      />
    </>
  );
}

function BellIcon() {
  return (
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M28.3612 23.2596C27.6152 21.9766 27.2191 20.1349 27.2191 17.9375C27.2191 16.023 26.4585 14.1869 25.1048 12.8331C23.751 11.4793 21.9149 10.7188 20.0003 10.7188C18.0858 10.7188 16.2497 11.4793 14.8959 12.8331C13.5421 14.1869 12.7816 16.023 12.7816 17.9375C12.7816 20.1358 12.3871 21.9766 11.6412 23.2596C11.489 23.5213 11.4083 23.8184 11.4072 24.1212C11.4062 24.4239 11.4848 24.7216 11.6352 24.9844C11.7846 25.2473 12.0015 25.4655 12.2635 25.6166C12.5254 25.7677 12.8229 25.8461 13.1253 25.8438H16.2345C16.3198 26.7836 16.7534 27.6576 17.4502 28.294C18.147 28.9304 19.0566 29.2833 20.0003 29.2833C20.944 29.2833 21.8536 28.9304 22.5504 28.294C23.2472 27.6576 23.6808 26.7836 23.7661 25.8438H26.8753C27.1773 25.8456 27.4743 25.767 27.7357 25.6159C27.9972 25.4649 28.2137 25.2469 28.3629 24.9844C28.5139 24.722 28.5933 24.4245 28.593 24.1218C28.5927 23.819 28.5127 23.5217 28.3612 23.2596ZM20.0003 27.2188C19.6041 27.2188 19.22 27.082 18.9131 26.8314C18.6061 26.5809 18.3952 26.232 18.316 25.8438H21.6847C21.6055 26.232 21.3945 26.5809 21.0876 26.8314C20.7806 27.082 20.3966 27.2188 20.0003 27.2188ZM13.6977 23.7812C14.4582 22.2344 14.8441 20.2698 14.8441 17.9375C14.8441 16.57 15.3873 15.2585 16.3543 14.2915C17.3213 13.3245 18.6328 12.7812 20.0003 12.7812C21.3679 12.7812 22.6794 13.3245 23.6463 14.2915C24.6133 15.2585 25.1566 16.57 25.1566 17.9375C25.1566 20.269 25.5416 22.2344 26.3021 23.7812H13.6977Z"
        fill="#455468"
      />
    </svg>
  );
}

export default NotificationBell;
