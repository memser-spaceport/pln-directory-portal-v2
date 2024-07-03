import { IAnalyticsMemberInfo } from "@/types/members.types";
import { IAnalyticsProjectInfo } from "@/types/project.types";
import { IAnalyticsTeamInfo, IAnalyticsUserInfo } from "@/types/shared.types";
import { PROJECT_ANALYTICS_EVENTS } from "@/utils/constants";
import { usePostHog } from "posthog-js/react";


export const useProjectAnalytics = () => {
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
      
      function onProjectDeleteBtnClicked(user: IAnalyticsUserInfo | null, projectId: string) {
        const params = {
          user,
          projectId,
        }
        captureEvent(PROJECT_ANALYTICS_EVENTS.PROJECT_DETAIL_DELETE_BTN_CLICKED, params);
      }

      function onProjectDeleteSuccess(user: IAnalyticsUserInfo | null, projectId: string) {
        const params = {
          user,
          projectId,
        }
        captureEvent(PROJECT_ANALYTICS_EVENTS.PROJECT_DETAIL_DELETE_SUCCESS, params);
      }

      function onProjectDeleteFailed(user: IAnalyticsUserInfo | null, projectId: string) {
        const params = {
          user,
          projectId,
        }
        captureEvent(PROJECT_ANALYTICS_EVENTS.PROJECT_DETAIL_DELETE_FAILED, params);
      }
      
      function onProjectDeleteCancelBtnClicked(user: IAnalyticsUserInfo | null, projectId: string) {
        const params = {
          user,
          projectId,
        }
        captureEvent(PROJECT_ANALYTICS_EVENTS.PROJECT_DETAIL_DELETE_CANCEL_BTN_CLICKED, params)
      }

      function onProjectDeleteConfirmBtnClicked(user: IAnalyticsUserInfo | null, projectId: string) {
        const params = {
          user,
          projectId,
        }
        captureEvent(PROJECT_ANALYTICS_EVENTS.PROJECT_DETAIL_EDIT_CONFIRM_CLICKED, params);
      }

      function onProjectDetailEditClicked(user: IAnalyticsUserInfo | null, projectId: string) {
        const params = {
          user,
          projectId,
        }
        captureEvent(PROJECT_ANALYTICS_EVENTS.PROJECT_DETAIL_EDIT_CLICKED, params);
      }
      
      function onProjectDetailContactClicked(user: IAnalyticsUserInfo | null, projectId: string, link: string) {
        const params = {
          user,
          projectId,
          link
        }
        captureEvent(PROJECT_ANALYTICS_EVENTS.PROJECT_DETAIL_LINKS_CLICKED, params);
      }

      function onProjectDetailEditReadMeClicked(user: IAnalyticsUserInfo | null, projectId: string) {
        const params = {
          user,
          projectId,
        }
        captureEvent(PROJECT_ANALYTICS_EVENTS.PROJECT_EDIT_CLICKED, params);
      }

      function onProjectDetailAdditionalDetailEditCanceled(user: IAnalyticsUserInfo | null, projectId: string) {
        const params = {
          user, 
          projectId,
        }
        captureEvent(PROJECT_ANALYTICS_EVENTS.PROJECT_DETAIL_ADDITIONAL_DETAIL_EDIT_CANCELLED, params);
      }

      function onProjectDetailReadMeEditSaveBtnClicked(user: IAnalyticsUserInfo | null, projectId: string) {
        const params = {
          user,
          projectId,
        }
        captureEvent(PROJECT_ANALYTICS_EVENTS.PROJECT_DETAIL_ADDITIONAL_DETAIL_EDIT_SAVE, params);
      }


      function onProjectDetailReadMeEditSuccess(user: IAnalyticsUserInfo | null, projectId: string) {
        const params = {
          user,
          projectId,
        }
        captureEvent(PROJECT_ANALYTICS_EVENTS.PROJECT_DETAIL_ADDITIONAL_DETAIL_EDIT_SAVE_SUCCESS, params);
      }      
      
      function onProjectDetailReadMeEditFailed(user: IAnalyticsUserInfo | null, projectId: string) {
        const params = {
          user,
          projectId,
        }
        captureEvent(PROJECT_ANALYTICS_EVENTS.PROJECT_DETAIL_ADDITIONAL_DETAIL_EDIT_SAVE_FAILED, params);
      }

      function onProjectDetailMaintainerTeamClicked(user: IAnalyticsUserInfo | null, projectId: string, team: IAnalyticsTeamInfo | null) {
        const params = {
          user,
          projectId,
          team,
        }
        captureEvent(PROJECT_ANALYTICS_EVENTS.PROJECT_DETAIL_MAINTAINER_TEAM_CLICKED, params)
      }

      function onProjectDetailContributingTeamClicked(user: IAnalyticsUserInfo | null, projectId: string, team: IAnalyticsTeamInfo | null) {
        const params = {
          user,
          projectId,
          team,
        }
        captureEvent(PROJECT_ANALYTICS_EVENTS.PROJECT_DETAIL_CONTRIBUTING_TEAM_CLICKED, params)
      }

      function onProjectDetailSeeAllTeamsClicked(user: IAnalyticsUserInfo | null, projectId: string) {
        const params = {
          user,
          projectId,
        }
        captureEvent(PROJECT_ANALYTICS_EVENTS.PROJECT_DETAIL_SEEALL_CLICKED, params);
      }

      function onProjDetailSeeAllContributorsClicked(user: IAnalyticsUserInfo | null, project: IAnalyticsProjectInfo | null) {
        const params = {
          user,
          project,
        }
        captureEvent(PROJECT_ANALYTICS_EVENTS.PROJECT_DETAIL_SEE_ALL_CONTRIBUTORS_CLICKED, params);
      }

      function onProjectDetailContributorClicked(user: IAnalyticsUserInfo | null, project: IAnalyticsProjectInfo | null, member: IAnalyticsMemberInfo | null) {
        const params = {
          user,
          project,
          member,
        }
        captureEvent(PROJECT_ANALYTICS_EVENTS.PROJECT_DETAIL_CONTRIBUTOR_PROFILE_CLICKED, params)
      }
      return {
        onProjectDeleteSuccess,
        onProjectDeleteFailed,
        onProjectDeleteBtnClicked,
        onProjectDeleteCancelBtnClicked,
        onProjectDetailEditClicked,
        onProjectDeleteConfirmBtnClicked,
        onProjectDetailContactClicked,
        onProjectDetailEditReadMeClicked,
        onProjectDetailAdditionalDetailEditCanceled,
        onProjectDetailReadMeEditSaveBtnClicked,
        onProjectDetailReadMeEditSuccess,
        onProjectDetailReadMeEditFailed,
        onProjectDetailMaintainerTeamClicked,
        onProjectDetailContributingTeamClicked,
        onProjectDetailSeeAllTeamsClicked,
        onProjDetailSeeAllContributorsClicked,
        onProjectDetailContributorClicked
      }
    }