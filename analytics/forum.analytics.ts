import { FORUM_ANALYTICS_EVENTS } from '@/utils/constants';
import { getUserInfo } from '@/utils/third-party.helper';
import { usePostHog } from 'posthog-js/react';

export const useForumAnalytics = () => {
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

  function onForumTopicClicked(params: { topicId?: string | number; topicName?: string }) {
    captureEvent(FORUM_ANALYTICS_EVENTS.TOPIC_CLICKED, params);
  }

  function onForumSortSelected(params: { sortBy?: string }) {
    captureEvent(FORUM_ANALYTICS_EVENTS.SORT_SELECTED, params);
  }

  function onCreatePostClicked() {
    captureEvent(FORUM_ANALYTICS_EVENTS.CREATE_POST_CLICKED, {});
  }

  return {
    onForumTopicClicked,
    onForumSortSelected,
    onCreatePostClicked,
  };
};
