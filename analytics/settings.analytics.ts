import { IAnalyticsUserInfo } from '@/types/shared.types';
import { SETTINGS_ANALYTICS_EVENTS } from '@/utils/constants';
import { getUserInfo } from '@/utils/third-party.helper';
import { usePostHog } from 'posthog-js/react';

export const useSettingsAnalytics = () => {
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

  function recordSettingsSideMenuClick(menuName: string, url: string, user: IAnalyticsUserInfo | null) {
    const params = {
      menuName,
      url,
      user,
    };
    captureEvent(SETTINGS_ANALYTICS_EVENTS.SETTINGS_SIDE_MENU_CLICK, params);
  }

  function recordManageTeamsTeamChange(team: any , user: IAnalyticsUserInfo | null){
    const params = {
      ...team,
      user,
    };
    captureEvent(SETTINGS_ANALYTICS_EVENTS.SETTINGS_MANAGE_TEAMS_TEAM_CHANGE, params);
  }


  function recordManageTeamSave(type: string, user: IAnalyticsUserInfo | null, payload?: any){
    const params = {
      type,
      user,
      ...payload,
    };
    captureEvent(SETTINGS_ANALYTICS_EVENTS.SETTINGS_MANAGE_TEAMS_SAVE, params);
  }

  function recordManageMembersMemberChange(member: any , user: IAnalyticsUserInfo | null){
    const params = {
      ...member,
      user,
    };
    captureEvent(SETTINGS_ANALYTICS_EVENTS.SETTINGS_MANAGE_MEMBERS_MEMBER_CHANGE, params);
  }

  function recordManageMemberSave(type: string, user: IAnalyticsUserInfo | null, payload?: any){
    const params = {
      type,
      user,
      ...payload,
    };
    captureEvent(SETTINGS_ANALYTICS_EVENTS.SETTINGS_MANAGE_MEMBERS_SAVE, params);
  }

  function recordMemberProfileSave(type: string, user: IAnalyticsUserInfo | null, payload?: any){
    const params = {
      type,
      user,
      ...payload,
    };
    captureEvent(SETTINGS_ANALYTICS_EVENTS.SETTINGS_MEMBER_PROFILE_SAVE, params);
  }

  function recordMemberEmailAdminEditClick(email: string, user: IAnalyticsUserInfo | null){
    const params = {
      email,
      user
    };
    captureEvent(SETTINGS_ANALYTICS_EVENTS.SETTINGS_MEMBER_EMAIL_ADMIN_EDIT_CLICK, params);
  }

  function recordMemberEmailAdminEditCancel(email: string, user: IAnalyticsUserInfo | null){
    const params = {
      email,
      user
    };
    captureEvent(SETTINGS_ANALYTICS_EVENTS.SETTINGS_MEMBER_EMAIL_ADMIN_EDIT_CANCEL, params);
  }

  function recordMemberEmailAdminEditSuccess(user: IAnalyticsUserInfo | null){
    const params = {
      user
    };
    captureEvent(SETTINGS_ANALYTICS_EVENTS.SETTINGS_MEMBER_EMAIL_ADMIN_EDIT_SUCCESS, params);
  }

  function recordMemberPreferenceChange(type: string, user: IAnalyticsUserInfo | null, payload?:any) {
    const params = {
      type,
      user,
      ...payload
    };
    captureEvent(SETTINGS_ANALYTICS_EVENTS.SETTINGS_USER_PREFERENCES, params);
  }

  function recordMemberPreferenceReset(user: IAnalyticsUserInfo | null) {
    const params = {
      user,
      name: "reset",
      value: true
    };
    captureEvent(SETTINGS_ANALYTICS_EVENTS.SETTINGS_USER_PREFERENCES_RESET, params);
  }

  function recordMemberProfileFormEdit(user: IAnalyticsUserInfo | null, tabName: string){
    const params = {
      user,
      name: tabName
    };
    captureEvent(SETTINGS_ANALYTICS_EVENTS.SETTINGS_MEMBER_PROFILE_EDIT_FORM, params);
  }


  function recordUserProfileFormEdit(user: IAnalyticsUserInfo | null, tabName: string){
    const params = {
      user,
      name: tabName
    };
    captureEvent(SETTINGS_ANALYTICS_EVENTS.SETTINGS_USER_PROFILE_EDIT_FORM, params);
  }

  function recordTeamProfileFormEdit(user: IAnalyticsUserInfo | null, tabName: string){
    const params = {
      user,
      itemName: tabName
    };
    captureEvent(SETTINGS_ANALYTICS_EVENTS.SETTINGS_TEAM_PROFILE_EDIT_FORM, params);
  }

  function recordMemberProjectContributionAdd(type: string, user:IAnalyticsUserInfo|null) {
    const params = {
      user,
      type
    };
    captureEvent(SETTINGS_ANALYTICS_EVENTS.PR_CONRTIBUTIONS_LIST_ITEM_ADD, params);
  }

  function recordMemberProjectContributionDelete(type: string, user:IAnalyticsUserInfo|null) {
    const params = {
      user,
      type
    };
    captureEvent(SETTINGS_ANALYTICS_EVENTS.PR_CONRTIBUTIONS_LIST_ITEM_DELETE, params);
  }

  function recordMemberProjectContributionAddProject(type: string, user:IAnalyticsUserInfo|null) {
    const params = {
      user,
      type
    };
    captureEvent(SETTINGS_ANALYTICS_EVENTS.PR_CONRTIBUTIONS_LIST_ITEM_ADDPROJECT, params);
  }
  
  return {
    recordSettingsSideMenuClick,
    recordManageTeamsTeamChange,
    recordManageTeamSave,
    recordManageMembersMemberChange,
    recordManageMemberSave,
    recordMemberProfileSave,
    recordMemberEmailAdminEditClick,
    recordMemberEmailAdminEditCancel,
    recordMemberPreferenceChange,
    recordMemberPreferenceReset,
    recordMemberProfileFormEdit,
    recordUserProfileFormEdit,
    recordTeamProfileFormEdit,
    recordMemberProjectContributionAdd,
    recordMemberProjectContributionDelete,
    recordMemberProjectContributionAddProject
  };
};
