import { IAnalyticsTeamInfo } from '@/types/shared.types';
import { getUserInfo } from '@/utils/third-party.helper';
import { usePostHog } from 'posthog-js/react';

export const useIrlAnalytics = () => {
  const postHogProps = usePostHog();

  const IRL_ANALYTICS_EVENTS = {
    IRL_GUEST_LIST_IAM_GOING_BTN_CLICKED: 'irl-guest-list-iam-going-btn-clicked',
    IRL_GUEST_LIST_LOGIN_BTN_CLICKED: 'irl-guest-list-login-btn-clicked',
    IRL_EDIT_RESPONSE_BTN_CLICKED: 'irl-edit-response-btn-clicked',
    IRL_GUEST_LIST_SEARCH: 'irl-guest-list-search',
    IRL_GUEST_LIST_TABLE_SORT_CLICKED: 'irl-guest-list-table-sort-clicked',
    IRL_GUEST_LIST_TABLE_LOGIN_BTN_CLICKED: 'irl-guest-list-table-login-btn-clicked',
    IRL_GUEST_LIST_TABLE_FILTER_BTN_CLICKED: 'irl-guest-list-table-filter-btn-clicked',
    IRL_GUEST_LIST_TABLE_FILTER_APPLY_BTN_CLICKED: 'irl-guest-list-table-filter-apply-btn-clicked',
    IRL_GUEST_LIST_TABLE_TEAM_CLICKED: 'irl-guest-list-table-team-clicked',
    IRL_GUEST_LIST_TABLE_MEMBER_CLICKED: 'irl-guest-list-table-member-clicked',
    IRL_GUEST_LIST_TABLE_TELEGRAM_LINK_CLICKED: 'irl-guest-list-table-telegram-link-clicked',
    IRL_GUEST_LIST_TABLE_OFFICE_HOURS_LINK_CLICKED: 'irl-guest-list-table-office-hours-link-clicked',
    IRL_GUEST_LIST_TABLE_ADD_OFFICE_HOURS_CLICKED: 'irl-guest-list-table-add-office-hours-clicked',
    IRL_GUEST_LIST_ADD_NEW_MEMBER_BTN_CLICKED: 'irl-guest-list-add-new-member-btn-clicked',
    IRL_FLOATING_BAR_OPEN: 'irl-floating-bar-open',

    // IRL_DETAILS_BANNER_VIEW_SCHEDULE_BTN_CLICKED: 'irl-banner-view-schedule-btn-clicked',
    IRL_DETAILS_REMOVE_ATTENDEES_POPUP_OPEN: 'irl-remove-attendees-popup-open',
    IRL_DETAILS_REMOVE_ATTENDEES_POPUP_REMOVE_BTN_CLICKED: 'irl-remove-attendees-popup-remove-btn-clicked',
    IRL_DETAILS_REMOVE_ATTENDEES_POPUP_REMOVE_SUCCESS: 'irl-remove-attendees-popup-remove-success',
    IRL_FLOATING_BAR_EDIT_BTN_CLICKED: 'irl-floating-bar-edit-btn-clicked',
  };

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

  const trackImGoingBtnClick = (location: any) => {
    const params = {
      locationUid: location?.uid,
      locationName: location?.name,
    };

    captureEvent(IRL_ANALYTICS_EVENTS.IRL_GUEST_LIST_IAM_GOING_BTN_CLICKED, { ...params });
  };

  const trackLoginToRespondBtnClick = (location: any) => {
    const params = {
      locationUid: location?.uid,
      locationName: location?.name,
    };
    captureEvent(IRL_ANALYTICS_EVENTS.IRL_GUEST_LIST_LOGIN_BTN_CLICKED, { ...params });
  };

  const trackEditResponseBtnClick = (location: any) => {
    const params = {
      locationUid: location?.uid,
      locationName: location?.name,
    };
    captureEvent(IRL_ANALYTICS_EVENTS.IRL_EDIT_RESPONSE_BTN_CLICKED, { ...params });
  };

  const trackGuestListSearch = (location: any, searchQuery: string) => {
    const params = {
      locationUid: location?.uid,
      locationName: location?.name,
      searchQuery,
    };

    captureEvent(IRL_ANALYTICS_EVENTS.IRL_GUEST_LIST_SEARCH, { ...params });
  };

  const trackGuestListTableSortClicked = (location: any, sortBy: string) => {
    const params = {
      locationUid: location?.uid,
      locationName: location?.name,
      sortBy,
    };

    captureEvent(IRL_ANALYTICS_EVENTS.IRL_GUEST_LIST_TABLE_SORT_CLICKED, { ...params });
  };

  const trackGuestListTableLoginClicked = (location: any) => {
    const params = {
      locationUid: location?.uid,
      locationName: location?.name,
    };

    captureEvent(IRL_ANALYTICS_EVENTS.IRL_GUEST_LIST_TABLE_LOGIN_BTN_CLICKED, { ...params });
  };

  const trackGuestListTableFilterClicked = (location: any, filterBy: string) => {
    const params = {
      locationUid: location?.uid,
      locationName: location?.name,
      filterBy,
    };

    captureEvent(IRL_ANALYTICS_EVENTS.IRL_GUEST_LIST_TABLE_FILTER_BTN_CLICKED, { ...params });
  };

  const trackGuestListTableFilterApplyClicked = (location: any, others: any) => {
    const params = {
      locationUid: location?.uid,
      locationName: location?.name,
      ...others,
    };

    captureEvent(IRL_ANALYTICS_EVENTS.IRL_GUEST_LIST_TABLE_FILTER_APPLY_BTN_CLICKED, { ...params });
  };

  const trackGuestListTableTeamClicked = (location: any, team: any) => {
    const params = {
      locationUid: location?.uid,
      locationName: location?.name,
      ...team,
    };

    captureEvent(IRL_ANALYTICS_EVENTS.IRL_GUEST_LIST_TABLE_TEAM_CLICKED, { ...params });
  };

  const trackGuestListTableMemberClicked = (location: any, member: any) => {
    const params = {
      locationUid: location?.uid,
      locationName: location?.name,
      ...member,
    };

    captureEvent(IRL_ANALYTICS_EVENTS.IRL_GUEST_LIST_TABLE_MEMBER_CLICKED, { ...params });
  };

  const trackGuestListTableTelegramLinkClicked = (location: any, member: any) => {
    const params = {
      locationUid: location?.uid,
      locationName: location?.name,
      ...member,
    };

    captureEvent(IRL_ANALYTICS_EVENTS.IRL_GUEST_LIST_TABLE_TELEGRAM_LINK_CLICKED, { ...params });
  };

  const trackGuestListTableOfficeHoursLinkClicked = (location: any, member: any) => {
    const params = {
      locationUid: location?.uid,
      locationName: location?.name,
      ...member,
    };

    captureEvent(IRL_ANALYTICS_EVENTS.IRL_GUEST_LIST_TABLE_OFFICE_HOURS_LINK_CLICKED, { ...params });
  };

  const trackGuestListTableAddOfficeHoursClicked = (location: any) => {
    const params = {
      locationUid: location?.uid,
      locationName: location?.name,
    };

    captureEvent(IRL_ANALYTICS_EVENTS.IRL_GUEST_LIST_TABLE_ADD_OFFICE_HOURS_CLICKED, { ...params });
  }

  const trackGuestListAddNewMemberBtnClicked = (location: any) => {
    const params = {
      locationUid: location?.uid,
      locationName: location?.name,
    };

    captureEvent(IRL_ANALYTICS_EVENTS.IRL_GUEST_LIST_ADD_NEW_MEMBER_BTN_CLICKED, { ...params });
  }

  const trackFloatingBarOpen = (location:any, others:any) => {
    const params = {
      locationUid: location?.uid,
      locationName: location?.name,
      ...others,
    };
    captureEvent(IRL_ANALYTICS_EVENTS.IRL_FLOATING_BAR_OPEN, { ...params });
  }


  return {
    trackImGoingBtnClick,
    trackLoginToRespondBtnClick,
    trackEditResponseBtnClick,
    trackGuestListSearch,
    trackGuestListTableSortClicked,
    trackGuestListTableLoginClicked,
    trackGuestListTableFilterClicked,
    trackGuestListTableFilterApplyClicked,
    trackGuestListTableTeamClicked,
    trackGuestListTableMemberClicked,
    trackGuestListTableTelegramLinkClicked,
    trackGuestListTableOfficeHoursLinkClicked,
    trackGuestListTableAddOfficeHoursClicked,
    trackGuestListAddNewMemberBtnClicked,
    trackFloatingBarOpen
  };
};
