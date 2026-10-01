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
        // Set only when the page was opened at an app subpage (`/pl-infra/ai-apps/<uid>/<subpage>`).
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
    onFeedbackSubmitted: (params: {
      appUid: string;
      appName: string;
      screenshotCount: number;
      hasAnnotations: boolean;
      pinCount?: number;
    }) => capture(AI_APPS_ANALYTICS.FEEDBACK_SUBMITTED, params),
    onFeedbackSubmitFailed: (appUid: string) => capture(AI_APPS_ANALYTICS.FEEDBACK_SUBMIT_FAILED, { appUid }),
    onFeedbackReviewViewed: () => capture(AI_APPS_ANALYTICS.FEEDBACK_REVIEW_VIEWED),
    onFeedbackTabFiltered: (appName: string) => capture(AI_APPS_ANALYTICS.FEEDBACK_TAB_FILTERED, { appName }),
    onFeedbackExported: (rowCount: number, status: string) =>
      capture(AI_APPS_ANALYTICS.FEEDBACK_EXPORTED, { rowCount, status }),
    onFeedbackStatusFiltered: (status: string) => capture(AI_APPS_ANALYTICS.FEEDBACK_STATUS_FILTERED, { status }),
    onFeedbackShortcutUsed: (params: { action: 'open' | 'submit' | 'screenshot' }) =>
      capture(AI_APPS_ANALYTICS.FEEDBACK_SHORTCUT_USED, params),
    onFeedbackShortcutsHelpOpened: () => capture(AI_APPS_ANALYTICS.FEEDBACK_SHORTCUTS_HELP_OPENED),
    onFeedbackStatusChanged: (params: { appUid: string; from: string; to: string }) =>
      capture(AI_APPS_ANALYTICS.FEEDBACK_STATUS_CHANGED, params),
    onFeedbackDialogOpened: (params: { appUid?: string; appName?: string } = {}) =>
      capture(AI_APPS_ANALYTICS.FEEDBACK_DIALOG_OPENED, params),
    onFeedbackScreenshotClicked: () => capture(AI_APPS_ANALYTICS.FEEDBACK_SCREENSHOT_CLICKED),
    /* Element pins (bridge spike). `bridge_unavailable` fires when the feedback
       button falls back to screenshots because the app never said `ready` —
       its rate is the adoption signal for the starter-kit script. */
    onFeedbackPinsOpened: (params: { appUid: string }) => capture(AI_APPS_ANALYTICS.FEEDBACK_PINS_OPENED, params),
    onFeedbackPinAdded: (params: { appUid: string; hasComponent: boolean; pinCount: number }) =>
      capture(AI_APPS_ANALYTICS.FEEDBACK_PIN_ADDED, params),
    onFeedbackPinRemoved: (params: { appUid: string }) => capture(AI_APPS_ANALYTICS.FEEDBACK_PIN_REMOVED, params),
    onFeedbackReplySent: (params: { appUid: string; feedbackUid: string }) =>
      capture(AI_APPS_ANALYTICS.FEEDBACK_REPLY_SENT, params),
    onFeedbackReplyDeleted: (params: { appUid: string; feedbackUid: string }) =>
      capture(AI_APPS_ANALYTICS.FEEDBACK_REPLY_DELETED, params),
    onFeedbackPinDetached: (params: { appUid: string }) => capture(AI_APPS_ANALYTICS.FEEDBACK_PIN_DETACHED, params),
    onFeedbackPinCropFailed: (params: { appUid: string; error: string }) =>
      capture(AI_APPS_ANALYTICS.FEEDBACK_PIN_CROP_FAILED, params),
    onFeedbackBridgeUnavailable: (params: { appUid: string }) =>
      capture(AI_APPS_ANALYTICS.FEEDBACK_BRIDGE_UNAVAILABLE, params),
    /**
     * `reason` used to be `denied | unavailable`, which collapsed six distinct
     * causes into two and made the real distribution unknowable — the reason a
     * "users can't screenshot" report could not be diagnosed from the data.
     * The event name is unchanged so existing dashboards keep working; the new
     * values and `errorName` are additive.
     */
    onFeedbackScreenshotCaptureDenied: (params: {
      reason: 'denied' | 'unavailable' | 'unsupported' | 'blocked' | 'cancelled' | 'retry' | 'unreadable' | 'failed';
      errorName?: string;
    }) => capture(AI_APPS_ANALYTICS.FEEDBACK_SCREENSHOT_CAPTURE_DENIED, params),
    /**
     * A submission was refused for size before it reached the server.
     *
     * Worth its own event because the cap was just raised from 50k to 200k on
     * an estimate: this says whether 200k was enough, and `length` says by how
     * much when it was not.
     */
    onFeedbackTooLarge: (params: { length: number; screenshotCount: number }) =>
      capture(AI_APPS_ANALYTICS.FEEDBACK_TOO_LARGE, params),
    /** The upload fallback was used — how many people the capture path loses. */
    onFeedbackImageAttached: (params: { trigger: 'unsupported' | 'blocked' | 'unreadable' }) =>
      capture(AI_APPS_ANALYTICS.FEEDBACK_IMAGE_ATTACHED, params),
    onFeedbackScreenshotCaptureFailed: (params: { stage: 'request' | 'grab'; errorName?: string }) =>
      capture(AI_APPS_ANALYTICS.FEEDBACK_SCREENSHOT_CAPTURE_FAILED, params),
    onFeedbackScreenshotCaptureCancelled: () => capture(AI_APPS_ANALYTICS.FEEDBACK_SCREENSHOT_CAPTURE_CANCELLED),
    onFeedbackScreenshotRegionSelected: () => capture(AI_APPS_ANALYTICS.FEEDBACK_SCREENSHOT_REGION_SELECTED),
    onFeedbackScreenshotAdded: (params: { hasAnnotations: boolean }) =>
      capture(AI_APPS_ANALYTICS.FEEDBACK_SCREENSHOT_ADDED, params),
    onFeedbackScreenshotAnnotatorDiscarded: (params: { isEditing: boolean }) =>
      capture(AI_APPS_ANALYTICS.FEEDBACK_SCREENSHOT_ANNOTATOR_DISCARDED, params),
    onFeedbackScreenshotEditOpened: () => capture(AI_APPS_ANALYTICS.FEEDBACK_SCREENSHOT_EDIT_OPENED),
    onFeedbackScreenshotEditSaved: (params: { hasAnnotations: boolean }) =>
      capture(AI_APPS_ANALYTICS.FEEDBACK_SCREENSHOT_EDIT_SAVED, params),
    onFeedbackScreenshotRemoved: () => capture(AI_APPS_ANALYTICS.FEEDBACK_SCREENSHOT_REMOVED),
    onFeedbackScreenshotToolSelected: (params: { tool: 'draw' | 'comment' | 'rect' | 'ellipse' | 'arrow' }) =>
      capture(AI_APPS_ANALYTICS.FEEDBACK_SCREENSHOT_TOOL_SELECTED, params),
    onViewFeedbackClicked: (params: { feedbackCount: number }) =>
      capture(AI_APPS_ANALYTICS.VIEW_FEEDBACK_CLICKED, params),
    onSecretsPanelOpened: (params: { appUid: string; isDraft: boolean }) =>
      capture(AI_APPS_ANALYTICS.SECRETS_PANEL_OPENED, params),
    onSecretsDeployClicked: (params: {
      appUid: string;
      isDraft: boolean;
      environment: 'prod' | 'preview';
      varsRequiredCount: number;
      varsProvidedCount: number;
    }) => capture(AI_APPS_ANALYTICS.SECRETS_DEPLOY_CLICKED, params),
    onSecretsDeploySucceeded: (params: { appUid: string; isDraft: boolean; environment: 'prod' | 'preview' }) =>
      capture(AI_APPS_ANALYTICS.SECRETS_DEPLOY_SUCCEEDED, params),
    onSecretsDeployFailed: (params: { appUid: string; isDraft: boolean; environment: 'prod' | 'preview' }) =>
      capture(AI_APPS_ANALYTICS.SECRETS_DEPLOY_FAILED, params),
    onEnvironmentSelected: (params: {
      environment: 'prod' | 'preview';
      surface: 'detail' | 'deployment_settings' | 'logs' | 'access';
    }) => capture(AI_APPS_ANALYTICS.ENVIRONMENT_SELECTED, params),
    onTargetTeardownClicked: (params: { appUid: string; environment: 'prod' | 'preview' }) =>
      capture(AI_APPS_ANALYTICS.TARGET_TEARDOWN_CLICKED, params),
    onTargetTeardownConfirmed: (params: { appUid: string; environment: 'prod' | 'preview' }) =>
      capture(AI_APPS_ANALYTICS.TARGET_TEARDOWN_CONFIRMED, params),
    onTargetTeardownFailed: (params: { appUid: string; environment: 'prod' | 'preview' }) =>
      capture(AI_APPS_ANALYTICS.TARGET_TEARDOWN_FAILED, params),
    onDeployKeyCreated: (params: { appUid: string; environment: 'prod' | 'preview' }) =>
      capture(AI_APPS_ANALYTICS.DEPLOY_KEY_CREATED, params),
    onDeployKeyCreateFailed: (params: { appUid: string; environment: 'prod' | 'preview' }) =>
      capture(AI_APPS_ANALYTICS.DEPLOY_KEY_CREATE_FAILED, params),
    onDeployKeyCopied: (params: { appUid: string; environment: 'prod' | 'preview' }) =>
      capture(AI_APPS_ANALYTICS.DEPLOY_KEY_COPIED, params),
    onDeployKeyRevokeOpened: (params: { appUid: string; environment: 'prod' | 'preview' }) =>
      capture(AI_APPS_ANALYTICS.DEPLOY_KEY_REVOKE_OPENED, params),
    onDeployKeyRevokeCancelled: (params: { appUid: string; environment: 'prod' | 'preview' }) =>
      capture(AI_APPS_ANALYTICS.DEPLOY_KEY_REVOKE_CANCELLED, params),
    onDeployKeyRevoked: (params: { appUid: string; environment: 'prod' | 'preview' }) =>
      capture(AI_APPS_ANALYTICS.DEPLOY_KEY_REVOKED, params),
    onDeployKeyRevokeFailed: (params: { appUid: string; environment: 'prod' | 'preview' }) =>
      capture(AI_APPS_ANALYTICS.DEPLOY_KEY_REVOKE_FAILED, params),
    onDraftSetupViewed: (params: { appUid: string; appName: string }) =>
      capture(AI_APPS_ANALYTICS.DRAFT_SETUP_VIEWED, params),
    onManageMenuOpened: (appUid: string, appName: string) =>
      capture(AI_APPS_ANALYTICS.MANAGE_MENU_OPENED, { appUid, appName }),
    onEditDetailsOpened: (appUid: string, appName: string) =>
      capture(AI_APPS_ANALYTICS.EDIT_DETAILS_OPENED, { appUid, appName }),
    onEditDetailsSaved: (appUid: string, feedbackEnabled: boolean) =>
      capture(AI_APPS_ANALYTICS.EDIT_DETAILS_SAVED, { appUid, feedbackEnabled }),
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
      environment: 'prod' | 'preview';
      source: 'menu' | 'failure-strip' | 'detail-banner' | 'detail-error-card';
      variant?: 'warning' | 'danger' | 'legacy';
    }) => capture(AI_APPS_ANALYTICS.DEPLOYMENT_LOGS_OPENED, params),
    onDeploymentLogsTabSwitched: (appUid: string, stream: 'build' | 'runtime', environment: 'prod' | 'preview') =>
      capture(AI_APPS_ANALYTICS.DEPLOYMENT_LOGS_TAB_SWITCHED, { appUid, stream, environment }),
    onDeploymentLogsExported: (
      appUid: string,
      stream: 'build' | 'runtime',
      rowCount: number,
      environment: 'prod' | 'preview',
    ) => capture(AI_APPS_ANALYTICS.DEPLOYMENT_LOGS_EXPORTED, { appUid, stream, rowCount, environment }),
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
    onTagFilterSelected: (params: { tags: string[]; resultCount: number }) =>
      capture(AI_APPS_ANALYTICS.TAG_FILTER_SELECTED, params),
    onSortChanged: (params: { sort: string; source: 'masthead' | 'mobile'; resultCount: number }) =>
      capture(AI_APPS_ANALYTICS.SORT_CHANGED, params),
    onFiltersCleared: (params: { source: 'rail' | 'mobile' }) => capture(AI_APPS_ANALYTICS.FILTERS_CLEARED, params),
    onEmptyResultsShown: (params: { filterCount: number }) => capture(AI_APPS_ANALYTICS.EMPTY_RESULTS_SHOWN, params),
    onManageAccessOpened: (appUid: string) => capture(AI_APPS_ANALYTICS.MANAGE_ACCESS_OPENED, { appUid }),
    onAccessSaved: (params: {
      appUid: string;
      environment: 'prod' | 'preview';
      from: string;
      to: string;
      addedCount: number;
      removedCount: number;
      whitelistSize: number;
    }) => capture(AI_APPS_ANALYTICS.ACCESS_SAVED, params),
    onAccessSaveFailed: (appUid: string, environment: 'prod' | 'preview') =>
      capture(AI_APPS_ANALYTICS.ACCESS_SAVE_FAILED, { appUid, environment }),
    onPrivateBlocked: (appUid: string) => capture(AI_APPS_ANALYTICS.PRIVATE_BLOCKED, { appUid }),
    onAccessRedeployPrompted: (appUid: string) => capture(AI_APPS_ANALYTICS.ACCESS_REDEPLOY_PROMPTED, { appUid }),
    onAccessRedeployClicked: (appUid: string) => capture(AI_APPS_ANALYTICS.ACCESS_REDEPLOY_CLICKED, { appUid }),
    onAccessRedeployDismissed: (appUid: string) => capture(AI_APPS_ANALYTICS.ACCESS_REDEPLOY_DISMISSED, { appUid }),
    onPublicEndpointsSaved: (params: {
      appUid: string;
      pathCount: number;
      addedCount: number;
      removedCount: number;
      hasWildcard: boolean;
    }) => capture(AI_APPS_ANALYTICS.PUBLIC_ENDPOINTS_SAVED, params),
    onPublicEndpointsSaveFailed: (appUid: string) =>
      capture(AI_APPS_ANALYTICS.PUBLIC_ENDPOINTS_SAVE_FAILED, { appUid }),
    onPublicEndpointsRedeployClicked: (appUid: string) =>
      capture(AI_APPS_ANALYTICS.PUBLIC_ENDPOINTS_REDEPLOY_CLICKED, { appUid }),
  };
}
