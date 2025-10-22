import { MEMBER_ANALYTICS_EVENTS } from '@/utils/constants';
import { getUserInfo } from '@/utils/third-party.helper';
import { usePostHog } from 'posthog-js/react';

export const useModalAnalytics = () => {
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

  function onAddExperienceClicked(user: any | null, member: any | null) {
    const params = {
      user,
      ...member,
    };
    captureEvent(MEMBER_ANALYTICS_EVENTS.MEMBER_DETAIL_ADD_EXPERIENCE_CLICKED, params);
  }

  function onSeeAllExperienceClicked(user: any | null, member: any | null) {
    const params = {
      user,
      ...member,
    };
    captureEvent(MEMBER_ANALYTICS_EVENTS.MEMBER_DETAIL_SEE_ALL_EXPERIENCE_CLICKED, params);
  }

  function onEditExperienceClicked(user: any | null, member: any | null) {
    const params = {
      user,
      ...member,
    };
    captureEvent(MEMBER_ANALYTICS_EVENTS.MEMBER_DETAIL_EDIT_EXPERIENCE_CLICKED, params);
  }

  return {
    onAddExperienceClicked,
    onSeeAllExperienceClicked,
    onEditExperienceClicked,
  };
};
