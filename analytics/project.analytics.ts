import { IAnalyticsMemberInfo } from '@/types/members.types';
import { IAnalyticsProjectInfo } from '@/types/project.types';
import { IAnalyticsTeamInfo, IAnalyticsUserInfo } from '@/types/shared.types';
import { PROJECT_ANALYTICS_EVENTS } from '@/utils/constants';
import { getUserInfo } from '@/utils/third-party.helper';
import { usePostHog } from 'posthog-js/react';

export const useProjectAnalytics = () => {
  const postHogProps = usePostHog();

  const captureEvent = (eventName: string, eventParams = {}) => {
    try {
      if (postHogProps?.capture) {
        const allParams = { ...eventParams };
        const userInfo = getUserInfo();
        const loggedInUserUid = userInfo?.uid;
        const loggedInUserEmail = userInfo?.email;
        const loggedInUserName = userInfo?.name;
        postHogProps.capture(eventName, { ...allParams, loggedInUserUid, loggedInUserEmail, loggedInUserName});
      }
    } catch (e) {
      console.error(e);
    }
  };

  function onProjectAddInitiated(user: IAnalyticsUserInfo | null, project: any) {
    const params = {
      user,
      project
    };
    captureEvent(PROJECT_ANALYTICS_EVENTS.PROJECT_ADD_INITIATED, params);
  }

  function onProjectAddSuccess(user: IAnalyticsUserInfo | null, project: any) {
    const params = {
      user,
      project,
    };
    captureEvent(PROJECT_ANALYTICS_EVENTS.PROJECT_ADD_SUCCESS, params);
  }

  function onProjectAddFailed(user: IAnalyticsUserInfo | null, project: any) {
    const params = {
      user,
      project,
    };
    captureEvent(PROJECT_ANALYTICS_EVENTS.PROJECT_ADD_FAILED, params);
  }

  function onProjectEditInitiated(user: IAnalyticsUserInfo | null, project: any) {
    const params = {
      user,
      project,
    };

    captureEvent(PROJECT_ANALYTICS_EVENTS.PROJECT_EDIT_INITIATED, params);
  }

  function onProjectEditSuccess(user: IAnalyticsUserInfo | null, project: any, projectId: string) {
    const params = {
      user,
      project,
      projectId,
    };
    captureEvent(PROJECT_ANALYTICS_EVENTS.PROJECT_EDIT_SUCCESS, params);
  }

  function onProjectEditFailed(user: IAnalyticsUserInfo | null, project: any, projectId: string) {
    const params = {
      user,
      project,
      projectId
    };
    captureEvent(PROJECT_ANALYTICS_EVENTS.PROJECT_EDIT_FAILED, params);
  }


  function onProjectDeleteBtnClicked(user: IAnalyticsUserInfo | null, projectId: string) {
    const params = {
      user,
      projectId,
    };
    captureEvent(PROJECT_ANALYTICS_EVENTS.PROJECT_DETAIL_DELETE_BTN_CLICKED, params);
  }

  function onProjectDeleteSuccess(user: IAnalyticsUserInfo | null, projectId: string) {
    const params = {
      user,
      projectId,
    };
    captureEvent(PROJECT_ANALYTICS_EVENTS.PROJECT_DETAIL_DELETE_SUCCESS, params);
  }

  function onProjectDeleteFailed(user: IAnalyticsUserInfo | null, projectId: string) {
    const params = {
      user,
      projectId,
    };
    captureEvent(PROJECT_ANALYTICS_EVENTS.PROJECT_DETAIL_DELETE_FAILED, params);
  }

  function onProjectDeleteCancelBtnClicked(user: IAnalyticsUserInfo | null, projectId: string) {
    const params = {
      user,
      projectId,
    };
    captureEvent(PROJECT_ANALYTICS_EVENTS.PROJECT_DETAIL_DELETE_CANCEL_BTN_CLICKED, params);
  }

  function onProjectDeleteConfirmBtnClicked(user: IAnalyticsUserInfo | null, projectId: string) {
    const params = {
      user,
      projectId,
    };
    captureEvent(PROJECT_ANALYTICS_EVENTS.PROJECT_DETAIL_DELETE_CONFIRM_CLICKED, params);
  }

  function onProjectDetailEditClicked(user: IAnalyticsUserInfo | null, projectId: string) {
    const params = {
      user,
      projectId,
    };
    captureEvent(PROJECT_ANALYTICS_EVENTS.PROJECT_DETAIL_EDIT_CLICKED, params);
  }

  function onProjectDetailContactClicked(user: IAnalyticsUserInfo | null, projectId: string, linkUrl: string) {
    const params = {
      user,
      projectId,
      linkUrl,
    };
    captureEvent(PROJECT_ANALYTICS_EVENTS.PROJECT_DETAIL_LINKS_CLICKED, params);
  }

  function onProjectDetailEditReadMeClicked(user: IAnalyticsUserInfo | null, projectId: string, from: string) {
    const params = {
      user,
      projectId,
      from
    };
    captureEvent(PROJECT_ANALYTICS_EVENTS.PROJECT_EDIT_CLICKED, params);
  }

  function onProjectDetailAdditionalDetailEditCanceled(user: IAnalyticsUserInfo | null, projectId: string) {
    const params = {
      user,
      projectId,
    };
    captureEvent(PROJECT_ANALYTICS_EVENTS.PROJECT_DETAIL_ADDITIONAL_DETAIL_EDIT_CANCELLED, params);
  }

  function onProjectDetailReadMeEditSuccess(user: IAnalyticsUserInfo | null, projectId: string) {
    const params = {
      user,
      projectId,
    };
    captureEvent(PROJECT_ANALYTICS_EVENTS.PROJECT_DETAIL_ADDITIONAL_DETAIL_EDIT_SAVE_SUCCESS, params);
  }

  function onProjectDetailReadMeEditFailed(user: IAnalyticsUserInfo | null, projectId: string) {
    const params = {
      user,
      projectId,
    };
    captureEvent(PROJECT_ANALYTICS_EVENTS.PROJECT_DETAIL_ADDITIONAL_DETAIL_EDIT_SAVE_FAILED, params);
  }

  function onProjectDetailMaintainerTeamClicked(user: IAnalyticsUserInfo | null, projectId: string, team: IAnalyticsTeamInfo | null) {
    const params = {
      user,
      projectId,
      ...team,
    };
    captureEvent(PROJECT_ANALYTICS_EVENTS.PROJECT_DETAIL_MAINTAINER_TEAM_CLICKED, params);
  }

  function onProjectDetailContributingTeamClicked(user: IAnalyticsUserInfo | null, projectId: string, team: IAnalyticsTeamInfo | null) {
    const params = {
      user,
      projectId,
      ...team
    };
    captureEvent(PROJECT_ANALYTICS_EVENTS.PROJECT_DETAIL_CONTRIBUTING_TEAM_CLICKED, params);
  }

  function onProjectDetailSeeAllTeamsClicked(user: IAnalyticsUserInfo | null, projectId: string) {
    const params = {
      user,
      projectId,
    };
    captureEvent(PROJECT_ANALYTICS_EVENTS.PROJECT_DETAIL_SEEALL_CLICKED, params);
  }

  function onProjDetailSeeAllContributorsClicked(user: IAnalyticsUserInfo | null, project: IAnalyticsProjectInfo | null) {
    const params = {
      user,
      project,
    };
    captureEvent(PROJECT_ANALYTICS_EVENTS.PROJECT_DETAIL_SEE_ALL_CONTRIBUTORS_CLICKED, params);
  }

  function onProjectDetailContributorClicked(user: IAnalyticsUserInfo | null, project: IAnalyticsProjectInfo | null, member: IAnalyticsMemberInfo | null) {
    const params = {
      user,
      project,
      member,
    };
    captureEvent(PROJECT_ANALYTICS_EVENTS.PROJECT_DETAIL_CONTRIBUTOR_PROFILE_CLICKED, params);
  }

  function onProjectFilterApplied(user: IAnalyticsUserInfo | null, team: any) {
    const params = {
      user,
      ...team,
    };
    captureEvent(PROJECT_ANALYTICS_EVENTS.PROJECT_LIST_FILTERS_APPLIED, params);
  }

  function onProjectFilterCleared(user: IAnalyticsUserInfo | null) {
    const params = {
      user,
    };
    captureEvent(PROJECT_ANALYTICS_EVENTS.PROJECT_LIST_FILTERS_CLEARED, params);
  }

  function onProjectClicked(user: IAnalyticsUserInfo | null, project: any) {
    const params = {
      user,
      ...project,
    };
    captureEvent(PROJECT_ANALYTICS_EVENTS.PROJECT_LIST_PROJECT_CLICKED, params);
  }

  function onProjectAddClicked(user: IAnalyticsUserInfo | null, value: any) {
    const params = {
      user,
      ...value,
    };
    captureEvent(PROJECT_ANALYTICS_EVENTS.PROJECT_ADD_CLICKED, params);
  }

  function onProjectSearchApplied(user: IAnalyticsUserInfo | null, value: any) {
    const params = {
      user,
      ...value,
    };
    captureEvent(PROJECT_ANALYTICS_EVENTS.PROJECT_LIST_SEARCH_APPLIED, params);
  }

  function onViewTypeClicked(user: IAnalyticsUserInfo | null, option: string) {
    const params = {
      option,
      user,
    };
    captureEvent(PROJECT_ANALYTICS_EVENTS.PROJECT_LIST_VIEW_TYPE_CLCIKED, params);
  }

  function onSorByClicked(user: IAnalyticsUserInfo | null, option: string) {
    const params = {
      option,
      user,
    };
    captureEvent(PROJECT_ANALYTICS_EVENTS.PROJECT_LIST_SORT_CLICKED, params);
  }

  function onProjectShowFilterResultClicked(user: IAnalyticsUserInfo | null) {
    const params = {
      user
    }
    captureEvent(PROJECT_ANALYTICS_EVENTS.PROJECT_VIEW_FILTER_RESULT_CLICKED, params);
  }

  function onProjectFilterCloseClicked(user: IAnalyticsUserInfo | null) {
    const params = {
      user
    }
    captureEvent(PROJECT_ANALYTICS_EVENTS.PROJECT_FILTER_PANEL_CLOSE_CLICKED, params)
  }

  function onProjectAddCancelClicked() {
    captureEvent(PROJECT_ANALYTICS_EVENTS.PROJECT_ADD_CANCEL);
  }

  function onProjectEditCancelClicked(projectId: string) { 
    const params = {
      projectId,
    };
    captureEvent(PROJECT_ANALYTICS_EVENTS.PROJECT_EDIT_CANCEL, params);
  }

  const onProjectAddSaveClicked = () => {
    captureEvent(PROJECT_ANALYTICS_EVENTS.PROJECT_ADD_SAVE_CLICKED);
  }

  const onProjectEditSaveClicked = (projectId: string) => {
    const params = {
      projectId,
    };
    captureEvent(PROJECT_ANALYTICS_EVENTS.PROJECT_EDIT_SAVE_CLICKED, params);
  }

  function onProjectDetailDescShowMoreClicked(user: IAnalyticsUserInfo | null, projectId: string) {
    const params = {
      user,
      projectId,
    };
    captureEvent(PROJECT_ANALYTICS_EVENTS.PROJECT_DETAIL_DESC_SHOW_MORE_CLICKED, params);
  }

  function onProjectDetailDescShowLessClicked(user: IAnalyticsUserInfo | null, projectId: string) {
    const params = {
      user,
      projectId,
    };
    captureEvent(PROJECT_ANALYTICS_EVENTS.PROJECT_DETAIL_DESC_SHOW_LESS_CLICKED, params);
  }

  function onProjectDetailReadMeEditSaveBtnClicked(user: IAnalyticsUserInfo | null, projectId: string) {
    const params = {
      user,
      projectId,
    };
    captureEvent(PROJECT_ANALYTICS_EVENTS.PROJECT_DETAIL_ADDITIONAL_DETAIL_EDIT_SAVE, params);
  }

  function onProjectDetailDescEditCancelClicked(user: IAnalyticsUserInfo | null, projectId: string) {
    const params = {
      user,
      projectId,
    };
    captureEvent(PROJECT_ANALYTICS_EVENTS.PROJECT_DETAIL_DESC_CANCEL_CLICKED, params);
  }

  function onProjectDetailDescEditClicked(user: IAnalyticsUserInfo | null, projectId: string) {
    const params = {
      user,
      projectId,
    };
    captureEvent(PROJECT_ANALYTICS_EVENTS.PROJECT_DETAIL_DESC_EDIT_CLICKED, params);
  }

  function onProjectDetailDescEditSaveClicked(user: IAnalyticsUserInfo | null, projectId: string) {
    const params = {
      user,
      projectId,
    };
    captureEvent(PROJECT_ANALYTICS_EVENTS.PROJECT_DETAIL_DESC_EDIT_SAVE_CLICKED, params);
  }

  function recordDescSave(type: string, user: IAnalyticsUserInfo | null, payload?: any){
    const params = {
      type,
      user,
      ...payload,
    };
    captureEvent(PROJECT_ANALYTICS_EVENTS.PROJECT_DETAIL_DESC_EDIT_SAVE, params);
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
    onProjectDetailContributorClicked,
    onProjectFilterApplied,
    onProjectFilterCleared,
    onProjectClicked,
    onProjectAddClicked,
    onProjectSearchApplied,
    onViewTypeClicked,
    onSorByClicked,
    onProjectShowFilterResultClicked,
    onProjectFilterCloseClicked,
    onProjectAddInitiated,
    onProjectAddSuccess,
    onProjectAddFailed,
    onProjectEditInitiated,
    onProjectEditFailed,
    onProjectEditSuccess,
    onProjectAddCancelClicked,
    onProjectEditCancelClicked,
    onProjectAddSaveClicked,
    onProjectEditSaveClicked,
    onProjectDetailDescShowMoreClicked,
    onProjectDetailDescShowLessClicked,
    onProjectDetailDescEditCancelClicked,
    onProjectDetailDescEditClicked,
    onProjectDetailDescEditSaveClicked,
    recordDescSave
  };
};
