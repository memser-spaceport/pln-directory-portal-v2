import { IAnalyticsMemberInfo, IMember } from '@/types/members.types';
import { IAnalyticsProjectInfo } from '@/types/project.types';
import { IAnalyticsTeamInfo, IAnalyticsUserInfo } from '@/types/shared.types';
import { MEMBER_ANALYTICS_EVENTS } from '@/utils/constants';
import { getUserInfo } from '@/utils/third-party.helper';
import { usePostHog } from 'posthog-js/react';

export const useMemberAnalytics = () => {
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

  function onOfficeHourClicked(user: IAnalyticsUserInfo | null, member: IAnalyticsMemberInfo | null) {
    const params = {
      user,
      ...member,
    };
    captureEvent(MEMBER_ANALYTICS_EVENTS.MEMBER_DETAIL_OFFICEHOURS_CLICKED, params);
  }

  function onProjectContributionEditClicked(member: IMember) {
    const params = {
      ...member,
    };
    captureEvent(MEMBER_ANALYTICS_EVENTS.MEMBER_DETAIL_PROJECT_CONTRIBUTIONS_EDIT, params);
  }

  function onProjectContributionAddlicked(member: IMember) {
    const params = {
      ...member,
    };
    captureEvent(MEMBER_ANALYTICS_EVENTS.MEMBER_DETAIL_PROJECT_CONTRIBUTIONS_ADD, params);
  }

  function onGithubSeeAllClicked(member: any, user: IAnalyticsUserInfo | null) {
    const params = {
      ...member,
      user,
    };

    captureEvent(MEMBER_ANALYTICS_EVENTS.MEMBER_DETAIL_GITHUB_PROJECT_VIEW_ALL_CLICKED, params);
  }

  function onGithubProjectItemClicked(member: any, user: IAnalyticsUserInfo | null) {
    const params = {
      ...member,
      user,
    };
    captureEvent(MEMBER_ANALYTICS_EVENTS.MEMBER_DETAIL_GITHUB_PROJECT_ITEM_CLICKED, params);
  }

  function onEditProfileClicked(user: IAnalyticsUserInfo | null, member: IAnalyticsMemberInfo | null) {
    const params = {
      user,
      ...member,
    };

    captureEvent(MEMBER_ANALYTICS_EVENTS.MEMBER_DETAIL_EDIT_PROFILE_CLICKED, params);
  }

  function onSocialProfileLinkClicked(user: IAnalyticsUserInfo | null, member: IAnalyticsMemberInfo | null, type: string, link: string) {
    const params = {
      user,
      ...member,
      type,
      link,
    };
    captureEvent(MEMBER_ANALYTICS_EVENTS.MEMBER_DETAIL_SOCIAL_LINK_CLICKED, params);
  }

  function onLearnMoreClicked(user: IAnalyticsUserInfo | null, member: IAnalyticsMemberInfo | null) {
    const params = {
      user,
      ...member,
    };

    captureEvent(MEMBER_ANALYTICS_EVENTS.MEMBER_DETAIL_LEARN_MORE_BTN_CLICKED, params);
  }

  function onTeamsSeeAllClicked(user: IAnalyticsUserInfo | null, member: IAnalyticsMemberInfo | null) {
    const params = {
      user,
      ...member,
    };
    captureEvent(MEMBER_ANALYTICS_EVENTS.MEMBER_DETAIL_TEAMS_SEE_ALL_CLICKED, params);
  }

  function onTeamClicked(user: IAnalyticsUserInfo | null, member: IAnalyticsMemberInfo | null, team: IAnalyticsTeamInfo | null) {
    const params = {
      user,
      ...member,
      team,
    };
    captureEvent(MEMBER_ANALYTICS_EVENTS.MEMBER_DETAIL_TEAM_CLICKED, params);
  }

  function onSeeAllProjectContributionsClicked(user: IAnalyticsUserInfo | null, member: IAnalyticsMemberInfo | null) {
    const params = {
      user,
      ...member,
    };
    captureEvent(MEMBER_ANALYTICS_EVENTS.MEMBER_DETAIL_PROJECT_CONTRIBUTIONS_SEE_ALL_CLICKED, params);
  }

  function onProjectClicked(user: IAnalyticsUserInfo | null, member: IAnalyticsMemberInfo | null, project: IAnalyticsProjectInfo | null) {
    const params = {
      user,
      ...member,
      project,
    };
    captureEvent(MEMBER_ANALYTICS_EVENTS.MEMBER_DETAIL_PROJECT_CLICKED, params);
  }

  function onUpdateGitHubHandle(user: IAnalyticsUserInfo | null, member: IAnalyticsMemberInfo | null) {
    const params = {
      user,
      ...member,
    };
    captureEvent(MEMBER_ANALYTICS_EVENTS.MEMBER_DETAIL_GITHUB_HANDLE_UPDATE_CLICKED, params);
  }

  function onMemberCardClicked(user: IAnalyticsUserInfo | null, member: IAnalyticsMemberInfo | null, viewType: string) {
    const params = {
      user,
      ...member,
      viewType,
    };
    captureEvent(MEMBER_ANALYTICS_EVENTS.MEMBER_LIST_MEMEBR_CLICKED, params);
  }

  function onMemberListFiltersApplied(user: IAnalyticsUserInfo | null, name: string, value: string, page = 'Members') {
    const params = {
      user,
      page,
      name,
      value,
      nameAndValue: `${name}-${value}`,
    };
    captureEvent(MEMBER_ANALYTICS_EVENTS.MEMBER_LIST_FILTERS_APPLIED, params);
  }

  function onViewTypeClicked(user: IAnalyticsUserInfo | null, option: string) {
    const params = {
      option,
      user,
    };
    captureEvent(MEMBER_ANALYTICS_EVENTS.MEMBER_LIST_VIEW_TYPE_CLICKED, params);
  }

  function onSearchClicked(searchValue: string, user: IAnalyticsUserInfo | null) {
    const params = {
      searchValue,
      user,
    };
    captureEvent(MEMBER_ANALYTICS_EVENTS.MEMBER_LIST_SEARCH_CLICKED, params);
  }

  function onSorByClicked(user: IAnalyticsUserInfo | null, option: string) {
    const params = {
      option,
      user,
    };
    captureEvent(MEMBER_ANALYTICS_EVENTS.MEMBER_LIST_SORT_CLICKED, params);
  }

  function onMemberRoleFilterSelectAllClicked(user: IAnalyticsUserInfo | null) {
    const params = {
      page: 'Members',
      filterName: 'Roles',
      user,
    };
    captureEvent(MEMBER_ANALYTICS_EVENTS.MEMBER_ROLE_FILTER_SELECT_ALL, params);
  }

  function onMemberRoleFilterSearchError(user: IAnalyticsUserInfo | null, searchQuery: string, reason: any) {
    const params = {
      page: 'Members',
      filterName: 'Roles',
      user,
      searchText: searchQuery,
      reason,
    };
    captureEvent(MEMBER_ANALYTICS_EVENTS.MEMBER_ROLE_FILTER_SEARCH_ERROR, params);
  }

  function onMemberRoleFilterSearchCalled(user: IAnalyticsUserInfo | null, searchQuery: string) {
    const params = {
      page: 'Members',
      filterName: 'Roles',
      user,
      searchText: searchQuery,
    };
    captureEvent(MEMBER_ANALYTICS_EVENTS.MEMBER_ROLE_FILTER_SEARCH_CALLED, params);
  }

  function onFilterToggleClicked(page: string, option: string, value: boolean, user: IAnalyticsUserInfo | null) {
    const params = {
      page,
      user,
      option,
      value,
    };
    captureEvent(MEMBER_ANALYTICS_EVENTS.MEMBER_LIST_FILTER_TOGGLE_CLICKED, params);
  }

  function onTagSelected(page: string, title: string, user: IAnalyticsUserInfo | null, value: string) {
    const params = {
      page,
      title,
      user,
      value,
    };
    captureEvent(MEMBER_ANALYTICS_EVENTS.MEMBER_LIST_FILTER_TAG_SELECTED, params);
  }

  function onClearAllClicked(page: string, query: any, user: IAnalyticsUserInfo | null) {
    const params = {
      page,
      user,
      query,
    };
    captureEvent(MEMBER_ANALYTICS_EVENTS.MEMBER_LIST_FILTER_CLEAR_ALL_CLICKED, params);
  }

  function onShowFilterResultClicked(user: IAnalyticsUserInfo | null) {
    const params = {
      user,
    };
    captureEvent(MEMBER_ANALYTICS_EVENTS.MEMBER_LIST_VIEW_FILTER_RESULT_CLICKED, params);
  }

  function onFilterCloseClicked(user: IAnalyticsUserInfo | null) {
    const params = {
      user,
    };
    captureEvent(MEMBER_ANALYTICS_EVENTS.MEMBER_LIST_CLOSE_FILTER_PANEL_CLICKED, params);
  }

  function onMemberEditBySelf(user: IAnalyticsUserInfo | null, member: IAnalyticsMemberInfo | null,) {
    const params = {
      user,
      ...member
    };
    captureEvent(MEMBER_ANALYTICS_EVENTS.MEMBER_DETAIL_EDIT_BY_SELF, params);
  }

  function onMemberEditByAdmin(user: IAnalyticsUserInfo | null, member: IAnalyticsMemberInfo | null,) {
    const params = {
      user,
      ...member
    };
    captureEvent(MEMBER_ANALYTICS_EVENTS.MEMBER_DETAIL_EDIT_BY_ADMIN, params);
  }

  
  function onMemberDetailsBioReadMoreClicked(member: IAnalyticsMemberInfo | null,) {
    const params = {
      ...member
    };
    captureEvent(MEMBER_ANALYTICS_EVENTS.MEMBER_DETAIL_BIO_READ_MORE_CLICKED, params);
  }

  
  function onMemberDetailsBioReadLessClicked(member: IAnalyticsMemberInfo | null,) {
    const params = {
      ...member
    };
    captureEvent(MEMBER_ANALYTICS_EVENTS.MEMBER_DETAIL_BIO_READ_LESS_CLICKED, params);
  }

  function onMemberDetailsBioEditClicked(member: IAnalyticsMemberInfo | null,user: IAnalyticsUserInfo | null) {
    const params = {
      user,
      ...member
    };
    captureEvent(MEMBER_ANALYTICS_EVENTS.MEMBER_DETAIL_BIO_EDIT_CLICKED, params);
  }

  function onMemberDetailsBioEditCancelClicked(member: IAnalyticsMemberInfo | null,user: IAnalyticsUserInfo | null) {
    const params = {
      user,
      ...member
    };
    captureEvent(MEMBER_ANALYTICS_EVENTS.MEMBER_DETAIL_BIO_EDIT_CANCEL_CLICKED, params);
  }

  function onMemberDetailsBioEditSaveClicked(member: IAnalyticsMemberInfo | null,user: IAnalyticsUserInfo | null) {
    const params = {
      user,
      ...member
    };
    captureEvent(MEMBER_ANALYTICS_EVENTS.MEMBER_DETAIL_BIO_EDIT_SAVE_CLICKED, params);
  }

  function recordBioSave(type: string,member: IAnalyticsMemberInfo | null, user: IAnalyticsUserInfo | null, payload?: any){
    const params = {
      type,
      user,
      member,
      ...payload,
    };
    captureEvent(MEMBER_ANALYTICS_EVENTS.MEMBER_DETAIL_BIO_EDIT_RECORD_SAVE, params);
  }

  function onClickSeeMoreIrlContribution(user: IAnalyticsUserInfo | null){
    const params = {
      user,
    };
    captureEvent(MEMBER_ANALYTICS_EVENTS.ON_CLICK_SEE_MORE_BUTTON_IRL_CONTRIBUTIONS, params);
  }

  function onClickEventIrlContribution(user: IAnalyticsUserInfo | null){
    const params = {
      user,
    };
    captureEvent(MEMBER_ANALYTICS_EVENTS.MEMBER_DETAILS_ON_CLICK_IRL_CONTRIBUTIONS, params);
  }

  return {
    onOfficeHourClicked,
    onProjectContributionEditClicked,
    onProjectContributionAddlicked,
    onGithubSeeAllClicked,
    onGithubProjectItemClicked,
    onEditProfileClicked,
    onSocialProfileLinkClicked,
    onLearnMoreClicked,
    onTeamsSeeAllClicked,
    onTeamClicked,
    onSeeAllProjectContributionsClicked,
    onProjectClicked,
    onUpdateGitHubHandle,
    onMemberCardClicked,
    onMemberListFiltersApplied,
    onViewTypeClicked,
    onSearchClicked,
    onSorByClicked,
    onMemberRoleFilterSelectAllClicked,
    onMemberRoleFilterSearchError,
    onMemberRoleFilterSearchCalled,
    onFilterToggleClicked,
    onTagSelected,
    onClearAllClicked,
    onShowFilterResultClicked,
    onFilterCloseClicked,
    onMemberEditBySelf,
    onMemberEditByAdmin,
    onMemberDetailsBioReadMoreClicked,
    onMemberDetailsBioReadLessClicked,
    onMemberDetailsBioEditClicked,
    onMemberDetailsBioEditSaveClicked,
    onMemberDetailsBioEditCancelClicked,
    recordBioSave,
    onClickSeeMoreIrlContribution,
    onClickEventIrlContribution,
  };
};
