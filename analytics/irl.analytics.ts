import { IAnalyticsUserInfo } from '@/types/shared.types';
import { IRL_ANALYTICS_EVENTS } from '@/utils/constants';
import { usePostHog } from 'posthog-js/react';

export const useIrlAnalytics = () => {
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

  function guestListTeamClicked(user: IAnalyticsUserInfo | null, event: any, team: any) {
    const params = {
      user,
      ...event,
      ...team,
    };

    captureEvent(IRL_ANALYTICS_EVENTS.IRL_DETAILS_GUEST_LIST_TABLE_TEAM_CLICKED, params);
  }

  function guestListMemberClicked(user: IAnalyticsUserInfo | null, event: any, member: any) {
    const params = {
      user,
      ...event,
      ...member,
    };

    captureEvent(IRL_ANALYTICS_EVENTS.IRL_DETAILS_GUEST_LIST_TABLE_MEMBER_CLICKED, params);
  }

  function guestListTelegramClicked(user: IAnalyticsUserInfo | null, event: any) {
    const params = {
      user,
      ...event,
    };

    captureEvent(IRL_ANALYTICS_EVENTS.IRL_DETAILS_GUEST_LIST_TABLE_TELEGRAM_LINK_CLICKED, params);
  }

  function guestListOfficeHoursClicked(user: IAnalyticsUserInfo | null, event: any) {
    const params = {
      user,
      ...event,
    };

    captureEvent(IRL_ANALYTICS_EVENTS.IRL_DETAILS_GUEST_LIST_TABLE_OFFICE_HOURS_LINK_CLICKED, params);
  }

  function guestListOfficeHoursAddClicked(user: IAnalyticsUserInfo | null, event: any) {
    const params = {
      user,
      ...event,
    };

    captureEvent(IRL_ANALYTICS_EVENTS.IRL_DETAILS_GUEST_LIST_TABLE_ADD_OFFICE_HOURS_CLICKED, params);
  }

  function guestListTableLoginClicked(event: any) {
    const params = {
      ...event,
    };

    captureEvent(IRL_ANALYTICS_EVENTS.IRL_DETAILS_GUEST_LIST_TABLE_LOGIN_BTN_CLICKED, params);
  }

  function guestListSortClicked(user: IAnalyticsUserInfo | null, event: any) {
    const params = {
      user,
      ...event,
    };
    captureEvent(IRL_ANALYTICS_EVENTS.IRL_DETAILS_GUEST_LIST_TABLE_SORT_CLICKED, params);
  }

  function guestListFilterApplyClicked(user: IAnalyticsUserInfo | null, event: any) {
    const params = {
      user,
      ...event,
    };
    captureEvent(IRL_ANALYTICS_EVENTS.IRL_DETAILS_GUEST_LIST_TABLE_FILTER_APPLY_BTN_CLICKED, params);
  }

  function guestListFilterBtnClicked(user: IAnalyticsUserInfo | null, event: any) {
    const params = {
      user,
      ...event,
    };
    captureEvent(IRL_ANALYTICS_EVENTS.IRL_DETAILS_GUEST_LIST_TABLE_FILTER_BTN_CLICKED, params);
  }

  function guestListImGoingClicked(user: IAnalyticsUserInfo | null, event: any) {
    const params = {
      user,
      ...event,
    };
    captureEvent(IRL_ANALYTICS_EVENTS.IRL_DETAILS_GUEST_LIST_IAM_GOING_BTN_CLICKED, params);
  }

  function guestListEditResponseClicked(user: IAnalyticsUserInfo | null, event: any) {
    const params = {
      user,
      ...event,
    };
    captureEvent(IRL_ANALYTICS_EVENTS.IRL_DETAILS_EDIT_RESPONSE_BTN_CLICKED, params);
  }

  function guestListLoginClicked(event: any) {
    const params = {
      ...event,
    };

    captureEvent(IRL_ANALYTICS_EVENTS.IRL_DETAILS_GUEST_LIST_LOGIN_BTN_CLICKED, params);
  }

  function guestListViewScheduleClicked(user: IAnalyticsUserInfo | null, event: any) {
    const params = {
      user,
      ...event,
    };
    captureEvent(IRL_ANALYTICS_EVENTS.IRL_DETAILS_BANNER_VIEW_SCHEDULE_BTN_CLICKED, params);
  }

  function guestListSearchApplied(user: IAnalyticsUserInfo | null, event: any) {
    const params = {
      user,
      ...event,
    };
    captureEvent(IRL_ANALYTICS_EVENTS.IRL_DETAILS_GUEST_LIST_SEARCH, params);
  }

  function joinEventImGoingClicked(user: IAnalyticsUserInfo | null, event: any) {
    const params = {
      user,
      ...event,
    };
    captureEvent(IRL_ANALYTICS_EVENTS.IRL_DETAILS_JOIN_EVENT_STRIP_IAM_GOING_BTN_CLICKED, params);
  }

  function joinEventLoginBtnClicked(event: any) {
    const params = {
      ...event,
    };
    captureEvent(IRL_ANALYTICS_EVENTS.IRL_DETAILS_JOIN_EVENT_STRIP_LOGIN_BTN_CLICKED, params);
  }

  function infoStripJoinBtnClicked(event: any) {
    const params = {
      ...event,
    };
    captureEvent(IRL_ANALYTICS_EVENTS.IRL_DETAILS_INFO_STRIP_JOIN_BTN_CLICKED, params);
  }

  function resourceClicked(user: IAnalyticsUserInfo | null, event: any) {
    const params = {
      user,
      ...event,
    };
    captureEvent(IRL_ANALYTICS_EVENTS.IRL_DETAILS_RESOURCE_CLICKED, params);
  }

  function resourcePopupResourceClicked(user: IAnalyticsUserInfo | null, event: any) {
    const params = {
      user,
      ...event,
    };
    captureEvent(IRL_ANALYTICS_EVENTS.IRL_DETAILS_RESOURCE_POPUP_RESOURCE_LINK_CLICKED, params);
  }

  function resourcesSeeMoreClicked(user: IAnalyticsUserInfo | null, event: any) {
    const params = {
      user,
      ...event,
    };
    captureEvent(IRL_ANALYTICS_EVENTS.IRL_DETAILS_RESOURCES_SEE_MORE_CLICKED, params);
  }

  function resourcesLoginClicked(event: any) {
    const params = {
      ...event,
    };
    captureEvent(IRL_ANALYTICS_EVENTS.IRL_DETAILS_RESOURCES_LOGIN_BTN_CLICKED, params);
  }

  function resourcesPopupLoginClicked(event: any) {
    const params = {
      ...event,
    };
    captureEvent(IRL_ANALYTICS_EVENTS.IRL_DETAILS_RESOURCE_POPUP_LOGIN_CLICKED, params);
  }

  function irlNavbarBackBtnClicked(user: IAnalyticsUserInfo | null, event: any) {
    const params = {
      user,
      ...event,
    };
    captureEvent(IRL_ANALYTICS_EVENTS.IRL_DETAILS_NAVBAR_BACK_BTN_CLICKED, params);
  }

  function irlCardClicked(user: IAnalyticsUserInfo | null, event: any) {
    const params = {
      user,
      ...event,
    };
    captureEvent(IRL_ANALYTICS_EVENTS.IRL_GATHERING_CARD_CLICKED, params);
  }

  function irlRestrictionPopupLoginBtnClicked() {
    captureEvent(IRL_ANALYTICS_EVENTS.IRL_INVITE_ONLY_RESTRICTION_POPUP_LOGIN_CLICKED);
  }

  return {
    guestListTeamClicked,
    guestListMemberClicked,
    guestListTelegramClicked,
    guestListOfficeHoursClicked,
    guestListOfficeHoursAddClicked,
    guestListTableLoginClicked,
    guestListSortClicked,
    guestListFilterApplyClicked,
    guestListFilterBtnClicked,
    guestListImGoingClicked,
    guestListEditResponseClicked,
    guestListLoginClicked,
    guestListViewScheduleClicked,
    guestListSearchApplied,
    joinEventImGoingClicked,
    joinEventLoginBtnClicked,
    infoStripJoinBtnClicked,
    resourceClicked,
    resourcePopupResourceClicked,
    resourcesSeeMoreClicked,
    resourcesLoginClicked,
    resourcesPopupLoginClicked,
    irlNavbarBackBtnClicked,
    irlCardClicked,
    irlRestrictionPopupLoginBtnClicked
  };
};
