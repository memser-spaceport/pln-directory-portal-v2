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

  function onContributorListCloseClicked() {
    captureEvent(EVENTS_ANALYTICS.EVENTS_PAGE_CONTRIBUTOR_LIST_CLOSE_CLICKED);
  }

  function onContributorListOpenClicked() {
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

  return {
    onIrlLocationClicked,
    onEventCardClicked,
    onContributorClicked,
    onContributorListClicked,
    onContributorListCloseClicked,
    onContributorListOpenClicked,
    onViewAllGatheringsClicked,
    onViewAllEventsClicked,
    onCarouselLeftClicked,
    onCarouselRightClicked,
    onSubmitEventButtonClicked,
    onGoToEventsButtonClicked,
    onAskHuskyButtonClicked,
    onSubscribeForUpdatesButtonClicked,
  };
};
