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

  function onIrlLocationClicked(user: IAnalyticsUserInfo | null, location: any) {
    const params = {
      user,
      ...location,
    };
    captureEvent(EVENTS_ANALYTICS.EVENTS_PAGE_IRL_CARD_CLICKED, params);
  }

  function onEventCardClicked(user: IAnalyticsUserInfo | null, event: any) {
    const params = {
      user,
      ...event,
    };
    captureEvent(EVENTS_ANALYTICS.EVENTS_PAGE_EVENT_CARD_CLICKED, params);
  }

  function onContributorClicked(user: IAnalyticsUserInfo | null, contributor: any) {
    const params = {
      user,
      ...contributor,
    };
    captureEvent(EVENTS_ANALYTICS.EVENTS_PAGE_CONTRIBUTOR_CLICKED, params);
  }

  function onContributorListClicked(user: IAnalyticsUserInfo | null, contributor: any) {
    const params = {
      user,
      ...contributor,
    };
    captureEvent(EVENTS_ANALYTICS.EVENTS_PAGE_CONTRIBUTOR_LIST_CLICKED, params);
  }

  function onContributorListCloseClicked(user: IAnalyticsUserInfo | null, contributor: any) {
    const params = {
      user,
      ...contributor,
    };
    captureEvent(EVENTS_ANALYTICS.EVENTS_PAGE_CONTRIBUTOR_LIST_CLOSE_CLICKED, params);
  }

  function onContributorListOpenClicked(user: IAnalyticsUserInfo | null, contributor: any) {
    const params = {
      user,
      ...contributor,
    };
    captureEvent(EVENTS_ANALYTICS.EVENTS_PAGE_CONTRIBUTOR_LIST_OPEN_CLICKED, params);
  }

  function onViewAllGatheringsClicked(user: IAnalyticsUserInfo | null) {
    const params = {
      user,
    };
    captureEvent(EVENTS_ANALYTICS.EVENTS_PAGE_VIEW_ALL_GATHERINGS_CLICKED, params);
  }

  function onViewAllEventsClicked(user: IAnalyticsUserInfo | null) {
    const params = {
      user,
    };
    captureEvent(EVENTS_ANALYTICS.EVENTS_PAGE_VIEW_ALL_EVENTS_CLICKED, params);
  }

  function onCarouselLeftClicked(user: IAnalyticsUserInfo | null, contributor: any) {
    const params = {
      user,
      ...contributor,
    };
    captureEvent(EVENTS_ANALYTICS.EVENTS_PAGE_CAROUSEL_LEFT_CLICKED, params);
  }

  function onCarouselRightClicked(user: IAnalyticsUserInfo | null, contributor: any) {
    const params = {
      user,
      ...contributor,
    };
    captureEvent(EVENTS_ANALYTICS.EVENTS_PAGE_CAROUSEL_RIGHT_CLICKED, params);
  }

  function onSubmitEventButtonClicked(user: IAnalyticsUserInfo | null, contributor: any) {
    const params = {
      user,
      ...contributor,
    };
    captureEvent(EVENTS_ANALYTICS.EVENTS_PAGE_SUBMIT_EVENT_BUTTON_CLICKED, params);
  }

  function onGoToEventsButtonClicked(user: IAnalyticsUserInfo | null, contributor: any) {
    const params = {
      user,
      ...contributor,
    };
    captureEvent(EVENTS_ANALYTICS.EVENTS_PAGE_GO_TO_EVENTS_BUTTON_CLICKED, params);
  }

  function onSubscribeForUpdatesButtonClicked(user: IAnalyticsUserInfo | null, contributor: any) {
    const params = {
      user,
      ...contributor,
    };
    captureEvent(EVENTS_ANALYTICS.EVENTS_PAGE_SUBSCRIBE_FOR_UPDATES_BUTTON_CLICKED, params);
  }
  function onAskHuskyButtonClicked(user: IAnalyticsUserInfo | null, contributor: any) {
    const params = {
      user,
      ...contributor,
    };
    captureEvent(EVENTS_ANALYTICS.EVENTS_PAGE_ASK_HUSKY_BUTTON_CLICKED, params);
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
