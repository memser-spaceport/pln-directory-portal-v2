import React from 'react';
import { PushNotification } from '@/types/push-notifications.types';
import { DemoDayIcon, EventIcon, ForumIcon, SystemIcon } from '@/components/core/UpdatesPanel/icons';

export function getNotificationIcon(notification: PushNotification) {
  switch (notification.category) {
    case 'DEMO_DAY_LIKE':
    case 'DEMO_DAY_CONNECT':
    case 'DEMO_DAY_ANNOUNCEMENT':
    case 'DEMO_DAY_INVEST':
    case 'DEMO_DAY_REFERRAL':
    case 'DEMO_DAY_FEEDBACK':
      return <DemoDayIcon />;
    case 'EVENT':
    case 'IRL_GATHERING':
      return <EventIcon />;
    case 'FORUM_POST':
    case 'FORUM_REPLY':
      return <ForumIcon />;
    case 'SYSTEM':
    default:
      return <SystemIcon />;
  }
}
