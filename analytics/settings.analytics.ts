import { IAnalyticsUserInfo } from '@/types/shared.types';
import { SETTINGS_ANALYTICS_EVENTS } from '@/utils/constants';
import { usePostHog } from 'posthog-js/react';

export const useSettingsAnalytics = () => {
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

  function recordMemberEmailAdminEdit(type: string, oldEmail: string, user: IAnalyticsUserInfo | null){
    const params = {
      type,
      oldEmail,
      user
    };
    captureEvent(SETTINGS_ANALYTICS_EVENTS.SETTINGS_MEMBER_EMAIL_ADMIN_EDIT, params);
  }

  function recordMemberPreferenceChange(type: string, user: IAnalyticsUserInfo | null, payload?:any) {
    const params = {
      type,
      user,
      ...payload
    };
    captureEvent(SETTINGS_ANALYTICS_EVENTS.SETTINGS_MEMBER_PREFERENCE_CHANGE, params);
  }
  
  return {
    recordSettingsSideMenuClick,
    recordManageTeamsTeamChange,
    recordManageTeamSave,
    recordManageMembersMemberChange,
    recordManageMemberSave,
    recordMemberProfileSave,
    recordMemberEmailAdminEdit,
    recordMemberPreferenceChange
  };
};
