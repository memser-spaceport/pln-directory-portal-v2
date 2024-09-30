import { IAnalyticsMemberInfo } from '@/types/members.types';
import { IAnalyticsTeamInfo, IAnalyticsUserInfo, IAnalyticsFocusArea } from '@/types/shared.types';
import { HOME_ANALYTICS_EVENTS, IRL_ANALYTICS_EVENTS } from '@/utils/constants';
import { getUserInfo } from '@/utils/third-party.helper';
import { usePostHog } from 'posthog-js/react';

export const useHomeAnalytics = () => {
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

  function onFocusAreaTeamsClicked(user: IAnalyticsUserInfo | null | undefined, focusedArea: IAnalyticsFocusArea | null) {
    const params = {
      user,
      focusedArea,
    };
    captureEvent(HOME_ANALYTICS_EVENTS.FOCUS_AREA_TEAMS_CLICKED, params);
  }

  function onFocusAreaProjectsClicked(user: IAnalyticsUserInfo | null | undefined, focusedArea: IAnalyticsFocusArea | null) {
    const params = {
      user,
      focusedArea,
    };
    captureEvent(HOME_ANALYTICS_EVENTS.FOCUS_AREA_PROJECT_CLICKED, params);
  }

  function onDiscoverCarouselActionsClicked(user: IAnalyticsUserInfo | null) {
    const params = {
      user,
    };
    captureEvent(HOME_ANALYTICS_EVENTS.DISCOVER_CAROUSEL_ACTIONS_CLICKED, params);
  }

  function onDiscoverCardClicked(data: any, user: IAnalyticsUserInfo | null) {
    const params = {
      discoverData: data,
      user,
    };
    captureEvent(HOME_ANALYTICS_EVENTS.DISCOVER_CARD_CLICKED, params);
  }

  function onDiscoverHuskyClicked(data: any, user: IAnalyticsUserInfo | null) {
    const params = {
      ...data,
      user,
    };
    captureEvent(HOME_ANALYTICS_EVENTS.DISCOVER_HUSKY_AI_CLICKED, params);
  }

  function onMemberBioSeeMoreClicked(member: any, user: IAnalyticsUserInfo | null) {
    const params = {
      user,
      ...member,
    };
    captureEvent(HOME_ANALYTICS_EVENTS.FEATURED_MEMBER_BIO_SEE_MORE_CLICKED, params);
  }

  function onMmeberBioPopupViewProfileBtnClicked(member: any, user: IAnalyticsUserInfo | null) {
    const params = {
      user,
      ...member,
    };
    captureEvent(HOME_ANALYTICS_EVENTS.FEATURED_MEMBER_BIO_POPUP_VIEW_PROFILE_BTN_CLICKED, params);
  }

  function onFocusAreaProtocolLabsVisionUrlClicked(url: string, user: IAnalyticsUserInfo | null) {
    const params = {
      url,
      user,
    };
    captureEvent(HOME_ANALYTICS_EVENTS.FOCUS_AREA_PROTOCOL_LABS_VISION_URL_CLICKED, params);
  }

  function onLocationClicked(params: any) {
    captureEvent(IRL_ANALYTICS_EVENTS.ON_LOCATION_CARD_CLICKED, {...params});
  }

  function onSeeOtherLocationClicked(params: any) {
    captureEvent(IRL_ANALYTICS_EVENTS.ON_SEE_OTHER_LOCATION_CARD_CLICKED, {...params});
  }

  function onUpcomingEventsButtonClicked(params: any) {
    captureEvent(IRL_ANALYTICS_EVENTS.ON_UPCOMING_EVENTS_BUTTON_CLICKED, {...params});
  }

  function onPastEventsButtonClicked(params: any) {
    captureEvent(IRL_ANALYTICS_EVENTS.ON_PAST_EVENTS_BUTTON_CLICKED, {...params});
  }

  function onPastResourcePopUpViewed(params: any) {
    captureEvent(IRL_ANALYTICS_EVENTS.ON_RESOURCE_POPUP_VIEWED, {...params});
  }

  function onUpcomingResourcePopUpViewed(params: any) {
    captureEvent(IRL_ANALYTICS_EVENTS.ON_RESOURCE_POPUP_VIEWED, {...params});
  }

  function onAdditionalResourceClicked(params: any) {
    captureEvent(IRL_ANALYTICS_EVENTS.ON_ADDITIONAL_RESOURCE_CLICKED, {...params});
  }

  function onAdditionalResourceSeeMoreButtonClicked(params: any) {
    captureEvent(IRL_ANALYTICS_EVENTS.ON_ADDITIONAL_RESOURCE_SEE_MORE_BUTTON_CLICKED, {...params});
  }

  return {
    featuredSubmitRequestClicked,
    onMemberCardClicked,
    onIrlCardClicked,
    onTeamCardClicked,
    onProjectCardClicked,
    onFocusAreaTeamsClicked,
    onFocusAreaProjectsClicked,
    onDiscoverCarouselActionsClicked,
    onDiscoverCardClicked,
    onDiscoverHuskyClicked,
    onMemberBioSeeMoreClicked,
    onMmeberBioPopupViewProfileBtnClicked,
    onFocusAreaProtocolLabsVisionUrlClicked,
    onLocationClicked,
    onSeeOtherLocationClicked,
    onUpcomingEventsButtonClicked,
    onPastEventsButtonClicked,
    onPastResourcePopUpViewed,
    onUpcomingResourcePopUpViewed,
    onAdditionalResourceClicked,
    onAdditionalResourceSeeMoreButtonClicked,
  };
};
