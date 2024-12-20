import { IAnalyticsMemberInfo } from "@/types/members.types";
import { IAnalyticsProjectInfo } from "@/types/project.types";
import { IAnalyticsTeamInfo, IAnalyticsUserInfo } from "@/types/shared.types";
import { TEAMS_ANALYTICS_EVENTS } from "@/utils/constants";
import { getUserInfo } from "@/utils/third-party.helper";
import { usePostHog } from "posthog-js/react";

export const useTeamAnalytics = () => {
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

      function onClearAllFiltersClicked(user: IAnalyticsUserInfo | null ) {
        const params = {
          user,
        }
        captureEvent(TEAMS_ANALYTICS_EVENTS.TEAM_CLEAR_ALL_FILTERS_APPLIED, params)
      }

      function onFocusAreaFilterClicked(params: {page: string, name: string, value: string, user: IAnalyticsUserInfo | null, nameAndValue: string}) {
        captureEvent(TEAMS_ANALYTICS_EVENTS.FILTERS_APPLIED, params)
      }

      function onTeamShowFilterResultClicked() {
        captureEvent(TEAMS_ANALYTICS_EVENTS.TEAM_VIEW_FILTER_RESULT_CLICKED);
      }

      function onTeamFilterCloseClicked() {
        captureEvent(TEAMS_ANALYTICS_EVENTS.TEAM_CLOSE_FILTER_PANEL_CLICKED)
      }

      function onTeamSearch(value: string, user: IAnalyticsUserInfo | null) {
        const params = {
          value,
          user
          
        }
        captureEvent(TEAMS_ANALYTICS_EVENTS.TEAMS_SEARCH, params)
      }

      function onTeamSortByChanged(directoryType: string, sortedBy: string, user: IAnalyticsUserInfo | null) {
        const params = {
          directoryType,
          sortedBy,
          user
        }
        captureEvent(TEAMS_ANALYTICS_EVENTS.DIRECTORY_LIST_SORTBY_CHANGED, params)
      }

      function onTeamViewTypeChanged(type: string, user: IAnalyticsUserInfo |  null) {
        const params = {
          type, 
          user
        }
        captureEvent(TEAMS_ANALYTICS_EVENTS.TEAMS_VIEW_TYPE_CHANGED, params);
      }

      function onTeamOpenFilterPanelClicked(user: IAnalyticsUserInfo | null) {
        const params = {
          user,
        }

        captureEvent(TEAMS_ANALYTICS_EVENTS.TEAM_OPEN_FILTER_PANEL_CLICKED, params)
      }

      function onTeamCardClicked(team: IAnalyticsTeamInfo | null, user: IAnalyticsUserInfo | null) {
        const params = {
          ...team,
          user
        }
        captureEvent(TEAMS_ANALYTICS_EVENTS.TEAM_CLICKED, params);
      }

      function onEditTeamByLead(team: IAnalyticsTeamInfo | null, user: IAnalyticsUserInfo | null) {
        const params = {
          ...team,
          user
        }
        captureEvent(TEAMS_ANALYTICS_EVENTS.TEAM_EDIT_BY_LEAD, params);
      }

      function onEditTeamByAdmin(team: IAnalyticsTeamInfo | null, user: IAnalyticsUserInfo | null) {
        const params = {
          ...team,
          user
        }
        captureEvent(TEAMS_ANALYTICS_EVENTS.TEAM_EDIT_BY_ADMIN, params);
      }

      function onTeamDetailAboutShowMoreClicked(team: IAnalyticsTeamInfo | null, user: IAnalyticsUserInfo | null) {
        const params =  {
          ...team,
          user
        }
        captureEvent(TEAMS_ANALYTICS_EVENTS.TEAM_DETAIL_ABOUT_SHOW_MORE_CLICKED, params);
      }

      function onTeamDetailAboutShowLessClicked(team: IAnalyticsTeamInfo | null, user: IAnalyticsUserInfo | null) {
        const params = {
          ...team,
          user
        }
        captureEvent(TEAMS_ANALYTICS_EVENTS.TEAM_DETAIL_ABOUT_SHOW_LESS_CLICKED, params)
      }

      function onTeamDetailAboutEditClicked(team: IAnalyticsTeamInfo | null, user: IAnalyticsUserInfo | null) {
        const params = {
          ...team,
          user
        }
        captureEvent(TEAMS_ANALYTICS_EVENTS.TEAM_DETAIL_ABOUT_EDIT_CLICKED, params)
      }

      function onTeamDetailAboutEditCancelClicked(team: IAnalyticsTeamInfo | null, user: IAnalyticsUserInfo | null) {
        const params =  {
          ...team,
          user
        }
        captureEvent(TEAMS_ANALYTICS_EVENTS.TEAM_DETAIL_ABOUT_EDIT_CANCEL_CLICKED, params);
      }

      function onTeamDetailAboutEditSaveClicked(team: IAnalyticsTeamInfo | null, user: IAnalyticsUserInfo | null) {
        const params = {
          ...team,
          user
        }
        captureEvent(TEAMS_ANALYTICS_EVENTS.TEAM_DETAIL_ABOUT_EDIT_SAVE_CLICKED, params)
      }

      function onTeamDetailShowMoreTechnologiesClicked(team: IAnalyticsTeamInfo | null, user: IAnalyticsUserInfo | null) {
        const params = {
          ...team,
          user
        }
        captureEvent(TEAMS_ANALYTICS_EVENTS.TEAM_DETAIL_SHOW_MORE_TECHNOLOGY_CLICKED, params)
      }

      function onTeamDetailContactClicked(team: IAnalyticsTeamInfo | null, user: IAnalyticsUserInfo | null, type: string, value: string) {
        const params = {
          ...team,
          user,
          type,
          value
        }
        captureEvent(TEAMS_ANALYTICS_EVENTS.TEAM_DETAIL_CONTACT_CLICKED, params);
      }

      function onTeamDetailSeeAllProjectsClicked(team: IAnalyticsTeamInfo | null, user: IAnalyticsUserInfo | null) {
        const params = {
          ...team,
          user,
          from:"teams-details"
        }
        captureEvent(TEAMS_ANALYTICS_EVENTS.TEAM_DETAIL_SEE_ALL_PROJECTS_CLICKED, params);
      }

      function onTeamDetailProjectClicked(team: IAnalyticsTeamInfo | null, user: IAnalyticsUserInfo | null, project: IAnalyticsProjectInfo | null) {
        const params = {
          ...team,
          user,
          project
        }
        captureEvent(TEAMS_ANALYTICS_EVENTS.TEAM_DETAIL_PROJECT_CLICKED, params);
      }

      function onTeamDetailSeeAllMemberClicked(team: IAnalyticsTeamInfo | null, user: IAnalyticsUserInfo | null)  {
        const params = {
          ...team,
          user
        }
        captureEvent(TEAMS_ANALYTICS_EVENTS.TEAM_DETAIL_SEE_ALL_MEMBERS_CLICKED, params);
      }

      function onTeamDetailMemberClicked(team: IAnalyticsTeamInfo | null, user: IAnalyticsUserInfo | null, member: IAnalyticsMemberInfo | null) {
        const params = {
          ...team,
          user,
          member
        }
        captureEvent(TEAMS_ANALYTICS_EVENTS.TEAM_DETAIL_MEMBER_CLICKED, params);
      }

      function onTeamFocusAreaHelpClicked(params: {page: string, user: IAnalyticsUserInfo | null}) {
        captureEvent(TEAMS_ANALYTICS_EVENTS.TEAM_FOCUS_AREA_HELP_CLICKED, params);
      }

      function onScheduleMeetingClicked(user: IAnalyticsUserInfo | null, team: IAnalyticsTeamInfo | null) {
        const params = {
          user,
          ...team,
        };
        captureEvent(TEAMS_ANALYTICS_EVENTS.TEAM_OFFICEHOURS_CLICKED, params);
      }

      function onTeamDetailAddProjectClicked(user: IAnalyticsUserInfo | null, team: IAnalyticsTeamInfo | null) {
        const params = {
          user,
          ...team,
        }
        captureEvent(TEAMS_ANALYTICS_EVENTS.TEAM_DETAIL_ADD_PROJECT_CLICKED, params);
      }

      function onTeamDetailProjectEditClicked(user: IAnalyticsUserInfo | null, team: IAnalyticsTeamInfo | null, project: IAnalyticsProjectInfo | null) {
        const params = {
          user,
          ...team,
          project,
        }
        captureEvent(TEAMS_ANALYTICS_EVENTS.PROJECT_EDIT_CLICKED, params);
      }

      function onTeamDetailOfficeHoursLoginClicked( team: IAnalyticsTeamInfo | null) {
        const params = {
          ...team,
        }
        captureEvent(TEAMS_ANALYTICS_EVENTS.TEAM_OFFICEHOURS_LOGIN_BTN_CLICKED, params);
      }

      function recordAboutSave(type: string, user: IAnalyticsUserInfo | null, payload?: any){
        const params = {
          type,
          user,
          ...payload,
        };
        captureEvent(TEAMS_ANALYTICS_EVENTS.TEAM_DETAIL_ABOUT_SAVE, params);
      }

      function onClickSeeMoreIrlContribution(user: IAnalyticsUserInfo | null){
        const params = {
          user,
        };
        captureEvent(TEAMS_ANALYTICS_EVENTS.ON_CLICK_SEE_MORE_BUTTON_IRL_CONTRIBUTIONS, params);
      }

      function onClickTeamIrlContribution(user: IAnalyticsUserInfo | null){
        const params = {
          user,
        };
        captureEvent(TEAMS_ANALYTICS_EVENTS. TEAM_DETAILS_ON_CLICK_IRL_CONTRIBUTIONS, params);
      }

      return {
        onOfficeHoursSelected,
        onFriendsOfProtocolSelected,
        onFilterApplied,
        onClearAllFiltersClicked,
        onTeamShowFilterResultClicked,
        onTeamFilterCloseClicked, 
        onTeamSearch, 
        onTeamSortByChanged,
        onTeamViewTypeChanged,
        onTeamOpenFilterPanelClicked,
        onTeamCardClicked,
        onEditTeamByLead,
        onEditTeamByAdmin,
        onTeamDetailAboutShowMoreClicked,
        onTeamDetailAboutShowLessClicked,
        onTeamDetailShowMoreTechnologiesClicked,
        onTeamDetailContactClicked,
        onTeamDetailSeeAllProjectsClicked,
        onTeamDetailProjectClicked,
        onTeamDetailSeeAllMemberClicked,
        onTeamDetailMemberClicked,
        onFocusAreaFilterClicked,
        onTeamFocusAreaHelpClicked,
        onScheduleMeetingClicked,
        onTeamDetailAddProjectClicked,
        onTeamDetailProjectEditClicked,
        onTeamDetailOfficeHoursLoginClicked,
        onTeamDetailAboutEditSaveClicked,
        onTeamDetailAboutEditCancelClicked,
        onTeamDetailAboutEditClicked,
        recordAboutSave,
        onClickSeeMoreIrlContribution,
        onClickTeamIrlContribution
      }

}