import { AFFINITY_ANALYTICS_EVENTS } from '@/utils/constants';
import { useCurrentUserStore } from '@/services/auth/store';
import { usePostHog } from 'posthog-js/react';

export const useAffinityAnalytics = () => {
  const postHogProps = usePostHog();

  const captureEvent = (eventName: string, eventParams: Record<string, unknown> = {}) => {
    try {
      if (postHogProps?.capture) {
        const userInfo = useCurrentUserStore.getState().currentUser;
        postHogProps.capture(eventName, {
          ...eventParams,
          loggedInUserUid: userInfo?.uid,
          loggedInUserEmail: userInfo?.email,
          loggedInUserName: userInfo?.name,
        });
      }
    } catch (e) {
      console.error(e);
    }
  };

  const onRelationshipRefreshClicked = (params: {
    memberUid: string;
    frequencyTier?: string | null;
    touchpoints6m?: number;
  }) => {
    captureEvent(AFFINITY_ANALYTICS_EVENTS.RELATIONSHIP_REFRESH_CLICKED, params);
  };

  const onRelationshipRefreshSucceeded = (params: { memberUid: string }) => {
    captureEvent(AFFINITY_ANALYTICS_EVENTS.RELATIONSHIP_REFRESH_SUCCEEDED, params);
  };

  const onRelationshipRefreshFailed = (params: { memberUid: string; errorType: string }) => {
    captureEvent(AFFINITY_ANALYTICS_EVENTS.RELATIONSHIP_REFRESH_FAILED, params);
  };

  return { onRelationshipRefreshClicked, onRelationshipRefreshSucceeded, onRelationshipRefreshFailed };
};
