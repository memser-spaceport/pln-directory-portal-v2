import { useCallback } from 'react';
import { usePostHog } from 'posthog-js/react';

import { useCurrentUserStore } from '@/services/auth/store';
import { INTRO_REQUEST_ANALYTICS_EVENTS } from '@/utils/constants';

export type IntroRequestAnalyticsTargetType = 'member' | 'team';

export function useIntroRequestAnalytics() {
  const posthog = usePostHog();

  const onAskSubmitted = useCallback(
    (targetType: IntroRequestAnalyticsTargetType) => {
      try {
        if (!posthog?.capture) return;
        const userInfo = useCurrentUserStore.getState().currentUser;
        posthog.capture(INTRO_REQUEST_ANALYTICS_EVENTS.ASK_SUBMITTED, {
          type: 'intro',
          targetType,
          loggedInUserUid: userInfo?.uid,
          loggedInUserEmail: userInfo?.email,
          loggedInUserName: userInfo?.name,
        });
      } catch (error) {
        console.error(error);
      }
    },
    [posthog],
  );

  return { onAskSubmitted };
}
