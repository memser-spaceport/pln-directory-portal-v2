import { JOBS_ANALYTICS } from '@/utils/constants';
import { useCurrentUserStore } from '@/services/auth/store';
import { usePostHog } from 'posthog-js/react';
import type { BoardViewerState } from '@/services/jobs/job-board-viewer';

type FilterStateParam = Record<string, unknown>;

export type JobReferShareNetwork = 'linkedin' | 'x' | 'copy_link';

/**
 * Which surface a role was acted on from. The same role card now renders on the job
 * board and on a team profile, and without this the two are indistinguishable in
 * PostHog — which would make it impossible to tell whether the team-profile section
 * drives any clicks or referrals at all.
 *
 * Required, never defaulted: a default would silently mislabel the next surface that
 * forgets to pass it.
 */
export type JobSurface = 'job-board' | 'team-profile';

export type JobReferBaseParams = {
  job_id: string;
  team_id: string;
  team_name: string;
  role_title: string;
  role_category: string | null;
  seniority: string | null;
  source: JobSurface;
};

/**
 * Which control started an apply-funnel step: a role row, the board banner, the
 * header — or `resume`, which is the flow picking itself back up after the
 * Privy round trip rather than anything the person pressed. Kept distinct so
 * apply-click counts stay a count of actual clicks.
 */
export type JobApplyTrigger = 'row' | 'banner' | 'header' | 'resume';

/**
 * Apply-funnel payloads carry ONLY what's listed here: uids, viewer state,
 * source/trigger, and a failure category. Never form field values (email,
 * name, linkedin), never the jobSearchStatus value (PL-Team-only — a PostHog
 * dashboard is a wider audience than that), never cover-letter text.
 * `captureEvent` already stamps the logged-in user's identity; add nothing.
 *
 * `job_id`/`team_id` are null for flows started without a role (banner/header
 * sign-up, generic drawer edits).
 */
export type JobApplyBaseParams = {
  job_id: string | null;
  team_id: string | null;
  viewer_state: BoardViewerState;
  source: JobSurface;
};

