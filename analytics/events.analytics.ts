import { IAnalyticsUserInfo } from '@/types/shared.types';
import { EVENTS_ANALYTICS, HOME_ANALYTICS_EVENTS } from '@/utils/constants';
import { getUserInfo } from '@/utils/third-party.helper';
import { usePostHog } from 'posthog-js/react';
import { IUpcomingEvents } from '@/types/irl.types';
import { UpcomingEvent } from '@/services/events/hooks/useUpcomingEvents';

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

  function onIrlLocationClicked(location: any) {
    const params = {
      ...location,
    };
    captureEvent(EVENTS_ANALYTICS.EVENTS_PAGE_IRL_CARD_CLICKED, params);
  }

  function onEventCardClicked(event: any) {
    const params = {
      ...event,
    };
    captureEvent(EVENTS_ANALYTICS.EVENTS_PAGE_EVENT_CARD_CLICKED, params);
  }

  function onContributorClicked() {
    captureEvent(EVENTS_ANALYTICS.EVENTS_PAGE_CONTRIBUTOR_CLICKED);
  }

  function onContributorListClicked(user: IAnalyticsUserInfo | null, contributor: any) {
    const params = {
      user,
      ...contributor,
    };
    captureEvent(EVENTS_ANALYTICS.EVENTS_PAGE_CONTRIBUTOR_LIST_CLICKED, params);
  }

  function onContributtonModalCloseClicked() {
    captureEvent(EVENTS_ANALYTICS.EVENTS_PAGE_CONTRIBUTOR_LIST_CLOSE_CLICKED);
  }

  function onContributtonModalOpenClicked() {
    captureEvent(EVENTS_ANALYTICS.EVENTS_PAGE_CONTRIBUTOR_LIST_OPEN_CLICKED);
  }

  function onViewAllGatheringsClicked() {
    captureEvent(EVENTS_ANALYTICS.EVENTS_PAGE_VIEW_ALL_GATHERINGS_CLICKED);
  }

  function onViewAllEventsClicked() {
    captureEvent(EVENTS_ANALYTICS.EVENTS_PAGE_VIEW_ALL_EVENTS_CLICKED);
  }

  function onCarouselLeftClicked() {
    captureEvent(EVENTS_ANALYTICS.EVENTS_PAGE_CAROUSEL_LEFT_CLICKED);
  }

  function onCarouselRightClicked() {
    captureEvent(EVENTS_ANALYTICS.EVENTS_PAGE_CAROUSEL_RIGHT_CLICKED);
  }

  function onSubmitEventButtonClicked() {
    captureEvent(EVENTS_ANALYTICS.EVENTS_PAGE_SCHEDULE_SECTION_SUBMIT_EVENT_BUTTON_CLICKED);
  }

  function onGoToEventsButtonClicked() {
    captureEvent(EVENTS_ANALYTICS.EVENTS_PAGE_SCHEDULE_SECTION_VIEW_EVENTS_BUTTON_CLICKED);
  }

  function onSubscribeForUpdatesButtonClicked(user: IAnalyticsUserInfo | null, contributor: any) {
    const params = {
      user,
      ...contributor,
    };
    captureEvent(EVENTS_ANALYTICS.EVENTS_PAGE_SUBSCRIBE_FOR_UPDATES_BUTTON_CLICKED, params);
  }
  function onAskHuskyButtonClicked() {
    captureEvent(EVENTS_ANALYTICS.EVENTS_PAGE_ASK_HUSKY_BUTTON_CLICKED);
  }

  function onContributeButtonClicked() {
    captureEvent(EVENTS_ANALYTICS.EVENTS_PAGE_CONTRIBUTE_BUTTON_CLICKED);
  }

  function onContributeModalIRLProceedButtonClicked() {
    captureEvent(EVENTS_ANALYTICS.EVENTS_PAGE_CONTRIBUTE_MODAL_IRL_PROCEED_BUTTON_CLICKED);
  }

  function onContributingTeamClicked(contributor: any) {
    captureEvent(EVENTS_ANALYTICS.EVENTS_PAGE_CONTRIBUTING_TEAM_CLICKED, contributor);
  }

  function onContributingMembersClicked(contributor: any) {
    captureEvent(EVENTS_ANALYTICS.EVENTS_PAGE_CONTRIBUTING_MEMBERS_CLICKED, contributor);
  }

  function onUpcomingEventsWidgetShowAllClicked() {
    captureEvent(EVENTS_ANALYTICS.UPCOMING_EVENTS_WIDGET_SHOW_ALL_CLICKED);
  }

  function onUpcomingEventsWidgetDismissClicked() {
    captureEvent(EVENTS_ANALYTICS.UPCOMING_EVENTS_WIDGET_DISMISS_CLICKED);
  }

  function onUpcomingEventsItemClicked(item: UpcomingEvent) {
    captureEvent(EVENTS_ANALYTICS.UPCOMING_EVENTS_WIDGET_ITEM_CLICKED, item);
  }

  return {
    onIrlLocationClicked,
    onEventCardClicked,
    onContributorClicked,
    onContributorListClicked,
    onContributtonModalCloseClicked,
    onContributtonModalOpenClicked,
    onViewAllGatheringsClicked,
    onViewAllEventsClicked,
    onCarouselLeftClicked,
    onCarouselRightClicked,
    onSubmitEventButtonClicked,
    onGoToEventsButtonClicked,
    onAskHuskyButtonClicked,
    onSubscribeForUpdatesButtonClicked,
    onContributeButtonClicked,
    onContributeModalIRLProceedButtonClicked,
    onContributingTeamClicked,
    onContributingMembersClicked,
    onUpcomingEventsWidgetShowAllClicked,
    onUpcomingEventsWidgetDismissClicked,
    onUpcomingEventsItemClicked,
  };
};
