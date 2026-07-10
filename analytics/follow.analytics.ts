import { FOLLOW_ANALYTICS_EVENTS } from '@/utils/constants';
import { useCurrentUserStore } from '@/services/auth/store';
import { usePostHog } from 'posthog-js/react';

export type FollowAnalyticsSource = 'news-feed' | 'team-profile' | 'teams-directory' | 'news-rail';

export const useFollowAnalytics = () => {
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

  const onTeamFollowed = (params: {
    teamUid: string;
    teamName: string;
    source: FollowAnalyticsSource;
    position?: number;
    reason?: string;
  }) => {
    captureEvent(FOLLOW_ANALYTICS_EVENTS.TEAM_FOLLOWED, params);
  };

  const onTeamUnfollowed = (params: { teamUid: string; teamName: string; source: FollowAnalyticsSource }) => {
    captureEvent(FOLLOW_ANALYTICS_EVENTS.TEAM_UNFOLLOWED, params);
  };

  const onTeamFollowFailed = (params: {
    teamUid: string;
    teamName: string;
    source: FollowAnalyticsSource;
    action: 'follow' | 'unfollow';
  }) => {
    captureEvent(FOLLOW_ANALYTICS_EVENTS.TEAM_FOLLOW_FAILED, params);
  };

  return { onTeamFollowed, onTeamUnfollowed, onTeamFollowFailed };
};
