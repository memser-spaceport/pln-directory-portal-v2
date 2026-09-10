import { usePostHog } from 'posthog-js/react';
import { useCallback } from 'react';

import { AI_APPS_ANALYTICS } from '@/utils/constants';

export function useAiAppsAnalytics() {
  const posthog = usePostHog();

  const capture = useCallback(
    (event: string, props: Record<string, unknown> = {}) => {
      posthog?.capture(event, props);
    },
    [posthog],
  );

  return {
    onPageViewed: () => capture(AI_APPS_ANALYTICS.PAGE_VIEWED, { path: '/pl-infra/ai-apps' }),
    onCreateModalOpened: () => capture(AI_APPS_ANALYTICS.CREATE_MODAL_OPENED),
    onCreateModalClosed: () => capture(AI_APPS_ANALYTICS.CREATE_MODAL_CLOSED),
    onStarterKitDownloaded: () => capture(AI_APPS_ANALYTICS.STARTER_KIT_DOWNLOADED),
    onStarterKitDownloadFailed: () => capture(AI_APPS_ANALYTICS.STARTER_KIT_DOWNLOAD_FAILED),
    onCardClicked: (appUid: string, appName: string) => capture(AI_APPS_ANALYTICS.CARD_CLICKED, { appUid, appName }),
    onAuthorClicked: (appUid: string, memberUid: string, memberName: string) =>
      capture(AI_APPS_ANALYTICS.AUTHOR_CLICKED, { appUid, memberUid, memberName }),
    onDetailPageViewed: (appUid: string, appName: string, deepLinkPath: string | null) =>
      capture(AI_APPS_ANALYTICS.DETAIL_PAGE_VIEWED, {
        appUid,
        appName,
        path: `/pl-infra/ai-apps/${appUid}`,
        // Set only when the page was opened via a ?path= deep link into an app subpage.
        deepLinkPath: deepLinkPath ?? undefined,
      }),
    onOpenInNewTabClicked: (appUid: string, appName: string, appUrl: string) =>
      capture(AI_APPS_ANALYTICS.OPEN_IN_NEW_TAB_CLICKED, { appUid, appName, appUrl }),
    onConnectPageViewed: (params: { sessionId: string; view: string; clientName?: string | null }) =>
      capture(AI_APPS_ANALYTICS.CONNECT_PAGE_VIEWED, params),
    onConnectSignInClicked: (params: { sessionId: string; clientName?: string | null }) =>
      capture(AI_APPS_ANALYTICS.CONNECT_SIGN_IN_CLICKED, params),
    onConnectApproved: (params: { sessionId: string; clientName?: string | null }) =>
      capture(AI_APPS_ANALYTICS.CONNECT_APPROVED, params),
    onConnectDenied: (params: { sessionId: string }) => capture(AI_APPS_ANALYTICS.CONNECT_DENIED, params),
    onConnectExpired: (params: { sessionId: string }) => capture(AI_APPS_ANALYTICS.CONNECT_EXPIRED, params),
    onConnectError: (params: { sessionId: string }) => capture(AI_APPS_ANALYTICS.CONNECT_ERROR, params),
    onAccessDenied: (path: string) => capture(AI_APPS_ANALYTICS.ACCESS_DENIED, { path }),
    onIframeLoaded: (appUid: string, appName: string) => capture(AI_APPS_ANALYTICS.IFRAME_LOADED, { appUid, appName }),
    onIframeLoadFailed: (appUid: string, appName: string) =>
      capture(AI_APPS_ANALYTICS.IFRAME_LOAD_FAILED, { appUid, appName }),
    onFeedbackSubmitted: (appUid: string, appName: string) =>
      capture(AI_APPS_ANALYTICS.FEEDBACK_SUBMITTED, { appUid, appName }),
    onFeedbackSubmitFailed: (appUid: string) => capture(AI_APPS_ANALYTICS.FEEDBACK_SUBMIT_FAILED, { appUid }),
    onFeedbackReviewViewed: () => capture(AI_APPS_ANALYTICS.FEEDBACK_REVIEW_VIEWED),
    onFeedbackTabFiltered: (appName: string) => capture(AI_APPS_ANALYTICS.FEEDBACK_TAB_FILTERED, { appName }),
    onFeedbackExported: (rowCount: number) => capture(AI_APPS_ANALYTICS.FEEDBACK_EXPORTED, { rowCount }),
    onFeedbackStatusChanged: (params: { appUid: string; from: string; to: string }) =>
      capture(AI_APPS_ANALYTICS.FEEDBACK_STATUS_CHANGED, params),
    onFeedbackDialogOpened: (params: { appUid?: string; appName?: string } = {}) =>
      capture(AI_APPS_ANALYTICS.FEEDBACK_DIALOG_OPENED, params),
    onViewFeedbackClicked: (params: { feedbackCount: number }) =>
      capture(AI_APPS_ANALYTICS.VIEW_FEEDBACK_CLICKED, params),
    onSecretsPanelOpened: (params: { appUid: string; isDraft: boolean }) =>
      capture(AI_APPS_ANALYTICS.SECRETS_PANEL_OPENED, params),
    onSecretsDeployClicked: (params: {
      appUid: string;
      isDraft: boolean;
      varsRequiredCount: number;
      varsProvidedCount: number;
    }) => capture(AI_APPS_ANALYTICS.SECRETS_DEPLOY_CLICKED, params),
    onSecretsDeploySucceeded: (params: { appUid: string; isDraft: boolean }) =>
      capture(AI_APPS_ANALYTICS.SECRETS_DEPLOY_SUCCEEDED, params),
    onSecretsDeployFailed: (params: { appUid: string; isDraft: boolean }) =>
      capture(AI_APPS_ANALYTICS.SECRETS_DEPLOY_FAILED, params),
    onDraftSetupViewed: (params: { appUid: string; appName: string }) =>
      capture(AI_APPS_ANALYTICS.DRAFT_SETUP_VIEWED, params),
    onManageMenuOpened: (appUid: string, appName: string) =>
      capture(AI_APPS_ANALYTICS.MANAGE_MENU_OPENED, { appUid, appName }),
    onEditDetailsOpened: (appUid: string, appName: string) =>
      capture(AI_APPS_ANALYTICS.EDIT_DETAILS_OPENED, { appUid, appName }),
    onEditDetailsSaved: (appUid: string) => capture(AI_APPS_ANALYTICS.EDIT_DETAILS_SAVED, { appUid }),
    onEditDetailsFailed: (appUid: string) => capture(AI_APPS_ANALYTICS.EDIT_DETAILS_FAILED, { appUid }),
    onDeploymentSettingsOpened: (params: { appUid: string; isDraft: boolean }) =>
      capture(AI_APPS_ANALYTICS.DEPLOYMENT_SETTINGS_OPENED, params),
    // Logs events carry uids/streams/counts and closed unions ONLY — never log
    // message text, search queries, or failureReason/notes, which can contain
    // secrets and member PII. `variant` tracks which failure state drove the
    // open (absent for the plain menu path).
    onDeploymentLogsOpened: (params: {
      appUid: string;
      appName: string;
      source: 'menu' | 'failure-strip' | 'detail-banner' | 'detail-error-card';
      variant?: 'warning' | 'danger' | 'legacy';
    }) => capture(AI_APPS_ANALYTICS.DEPLOYMENT_LOGS_OPENED, params),
    onDeploymentLogsTabSwitched: (appUid: string, stream: 'build' | 'runtime') =>
      capture(AI_APPS_ANALYTICS.DEPLOYMENT_LOGS_TAB_SWITCHED, { appUid, stream }),
    onDeploymentLogsExported: (appUid: string, stream: 'build' | 'runtime', rowCount: number) =>
      capture(AI_APPS_ANALYTICS.DEPLOYMENT_LOGS_EXPORTED, { appUid, stream, rowCount }),
    onDeleteAppOpened: (appUid: string, appName: string) =>
      capture(AI_APPS_ANALYTICS.DELETE_APP_OPENED, { appUid, appName }),
    onDeleteAppCancelled: (appUid: string, appName: string) =>
      capture(AI_APPS_ANALYTICS.DELETE_APP_CANCELLED, { appUid, appName }),
    onDeleteAppConfirmed: (appUid: string, appName: string) =>
      capture(AI_APPS_ANALYTICS.DELETE_APP_CONFIRMED, { appUid, appName }),
    onDeleteAppFailed: (appUid: string) => capture(AI_APPS_ANALYTICS.DELETE_APP_FAILED, { appUid }),
    onAppDetailsOpened: (appUid: string, appName: string) =>
      capture(AI_APPS_ANALYTICS.APP_DETAILS_OPENED, { appUid, appName }),
    onPrdOpenInNewTabClicked: (appUid: string, appName: string) =>
      capture(AI_APPS_ANALYTICS.PRD_OPEN_IN_NEW_TAB_CLICKED, { appUid, appName }),
    onPrdPageViewed: (appUid: string, appName: string) =>
      capture(AI_APPS_ANALYTICS.PRD_PAGE_VIEWED, { appUid, appName }),
    // List controls. Only the query LENGTH is sent, never the text: an app
    // search box is free text a member typed, and the result count already
    // answers "did search work" without carrying whatever they looked for.
    onSearchApplied: (params: { queryLength: number; resultCount: number }) =>
      capture(AI_APPS_ANALYTICS.SEARCH_APPLIED, params),
    onCreatorFilterSelected: (params: { creatorCount: number; resultCount: number }) =>
      capture(AI_APPS_ANALYTICS.CREATOR_FILTER_SELECTED, params),
    onSortChanged: (params: { sort: string; source: 'masthead' | 'mobile'; resultCount: number }) =>
      capture(AI_APPS_ANALYTICS.SORT_CHANGED, params),
    onFiltersCleared: (params: { source: 'rail' | 'mobile' }) => capture(AI_APPS_ANALYTICS.FILTERS_CLEARED, params),
    onEmptyResultsShown: (params: { filterCount: number }) => capture(AI_APPS_ANALYTICS.EMPTY_RESULTS_SHOWN, params),
  };
}