export const useJobsAnalytics = () => {
  const postHog = usePostHog();

  const captureEvent = (eventName: string, eventParams: Record<string, unknown> = {}) => {
    try {
      if (!postHog?.capture) return;
      const userInfo = useCurrentUserStore.getState().currentUser;
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
    source: JobSurface;
    /** Board-only: a team profile has no filters, so it sends nothing rather than `{}`. */
    filter_state?: FilterStateParam;
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

  const onJobAlertSet = (args: { alert_id: string; filter_state: FilterStateParam; auth_required: boolean }) => {
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

  const onJobReferClicked = (args: JobReferBaseParams & { auth_required: boolean }) => {
    captureEvent(JOBS_ANALYTICS.ON_JOB_REFER_CLICKED, { ...args });
  };

  const onJobReferModalOpened = (args: JobReferBaseParams) => {
    captureEvent(JOBS_ANALYTICS.ON_JOB_REFER_MODAL_OPENED, { ...args });
  };

  const onJobReferModalCancelled = (
    args: JobReferBaseParams & {
      had_referee: boolean;
      recipient_count: number;
      note_was_edited: boolean;
    },
  ) => {
    captureEvent(JOBS_ANALYTICS.ON_JOB_REFER_MODAL_CANCELLED, { ...args });
  };

  const onJobReferRefereeSelected = (args: JobReferBaseParams & { referred_member_uid: string }) => {
    captureEvent(JOBS_ANALYTICS.ON_JOB_REFER_REFEREE_SELECTED, { ...args });
  };

  const onJobReferRecipientsChanged = (
    args: JobReferBaseParams & { recipient_count: number; has_external_email: boolean },
  ) => {
    captureEvent(JOBS_ANALYTICS.ON_JOB_REFER_RECIPIENTS_CHANGED, { ...args });
  };

  const onJobReferNoteEdited = (args: JobReferBaseParams & { referred_member_uid: string }) => {
    captureEvent(JOBS_ANALYTICS.ON_JOB_REFER_NOTE_EDITED, { ...args });
  };

  const onJobReferNoteReset = (args: JobReferBaseParams & { referred_member_uid: string }) => {
    captureEvent(JOBS_ANALYTICS.ON_JOB_REFER_NOTE_RESET, { ...args });
  };

  const onJobReferSubmitted = (
    args: JobReferBaseParams & {
      referred_member_uid: string;
      recipient_count: number;
      has_external_email: boolean;
      note_was_edited: boolean;
    },
  ) => {
    captureEvent(JOBS_ANALYTICS.ON_JOB_REFER_SUBMITTED, { ...args });
  };

  const onJobReferSucceeded = (
    args: JobReferBaseParams & {
      referred_member_uid: string;
      recipient_count: number;
      has_external_email: boolean;
      note_was_edited: boolean;
      referral_uid?: string;
    },
  ) => {
    captureEvent(JOBS_ANALYTICS.ON_JOB_REFER_SUCCEEDED, { ...args });
  };

  const onJobReferFailed = (
    args: JobReferBaseParams & {
      referred_member_uid: string;
      recipient_count: number;
      has_external_email: boolean;
      note_was_edited: boolean;
      error_type?: string;
    },
  ) => {
    captureEvent(JOBS_ANALYTICS.ON_JOB_REFER_FAILED, { ...args });
  };

  const onJobReferShareMenuOpened = (args: JobReferBaseParams) => {
    captureEvent(JOBS_ANALYTICS.ON_JOB_REFER_SHARE_MENU_OPENED, { ...args });
  };

  const onJobReferShared = (args: JobReferBaseParams & { network: JobReferShareNetwork }) => {
    captureEvent(JOBS_ANALYTICS.ON_JOB_REFER_SHARED, { ...args });
  };

  const onJobApplyClicked = (args: JobApplyBaseParams & { trigger: JobApplyTrigger }) => {
    captureEvent(JOBS_ANALYTICS.ON_JOB_APPLY_CLICKED, { ...args });
  };

  const onJobApplySignUpSubmitted = (args: JobApplyBaseParams & { trigger: JobApplyTrigger }) => {
    captureEvent(JOBS_ANALYTICS.ON_JOB_APPLY_SIGNUP_SUBMITTED, { ...args });
  };

  const onJobApplySignUpFailed = (args: JobApplyBaseParams & { failure_category: 'duplicate' | 'request-failed' }) => {
    captureEvent(JOBS_ANALYTICS.ON_JOB_APPLY_SIGNUP_FAILED, { ...args });
  };

  const onJobApplyDrawerOpened = (args: JobApplyBaseParams) => {
    captureEvent(JOBS_ANALYTICS.ON_JOB_APPLY_DRAWER_OPENED, { ...args });
  };

  const onJobApplyDrawerSaved = (args: JobApplyBaseParams & { profile_complete: boolean }) => {
    captureEvent(JOBS_ANALYTICS.ON_JOB_APPLY_DRAWER_SAVED, { ...args });
  };

  const onJobApplySubmitted = (args: JobApplyBaseParams & { cover_letter_length: number }) => {
    captureEvent(JOBS_ANALYTICS.ON_JOB_APPLY_SUBMITTED, { ...args });
  };

  const onJobApplyFailed = (args: JobApplyBaseParams & { failure_category: 'already-applied' | 'request-failed' }) => {
    captureEvent(JOBS_ANALYTICS.ON_JOB_APPLY_FAILED, { ...args });
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
    onJobReferClicked,
    onJobReferModalOpened,
    onJobReferModalCancelled,
    onJobReferRefereeSelected,
    onJobReferRecipientsChanged,
    onJobReferNoteEdited,
    onJobReferNoteReset,
    onJobReferSubmitted,
    onJobReferSucceeded,
    onJobReferFailed,
    onJobReferShareMenuOpened,
    onJobReferShared,
    onJobApplyClicked,
    onJobApplySignUpSubmitted,
    onJobApplySignUpFailed,
    onJobApplyDrawerOpened,
    onJobApplyDrawerSaved,
    onJobApplySubmitted,
    onJobApplyFailed,
  };
};
