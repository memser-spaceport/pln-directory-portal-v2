import { Menu } from '@base-ui-components/react/menu';
import React from 'react';
import s from './NotificationsMenu.module.scss';
import NotificationCard from '@/components/core/navbar/notification-card';
import { getAnalyticsNotificationInfo, getAnalyticsUserInfo, triggerLoader } from '@/utils/common.utils';
import { EVENTS, PAGE_ROUTES } from '@/utils/constants';
import { useNotificationAnalytics } from '@/analytics/notification.analytics';
import { IUserInfo } from '@/types/shared.types';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { clsx } from 'clsx';

interface Props {
  open: boolean;
  notifications: unknown[];
  onClose: () => void;
  userInfo: IUserInfo;
  isMobileView: boolean;
}

export const NotificationsMenu = ({ notifications, open, onClose, userInfo, isMobileView }: Props) => {
  const analytics = useNotificationAnalytics();
  const pathname = usePathname();

  const onNotificationClickHandler = (notification: any) => {
    analytics.onNotificationCardClicked(getAnalyticsUserInfo(userInfo), getAnalyticsNotificationInfo(notification));

    document.dispatchEvent(
      new CustomEvent(EVENTS.TRIGGER_RATING_POPUP, {
        detail: {
          notification,
        },
      }),
    );
  };

  const onSeeAllClickHanlder = () => {
    if (pathname !== PAGE_ROUTES.NOTIFICATIONS) {
      triggerLoader(true);
      analytics.onSeeAllNotificationsClicked(getAnalyticsUserInfo(userInfo));
    }
  };

  return (
    <Menu.Root modal={isMobileView} open={open} onOpenChange={onClose}>
      <Menu.Portal>
        <Menu.Positioner className={s.Positioner} align="end" sideOffset={10}>
          <Menu.Popup
            className={clsx(s.Popup, {
              [s.mobile]: isMobileView,
            })}
          >
            <div className={s.NotificationsLabel}>
              All notifications <div className={s.notificationsCount}>{notifications?.length}</div>
            </div>
            {notifications?.map((notification: any, index: number) => (
              <Menu.Item key={notification.uid} className={s.Item} onClick={() => onNotificationClickHandler(notification)}>
                <NotificationCard notification={notification} />
              </Menu.Item>
            ))}

            <Link onClick={onSeeAllClickHanlder} href={PAGE_ROUTES.NOTIFICATIONS}>
              <Menu.Item className={clsx(s.Item, s.link)} onClick={onClose}>
                See all notifications
              </Menu.Item>
            </Link>
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
};
