import { IAnalyticsMemberInfo } from '@/types/members.types';
import { IAnalyticsTeamInfo, IAnalyticsUserInfo, IAnalyticsFocusArea } from '@/types/shared.types';
import { HOME_ANALYTICS_EVENTS } from '@/utils/constants';
import { useCurrentUserStore } from '@/services/auth/store';
import { usePostHog } from 'posthog-js/react';

/** Which door on the new Home: the hero's Join card, the roles note, or a sign-up ask on a story. */
export type HomeAuthDoor = 'sign_up' | 'sign_in';
/**
 * `join-end`: the second Join card, after the PL entities. `personalize`: "Personalize my news" on the signed-out
 * news page (both LAB-3174).
 */
export type HomeAuthDoorSection = 'hero' | 'news' | 'roles' | 'join-end' | 'personalize';
export type HomeSeeAllSection = 'news' | 'roles' | 'events' | 'map' | 'deals';
/** How the signed-in Home's tag scope changed: a tag clicked on, its × or clicked off, Clear all, or a Narrow by pick. */
export type HomeFeedTagScopeAction = 'add' | 'remove' | 'clear' | 'narrow';
export type HomeFocusAreaTarget = 'teams' | 'projects';

export const useHomeAnalytics = () => {
  const postHogProps = usePostHog();

  const captureEvent = (eventName: string, eventParams = {}) => {
    try {
      if (postHogProps?.capture) {
        const allParams = { ...eventParams };
        const userInfo = useCurrentUserStore.getState().currentUser;
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

  function onIrlLocationClicked(user: IAnalyticsUserInfo | null, location: any) {
    const params = {
      user,
      ...location,
    };
    captureEvent(HOME_ANALYTICS_EVENTS.FEATURED_LOCATION_CARD_CLICKED, params);
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

  function onFocusAreaTeamsClicked(
    user: IAnalyticsUserInfo | null | undefined,
    focusedArea: IAnalyticsFocusArea | null,
  ) {
    const params = {
      user,
      focusedArea,
    };
    captureEvent(HOME_ANALYTICS_EVENTS.FOCUS_AREA_TEAMS_CLICKED, params);
  }

  function onFocusAreaProjectsClicked(
    user: IAnalyticsUserInfo | null | undefined,
    focusedArea: IAnalyticsFocusArea | null,
  ) {
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

  function onFeaturedFilterClicked(filter: string) {
    const params = {
      filter,
    };
    captureEvent(HOME_ANALYTICS_EVENTS.FEATURED_FILTER_CLICKED, params);
  }

  function onWelcomeSignInClicked() {
    captureEvent(HOME_ANALYTICS_EVENTS.WELCOME_SIGNIN_CLICKED);
  }

  function onAuthDoorClicked(params: { door: HomeAuthDoor; section: HomeAuthDoorSection }) {
    captureEvent(HOME_ANALYTICS_EVENTS.AUTH_DOOR_CLICKED, params);
  }

  function onNewsPickClicked(params: { news_uid: string; position: number }) {
    captureEvent(HOME_ANALYTICS_EVENTS.NEWS_PICK_CLICKED, params);
  }

  function onRoleClicked(params: { team_uid: string; position: number; signed_in: boolean }) {
    captureEvent(HOME_ANALYTICS_EVENTS.ROLE_CLICKED, params);
  }

  function onEventClicked(params: { event_uid: string; position: number; signed_in: boolean }) {
    captureEvent(HOME_ANALYTICS_EVENTS.EVENT_CLICKED, params);
  }

  function onFocusAreaClicked(params: { area: string; target: HomeFocusAreaTarget }) {
    captureEvent(HOME_ANALYTICS_EVENTS.FOCUS_AREA_CLICKED, params);
  }

  function onSeeAllClicked(params: { section: HomeSeeAllSection }) {
    captureEvent(HOME_ANALYTICS_EVENTS.SEE_ALL_CLICKED, params);
  }

  /** A deal opened from the signed-in rail; `position` is 1-based. */
  function onDealClicked(params: { deal_uid: string; position: number }) {
    captureEvent(HOME_ANALYTICS_EVENTS.DEAL_CLICKED, params);
  }

  /** The signed-in feed's tag scope changed; `tags` is the scope after the change. */
  function onFeedTagScopeChanged(params: { tags: string[]; action: HomeFeedTagScopeAction }) {
    captureEvent(HOME_ANALYTICS_EVENTS.FEED_TAG_SCOPE_CHANGED, params);
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
    onIrlLocationClicked,
    onFeaturedFilterClicked,
    onWelcomeSignInClicked,
    onAuthDoorClicked,
    onNewsPickClicked,
    onRoleClicked,
    onEventClicked,
    onFocusAreaClicked,
    onSeeAllClicked,
    onDealClicked,
    onFeedTagScopeChanged,
  };
};
