import { IAnalyticsUserInfo } from '@/types/shared.types';
import { EVENTS_ANALYTICS, HOME_ANALYTICS_EVENTS } from '@/utils/constants';
import { getUserInfo } from '@/utils/third-party.helper';
import { usePostHog } from 'posthog-js/react';

export const useEventsAnalytics = () => {
  const postHogProps = usePostHog();

  const captureEvent = (eventName: string, eventParams = {}) => {
    try {
      if (postHogProps?.capture) {
        const allParams = { ...eventParams };
        const userInfo = getUserInfo();
        const loggedInUserUid = userInfo?.uid;
        const loggedInUserEmail = userInfo?.email;
        const loggedInUserName = userInfo?.name;
        postHogProps.capture(eventName, { ...allParams, loggedInUserUid, loggedInUserEmail, loggedInUserName });
      }
    } catch (e) {
      console.error(e);
    }
  };

  function onIrlLocationClicked(user: IAnalyticsUserInfo | null, location: any) {
    const params = {
      user,
      ...location,
    };
    captureEvent(EVENTS_ANALYTICS.EVENTS_PAGE_IRL_CARD_CLICKED, params);
  }

  function onEventCardClicked(user: IAnalyticsUserInfo | null, event: any) {
    const params = {
      user,
      ...event,
    };
    captureEvent(EVENTS_ANALYTICS.EVENTS_PAGE_EVENT_CARD_CLICKED, params);
  }

  return {
    onIrlLocationClicked,
    onEventCardClicked,
  };
};
