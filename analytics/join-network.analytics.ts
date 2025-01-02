import { IAnalyticsUserInfo } from '@/types/shared.types';
import { JOIN_NETWORK_ANALYTICS_EVENTS } from '@/utils/constants';
import { getUserInfo } from '@/utils/third-party.helper';
import { usePostHog } from 'posthog-js/react';

export const useJoinNetworkAnalytics = () => {
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

  function recordMemberJoinNetworkNextClick(currentStep: string, type: string) {
    const params = {
      itemName: currentStep,
      type
    };
    captureEvent(JOIN_NETWORK_ANALYTICS_EVENTS.MEMBER_JOIN_NETWORK_NEXT_CLICK, params);
  }

  function recordMemberJoinNetworkBackClick(currentStep: string) {
    const params = {
      currentStep
    };
    captureEvent(JOIN_NETWORK_ANALYTICS_EVENTS.MEMBER_JOIN_NETWORK_BACK_CLICK, params);
  }

  function recordMemberJoinNetworkSave(type: string, payload?: any){
    const params = {
      type,
      ...payload,
    };
    captureEvent(JOIN_NETWORK_ANALYTICS_EVENTS.MEMBER_JOIN_NETWORK_SAVE, params);
  }

  function recordTeamJoinNetworkNextClick(currentStep: string, type: string) {
    const params = {
      name: currentStep,
      type
    };
    captureEvent(JOIN_NETWORK_ANALYTICS_EVENTS.TEAM_JOIN_NETWORK_NEXT_CLICK, params);
  }

  function recordTeamJoinNetworkBackClick(currentStep: string) {
    const params = {
      currentStep
    };
    captureEvent(JOIN_NETWORK_ANALYTICS_EVENTS.TEAM_JOIN_NETWORK_BACK_CLICK, params);
  }

  function recordTeamJoinNetworkSave(type: string, payload?: any){
    const params = {
      type,
      ...payload,
    };
    captureEvent(JOIN_NETWORK_ANALYTICS_EVENTS.TEAM_JOIN_NETWORK_SAVE, params);
  }
  
  return {
    recordMemberJoinNetworkNextClick,
    recordMemberJoinNetworkBackClick,
    recordMemberJoinNetworkSave,
    recordTeamJoinNetworkNextClick,
    recordTeamJoinNetworkBackClick,
    recordTeamJoinNetworkSave
  };
};
