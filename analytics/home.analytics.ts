import { IAnalyticsMemberInfo } from '@/types/members.types';
import { IAnalyticsTeamInfo, IAnalyticsUserInfo } from '@/types/shared.types';
import { HOME_ANALYTICS_EVENTS } from '@/utils/constants';
import { usePostHog } from 'posthog-js/react';

export const useHomeAnalytics = () => {
  const postHogProps = usePostHog();

  const captureEvent = (eventName: string, eventParams = {}) => {
    try {
      if (postHogProps?.capture) {
        const allParams = { ...eventParams };
        postHogProps.capture(eventName, { ...allParams });
      }
    } catch (e) {
      console.error(e);
    }
  };

  function featuredSubmitRequestClicked(user: IAnalyticsUserInfo | null, requestLink: string) {
    const params = {
      user,
      requestLink,
    };

    captureEvent(HOME_ANALYTICS_EVENTS.FEATURED_SUBMIT_REQUEST_CLICKED, params);
  }

  function onMemberCardClicked(user: IAnalyticsUserInfo | null, member: IAnalyticsMemberInfo | null) {
    const params = {
      user,
      ...member,
    };
    captureEvent(HOME_ANALYTICS_EVENTS.FEATUTRED_MEMBER_CARD_CLICKED, params);
  }

  function onProjectCardClicked(user: IAnalyticsUserInfo | null, project: any) {
    const params = {
      user,
      ...project,
    };
    captureEvent(HOME_ANALYTICS_EVENTS.FEATURED_PROJECT_CARD_CLICKED, params);
  }

  function onTeamCardClicked(user: IAnalyticsUserInfo | null, team: IAnalyticsTeamInfo | null) {
    const params = {
      ...team,
      user,
    };
    captureEvent(HOME_ANALYTICS_EVENTS.FEATUTRED_TEAM_CARD_CLICKED, params);
  }

  function onIrlCardClicked(user: IAnalyticsUserInfo | null, event: any) {
    const params = {
      user,
      ...event,
    };
    captureEvent(HOME_ANALYTICS_EVENTS.FEATURED_IRL_CARD_CLICKED, params);
  }

  function onFeaturedCarouselActionsClicked(user: IAnalyticsUserInfo | null) {
    const params = {
      user,
    };
    captureEvent(HOME_ANALYTICS_EVENTS.FEATURED_CAROUSEL_ACTIONS_CLICKED, params);
  }

  return { featuredSubmitRequestClicked, onMemberCardClicked, onIrlCardClicked, onTeamCardClicked, onProjectCardClicked, onFeaturedCarouselActionsClicked };
};
