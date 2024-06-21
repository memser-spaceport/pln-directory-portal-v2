import { TEAMS_ANALYTICS_EVENTS } from "@/utils/constants";
import { usePostHog } from "posthog-js/react";

export const useTeamAnalytics = () => {
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

      function onOfficeHoursSelected() {
        captureEvent(TEAMS_ANALYTICS_EVENTS.TEAM_OFFICE_HOURS_FILTER_SELECTED);
      }

      function onFriendsOfProtocolSelected() {
        captureEvent(TEAMS_ANALYTICS_EVENTS.TEAM_FRIENDS_OF_PROTOCOL_FILTER_SELECTED)
      }

      function onFilterApplied (name: string | undefined, value: string) {
        const params = {
          name,
          value,
          nameAndValue: `${name}-${value}`,
        }
        captureEvent(TEAMS_ANALYTICS_EVENTS.FILTERS_APPLIED, params)
      }

      function onClearAllFiltersClicked() {
        captureEvent(TEAMS_ANALYTICS_EVENTS.TEAM_CLEAR_ALL_FILTERS_APPLIED)
      }

      function onTeamShowFilterResultClicked() {
        captureEvent(TEAMS_ANALYTICS_EVENTS.TEAM_VIEW_FILTER_RESULT_CLICKED);
      }

      function onTeamFilterCloseClicked() {
        captureEvent(TEAMS_ANALYTICS_EVENTS.TEAM_CLOSE_FILTER_PANEL_CLICKED)
      }



      return {
        onOfficeHoursSelected,
        onFriendsOfProtocolSelected,
        onFilterApplied,
        onClearAllFiltersClicked,
        onTeamShowFilterResultClicked,
        onTeamFilterCloseClicked
      }
}