import { DEMO_DAY_ANALYTICS } from '@/utils/constants';
import { getUserInfo } from '@/utils/third-party.helper';
import { usePostHog } from 'posthog-js/react';

export const useDemoDayAnalytics = () => {
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

  function onInvestorPendingViewPageOpened() {
    captureEvent(DEMO_DAY_ANALYTICS.ON_INVESTOR_PENDING_VIEW_PAGE_OPENED);
  }

  function onInvestorPendingViewGoToInvestorProfileButtonClicked() {
    captureEvent(DEMO_DAY_ANALYTICS.ON_INVESTOR_PENDING_VIEW_GO_TO_INVESTOR_PROFILE_BUTTON_CLICKED);
  }

  function onInvestorProfilePageOpened() {
    captureEvent(DEMO_DAY_ANALYTICS.ON_INVESTOR_PROFILE_PAGE_OPENED);
  }

  function onInvestorProfileEditStarted() {
    captureEvent(DEMO_DAY_ANALYTICS.ON_INVESTOR_PROFILE_EDIT_STARTED);
  }

  function onInvestorProfileUpdated() {
    captureEvent(DEMO_DAY_ANALYTICS.ON_INVESTOR_PROFILE_UPDATED);
  }

  return {
    onInvestorPendingViewPageOpened,
    onInvestorPendingViewGoToInvestorProfileButtonClicked,
    onInvestorProfilePageOpened,
    onInvestorProfileEditStarted,
    onInvestorProfileUpdated,
  };
};
