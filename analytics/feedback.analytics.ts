import { usePostHog } from 'posthog-js/react';
import { useMemo } from 'react';

import { useCurrentUserStore } from '@/services/auth/store';
import { FEEDBACK_ANALYTICS } from '@/utils/constants';

/** Which door opened the LabOS-wide feedback drawer. */
export type FeedbackButtonSource = 'floating-button' | 'shortcut' | 'help-menu' | 'support-form';

/** Memoised on PostHog, so the LabOS-wide button's props stay stable across renders. */
export const useFeedbackAnalytics = () => {
  const postHog = usePostHog();

  return useMemo(() => {
    const captureEvent = (eventName: string, eventParams: Record<string, unknown> = {}) => {
      try {
        if (!postHog?.capture) return;
        const userInfo = useCurrentUserStore.getState().currentUser;
        const loggedInUserUid = userInfo?.uid;
        postHog.capture(eventName, {
          ...eventParams,
          is_authenticated: Boolean(loggedInUserUid),
          loggedInUserUid,
          loggedInUserEmail: userInfo?.email,
          loggedInUserName: userInfo?.name,
        });
      } catch (err) {
        console.error(err);
      }
    };

    return {
      /** `page` is the route path the member was on. */
      onFeedbackButtonClick: (args: { source: FeedbackButtonSource; page: string }) =>
        captureEvent(FEEDBACK_ANALYTICS.ON_FEEDBACK_BUTTON_CLICK, { ...args }),
      onFeedbackSubmit: (args: { page: string }) => captureEvent(FEEDBACK_ANALYTICS.ON_FEEDBACK_SUBMIT, { ...args }),
    };
  }, [postHog]);
};
