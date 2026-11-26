import { IAnalyticsUserInfo } from '@/types/shared.types';
import {
  ALL_EVENTS_ANALYTICS,
  EVENT_DRAWER_ANALYTICS,
  EVENTS_ANALYTICS,
  EVENTS_SUBMIT_ANALYTICS,
  HOME_ANALYTICS_EVENTS,
} from '@/utils/constants';
import { useCurrentUserStore } from '@/services/auth/store';
import { usePostHog } from 'posthog-js/react';
import { IUpcomingEvents } from '@/types/irl.types';
import { UpcomingEvent } from '@/services/events/hooks/useUpcomingEvents';
import type { FilterParam } from '@/services/events/all-events.filters';

/** Where the event drawer was opened from. */
export type EventDrawerSource =
  | 'home'
  | 'member-profile'
  | 'team-profile'
  | 'add-event'
  | 'digest'
  | 'all-events'
  | 'embed';

/** Where the embed opens an event's details (LAB-3392): its own drawer, or LabOS in a new tab. */
export type EmbedDetails = 'embed' | 'labos';

export const useEventsAnalytics = () => {
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

  /**
   * The submit form, the edit page and My Submissions. These events carry the viewer's uid and whether they are
   * signed in, and never an email, a name or the event's text.
   */
  const captureSubmitEvent = (eventName: string, eventParams: Record<string, string | number | boolean | null>) => {
    try {
      if (!postHogProps?.capture) return;
      const loggedInUserUid = useCurrentUserStore.getState().currentUser?.uid ?? null;
      postHogProps.capture(eventName, { ...eventParams, loggedInUserUid, is_authenticated: !!loggedInUserUid });
    } catch (e) {
      console.error(e);
    }
  };

  function onEventsSubmitFormOpened() {
    captureSubmitEvent(EVENTS_SUBMIT_ANALYTICS.ON_EVENTS_SUBMIT_FORM_OPENED, {});
  }

  /** `result`: what the backend made of it. `submitted` waits for approval. */
  function onEventsSubmitFormSubmitted(params: { result: 'approved' | 'submitted' | 'draft' }) {
    captureSubmitEvent(EVENTS_SUBMIT_ANALYTICS.ON_EVENTS_SUBMIT_FORM_SUBMITTED, {
      result: params.result,
    });
  }

  /** `status`: the HTTP status, null when the request never got an answer. */
  function onEventsSubmitFormFailed(params: { status: number | null }) {
    captureSubmitEvent(EVENTS_SUBMIT_ANALYTICS.ON_EVENTS_SUBMIT_FORM_FAILED, { status: params.status });
  }

  function onEventsMySubmissionsOpened() {
    captureSubmitEvent(EVENTS_SUBMIT_ANALYTICS.ON_EVENTS_MY_SUBMISSIONS_OPENED, {});
  }

  /** `action`: a draft saved, a draft submitted, or changes saved to a submitted or approved event. */
  function onEventsEventEdited(params: { eventUid: string; action: 'draft-saved' | 'submitted' | 'updated' }) {
    captureSubmitEvent(EVENTS_SUBMIT_ANALYTICS.ON_EVENTS_EVENT_EDITED, {
      event_uid: params.eventUid,
      action: params.action,
    });
  }

  function onEventsEventDeleted(params: { eventUid: string; from: 'edit-page' | 'my-submissions' }) {
    captureSubmitEvent(EVENTS_SUBMIT_ANALYTICS.ON_EVENTS_EVENT_DELETED, {
      event_uid: params.eventUid,
      from: params.from,
    });
  }

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

  function onContributorListSearchChanged(params: { searchQuery: string; resultsCount: number; totalCount: number }) {
    captureEvent(EVENTS_ANALYTICS.EVENTS_PAGE_CONTRIBUTOR_LIST_SEARCH_CHANGED, params);
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

  function onContributorsSearchInputChanged(params: {
    searchQuery: string;
    previousQuery?: string;
    membersCount: number;
    teamsCount: number;
  }) {
    captureEvent(EVENTS_ANALYTICS.EVENTS_PAGE_CONTRIBUTORS_SEARCH_INPUT_CHANGED, params);
  }

  function onContributorsFilterSelected(params: {
    filterValue: 'all' | 'host' | 'speaker' | 'sponsor';
    previousFilter?: 'all' | 'host' | 'speaker' | 'sponsor';
    membersCount: number;
    teamsCount: number;
    resultsCount: number;
  }) {
    captureEvent(EVENTS_ANALYTICS.EVENTS_PAGE_CONTRIBUTORS_FILTER_SELECTED, params);
  }

  function onContributorsTeamTreemapClicked(params: {
    teamName: string;
    teamUid: string;
    hostsCount: number;
    speakersCount: number;
    sponsorsCount: number;
    size: number;
  }) {
    captureEvent(EVENTS_ANALYTICS.EVENTS_PAGE_CONTRIBUTORS_TEAM_TREEMAP_CLICKED, params);
  }

  function onContributorsViewMoreClicked(params: { remainingCount: number; totalCount: number; visibleCount: number }) {
    captureEvent(EVENTS_ANALYTICS.EVENTS_PAGE_CONTRIBUTORS_VIEW_MORE_CLICKED, params);
  }

  /* The event drawer (LAB-3216). */

  function onEventDrawerOpened(params: { eventUid: string; source: EventDrawerSource }) {
    captureEvent(EVENT_DRAWER_ANALYTICS.ON_EVENT_DRAWER_OPENED, { event_uid: params.eventUid, source: params.source });
  }

  /** All Events (LAB-3247): the member switched view; `mode` only for the calendar. */
  function onEventsViewChanged(params: { view: 'list' | 'calendar' | 'map'; mode?: 'week' | 'month' }) {
    captureEvent(ALL_EVENTS_ANALYTICS.ON_EVENTS_VIEW_CHANGED, params);
  }

  /** All Events (LAB-3418): the member switched Live & upcoming | Past, in List or Map, or in Calendar by a press (LAB-3460). */
  function onEventsWhenChanged(params: { when: 'upcoming' | 'past'; view: 'list' | 'calendar' | 'map' }) {
    captureEvent(ALL_EVENTS_ANALYTICS.ON_EVENTS_WHEN_CHANGED, params);
  }

  /** All Events (LAB-3418): the member picked a year on Past, or every year (`all`). */
  function onEventsYearChanged(params: { year: string; view: 'list' | 'calendar' | 'map' }) {
    captureEvent(ALL_EVENTS_ANALYTICS.ON_EVENTS_YEAR_CHANGED, params);
  }

  /** All Events: Copy link in the Embed dialog put the embed link on the clipboard (LAB-3352, LAB-3365). */
  function onEventsEmbedLinkCopied(params: {
    view: 'list' | 'calendar' | 'map';
    filters_count: number;
    details: EmbedDetails;
  }) {
    captureEvent(ALL_EVENTS_ANALYTICS.ON_EVENTS_EMBED_LINK_COPIED, params);
  }

  /** All Events: Copy code in the Embed dialog put the iframe code on the clipboard (LAB-3365). */
  function onEventsEmbedCodeCopied(params: {
    view: 'list' | 'calendar' | 'map';
    filters_count: number;
    details: EmbedDetails;
  }) {
    captureEvent(ALL_EVENTS_ANALYTICS.ON_EVENTS_EMBED_CODE_COPIED, params);
  }

  /** The embed page loaded, with the host of the page that framed it (null opened directly). */
  function onEventsEmbedViewed(params: {
    view: 'list' | 'calendar' | 'map';
    referrer_host: string | null;
    details: EmbedDetails;
  }) {
    captureEvent(ALL_EVENTS_ANALYTICS.ON_EVENTS_EMBED_VIEWED, params);
  }

  /** All Events: one filter changed, with every value it now holds (empty when it was cleared). */
  function onEventsFiltersApplied(params: { key: FilterParam; values: string[] }) {
    captureEvent(ALL_EVENTS_ANALYTICS.ON_EVENTS_FILTERS_APPLIED, params);
  }

  /** All Events: a city chosen from a Browse by city tile or Near you's "All <city> events". */
  function onEventsCitySelected(params: { city: string; from: 'tile' | 'filter' | 'near-you' }) {
    captureEvent(ALL_EVENTS_ANALYTICS.ON_EVENTS_CITY_SELECTED, params);
  }

  /** All Events (LAB-3394): the location dialog opened from Near you's rows, and a location saved there. */
  function onEventsLocationDialogOpened(params: { from: 'add' | 'change' | 'no-events' }) {
    captureEvent(ALL_EVENTS_ANALYTICS.ON_EVENTS_LOCATION_DIALOG_OPENED, params);
  }

  function onEventsLocationSaved(params: { from: 'add' | 'change' | 'no-events' }) {
    captureEvent(ALL_EVENTS_ANALYTICS.ON_EVENTS_LOCATION_SAVED, params);
  }

  function onEventGoingMarked(params: { eventUid: string; source: EventDrawerSource }) {
    captureEvent(EVENT_DRAWER_ANALYTICS.ON_EVENT_GOING_MARKED, {
      event_uid: params.eventUid,
      source: params.source,
    });
  }

  function onEventNotGoingMarked(params: { eventUid: string }) {
    captureEvent(EVENT_DRAWER_ANALYTICS.ON_EVENT_NOT_GOING_MARKED, { event_uid: params.eventUid });
  }

  /** "Add your plans" saved; `roles` is this event's Host / Speaker / Sponsor (empty is plain attendance). */
  function onEventPlansSaved(params: { eventUid: string; roles: string[] }) {
    captureEvent(EVENT_DRAWER_ANALYTICS.ON_EVENT_PLANS_SAVED, {
      event_uid: params.eventUid,
      roles: params.roles,
    });
  }

  function onEventAttendeesOpened(params: { eventUid: string }) {
    captureEvent(EVENT_DRAWER_ANALYTICS.ON_EVENT_ATTENDEES_OPENED, { event_uid: params.eventUid });
  }

  /** LAB-3361: the drawer's Copy link (the `/events/all?event=<uid>` address). */
  function onEventLinkCopied(params: { eventUid: string }) {
    captureEvent(EVENT_DRAWER_ANALYTICS.ON_EVENT_LINK_COPIED, { event_uid: params.eventUid });
  }

  /** LAB-3361: the drawer's "Open in PL Events". */
  function onEventEventsAppOpened(params: { eventUid: string }) {
    captureEvent(EVENT_DRAWER_ANALYTICS.ON_EVENT_EVENTS_APP_OPENED, { event_uid: params.eventUid });
  }

  /** LAB-3361: previous / next in the drawer's toolbar; `eventUid` is the event it moved to. */
  function onEventDrawerStepped(params: {
    eventUid: string;
    direction: 'previous' | 'next';
    source: EventDrawerSource;
  }) {
    captureEvent(EVENT_DRAWER_ANALYTICS.ON_EVENT_DRAWER_STEPPED, {
      event_uid: params.eventUid,
      direction: params.direction,
      source: params.source,
    });
  }

  /** `from`: the section header (the owner has upcoming events) or the empty state. */
  function onProfileEventAddClicked(params: { from: 'header' | 'empty-state' }) {
    captureEvent(EVENT_DRAWER_ANALYTICS.ON_PROFILE_EVENT_ADD_CLICKED, { from: params.from });
  }

  function onProfileEventRemoved(params: { eventUid: string }) {
    captureEvent(EVENT_DRAWER_ANALYTICS.ON_PROFILE_EVENT_REMOVED, { event_uid: params.eventUid });
  }

  return {
    onEventsSubmitFormOpened,
    onEventsSubmitFormSubmitted,
    onEventsSubmitFormFailed,
    onEventsMySubmissionsOpened,
    onEventsEventEdited,
    onEventsEventDeleted,
    onEventDrawerOpened,
    onEventsViewChanged,
    onEventsWhenChanged,
    onEventsYearChanged,
    onEventsEmbedLinkCopied,
    onEventsEmbedCodeCopied,
    onEventsEmbedViewed,
    onEventsFiltersApplied,
    onEventsCitySelected,
    onEventsLocationDialogOpened,
    onEventsLocationSaved,
    onEventGoingMarked,
    onEventNotGoingMarked,
    onEventPlansSaved,
    onEventAttendeesOpened,
    onEventLinkCopied,
    onEventEventsAppOpened,
    onEventDrawerStepped,
    onProfileEventAddClicked,
    onProfileEventRemoved,
    onIrlLocationClicked,
    onEventCardClicked,
    onContributorClicked,
    onContributorListClicked,
    onContributtonModalCloseClicked,
    onContributtonModalOpenClicked,
    onContributorListSearchChanged,
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
    onContributorsSearchInputChanged,
    onContributorsFilterSelected,
    onContributorsTeamTreemapClicked,
    onContributorsViewMoreClicked,
  };
};
