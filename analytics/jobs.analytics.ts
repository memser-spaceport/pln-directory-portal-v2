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

  const onJobAlertCtaViewed = (args: {
    cta_variant: 'banner' | 'empty';
    filter_state: FilterStateParam;
    result_count: number;
  }) => {
    captureEvent(JOBS_ANALYTICS.ON_JOB_ALERT_CTA_VIEWED, { ...args });
  };

  const onJobAlertCtaClicked = (args: { cta_variant: 'banner' | 'empty'; filter_state: FilterStateParam }) => {
    captureEvent(JOBS_ANALYTICS.ON_JOB_ALERT_CTA_CLICKED, { ...args });
  };

  const onJobAlertSet = (args: {
    alert_id: string;
    filter_state: FilterStateParam;
    auth_required: boolean;
  }) => {
    captureEvent(JOBS_ANALYTICS.ON_JOB_ALERT_SET, { ...args });
  };

  const onJobAlertUpdated = (args: { alert_id: string; filter_state: FilterStateParam }) => {
    captureEvent(JOBS_ANALYTICS.ON_JOB_ALERT_UPDATED, { ...args });
  };

  const onJobAlertConflict = (args: { existing_alert_id: string | null }) => {
    captureEvent(JOBS_ANALYTICS.ON_JOB_ALERT_CONFLICT, { ...args });
  };

  const onJobAlertRenamed = (args: { alert_id: string }) => {
    captureEvent(JOBS_ANALYTICS.ON_JOB_ALERT_RENAMED, { ...args });
  };

  const onJobAlertDeleted = (args: { alert_id: string }) => {
    captureEvent(JOBS_ANALYTICS.ON_JOB_ALERT_DELETED, { ...args });
  };

  const onJobAlertEmailLinkClicked = (args: {
    alert_id: string;
    job_id: string;
    team_id?: string;
    position_in_email?: number;
    utm_source: string;
    utm_code?: string;
  }) => {
    captureEvent(JOBS_ANALYTICS.ON_JOB_ALERT_EMAIL_LINK_CLICKED, { ...args });
  };

  return {
    onJobsPageViewed,
    onJobsFiltersApplied,
    onJobsFiltersCleared,
    onJobsSearched,
    onJobsSortChanged,
    onJobClicked,
    onJobAlertCtaViewed,
    onJobAlertCtaClicked,
    onJobAlertSet,
    onJobAlertUpdated,
    onJobAlertConflict,
    onJobAlertRenamed,
    onJobAlertDeleted,
    onJobAlertEmailLinkClicked,
  };
};
