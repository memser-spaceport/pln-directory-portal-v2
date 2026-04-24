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

  const onJobsPageViewed = (args: { result_count: number; filter_state: FilterStateParam }) => {
    captureEvent(JOBS_ANALYTICS.ON_JOBS_PAGE_VIEWED, { ...args });
  };

  const onJobsFiltersApplied = (args: {
    filter_type: string;
    filter_value: unknown;
    result_count: number;
    filter_state: FilterStateParam;
  }) => {
    captureEvent(JOBS_ANALYTICS.ON_JOBS_FILTERS_APPLIED, { ...args });
  };

  const onJobsFiltersCleared = (args: { result_count: number; filter_state: FilterStateParam }) => {
    captureEvent(JOBS_ANALYTICS.ON_JOBS_FILTERS_CLEARED, { ...args });
  };

  const onJobsSearched = (args: { search_query: string; result_count: number; filter_state: FilterStateParam }) => {
    captureEvent(JOBS_ANALYTICS.ON_JOBS_SEARCHED, { ...args });
  };

  const onJobsSortChanged = (args: { sort_key: string; result_count: number }) => {
    captureEvent(JOBS_ANALYTICS.ON_JOBS_SORT_CHANGED, { ...args });
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
    captureEvent(JOBS_ANALYTICS.ON_JOB_CLICKED, { ...args });
  };

  return { onJobsPageViewed, onJobsFiltersApplied, onJobsFiltersCleared, onJobsSearched, onJobsSortChanged, onJobClicked };
};
