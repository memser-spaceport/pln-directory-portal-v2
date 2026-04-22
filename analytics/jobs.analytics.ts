import { JOBS_ANALYTICS } from '@/utils/constants';
import { getUserInfo } from '@/utils/third-party.helper';
import { usePostHog } from 'posthog-js/react';

type FilterStateParam = Record<string, unknown>;

export const useJobsAnalytics = () => {
  const postHog = usePostHog();

  const captureEvent = (eventName: string, eventParams: Record<string, unknown> = {}) => {
    try {
      if (!postHog?.capture) return;
      const userInfo = getUserInfo();
      const loggedInUserUid = userInfo?.uid;
      const loggedInUserEmail = userInfo?.email;
      const loggedInUserName = userInfo?.name;
      const is_authenticated = Boolean(loggedInUserUid);
      postHog.capture(eventName, {
        ...eventParams,
        is_authenticated,
        loggedInUserUid,
        loggedInUserEmail,
        loggedInUserName,
      });
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(err);
    }
  };

  const onJobsViewed = (args: { result_count: number; filter_state: FilterStateParam }) => {
    captureEvent(JOBS_ANALYTICS.JOBS_VIEWED, { ...args });
  };

  const onJobsFiltered = (args: {
    filter_type: string;
    filter_value: unknown;
    result_count: number;
    filter_state: FilterStateParam;
  }) => {
    captureEvent(JOBS_ANALYTICS.JOBS_FILTERED, { ...args });
  };

  const onJobsSorted = (args: { sort_key: string; result_count: number }) => {
    captureEvent(JOBS_ANALYTICS.JOBS_SORTED, { ...args });
  };

  const onJobClicked = (args: {
    job_id: string;
    team_id: string;
    team_name: string;
    role_title: string;
    role_category: string | null;
    seniority: string | null;
    focus_areas: string[];
    position_in_list: number;
    filter_state: FilterStateParam;
  }) => {
    captureEvent(JOBS_ANALYTICS.JOB_CLICKED, { ...args });
  };

  return { onJobsViewed, onJobsFiltered, onJobsSorted, onJobClicked };
};
