import { IAnalyticsUserInfo } from '@/types/shared.types';
import { PushNotification } from '@/types/push-notifications.types';
import { NOTIFICATION_ANALYTICS_EVENTS } from '@/utils/constants';
import { getUserInfo } from '@/utils/third-party.helper';
import { usePostHog } from 'posthog-js/react';

export const useNotificationAnalytics = () => {
  const postHogProps = usePostHog();

  const captureEvent = (eventName: string, eventParams = {}) => {
    try {
      if (postHogProps?.capture) {
        const allParams = { ...eventParams };
        const userInfo = getUserInfo();
        const loggedInUserUid = userInfo?.uid;
        const loggedInUserEmail = userInfo?.email;
        const loggedInUserName = userInfo?.name;
        postHogProps.capture(eventName, { ...allParams, loggedInUserEmail, loggedInUserName, loggedInUserUid });
      }
    } catch (e) {
      console.error(e);
    }
  };

  function onNotificationCardClicked(user: IAnalyticsUserInfo | null, notification: any) {
    const params = {
      user,
      notification,
    };
    captureEvent(NOTIFICATION_ANALYTICS_EVENTS.NOTIFICATION_ITEM_CLICKED, params);
  }

  function onSeeAllNotificationsClicked(user: IAnalyticsUserInfo | null) {
    const params = {
      user,
    };
    captureEvent(NOTIFICATION_ANALYTICS_EVENTS.NOTIFICATION_SELL_ALL_NOTIFICATIONS_CLICKED, params);
  }

  function onOfficeHoursFeedbackSubmitted(user: IAnalyticsUserInfo | null, notification: any, feedback: any) {
    const params = {
      user,
      notification,
      feedback,
    };
    captureEvent(NOTIFICATION_ANALYTICS_EVENTS.OFFICE_HOURS_FEEDBACK_SUBMITTED, params);
  }

  function onOfficeHoursFeedbackSuccess(user: IAnalyticsUserInfo | null, notification: any, feedback: any) {
    const params = {
      user,
      notification,
      feedback,
    };
    captureEvent(NOTIFICATION_ANALYTICS_EVENTS.OFFICE_HOURS_FEEDBACK_SUCCESS, params);
  }

  function onOfficeHoursFeedbackFailed(user: IAnalyticsUserInfo | null, notification: any, feedback: any) {
    const params = {
      user,
      notification,
      feedback,
    };
    captureEvent(NOTIFICATION_ANALYTICS_EVENTS.OFFICE_HOURS_FEEDBACK_FAILED, params);
  }

  function onNotificationBellClicked(unreadCount: number) {
    captureEvent(NOTIFICATION_ANALYTICS_EVENTS.NOTIFICATION_BELL_CLICKED, { unreadCount });
  }

  function onUpdatesPanelNotificationClicked(notification: PushNotification) {
    captureEvent(NOTIFICATION_ANALYTICS_EVENTS.UPDATES_PANEL_NOTIFICATION_CLICKED, {
      notificationId: notification.id,
      category: notification.category,
      title: notification.title,
      isRead: notification.isRead,
    });
  }

  function onNotificationActionLinkClicked(notification: PushNotification, source: 'updates_panel' | 'recent_updates') {
    captureEvent(NOTIFICATION_ANALYTICS_EVENTS.NOTIFICATION_ACTION_LINK_CLICKED, {
      notificationId: notification.id,
      category: notification.category,
      link: notification.link,
      source,
    });
  }

  function onViewAllUpdatesClicked() {
    captureEvent(NOTIFICATION_ANALYTICS_EVENTS.VIEW_ALL_UPDATES_CLICKED);
  }

  function onRecentUpdatesNotificationClicked(notification: PushNotification) {
    captureEvent(NOTIFICATION_ANALYTICS_EVENTS.RECENT_UPDATES_NOTIFICATION_CLICKED, {
      notificationId: notification.id,
      category: notification.category,
      title: notification.title,
      isRead: notification.isRead,
    });
  }

  return {
    onNotificationCardClicked,
    onSeeAllNotificationsClicked,
    onOfficeHoursFeedbackSubmitted,
    onOfficeHoursFeedbackSuccess,
    onOfficeHoursFeedbackFailed,
    onNotificationBellClicked,
    onUpdatesPanelNotificationClicked,
    onNotificationActionLinkClicked,
    onViewAllUpdatesClicked,
    onRecentUpdatesNotificationClicked,
  };
};
