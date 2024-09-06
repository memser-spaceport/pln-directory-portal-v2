import { IAnalyticsUserInfo } from '@/types/shared.types';
import { COMMON_ANALYTICS_EVENTS, NOTIFICATION_ANALYTICS_EVENTS } from '@/utils/constants';
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
                postHogProps.capture(eventName, { ...allParams, loggedInUserEmail, loggedInUserName, loggedInUserUid});
            }
        } catch (e) {
            console.error(e);
        }
    };

    function onNotificationCardClicked(user: IAnalyticsUserInfo | null, notification: any) {
        const params = {
            user,
            notification
        };
        captureEvent(NOTIFICATION_ANALYTICS_EVENTS.NOTIFICATION_ITEM_CLICKED, params);
    }

    function onSeeAllNotificationsClicked(user: IAnalyticsUserInfo | null) {
        const params = {
            user
        };
        captureEvent(NOTIFICATION_ANALYTICS_EVENTS.NOTIFICATION_SELL_ALL_NOTIFICATIONS_CLICKED, params);
    }

    function onOfficeHoursFeedbackSubmitted(user: IAnalyticsUserInfo | null, notification: any, feedback: any) {
        const params = {
            user,
            notification,
            feedback
        }
        captureEvent(NOTIFICATION_ANALYTICS_EVENTS.OFFICE_HOURS_FEEDBACK_SUBMITTED, params);
    }

    function onOfficeHoursFeedbackSuccess(user: IAnalyticsUserInfo | null, notification: any, feedback: any) {
        const params = {
            user,
            notification,
            feedback
        }
        captureEvent(NOTIFICATION_ANALYTICS_EVENTS.OFFICE_HOURS_FEEDBACK_SUCCESS, params);
    }

    function onOfficeHoursFeedbackFailed(user: IAnalyticsUserInfo | null, notification: any, feedback: any) {
        const params = {
            user,
            notification,
            feedback
        }
        captureEvent(NOTIFICATION_ANALYTICS_EVENTS.OFFICE_HOURS_FEEDBACK_FAILED, params);
    }

    return {
        onNotificationCardClicked,
        onSeeAllNotificationsClicked,
        onOfficeHoursFeedbackSubmitted,
        onOfficeHoursFeedbackSuccess,
        onOfficeHoursFeedbackFailed,
    };
};
