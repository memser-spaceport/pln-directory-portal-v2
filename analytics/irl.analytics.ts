import { IIrlLocation } from '@/types/irl.types';
import { IAnalyticsUserInfo } from '@/types/shared.types';
import { getUserInfo } from '@/utils/third-party.helper';
import { usePostHog } from 'posthog-js/react';

export const useIrlAnalytics = () => {
  const postHogProps = usePostHog();

  const IRL_ANALYTICS_EVENTS = {
    IRL_GUEST_LIST_IAM_GOING_BTN_CLICKED: 'irl-guest-list-iam-going-btn-clicked',
    IRL_GUEST_LIST_LOGIN_BTN_CLICKED: 'irl-guest-list-login-btn-clicked',
    IRL_EDIT_RESPONSE_BTN_CLICKED: 'irl-edit-response-btn-clicked',
    IRL_SELF_EDIT_DETAILS_CLICKED: 'irl-self-edit-details-clicked',
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
    IRL_GUEST_LIST_TABLE_HOST_EVENT_CLICKED: 'irl-guest-list-table-host-event-clicked',
    IRL_GUEST_LIST_TABLE_SPEAKER_EVENT_CLICKED: 'irl-guest-list-table-speaker-event-clicked',
    IRL_GUEST_LIST_ADD_NEW_MEMBER_BTN_CLICKED: 'irl-guest-list-add-new-member-btn-clicked',
    IRL_FLOATING_BAR_OPEN: 'irl-floating-bar-open',
    IRL_ADMIN_REMOVE_ATTENDEES_POPUP_OPEN: 'irl-admin-remove-attendees-popup-open',
    IRL_SELF_REMOVE_ATTENDEE_POPUP_BTN_CLICKED: 'irl-self-remove-attendee-popup-btn-clicked',
    IRL_SELF_REMOVE_ATTENDEE_POPUP_CONFIRM_REMOVAL_BTN_CLICKED: 'irl-self-remove-attendee-popup-confirm-removal-btn-clicked',
    IRL_SELF_REMOVAL_GATHERINGS_SUCCESS: 'irl-self-removal-gatherings-success',
    IRL_SELF_REMOVAL_GATHERINGS_FAILED: 'irl-self-removal-gatherings-failed',
    IRL_ADMIN_REMOVE_ATTENDEES_POPUP_CONFIRM_REMOVAL_BTN_CLICKED: 'irl-admin-remove-attendees-popup-confirm-removal-btn-clicked',
    IRL_ADMIN_REMOVE_ATTENDEES_SUCCESS: 'irl-admin-remove-attendees-success',
    IRL_ADMIN_REMOVE_ATTENDEES_FAILED: 'irl-admin-remove-attendees-failed',
    IRL_FLOATING_BAR_EDIT_BTN_CLICKED: 'irl-floating-bar-edit-btn-clicked',
    IRL_NO_ATTENDEES_STRIP_RESPOND_BTN_CLICKED:'irl-no-attendees-strip-respond-btn-clicked',

    //locations and events
    IRL_LOCATION_CARD_CLICKED:'irl-location-card-button-clicked',
    IRL_SEE_OTHER_LOCATION_CARD_CLICKED: 'on-see-other-location-card-clicked',
    IRL_UPCOMING_EVENTS_BUTTON_CLICKED: 'on-upcoming-events-button-clicked',
    IRL_ALL_EVENTS_BUTTON_CLICKED: 'on-all-events-button-clicked',

    IRL_PAST_EVENTS_BUTTON_CLICKED: 'on-past-events-button-clicked',
    IRL_UPCOMING_RESOURCE_POPUP_VIEWED: 'on-resource-popup-viewed',
    IRL_PAST_RESOURCE_POPUP_VIEWED: 'on-resource-popup-viewed',
    IRL_RESOURCE_CLICKED: 'on-resource-clicked',
    IRL_ADDITIONAL_RESOURCE_CLICKED: 'on-additional-resource-clicked',
    IRL_ADDITIONAL_RESOURCE_SEE_MORE_BUTTON_CLICKED: 'on-additional-resource-see-more-button-clicked',
    IRL_JOIN_PL_NETWORK_CLICKED: 'on-join-pl-network-clicked',
    IRL_PAST_EVENT_CLICKED: 'on-past-event-clicked',
    ON_SEE_OTHER_LOCATION_CARD_CLICKED: 'on-see-other-location-card-clicked',
    ON_UPCOMING_EVENTS_BUTTON_CLICKED: 'on-upcoming-events-button-clicked',
    ON_PAST_EVENTS_BUTTON_CLICKED: 'on-past-events-button-clicked',
    ON_RESOURCE_POPUP_VIEWED: 'on-resource-popup-viewed',
    ON_ADDITIONAL_RESOURCE_CLICKED: 'on-additional-resource-clicked',
    ON_ADDITIONAL_RESOURCE_SEE_MORE_BUTTON_CLICKED: 'on-additional-resource-see-more-button-clicked',
    ON_JOIN_PL_NETWORK_CLICKED: 'on-join-pl-network-clicked',
    TRACK_LOGIN_BUTTON_CLICKED: 'on-login-button-clicked',
    IRL_SEARCH_EVENT_CLICKED: 'irl-search-event-clicked',

    IRL_RSVP_POPUP_PRIVACY_SETTING_LINK_CLICKED: 'irl-rsvp-popup-privacy-setting-link-clicked',
    IRL_RSVP_POPUP_OH_GUIDELINE_URL_CLICKED: 'irl-rsvp-popup-oh-guideline-url-clicked',
    IRL_RSVP_POPUP_UPDATE_BTN_CLICKED: 'irl-rsvp-popup-update-btn-clicked',
    IRL_RSVP_POPUP_SAVE_BTN_CLICKED: 'irl-rsvp-popup-save-btn-clicked',
    IRL_RSVP_POPUP_SAVE_ERROR: 'irl-rsvp-popup-save-error',
    IRL_RSVP_POPUP_CLOSE_CLICKED: 'irl-rsvp-popup-close-clicked',

    IRL_ADD_EVENT_CLICKED:'irl-add-event-clicked',
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

  const trackSelfEditDetailsClicked = (location: any) => {
    const params = {
      locationUid: location?.uid,
      locationName: location?.name,
    };
    captureEvent(IRL_ANALYTICS_EVENTS.IRL_SELF_EDIT_DETAILS_CLICKED, { ...params });
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
  };

  const trackGuestListAddNewMemberBtnClicked = (location: any) => {
    const params = {
      locationUid: location?.uid,
      locationName: location?.name,
    };

    captureEvent(IRL_ANALYTICS_EVENTS.IRL_GUEST_LIST_ADD_NEW_MEMBER_BTN_CLICKED, { ...params });
  };

  const trackFloatingBarOpen = (location: any, others: any) => {
    const params = {
      locationUid: location?.uid,
      locationName: location?.name,
      ...others,
    };
    captureEvent(IRL_ANALYTICS_EVENTS.IRL_FLOATING_BAR_OPEN, { ...params });
  };

  const trackAdminRemoveAttendeesPopupOpen = (location: any) => {
    const params = {
      locationUid: location?.uid,
      locationName: location?.name,
    };

    captureEvent(IRL_ANALYTICS_EVENTS.IRL_ADMIN_REMOVE_ATTENDEES_POPUP_OPEN, { ...params });
  };

  const trackSelfRemoveAttendeePopupOpen = (location: any) => {
    const params = {
      locationUid: location?.uid,
      locationName: location?.name,
    };

    captureEvent(IRL_ANALYTICS_EVENTS.IRL_SELF_REMOVE_ATTENDEE_POPUP_BTN_CLICKED, { ...params });
  };

  const trackSelfRemoveAttendeePopupConfirmRemovalBtnClicked = (location: any) => {
    const params = {
      locationUid: location?.uid,
      locationName: location?.name,
    };

    captureEvent(IRL_ANALYTICS_EVENTS.IRL_SELF_REMOVE_ATTENDEE_POPUP_CONFIRM_REMOVAL_BTN_CLICKED, { ...params });
  };

  const trackSelfRemovalGatheringsSuccess = (location: any, others: any) => {
    const params = {
      locationUid: location?.uid,
      locationName: location?.name,
      ...others,
    };

    captureEvent(IRL_ANALYTICS_EVENTS.IRL_SELF_REMOVAL_GATHERINGS_SUCCESS, { ...params });
  };

  const trackSelfRemovalGatherigsFailed = (location: any, others: any) => {
    const params = {
      locationUid: location?.uid,
      locationName: location?.name,
      ...others,
    };

    captureEvent(IRL_ANALYTICS_EVENTS.IRL_SELF_REMOVAL_GATHERINGS_FAILED, { ...params });
  };

  const trackAdminRemoveAttendeesPopupConfirmRemovalBtnClicked = (location: any) => {
    const params = {
      locationUid: location?.uid,
      locationName: location?.name,
    };

    captureEvent(IRL_ANALYTICS_EVENTS.IRL_ADMIN_REMOVE_ATTENDEES_POPUP_CONFIRM_REMOVAL_BTN_CLICKED, { ...params });
  };

  const trackAdminRemoveAttendeesSuccess = (location: any, others: any) => {
    const params = {
      locationUid: location?.uid,
      locationName: location?.name,
      ...others,
    };

    captureEvent(IRL_ANALYTICS_EVENTS.IRL_ADMIN_REMOVE_ATTENDEES_SUCCESS, { ...params });
  };

  const trackAdminRemoveAttendeesFailed = (location: any, others: any) => {
    const params = {
      locationUid: location?.uid,
      locationName: location?.name,
      ...others,
    };
    captureEvent(IRL_ANALYTICS_EVENTS.IRL_ADMIN_REMOVE_ATTENDEES_FAILED, { ...params });
  };

  const trackNoAttendeesStripRespondBtnClicked = (location: any) => {
    const params = {
      locationUid: location?.uid,
      locationName: location?.name,
    };
    captureEvent(IRL_ANALYTICS_EVENTS.IRL_NO_ATTENDEES_STRIP_RESPOND_BTN_CLICKED, { ...params });
  };

  const trackFloatingBarEditBtnClicked = (location: any, others: any) => {
    const params = {
      locationUid: location?.uid,
      locationName: location?.name,
    };
    captureEvent(IRL_ANALYTICS_EVENTS.IRL_FLOATING_BAR_EDIT_BTN_CLICKED, { ...params });
  };

  const trackHostEventClicked = (location: any, event: any) => {
    const params = {
      locationUid: location?.uid,
      locationName: location?.name,
      ...event,
    };
    captureEvent(IRL_ANALYTICS_EVENTS.IRL_GUEST_LIST_TABLE_HOST_EVENT_CLICKED, { ...params });
  }

  const trackSpeakerEventClicked = (location: any, event: any) => {
    const params = {
      locationUid: location?.uid,
      locationName: location?.name,
      ...event,
    };
    captureEvent(IRL_ANALYTICS_EVENTS.IRL_GUEST_LIST_TABLE_SPEAKER_EVENT_CLICKED, { ...params });
  }

  function trackLocationClicked(id: any, locationName: any) {
    const params = {
      locationUid: id,
      locationName: locationName,
    };
    captureEvent(IRL_ANALYTICS_EVENTS.IRL_LOCATION_CARD_CLICKED, {...params});
  }

  function trackSeeOtherLocationClicked(location: any) {
    const params = {
      location: location,
    };
    captureEvent(IRL_ANALYTICS_EVENTS.IRL_SEE_OTHER_LOCATION_CARD_CLICKED, {...params});
  }

  function trackUpcomingEventsButtonClicked(events: any) {
    const params = {
      upcomingEvents: events,
    };
    captureEvent(IRL_ANALYTICS_EVENTS.IRL_UPCOMING_EVENTS_BUTTON_CLICKED, {...params});
  }

  function trackAllEventsButtonClicked(events: any) {
    const params = {
      allEvents: events,
    };
    captureEvent(IRL_ANALYTICS_EVENTS.IRL_ALL_EVENTS_BUTTON_CLICKED, {...params});
  }

  function trackPastEventsButtonClicked(events: any) {
    const params = {
      pastEvents: events,
    };
    captureEvent(IRL_ANALYTICS_EVENTS.IRL_PAST_EVENTS_BUTTON_CLICKED, {...params});
  }

  function trackPastResourcePopUpViewed(resources: any) {
    let params = { 
      pastResource: resources,
    };
    captureEvent(IRL_ANALYTICS_EVENTS.IRL_PAST_RESOURCE_POPUP_VIEWED, {...params});
  }

  function trackUpcomingResourcePopUpViewed(resources: any) {
    let params = { 
      upcomingResource: resources,
    };
    captureEvent(IRL_ANALYTICS_EVENTS.IRL_UPCOMING_RESOURCE_POPUP_VIEWED, {...params});
  }

  function trackAdditionalResourceClicked(resources: any) {
    let params = { 
      resource: resources,
    };
    captureEvent(IRL_ANALYTICS_EVENTS.IRL_RESOURCE_CLICKED, {...params});
  }

  function trackAdditionalResourcesClicked(resources: any) {
    let params = { 
      additionalResource: resources,
    };
    captureEvent(IRL_ANALYTICS_EVENTS.IRL_ADDITIONAL_RESOURCE_CLICKED, {...params});
  }

  function trackAdditionalResourceSeeMoreButtonClicked(resources: any) {
    let params = { 
      AdditionalResource: resources,
    };
    captureEvent(IRL_ANALYTICS_EVENTS.IRL_ADDITIONAL_RESOURCE_SEE_MORE_BUTTON_CLICKED, {...params});
  }

  function onJoinPLNetworkClicked(params: any) {
    captureEvent(IRL_ANALYTICS_EVENTS.IRL_JOIN_PL_NETWORK_CLICKED, {...params});
  }

  function onAddGatheringClicked(url:string) {
    captureEvent(IRL_ANALYTICS_EVENTS.IRL_ADD_EVENT_CLICKED,url);
  }

  function trackPastEventClicked(pastEvent: any) {
    const params = {
      pastEventUid: pastEvent.uid,
      pastEventName: pastEvent.name,
    }
    captureEvent(IRL_ANALYTICS_EVENTS.IRL_PAST_EVENT_CLICKED, {...params});
  }

  function irlGuestDetailPrivacySettingClick(user: IAnalyticsUserInfo | null, location: any) {
    const params = {
      user,
      ...location,
    };
    captureEvent(IRL_ANALYTICS_EVENTS.IRL_RSVP_POPUP_PRIVACY_SETTING_LINK_CLICKED, params);
  }

  function irlGuestDetailOHGuidelineClick(user: IAnalyticsUserInfo | null, location: any) {
    const params = {
      user,
      ...location,
    };
    captureEvent(IRL_ANALYTICS_EVENTS.IRL_RSVP_POPUP_OH_GUIDELINE_URL_CLICKED, params);
  }

  function irlGuestDetailEditBtnClick(user: IAnalyticsUserInfo | null, location: any, type: string, payload?: any) {
    const params = {
      user,
      ...location,
      ...payload,
      type,
    };
    captureEvent(IRL_ANALYTICS_EVENTS.IRL_RSVP_POPUP_UPDATE_BTN_CLICKED, params);
  }

  function irlGuestDetailSaveBtnClick(user: IAnalyticsUserInfo | null, location: any, type: string, payload?: any) {
    const params = {
      user,
      ...location,
      ...payload,
      type,
    };
    captureEvent(IRL_ANALYTICS_EVENTS.IRL_RSVP_POPUP_SAVE_BTN_CLICKED, params);
  }

  function irlGuestDetailSaveError(user: IAnalyticsUserInfo | null, location: any, type: string) {
    const params = {
      user,
      ...location,
      type,
    };
    captureEvent(IRL_ANALYTICS_EVENTS.IRL_RSVP_POPUP_SAVE_ERROR, params);
  }

  function irlAddAttendeePopupCloseClicked(user: IAnalyticsUserInfo | null, location: any) {
    const params = {
      user,
      ...location,
    };
    captureEvent(IRL_ANALYTICS_EVENTS.IRL_RSVP_POPUP_CLOSE_CLICKED, params);
  }

  function trackLoginClicked(params: any) {
    captureEvent(IRL_ANALYTICS_EVENTS.TRACK_LOGIN_BUTTON_CLICKED, {...params});
  }

  function searchEventClicked(params: any) {
    captureEvent(IRL_ANALYTICS_EVENTS.IRL_SEARCH_EVENT_CLICKED, {...params})
  }

  return {
    trackImGoingBtnClick,
    trackLoginToRespondBtnClick,
    trackEditResponseBtnClick,
    trackSelfEditDetailsClicked,
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
    trackFloatingBarOpen,
    trackLocationClicked,
    trackSeeOtherLocationClicked,
    trackUpcomingEventsButtonClicked,
    trackPastEventsButtonClicked,
    trackPastResourcePopUpViewed,
    trackUpcomingResourcePopUpViewed,
    trackAdditionalResourceClicked,
    trackAdditionalResourceSeeMoreButtonClicked,
    onJoinPLNetworkClicked,
    trackAdminRemoveAttendeesPopupOpen,
    trackSelfRemoveAttendeePopupOpen,
    trackSelfRemoveAttendeePopupConfirmRemovalBtnClicked,
    trackSelfRemovalGatheringsSuccess,
    trackSelfRemovalGatherigsFailed,
    trackAdminRemoveAttendeesPopupConfirmRemovalBtnClicked,
    trackAdminRemoveAttendeesSuccess,
    trackAdminRemoveAttendeesFailed,
    trackFloatingBarEditBtnClicked,
    trackNoAttendeesStripRespondBtnClicked,
    trackHostEventClicked,
    trackSpeakerEventClicked,
    trackPastEventClicked,
    trackAdditionalResourcesClicked,
    irlGuestDetailPrivacySettingClick,
    irlGuestDetailOHGuidelineClick,
    irlGuestDetailEditBtnClick,
    irlGuestDetailSaveBtnClick,
    irlGuestDetailSaveError,
    irlAddAttendeePopupCloseClicked,
    trackLoginClicked,
    onAddGatheringClicked,
    searchEventClicked,
    trackAllEventsButtonClicked
  };
};
